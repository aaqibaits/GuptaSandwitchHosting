/**
 * services/reportApi.ts
 * ─────────────────────
 * Maps to backend: /api/reports  (all require valid JWT)
 *
 * Routes:
 *   GET /api/reports/summary            → getSummary()
 *   GET /api/reports/order-analytics    → getOrderAnalytics()
 *   GET /api/reports/order-types        → getOrderTypes()
 *   GET /api/reports/payment-analytics  → getPaymentAnalytics()
 *   GET /api/reports/hourly-sales       → getHourlySales()
 *   GET /api/reports/category-sales     → getCategorySales()
 *   GET /api/reports/top-items          → getTopItems()
 *   GET /api/reports/kot-analytics      → getKotAnalytics()
 *   GET /api/reports/table-analytics    → getTableAnalytics()
 *   GET /api/reports/customer-analytics → getCustomerAnalytics()
 *   GET /api/reports/recent-orders      → getRecentOrders()
 */

import { request, buildQuery } from './api';

// ── Shared query params ───────────────────────────────────────────────────────
export interface ReportParams {
  period?: 'today' | 'yesterday' | 'week' | 'month';
  start_date?: string;
  end_date?: string;
  outlet_id?: number;
  limit?: number;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReportSummary {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  total_gst: number;
  total_discount: number;
  order_growth_pct?: number;
  revenue_growth_pct?: number;
  net_sales?: number;
}

export interface OrderAnalytic {
  date: string;
  orders: number;
  revenue: number;
}

export interface OrderTypeBreakdown {
  order_type: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface PaymentAnalytic {
  payment_method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface HourlySale {
  hour: string | number;
  label: string;
  orders: number;
  revenue: number;
}

export interface CategorySale {
  category: string;
  items_sold: number;
  revenue: number;
  percentage: number;
}

export interface TopItem {
  name: string;
  category: string;
  qty_sold: number;
  revenue: number;
  image_url?: string | null;
}

export interface KotAnalytic {
  avg_prep_time_minutes: number;
  total_kots: number;
  urgent_kots: number;
  completed_kots: number;
  cancelled_kots: number;
}

export interface TableAnalytic {
  table_label: string;
  orders: number;
  revenue: number;
  avg_order_value: number;
}

export interface CustomerAnalytic {
  total_customers: number;
  repeat_customers: number;
  new_customers: number;
  top_customers: { name?: string; phone?: string; visits: number; spent: number }[];
}

export interface RecentOrder {
  id: number;
  order_number: string;
  order_type: string;
  table_label: string;
  payment_method: string;
  total: number;
  status: string;
  created_at: string;
  items_count: number;
  outlet_id?: number;
  outlet_name?: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function getSummary(
  params?: ReportParams,
): Promise<{ success: boolean; summary: ReportSummary }> {
  const res = await request<any>('GET', `/api/reports/summary${buildQuery(params as any)}`);
  const d = res.data ?? {};
  const summary: ReportSummary = {
    total_orders: d.totalOrders ?? 0,
    total_revenue: d.totalRevenue ?? 0,
    avg_order_value: d.averageOrderValue ?? 0,
    total_gst: d.gstCollection ?? 0,
    total_discount: d.totalDiscounts ?? 0,
    net_sales: d.netSales ?? 0,
  };
  return { success: res.success, summary };
}

export async function getOrderAnalytics(
  params?: ReportParams,
): Promise<{ success: boolean; analytics: OrderAnalytic[] }> {
  const res = await request<any>('GET', `/api/reports/order-analytics${buildQuery(params as any)}`);
  const d = res.data ?? {};
  const analytics: OrderAnalytic[] = [
    { date: 'Pending', orders: d.pendingOrders ?? 0, revenue: 0 },
    { date: 'Preparing', orders: d.preparingOrders ?? 0, revenue: 0 },
    { date: 'Ready', orders: d.readyOrders ?? 0, revenue: 0 },
    { date: 'Completed', orders: d.completedOrders ?? 0, revenue: 0 },
    { date: 'Cancelled', orders: d.cancelledOrders ?? 0, revenue: 0 },
  ];
  return { success: res.success, analytics };
}

export async function getOrderTypes(
  params?: ReportParams,
): Promise<{ success: boolean; breakdown: OrderTypeBreakdown[] }> {
  const res = await request<any>('GET', `/api/reports/order-types${buildQuery(params as any)}`);
  const d = res.data ?? {};
  const total = d.totalOrders ?? 1;
  const breakdown: OrderTypeBreakdown[] = [
    { order_type: 'Dine-In', count: d.dineInOrders ?? 0, revenue: 0, percentage: ((d.dineInOrders ?? 0) / total) * 100 },
    { order_type: 'Parcel', count: d.parcelOrders ?? 0, revenue: 0, percentage: ((d.parcelOrders ?? 0) / total) * 100 },
    { order_type: 'Swiggy', count: d.swiggyOrders ?? 0, revenue: 0, percentage: ((d.swiggyOrders ?? 0) / total) * 100 },
    { order_type: 'Zomato', count: d.zomatoOrders ?? 0, revenue: 0, percentage: ((d.zomatoOrders ?? 0) / total) * 100 },
  ];
  return { success: res.success, breakdown };
}

export async function getPaymentAnalytics(
  params?: ReportParams,
): Promise<{ success: boolean; payments: PaymentAnalytic[] }> {
  const res = await request<any>('GET', `/api/reports/payment-analytics${buildQuery(params as any)}`);
  const d = res.data ?? {};
  const totalRevenue = (d.cash?.revenue ?? 0) + (d.online?.revenue ?? 0) + (d.swiggy?.revenue ?? 0) + (d.zomato?.revenue ?? 0);
  const payments: PaymentAnalytic[] = [
    { payment_method: 'Cash', count: d.cash?.ordersCount ?? 0, amount: d.cash?.revenue ?? 0, percentage: totalRevenue ? ((d.cash?.revenue ?? 0) / totalRevenue) * 100 : 0 },
    { payment_method: 'UPI', count: d.online?.ordersCount ?? 0, amount: d.online?.revenue ?? 0, percentage: totalRevenue ? ((d.online?.revenue ?? 0) / totalRevenue) * 100 : 0 },
    { payment_method: 'Swiggy', count: d.swiggy?.ordersCount ?? 0, amount: d.swiggy?.revenue ?? 0, percentage: totalRevenue ? ((d.swiggy?.revenue ?? 0) / totalRevenue) * 100 : 0 },
    { payment_method: 'Zomato', count: d.zomato?.ordersCount ?? 0, amount: d.zomato?.revenue ?? 0, percentage: totalRevenue ? ((d.zomato?.revenue ?? 0) / totalRevenue) * 100 : 0 },
  ];
  return { success: res.success, payments };
}

export async function getHourlySales(
  params?: ReportParams,
): Promise<{ success: boolean; hourly: HourlySale[] }> {
  const res = await request<any>('GET', `/api/reports/hourly-sales${buildQuery(params as any)}`);
  const hourlyList = res.data ?? [];
  const hourly: HourlySale[] = hourlyList.map((item: any) => ({
    hour: item.hour,
    label: item.hourFormatted,
    orders: item.ordersCount,
    revenue: item.revenue,
  }));
  return { success: res.success, hourly };
}

export async function getCategorySales(
  params?: ReportParams,
): Promise<{ success: boolean; categories: CategorySale[] }> {
  const res = await request<any>('GET', `/api/reports/category-sales${buildQuery(params as any)}`);
  const categoryList = res.data ?? [];
  const totalItemsSold = categoryList.reduce((sum: number, r: any) => sum + r.quantitySold, 0) || 1;
  const categories: CategorySale[] = categoryList.map((item: any) => ({
    category: item.categoryName,
    items_sold: item.quantitySold,
    revenue: item.revenue,
    percentage: (item.quantitySold / totalItemsSold) * 100,
  }));
  return { success: res.success, categories };
}

export async function getTopItems(
  params?: ReportParams,
): Promise<{ success: boolean; items: TopItem[] }> {
  const res = await request<any>('GET', `/api/reports/top-items${buildQuery(params as any)}`);
  const topSelling = res.data?.topSelling ?? [];
  const items: TopItem[] = topSelling.map((item: any) => ({
    name: item.dishName,
    category: '',
    qty_sold: item.quantitySold,
    revenue: item.revenue,
    image_url: null,
  }));
  return { success: res.success, items };
}

export async function getKotAnalytics(
  params?: ReportParams,
): Promise<{ success: boolean; kot_analytics: KotAnalytic }> {
  const res = await request<any>('GET', `/api/reports/kot-analytics${buildQuery(params as any)}`);
  const d = res.data ?? {};
  const kot_analytics: KotAnalytic = {
    avg_prep_time_minutes: 0,
    total_kots: d.totalKOT ?? 0,
    urgent_kots: 0,
    completed_kots: d.servedKOT ?? 0,
    cancelled_kots: d.cancelledKOT ?? 0,
  };
  return { success: res.success, kot_analytics };
}

export async function getTableAnalytics(
  params?: ReportParams,
): Promise<{ success: boolean; tables: TableAnalytic[] }> {
  const res = await request<any>('GET', `/api/reports/table-analytics${buildQuery(params as any)}`);
  const tableList = res.data ?? [];
  const tables: TableAnalytic[] = tableList.map((item: any) => ({
    table_label: String(item.tableNumber),
    orders: item.ordersCount,
    revenue: item.revenue,
    avg_order_value: item.ordersCount ? Math.round(item.revenue / item.ordersCount) : 0,
  }));
  return { success: res.success, tables };
}

export async function getCustomerAnalytics(
  params?: ReportParams,
): Promise<{ success: boolean; customers: CustomerAnalytic }> {
  const res = await request<any>('GET', `/api/reports/customer-analytics${buildQuery(params as any)}`);
  const d = res.data ?? {};
  const topCustomersRaw = d.topCustomers ?? [];
  const customers: CustomerAnalytic = {
    total_customers: 0,
    repeat_customers: d.repeatCustomers ?? 0,
    new_customers: 0,
    top_customers: topCustomersRaw.map((cust: any) => ({
      name: cust.customerName,
      phone: cust.customerPhone,
      visits: cust.orderCount,
      spent: cust.totalSpend,
    })),
  };
  return { success: res.success, customers };
}

export async function getRecentOrders(
  params?: ReportParams,
): Promise<{ success: boolean; orders: RecentOrder[] }> {
  const res = await request<any>('GET', `/api/reports/recent-orders${buildQuery(params as any)}`);
  const orderList = res.data ?? [];
  const orders: RecentOrder[] = orderList.map((item: any, idx: number) => ({
    id: idx + 1,
    order_number: item.orderNumber,
    order_type: item.orderType,
    table_label: item.tableNumber ?? '',
    payment_method: item.paymentMethod,
    total: item.totalAmount,
    status: item.orderStatus,
    created_at: item.orderTime,
    items_count: item.itemsSold,
    outlet_id: item.outletId,
    outlet_name: item.outletName,
  }));
  return { success: res.success, orders };
}

