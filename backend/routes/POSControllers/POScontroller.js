const Joi = require('joi');
const sql = require('./POSsqlc');
const { logActivity } = require('../../utils/auditLogger');

const VALID_ORDER_TYPES = ['dine', 'parcel'];
const VALID_PAYMENT_METHODS = ['cash', 'online', 'upi', 'card', 'wallet'];
const VALID_KOT_STATUSES = ['pending', 'preparing', 'ready', 'dispatched', 'cancelled'];
const VALID_KOT_STATUSES_DB = ['pending', 'preparing', 'ready', 'served', 'cancelled'];

const RATES = {
  dine: { serviceChargeRate: 0.1, gstRate: 0.05, packingCharge: 0, deliveryCharge: 0 },
  parcel: { serviceChargeRate: 0, gstRate: 0.18, packingCharge: 20, deliveryCharge: 30 }
};

const kotStatusToDb = (status) => (status === 'dispatched' ? 'served' : status);
const kotStatusFromDb = (status) => (status === 'served' ? 'dispatched' : status);

const parseOutletId = (req) => {
  const outletId = Number(
    req.query?.outletId ||
    req.body?.outletId ||
    req.headers?.['x-outlet-id'] ||
    (req.user && req.userType !== 'admin' ? req.user.outlet_id : null)
  );
  return Number.isInteger(outletId) && outletId > 0 ? outletId : null;
};

const roundMoney = (value) => Math.round(Number(value) * 100) / 100;

const mapDiscountType = (type) => {
  if (!type || type === 'pct' || type === 'percentage') return 'percentage';
  if (type === 'flat' || type === 'fixed') return 'fixed';
  return null;
};

const formatDish = (dish, orderType) => ({
  id: dish.id,
  uuid: dish.uuid,
  name: dish.name,
  categoryId: dish.category_id,
  categoryName: dish.category_name,
  cat: dish.cat,
  price: orderType === 'parcel' ? Number(dish.parcel_price) : Number(dish.dine_price),
  dinePrice: Number(dish.dine_price),
  parcelPrice: Number(dish.parcel_price),
  swiggyPrice: dish.swiggy_price != null ? Number(dish.swiggy_price) : null,
  zomatoPrice: dish.zomato_price != null ? Number(dish.zomato_price) : null,
  ingredients: dish.ingredients,
  emoji: dish.emoji,
  imageUrl: dish.image_url,
  veg: dish.veg,
  timeRequired: dish.time_required,
  isAvailable: dish.is_available
});

const formatKot = (kot) => ({
  id: kot.id,
  kotNumber: kot.kot_number,
  orderId: kot.order_id,
  outletId: kot.outlet_id,
  tableNumber: kot.table_number,
  orderType: kot.order_type,
  status: kotStatusFromDb(kot.status),
  isUrgent: kot.is_urgent,
  sentTime: kot.sent_time,
  readyTime: kot.ready_time,
  servedTime: kot.served_time,
  minutesElapsed: Math.floor(Number(kot.minutes_elapsed) || 0),
  orderNumber: kot.order_number,
  paymentMethod: kot.payment_method,
  orderStatus: kot.order_status,
  items: (kot.items || []).map((item) => ({
    id: item.id,
    orderItemId: item.order_item_id,
    dishName: item.dish_name,
    quantity: item.quantity,
    isReady: item.is_ready,
    readyTime: item.ready_time
  })),
  allItemsReady: Array.isArray(kot.items) && kot.items.length > 0 && kot.items.every((i) => i.is_ready)
});

const calculateOrderTotals = (orderType, lineItems, discount = {}) => {
  const subtotal = roundMoney(
    lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );

  const discountType = mapDiscountType(discount.type) || 'percentage';
  const discountValue = Number(discount.value) || 0;

  let discountAmount = 0;
  if (discountValue > 0) {
    if (discountType === 'percentage') {
      if (discountValue > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }
      discountAmount = roundMoney((subtotal * discountValue) / 100);
    } else {
      discountAmount = roundMoney(Math.min(discountValue, subtotal));
    }
  }

  const afterDiscount = roundMoney(subtotal - discountAmount);
  const totalAmount = afterDiscount;

  return {
    subtotal,
    discountType,
    discountValue,
    discountAmount,
    packingCharge: 0,
    deliveryCharge: 0,
    serviceCharge: 0,
    gstAmount: 0,
    totalAmount
  };
};

const resolveOutletId = async (requestedId) => {
  if (requestedId) {
    const outlet = await sql.outletExists(requestedId);
    if (outlet) {
      if (outlet.status !== 'active') {
        const error = new Error('Outlet is not active');
        error.statusCode = 403;
        throw error;
      }
      return outlet.id;
    }
  }

  const fallback = await sql.getFirstActiveOutlet();
  if (fallback) {
    return fallback.id;
  }

  const error = new Error(
    'No outlet found. Create an outlet in the database (outlets table) and set REACT_APP_DEFAULT_OUTLET_ID / outletId.'
  );
  error.statusCode = 404;
  throw error;
};

const joiOptions = {
  abortEarly: false,
  stripUnknown: true,
  convert: true
};

const orderItemSchema = Joi.object({
  dishId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(99).required(),
  specialInstructions: Joi.string().max(500).allow('', null).optional()
});

const createOrderSchema = Joi.object({
  outletId: Joi.number().integer().positive().allow(null).optional(),
  orderType: Joi.string().valid(...VALID_ORDER_TYPES).required(),
  // Table selection disabled — not used for now
  // tableNumber: Joi.when('orderType', {
  //   is: 'dine',
  //   then: Joi.string().trim().min(1).max(10).required(),
  //   otherwise: Joi.string().trim().max(10).allow(null, '').optional()
  // }),
  tableNumber: Joi.string().trim().max(10).allow(null, '').optional(),
  paymentMethod: Joi.string().valid(...VALID_PAYMENT_METHODS).required(),
  items: Joi.array().items(orderItemSchema).min(1).required(),
  discount: Joi.object({
    type: Joi.string().valid('pct', 'flat', 'percentage', 'fixed').default('percentage'),
    value: Joi.number().min(0).default(0)
  }).default({ type: 'percentage', value: 0 }),
  customerName: Joi.string().max(100).allow(null, '').optional(),
  customerPhone: Joi.string().max(20).allow(null, '').optional(),
  specialInstructions: Joi.string().max(1000).allow(null, '').optional(),
  isUrgent: Joi.boolean().default(false),
  createdBy: Joi.number().integer().positive().allow(null).optional()
}).options(joiOptions);

/** Normalize frontend cart shape (id/qty) → API shape (dishId/quantity) */
const normalizeOrderBody = (body = {}) => {
  const orderType = body.orderType || body.order_type;
  const items = (body.items || []).map((item) => ({
    dishId: Number(item.dishId ?? item.dish_id ?? item.id),
    quantity: Number(item.quantity ?? item.qty ?? 1),
    specialInstructions: item.specialInstructions ?? item.special_instructions ?? null
  }));

  const normalized = {
    outletId: body.outletId ?? body.outlet_id ?? null,
    orderType,
    // tableNumber: body.tableNumber ?? body.table_number ?? null,
    tableNumber: null,
    paymentMethod: body.paymentMethod ?? body.payment_method,
    items,
    discount: body.discount || { type: 'percentage', value: 0 },
    customerName: body.customerName ?? body.customer_name,
    customerPhone: body.customerPhone ?? body.customer_phone,
    specialInstructions: body.specialInstructions ?? body.special_instructions,
    isUrgent: body.isUrgent ?? body.is_urgent ?? false,
    createdBy: body.createdBy ?? body.created_by ?? null
  };

  if (normalized.outletId != null) {
    normalized.outletId = Number(normalized.outletId);
    if (!Number.isInteger(normalized.outletId) || normalized.outletId <= 0) {
      normalized.outletId = null;
    }
  }

  return normalized;
};

const mapKotItemsForFormat = (items) =>
  items.map((item) => ({
    id: item.id,
    order_item_id: item.order_item_id,
    dish_name: item.dish_name,
    quantity: item.quantity,
    is_ready: item.is_ready,
    ready_time: item.ready_time
  }));

const syncKotStatusFromItems = async (kotId, client) => {
  const notReady = await sql.countKotItemsNotReady(kotId, client);
  const kot = await sql.getKotById(kotId, null, client);

  if (!kot || kot.status === 'cancelled' || kot.status === 'served') {
    return kot;
  }

  if (notReady === 0) {
    const updated = await sql.updateKotStatus(kotId, 'ready', client);
    await sql.updateOrderStatus(kot.order_id, 'ready', client);
    return updated;
  }

  if (kot.status === 'pending') {
    const updated = await sql.updateKotStatus(kotId, 'preparing', client);
    await sql.updateOrderStatus(kot.order_id, 'preparing', client);
    return updated;
  }

  return kot;
};

const VALID_STATUS_TRANSITIONS = {
  pending: ['preparing', 'ready', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: [],
  cancelled: []
};

const assertKotStatusTransition = (currentStatus, newStatus) => {
  const current = kotStatusToDb(currentStatus);
  const next = kotStatusToDb(newStatus);
  const allowed = VALID_STATUS_TRANSITIONS[current] || [];

  if (!allowed.includes(next)) {
    const error = new Error(`Cannot change KOT status from ${kotStatusFromDb(current)} to ${newStatus}`);
    error.statusCode = 400;
    throw error;
  }
};

// ─── Menu handlers ───────────────────────────────────────────────────────────

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await sql.getAllCategories();
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

exports.getDishes = async (req, res, next) => {
  try {
    const outletId = await resolveOutletId(parseOutletId(req));
    const filters = {
      availableOnly: req.query.available === 'true',
      categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
      search: req.query.q || req.query.search,
      vegOnly: req.query.veg === 'true'
    };

    const orderType = req.query.orderType === 'parcel' ? 'parcel' : 'dine';
    const dishes = await sql.getAllDishes(outletId, filters);
    const data = dishes.map((d) => formatDish(d, orderType));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

exports.getDishesByCategory = async (req, res, next) => {
  try {
    const categoryId = Number(req.params.categoryId);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const outletId = await resolveOutletId(parseOutletId(req));
    const orderType = req.query.orderType === 'parcel' ? 'parcel' : 'dine';
    const dishes = await sql.getAllDishes(outletId, {
      categoryId,
      availableOnly: req.query.available === 'true'
    });

    res.status(200).json({
      success: true,
      count: dishes.length,
      data: dishes.map((d) => formatDish(d, orderType))
    });
  } catch (error) {
    next(error);
  }
};

exports.searchDishes = async (req, res, next) => {
  try {
    const search = (req.query.q || req.query.search || '').trim();
    if (!search) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const outletId = await resolveOutletId(parseOutletId(req));
    const orderType = req.query.orderType === 'parcel' ? 'parcel' : 'dine';
    const dishes = await sql.getAllDishes(outletId, {
      search,
      availableOnly: req.query.available === 'true'
    });

    res.status(200).json({
      success: true,
      count: dishes.length,
      data: dishes.map((d) => formatDish(d, orderType))
    });
  } catch (error) {
    next(error);
  }
};

exports.getAvailableDishes = async (req, res, next) => {
  try {
    const outletId = await resolveOutletId(parseOutletId(req));
    const orderType = req.query.orderType === 'parcel' ? 'parcel' : 'dine';
    const dishes = await sql.getAllDishes(outletId, { availableOnly: true });
    res.status(200).json({
      success: true,
      count: dishes.length,
      data: dishes.map((d) => formatDish(d, orderType))
    });
  } catch (error) {
    next(error);
  }
};

// ─── Order creation ──────────────────────────────────────────────────────────

exports.createOrder = async (req, res, next) => {
  const client = await sql.pool.connect();
  let transactionStarted = false;

  try {
    const normalizedBody = normalizeOrderBody(req.body);
    const { error, value } = createOrderSchema.validate(normalizedBody, joiOptions);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message)
      });
    }

    const invalidItem = value.items.find(
      (item) => !Number.isInteger(item.dishId) || item.dishId <= 0
    );
    if (invalidItem) {
      return res.status(400).json({
        success: false,
        message: 'Each order item must have a valid dishId'
      });
    }

    let outletId = parseOutletId(req) || value.outletId;
    outletId = await resolveOutletId(outletId);

    // Table logic disabled — always store null until table management is enabled
    // if (value.orderType === 'parcel' && value.tableNumber) {
    //   value.tableNumber = null;
    // }
    value.tableNumber = null;

    const dishIds = value.items.map((i) => i.dishId);
    const dishes = await sql.getDishesByIds(dishIds, outletId, client);
    const dishMap = new Map(dishes.map((d) => [d.id, d]));

    const lineItems = [];
    for (const item of value.items) {
      const dish = dishMap.get(item.dishId);
      if (!dish) {
        return res.status(400).json({
          success: false,
          message: `Invalid dish ID: ${item.dishId}`
        });
      }
      if (!dish.is_available) {
        return res.status(400).json({
          success: false,
          message: `Dish "${dish.name}" is not available`
        });
      }

      const unitPrice =
        value.orderType === 'parcel'
          ? Number(dish.unit_price_parcel)
          : Number(dish.unit_price_dine);

      lineItems.push({
        dishId: dish.id,
        dishName: dish.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice: roundMoney(unitPrice * item.quantity),
        specialInstructions: item.specialInstructions
      });
    }

    let totals;
    try {
      totals = calculateOrderTotals(value.orderType, lineItems, value.discount);
    } catch (calcError) {
      return res.status(400).json({ success: false, message: calcError.message });
    }

    if (req.body.expectedTotal != null) {
      const expected = Number(req.body.expectedTotal);
      if (Math.abs(expected - totals.totalAmount) > 0.02) {
        return res.status(400).json({
          success: false,
          message: 'Order total mismatch. Please refresh and try again.',
          calculatedTotal: totals.totalAmount
        });
      }
    }

    await client.query('BEGIN');
    transactionStarted = true;

    let orderNumber = await sql.getNextOrderNumber(outletId, client);
    while (await sql.orderNumberExists(orderNumber, client)) {
      orderNumber = `${orderNumber}-R`;
    }

    let kotNumber = await sql.getNextKotNumber(outletId, client);
    while (await sql.kotNumberExists(kotNumber, client)) {
      kotNumber = `${kotNumber}-R`;
    }

    const order = await sql.insertOrder(
      {
        orderNumber,
        outletId,
        orderType: value.orderType,
        tableNumber: null, // value.tableNumber — table disabled
        customerName: value.customerName,
        customerPhone: value.customerPhone,
        specialInstructions: value.specialInstructions,
        ...totals,
        paymentMethod: value.paymentMethod,
        paymentStatus: 'paid',
        orderStatus: 'preparing',
        createdBy: value.createdBy
      },
      client
    );

    const orderItems = [];
    for (const item of lineItems) {
      const orderItem = await sql.insertOrderItem(
        {
          orderId: order.id,
          dishId: item.dishId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          specialInstructions: item.specialInstructions
        },
        client
      );
      orderItems.push(orderItem);
    }

    const kot = await sql.insertKot(
      {
        kotNumber,
        orderId: order.id,
        outletId,
        tableNumber: null, // value.tableNumber — table disabled
        orderType: value.orderType,
        status: 'pending',
        isUrgent: value.isUrgent,
        createdBy: value.createdBy
      },
      client
    );

    const kotItems = [];
    for (let i = 0; i < orderItems.length; i += 1) {
      const kotItem = await sql.insertKotItem(
        {
          kotId: kot.id,
          orderItemId: orderItems[i].id,
          dishName: lineItems[i].dishName,
          quantity: lineItems[i].quantity
        },
        client
      );
      kotItems.push(kotItem);
    }

    await client.query('COMMIT');

    logActivity({
      req,
      action: 'ORDER_CREATE',
      entityType: 'order',
      entityId: order.id,
      newValues: {
        order_number: order.order_number,
        order_type: order.order_type,
        total_amount: order.total_amount,
        items: orderItems.map(item => ({
          dish_id: item.dish_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }))
      }
    });

    res.status(201).json({
      success: true,
      message: 'Order created and KOT generated successfully',
      data: {
        order: {
          id: order.id,
          uuid: order.uuid,
          orderNumber: order.order_number,
          orderType: order.order_type,
          tableNumber: order.table_number,
          paymentMethod: order.payment_method,
          paymentStatus: order.payment_status,
          orderStatus: order.order_status,
          ...totals,
          totalAmount: Number(order.total_amount),
          orderTime: order.order_time
        },
        items: orderItems,
        kot: {
          id: kot.id,
          kotNumber: kot.kot_number,
          status: kotStatusFromDb(kot.status),
          items: kotItems
        }
      }
    });
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    next(error);
  } finally {
    client.release();
  }
};

// ─── KOT handlers ────────────────────────────────────────────────────────────

exports.getAllKots = async (req, res, next) => {
  try {
    const outletId = await resolveOutletId(parseOutletId(req));

    const kots = await sql.getKots(outletId, { activeOnly: req.query.active !== 'false' });
    const filteredKots = kots.filter(kot => {
      if ((kot.order_type === 'swiggy' || kot.order_type === 'zomato') && kot.order_status === 'pending') {
        return false;
      }
      return true;
    });
    res.status(200).json({
      success: true,
      count: filteredKots.length,
      data: filteredKots.map(formatKot)
    });
  } catch (error) {
    next(error);
  }
};

exports.getPendingKots = async (req, res, next) => {
  try {
    const outletId = await resolveOutletId(parseOutletId(req));

    const kots = await sql.getKots(outletId, { pendingOnly: true });
    const filteredKots = kots.filter(kot => {
      if ((kot.order_type === 'swiggy' || kot.order_type === 'zomato') && kot.order_status === 'pending') {
        return false;
      }
      return true;
    });
    res.status(200).json({ success: true, count: filteredKots.length, data: filteredKots.map(formatKot) });
  } catch (error) {
    next(error);
  }
};

exports.getReadyKots = async (req, res, next) => {
  try {
    const outletId = await resolveOutletId(parseOutletId(req));

    const kots = await sql.getKots(outletId, { readyOnly: true });
    const filteredKots = kots.filter(kot => {
      if ((kot.order_type === 'swiggy' || kot.order_type === 'zomato') && kot.order_status === 'pending') {
        return false;
      }
      return true;
    });
    res.status(200).json({ success: true, count: filteredKots.length, data: filteredKots.map(formatKot) });
  } catch (error) {
    next(error);
  }
};

exports.markItemReady = async (req, res, next) => {
  const client = await sql.pool.connect();

  try {
    const kotId = Number(req.params.kotId);
    const kotItemId = Number(req.params.itemId);
    const isReady = req.body.isReady !== false;

    const kot = await sql.getKotById(kotId, null, client);
    if (!kot) {
      return res.status(404).json({ success: false, message: 'KOT not found' });
    }
    if (kot.status === 'cancelled' || kot.status === 'served') {
      return res.status(400).json({
        success: false,
        message: `Cannot update items on a ${kotStatusFromDb(kot.status)} KOT`
      });
    }

    const kotItem = await sql.getKotItemById(kotItemId, kotId, client);
    if (!kotItem) {
      return res.status(404).json({ success: false, message: 'KOT item not found' });
    }

    await client.query('BEGIN');
    const updatedItem = await sql.markKotItemReady(kotItemId, isReady, client);
    await sql.markOrderItemReady(kotItem.order_item_id, isReady, client);
    const updatedKot = await syncKotStatusFromItems(kotId, client);
    await client.query('COMMIT');

    const kotItems = await sql.getKotItems(kotId);

    const io = req.app.get('io');
    if (io && updatedKot) {
      io.to(`outlet_${kot.outlet_id}`).emit('KOT_STATUS_UPDATE', {
        orderId: kot.order_id,
        kotId: kotId,
        status: updatedKot.status,
        items: mapKotItemsForFormat(kotItems)
      });
    }

    res.status(200).json({
      success: true,
      message: isReady ? 'Item marked as ready' : 'Item marked as pending',
      data: {
        item: updatedItem,
        kot: updatedKot ? formatKot({ ...updatedKot, items: mapKotItemsForFormat(kotItems) }) : null
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

exports.markAllItemsReady = async (req, res, next) => {
  const client = await sql.pool.connect();

  try {
    const kotId = Number(req.params.kotId);

    const kot = await sql.getKotById(kotId, null, client);
    if (!kot) {
      return res.status(404).json({ success: false, message: 'KOT not found' });
    }
    if (kot.status === 'cancelled' || kot.status === 'served') {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${kotStatusFromDb(kot.status)} KOT`
      });
    }

    await client.query('BEGIN');
    await sql.markAllKotItemsReady(kotId, client);
    const updatedKot = await sql.updateKotStatus(kotId, 'ready', client);
    await sql.updateOrderStatus(kot.order_id, 'ready', client);
    await client.query('COMMIT');

    const items = mapKotItemsForFormat(await sql.getKotItems(kotId));

    const io = req.app.get('io');
    if (io && updatedKot) {
      io.to(`outlet_${kot.outlet_id}`).emit('KOT_STATUS_UPDATE', {
        orderId: kot.order_id,
        kotId: kotId,
        status: updatedKot.status,
        items
      });
    }

    res.status(200).json({
      success: true,
      message: 'All items marked as ready',
      data: formatKot({ ...updatedKot, items })
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

exports.dispatchOrder = async (req, res, next) => {
  const client = await sql.pool.connect();

  try {
    const kotId = Number(req.params.kotId);

    const kot = await sql.getKotById(kotId, null, client);
    if (!kot) {
      return res.status(404).json({ success: false, message: 'KOT not found' });
    }

    // If KOT is already served (meaning it was dispatched from KOT screen),
    // we complete the order.
    if (kot.status === 'served') {
      await client.query('BEGIN');
      await sql.updateOrderStatus(kot.order_id, 'completed', client);
      await client.query('COMMIT');

      const items = mapKotItemsForFormat(await sql.getKotItems(kotId));
      const io = req.app.get('io');
      if (io) {
        io.to(`outlet_${kot.outlet_id}`).emit('KOT_STATUS_UPDATE', {
          orderId: kot.order_id,
          kotId: kotId,
          status: kot.status,
          orderStatus: 'completed',
          items
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Order completed successfully',
        data: formatKot({ ...kot, items })
      });
    }

    const notReady = await sql.countKotItemsNotReady(kotId, client);
    if (notReady > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot dispatch — not all items are ready'
      });
    }

    if (kot.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'KOT must be in ready status before dispatch'
      });
    }

    await client.query('BEGIN');
    assertKotStatusTransition(kot.status, 'dispatched');
    const updatedKot = await sql.updateKotStatus(kotId, 'served', client);
    await sql.updateOrderStatus(kot.order_id, 'ready', client);
    await client.query('COMMIT');

    const items = mapKotItemsForFormat(await sql.getKotItems(kotId));

    const io = req.app.get('io');
    if (io && updatedKot) {
      io.to(`outlet_${kot.outlet_id}`).emit('KOT_STATUS_UPDATE', {
        orderId: kot.order_id,
        kotId: kotId,
        status: updatedKot.status,
        orderStatus: 'ready',
        items
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order dispatched successfully',
      data: formatKot({ ...updatedKot, items })
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

exports.cancelOrder = async (req, res, next) => {
  const client = await sql.pool.connect();

  try {
    const orderId = Number(req.params.orderId);
    const outletId = await resolveOutletId(parseOutletId(req));

    const order = await sql.getOrderById(orderId, outletId, client);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.order_status === 'completed' || order.order_status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order with status: ${order.order_status}`
      });
    }

    await client.query('BEGIN');
    const cancelled = await sql.cancelOrder(orderId, outletId, client);
    await sql.cancelKotsByOrderId(orderId, client);
    await client.query('COMMIT');

    const io = req.app.get('io');
    if (io) {
      io.to(`outlet_${outletId}`).emit('KOT_STATUS_UPDATE', {
        orderId: orderId,
        status: 'cancelled'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order and associated KOTs cancelled',
      data: cancelled
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

exports.updateKotStatus = async (req, res, next) => {
  const client = await sql.pool.connect();

  try {
    const kotId = Number(req.params.kotId);
    const { status, isUrgent, is_urgent } = req.body;
    const urgency = isUrgent !== undefined ? isUrgent : is_urgent;
    let orderStatus = undefined;

    if (status === undefined && urgency === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Either status or isUrgent/is_urgent must be provided'
      });
    }

    const kot = await sql.getKotById(kotId, null, client);
    if (!kot) {
      return res.status(404).json({ success: false, message: 'KOT not found' });
    }

    await client.query('BEGIN');
    let updatedKot = kot;

    if (status !== undefined) {
      if (!VALID_KOT_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${VALID_KOT_STATUSES.join(', ')}`
        });
      }

      const dbStatus = kotStatusToDb(status);
      if (!VALID_KOT_STATUSES_DB.includes(dbStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid status for database' });
      }

      assertKotStatusTransition(kot.status, status);

      if (dbStatus === 'ready') {
        const notReady = await sql.countKotItemsNotReady(kotId, client);
        if (notReady > 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot set ready — some items are not ready yet'
          });
        }
      }

      updatedKot = await sql.updateKotStatus(kotId, dbStatus, client);

      if (dbStatus === 'served') {
        await sql.updateOrderStatus(kot.order_id, 'completed', client);
        orderStatus = 'completed';
      } else if (dbStatus === 'cancelled') {
        await sql.cancelOrder(kot.order_id, kot.outlet_id, client);
        orderStatus = 'cancelled';
      } else if (dbStatus === 'preparing') {
        await sql.updateOrderStatus(kot.order_id, 'preparing', client);
        orderStatus = 'preparing';
      } else if (dbStatus === 'ready') {
        await sql.updateOrderStatus(kot.order_id, 'ready', client);
        orderStatus = 'ready';
      }
    }

    if (urgency !== undefined) {
      const urgencyResult = await client.query(
        `UPDATE kot SET is_urgent = $2 WHERE id = $1 RETURNING *`,
        [kotId, Boolean(urgency)]
      );
      updatedKot = urgencyResult.rows[0] || updatedKot;
    }

    await client.query('COMMIT');

    const io = req.app.get('io');
    if (io && updatedKot) {
      io.to(`outlet_${kot.outlet_id}`).emit('KOT_STATUS_UPDATE', {
        orderId: kot.order_id,
        kotId: kotId,
        status: updatedKot.status,
        orderStatus: orderStatus,
        items: mapKotItemsForFormat(await sql.getKotItems(kotId))
      });
    }

    res.status(200).json({
      success: true,
      message: 'KOT updated',
      data: formatKot({ ...updatedKot, items: mapKotItemsForFormat(await sql.getKotItems(kotId)) })
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

exports.getDashboardStats = async (req, res, next) => {
  try {
    const outletId = await resolveOutletId(parseOutletId(req));

    const stats = await sql.getDashboardStats(outletId);
    res.status(200).json({
      success: true,
      data: {
        activeOrdersCount: stats.active_orders_count,
        occupiedTablesCount: stats.occupied_tables_count,
        todayTotalSales: Number(stats.today_total_sales),
        todayTotalOrders: stats.today_total_orders,
        activeKotCount: stats.active_kot_count
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    const outletId = await resolveOutletId(parseOutletId(req));

    const order = await sql.getOrderById(orderId, outletId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
