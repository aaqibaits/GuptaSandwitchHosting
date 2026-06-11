const queries = require('./integrationcontrollersqlc');
const { pool } = queries;

// Swiggy Webhook Handler
exports.swiggyWebhook = async (req, res) => {
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    const payload = req.body;

    const outletIdent = payload.restaurant_id || payload.outlet_id;
    const platformOrderId = payload.order_id || `SW-${Date.now()}`;
    const customer = payload.customer || {
      name: "Swiggy Customer",
      phone: "0000000000",
      email: null,
      delivery_address: "Not Provided"
    };
    const cart = payload.cart || [];
    const subtotal = Number(payload.subtotal) || 0;
    const discount = Number(payload.discount) || 0;
    const totalAmount = Number(payload.total) || 0;
    const gstAmount = Number(payload.gst) || 0;

    await client.query('BEGIN');
    transactionStarted = true;

    // Resolve outlet
    const outletId = await queries.resolveOutlet(outletIdent, client);

    // Resolve cart items
    const lineItems = [];
    let calculatedSubtotal = 0;

    for (const item of cart) {
      let dish = await queries.findDishByName(item.dish_name || item.name, client);
      if (!dish) {
        dish = await queries.getFallbackDish(client);
      }
      if (!dish) {
        throw new Error("No dishes found in the database. Please add dishes first.");
      }

      const unitPrice = Number(dish.swiggy_price || dish.dine_price || 0);
      const quantity = Number(item.quantity || item.qty) || 1;
      const itemTotal = unitPrice * quantity;

      lineItems.push({
        dishId: dish.id,
        name: dish.name,
        quantity,
        unitPrice,
        totalPrice: itemTotal
      });

      calculatedSubtotal += itemTotal;
    }

    const finalSubtotal = subtotal || calculatedSubtotal;
    const finalTotal = totalAmount || (finalSubtotal - discount + gstAmount);

    const orderNumber = await queries.getNextOrderNumber(outletId, client);
    const kotNumber = await queries.getNextKotNumber(outletId, client);

    // Insert into orders table
    const order = await queries.insertOrder({
      orderNumber,
      outletId,
      orderType: 'swiggy',
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      deliveryAddress: customer.delivery_address,
      subtotal: finalSubtotal,
      discountAmount: discount,
      gstAmount,
      totalAmount: finalTotal,
      platformOrderId
    }, client);

    // Insert into order_items table
    const orderItems = [];
    for (const item of lineItems) {
      const insertedItem = await queries.insertOrderItem({
        orderId: order.id,
        dishId: item.dishId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }, client);
      orderItems.push({
        ...insertedItem,
        dishName: item.name
      });
    }

    // Insert into KOT table
    const kot = await queries.insertKot(kotNumber, order.id, outletId, 'swiggy', client);

    // Insert into KOT items table
    const kotItems = [];
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      const insertedKotItem = await queries.insertKotItem(kot.id, item.id, item.dishName, item.quantity, client);
      kotItems.push(insertedKotItem);
    }

    await client.query('COMMIT');
    transactionStarted = false;

    // Emit Socket.io event to outlet frontend room
    const io = req.app.get('io');
    if (io) {
      io.to(`outlet_${outletId}`).emit('NEW_PLATFORM_ORDER', {
        order: {
          id: order.id,
          orderNumber: order.order_number,
          orderType: 'swiggy',
          totalAmount: Number(order.total_amount),
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          deliveryAddress: order.delivery_address,
          orderTime: order.order_time,
          status: 'pending'
        },
        items: orderItems,
        kot: {
          id: kot.id,
          kotNumber: kot.kot_number,
          status: 'pending',
          items: kotItems
        }
      });
    }

    res.status(201).json({
      success: true,
      message: "Swiggy order webhook processed and KOT generated successfully",
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        kotNumber: kot.kot_number
      }
    });

  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    console.error("Swiggy Webhook Error:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// Zomato Webhook Handler
exports.zomatoWebhook = async (req, res) => {
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    const payload = req.body;

    const outletIdent = payload.res_id || payload.outlet_id;
    const details = payload.order_details || {};
    const customer = payload.customer_info || {
      name: "Zomato Customer",
      phone: "0000000000",
      address: "Not Provided"
    };

    const platformOrderId = details.zomato_order_id || `ZOM-${Date.now()}`;
    const cart = details.items || [];
    const totalAmount = Number(details.bill_amount) || 0;
    const discount = Number(details.discount_amount) || 0;
    const subtotal = Number(details.subtotal) || (totalAmount + discount);
    const gstAmount = Number(details.gst) || 0;

    await client.query('BEGIN');
    transactionStarted = true;

    // Resolve outlet
    const outletId = await queries.resolveOutlet(outletIdent, client);

    // Resolve cart items
    const lineItems = [];
    let calculatedSubtotal = 0;

    for (const item of cart) {
      let dish = await queries.findDishByName(item.item_name || item.name, client);
      if (!dish) {
        dish = await queries.getFallbackDish(client);
      }
      if (!dish) {
        throw new Error("No dishes found in the database. Please add dishes first.");
      }

      const unitPrice = Number(dish.zomato_price || dish.dine_price || 0);
      const quantity = Number(item.qty || item.quantity) || 1;
      const itemTotal = unitPrice * quantity;

      lineItems.push({
        dishId: dish.id,
        name: dish.name,
        quantity,
        unitPrice,
        totalPrice: itemTotal
      });

      calculatedSubtotal += itemTotal;
    }

    const finalSubtotal = subtotal || calculatedSubtotal;
    const finalTotal = totalAmount || (finalSubtotal - discount + gstAmount);

    const orderNumber = await queries.getNextOrderNumber(outletId, client);
    const kotNumber = await queries.getNextKotNumber(outletId, client);

    // Insert into orders table
    const order = await queries.insertOrder({
      orderNumber,
      outletId,
      orderType: 'zomato',
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: null,
      deliveryAddress: customer.address,
      subtotal: finalSubtotal,
      discountAmount: discount,
      gstAmount,
      totalAmount: finalTotal,
      platformOrderId
    }, client);

    // Insert into order_items table
    const orderItems = [];
    for (const item of lineItems) {
      const insertedItem = await queries.insertOrderItem({
        orderId: order.id,
        dishId: item.dishId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }, client);

      orderItems.push({
        ...insertedItem,
        dishName: item.name
      });
    }

    // Insert into KOT table
    const kot = await queries.insertKot(kotNumber, order.id, outletId, 'zomato', client);

    // Insert into KOT items table
    const kotItems = [];
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      const insertedKotItem = await queries.insertKotItem(kot.id, item.id, item.dishName, item.quantity, client);
      kotItems.push(insertedKotItem);
    }

    await client.query('COMMIT');
    transactionStarted = false;

    // Emit Socket.io event to outlet frontend room
    const io = req.app.get('io');
    if (io) {
      io.to(`outlet_${outletId}`).emit('NEW_PLATFORM_ORDER', {
        order: {
          id: order.id,
          orderNumber: order.order_number,
          orderType: 'zomato',
          totalAmount: Number(order.total_amount),
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          deliveryAddress: order.delivery_address,
          orderTime: order.order_time,
          status: 'pending'
        },
        items: orderItems,
        kot: {
          id: kot.id,
          kotNumber: kot.kot_number,
          status: 'pending',
          items: kotItems
        }
      });
    }

    res.status(201).json({
      success: true,
      message: "Zomato order webhook processed and KOT generated successfully",
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        kotNumber: kot.kot_number
      }
    });

  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    console.error("Zomato Webhook Error:", error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};
