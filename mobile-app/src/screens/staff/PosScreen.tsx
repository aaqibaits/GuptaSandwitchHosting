/**
 * PosScreen.tsx
 * ─────────────
 * Staff Point-of-Sale screen.
 *
 * Layout (3 sections):
 *   ① Order header — Dine-in / Parcel toggle · Table selector · Payment method
 *   ② Menu grid   — Category filter pills · searchable item cards
 *   ③ Cart panel  — Line items, qty ±, discount, GST, total, Place Order
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, FlatList, Modal,
  Dimensions, KeyboardAvoidingView, Platform, SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import { DEFAULT_MENU_ITEMS } from '../../constants/menu';
import { useStaffOrder } from '../../context/StaffOrderContext';
import { OrderType, PaymentMethod } from '../../types';
import { getAvailableDishes, createOrder, PosDish } from '../../services/posApi';
import { ApiError, BASE_URL } from '../../services/api';
import VoiceBot from '../../components/staff/VoiceBot';

const { width: W } = Dimensions.get('window');
const STAFF_GREEN = '#16A34A';

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'UPI', 'Card', 'Online'];

const ALL_CATS = ['All', ...Array.from(new Set(DEFAULT_MENU_ITEMS.map(i => i.cat)))];

// MenuItem type unifying both local mock and API dish
interface MenuItem {
  id: number;
  name: string;
  cat: string;
  price: number;
  emoji: string;
  dine_price?: number;
  parcel_price?: number;
  image_url?: string | null;
}

function apiDishToMenuItem(d: PosDish): MenuItem {
  return {
    id: d.id,
    name: d.name,
    cat: d.category,
    price: d.dine_price ?? d.price,
    emoji: d.emoji ?? '🍔',
    dine_price: d.dine_price,
    parcel_price: d.parcel_price,
    image_url: d.image_url,
  };
}

export default function PosScreen() {
  const {
    cart, orderType, tableLabel, paymentMethod,
    setOrderType, setTableLabel, setPaymentMethod,
    addToCart, removeFromCart, updateQty, placeOrder,
    clearCart, refreshKots,
  } = useStaffOrder();

  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS as MenuItem[]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [allCats, setAllCats] = useState<string[]>(ALL_CATS);

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<'pct' | 'flat'>('pct');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastKot, setLastKot] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [placing, setPlacing] = useState(false);

  // Fullscreen image viewer state
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string; emoji: string } | null>(null);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);

  // Show a short voice feedback toast (auto-dismiss after 2.5 s)
  const showVoiceToast = useCallback((msg: string) => {
    setVoiceToast(msg);
    setTimeout(() => setVoiceToast(null), 2500);
  }, []);

  // ── Fetch real menu from API ───────────────────────────────────────────
  const fetchMenu = useCallback(async () => {
    setMenuLoading(true);
    try {
      const res = await getAvailableDishes();
      if (res.dishes?.length) {
        const items = res.dishes.map(apiDishToMenuItem);
        setMenuItems(items);
        const cats = ['All', ...Array.from(new Set(items.map(i => i.cat)))];
        setAllCats(cats);
      }
    } catch {
      // Keep fallback DEFAULT_MENU_ITEMS
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  // Filter menu and adjust price reactively to match active orderType
  const filtered = useMemo(() => {
    let items = menuItems;
    if (selectedCat !== 'All') items = items.filter(i => i.cat === selectedCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    return items.map(item => ({
      ...item,
      price: orderType === 'parcel'
        ? (item.parcel_price ?? item.price)
        : (item.dine_price ?? item.price),
    }));
  }, [search, selectedCat, menuItems, orderType]);

  // Cart totals (GST calculation disabled, set to 0)
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountNum = parseFloat(discountValue) || 0;
  const discountAmt = discountType === 'pct'
    ? Math.round((subtotal * discountNum / 100) * 100) / 100
    : Math.min(discountNum, subtotal);
  const taxable = subtotal - discountAmt;
  const gst = 0; // GST is disabled
  const total = taxable + gst;
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const handleDiscountTypeChange = (type: 'pct' | 'flat') => {
    setDiscountType(type);
    if (type === 'pct') {
      const num = parseFloat(discountValue) || 0;
      if (num > 100) {
        setDiscountValue('100');
      }
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    const discountPayload = {
      type: discountType,
      value: parseFloat(discountValue) || 0,
    };
    try {
      // Try real API first
      const res = await createOrder({
        order_type: orderType as 'dine-in' | 'parcel',
        table_label: tableLabel,
        payment_method: paymentMethod,
        discount: discountPayload,
        items: cart.map(c => ({ dish_id: c.id, qty: c.qty, unit_price: c.price })),
      });
      const kotNumber = res.kot?.kot_number ?? `K${Date.now()}`;
      setLastKot(kotNumber);
      clearCart();
      refreshKots();
    } catch {
      // Fallback: use local context only
      const kot = placeOrder(discountPayload);
      setLastKot(kot.kotNumber);
    } finally {
      setDiscountValue('');
      setDiscountType('pct');
      setShowCart(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setPlacing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Order header ─────────────────────────────────────────────── */}
      <View style={styles.orderHeader}>
        {/* Dine-in / Parcel toggle */}
        <View style={styles.toggleRow}>
          {(['dine-in', 'parcel'] as OrderType[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.toggleBtn, orderType === t && styles.toggleActive]}
              onPress={() => {
                setOrderType(t);
                if (t === 'parcel') setTableLabel('Parcel');
                else setTableLabel('Table 1');
              }}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                {t === 'dine-in'
                  ? <Ionicons name="people-outline" size={14} color={orderType === t ? '#fff' : Colors.textMuted} />
                  : <Ionicons name="cube-outline" size={14} color={orderType === t ? '#fff' : Colors.textMuted} />
                }
                <Text style={[styles.toggleText, orderType === t && styles.toggleTextActive]}>
                  {t === 'dine-in' ? 'Dine-in' : 'Parcel'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Table / Payment row */}
        <View style={styles.metaRow}>

          {/* Payment method */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.payScroll}
            contentContainerStyle={styles.payScrollContent}
          >
            {PAYMENT_METHODS.map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.payPill, paymentMethod === m && styles.payPillActive]}
                onPress={() => setPaymentMethod(m)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {m === 'Cash' && <Ionicons name="cash-outline" size={12} color={paymentMethod === m ? STAFF_GREEN : Colors.textMuted} />}
                  {m === 'UPI' && <Ionicons name="phone-portrait-outline" size={12} color={paymentMethod === m ? STAFF_GREEN : Colors.textMuted} />}
                  {m === 'Card' && <Ionicons name="card-outline" size={12} color={paymentMethod === m ? STAFF_GREEN : Colors.textMuted} />}
                  {m === 'Online' && <Ionicons name="globe-outline" size={12} color={paymentMethod === m ? STAFF_GREEN : Colors.textMuted} />}
                  <Text style={[styles.payPillText, paymentMethod === m && styles.payPillTextActive]}>
                    {m}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* ── Search bar ──────────────────────────────────────────── */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={13} color={Colors.textMuted} style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu..."
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={13} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Category pills ───────────────────────────────────────────── */}
      <View style={styles.catRowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRowContent}
        >
          {ALL_CATS.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, selectedCat === cat && styles.catPillActive]}
              onPress={() => setSelectedCat(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.catText, selectedCat === cat && styles.catTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Menu grid ────────────────────────────────────────────────── */}
      <FlatList
        style={styles.menuList}
        data={filtered}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.menuGrid}
        columnWrapperStyle={{ gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyMenu}>
            <Text style={styles.emptyMenuText}>No items match your search</Text>
          </View>
        }
        renderItem={({ item }) => {
          const inCart = cart.find(c => c.id === item.id);
          return (
            <TouchableOpacity
              style={[styles.menuCard, inCart && styles.menuCardActive]}
              onPress={() => addToCart({
                id: item.id,
                name: item.name,
                emoji: item.emoji,
                price: item.price,
                dine_price: item.dine_price,
                parcel_price: item.parcel_price,
                image_url: item.image_url,
              })}
              activeOpacity={0.8}
            >
              {/* Dish Image / Fallback Emoji */}
              {item.image_url ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setSelectedImage({ url: `${BASE_URL}${item.image_url}`, name: item.name, emoji: item.emoji })}
                  style={styles.menuImageContainer}
                >
                  <Image
                    source={{ uri: `${BASE_URL}${item.image_url}` }}
                    style={styles.menuImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.menuEmojiPlaceholder}>
                  <Ionicons name="fast-food-outline" size={32} color={STAFF_GREEN} />
                </View>
              )}

              <Text style={styles.menuName} numberOfLines={2}>{item.name}</Text>
              <View style={styles.menuFooter}>
                <Text style={styles.menuPrice}>₹{item.price}</Text>
                {inCart ? (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{inCart.qty}</Text>
                  </View>
                ) : (
                  <View style={styles.addBtn}>
                    <Ionicons name="add" size={14} color="#fff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Voice Bot FAB ────────────────────────────────────────── */}
      <VoiceBot
        dishes={menuItems}
        onAddItem={(item) => addToCart({
          id: item.id,
          name: item.name,
          emoji: item.emoji ?? '🍔',
          price: item.price,
          dine_price: item.dine_price,
          parcel_price: item.parcel_price,
        })}
        showToast={showVoiceToast}
      />

      {/* ── Cart FAB ─────────────────────────────────────────────────── */}
      {cartCount > 0 && (
        <TouchableOpacity style={styles.cartFab} onPress={() => setShowCart(true)} activeOpacity={0.9}>
          <View style={styles.cartFabLeft}>
            <View style={styles.cartFabBadge}>
              <Text style={styles.cartFabBadgeText}>{cartCount}</Text>
            </View>
            <Ionicons name="cart" size={20} color="#fff" />
            <Text style={styles.cartFabText}>View Cart</Text>
          </View>
          <Text style={styles.cartFabAmount}>₹{total}</Text>
        </TouchableOpacity>
      )}

      {/* ── Success toast ────────────────────────────────────────────── */}
      {showSuccess && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={18} color="#22C55E" style={{ marginRight: 6 }} />
          <Text style={styles.toastText}>KOT {lastKot} sent to kitchen!</Text>
        </View>
      )}

      {/* ── Voice toast ──────────────────────────────────────────────── */}
      {voiceToast && (
        <View style={[styles.toast, styles.voiceToast]}>
          <Text style={styles.toastText}>🎤 {voiceToast}</Text>
        </View>
      )}


      {/* ── Cart Modal ───────────────────────────────────────────────── */}
      <Modal
        visible={showCart}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowCart(false)}
      >
        {/* Full-screen wrapper */}
        <View style={styles.cartOverlay}>

          {/* Dim backdrop — tap to close */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowCart(false)}
          />

          {/* Bottom sheet */}
          <View style={styles.cartSheet}>
            {/* Drag handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.cartHeader}>
              <View style={styles.cartHeaderLeft}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="cart" size={18} color={STAFF_GREEN} />
                  <Text style={styles.cartTitle}>Cart</Text>
                </View>
                <View style={styles.cartCountBadge}>
                  <Text style={styles.cartCountText}>{cartCount} items</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCart(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Cart items — scrollable, flex:1 fills remaining space */}
            <ScrollView
              style={styles.cartItemsScroll}
              contentContainerStyle={styles.cartItemsContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {cart.length === 0 ? (
                <View style={styles.emptyCartWrap}>
                  <Ionicons name="cart-outline" size={44} color={Colors.textLight} style={{ marginBottom: 10 }} />
                  <Text style={styles.emptyCartText}>Cart is empty</Text>
                  <Text style={styles.emptyCartSub}>Tap items on the menu to add them</Text>
                </View>
              ) : (
                cart.map((item, idx) => (
                  <View
                    key={item.id}
                    style={[
                      styles.cartRow,
                      idx === cart.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    {/* Emoji */}
                    <View style={styles.cartEmojiBox}>
                      <Ionicons name="fast-food-outline" size={20} color={Colors.textMuted} />
                    </View>

                    {/* Name + unit price */}
                    <View style={styles.cartInfo}>
                      <Text style={styles.cartItemName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.cartItemPrice}>₹{item.price} × {item.qty}</Text>
                    </View>

                    {/* Qty stepper */}
                    <View style={styles.qtyControl}>
                      <TouchableOpacity
                        style={[styles.qtyBtn, item.qty === 1 && styles.qtyBtnDelete]}
                        onPress={() => updateQty(item.id, -1)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={item.qty === 1 ? 'trash-outline' : 'remove'}
                          size={13}
                          color={item.qty === 1 ? Colors.red : Colors.text}
                        />
                      </TouchableOpacity>
                      <Text style={styles.qtyNum}>{item.qty}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, 1)} activeOpacity={0.7}>
                        <Ionicons name="add" size={13} color={STAFF_GREEN} />
                      </TouchableOpacity>
                    </View>

                    {/* Line total */}
                    <Text style={styles.cartLineTotal}>₹{item.price * item.qty}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Totals + CTA — always visible at bottom */}
            <View style={styles.totalsBox}>
              {/* Discount */}
              <View style={styles.discountRow}>
                <Ionicons name="pricetag-outline" size={15} color={Colors.textMuted} style={{ marginRight: 6 }} />
                <Text style={styles.discountLabel}>Discount</Text>
                
                {/* Segmented Type Selector */}
                <View style={styles.discountTypeSelector}>
                  <TouchableOpacity
                    style={[styles.typeSelectBtn, discountType === 'pct' && styles.typeSelectBtnActive]}
                    onPress={() => handleDiscountTypeChange('pct')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.typeSelectText, discountType === 'pct' && styles.typeSelectTextActive]}>%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeSelectBtn, discountType === 'flat' && styles.typeSelectBtnActive]}
                    onPress={() => handleDiscountTypeChange('flat')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.typeSelectText, discountType === 'flat' && styles.typeSelectTextActive]}>₹</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.discountInput}
                  value={discountValue}
                  onChangeText={(val) => {
                    // If percentage type, cap at 100
                    const num = parseFloat(val) || 0;
                    if (discountType === 'pct' && num > 100) {
                      setDiscountValue('100');
                    } else {
                      setDiscountValue(val);
                    }
                  }}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              {/* Summary rows */}
              <View style={styles.summaryBox}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalVal}>₹{subtotal}</Text>
                </View>
                {discountAmt > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: Colors.green }]}>Discount</Text>
                    <Text style={[styles.totalVal, { color: Colors.green }]}>−₹{discountAmt}</Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>GST (5%)</Text>
                  <Text style={styles.totalVal}>₹{gst}</Text>
                </View>
              </View>

              <View style={styles.grandRow}>
                <Text style={styles.grandLabel}>Total</Text>
                <Text style={styles.grandVal}>₹{total}</Text>
              </View>

              <TouchableOpacity
                style={[styles.placeOrderBtn, cart.length === 0 && { opacity: 0.4 }]}
                onPress={handlePlaceOrder}
                disabled={cart.length === 0}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.placeOrderText}>Place Order & Send KOT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Fullscreen Image Viewer Modal ─────────────────────────────── */}
      <Modal
        visible={selectedImage !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSelectedImage(null)}
          />
          <View style={styles.imageModalContainer}>
            {selectedImage && (
              <>
                <Image
                  source={{ uri: selectedImage.url }}
                  style={styles.imageModalLarge}
                  resizeMode="contain"
                />
                <View style={styles.imageModalFooter}>
                  <Text style={styles.imageModalTitle}>
                    {selectedImage.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.imageModalCloseBtn}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // ── Order header
  orderHeader: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.bg,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: STAFF_GREEN, borderColor: STAFF_GREEN },
  toggleText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  toggleTextActive: { color: '#fff' },

  metaRow: { gap: 6 },
  tableScroll: { height: 36 },
  tableScrollContent: { alignItems: 'center' },
  tablePill: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, backgroundColor: Colors.bg,
    borderWidth: 1, borderColor: Colors.border, marginRight: 6,
  },
  tablePillActive: { backgroundColor: '#E0F2FE', borderColor: '#0EA5E9' },
  tablePillText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  tablePillTextActive: { color: '#0369A1', fontWeight: FontWeight.bold },

  payScroll: { height: 36 },
  payScrollContent: { alignItems: 'center' },
  payPill: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, backgroundColor: Colors.bg,
    borderWidth: 1, borderColor: Colors.border, marginRight: 6,
  },
  payPillActive: { backgroundColor: '#F0FDF4', borderColor: STAFF_GREEN },
  payPillText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  payPillTextActive: { color: STAFF_GREEN, fontWeight: FontWeight.bold },

  emptyMenu: { paddingTop: 60, alignItems: 'center' },
  emptyMenuText: { fontSize: FontSize.base, color: Colors.textMuted },

  // ── Search + Voice
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12, marginTop: 10,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 12, marginTop: 6,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 8, paddingVertical: 5,
  },
  searchInput: { flex: 1, fontSize: FontSize.xs, color: Colors.text },
    voiceToast: {
    backgroundColor: '#1E3A2F',
    bottom: 110,
  },


  // ── Categories
  catRowWrapper: {
    height: 46,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  catRowContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  catPill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: Colors.bg,
    borderWidth: 1.5, borderColor: Colors.border, marginRight: 8,
  },
  catPillActive: { backgroundColor: STAFF_GREEN, borderColor: STAFF_GREEN },
  catText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  catTextActive: { color: '#fff', fontWeight: FontWeight.bold },

  // ── Menu grid
  menuList: { flex: 1 },
  menuGrid: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 100 },
  menuCard: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: 10,
  },
  menuCardActive: { borderColor: STAFF_GREEN, borderWidth: 2 },
  menuEmoji: { fontSize: 28, marginBottom: 6 },
  menuName: { fontSize: FontSize.xs, color: Colors.text, fontWeight: FontWeight.medium, marginBottom: 8, lineHeight: 16 },
  menuFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuPrice: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  menuBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: STAFF_GREEN, alignItems: 'center', justifyContent: 'center',
  },
  menuBadgeText: { fontSize: 11, color: '#fff', fontWeight: FontWeight.bold },
  addBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.dark, alignItems: 'center', justifyContent: 'center',
  },

  // ── Cart FAB
  cartFab: {
    position: 'absolute', bottom: 16, left: 12, right: 12,
    backgroundColor: STAFF_GREEN,
    borderRadius: 16, paddingVertical: 13, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 10,
  },
  cartFabLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartFabBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  cartFabBadgeText: { color: '#fff', fontSize: 11, fontWeight: FontWeight.bold },
  cartFabText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cartFabAmount: {
    color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold,
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10,
  },

  // ── Toast
  toast: {
    position: 'absolute', bottom: 80, left: 16, right: 16,
    backgroundColor: '#0F172A', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  toastText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.medium, flex: 1 },

  // ── Cart Modal overlay
  cartOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  // ── Cart bottom sheet
  cartSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    // Use a max pixel height so it's reliable across devices
    maxHeight: Dimensions.get('window').height * 0.88,
    // Clip children to the rounded corners
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },

  // Cart header
  cartHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cartHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  cartCountBadge: {
    backgroundColor: STAFF_GREEN + '22', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  cartCountText: { fontSize: FontSize.xs, color: STAFF_GREEN, fontWeight: FontWeight.bold },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },

  // Cart items list
  cartItemsScroll: { flexGrow: 0, maxHeight: Dimensions.get('window').height * 0.36 },
  cartItemsContent: { paddingHorizontal: 16, paddingVertical: 4 },

  // Empty cart
  emptyCartWrap: { alignItems: 'center', paddingVertical: 32 },
  emptyCartText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  emptyCartSub: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 4 },

  // Cart rows
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  cartEmojiBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.bg,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cartEmoji: { fontSize: 22 },
  cartInfo: { flex: 1, minWidth: 0 },
  cartItemName: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    color: Colors.text, lineHeight: 18,
  },
  cartItemPrice: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Qty stepper
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 30, height: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnDelete: { backgroundColor: '#FEE2E2' },
  qtyNum: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold,
    color: Colors.text, minWidth: 24, textAlign: 'center',
  },

  cartLineTotal: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold,
    color: Colors.text, width: 48, textAlign: 'right', flexShrink: 0,
  },

  // ── Totals panel
  totalsBox: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20,
    gap: 8,
  },
  discountRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  discountLabel: { flex: 1, fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  discountTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#E5E5E3',
    borderRadius: 8,
    padding: 2,
    marginRight: 10,
  },
  typeSelectBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'transparent',
    minWidth: 26,
    alignItems: 'center',
  },
  typeSelectBtnActive: {
    backgroundColor: '#fff',
  },
  typeSelectText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
  },
  typeSelectTextActive: {
    color: Colors.text,
  },
  discountInput: {
    fontSize: FontSize.base, color: Colors.text, fontWeight: FontWeight.bold,
    textAlign: 'right', minWidth: 64,
  },

  summaryBox: {
    backgroundColor: Colors.bg, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, gap: 4,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  totalLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  totalVal: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.semibold },

  grandRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1.5, borderTopColor: Colors.border,
    paddingTop: 10,
  },
  grandLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  grandVal: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: STAFF_GREEN },

  placeOrderBtn: {
    backgroundColor: STAFF_GREEN,
    borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: STAFF_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  placeOrderText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },

  // ── Premium Image & Viewer styles
  menuImageContainer: {
    width: '100%',
    height: 105,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: Colors.bg,
  },
  menuImage: {
    width: '100%',
    height: '100%',
  },
  menuEmojiPlaceholder: {
    width: '100%',
    height: 105,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  menuEmojiPlaceholderText: {
    fontSize: 32,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    width: W,
    height: Dimensions.get('window').height * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalLarge: {
    width: W * 0.92,
    height: '100%',
    borderRadius: 16,
  },
  imageModalFooter: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imageModalTitle: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  imageModalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
