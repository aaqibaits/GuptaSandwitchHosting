import React, {
  createContext, useContext, useState, useCallback, ReactNode, useEffect,
} from 'react';
import {
  CartItem, KotOrder, OrderType, PaymentMethod, OrderStatus, KotItemStatus,
} from '../types';
import io from 'socket.io-client';
import { Alert } from 'react-native';
import { BASE_URL } from '../services/api';
import {
  getAllKots,
  updateKotStatus as apiUpdateKotStatus,
  updateKotUrgency,
  markItemReady,
  markAllItemsReady,
  dispatchOrder,
  cancelOrder as apiCancelOrder,
  createOrder,
} from '../services/posApi';
import {
  saveOrderLocally,
  getLocalOrders,
  markOrderSynced,
  LocalOrder,
  updateLocalOrderStatus,
} from '../services/offlineDB';
import { getNextKotNumber } from '../services/offlineStorage';

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
  addToCart: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  removeFromCart: (id: number) => void;
  updateQty: (id: number, delta: number) => void;
  clearCart: () => void;

  // KOT orders
  kotOrders: KotOrder[];
  loading: boolean;
  refreshKots: () => Promise<void>;
  placeOrder: (discount: { type: 'pct' | 'flat'; value: number }) => Promise<KotOrder>;
  updateKotStatus: (kotId: string, status: OrderStatus) => void;
  toggleItemReady: (kotId: string, itemId: number) => void;
  markAllKotItemsReady: (kotId: string) => Promise<void>;
  toggleUrgent: (kotId: string) => void;
  cancelKotOrder: (orderId: number) => Promise<void>;
  
  // Outlet details
  outletName?: string;
  staffName?: string;
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
export function StaffOrderProvider({ children, outletId, outletName, userEmail }: { children: ReactNode; outletId?: number; outletName?: string; userEmail?: string }) {
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
      // ── Step 1: Pehle SQLite se local orders lo (instant, no network needed) ──
      const localOrders = getLocalOrders();
      const localKotOrders: KotOrder[] = localOrders.map((o: LocalOrder) => ({
        id:            `LOCAL-${o.id}`,
        kotNumber:     o.kot_number,
        orderType:     o.order_type as OrderType,
        tableLabel:    o.table_label,
        paymentMethod: o.payment_method as PaymentMethod,
        status:        (o.status || 'pending') as OrderStatus,
        isUrgent:      false,
        items:         JSON.parse(o.items),
        subtotal:      o.subtotal,
        gst:           0,
        total:         o.total,
        createdAt:     new Date(o.created_at),
        itemStatuses:  Object.fromEntries(
          JSON.parse(o.items).map((i: CartItem) => [i.id, 'pending'])
        ) as Record<number, KotItemStatus>,
      }));

      // ── Step 2: Server se bhi try karo (agar network available ho) ──
      try {
        const res = await getAllKots();
        if (res.success && res.kots) {
          const serverKots = res.kots.map(apiToKotOrder);

          // Self-healing check: Agar local status aur server status mismatched hain (offline changes),
          // to background mein server pe update push karo aur UI mein local status dikhao.
          const healedServerKots = serverKots.map(sk => {
            if (!sk.orderId) return sk;

            // Local SQLite mein check karo
            const matchLocal = localOrders.find(lo => lo.server_order_id === sk.orderId);
            if (matchLocal && matchLocal.status !== sk.status) {
              console.log(`⚠️ Status mismatch for order ${sk.kotNumber}: Server=${sk.status}, Local=${matchLocal.status}. Syncing...`);

              // Define progression order weight
              const statusProgression: Record<string, number> = {
                'pending': 0,
                'preparing': 1,
                'ready': 2,
                'dispatched': 3,
                'served': 3,
                'cancelled': 4
              };

              const localWeight = statusProgression[matchLocal.status] ?? 0;
              const serverWeight = statusProgression[sk.status] ?? 0;

              if (localWeight > serverWeight) {
                // Local is ahead -> Push local status update to server
                const serverKotId = Number(sk.id);
                if (matchLocal.status === 'dispatched') {
                  dispatchOrder(serverKotId).catch(e => console.error("Self-heal dispatch failed:", e));
                } else if (matchLocal.status === 'ready') {
                  markAllItemsReady(serverKotId).catch(e => console.error("Self-heal ready failed:", e));
                } else {
                  apiUpdateKotStatus(serverKotId, matchLocal.status as any).catch(e => console.error("Self-heal status update failed:", e));
                }
                return { ...sk, status: matchLocal.status as OrderStatus };
              } else {
                // Server is ahead -> Update local SQLite database status to match server
                if (matchLocal.id !== undefined) {
                  updateLocalOrderStatus(matchLocal.id, sk.status);
                }
                return sk;
              }
            }
            return sk;
          });

          // Server ke orders ko local unsynced orders ke saath merge karo
          // (duplicate avoid karne ke liye LOCAL-prefix wale sirf unsynced dikhao)
          const unsyncedLocal = localKotOrders.filter(lk => {
            const localId = parseInt(lk.id.replace('LOCAL-', ''), 10);
            const localDbOrder = localOrders.find((o: LocalOrder) => o.id === localId);
            return localDbOrder && localDbOrder.synced === 0;
          });
          setKotOrders([...unsyncedLocal, ...healedServerKots]);
        }
      } catch {
        // Network nahi hai — sirf unsynced local orders dikhao (Offline mode isolation)
        const unsyncedLocal = localKotOrders.filter(lk => {
          const localId = parseInt(lk.id.replace('LOCAL-', ''), 10);
          const localDbOrder = localOrders.find((o: LocalOrder) => o.id === localId);
          return localDbOrder && localDbOrder.synced === 0;
        });
        setKotOrders(unsyncedLocal);
      }
    } catch (err) {
      console.error('Failed to refresh KOTs:', err);
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
  const addToCart = useCallback((item: Omit<CartItem, 'qty'>, qty: number = 1) => {
    setCart(prev => {
      const correctPrice = orderType === 'parcel'
        ? (item.parcel_price ?? item.price)
        : (item.dine_price ?? item.price);

      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + qty, price: correctPrice } : c);
      }
      return [...prev, { ...item, price: correctPrice, qty }];
    });
  }, [orderType]);

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

  // ── Order placement (OFFLINE-FIRST) ──────────────────────────────────────
  const placeOrder = useCallback(async (discount: { type: 'pct' | 'flat'; value: number }): Promise<KotOrder> => {
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
    const gst = 0;
    const total = subtotal + gst;

    // Unique KOT number lo (persistent across restarts)
    const kotNumber = await getNextKotNumber();

    const itemStatuses: Record<number, KotItemStatus> = {};
    cart.forEach(c => { itemStatuses[c.id] = 'pending'; });

    const order: KotOrder = {
      id:            `KOT-${Date.now()}`,
      kotNumber,
      orderType,
      tableLabel,
      items:         [...cart],
      status:        'pending',
      isUrgent:      false,
      paymentMethod,
      subtotal,
      gst,
      total,
      createdAt:     new Date(),
      itemStatuses,
    };

    // Store a local copy of the mapped items before clearing the cart state
    const itemsToSync = cart.map(c => ({ dish_id: c.id, qty: c.qty, unit_price: c.price }));

    // ── Step 1: SQLite database mein order save karo (Offline safety) ──────
    const localId = saveOrderLocally({
      kot_number:     kotNumber,
      order_type:     orderType,
      table_label:    tableLabel,
      payment_method: paymentMethod,
      items:          JSON.stringify(cart),
      subtotal,
      total,
      discount_type:  discount.type,
      discount_value: discount.value,
      created_at:     new Date().toISOString(),
    });

    // UI state update
    setKotOrders(prev => [order, ...prev]);
    setCart([]);

    // ── Step 2: Server pe sync karne ka try karo (online check) ───────────
    try {
      const res = await createOrder({
        order_type:     orderType as 'dine-in' | 'parcel',
        table_label:    tableLabel,
        payment_method: paymentMethod,
        discount,
        items: itemsToSync,
      });

      if (res.success && localId > 0) {
        // Sync successful → SQLite mein synced = 1 mark karo
        markOrderSynced(localId, res.order ? Number(res.order.id) : undefined);
        console.log(`✅ Order ${kotNumber} synced to server immediately`);
      }
      refreshKots();
    } catch (err: any) {
      console.log(`❌ placeOrder server sync failed for KOT ${kotNumber}:`, err);
      // SQLite mein synced=0 rahega, background sync engine ise baad mein sync karega
      console.log(`📦 Order ${kotNumber} saved locally in SQLite (offline)`);
    }

    return order;
  }, [cart, orderType, tableLabel, paymentMethod, refreshKots]);

  // ── Helper: kya yeh ek local offline order hai? ─────────────────────────
  // Local orders ke IDs: 'LOCAL-1', 'LOCAL-2', 'KOT-171234...' (non-numeric)
  // Server orders ke IDs: '42', '43', '100' (pure numeric strings)
  const isLocalOrder = (kotId: string): boolean => {
    return kotId.startsWith('LOCAL-') ||
           kotId.startsWith('KOT-') ||
           isNaN(Number(kotId));
  };

  // ── KOT helpers ──────────────────────────────────────────────────────────
  const updateKotStatus = useCallback(async (kotId: string, status: OrderStatus) => {
    // Optimistic UI updates
    setKotOrders(prev =>
      prev.map(k => k.id === kotId ? { ...k, status } : k)
    );

    // Local offline order → SQLite status update & local state update only
    if (isLocalOrder(kotId)) {
      const localId = parseInt(kotId.replace('LOCAL-', ''), 10);
      if (!isNaN(localId)) {
        updateLocalOrderStatus(localId, status);
      }
      console.log(`📦 Local order status updated locally: ${kotId} → ${status}`);
      return;
    }

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

    // Local offline order → SQLite status update & local state update only
    if (isLocalOrder(kotId)) {
      const localId = parseInt(kotId.replace('LOCAL-', ''), 10);
      if (!isNaN(localId)) {
        const allReady = targetKot.items.every(i => {
          const itemStatus = i.id === itemId ? (isCurrentlyReady ? 'pending' : 'ready') : targetKot.itemStatuses[i.id];
          return itemStatus === 'ready';
        });
        let newStatus = targetKot.status;
        if (targetKot.status !== 'dispatched' && targetKot.status !== 'cancelled') {
          if (allReady) {
            newStatus = 'ready';
          } else if (targetKot.status === 'pending') {
            newStatus = 'preparing';
          }
        }
        updateLocalOrderStatus(localId, newStatus);
      }
      console.log(`📦 Local order item toggled locally: ${kotId}`);
      return;
    }

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

    // Local offline order → sirf UI update, server call nahi
    if (isLocalOrder(kotId)) {
      console.log(`📦 Local order urgency toggled locally: ${kotId}`);
      return;
    }

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

    // Local offline order → SQLite status update & local state update only
    // (jab sync hoga tab server pe bhi update ho jayega)
    if (isLocalOrder(kotId)) {
      const localId = parseInt(kotId.replace('LOCAL-', ''), 10);
      if (!isNaN(localId)) {
        updateLocalOrderStatus(localId, 'ready');
      }
      console.log(`📦 Local order all items marked ready locally: ${kotId}`);
      return;
    }

    try {
      await markAllItemsReady(Number(kotId));
    } catch (err) {
      console.error('Failed to mark all items ready:', err);
    } finally {
      refreshKots();
    }
  }, [refreshKots]);

  const staffName = userEmail ? userEmail.split('@')[0].replace(/^\w/, (c) => c.toUpperCase()) : 'Pavan';

  return (
    <StaffOrderContext.Provider value={{
      cart, orderType, tableLabel, paymentMethod,
      setOrderType: setOrderTypeAndSyncPrices, setTableLabel, setPaymentMethod,
      addToCart, removeFromCart, updateQty, clearCart,
      kotOrders, loading, refreshKots, placeOrder, updateKotStatus, toggleItemReady, markAllKotItemsReady, toggleUrgent, cancelKotOrder,
      outletName, staffName,
    }}>
      {children}
    </StaffOrderContext.Provider>
  );
}
