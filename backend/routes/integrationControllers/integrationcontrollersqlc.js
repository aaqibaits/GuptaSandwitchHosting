const { pool } = require('../../config/database');

const getClient = (client) => client || pool;

// Resolve the outlet ID based on name, ID, or integration IDs (Swiggy/Zomato), falling back to first active outlet
const resolveOutlet = async (outletIdent, client) => {
  const db = getClient(client);
  
  // 1. Check if it's a valid internal outlet ID
  if (Number.isInteger(Number(outletIdent)) && Number(outletIdent) > 0) {
    const { rows } = await db.query(`SELECT id FROM outlets WHERE id = $1`, [Number(outletIdent)]);
    if (rows[0]) return rows[0].id;
  }
  
  // 2. Check if it matches swiggy_id or zomato_id in outlet_integrations
  if (outletIdent) {
    const { rows } = await db.query(
      `SELECT outlet_id FROM outlet_integrations 
       WHERE swiggy_id = $1 OR zomato_id = $1 LIMIT 1`,
      [String(outletIdent).trim()]
    );
    if (rows[0]) return rows[0].outlet_id;
  }

  // 3. Check if it matches the name of an outlet
  if (outletIdent) {
    const { rows } = await db.query(`SELECT id FROM outlets WHERE name ILIKE $1 LIMIT 1`, [String(outletIdent).trim()]);
    if (rows[0]) return rows[0].id;
  }

  // Fallback to first active outlet
  const fallback = await db.query(`SELECT id FROM outlets WHERE status = 'active' ORDER BY id ASC LIMIT 1`);
  return fallback.rows[0]?.id || 1;
};

// Find dish ID by name (case-insensitive)
const findDishByName = async (name, client) => {
  const { rows } = await getClient(client).query(
    `SELECT id, name, swiggy_price, zomato_price, dine_price 
     FROM dishes 
     WHERE name ILIKE $1 LIMIT 1`,
    [String(name).trim()]
  );
  return rows[0] || null;
};

// Get a fallback dish if the item name doesn't match
const getFallbackDish = async (client) => {
  const { rows } = await getClient(client).query(`SELECT id, name, swiggy_price, zomato_price, dine_price FROM dishes ORDER BY id ASC LIMIT 1`);
  return rows[0] || null;
};

// Generate standard next order number
const getNextOrderNumber = async (outletId, client) => {
  const { rows } = await getClient(client).query(
    `SELECT COUNT(*)::int AS cnt
     FROM orders
     WHERE outlet_id = $1 AND DATE(order_time) = CURRENT_DATE`,
    [outletId]
  );
  const seq = (rows[0]?.cnt || 0) + 1;
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `ORD-${outletId}-${datePart}-${String(seq).padStart(4, '0')}`;
};

// Generate standard next KOT number
const getNextKotNumber = async (outletId, client) => {
  const { rows } = await getClient(client).query(
    `SELECT COUNT(*)::int AS cnt
     FROM kot
     WHERE outlet_id = $1 AND DATE(sent_time) = CURRENT_DATE`,
    [outletId]
  );
  const seq = (rows[0]?.cnt || 0) + 1;
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `KOT-${outletId}-${datePart}-${String(seq).padStart(4, '0')}`;
};

// Insert new order record
const insertOrder = async (orderData, client) => {
  const {
    orderNumber,
    outletId,
    orderType,
    customerName,
    customerPhone,
    customerEmail,
    deliveryAddress,
    subtotal,
    discountAmount,
    gstAmount,
    totalAmount,
    platformOrderId
  } = orderData;

  const { rows } = await getClient(client).query(
    `INSERT INTO orders (
       order_number, outlet_id, order_type, customer_name, customer_phone, customer_email, delivery_address,
       subtotal, discount_amount, gst_amount, total_amount, payment_method, payment_status, order_status, platform_order_id,
       order_time, completed_time
     ) VALUES ($1, $2, $3::public.order_type_enum, $4, $5, $6, $7, $8, $9, $10, $11, 'online'::public.payment_method_enum, 'paid'::public.payment_status_enum, 'pending'::public.order_status_enum, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [
      orderNumber,
      outletId,
      orderType,
      customerName,
      customerPhone,
      customerEmail || null,
      deliveryAddress,
      subtotal,
      discountAmount,
      gstAmount,
      totalAmount,
      platformOrderId
    ]
  );
  return rows[0];
};

// Insert new order item record
const insertOrderItem = async (itemData, client) => {
  const { orderId, dishId, quantity, unitPrice, totalPrice } = itemData;
  const { rows } = await getClient(client).query(
    `INSERT INTO order_items (order_id, dish_id, quantity, unit_price, total_price)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [orderId, dishId, quantity, unitPrice, totalPrice]
  );
  return rows[0];
};

// Insert new KOT record
const insertKot = async (kotNumber, orderId, outletId, orderType, client) => {
  const { rows } = await getClient(client).query(
    `INSERT INTO kot (kot_number, order_id, outlet_id, order_type, status, sent_time)
     VALUES ($1, $2, $3, $4::public.order_type_enum, 'pending'::public.kot_status_enum, CURRENT_TIMESTAMP)
     RETURNING *`,
    [kotNumber, orderId, outletId, orderType]
  );
  return rows[0];
};

// Insert new KOT item record
const insertKotItem = async (kotId, orderItemId, dishName, quantity, client) => {
  const { rows } = await getClient(client).query(
    `INSERT INTO kot_items (kot_id, order_item_id, dish_name, quantity)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [kotId, orderItemId, dishName, quantity]
  );
  return rows[0];
};

module.exports = {
  pool,
  resolveOutlet,
  findDishByName,
  getFallbackDish,
  getNextOrderNumber,
  getNextKotNumber,
  insertOrder,
  insertOrderItem,
  insertKot,
  insertKotItem
};
