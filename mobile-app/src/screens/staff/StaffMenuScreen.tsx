/**
 * StaffMenuScreen.tsx
 * ───────────────────
 * Read-only menu screen for Kitchen Staff.
 * Shows all dishes added by the super admin — fetched live from backend.
 *
 * Features:
 *  - Category filter pills
 *  - Search bar
 *  - Dish cards with name, price, veg/non-veg badge
 *  - Pull-to-refresh
 *  - Loading spinner on first fetch
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  RefreshControl, Dimensions, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import { getAvailableDishes, PosDish } from '../../services/posApi';
import { BASE_URL } from '../../services/api';

const STAFF_GREEN = '#16A34A';
const { width: W } = Dimensions.get('window');

// ── Dish card ─────────────────────────────────────────────────────────────────
function DishCard({ dish }: { dish: PosDish }) {
  return (
    <View style={styles.card}>
      {/* Image or icon */}
      {dish.image_url ? (
        <Image
          source={{ uri: `${BASE_URL}${dish.image_url}` }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.cardIconBox}>
          <Ionicons name="fast-food-outline" size={32} color={STAFF_GREEN} />
        </View>
      )}

      {/* Category badge */}
      <View style={styles.catBadge}>
        <Text style={styles.catBadgeText} numberOfLines={1}>{dish.category}</Text>
      </View>

      {/* Name */}
      <Text style={styles.dishName} numberOfLines={2}>{dish.name}</Text>

      {/* Prices */}
      <View style={styles.priceRow}>
        <View style={styles.priceBox}>
          <Ionicons name="people-outline" size={11} color={Colors.textMuted} />
          <Text style={styles.priceLabel}>Dine</Text>
          <Text style={styles.priceVal}>₹{dish.dine_price}</Text>
        </View>
        <View style={[styles.priceBox, styles.priceBoxRight]}>
          <Ionicons name="cube-outline" size={11} color={Colors.textMuted} />
          <Text style={styles.priceLabel}>Parcel</Text>
          <Text style={styles.priceVal}>₹{dish.parcel_price}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function StaffMenuScreen() {
  const [dishes,   setDishes]   = useState<PosDish[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const [search,    setSearch]    = useState('');
  const [activeCat, setActiveCat] = useState('All');

  // Derive category list from fetched dishes
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(dishes.map(d => d.category)))],
    [dishes],
  );

  // Filtered list
  const filtered = useMemo(() => {
    let items = dishes;
    if (activeCat !== 'All') items = items.filter(d => d.category === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(d => d.name.toLowerCase().includes(q));
    }
    return items;
  }, [dishes, activeCat, search]);

  // Fetch from backend
  const fetchDishes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getAvailableDishes();
      if (res.dishes?.length) {
        setDishes(res.dishes);
      } else {
        setDishes([]);
      }
    } catch (err: any) {
      setError('Could not load dishes. Check your connection.');
      console.warn('[StaffMenu] fetchDishes error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDishes(); }, [fetchDishes]);

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={STAFF_GREEN} />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error && dishes.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="wifi-outline" size={48} color={Colors.textLight} />
        <Text style={styles.errorTitle}>Could not load dishes</Text>
        <Text style={styles.errorSub}>Make sure the server is running</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDishes()} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>

      {/* ── Search bar ────────────────────────────────────────────────── */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search dishes..."
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Category pills ────────────────────────────────────────────── */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={c => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catContent}
        style={styles.catScroll}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[styles.catPill, activeCat === cat && styles.catPillActive]}
            onPress={() => setActiveCat(cat)}
            activeOpacity={0.8}
          >
            <Text style={[styles.catText, activeCat === cat && styles.catTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* ── Dish grid ─────────────────────────────────────────────────── */}
      <FlatList
        key="dish-grid"
        data={filtered}
        keyExtractor={d => String(d.id)}
        numColumns={2}
        style={styles.gridContainer}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={{ gap: 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDishes(true)}
            tintColor={STAFF_GREEN}
            colors={[STAFF_GREEN]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={44} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No dishes found</Text>
            <Text style={styles.emptySub}>Try a different category or search</Text>
          </View>
        }
        renderItem={({ item }) => <DishCard dish={item} />}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CARD_W = (W - 10 * 3) / 2;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 8 },
  errorTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textMuted, textAlign: 'center' },
  errorSub: { fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: STAFF_GREEN, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 10, marginTop: 4,
  },
  retryText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 12, marginTop: 12, marginBottom: 4,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: FontSize.sm, color: Colors.text },

  // Categories
  catScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 4,
  },
  catContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' },
  catPill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  catPillActive: { backgroundColor: STAFF_GREEN, borderColor: STAFF_GREEN },
  catText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  catTextActive: { color: '#fff', fontWeight: FontWeight.bold },

  // Grid
  gridContainer: { flex: 1 },
  gridContent: { paddingHorizontal: 10, paddingBottom: 32 },

  // Dish card
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardImage: { width: '100%', height: 110 },
  cardIconBox: {
    width: '100%', height: 90,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
  },
  catBadge: {
    marginHorizontal: 10, marginTop: 8,
    backgroundColor: '#F0FDF4', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start',
  },
  catBadgeText: { fontSize: 9, color: STAFF_GREEN, fontWeight: FontWeight.bold },
  dishName: {
    fontSize: FontSize.xs, fontWeight: FontWeight.semibold,
    color: Colors.text, marginHorizontal: 10, marginTop: 5,
    lineHeight: 16, minHeight: 32,
  },
  priceRow: {
    flexDirection: 'row',
    marginHorizontal: 10, marginTop: 6, marginBottom: 10, gap: 6,
  },
  priceBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.bg, borderRadius: 7,
    paddingHorizontal: 5, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  priceBoxRight: {},
  priceLabel: { fontSize: 9, color: Colors.textMuted, flex: 1 },
  priceVal: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.text },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  emptySub: { fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'center' },
});
