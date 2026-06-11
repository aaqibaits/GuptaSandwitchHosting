import api from './api';

/**
 * Normalizes filter arguments so both camelCase and snake_case keys are supported.
 */
const buildParams = (filters = {}) => {
  return {
    params: {
      outlet_id: filters.outletId ?? filters.outlet_id,
      start_date: filters.startDate ?? filters.start_date,
      end_date: filters.endDate ?? filters.end_date,
      payment_method: filters.paymentMethod ?? filters.payment_method,
      order_type: filters.orderType ?? filters.order_type,
      order_status: filters.orderStatus ?? filters.order_status,
      limit: filters.limit
    }
  };
};

/**
 * 1. GET /api/reports/summary
 */
export const fetchSummaryReport = async (filters) => 
  api.get('/reports/summary', buildParams(filters)).then((res) => res.data);

/**
 * 2. GET /api/reports/order-analytics
 */
export const fetchOrderAnalyticsReport = async (filters) => 
  api.get('/reports/order-analytics', buildParams(filters)).then((res) => res.data);

/**
 * 3. GET /api/reports/order-types
 */
export const fetchOrderTypesReport = async (filters) => 
  api.get('/reports/order-types', buildParams(filters)).then((res) => res.data);

/**
 * 4. GET /api/reports/payment-analytics
 */
export const fetchPaymentAnalyticsReport = async (filters) => 
  api.get('/reports/payment-analytics', buildParams(filters)).then((res) => res.data);

/**
 * 5. GET /api/reports/hourly-sales
 */
export const fetchHourlySalesReport = async (filters) => 
  api.get('/reports/hourly-sales', buildParams(filters)).then((res) => res.data);

/**
 * 6. GET /api/reports/category-sales
 */
export const fetchCategorySalesReport = async (filters) => 
  api.get('/reports/category-sales', buildParams(filters)).then((res) => res.data);

/**
 * 7. GET /api/reports/top-items
 */
export const fetchTopItemsReport = async (filters) => 
  api.get('/reports/top-items', buildParams(filters)).then((res) => res.data);

/**
 * 8. GET /api/reports/kot-analytics
 */
export const fetchKotAnalyticsReport = async (filters) => 
  api.get('/reports/kot-analytics', buildParams(filters)).then((res) => res.data);

/**
 * 9. GET /api/reports/table-analytics
 */
export const fetchTableAnalyticsReport = async (filters) => 
  api.get('/reports/table-analytics', buildParams(filters)).then((res) => res.data);

/**
 * 10. GET /api/reports/customer-analytics
 */
export const fetchCustomerAnalyticsReport = async (filters) => 
  api.get('/reports/customer-analytics', buildParams(filters)).then((res) => res.data);

/**
 * 11. GET /api/reports/recent-orders
 */
export const fetchRecentOrdersReport = async (filters) => 
  api.get('/reports/recent-orders', buildParams(filters)).then((res) => res.data);
