import api from './api';

// ============================================
// CONFIGURATION & HELPERS
// ============================================

const OUTLET_STORAGE_KEY = 'gs_outlet_id';

export const getDefaultOutletId = () => {
  const stored = sessionStorage.getItem(OUTLET_STORAGE_KEY);
  const fromEnv = process.env.REACT_APP_DEFAULT_OUTLET_ID;
  const value = stored || fromEnv;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const setDefaultOutletId = (outletId) => {
  if (outletId) {
    sessionStorage.setItem(OUTLET_STORAGE_KEY, String(outletId));
  } else {
    sessionStorage.removeItem(OUTLET_STORAGE_KEY);
  }
};

const withOutlet = (outletId) => ({
  params: { outletId: outletId ?? getDefaultOutletId() }
});

// ============================================
// ORDER TYPES & CONSTANTS
// ============================================

export const ORDER_TYPES = {
  DINE_IN: 'dine',
  PARCEL: 'parcel',
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  ONLINE: 'online',
};

const ORDER_RATES = {
  dine: { serviceChargeRate: 0.1, gstRate: 0.05, packingCharge: 0, deliveryCharge: 0 },
  parcel: { serviceChargeRate: 0, gstRate: 0.18, packingCharge: 20, deliveryCharge: 30 },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const roundMoney = (value) => Math.round(Number(value) * 100) / 100;

export const mapOrderType = (type) => {
  if (type === 'dine-in' || type === 'dine_in' || type === 'dine') return ORDER_TYPES.DINE_IN;
  if (type === 'parcel' || type === 'takeaway') return ORDER_TYPES.PARCEL;
  return type;
};

export const mapDiscountType = (type) => {
  if (!type || type === 'pct' || type === 'percentage') return 'pct';
  if (type === 'flat' || type === 'fixed') return 'flat';
  return type;
};

export const applyDiscount = ({ subtotal, discount = {}, orderType = ORDER_TYPES.DINE_IN }) => {
  const normalizedType = mapOrderType(orderType);
  const discountInput = {
    type: mapDiscountType(discount.type),
    value: Number(discount.value) || 0,
  };

  const baseSubtotal = roundMoney(subtotal);
  let discountAmount = 0;

  if (discountInput.value > 0) {
    if (discountInput.type === 'pct') {
      discountAmount = roundMoney((baseSubtotal * discountInput.value) / 100);
    } else {
      discountAmount = roundMoney(Math.min(discountInput.value, baseSubtotal));
    }
  }

  const afterDiscount = roundMoney(baseSubtotal - discountAmount);
  const total = afterDiscount;

  return {
    subtotal: baseSubtotal,
    discount: discountInput,
    discountAmount,
    afterDiscount,
    packingCharge: 0,
    deliveryCharge: 0,
    serviceCharge: 0,
    gst: 0,
    gstAmount: 0,
    total,
    totalAmount: total,
  };
};

export const clearCurrentOrder = () => ({
  items: [],
  discount: { value: 0, type: 'pct' },
  orderType: ORDER_TYPES.DINE_IN,
  specialInstructions: '',
});

export const buildOrderPayload = ({
  items = [],
  orderType = ORDER_TYPES.DINE_IN,
  paymentMethod = PAYMENT_METHODS.CASH,
  discount = { value: 0, type: 'pct' },
  outletId,
  isUrgent = false,
}) => {
  const normalizedType = mapOrderType(orderType);

  const apiItems = items.map((item) => {
    const dishId = Number(item.dishId ?? item.dish_id ?? item.id);
    const quantity = Number(item.qty ?? item.quantity ?? 1);
    if (!Number.isInteger(dishId) || dishId <= 0) {
      throw new Error(`Invalid menu item in cart: "${item.name || 'unknown'}" — missing dish ID`);
    }
    return {
      dishId,
      quantity,
      specialInstructions: item.specialInstructions || item.note || null,
    };
  });

  const payload = {
    orderType: normalizedType,
    paymentMethod,
    items: apiItems,
    discount: {
      type: mapDiscountType(discount.type),
      value: Number(discount.value) || 0,
    },
    isUrgent: Boolean(isUrgent),
  };

  const resolvedOutletId = outletId ?? getDefaultOutletId();
  if (resolvedOutletId) {
    payload.outletId = Number(resolvedOutletId);
  }

  return payload;
};

// ============================================
// MENU & CATEGORY APIS
// ============================================

export const getCategories = async (config = {}) => {
  const result = await api.get('/pos/categories', config);
  return result.data?.data ?? result.data ?? result;
};

export const getAllDishes = async ({
  outletId,
  orderType = ORDER_TYPES.DINE_IN,
  available,
  categoryId,
  search,
  veg,
} = {}) => {
  const result = await api.get('/pos/dishes', {
    params: {
      outletId: outletId ?? getDefaultOutletId(),
      orderType: mapOrderType(orderType),
      ...(available != null && { available: String(available) }),
      ...(categoryId != null && { categoryId }),
      ...(search && { q: search }),
      ...(veg != null && { veg: String(veg) }),
    },
  });
  return result.data?.data ?? result.data ?? result;
};

export const getDishesByCategory = async (categoryId, options = {}) => {
  const { outletId, orderType, available } = options;
  const result = await api.get(`/pos/categories/${categoryId}/dishes`, {
    params: {
      outletId: outletId ?? getDefaultOutletId(),
      orderType: mapOrderType(orderType || ORDER_TYPES.DINE_IN),
      ...(available != null && { available: String(available) }),
    },
  });
  return result.data?.data ?? result.data ?? result;
};

export const searchDishes = async (searchText, options = {}) => {
  const query = (searchText || '').trim();
  if (!query) {
    throw new Error('Search text is required');
  }

  const { outletId, orderType, available } = options;
  const result = await api.get('/pos/dishes/search', {
    params: {
      q: query,
      outletId: outletId ?? getDefaultOutletId(),
      orderType: mapOrderType(orderType || ORDER_TYPES.DINE_IN),
      ...(available != null && { available: String(available) }),
    },
  });
  return result.data?.data ?? result.data ?? result;
};

// ============================================
// ORDER APIS
// ============================================

export const createOrder = async (orderData) => {
  const payload = orderData?.items?.length && orderData?.paymentMethod && orderData?.orderType
    ? orderData
    : buildOrderPayload(orderData);

  const result = await api.post('/pos/orders', payload);
  return result.data?.data ?? result.data ?? result;
};

export const getOrderDetails = async (orderId, outletId) => {
  const result = await api.get(`/pos/orders/${orderId}`, {
    params: { outletId: outletId ?? getDefaultOutletId() }
  });
  return result.data?.data ?? result.data ?? result;
};

export const cancelOrderById = async (orderId, outletId) => {
  const result = await api.post(`/pos/orders/${orderId}/cancel`, {}, {
    params: { outletId: outletId ?? getDefaultOutletId() }
  });
  return result.data?.data ?? result.data ?? result;
};

// ============================================
// ADD THIS ALIAS FOR COMPATIBILITY
// ============================================
export const cancelOrder = cancelOrderById; // Alias for KOTPage compatibility

export const placeCashOrder = async (orderData) => {
  const payload = buildOrderPayload({
    ...orderData,
    paymentMethod: PAYMENT_METHODS.CASH,
  });
  return createOrder(payload);
};

export const placeOnlineOrder = async (orderData) => {
  const payload = buildOrderPayload({
    ...orderData,
    paymentMethod: PAYMENT_METHODS.ONLINE,
  });
  return createOrder(payload);
};

// ============================================
// KOT APIS (Kitchen Order Tickets)
// ============================================

export const getKOTTickets = async (outletId) => {
  const result = await api.get('/pos/kots', {
    params: {
      outletId: outletId ?? getDefaultOutletId(),
      active: 'true',
    },
  });
  return result.data?.data ?? result.data ?? result;
};

export const getPendingKOTs = async (outletId) => {
  const result = await api.get('/pos/kots/pending', {
    params: { outletId: outletId ?? getDefaultOutletId() }
  });
  return result.data?.data ?? result.data ?? result;
};

export const getReadyKOTs = async (outletId) => {
  const result = await api.get('/pos/kots/ready', {
    params: { outletId: outletId ?? getDefaultOutletId() }
  });
  return result.data?.data ?? result.data ?? result;
};

export const markItemReady = async (kotId, itemId, isReady = true, outletId) => {
  const result = await api.patch(`/pos/kots/${kotId}/items/${itemId}/ready`, 
    { isReady },
    { params: { outletId: outletId ?? getDefaultOutletId() } }
  );
  return result.data?.data ?? result.data ?? result;
};

export const markAllItemsReady = async (kotId, outletId) => {
  const result = await api.patch(`/pos/kots/${kotId}/ready`, {},
    { params: { outletId: outletId ?? getDefaultOutletId() } }
  );
  return result.data?.data ?? result.data ?? result;
};

export const dispatchOrder = async (kotId, outletId) => {
  const result = await api.post(`/pos/kots/${kotId}/dispatch`, {},
    { params: { outletId: outletId ?? getDefaultOutletId() } }
  );
  return result.data?.data ?? result.data ?? result;
};

// ============================================
// DASHBOARD APIS
// ============================================

let dashboardStatsCache = null;
let dashboardStatsCacheTime = 0;
const DASHBOARD_CACHE_MS = 5000;

export const getDashboardStats = async (outletId, { useCache = true } = {}) => {
  const now = Date.now();
  if (useCache && dashboardStatsCache && now - dashboardStatsCacheTime < DASHBOARD_CACHE_MS) {
    return dashboardStatsCache;
  }

  const result = await api.get('/pos/dashboard/stats', {
    params: { outletId: outletId ?? getDefaultOutletId() }
  });
  const stats = result.data?.data ?? result.data ?? result;

  dashboardStatsCache = stats;
  dashboardStatsCacheTime = now;

  return stats;
};

export const getOpenOrdersCount = async (outletId) => {
  const stats = await getDashboardStats(outletId);
  return stats.activeOrdersCount ?? 0;
};

export const getTodaySales = async (outletId) => {
  const stats = await getDashboardStats(outletId);
  return stats.todayTotalSales ?? 0;
};

export const getTodayOrders = async (outletId) => {
  const stats = await getDashboardStats(outletId);
  return stats.todayTotalOrders ?? 0;
};

export default api;