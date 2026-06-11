const sql = require('./outletReportsSqlc');

/**
 * Parses numeric strings into floats safely with 2 decimal places.
 */
const parseToNumber = (val) => {
  if (val === null || val === undefined) return 0;
  return Math.round(Number(val) * 100) / 100;
};

/**
 * Builds dynamically parameterized WHERE clause based on request and logged-in user constraints.
 */
const buildReportFilters = (req, tableAlias = 'o', options = {}) => {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // 1. Multi-Outlet Tenancy enforcement
  let outletId = null;
  if (req.user && req.user.outlet_id) {
    // regular user belongs to a specific outlet -> force restriction
    outletId = req.user.outlet_id;
  } else {
    // admin user or un-locked account -> allow filtering by outlet_id query param
    const queryOutletId = Number(req.query.outlet_id || req.query.outletId);
    if (Number.isInteger(queryOutletId) && queryOutletId > 0) {
      outletId = queryOutletId;
    }
  }

  if (outletId) {
    conditions.push(`${tableAlias}.outlet_id = $${paramIndex}`);
    params.push(outletId);
    paramIndex += 1;
  }

  // 2. Start Date Filter (defaults to inclusive from 00:00:00)
  const startDate = req.query.start_date || req.query.startDate;
  if (startDate) {
    const timeCol = tableAlias === 'k' ? 'sent_time' : 'order_time';
    const formatted = startDate.length === 10 ? `${startDate} 00:00:00` : startDate;
    conditions.push(`${tableAlias}.${timeCol} >= $${paramIndex}`);
    params.push(formatted);
    paramIndex += 1;
  }

  // 3. End Date Filter (defaults to inclusive until 23:59:59)
  const endDate = req.query.end_date || req.query.endDate;
  if (endDate) {
    const timeCol = tableAlias === 'k' ? 'sent_time' : 'order_time';
    const formatted = endDate.length === 10 ? `${endDate} 23:59:59` : endDate;
    conditions.push(`${tableAlias}.${timeCol} <= $${paramIndex}`);
    params.push(formatted);
    paramIndex += 1;
  }

  // 4. Payment Method Filter
  const paymentMethod = req.query.payment_method || req.query.paymentMethod;
  if (paymentMethod) {
    const targetAlias = tableAlias === 'k' ? 'o' : tableAlias;
    conditions.push(`${targetAlias}.payment_method = $${paramIndex}::payment_method_enum`);
    params.push(paymentMethod);
    paramIndex += 1;
  }

  // 5. Order Type Filter
  const orderType = req.query.order_type || req.query.orderType;
  if (orderType) {
    conditions.push(`${tableAlias}.order_type = $${paramIndex}::order_type_enum`);
    params.push(orderType);
    paramIndex += 1;
  }

  // 6. Order Status Filter
  const orderStatus = req.query.order_status || req.query.orderStatus;
  if (orderStatus) {
    const targetAlias = tableAlias === 'k' ? 'o' : tableAlias;
    conditions.push(`${targetAlias}.order_status = $${paramIndex}::order_status_enum`);
    params.push(orderStatus);
    paramIndex += 1;
  } else if (options.excludeCancelled !== false) {
    // By default, exclude cancelled orders from financial aggregations if not explicitly asked
    const targetAlias = tableAlias === 'k' ? 'o' : tableAlias;
    conditions.push(`${targetAlias}.order_status != 'cancelled'::order_status_enum`);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
};

/**
 * 1. GET /api/reports/summary
 */
exports.getSummary = async (req, res, next) => {
  try {
    const { whereClause, params } = buildReportFilters(req, 'o', { excludeCancelled: true });
    const summary = await sql.getSummary(whereClause, params);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: parseToNumber(summary.total_revenue),
        grossSales: parseToNumber(summary.gross_sales),
        netSales: parseToNumber(summary.net_sales),
        totalOrders: Number(summary.total_orders || 0),
        averageOrderValue: parseToNumber(summary.average_order_value),
        gstCollection: parseToNumber(summary.gst_collection),
        totalDiscounts: parseToNumber(summary.total_discounts),
        deliveryCharges: parseToNumber(summary.delivery_charges),
        packingCharges: parseToNumber(summary.packing_charges),
        serviceCharges: parseToNumber(summary.service_charges)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/reports/order-analytics
 */
exports.getOrderAnalytics = async (req, res, next) => {
  try {
    // Note: Do not exclude cancelled orders for status analysis
    const { whereClause, params } = buildReportFilters(req, 'o', { excludeCancelled: false });
    const stats = await sql.getOrderAnalytics(whereClause, params);

    res.status(200).json({
      success: true,
      data: {
        pendingOrders: Number(stats.pending_orders || 0),
        preparingOrders: Number(stats.preparing_orders || 0),
        readyOrders: Number(stats.ready_orders || 0),
        completedOrders: Number(stats.completed_orders || 0),
        cancelledOrders: Number(stats.cancelled_orders || 0),
        totalOrders: Number(stats.total_orders || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET /api/reports/order-types
 */
exports.getOrderTypes = async (req, res, next) => {
  try {
    const { whereClause, params } = buildReportFilters(req, 'o', { excludeCancelled: true });
    const types = await sql.getOrderTypes(whereClause, params);

    res.status(200).json({
      success: true,
      data: {
        dineInOrders: Number(types.dine_in_orders || 0),
        parcelOrders: Number(types.parcel_orders || 0),
        swiggyOrders: Number(types.swiggy_orders || 0),
        zomatoOrders: Number(types.zomato_orders || 0),
        totalOrders: Number(types.total_orders || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET /api/reports/payment-analytics
 */
exports.getPaymentAnalytics = async (req, res, next) => {
  try {
    const { whereClause, params } = buildReportFilters(req, 'o', { excludeCancelled: true });
    const pay = await sql.getPaymentAnalytics(whereClause, params);

    res.status(200).json({
      success: true,
      data: {
        cash: {
          ordersCount: Number(pay.cash_orders || 0),
          revenue: parseToNumber(pay.cash_revenue)
        },
        upi: {
          ordersCount: Number(pay.upi_orders || 0),
          revenue: parseToNumber(pay.upi_revenue)
        },
        card: {
          ordersCount: Number(pay.card_orders || 0),
          revenue: parseToNumber(pay.card_revenue)
        },
        wallet: {
          ordersCount: Number(pay.wallet_orders || 0),
          revenue: parseToNumber(pay.wallet_revenue)
        },
        online: {
          ordersCount: Number(pay.online_orders || 0),
          revenue: parseToNumber(pay.online_revenue)
        },
        swiggy: {
          ordersCount: Number(pay.swiggy_orders || 0),
          revenue: parseToNumber(pay.swiggy_revenue)
        },
        zomato: {
          ordersCount: Number(pay.zomato_orders || 0),
          revenue: parseToNumber(pay.zomato_revenue)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. GET /api/reports/hourly-sales
 */
exports.getHourlySales = async (req, res, next) => {
  try {
    const { whereClause, params } = buildReportFilters(req, 'o', { excludeCancelled: true });
    const rows = await sql.getHourlySales(whereClause, params);

    const hourlySales = rows.map((r) => ({
      hour: Number(r.hour),
      hourFormatted: r.hour_formatted,
      ordersCount: Number(r.order_count || 0),
      revenue: parseToNumber(r.revenue)
    }));

    res.status(200).json({
      success: true,
      count: hourlySales.length,
      data: hourlySales
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. GET /api/reports/category-sales
 */
exports.getCategorySales = async (req, res, next) => {
  try {
    const { whereClause, params } = buildReportFilters(req, 'o', { excludeCancelled: true });
    const rows = await sql.getCategorySales(whereClause, params);

    const categorySales = rows.map((r) => ({
      categoryId: r.category_id,
      categoryName: r.category_name,
      quantitySold: Number(r.quantity_sold || 0),
      revenue: parseToNumber(r.revenue)
    }));

    res.status(200).json({
      success: true,
      count: categorySales.length,
      data: categorySales
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. GET /api/reports/top-items
 */
exports.getTopItems = async (req, res, next) => {
  try {
    const { whereClause, params } = buildReportFilters(req, 'o', { excludeCancelled: true });
    const limit = Number(req.query.limit) || 10;

    const topSellingRaw = await sql.getItemSales(whereClause, params, 'DESC', limit);
    const leastSellingRaw = await sql.getItemSales(whereClause, params, 'ASC', limit);

    const formatItem = (item) => ({
      dishId: item.dish_id,
      dishName: item.dish_name,
      dishEmoji: item.dish_emoji,
      quantitySold: Number(item.quantity_sold || 0),
      revenue: parseToNumber(item.revenue)
    });

    res.status(200).json({
      success: true,
      data: {
        topSelling: topSellingRaw.map(formatItem),
        leastSelling: leastSellingRaw.map(formatItem)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. GET /api/reports/kot-analytics
 */
exports.getKotAnalytics = async (req, res, next) => {
  try {
    // Note: Do not exclude cancelled orders/kots for KOT status analysis
    const { whereClause, params } = buildReportFilters(req, 'k', { excludeCancelled: false });
    const stats = await sql.getKotAnalytics(whereClause, params);

    res.status(200).json({
      success: true,
      data: {
        pendingKOT: Number(stats.pending_kots || 0),
        preparingKOT: Number(stats.preparing_kots || 0),
        readyKOT: Number(stats.ready_kots || 0),
        servedKOT: Number(stats.served_kots || 0),
        cancelledKOT: Number(stats.cancelled_kots || 0),
        totalKOT: Number(stats.total_kots || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. GET /api/reports/table-analytics
 */
exports.getTableAnalytics = async (req, res, next) => {
  try {
    const { whereClause, params } = buildReportFilters(req, 'o', { excludeCancelled: true });
    const rows = await sql.getTableAnalytics(whereClause, params);

    const tableAnalytics = rows.map((r) => ({
      tableNumber: r.table_number,
      ordersCount: Number(r.order_count || 0),
      revenue: parseToNumber(r.revenue)
    }));

    res.status(200).json({
      success: true,
      count: tableAnalytics.length,
      data: tableAnalytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. GET /api/reports/customer-analytics
 */
exports.getCustomerAnalytics = async (req, res, next) => {
  try {
    const { whereClause, params } = buildReportFilters(req, 'o', { excludeCancelled: true });
    const limit = Number(req.query.limit) || 10;

    const repeatCustomersCount = await sql.getRepeatCustomersCount(whereClause, params);
    const topCustomersRaw = await sql.getTopCustomers(whereClause, params, limit);

    const topCustomers = topCustomersRaw.map((cust) => ({
      customerName: cust.customer_name,
      customerPhone: cust.customer_phone,
      customerEmail: cust.customer_email,
      orderCount: Number(cust.order_count || 0),
      totalSpend: parseToNumber(cust.total_spend)
    }));

    res.status(200).json({
      success: true,
      data: {
        repeatCustomers: repeatCustomersCount,
        topCustomers
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 11. GET /api/reports/recent-orders
 */
exports.getRecentOrders = async (req, res, next) => {
  try {
    const { whereClause, params } = buildReportFilters(req, 'o', { excludeCancelled: false });
    const limit = Number(req.query.limit) || 10;
    const rows = await sql.getRecentOrders(whereClause, params, limit);

    const recentOrders = rows.map((r) => ({
      orderNumber: r.order_number,
      tableNumber: r.table_number,
      totalAmount: parseToNumber(r.total_amount),
      paymentMethod: r.payment_method,
      paymentStatus: r.payment_status,
      orderStatus: r.order_status,
      orderTime: r.order_time,
      orderType: r.order_type,
      outletId: r.outlet_id,
      outletName: r.outlet_name,
      itemsSold: Number(r.items_sold || 0)
    }));

    res.status(200).json({
      success: true,
      count: recentOrders.length,
      data: recentOrders
    });
  } catch (error) {
    next(error);
  }
};
