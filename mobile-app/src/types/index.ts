/**
 * types/index.ts
 * ──────────────
 * Shared TypeScript interfaces and types for the entire app.
 */

// ── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  email: string;
  role: 'Admin' | 'Staff';
}

// ── Dishes ──────────────────────────────────────────────────────────────────
export interface Dish {
  id: number;
  name: string;
  cat: string;
  dine: number;
  parcel: number;
  swiggy: number | null;
  zomato: number | null;
  ingredients: string[];
  outlets: string[];
  image_url?: string | null;
}

// ── Outlets & Users ─────────────────────────────────────────────────────────
export type AppRole = 'Admin' | 'Staff';

export interface ScreenPermissions {
  admin: string[];
  staff: string[];
}

export interface OutletUser {
  id: number;
  name: string;
  email: string;
  username: string;
  password: string;
  roleLabel: string;
  appRole: AppRole;
  permissions: ScreenPermissions;
  status: 'active' | 'inactive';
}

export interface Outlet {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager: string;
  email: string;
  username: string;
  password: string;
  status: 'active' | 'inactive';
  users: OutletUser[];
  image_url?: string | null;
}

// ── Accounting ──────────────────────────────────────────────────────────────
export type TxnStatus = 'paid' | 'pending' | 'due';

export interface Transaction {
  id: string;
  amount: string;
  order: string;
  delivery: string;
  payment: string;
  bill: boolean;
  status: TxnStatus;
}

// ── Dashboard ───────────────────────────────────────────────────────────────
export type DashboardPeriod = 'today' | 'yesterday' | 'week' | 'month';

// ── Navigation ──────────────────────────────────────────────────────────────
export type AdminTabParamList = {
  Dashboard: undefined;
  Dishes: undefined;
  Reports: undefined;
  Accounting: undefined;
  Outlets: undefined;
};

export type StaffTabParamList = {
  POS: undefined;
  KOT: undefined;
  LiveOrders: undefined;
  Reports: undefined;
  Menu: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  AdminTabs: undefined;
  StaffTabs: undefined;
};

// ── Staff — Orders & Cart ────────────────────────────────────────────────────
export type OrderType = 'dine-in' | 'parcel' | 'swiggy' | 'zomato';
export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Online';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'dispatched' | 'cancelled';
export type KotItemStatus = 'pending' | 'ready';

export interface CartItem {
  id: number;
  name: string;
  emoji: string;
  price: number;
  qty: number;
  dine_price?: number;
  parcel_price?: number;
  image_url?: string | null;
}

export interface KotOrder {
  id: string;
  orderId?: number;
  orderNumber?: string;
  kotNumber: string;
  orderType: OrderType;
  tableLabel: string;
  items: CartItem[];
  status: OrderStatus;
  isUrgent: boolean;
  paymentMethod: PaymentMethod;
  subtotal: number;
  gst: number;
  total: number;
  createdAt: Date;
  itemStatuses: Record<number, KotItemStatus>; // itemId → status
}

// ── Staff — Live Orders ──────────────────────────────────────────────────────
export type Platform = 'Swiggy' | 'Zomato';
export type LiveOrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'picked_up';

export interface LiveOrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface LiveOrder {
  id: string;
  platform: Platform;
  orderId: string;
  customerName: string;
  customerPhone: string;
  items: LiveOrderItem[];
  total: number;
  etaMinutes: number;
  status: LiveOrderStatus;
  createdAt: Date;
  specialInstructions?: string;
}

// ── Staff — Customers ────────────────────────────────────────────────────────
export interface StaffCustomer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string;
  favoriteDish: string;
  orderHistory: { date: string; amount: number; items: string }[];
}
