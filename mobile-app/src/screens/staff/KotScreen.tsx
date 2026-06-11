/**
 * KotScreen.tsx
 * ─────────────
 * Kitchen Order Tickets screen.
 *
 * Shows all KOT cards from the shared StaffOrderContext.
 * Staff can:
 *  - Filter by status (All / Pending / Preparing / Ready / Dispatched)
 *  - Mark individual items as ready → auto-advances KOT to "ready"
 *  - Dispatch a ready KOT
 *  - Toggle urgent flag
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import { useStaffOrder } from '../../context/StaffOrderContext';
import { OrderStatus, KotOrder } from '../../types';
import EmptyState from '../../components/common/EmptyState';

const STAFF_GREEN = '#16A34A';

type FilterStatus = 'All' | OrderStatus;
const FILTERS: FilterStatus[] = ['All', 'pending', 'preparing', 'ready', 'dispatched'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#C2410C', bg: '#FFEDD5' },
  preparing: { label: 'Preparing', color: '#1D4ED8', bg: '#DBEAFE' },
  ready:     { label: 'Ready',     color: '#15803D', bg: '#DCFCE7' },
  dispatched: { label: 'Dispatched',color: '#6B7280', bg: '#F3F4F6' },
  cancelled: { label: 'Cancelled', color: '#B91C1C', bg: '#FEE2E2' },
};

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function KotCard({ kot }: { kot: KotOrder }) {
  const { updateKotStatus, toggleItemReady, markAllKotItemsReady, toggleUrgent, cancelKotOrder } = useStaffOrder();
  const cfg = STATUS_CONFIG[kot.status] ?? STATUS_CONFIG.pending;
  const allItemsReady = kot.items.every(i => kot.itemStatuses[i.id] === 'ready');
  const readyCount = kot.items.filter(i => kot.itemStatuses[i.id] === 'ready').length;
  const isKotReady = kot.status === 'ready' || allItemsReady;

  const minutesElapsed = Math.floor((Date.now() - kot.createdAt.getTime()) / 60000);
  const isUrgent = kot.isUrgent || (kot.status !== 'dispatched' && kot.status !== 'cancelled' && minutesElapsed >= 15);

  const handleCancelClick = () => {
    if (!kot.orderId) return;
    Alert.alert(
      'Cancel Order',
      `Are you sure you want to cancel order ${kot.kotNumber}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: () => cancelKotOrder(kot.orderId!),
        },
      ]
    );
  };

  return (
    // Outer wrapper: shadow/elevation only (no overflow:hidden — Android bug workaround)
    <View style={[styles.kotCardShadow, isUrgent && styles.kotCardShadowUrgent]}>
      {/* Inner wrapper: clips content to rounded corners */}
      <View style={styles.kotCardInner}>

        {/* Card header */}
        <View style={styles.kotHeader}>
          <View style={styles.kotHeaderLeft}>
            <Text style={styles.kotNum}>{kot.kotNumber}</Text>
            {isUrgent && (
              <View style={styles.urgentBadge}>
                <Ionicons name="flame" size={11} color="#B91C1C" style={{ marginRight: 3 }} />
                <Text style={styles.urgentText}>
                  {minutesElapsed >= 15 ? `OVERDUE (${minutesElapsed}m)` : 'URGENT'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.kotHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.kotMeta}>
          {(() => {
            let iconName: any = 'cube-outline';
            let iconColor: string = Colors.textMuted;
            let label = kot.tableLabel;
            
            if (kot.orderType === 'dine-in') {
              iconName = 'people-outline';
              label = kot.tableLabel || 'Dine-in';
            } else if (kot.orderType === 'swiggy') {
              iconName = 'bicycle-outline';
              iconColor = Colors.orange;
              label = kot.orderNumber ? `Swiggy (${kot.orderNumber.split('-').pop()})` : 'Swiggy';
            } else if (kot.orderType === 'zomato') {
              iconName = 'bicycle-outline';
              iconColor = Colors.red;
              label = kot.orderNumber ? `Zomato (${kot.orderNumber.split('-').pop()})` : 'Zomato';
            } else {
              iconName = 'cube-outline';
              label = 'Parcel';
            }

            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name={iconName} size={12} color={iconColor} />
                <Text style={[styles.kotMetaText, (kot.orderType === 'swiggy' || kot.orderType === 'zomato') && { color: iconColor, fontWeight: 'bold' }]}>
                  {label}
                </Text>
              </View>
            );
          })()}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="card-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.kotMetaText}>{kot.paymentMethod}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.kotMetaText}>{timeAgo(kot.createdAt)}</Text>
          </View>
        </View>

        {/* Items list */}
        <View style={styles.kotItems}>
          {kot.items.map(item => {
            const isReady = kot.itemStatuses[item.id] === 'ready';
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.kotItem, isReady && styles.kotItemReady]}
                onPress={() => {
                  if (kot.status !== 'dispatched' && kot.status !== 'cancelled') {
                    toggleItemReady(kot.id, item.id);
                  }
                }}
                activeOpacity={0.7}
                disabled={kot.status === 'dispatched' || kot.status === 'cancelled'}
              >
                <View style={[styles.itemCheck, isReady && styles.itemCheckReady]}>
                  {isReady && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Ionicons name="fast-food-outline" size={16} color={isReady ? Colors.textMuted : Colors.text} />
                <Text style={[styles.kotItemName, isReady && styles.kotItemNameDone]}
                  numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.kotItemQty}>×{item.qty}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Progress bar for preparing cards */}
        {kot.status === 'preparing' && (
          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(readyCount / kot.items.length) * 100}%` as any },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {readyCount}/{kot.items.length} ready
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.kotFooter}>
          <Text style={styles.kotTotal}>Total: ₹{kot.total}</Text>

          {/* Action buttons */}
          <View style={styles.kotActions}>
            {/* Cancel Order — only for active tickets with orderId */}
            {kot.status !== 'dispatched' && kot.status !== 'cancelled' && kot.orderId && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancelClick}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={Colors.red}
                />
              </TouchableOpacity>
            )}

            {/* Urgent toggle — only for non-dispatched */}
            {kot.status !== 'dispatched' && (
              <TouchableOpacity
                style={styles.urgentBtn}
                onPress={() => toggleUrgent(kot.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={kot.isUrgent ? 'flame' : 'flame-outline'}
                  size={16}
                  color={kot.isUrgent ? '#EF4444' : Colors.textMuted}
                />
              </TouchableOpacity>
            )}

            {/* Main Action: Dispatch Full Order (if ready) OR Mark All Ready (if pending/preparing) */}
            {kot.status !== 'dispatched' && kot.status !== 'cancelled' && (
              isKotReady ? (
                <TouchableOpacity
                  style={styles.dispatchBtn}
                  onPress={() => updateKotStatus(kot.id, 'dispatched')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="rocket-outline" size={13} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.dispatchText}>Dispatch</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.readyBtn}
                  onPress={() => markAllKotItemsReady(kot.id)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle" size={13} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.readyBtnText}>Mark All Ready</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

      </View>
    </View>
  );
}

export default function KotScreen() {
  const { kotOrders, refreshKots, loading } = useStaffOrder();
  const [filter, setFilter] = useState<FilterStatus>('All');

  const filtered = filter === 'All'
    ? kotOrders.filter(k => k.status !== 'dispatched' && k.status !== 'cancelled')
    : kotOrders.filter(k => k.status === filter);

  const counts: Record<string, number> = {
    All: kotOrders.filter(k => k.status !== 'dispatched' && k.status !== 'cancelled').length
  };
  FILTERS.slice(1).forEach(f => {
    counts[f] = kotOrders.filter(k => k.status === f).length;
  });

  // Stat cards config
  const STAT_CARDS = [
    { key: 'All',       label: 'Active Orders', icon: 'clipboard-outline',     iconLib: 'Ionicons',     bg: '#F8FAFC', numColor: Colors.text },
    { key: 'pending',   label: 'Pending',       icon: 'time-outline',           iconLib: 'Ionicons',     bg: '#FFF7ED', numColor: '#C2410C' },
    { key: 'preparing', label: 'Preparing',     icon: 'restaurant-outline',     iconLib: 'Ionicons',     bg: '#EFF6FF', numColor: '#1D4ED8' },
    { key: 'ready',     label: 'Ready',         icon: 'checkmark-circle-outline', iconLib: 'Ionicons',  bg: '#F0FDF4', numColor: STAFF_GREEN },
    { key: 'dispatched', label: 'Dispatched',    icon: 'rocket-outline',         iconLib: 'Ionicons',     bg: '#F5F3FF', numColor: '#7C3AED' },
  ];

  return (
    <View style={styles.root}>

      {/* ── Stat cards row ────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statScroll}
        contentContainerStyle={styles.statContent}
      >
        {STAT_CARDS.map(card => (
          <TouchableOpacity
            key={card.key}
            style={[
              styles.statCard,
              { backgroundColor: card.bg },
              filter === card.key && styles.statCardActive,
            ]}
            onPress={() => setFilter(card.key as FilterStatus)}
            activeOpacity={0.8}
          >
            <Ionicons name={card.icon as any} size={20} color={card.numColor} style={{ marginBottom: 4 }} />
            <Text style={[styles.statNum, { color: card.numColor }]}>
              {counts[card.key] ?? 0}
            </Text>
            <Text style={styles.statLabel}>{card.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Status filter pills ────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
      >
        {FILTERS.map(f => {
          const count = counts[f] ?? 0;
          const label = f === 'All' ? 'All' : STATUS_CONFIG[f]?.label ?? f;
          const isActive = filter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {label}
              </Text>
              {count > 0 && (
                <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, isActive && { color: STAFF_GREEN }]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── KOT list ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="restaurant-outline"
          title={
            filter === 'All'
              ? 'No active orders'
              : `No ${STATUS_CONFIG[filter]?.label ?? filter} orders`
          }
          subtitle={
            filter === 'All'
              ? 'All active KOTs will appear here. Pending, Preparing, and Ready orders show up here.'
              : 'Change filter to see other orders'
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <KotCard kot={item} />}
          refreshing={loading}
          onRefresh={refreshKots}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // ── Stat cards
  statScroll: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  statCard: {
    width: 90,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  statCardActive: {
    borderColor: STAFF_GREEN,
  },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statNum: { fontSize: 22, fontWeight: FontWeight.bold, lineHeight: 26 },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 3, textAlign: 'center' },

  // ── Filter pills
  filterRow: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: Colors.bg,
    borderWidth: 1, borderColor: Colors.border,
    marginRight: 8,
  },
  filterPillActive: { backgroundColor: '#F0FDF4', borderColor: STAFF_GREEN },
  filterText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  filterTextActive: { color: STAFF_GREEN, fontWeight: FontWeight.bold },
  filterBadge: {
    backgroundColor: Colors.border,
    borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1,
  },
  filterBadgeActive: { backgroundColor: '#DCFCE7' },
  filterBadgeText: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.bold },

  listContainer: { flex: 1 },
  list: { padding: 12, gap: 12, paddingBottom: 24 },

  // ── KOT card — two-layer approach to fix Android overflow+elevation bug:
  // On Android, overflow:'hidden' is ignored when elevation > 0 on the same View.
  // Solution: outer View = shadow/border, inner View = borderRadius + overflow:hidden
  kotCardShadow: {
    borderRadius: 14,
    backgroundColor: Colors.surface,   // needed for shadow to render on Android
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  kotCardShadowUrgent: { borderColor: '#EF4444', borderWidth: 2, elevation: 4 },
  kotCardInner: {
    borderRadius: 13,    // 1px less than shadow to sit inside border
    overflow: 'hidden',  // this WORKS here because there is no elevation on this View
    backgroundColor: Colors.surface,
  },

  kotHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    backgroundColor: '#FAFAF9',
  },
  kotHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kotNum: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  urgentBadge: {
    backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1, borderColor: '#FCA5A5',
  },
  urgentText: { fontSize: 10, color: '#B91C1C', fontWeight: FontWeight.bold },
  kotHeaderRight: {},

  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  kotMeta: {
    flexDirection: 'row', gap: 14, paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  kotMetaText: { fontSize: FontSize.xs, color: Colors.textMuted },

  kotItems: { paddingHorizontal: 14, paddingVertical: 6 },
  kotItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight,
  },
  kotItemReady: { opacity: 0.6 },
  itemCheck: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  itemCheckReady: { backgroundColor: STAFF_GREEN, borderColor: STAFF_GREEN },
  kotItemEmoji: { fontSize: 18 },
  kotItemName: { flex: 1, fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
  kotItemNameDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  kotItemQty: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textMuted },

  kotFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 0.5, borderTopColor: Colors.border,
    backgroundColor: '#FAFAF9',
    minHeight: 52,   // ensures footer never collapses
  },
  kotTotal: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text },
  kotActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  // Progress bar for 'preparing' cards
  progressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingBottom: 8,
  },
  progressBarBg: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4, borderRadius: 2,
    backgroundColor: STAFF_GREEN,
  },
  progressText: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.bold, minWidth: 42 },

  urgentBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5',
    alignItems: 'center', justifyContent: 'center',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  startBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  readyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STAFF_GREEN, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  readyBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  dispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  dispatchText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});
