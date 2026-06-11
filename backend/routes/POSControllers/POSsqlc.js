const { pool } = require('../../config/database');

const getClient = (client) => client || pool;

// ─── Menu & Categories ───────────────────────────────────────────────────────

const getAllCategories = async (client) => {
  const { rows } = await getClient(client).query(
    `SELECT id, uuid, name, description, display_order, is_active, created_at, updated_at
     FROM categories
     WHERE is_active = true
     ORDER BY display_order ASC, name ASC`
  );
  return rows;
};

const getAllDishes = async (outletId, filters = {}, client) => {
  const conditions = ['d.id IS NOT NULL'];
  const params = [];
  let paramIndex = 1;

  if (outletId) {
    params.push(outletId);
    paramIndex += 1;
  }

  if (filters.availableOnly) {
    conditions.push('d.is_available = true');
    if (outletId) {
      conditions.push(`COALESCE(dout.is_available, true) = true`);
    }
  }

  if (filters.categoryId) {
    conditions.push(`d.category_id = $${paramIndex}`);
    params.push(filters.categoryId);
    paramIndex += 1;
  }

  if (filters.search) {
    conditions.push(`(
      d.name ILIKE $${paramIndex}
      OR c.name ILIKE $${paramIndex}
      OR d.cat ILIKE $${paramIndex}
    )`);
    params.push(`%${filters.search}%`);
    paramIndex += 1;
  }

  if (filters.vegOnly === true) {
    conditions.push('d.veg = true');
  }

  const outletJoin = outletId
    ? `INNER JOIN dish_outlets dout ON dout.dish_id = d.id AND dout.outlet_id = $1`
    : '';

  const priceSelect = outletId
    ? `COALESCE(dout.custom_price_dine, d.dine_price) AS dine_price,
       COALESCE(dout.custom_price_parcel, d.parcel_price) AS parcel_price,
       COALESCE(dout.custom_price_swiggy, d.swiggy_price) AS swiggy_price,
       COALESCE(dout.custom_price_zomato, d.zomato_price) AS zomato_price,
       COALESCE(dout.is_available, d.is_available) AS is_available`
    : `d.dine_price, d.parcel_price, d.swiggy_price, d.zomato_price, d.is_available`;

  const { rows } = await getClient(client).query(
    `SELECT
       d.id, d.uuid, d.name, d.category_id, d.cat, ${priceSelect},
       d.ingredients, d.emoji, d.image_url, d.veg, d.time_required, d.created_at, d.updated_at,
       c.name AS category_name, c.display_order AS category_display_order
     FROM dishes d
     LEFT JOIN categories c ON c.id = d.category_id
     ${outletJoin}
     WHERE ${conditions.join(' AND ')}
     ORDER BY c.display_order NULLS LAST, c.name, d.name`,
    params
  );
  return rows;
};

const getDishesByIds = async (dishIds, outletId, client) => {
  if (!dishIds.length) return [];

  const outletJoin = outletId
    ? `INNER JOIN dish_outlets dout ON dout.dish_id = d.id AND dout.outlet_id = $2`
    : '';

  const priceSelect = outletId
    ? `COALESCE(dout.custom_price_dine, d.dine_price) AS unit_price_dine,
       COALESCE(dout.custom_price_parcel, d.parcel_price) AS unit_price_parcel,
       COALESCE(dout.is_available, d.is_available) AS is_available`
    : `d.dine_price AS unit_price_dine,
       d.parcel_price AS unit_price_parcel,
       d.is_available`;

  const params = [dishIds];
  if (outletId) params.push(outletId);

  const { rows } = await getClient(client).query(
    `SELECT d.id, d.name, d.emoji, d.image_url, d.veg, ${priceSelect}
     FROM dishes d
     ${outletJoin}
     WHERE d.id = ANY($1::int[])`,
    params
  );
  return rows;
};

// ─── Order number generation ─────────────────────────────────────────────────

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

const kotNumberExists = async (kotNumber, client) => {
  const { rows } = await getClient(client).query(
    `SELECT 1 FROM kot WHERE kot_number = $1 LIMIT 1`,
    [kotNumber]
  );
  return rows.length > 0;
};

const orderNumberExists = async (orderNumber, client) => {
  const { rows } = await getClient(client).query(
    `SELECT 1 FROM orders WHERE order_number = $1 LIMIT 1`,
    [orderNumber]
  );
  return rows.length > 0;
};

// ─── Orders ──────────────────────────────────────────────────────────────────

const insertOrder = async (orderData, client) => {
  const {
    orderNumber,
    outletId,
    orderType,
    tableNumber,
    customerName,
    customerPhone,
    specialInstructions,
    subtotal,
    discountType,
    discountValue,
    discountAmount,
    packingCharge,
    deliveryCharge,
    serviceCharge,
    gstAmount,
    totalAmount,
    paymentMethod,
    paymentStatus,
    orderStatus,
    createdBy
  } = orderData;

  const { rows } = await getClient(client).query(
    `INSERT INTO orders (
       order_number, outlet_id, order_type, table_number,
       customer_name, customer_phone, special_instructions,
       subtotal, discount_type, discount_value, discount_amount,
       packing_charge, delivery_charge, service_charge, gst_amount, total_amount,
       payment_method, payment_status, order_status,
       payment_time, created_by, kot_sent, kot_sent_time, order_time
     ) VALUES (
       $1, $2, $3::order_type_enum, $4,
       $5, $6, $7,
       $8, $9::discount_type_enum, $10, $11,
       $12, $13, $14, $15, $16,
       $17::payment_method_enum, $18::payment_status_enum, $19::order_status_enum,
       CASE WHEN $18 = 'paid' THEN CURRENT_TIMESTAMP ELSE NULL END,
       $20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
     )
     RETURNING *`,
    [
      orderNumber,
      outletId,
      orderType,
      tableNumber || null,
      customerName || null,
      customerPhone || null,
      specialInstructions || null,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      packingCharge,
      deliveryCharge,
      serviceCharge,
      gstAmount,
      totalAmount,
      paymentMethod,
      paymentStatus,
      orderStatus,
      createdBy || null
    ]
  );
  return rows[0];
};

const insertOrderItem = async (itemData, client) => {
  const { orderId, dishId, quantity, unitPrice, totalPrice, specialInstructions } = itemData;
  const { rows } = await getClient(client).query(
    `INSERT INTO order_items (order_id, dish_id, quantity, unit_price, total_price, special_instructions)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [orderId, dishId, quantity, unitPrice, totalPrice, specialInstructions || null]
  );
  return rows[0];
};

// ─── KOT ─────────────────────────────────────────────────────────────────────

const insertKot = async (kotData, client) => {
  const {
    kotNumber,
    orderId,
    outletId,
    tableNumber,
    orderType,
    status,
    isUrgent,
    createdBy
  } = kotData;

  const { rows } = await getClient(client).query(
    `INSERT INTO kot (
       kot_number, order_id, outlet_id, table_number, order_type,
       status, is_urgent, created_by, sent_time
     ) VALUES (
       $1, $2, $3, $4, $5::order_type_enum,
       $6::kot_status_enum, $7, $8, CURRENT_TIMESTAMP
     )
     RETURNING *`,
    [
      kotNumber,
      orderId,
      outletId,
      tableNumber || null,
      orderType,
      status || 'pending',
      isUrgent || false,
      createdBy || null
    ]
  );
  return rows[0];
};

const insertKotItem = async (kotItemData, client) => {
  const { kotId, orderItemId, dishName, quantity } = kotItemData;
  const { rows } = await getClient(client).query(
    `INSERT INTO kot_items (kot_id, order_item_id, dish_name, quantity)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [kotId, orderItemId, dishName, quantity]
  );
  return rows[0];
};

const getKots = async (outletId, filters = {}, client) => {
  const conditions = ['k.outlet_id = $1'];
  const params = [outletId];
  let paramIndex = 2;

  if (filters.status) {
    const dbStatus = filters.status === 'dispatched' ? 'served' : filters.status;
    conditions.push(`k.status = $${paramIndex}::kot_status_enum`);
    params.push(dbStatus);
    paramIndex += 1;
  } else if (filters.activeOnly) {
    conditions.push(`k.status NOT IN ('served', 'cancelled')`);
  } else if (filters.pendingOnly) {
    conditions.push(`k.status IN ('pending', 'preparing')`);
  } else if (filters.readyOnly) {
    conditions.push(`k.status = 'ready'`);
  }

  const { rows } = await getClient(client).query(
    `SELECT
       k.id, k.kot_number, k.order_id, k.outlet_id, k.table_number, k.order_type,
       k.status, k.is_urgent, k.sent_time, k.ready_time, k.served_time, k.created_by,
       o.order_number, o.payment_method, o.order_status,
       EXTRACT(EPOCH FROM (NOW() - k.sent_time)) / 60 AS minutes_elapsed,
       COALESCE(
         json_agg(
           json_build_object(
             'id', ki.id,
             'order_item_id', ki.order_item_id,
             'dish_name', ki.dish_name,
             'quantity', ki.quantity,
             'is_ready', ki.is_ready,
             'ready_time', ki.ready_time
           ) ORDER BY ki.id
         ) FILTER (WHERE ki.id IS NOT NULL),
         '[]'
       ) AS items
     FROM kot k
     JOIN orders o ON o.id = k.order_id
     LEFT JOIN kot_items ki ON ki.kot_id = k.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY k.id, o.order_number, o.payment_method, o.order_status
     ORDER BY k.is_urgent DESC, k.sent_time ASC`,
    params
  );
  return rows;
};

const getKotById = async (kotId, outletId, client) => {
  if (outletId) {
    const { rows } = await getClient(client).query(
      `SELECT k.*, o.order_number, o.order_status
       FROM kot k
       JOIN orders o ON o.id = k.order_id
       WHERE k.id = $1 AND k.outlet_id = $2`,
      [kotId, outletId]
    );
    return rows[0] || null;
  }

  const { rows } = await getClient(client).query(
    `SELECT k.*, o.order_number, o.order_status
     FROM kot k
     JOIN orders o ON o.id = k.order_id
     WHERE k.id = $1`,
    [kotId]
  );
  return rows[0] || null;
};

const getKotItems = async (kotId, client) => {
  const { rows } = await getClient(client).query(
    `SELECT ki.*, oi.dish_id, oi.is_ready AS order_item_ready
     FROM kot_items ki
     JOIN order_items oi ON oi.id = ki.order_item_id
     WHERE ki.kot_id = $1
     ORDER BY ki.id`,
    [kotId]
  );
  return rows;
};

const getKotItemById = async (kotItemId, kotId, client) => {
  const { rows } = await getClient(client).query(
    `SELECT ki.*, k.status AS kot_status, k.outlet_id
     FROM kot_items ki
     JOIN kot k ON k.id = ki.kot_id
     WHERE ki.id = $1 AND ki.kot_id = $2`,
    [kotItemId, kotId]
  );
  return rows[0] || null;
};

const markKotItemReady = async (kotItemId, isReady, client) => {
  const { rows } = await getClient(client).query(
    `UPDATE kot_items
     SET is_ready = $2,
         ready_time = CASE WHEN $2 = true THEN CURRENT_TIMESTAMP ELSE NULL END
     WHERE id = $1
     RETURNING *`,
    [kotItemId, isReady]
  );
  return rows[0] || null;
};

const markOrderItemReady = async (orderItemId, isReady, client) => {
  await getClient(client).query(
    `UPDATE order_items
     SET is_ready = $2,
         ready_time = CASE WHEN $2 = true THEN CURRENT_TIMESTAMP ELSE NULL END
     WHERE id = $1`,
    [orderItemId, isReady]
  );
};

const countKotItemsNotReady = async (kotId, client) => {
  const { rows } = await getClient(client).query(
    `SELECT COUNT(*)::int AS count
     FROM kot_items
     WHERE kot_id = $1 AND is_ready = false`,
    [kotId]
  );
  return rows[0]?.count || 0;
};

const updateKotStatus = async (kotId, status, client) => {
  const { rows } = await getClient(client).query(
    `UPDATE kot
     SET status = $2::kot_status_enum,
         ready_time = CASE WHEN $2::text = 'ready' THEN CURRENT_TIMESTAMP ELSE ready_time END,
         served_time = CASE WHEN $2::text = 'served' THEN CURRENT_TIMESTAMP ELSE served_time END
     WHERE id = $1
     RETURNING *`,
    [kotId, status]
  );
  return rows[0] || null;
};

const markAllKotItemsReady = async (kotId, client) => {
  await getClient(client).query(
    `UPDATE kot_items
     SET is_ready = true, ready_time = CURRENT_TIMESTAMP
     WHERE kot_id = $1`,
    [kotId]
  );
  const items = await getKotItems(kotId, client);
  for (const item of items) {
    await markOrderItemReady(item.order_item_id, true, client);
  }
};

const cancelOrder = async (orderId, outletId, client) => {
  const { rows } = await getClient(client).query(
    `UPDATE orders
     SET order_status = 'cancelled'::order_status_enum,
         completed_time = CURRENT_TIMESTAMP
     WHERE id = $1 AND outlet_id = $2 AND order_status NOT IN ('completed', 'cancelled')
     RETURNING *`,
    [orderId, outletId]
  );
  return rows[0] || null;
};

const cancelKotsByOrderId = async (orderId, client) => {
  await getClient(client).query(
    `UPDATE kot
     SET status = 'cancelled'::kot_status_enum
     WHERE order_id = $1 AND status NOT IN ('served', 'cancelled')`,
    [orderId]
  );
};

const updateOrderStatus = async (orderId, status, client) => {
  const { rows } = await getClient(client).query(
    `UPDATE orders
     SET order_status = $2::order_status_enum,
         completed_time = CASE WHEN $2::text IN ('completed', 'cancelled') THEN CURRENT_TIMESTAMP ELSE completed_time END
     WHERE id = $1
     RETURNING *`,
    [orderId, status]
  );
  return rows[0] || null;
};

const getOrderById = async (orderId, outletId, client) => {
  const { rows } = await getClient(client).query(
    `SELECT o.*,
       COALESCE(
         json_agg(
           json_build_object(
             'id', oi.id,
             'dish_id', oi.dish_id,
             'quantity', oi.quantity,
             'unit_price', oi.unit_price,
             'total_price', oi.total_price,
             'special_instructions', oi.special_instructions,
             'is_ready', oi.is_ready,
             'dish_name', d.name,
             'emoji', d.emoji
           ) ORDER BY oi.id
         ) FILTER (WHERE oi.id IS NOT NULL),
         '[]'
       ) AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN dishes d ON d.id = oi.dish_id
     WHERE o.id = $1 AND o.outlet_id = $2
     GROUP BY o.id`,
    [orderId, outletId]
  );
  return rows[0] || null;
};

// ─── Dashboard stats ─────────────────────────────────────────────────────────

const getDashboardStats = async (outletId, client) => {
  const { rows } = await getClient(client).query(
    `SELECT
       (SELECT COUNT(*)::int FROM orders
        WHERE outlet_id = $1
          AND order_status IN ('pending', 'preparing', 'ready')) AS active_orders_count,
       -- Table tracking disabled for now
       0 AS occupied_tables_count,
       -- (SELECT COUNT(DISTINCT table_number)::int FROM orders
       --  WHERE outlet_id = $1
       --    AND order_type = 'dine'
       --    AND table_number IS NOT NULL
       --    AND order_status IN ('pending', 'preparing', 'ready')) AS occupied_tables_count,
       (SELECT COALESCE(SUM(total_amount), 0)::numeric FROM orders
        WHERE outlet_id = $1
          AND DATE(order_time) = CURRENT_DATE
          AND order_status NOT IN ('cancelled')) AS today_total_sales,
       (SELECT COUNT(*)::int FROM orders
        WHERE outlet_id = $1
          AND DATE(order_time) = CURRENT_DATE
          AND order_status NOT IN ('cancelled')) AS today_total_orders,
       (SELECT COUNT(*)::int FROM kot
        WHERE outlet_id = $1
          AND status NOT IN ('served', 'cancelled')) AS active_kot_count`,
    [outletId]
  );
  return rows[0];
};

const outletExists = async (outletId, client) => {
  const { rows } = await getClient(client).query(
    `SELECT id, name, status FROM outlets WHERE id = $1`,
    [outletId]
  );
  return rows[0] || null;
};

const getFirstActiveOutlet = async (client) => {
  const { rows } = await getClient(client).query(
    `SELECT id, name, status FROM outlets WHERE status = 'active' ORDER BY id ASC LIMIT 1`
  );
  return rows[0] || null;
};

const listOutlets = async (client) => {
  const { rows } = await getClient(client).query(
    `SELECT id, name, status FROM outlets ORDER BY id ASC`
  );
  return rows;
};

module.exports = {
  pool,
  getAllCategories,
  getAllDishes,
  getDishesByIds,
  getNextOrderNumber,
  getNextKotNumber,
  kotNumberExists,
  orderNumberExists,
  insertOrder,
  insertOrderItem,
  insertKot,
  insertKotItem,
  getKots,
  getKotById,
  getKotItems,
  getKotItemById,
  markKotItemReady,
  markOrderItemReady,
  countKotItemsNotReady,
  updateKotStatus,
  markAllKotItemsReady,
  cancelOrder,
  cancelKotsByOrderId,
  updateOrderStatus,
  getOrderById,
  getDashboardStats,
  outletExists,
  getFirstActiveOutlet,
  listOutlets
};
