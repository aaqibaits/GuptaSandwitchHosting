/**
 * services/posApi.ts
 * ──────────────────
 * Maps to backend: /api/pos  (all require valid JWT — admin or staff)
 *
 * Routes:
 *   GET   /api/pos/categories                        → getPosCategories()
 *   GET   /api/pos/dishes                            → getPosDishes()
 *   GET   /api/pos/dishes/available                  → getAvailableDishes()
 *   GET   /api/pos/dishes/search?q=...               → searchDishes()
 *   GET   /api/pos/categories/:id/dishes             → getDishesByCategory()
 *   POST  /api/pos/orders                            → createOrder()
 *   GET   /api/pos/orders/:orderId                   → getOrderById()
 *   POST  /api/pos/orders/:orderId/cancel            → cancelOrder()
 *   GET   /api/pos/kots                              → getAllKots()
 *   GET   /api/pos/kots/pending                      → getPendingKots()
 *   GET   /api/pos/kots/ready                        → getReadyKots()
 *   PATCH /api/pos/kots/:kotId/items/:itemId/ready   → markItemReady()
 *   PATCH /api/pos/kots/:kotId/ready                 → markAllItemsReady()
 *   POST  /api/pos/kots/:kotId/dispatch              → dispatchOrder()
 *   PATCH /api/pos/kots/:kotId/status                → updateKotStatus()
 *   GET   /api/pos/dashboard/stats                   → getPosDashboardStats()
 */

import { request, buildQuery } from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PosCategory {
  id: number;
  name: string;
  emoji?: string;
  display_order?: number;
}

export interface PosDish {
  id: number;
  name: string;
  category: string;
  category_id: number;
  price: number;
  dine_price: number;
  parcel_price: number;
  emoji?: string;
  image_url: string | null;
  is_available: boolean;
  ingredients?: string[];
}

export interface PosOrderItem {
  dish_id: number;
  name: string;
  qty: number;
  unit_price: number;
  total_price: number;
}

export interface PosOrder {
  id: number;
  order_number: string;
  order_type: 'dine-in' | 'parcel' | 'swiggy' | 'zomato';
  table_label?: string;
  payment_method: string;
  status: string;
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  items: PosOrderItem[];
  created_at: string;
  outlet_id: number;
}

export interface PosKotItem {
  id: number;
  dish_id: number;
  name: string;
  qty: number;
  price: number;
  status: 'pending' | 'ready';
  emoji?: string;
}

export interface PosKot {
  id: number;
  kot_number: string;
  order_id: number;
  order_type: 'dine-in' | 'parcel' | 'swiggy' | 'zomato';
  table_label: string;
  payment_method: string;
  status: 'pending' | 'preparing' | 'ready' | 'dispatched' | 'cancelled';
  is_urgent: boolean;
  subtotal: number;
  gst: number;
  total: number;
  items: PosKotItem[];
  created_at: string;
  outlet_id: number;
}

export interface CreateOrderPayload {
  order_type: 'dine-in' | 'parcel';
  table_label?: string;
  payment_method: string;
  discount?: { type: 'pct' | 'flat'; value: number };
  items: { dish_id: number; qty: number; unit_price: number }[];
}

export interface PosDashboardStats {
  today_orders: number;
  today_revenue: number;
  pending_kots: number;
  avg_order_value: number;
}

// ── Menu & Categories ─────────────────────────────────────────────────────────

export async function getPosCategories(): Promise<{ success: boolean; categories: PosCategory[] }> {
  const res = await request<{ success: boolean; data: any[] }>('GET', '/api/pos/categories');
  return { success: res.success, categories: res.data };
}

const mapDish = (d: any): PosDish => ({
  id: d.id,
  name: d.name,
  category: d.categoryName || d.category || d.cat || 'General',
  category_id: d.categoryId || d.category_id || 0,
  price: Number(d.price),
  dine_price: Number(d.dinePrice ?? d.dine_price ?? d.price),
  parcel_price: Number(d.parcelPrice ?? d.parcel_price ?? d.price),
  emoji: d.emoji || '🍔',
  image_url: d.imageUrl ?? d.image_url ?? null,
  is_available: d.isAvailable ?? d.is_available ?? true,
  ingredients: d.ingredients,
});

export async function getPosDishes(): Promise<{ success: boolean; dishes: PosDish[] }> {
  const res = await request<{ success: boolean; data: any[] }>('GET', '/api/pos/dishes');
  return { success: res.success, dishes: res.data.map(mapDish) };
}

export async function getAvailableDishes(): Promise<{ success: boolean; dishes: PosDish[] }> {
  const res = await request<{ success: boolean; data: any[] }>('GET', '/api/pos/dishes/available');
  return { success: res.success, dishes: res.data.map(mapDish) };
}

export async function searchDishes(query: string): Promise<{ success: boolean; dishes: PosDish[] }> {
  const res = await request<{ success: boolean; data: any[] }>('GET', `/api/pos/dishes/search${buildQuery({ q: query })}`);
  return { success: res.success, dishes: res.data.map(mapDish) };
}

export async function getDishesByCategory(
  categoryId: number,
): Promise<{ success: boolean; dishes: PosDish[] }> {
  const res = await request<{ success: boolean; data: any[] }>('GET', `/api/pos/categories/${categoryId}/dishes`);
  return { success: res.success, dishes: res.data.map(mapDish) };
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function createOrder(
  payload: CreateOrderPayload,
): Promise<{ success: boolean; order: PosOrder; kot: PosKot }> {
  const apiPayload = {
    orderType: payload.order_type === 'dine-in' ? 'dine' : 'parcel',
    paymentMethod: payload.payment_method.toLowerCase(),
    discount: {
      type: payload.discount?.type === 'pct' ? 'percentage' : 'fixed',
      value: payload.discount?.value || 0,
    },
    items: payload.items.map(i => ({
      dishId: i.dish_id,
      quantity: i.qty,
    })),
  };

  const res = await request<{ success: boolean; data: { order: any; items: any[]; kot: any } }>(
    'POST',
    '/api/pos/orders',
    apiPayload
  );
  return {
    success: res.success,
    order: {
      ...res.data.order,
      order_number: res.data.order.orderNumber || res.data.order.order_number,
      order_type: res.data.order.orderType || res.data.order.order_type,
    } as any,
    kot: {
      ...res.data.kot,
      kot_number: res.data.kot.kotNumber || res.data.kot.kot_number,
      order_type: res.data.kot.orderType || res.data.kot.order_type,
    } as any,
  };
}

export async function getOrderById(
  orderId: number,
): Promise<{ success: boolean; order: PosOrder }> {
  const res = await request<{ success: boolean; data: any }>('GET', `/api/pos/orders/${orderId}`);
  return { success: res.success, order: res.data };
}

export async function cancelOrder(
  orderId: number,
): Promise<{ success: boolean }> {
  const res = await request<{ success: boolean }>('POST', `/api/pos/orders/${orderId}/cancel`);
  return { success: res.success };
}

// ── KOT Management ────────────────────────────────────────────────────────────

export async function getAllKots(): Promise<{ success: boolean; kots: PosKot[] }> {
  const res = await request<{ success: boolean; data: any[] }>('GET', '/api/pos/kots');
  return { success: res.success, kots: res.data };
}

export async function getPendingKots(): Promise<{ success: boolean; kots: PosKot[] }> {
  const res = await request<{ success: boolean; data: any[] }>('GET', '/api/pos/kots/pending');
  return { success: res.success, kots: res.data };
}

export async function getReadyKots(): Promise<{ success: boolean; kots: PosKot[] }> {
  const res = await request<{ success: boolean; data: any[] }>('GET', '/api/pos/kots/ready');
  return { success: res.success, kots: res.data };
}

export async function markItemReady(
  kotId: number,
  itemId: number,
  isReady: boolean = true,
): Promise<{ success: boolean }> {
  const res = await request<{ success: boolean }>('PATCH', `/api/pos/kots/${kotId}/items/${itemId}/ready`, { isReady });
  return { success: res.success };
}

export async function markAllItemsReady(
  kotId: number,
): Promise<{ success: boolean }> {
  const res = await request<{ success: boolean }>('PATCH', `/api/pos/kots/${kotId}/ready`);
  return { success: res.success };
}

export async function dispatchOrder(
  kotId: number,
): Promise<{ success: boolean }> {
  const res = await request<{ success: boolean }>('POST', `/api/pos/kots/${kotId}/dispatch`);
  return { success: res.success };
}

export async function updateKotStatus(
  kotId: number,
  status: 'pending' | 'preparing' | 'ready' | 'dispatched' | 'cancelled',
): Promise<{ success: boolean; kot: PosKot }> {
  const res = await request<{ success: boolean; data: any }>('PATCH', `/api/pos/kots/${kotId}/status`, { status });
  return { success: res.success, kot: res.data };
}

export async function updateKotUrgency(
  kotId: number,
  isUrgent: boolean,
): Promise<{ success: boolean; kot: PosKot }> {
  const res = await request<{ success: boolean; data: any }>('PATCH', `/api/pos/kots/${kotId}/status`, { isUrgent });
  return { success: res.success, kot: res.data };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getPosDashboardStats(): Promise<{ success: boolean; stats: PosDashboardStats }> {
  const res = await request<{ success: boolean; data: any }>('GET', '/api/pos/dashboard/stats');
  return {
    success: res.success,
    stats: {
      today_orders: res.data.todayTotalOrders ?? 0,
      today_revenue: res.data.todayTotalSales ?? 0,
      pending_kots: res.data.activeKotCount ?? 0,
      avg_order_value: res.data.todayTotalOrders > 0
        ? Math.round(res.data.todayTotalSales / res.data.todayTotalOrders)
        : 0,
    }
  };
}
