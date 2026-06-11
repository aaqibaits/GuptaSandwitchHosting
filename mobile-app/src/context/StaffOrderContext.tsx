/**
 * StaffOrderContext.tsx
 * ─────────────────────
 * Shared state for the Staff Panel:
 *   - Cart (POS building an order)
 *   - KOT orders list (generated from POS, consumed by KOT screen)
 *
 * Wrap <StaffTabNavigator> with <StaffOrderProvider> so all 5 tabs
 * share the same order/KOT state without lifting to App.tsx.
 */

import React, {
  createContext, useContext, useState, useCallback, ReactNode, useEffect,
} from 'react';
import {
  CartItem, KotOrder, OrderType, PaymentMethod, OrderStatus, KotItemStatus,
} from '../types';
import io from 'socket.io-client';
import { BASE_URL } from '../services/api';
import {
  getAllKots,
  updateKotStatus as apiUpdateKotStatus,
  updateKotUrgency,
  markItemReady,
  markAllItemsReady,
  dispatchOrder,
  cancelOrder as apiCancelOrder,
} from '../services/posApi';

// ── Context shape ─────────────────────────────────────────────────────────────
interface StaffOrderContextValue {
  // Cart
  cart: CartItem[];
  orderType: OrderType;
  tableLabel: string;
  paymentMethod: PaymentMethod;
  setOrderType: (t: OrderType) => void;
  setTableLabel: (l: string) => void;
  setPaymentMethod: (m: PaymentMethod) => void;
  addToCart: (item: Omit<CartItem, 'qty'>) => void;
  removeFromCart: (id: number) => void;
  updateQty: (id: number, delta: number) => void;
  clearCart: () => void;

  // KOT orders
  kotOrders: KotOrder[];
  loading: boolean;
  refreshKots: () => Promise<void>;
  placeOrder: (discount: { type: 'pct' | 'flat'; value: number }) => KotOrder;
  updateKotStatus: (kotId: string, status: OrderStatus) => void;
  toggleItemReady: (kotId: string, itemId: number) => void;
  markAllKotItemsReady: (kotId: string) => Promise<void>;
  toggleUrgent: (kotId: string) => void;
  cancelKotOrder: (orderId: number) => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────
const StaffOrderContext = createContext<StaffOrderContextValue | undefined>(undefined);

export function useStaffOrder(): StaffOrderContextValue {
  const ctx = useContext(StaffOrderContext);
  if (!ctx) throw new Error('useStaffOrder must be used inside StaffOrderProvider');
  return ctx;
}

// ── Seed KOT orders so KOT screen shows real data on first load ───────────────
const SEED_KOTS: KotOrder[] = [
  {
    id: 'KOT-SEED-1',
    kotNumber: 'K001',
    orderType: 'dine-in',
    tableLabel: 'Table 3',
    paymentMethod: 'Cash',
    status: 'pending',
    isUrgent: false,
    items: [
      { id: 5, name: 'Paneer Cheesy Grilled (Jumbo)', emoji: '🧀', price: 170, qty: 2 },
      { id: 25, name: 'French Fries', emoji: '🍟', price: 90, qty: 1 },
    ],
    subtotal: 430, gst: 22, total: 452,
    createdAt: new Date(Date.now() - 3 * 60000),
    itemStatuses: { 5: 'pending', 25: 'pending' },
  },
  {
    id: 'KOT-SEED-2',
    kotNumber: 'K002',
    orderType: 'dine-in',
    tableLabel: 'Table 1',
    paymentMethod: 'UPI',
    status: 'preparing',
    isUrgent: true,
    items: [
      { id: 32, name: 'Gupta Special Panini', emoji: '⭐', price: 200, qty: 1 },
      { id: 29, name: 'Paneer Tikka Panini', emoji: '🧀', price: 170, qty: 1 },
    ],
    subtotal: 370, gst: 19, total: 389,
    createdAt: new Date(Date.now() - 9 * 60000),
    itemStatuses: { 32: 'ready', 29: 'pending' },
  },
  {
    id: 'KOT-SEED-3',
    kotNumber: 'K003',
    orderType: 'parcel',
    tableLabel: 'Parcel',
    paymentMethod: 'Card',
    status: 'preparing',
    isUrgent: false,
    items: [
      { id: 46, name: 'Margherita Pizza (9 Inch)', emoji: '🍕', price: 180, qty: 1 },
      { id: 70, name: 'Cold Coffee', emoji: '☕', price: 100, qty: 2 },
    ],
    subtotal: 380, gst: 19, total: 399,
    createdAt: new Date(Date.now() - 14 * 60000),
    itemStatuses: { 46: 'ready', 70: 'pending' },
  },
  {
    id: 'KOT-SEED-4',
    kotNumber: 'K004',
    orderType: 'dine-in',
    tableLabel: 'Table 5',
    paymentMethod: 'UPI',
    status: 'ready',
    isUrgent: false,
    items: [
      { id: 1, name: 'Veggie Cheesy Grilled (Jumbo)', emoji: '🥪', price: 150, qty: 3 },
      { id: 28, name: 'Insalta Garlic Bread', emoji: '🍞', price: 150, qty: 1 },
    ],
    subtotal: 600, gst: 30, total: 630,
    createdAt: new Date(Date.now() - 22 * 60000),
    itemStatuses: { 1: 'ready', 28: 'ready' },
  },
  {
    id: 'KOT-SEED-5',
    kotNumber: 'K005',
    orderType: 'dine-in',
    tableLabel: 'Table 2',
    paymentMethod: 'Cash',
    status: 'dispatched',
    isUrgent: false,
    items: [
      { id: 5, name: 'Paneer Cheesy Grilled (Jumbo)', emoji: '🧀', price: 170, qty: 1 },
      { id: 9, name: 'Masala Cheesy Grilled (Jumbo)', emoji: '🌶️', price: 160, qty: 1 },
    ],
    subtotal: 330, gst: 17, total: 347,
    createdAt: new Date(Date.now() - 40 * 60000),
    itemStatuses: { 5: 'ready', 9: 'ready' },
  },
];

let kotCounter = 6; // start after seeded ones

// ── Provider ──────────────────────────────────────────────────────────────────
export function StaffOrderProvider({ children, outletId }: { children: ReactNode; outletId?: number }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [tableLabel, setTableLabel] = useState('Table 1');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [kotOrders, setKotOrders] = useState<KotOrder[]>([]);
  const [loading, setLoading] = useState(false);

  // Custom setOrderType that dynamically updates all items currently in the cart
  const setOrderTypeAndSyncPrices = useCallback((newType: OrderType) => {
    setOrderType(newType);
    setCart(prev =>
      prev.map(item => {
        const newPrice = newType === 'parcel'
          ? (item.parcel_price ?? item.price)
          : (item.dine_price ?? item.price);
        return {
          ...item,
          price: newPrice,
        };
      })
    );
  }, []);

  // Map API KOT → local KotOrder type
  const apiToKotOrder = useCallback((k: any): KotOrder => {
    const rawType = k.orderType || k.order_type || 'parcel';
    const resolvedType: OrderType = rawType === 'dine' ? 'dine-in' : (rawType as OrderType);
    return {
      id: String(k.id),
      orderId: k.orderId || k.order_id ? Number(k.orderId || k.order_id) : undefined,
      orderNumber: k.orderNumber || k.order_number,
      kotNumber: k.kotNumber || k.kot_number,
      orderType: resolvedType,
      tableLabel: k.tableNumber || k.table_label || (
        resolvedType === 'dine-in' ? 'Dine-in' :
        resolvedType === 'swiggy' ? 'Swiggy' :
        resolvedType === 'zomato' ? 'Zomato' : 'Parcel'
      ),
      paymentMethod: (() => {
        const pm = String(k.paymentMethod || k.payment_method || 'Cash').toLowerCase();
        if (pm === 'cash') return 'Cash';
        if (pm === 'upi') return 'UPI';
        if (pm === 'card') return 'Card';
        return 'Online';
      })(),
      status: (k.status === 'served' || k.status === 'dispatched' ? 'dispatched' : k.status) as OrderStatus,
      isUrgent: k.isUrgent ?? k.is_urgent ?? false,
      subtotal: Number(k.subtotal || 0),
      gst: 0, // No GST
      total: Number(k.subtotal || 0),
      createdAt: k.sentTime ? new Date(k.sentTime) : k.created_at ? new Date(k.created_at) : new Date(),
      items: (k.items || []).map((i: any) => ({
        id: i.id,
        name: i.dishName || i.name,
        qty: i.quantity || i.qty,
        price: Number(i.price ?? 0),
        emoji: i.emoji ?? '🍔',
      })),
      itemStatuses: Object.fromEntries(
        (k.items || []).map((i: any) => [i.id, i.isReady || i.status === 'ready' ? 'ready' : 'pending']),
      ) as Record<number, 'pending' | 'ready'>,
    };
  }, []);

  const refreshKots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllKots();
      if (res.success && res.kots) {
        setKotOrders(res.kots.map(apiToKotOrder));
      }
    } catch (err) {
      console.error('Failed to fetch KOTs in context:', err);
    } finally {
      setLoading(false);
    }
  }, [apiToKotOrder]);

  // Set up periodic background polling (every 15s)
  useEffect(() => {
    refreshKots();
    const interval = setInterval(refreshKots, 15_000);
    return () => clearInterval(interval);
  }, [refreshKots]);

  // Set up real-time Socket.io updates
  useEffect(() => {
    if (!outletId) return undefined;

    const socket = io(BASE_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      socket.emit('join_outlet', Number(outletId));
      console.log(`🔌 Connected to KOT socket in mobile app. Room: outlet_${outletId}`);
    });

    socket.on('NEW_PLATFORM_ORDER', () => {
      console.log('Socket event: NEW_PLATFORM_ORDER received in mobile app context');
      refreshKots();
    });

    socket.on('KOT_STATUS_UPDATE', () => {
      console.log('Socket event: KOT_STATUS_UPDATE received in mobile app context');
      refreshKots();
    });

    return () => {
      socket.disconnect();
    };
  }, [outletId, refreshKots]);

  // ── Cart helpers ─────────────────────────────────────────────────────────
  const addToCart = useCallback((item: Omit<CartItem, 'qty'>) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCart(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateQty = useCallback((id: number, delta: number) => {
    setCart(prev =>
      prev
        .map(c => c.id === id ? { ...c, qty: c.qty + delta } : c)
        .filter(c => c.qty > 0)
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // ── Order placement ──────────────────────────────────────────────────────
  const placeOrder = useCallback((discount: { type: 'pct' | 'flat'; value: number }): KotOrder => {
    const baseSubtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    let discountAmount = 0;
    if (discount.value > 0) {
      if (discount.type === 'pct') {
        discountAmount = Math.round((baseSubtotal * discount.value / 100) * 100) / 100;
      } else {
        discountAmount = Math.min(discount.value, baseSubtotal);
      }
    }
    const subtotal = baseSubtotal - discountAmount;
    const gst = 0; // GST is disabled
    const total = subtotal + gst;

    const itemStatuses: Record<number, KotItemStatus> = {};
    cart.forEach(c => { itemStatuses[c.id] = 'pending'; });

    const order: KotOrder = {
      id: `KOT-${Date.now()}`,
      kotNumber: `K${String(kotCounter++).padStart(3, '0')}`,
      orderType,
      tableLabel,
      items: [...cart],
      status: 'pending',
      isUrgent: false,
      paymentMethod,
      subtotal,
      gst,
      total,
      createdAt: new Date(),
      itemStatuses,
    };

    // Optimistically update, clear cart, and fetch in background
    setKotOrders(prev => [order, ...prev]);
    setCart([]);
    refreshKots();
    return order;
  }, [cart, orderType, tableLabel, paymentMethod, refreshKots]);

  // ── KOT helpers ──────────────────────────────────────────────────────────
  const updateKotStatus = useCallback(async (kotId: string, status: OrderStatus) => {
    // Optimistic UI updates
    setKotOrders(prev =>
      prev.map(k => k.id === kotId ? { ...k, status } : k)
    );
    try {
      if (status === 'dispatched') {
        await dispatchOrder(Number(kotId));
      } else {
        await apiUpdateKotStatus(Number(kotId), status as any);
      }
    } catch (err) {
      console.error('Failed to update KOT status:', err);
    } finally {
      refreshKots();
    }
  }, [refreshKots]);

  const toggleItemReady = useCallback(async (kotId: string, itemId: number) => {
    // Find target status to toggle
    const targetKot = kotOrders.find(k => k.id === kotId);
    if (!targetKot) return;
    const isCurrentlyReady = targetKot.itemStatuses[itemId] === 'ready';

    // Optimistic UI updates
    setKotOrders(prev =>
      prev.map(k => {
        if (k.id !== kotId) return k;
        const next = { ...k.itemStatuses, [itemId]: isCurrentlyReady ? 'pending' : 'ready' } as Record<number, KotItemStatus>;
        const allReady = k.items.every(i => next[i.id] === 'ready');
        
        let newStatus = k.status;
        if (k.status !== 'dispatched' && k.status !== 'cancelled') {
          if (allReady) {
            newStatus = 'ready';
          } else if (k.status === 'pending') {
            newStatus = 'preparing';
          }
        }
        
        return { ...k, itemStatuses: next, status: newStatus };
      })
    );

    try {
      await markItemReady(Number(kotId), itemId, !isCurrentlyReady);
    } catch (err) {
      console.error('Failed to toggle item ready:', err);
    } finally {
      refreshKots();
    }
  }, [kotOrders, refreshKots]);

  const toggleUrgent = useCallback(async (kotId: string) => {
    const targetKot = kotOrders.find(k => k.id === kotId);
    if (!targetKot) return;
    const nextUrgent = !targetKot.isUrgent;

    // Optimistic UI updates
    setKotOrders(prev =>
      prev.map(k => k.id === kotId ? { ...k, isUrgent: nextUrgent } : k)
    );

    try {
      await updateKotUrgency(Number(kotId), nextUrgent);
    } catch (err) {
      console.error('Failed to toggle urgency:', err);
    } finally {
      refreshKots();
    }
  }, [kotOrders, refreshKots]);

  const cancelKotOrder = useCallback(async (orderId: number) => {
    // Optimistic UI updates
    setKotOrders(prev =>
      prev.map(k => k.orderId === orderId ? { ...k, status: 'cancelled' } : k)
    );
    try {
      await apiCancelOrder(orderId);
    } catch (err) {
      console.error('Failed to cancel KOT order:', err);
    } finally {
      refreshKots();
    }
  }, [refreshKots]);

  const markAllKotItemsReady = useCallback(async (kotId: string) => {
    // Optimistic UI updates
    setKotOrders(prev =>
      prev.map(k => {
        if (k.id !== kotId) return k;
        const next = { ...k.itemStatuses };
        k.items.forEach(i => { next[i.id] = 'ready'; });
        return { ...k, itemStatuses: next, status: 'ready' };
      })
    );
    try {
      await markAllItemsReady(Number(kotId));
    } catch (err) {
      console.error('Failed to mark all items ready:', err);
    } finally {
      refreshKots();
    }
  }, [refreshKots]);

  return (
    <StaffOrderContext.Provider value={{
      cart, orderType, tableLabel, paymentMethod,
      setOrderType: setOrderTypeAndSyncPrices, setTableLabel, setPaymentMethod,
      addToCart, removeFromCart, updateQty, clearCart,
      kotOrders, loading, refreshKots, placeOrder, updateKotStatus, toggleItemReady, markAllKotItemsReady, toggleUrgent, cancelKotOrder,
    }}>
      {children}
    </StaffOrderContext.Provider>
  );
}
