/**
 * MenuManagerScreen.tsx (staff)
 * ──────────────────────────────
 * Staff-facing read-only menu browser:
 *  - Category filter pills
 *  - Searchable menu grid
 *  - Item detail card (price, veg badge, ingredients hint)
 * Staff cannot edit prices — that's admin-only.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, FlatList, Modal, Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import { DEFAULT_MENU_ITEMS } from '../../constants/menu';

const STAFF_GREEN = '#16A34A';
const { width: W } = Dimensions.get('window');

const ALL_CATS = ['All', ...Array.from(new Set(DEFAULT_MENU_ITEMS.map(i => i.cat)))];

// Category icon map (using Ionicons names)
const CAT_ICON: Record<string, string> = {
  'Grilled Sandwiches':       'restaurant-outline',
  'Special Grilled / Panini': 'cafe-outline',
  'Sandwiches':               'fast-food-outline',
  'Panini (Multi-grain)':     'leaf-outline',
  'Pizza':                    'pizza-outline',
  'Burgers':                  'fast-food-outline',
  'Appetizers':               'restaurant-outline',
  'Mocktails':                'wine-outline',
  'Shakes & Smoothies':       'cafe-outline',
  'Combos':                   'grid-outline',
  'Party Combo Boxes':        'gift-outline',
  'Extra Add-ons':            'add-circle-outline',
};

export default function MenuManagerScreen() {
  const [search, setSearch]     = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [selected, setSelected] = useState<(typeof DEFAULT_MENU_ITEMS)[0] | null>(null);

  const filtered = useMemo(() => {
    let items = DEFAULT_MENU_ITEMS;
    if (activeCat !== 'All') items = items.filter(i => i.cat === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [search, activeCat]);

  const catCounts = useMemo(() => {
    const map: Record<string, number> = { All: DEFAULT_MENU_ITEMS.length };
    ALL_CATS.slice(1).forEach(c => {
      map[c] = DEFAULT_MENU_ITEMS.filter(i => i.cat === c).length;
    });
    return map;
  }, []);

  return (
    <View style={styles.root}>
      {/* ── Header strip ─────────────────────────────────────────────── */}
      <View style={styles.headerStrip}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={15} color={Colors.textMuted} style={{ marginRight: 7 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dishes..."
            placeholderTextColor={Colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={15} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statNum}>{DEFAULT_MENU_ITEMS.length}</Text>
            <Text style={styles.statLbl}>Total Items</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: '#F0FDF4' }]}>
            <Text style={[styles.statNum, { color: STAFF_GREEN }]}>{ALL_CATS.length - 1}</Text>
            <Text style={styles.statLbl}>Categories</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: '#FFF7ED' }]}>
            <Text style={[styles.statNum, { color: '#C2410C' }]}>{filtered.length}</Text>
            <Text style={styles.statLbl}>Showing</Text>
          </View>
        </View>
      </View>

      {/* ── Category pills ───────────────────────────────────────────── */}
      <View style={styles.catWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catContent}
        >
          {ALL_CATS.map(cat => {
            const isActive = activeCat === cat;
            const iconName = cat === 'All' ? 'restaurant-outline' : (CAT_ICON[cat] ?? 'pricetag-outline');
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, isActive && styles.catPillActive]}
                onPress={() => setActiveCat(cat)}
                activeOpacity={0.8}
              >
                <Ionicons name={iconName as any} size={13} color={isActive ? STAFF_GREEN : Colors.textMuted} />
                <Text style={[styles.catText, isActive && styles.catTextActive]}>
                  {cat === 'All' ? 'All' : cat.split(' ')[0]}
                </Text>
                <View style={[styles.catCount, isActive && styles.catCountActive]}>
                  <Text style={[styles.catCountText, isActive && { color: STAFF_GREEN }]}>
                    {catCounts[cat]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Menu grid ────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="search-outline" size={44} color={Colors.textLight} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>No items found</Text>
          <Text style={styles.emptySub}>Try a different category or search term</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 10 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => setSelected(item)}
              activeOpacity={0.85}
            >
              {/* Veg dot */}
              <View style={[styles.vegDot, { backgroundColor: item.veg ? STAFF_GREEN : '#EF4444' }]} />

              <MaterialIcons name="restaurant" size={28} color={Colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={styles.menuName} numberOfLines={2}>{item.name}</Text>

              <View style={styles.menuFooterRow}>
                <Text style={styles.menuPrice}>₹{item.price}</Text>
                <View style={[styles.vegBadge, { backgroundColor: item.veg ? '#F0FDF4' : '#FEF2F2' }]}>
                  <Text style={[styles.vegBadgeText, { color: item.veg ? STAFF_GREEN : '#EF4444' }]}>
                    {item.veg ? 'VEG' : 'N-VEG'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ── Item Detail Modal ─────────────────────────────────────────── */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <View style={styles.detailOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setSelected(null)}
            />
            <View style={styles.detailSheet}>
              <View style={styles.detailHandle} />

              {/* Header */}
              <View style={styles.detailHeader}>
                <Ionicons name="fast-food-outline" size={36} color={STAFF_GREEN} style={{ marginRight: 4 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailName}>{selected.name}</Text>
                  <Text style={styles.detailCat}>{selected.cat}</Text>
                </View>
                <TouchableOpacity style={styles.detailClose} onPress={() => setSelected(null)}>
                  <Ionicons name="close" size={18} color={Colors.text} />
                </TouchableOpacity>
              </View>

              {/* Price + Veg */}
              <View style={styles.detailMeta}>
                <View style={styles.detailPriceBox}>
                  <Text style={styles.detailPriceLbl}>Price</Text>
                  <Text style={styles.detailPrice}>₹{selected.price}</Text>
                </View>
                <View style={[
                  styles.detailVegBox,
                  { backgroundColor: selected.veg ? '#F0FDF4' : '#FEF2F2' }
                ]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons
                      name={selected.veg ? 'leaf-outline' : 'alert-circle-outline'}
                      size={16}
                      color={selected.veg ? STAFF_GREEN : '#EF4444'}
                    />
                    <Text style={[
                      styles.detailVegText,
                      { color: selected.veg ? STAFF_GREEN : '#EF4444' }
                    ]}>
                      {selected.veg ? 'Vegetarian' : 'Non-Vegetarian'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ID / Cat info */}
              <View style={styles.detailInfoGrid}>
                <View style={styles.detailInfoCell}>
                  <Text style={styles.detailInfoLbl}>Item ID</Text>
                  <Text style={styles.detailInfoVal}>#{selected.id}</Text>
                </View>
                <View style={styles.detailInfoCell}>
                  <Text style={styles.detailInfoLbl}>Category</Text>
                  <Text style={styles.detailInfoVal} numberOfLines={2}>{selected.cat}</Text>
                </View>
              </View>

              {/* Staff note */}
              <View style={styles.staffNote}>
                <Ionicons name="information-circle-outline" size={15} color={Colors.textMuted} style={{ marginRight: 6 }} />
                <Text style={styles.staffNoteText}>
                  Price changes must be done by an admin. Use POS to add this item to an order.
                </Text>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // Header strip
  headerStrip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 10, paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: FontSize.sm, color: Colors.text },

  statsRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    flex: 1, alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  statNum: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  statLbl: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },

  // Category pills
  catWrapper: {
    height: 52,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  catContent: { paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', gap: 6 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, backgroundColor: Colors.bg,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  catPillActive: { backgroundColor: '#F0FDF4', borderColor: STAFF_GREEN },
  catEmoji: { fontSize: 13 },
  catText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  catTextActive: { color: STAFF_GREEN, fontWeight: FontWeight.bold },
  catCount: {
    backgroundColor: Colors.border, borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  catCountActive: { backgroundColor: '#DCFCE7' },
  catCountText: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.bold },

  // Menu grid
  grid: { padding: 12, paddingBottom: 24 },
  menuCard: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: 10, position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  vegDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
  },
  menuEmoji: { fontSize: 30, marginBottom: 8 },
  menuName: {
    fontSize: FontSize.xs, color: Colors.text,
    fontWeight: FontWeight.semibold, lineHeight: 16, marginBottom: 8, flex: 1,
  },
  menuFooterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 4,
  },
  menuPrice: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text },
  vegBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  vegBadgeText: { fontSize: 9, fontWeight: FontWeight.bold },

  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  emptySub: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 4 },

  // Detail modal
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32, overflow: 'hidden',
  },
  detailHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  detailEmoji: { fontSize: 40 },
  detailName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, lineHeight: 22 },
  detailCat: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 3 },
  detailClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
  },

  detailMeta: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 18, paddingVertical: 14,
  },
  detailPriceBox: {
    flex: 1, backgroundColor: Colors.bg, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  detailPriceLbl: { fontSize: FontSize.xs, color: Colors.textMuted },
  detailPrice: { fontSize: 28, fontWeight: FontWeight.bold, color: Colors.text, marginTop: 2 },

  detailVegBox: {
    flex: 1, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  detailVegText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  detailInfoGrid: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 18, paddingBottom: 14,
  },
  detailInfoCell: {
    flex: 1, backgroundColor: Colors.bg, borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: Colors.border,
  },
  detailInfoLbl: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  detailInfoVal: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text },

  staffNote: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginHorizontal: 18, padding: 12,
    backgroundColor: '#F8F8F6', borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  staffNoteText: { flex: 1, fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 18 },
});
