/**
 * LiveOrdersScreen.tsx
 * ─────────────────────
 * All-in-one Live Orders page containing:
 *   ① Stat cards  — Total Orders, Pending, Preparing, Ready, Completed  (from KOT context)
 *   ② Tab switcher — "Live Orders" | "Menu Manager"
 *   ③ Live Orders  — Swiggy / Zomato order cards with Accept / Reject / progress
 *   ④ Menu Manager — searchable menu grid with category filter
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, TextInput, Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import { LiveOrder, LiveOrderStatus, Platform as OrderPlatform } from '../../types';
import { DEFAULT_MENU_ITEMS } from '../../constants/menu';
import { useStaffOrder } from '../../context/StaffOrderContext';


const STAFF_GREEN  = '#16A34A';
const SWIGGY_COLOR = '#FF5200';
const ZOMATO_COLOR = '#E23744';
const { width: W } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Stat card config
// ─────────────────────────────────────────────────────────────────────────────
const STAT_CARDS = [
  { key: 'total',     label: 'Total Orders', iconName: 'clipboard-outline',       bg: '#F1F5F9', numColor: '#0F172A' },
  { key: 'pending',   label: 'Pending',      iconName: 'time-outline',             bg: '#FFF7ED', numColor: '#C2410C' },
  { key: 'preparing', label: 'Preparing',    iconName: 'restaurant-outline',       bg: '#EFF6FF', numColor: '#1D4ED8' },
  { key: 'ready',     label: 'Ready',        iconName: 'checkmark-circle-outline', bg: '#F0FDF4', numColor: STAFF_GREEN },
  { key: 'completed', label: 'Completed',    iconName: 'rocket-outline',           bg: '#F5F3FF', numColor: '#7C3AED' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Live Orders helpers
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_ORDERS: LiveOrder[] = [
  {
    id: '1', platform: 'Swiggy', orderId: 'SWG-98234',
    customerName: 'Rohit Sharma', customerPhone: '+91 98765 43210',
    items: [
      { name: 'Paneer Cheesy Grilled (Jumbo)', qty: 2, price: 170 },
      { name: 'French Fries',                  qty: 1, price: 90  },
    ],
    total: 430, etaMinutes: 35, status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60000),
    specialInstructions: 'Less spicy please',
  },
  {
    id: '2', platform: 'Zomato', orderId: 'ZMT-45610',
    customerName: 'Priya Patel', customerPhone: '+91 87654 32109',
    items: [
      { name: 'Gupta Special Panini', qty: 1, price: 200 },
      { name: 'Mint Mojito Blast',    qty: 2, price: 90  },
    ],
    total: 380, etaMinutes: 25, status: 'accepted',
    createdAt: new Date(Date.now() - 8 * 60000),
  },
  {
    id: '3', platform: 'Swiggy', orderId: 'SWG-98301',
    customerName: 'Arjun Mehta', customerPhone: '+91 76543 21098',
    items: [
      { name: 'Traditional Gupta Style Pizza (9 Inch)', qty: 1, price: 250 },
      { name: 'Cold Coffee',                            qty: 2, price: 100 },
    ],
    total: 450, etaMinutes: 40, status: 'preparing',
    createdAt: new Date(Date.now() - 15 * 60000),
  },
  {
    id: '4', platform: 'Zomato', orderId: 'ZMT-45720',
    customerName: 'Sneha Joshi', customerPhone: '+91 65432 10987',
    items: [
      { name: 'Veg Cheese Burger',  qty: 3, price: 75 },
      { name: 'Garlic Bread (4 pcs)', qty: 1, price: 90 },
    ],
    total: 315, etaMinutes: 20, status: 'ready',
    createdAt: new Date(Date.now() - 22 * 60000),
  },
  {
    id: '5', platform: 'Swiggy', orderId: 'SWG-98400',
    customerName: 'Vikram Singh', customerPhone: '+91 54321 09876',
    items: [{ name: 'Paneer Tikka Panini', qty: 2, price: 170 }],
    total: 340, etaMinutes: 30, status: 'picked_up',
    createdAt: new Date(Date.now() - 35 * 60000),
  },
];

const STATUS_FLOW: LiveOrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'picked_up'];
const ORDER_STATUS_CFG: Record<LiveOrderStatus, { label: string; iconName: string; color: string; bg: string }> = {
  pending:   { label: 'New Order', iconName: 'notifications-outline',  color: '#C2410C', bg: '#FFEDD5' },
  accepted:  { label: 'Accepted',  iconName: 'checkmark-circle-outline', color: '#1D4ED8', bg: '#DBEAFE' },
  preparing: { label: 'Preparing', iconName: 'restaurant-outline',      color: '#9333EA', bg: '#F3E8FF' },
  ready:     { label: 'Ready',     iconName: 'rocket-outline',           color: STAFF_GREEN, bg: '#DCFCE7' },
  picked_up: { label: 'Picked Up', iconName: 'bicycle-outline',         color: '#6B7280', bg: '#F3F4F6' },
};

// Icon names for advance-status buttons
const NEXT_ICON: Record<LiveOrderStatus, { lib: 'Ionicons' | 'MaterialIcons'; name: string }> = {
  pending:   { lib: 'Ionicons',      name: 'checkmark-circle-outline' },
  accepted:  { lib: 'MaterialIcons', name: 'soup-kitchen' },
  preparing: { lib: 'Ionicons',      name: 'checkmark-done-circle-outline' },
  ready:     { lib: 'Ionicons',      name: 'bicycle-outline' },
  picked_up: { lib: 'Ionicons',      name: '' },
};

function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`;
}
function nextStatus(cur: LiveOrderStatus): LiveOrderStatus | null {
  const i = STATUS_FLOW.indexOf(cur);
  return i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
}
const NEXT_LABEL: Record<LiveOrderStatus, string> = {
  pending: 'Accept', accepted: 'Start Preparing',
  preparing: 'Mark Ready', ready: 'Mark Picked Up', picked_up: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Menu helpers
// ─────────────────────────────────────────────────────────────────────────────
type MenuItem = typeof DEFAULT_MENU_ITEMS[0];

const ALL_CATS = ['All', ...Array.from(new Set(DEFAULT_MENU_ITEMS.map(i => i.cat)))];

const CAT_EMOJI: Record<string, string> = {
  'Grilled Sandwiches':       '🥪',
  'Special Grilled / Panini': '🍞',
  'Sandwiches':               '🥙',
  'Panini (Multi-grain)':     '🌾',
  'Pizza':                    '🍕',
  'Burgers':                  '🍔',
  'Appetizers':               '🍟',
  'Mocktails':                '🍹',
  'Shakes & Smoothies':       '🥤',
  'Combos':                   '📦',
  'Party Combo Boxes':        '🎉',
  'Extra Add-ons':            '➕',
};

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function LiveOrdersScreen() {
  const { kotOrders } = useStaffOrder();

  // ── KOT stats ──────────────────────────────────────────────────────────────
  const stats = {
    total:     kotOrders.length,
    pending:   kotOrders.filter(k => k.status === 'pending').length,
    preparing: kotOrders.filter(k => k.status === 'preparing').length,
    ready:     kotOrders.filter(k => k.status === 'ready').length,
    completed: kotOrders.filter(k => k.status === 'dispatched').length,
  };

  // ── Internal tab ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'live' | 'menu'>('live');

  // ── Live orders state ──────────────────────────────────────────────────────
  const [orders, setOrders]   = useState<LiveOrder[]>(MOCK_ORDERS);
  const [platFilter, setPlatFilter] = useState<'All' | OrderPlatform>('All');

  const filteredOrders = platFilter === 'All'
    ? orders : orders.filter(o => o.platform === platFilter);

  const advanceStatus = (id: string) =>
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const next = nextStatus(o.status);
      return next ? { ...o, status: next } : o;
    }));

  const rejectOrder = (id: string) =>
    setOrders(prev => prev.filter(o => o.id !== id));

  // ── Menu state ─────────────────────────────────────────────────────────────
  const [menuSearch, setMenuSearch] = useState('');
  const [activeCat,  setActiveCat]  = useState('All');

  const filteredMenu = useMemo(() => {
    let items = DEFAULT_MENU_ITEMS;
    if (activeCat !== 'All') items = items.filter(i => i.cat === activeCat);
    if (menuSearch.trim()) {
      const q = menuSearch.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [menuSearch, activeCat]);

  // ── Render live order card ─────────────────────────────────────────────────
  const renderOrderCard = ({ item: order }: { item: LiveOrder }) => {
    const cfg       = ORDER_STATUS_CFG[order.status];
    const platColor = order.platform === 'Swiggy' ? SWIGGY_COLOR : ZOMATO_COLOR;
    const nextBtn   = NEXT_LABEL[order.status];

    const iconCfg = NEXT_ICON[order.status];

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={[styles.cardHeader, { borderLeftColor: platColor }]}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.platBadge, { backgroundColor: platColor + '20' }]}>
              {order.platform === 'Swiggy'
                ? <MaterialCommunityIcons name="fire" size={13} color={platColor} style={{ marginRight: 3 }} />
                : <MaterialCommunityIcons name="lightning-bolt" size={13} color={platColor} style={{ marginRight: 3 }} />
              }
              <Text style={[styles.platBadgeText, { color: platColor }]}>{order.platform}</Text>
            </View>
            <View style={styles.orderIdRow}>
              <Ionicons name="receipt-outline" size={11} color={Colors.textMuted} style={{ marginRight: 3 }} />
              <Text style={styles.orderId}>{order.orderId}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.iconName as any} size={12} color={cfg.color} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{order.customerName.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.customerNameRow}>
              <Ionicons name="person-outline" size={12} color={Colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.customerName}>{order.customerName}</Text>
            </View>
            <View style={styles.customerPhoneRow}>
              <Ionicons name="call-outline" size={11} color={Colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.customerPhone}>{order.customerPhone}</Text>
            </View>
          </View>
          <View style={styles.etaBox}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.etaLabel}>ETA</Text>
            <Text style={styles.etaVal}>{order.etaMinutes}m</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsBox}>
          <View style={styles.itemsHeaderRow}>
            <MaterialIcons name="restaurant-menu" size={13} color={Colors.textMuted} style={{ marginRight: 5 }} />
            <Text style={styles.itemsHeaderText}>Order Items</Text>
          </View>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.itemQtyBadge}>
                <Text style={styles.itemQty}>×{item.qty}</Text>
              </View>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price * item.qty}</Text>
            </View>
          ))}
          {order.specialInstructions && (
            <View style={styles.specialRow}>
              <Ionicons name="information-circle-outline" size={13} color='#F59E0B' />
              <Text style={styles.specialText}>{order.specialInstructions}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View>
            <View style={styles.totalLabelRow}>
              <MaterialIcons name="payments" size={13} color={Colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={styles.totalLabel}>Total</Text>
            </View>
            <Text style={styles.totalVal}>₹{order.total}</Text>
            <View style={styles.timeAgoRow}>
              <Ionicons name="time-outline" size={11} color={Colors.textLight} style={{ marginRight: 3 }} />
              <Text style={styles.timeAgo}>{timeAgo(order.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            {order.status === 'pending' && (
              <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectOrder(order.id)} activeOpacity={0.8}>
                <Ionicons name="close-circle-outline" size={14} color={Colors.red} style={{ marginRight: 4 }} />
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
            )}
            {nextBtn ? (
              <TouchableOpacity
                style={[styles.acceptBtn, { backgroundColor: platColor }]}
                onPress={() => advanceStatus(order.id)} activeOpacity={0.85}
              >
                {iconCfg.lib === 'Ionicons' && iconCfg.name ? (
                  <Ionicons name={iconCfg.name as any} size={14} color="#fff" style={{ marginRight: 5 }} />
                ) : iconCfg.lib === 'MaterialIcons' && iconCfg.name ? (
                  <MaterialIcons name={iconCfg.name as any} size={14} color="#fff" style={{ marginRight: 5 }} />
                ) : null}
                <Text style={styles.acceptText}>{nextBtn}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.doneChip}>
                <Ionicons name="checkmark-circle" size={16} color={STAFF_GREEN} />
                <Text style={styles.doneText}>Done</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ── Render menu item card ──────────────────────────────────────────────────
  const renderMenuItem = ({ item }: { item: typeof DEFAULT_MENU_ITEMS[0] }) => (
    <View style={styles.menuCard}>
      <View style={[styles.vegDot, { backgroundColor: item.veg ? STAFF_GREEN : '#EF4444' }]} />
      <MaterialIcons name="restaurant" size={24} color={Colors.textMuted} />
      <Text style={styles.menuName} numberOfLines={2}>{item.name}</Text>
      <View style={styles.menuFooterRow}>
        <Text style={styles.menuPrice}>₹{item.price}</Text>
        <View style={[styles.vegBadge, { backgroundColor: item.veg ? '#F0FDF4' : '#FEF2F2' }]}>
          <Text style={[styles.vegBadgeText, { color: item.veg ? STAFF_GREEN : '#EF4444' }]}>
            {item.veg ? 'VEG' : 'N-VEG'}
          </Text>
        </View>
      </View>
    </View>
  );

  // ── Shared FlatList header (stat cards + tab switcher + tab-specific toolbar)
  const ListHeader = () => (
    <View>
      {/* ── Stat cards ────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statScroll}
        contentContainerStyle={styles.statContent}
      >
        {STAT_CARDS.map(card => (
          <View key={card.key} style={[styles.statCard, { backgroundColor: card.bg }]}>
            <Ionicons name={card.iconName as any} size={20} color={card.numColor} style={{ marginBottom: 4 }} />
            <Text style={[styles.statNum, { color: card.numColor }]}>
              {stats[card.key as keyof typeof stats]}
            </Text>
            <Text style={styles.statLabel}>{card.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ── Internal tab switcher ─────────────────────────────────── */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'live' && styles.tabBtnActive]}
          onPress={() => setActiveTab('live')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'live' ? 'flash' : 'flash-outline'}
            size={15}
            color={activeTab === 'live' ? STAFF_GREEN : Colors.textMuted}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.tabBtnText, activeTab === 'live' && styles.tabBtnTextActive]}>
            Live Orders
          </Text>
          {orders.filter(o => o.status === 'pending').length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {orders.filter(o => o.status === 'pending').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'menu' && styles.tabBtnActive]}
          onPress={() => setActiveTab('menu')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'menu' ? 'grid' : 'grid-outline'}
            size={15}
            color={activeTab === 'menu' ? STAFF_GREEN : Colors.textMuted}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.tabBtnText, activeTab === 'menu' && styles.tabBtnTextActive]}>
            Menu Manager
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Tab-specific toolbars ─────────────────────────────────── */}
      {activeTab === 'live' ? (
        /* Platform filter pills */
        <View style={styles.platRow}>
          {(['All', 'Swiggy', 'Zomato'] as const).map(p => {
            const count =
              p === 'All' ? orders.length
              : p === 'Swiggy' ? orders.filter(o => o.platform === 'Swiggy').length
              : orders.filter(o => o.platform === 'Zomato').length;
            const isActive = platFilter === p;
            const col = p === 'Swiggy' ? SWIGGY_COLOR : p === 'Zomato' ? ZOMATO_COLOR : Colors.dark;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.platPill, isActive && { backgroundColor: col, borderColor: col }]}
                onPress={() => setPlatFilter(p)}
                activeOpacity={0.8}
              >
                {p === 'All' && <MaterialIcons name="all-inclusive" size={13} color={isActive ? '#fff' : Colors.textMuted} style={{ marginRight: 4 }} />}
                {p === 'Swiggy' && <MaterialCommunityIcons name="fire" size={13} color={isActive ? '#fff' : SWIGGY_COLOR} style={{ marginRight: 4 }} />}
                {p === 'Zomato' && <MaterialCommunityIcons name="lightning-bolt" size={13} color={isActive ? '#fff' : ZOMATO_COLOR} style={{ marginRight: 4 }} />}
                <Text style={[styles.platText, isActive && styles.platTextActive]}>
                  {p}{count > 0 ? ` (${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        /* Menu search + category pills */
        <View>
          <View style={styles.menuSearchRow}>
            <Ionicons name="search-outline" size={15} color={Colors.textMuted} style={{ marginRight: 7 }} />
            <TextInput
              style={styles.menuSearchInput}
              placeholder="Search dishes..."
              placeholderTextColor={Colors.textLight}
              value={menuSearch}
              onChangeText={setMenuSearch}
            />
            {menuSearch ? (
              <TouchableOpacity onPress={() => setMenuSearch('')}>
                <Ionicons name="close-circle" size={15} color={Colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catScroll}
            contentContainerStyle={styles.catContent}
          >
            {ALL_CATS.map(cat => {
              const isActive = activeCat === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPill, isActive && styles.catPillActive]}
                  onPress={() => setActiveCat(cat)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={cat === 'All' ? 'restaurant-outline' : 'pricetag-outline'} size={13} color={isActive ? STAFF_GREEN : Colors.textMuted} />
                  <Text style={[styles.catText, isActive && styles.catTextActive]}>
                    {cat === 'All' ? 'All' : cat.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  if (activeTab === 'live') {
    return (
      <View style={styles.root}>
        {/* key="live-list" forces full remount when switching from menu tab,
            preventing the "Changing numColumns on the fly" crash */}
        <FlatList
          key="live-list"
          data={filteredOrders}
          keyExtractor={o => o.id}
          ListHeaderComponent={<ListHeader />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderOrderCard}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="fast-food-outline" size={52} color={Colors.textLight} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No live orders</Text>
              <Text style={styles.emptySub}>
                {platFilter === 'All'
                  ? 'New orders from Swiggy & Zomato will appear here'
                  : `No ${platFilter} orders right now`}
              </Text>
            </View>
          }
        />
      </View>
    );
  }

  // Menu tab
  return (
    <View style={styles.root}>
      <FlatList
        key="menu-list"
        data={filteredMenu}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={styles.menuGridContent}
        columnWrapperStyle={styles.menuRow}
        showsVerticalScrollIndicator={false}
        renderItem={renderMenuItem}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="search-outline" size={44} color={Colors.textLight} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySub}>Try a different category or search</Text>
          </View>
        }
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  listContent: { paddingBottom: 32 },
  // Menu grid — adds side padding so cards don't kiss the screen edges
  menuGridContent: { paddingHorizontal: 10, paddingBottom: 32 },
  menuRow: { gap: 10, marginBottom: 10 },

  // ── Stat cards
  statScroll: {
    flexGrow: 0,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  statCard: {
    width: 88, borderRadius: 14,
    paddingVertical: 10, paddingHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statNum: { fontSize: 22, fontWeight: FontWeight.bold, lineHeight: 26 },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 3, textAlign: 'center' },

  // ── Internal tab switcher
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 10,
    backgroundColor: Colors.bg,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  tabBtnActive: { backgroundColor: '#F0FDF4', borderColor: STAFF_GREEN },
  tabBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  tabBtnTextActive: { color: STAFF_GREEN, fontWeight: FontWeight.bold },
  tabBadge: {
    marginLeft: 6,
    backgroundColor: '#EF4444', borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  tabBadgeText: { fontSize: 10, color: '#fff', fontWeight: FontWeight.bold },

  // ── Platform filter (live tab)
  platRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  platPill: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: 10, backgroundColor: Colors.bg,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  platText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  platTextActive: { color: '#fff' },

  // ── Order cards
  listContent2: { padding: 12, gap: 12 },
  card: {
    marginHorizontal: 12, marginBottom: 12,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    borderLeftWidth: 4, backgroundColor: '#FAFAF9',
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  platBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  platBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  orderIdRow: { flexDirection: 'row', alignItems: 'center' },
  orderId: { fontSize: FontSize.xs, color: Colors.textMuted },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  customerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    gap: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text },
  customerNameRow: { flexDirection: 'row', alignItems: 'center' },
  customerName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  customerPhoneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  customerPhone: { fontSize: FontSize.xs, color: Colors.textMuted },
  etaBox: { marginLeft: 'auto', alignItems: 'center' },
  etaLabel: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  etaVal: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },

  itemsBox: { paddingHorizontal: 14, paddingVertical: 8 },
  itemsHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemsHeaderText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight,
  },
  itemQtyBadge: { backgroundColor: Colors.bg, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: Colors.border },
  itemQty: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted },
  itemName: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  itemPrice: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  specialRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, backgroundColor: '#FFFBEB', padding: 6, borderRadius: 8 },
  specialText: { fontSize: FontSize.xs, color: '#92400E', fontStyle: 'italic', flex: 1 },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 0.5, borderTopColor: Colors.border,
    backgroundColor: '#FAFAF9',
  },
  totalLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 1 },
  totalLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  totalVal: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  timeAgoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  timeAgo: { fontSize: FontSize.xs, color: Colors.textLight },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rejectBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5',
  },
  rejectText: { fontSize: FontSize.xs, color: Colors.red, fontWeight: FontWeight.bold },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  acceptText: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },
  doneChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneText: { fontSize: FontSize.xs, color: STAFF_GREEN, fontWeight: FontWeight.semibold },

  // ── Menu tab toolbar
  menuSearchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 12, marginTop: 10,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 10, paddingVertical: 9,
  },
  menuSearchInput: { flex: 1, fontSize: FontSize.sm, color: Colors.text },

  catScroll: { flexGrow: 0, marginTop: 8 },
  catContent: { paddingHorizontal: 12, paddingBottom: 10, gap: 6, alignItems: 'center' },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  catPillActive: { backgroundColor: '#F0FDF4', borderColor: STAFF_GREEN },
  catEmoji: { fontSize: 13 },
  catText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  catTextActive: { color: STAFF_GREEN, fontWeight: FontWeight.bold },

  // ── Menu grid cards
  menuCard: {
    flex: 1,
    backgroundColor: Colors.surface, borderRadius: 12,
    padding: 11, borderWidth: 1, borderColor: Colors.border,
    position: 'relative',
  },
  vegDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  menuEmoji: { fontSize: 26, marginBottom: 7 },
  menuName: { fontSize: FontSize.xs, color: Colors.text, fontWeight: FontWeight.semibold, lineHeight: 15, marginBottom: 7 },
  menuFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 },
  menuPrice: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  vegBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  vegBadgeText: { fontSize: 9, fontWeight: FontWeight.bold },

  // ── Empty states
  emptyWrap: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  emptySub: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 6, textAlign: 'center' },
});
