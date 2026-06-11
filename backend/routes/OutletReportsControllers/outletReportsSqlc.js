const { pool } = require('../../config/database');

/**
 * Summary reports query
 */
const getSummary = async (whereClause, params) => {
  const query = `
    SELECT
      COALESCE(SUM(total_amount), 0)::numeric AS total_revenue,
      COALESCE(SUM(subtotal), 0)::numeric AS gross_sales,
      COALESCE(SUM(subtotal - discount_amount), 0)::numeric AS net_sales,
      COUNT(id)::int AS total_orders,
      COALESCE(AVG(total_amount), 0)::numeric AS average_order_value,
      COALESCE(SUM(gst_amount), 0)::numeric AS gst_collection,
      COALESCE(SUM(discount_amount), 0)::numeric AS total_discounts,
      COALESCE(SUM(delivery_charge), 0)::numeric AS delivery_charges,
      COALESCE(SUM(packing_charge), 0)::numeric AS packing_charges,
      COALESCE(SUM(service_charge), 0)::numeric AS service_charges
    FROM orders o
    ${whereClause}
  `;
  const { rows } = await pool.query(query, params);
  return rows[0];
};

/**
 * Order Status Analytics query
 */
const getOrderAnalytics = async (whereClause, params) => {
  const query = `
    SELECT
      COUNT(CASE WHEN order_status = 'pending' THEN 1 END)::int AS pending_orders,
      COUNT(CASE WHEN order_status = 'preparing' THEN 1 END)::int AS preparing_orders,
      COUNT(CASE WHEN order_status = 'ready' THEN 1 END)::int AS ready_orders,
      COUNT(CASE WHEN order_status = 'completed' THEN 1 END)::int AS completed_orders,
      COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END)::int AS cancelled_orders,
      COUNT(*)::int AS total_orders
    FROM orders o
    ${whereClause}
  `;
  const { rows } = await pool.query(query, params);
  return rows[0];
};

/**
 * Order Type Analytics query
 */
const getOrderTypes = async (whereClause, params) => {
  const query = `
    SELECT
      COUNT(CASE WHEN order_type = 'dine' THEN 1 END)::int AS dine_in_orders,
      COUNT(CASE WHEN order_type = 'parcel' THEN 1 END)::int AS parcel_orders,
      COUNT(CASE WHEN order_type = 'swiggy' THEN 1 END)::int AS swiggy_orders,
      COUNT(CASE WHEN order_type = 'zomato' THEN 1 END)::int AS zomato_orders,
      COUNT(*)::int AS total_orders
    FROM orders o
    ${whereClause}
  `;
  const { rows } = await pool.query(query, params);
  return rows[0];
};

/**
 * Payment Method Analytics query
 */
const getPaymentAnalytics = async (whereClause, params) => {
  const query = `
    SELECT
      COUNT(CASE WHEN payment_method = 'cash' THEN 1 END)::int AS cash_orders,
      COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0)::numeric AS cash_revenue,
      
      COUNT(CASE WHEN payment_method != 'cash' AND order_type NOT IN ('swiggy', 'zomato') THEN 1 END)::int AS online_orders,
      COALESCE(SUM(CASE WHEN payment_method != 'cash' AND order_type NOT IN ('swiggy', 'zomato') THEN total_amount ELSE 0 END), 0)::numeric AS online_revenue,
      
      COUNT(CASE WHEN order_type = 'swiggy' THEN 1 END)::int AS swiggy_orders,
      COALESCE(SUM(CASE WHEN order_type = 'swiggy' THEN total_amount ELSE 0 END), 0)::numeric AS swiggy_revenue,
      
      COUNT(CASE WHEN order_type = 'zomato' THEN 1 END)::int AS zomato_orders,
      COALESCE(SUM(CASE WHEN order_type = 'zomato' THEN total_amount ELSE 0 END), 0)::numeric AS zomato_revenue
    FROM orders o
    ${whereClause}
  `;
  const { rows } = await pool.query(query, params);
  return rows[0];
};

/**
 * Hourly Sales and Order counts query
 */
const getHourlySales = async (whereClause, params) => {
  const query = `
    SELECT
      EXTRACT(HOUR FROM order_time)::int AS hour,
      TO_CHAR(order_time, 'HH24:00') AS hour_formatted,
      COUNT(id)::int AS order_count,
      COALESCE(SUM(total_amount), 0)::numeric AS revenue
    FROM orders o
    ${whereClause}
    GROUP BY EXTRACT(HOUR FROM order_time), TO_CHAR(order_time, 'HH24:00')
    ORDER BY hour ASC
  `;
  const { rows } = await pool.query(query, params);
  return rows;
};

/**
 * Category-wise Sales query
 */
const getCategorySales = async (whereClause, params) => {
  const query = `
    SELECT
      c.id AS category_id,
      c.name AS category_name,
      COALESCE(SUM(oi.quantity), 0)::int AS quantity_sold,
      COALESCE(SUM(oi.total_price), 0)::numeric AS revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN dishes d ON oi.dish_id = d.id
    JOIN categories c ON d.category_id = c.id
    ${whereClause}
    GROUP BY c.id, c.name
    ORDER BY revenue DESC
  `;
  const { rows } = await pool.query(query, params);
  return rows;
};

/**
 * Item Sales list sorted by quantity sold
 */
const getItemSales = async (whereClause, params, sortOrder = 'DESC', limit = 10) => {
  const query = `
    SELECT
      d.id AS dish_id,
      d.name AS dish_name,
      d.emoji AS dish_emoji,
      SUM(oi.quantity)::int AS quantity_sold,
      SUM(oi.total_price)::numeric AS revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN dishes d ON oi.dish_id = d.id
    ${whereClause}
    GROUP BY d.id, d.name, d.emoji
    ORDER BY quantity_sold ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}, revenue ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}
    LIMIT $${params.length + 1}
  `;
  const { rows } = await pool.query(query, [...params, limit]);
  return rows;
};

/**
 * KOT Status Analytics query
 */
const getKotAnalytics = async (whereClause, params) => {
  const query = `
    SELECT
      COUNT(CASE WHEN k.status = 'pending' THEN 1 END)::int AS pending_kots,
      COUNT(CASE WHEN k.status = 'preparing' THEN 1 END)::int AS preparing_kots,
      COUNT(CASE WHEN k.status = 'ready' THEN 1 END)::int AS ready_kots,
      COUNT(CASE WHEN k.status = 'served' THEN 1 END)::int AS served_kots,
      COUNT(CASE WHEN k.status = 'cancelled' THEN 1 END)::int AS cancelled_kots,
      COUNT(*)::int AS total_kots
    FROM kot k
    JOIN orders o ON k.order_id = o.id
    ${whereClause}
  `;
  const { rows } = await pool.query(query, params);
  return rows[0];
};

/**
 * Table-wise Sales query
 */
const getTableAnalytics = async (whereClause, params) => {
  const query = `
    SELECT
      o.table_number,
      COUNT(o.id)::int AS order_count,
      COALESCE(SUM(o.total_amount), 0)::numeric AS revenue
    FROM orders o
    ${whereClause} ${whereClause ? 'AND' : 'WHERE'} o.table_number IS NOT NULL AND o.table_number != ''
    GROUP BY o.table_number
    ORDER BY order_count DESC, revenue DESC
  `;
  const { rows } = await pool.query(query, params);
  return rows;
};

/**
 * Count unique repeat customers (>1 order)
 */
const getRepeatCustomersCount = async (whereClause, params) => {
  const query = `
    SELECT COUNT(*)::int AS count
    FROM (
      SELECT o.customer_phone
      FROM orders o
      ${whereClause} ${whereClause ? 'AND' : 'WHERE'} o.customer_phone IS NOT NULL AND o.customer_phone != ''
      GROUP BY o.customer_phone
      HAVING COUNT(o.id) > 1
    ) sub
  `;
  const { rows } = await pool.query(query, params);
  return rows[0]?.count || 0;
};

/**
 * Top customers by total spend
 */
const getTopCustomers = async (whereClause, params, limit = 10) => {
  const query = `
    SELECT
      COALESCE(o.customer_name, 'Guest') AS customer_name,
      o.customer_phone,
      COALESCE(o.customer_email, '') AS customer_email,
      COUNT(o.id)::int AS order_count,
      SUM(o.total_amount)::numeric AS total_spend
    FROM orders o
    ${whereClause} ${whereClause ? 'AND' : 'WHERE'} o.customer_phone IS NOT NULL AND o.customer_phone != ''
    GROUP BY o.customer_name, o.customer_phone, o.customer_email
    ORDER BY total_spend DESC
    LIMIT $${params.length + 1}
  `;
  const { rows } = await pool.query(query, [...params, limit]);
  return rows;
};

/**
 * Recent orders logger
 */
const getRecentOrders = async (whereClause, params, limit = 10) => {
  const query = `
    SELECT
      o.order_number,
      o.table_number,
      o.total_amount::numeric AS total_amount,
      o.payment_method,
      o.payment_status,
      o.order_status,
      o.order_time,
      o.order_type,
      o.outlet_id,
      out.name AS outlet_name,
      (SELECT COALESCE(SUM(quantity), 0)::int FROM order_items oi WHERE oi.order_id = o.id) AS items_sold
    FROM orders o
    LEFT JOIN outlets out ON o.outlet_id = out.id
    ${whereClause}
    ORDER BY o.order_time DESC
    LIMIT $${params.length + 1}
  `;
  const { rows } = await pool.query(query, [...params, limit]);
  return rows;
};

module.exports = {
  getSummary,
  getOrderAnalytics,
  getOrderTypes,
  getPaymentAnalytics,
  getHourlySales,
  getCategorySales,
  getItemSales,
  getKotAnalytics,
  getTableAnalytics,
  getRepeatCustomersCount,
  getTopCustomers,
  getRecentOrders
};
