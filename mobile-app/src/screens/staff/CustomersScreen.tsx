/**
 * CustomersScreen.tsx (staff)
 * ───────────────────────────
 * Staff CRM screen:
 *  - Search customers by name / phone
 *  - Customer cards with visit stats
 *  - Expandable order history
 *  - "Add Customer" FAB with bottom sheet form
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Modal, KeyboardAvoidingView,
  Platform, FlatList, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import { StaffCustomer } from '../../types';
import EmptyState from '../../components/common/EmptyState';

const STAFF_GREEN = '#16A34A';

// ── Mock customers ────────────────────────────────────────────────────────────
const SEED_CUSTOMERS: StaffCustomer[] = [
  {
    id: 1, name: 'Rohit Sharma', phone: '9876543210', email: 'rohit@example.com',
    totalVisits: 24, totalSpent: 5_820, lastVisit: '2026-05-22', favoriteDish: 'Paneer Cheesy Grilled',
    orderHistory: [
      { date: '22 May 2026', amount: 340, items: 'Paneer Cheesy Grilled ×2' },
      { date: '18 May 2026', amount: 420, items: 'Gupta Special Panini + Cold Coffee' },
      { date: '10 May 2026', amount: 260, items: 'French Fries ×2 + Mint Mojito' },
    ],
  },
  {
    id: 2, name: 'Priya Patel', phone: '8765432109', email: 'priya@example.com',
    totalVisits: 18, totalSpent: 4_230, lastVisit: '2026-05-21', favoriteDish: 'Gupta Special Panini',
    orderHistory: [
      { date: '21 May 2026', amount: 380, items: 'Gupta Special Panini + Mojito' },
      { date: '15 May 2026', amount: 200, items: 'Paneer Cheesy Grilled (Mini) ×2' },
    ],
  },
  {
    id: 3, name: 'Arjun Mehta', phone: '7654321098',
    totalVisits: 31, totalSpent: 8_140, lastVisit: '2026-05-23', favoriteDish: 'Traditional Pizza',
    orderHistory: [
      { date: '23 May 2026', amount: 450, items: 'Traditional Pizza + Cold Coffee ×2' },
      { date: '20 May 2026', amount: 340, items: 'Paneer Tikka Panini ×2' },
      { date: '17 May 2026', amount: 280, items: 'Veg Cheese Burger ×2 + Fries' },
      { date: '12 May 2026', amount: 520, items: 'Exotic Pizza + Butterscotch Shake' },
    ],
  },
  {
    id: 4, name: 'Sneha Joshi', phone: '6543210987', email: 'sneha@example.com',
    totalVisits: 9, totalSpent: 1_980, lastVisit: '2026-05-19', favoriteDish: 'Veg Cheese Burger',
    orderHistory: [
      { date: '19 May 2026', amount: 315, items: 'Veg Cheese Burger ×3 + Garlic Bread' },
      { date: '8 May 2026',  amount: 180, items: 'Veggie Cheesy Grilled ×2' },
    ],
  },
  {
    id: 5, name: 'Vikram Singh', phone: '5432109876',
    totalVisits: 42, totalSpent: 11_200, lastVisit: '2026-05-22', favoriteDish: 'Paneer Tikka Panini',
    orderHistory: [
      { date: '22 May 2026', amount: 340, items: 'Paneer Tikka Panini ×2' },
      { date: '20 May 2026', amount: 450, items: 'Tandoori Paneer Pizza (6 Inch) + Mojito' },
      { date: '16 May 2026', amount: 260, items: 'Mushroom Cheesy Grilled ×2' },
    ],
  },
  {
    id: 6, name: 'Kavita Desai', phone: '4321098765', email: 'kavita@example.com',
    totalVisits: 7, totalSpent: 1_540, lastVisit: '2026-05-15', favoriteDish: 'Diet Grilled',
    orderHistory: [
      { date: '15 May 2026', amount: 240, items: 'Diet Grilled ×2' },
      { date: '5 May 2026',  amount: 160, items: 'Diet Grilled + Lemon Ice Tea' },
    ],
  },
];

function visitLabel(visits: number): string {
  if (visits >= 30) return 'VIP';
  if (visits >= 15) return 'Regular';
  return 'New';
}
function visitLabelIcon(visits: number): string {
  if (visits >= 30) return 'star';
  if (visits >= 15) return 'flame';
  return 'person-add-outline';
}
function visitLabelColor(visits: number): string {
  if (visits >= 30) return '#B45309';
  if (visits >= 15) return '#C2410C';
  return '#1D4ED8';
}

function CustomerCard({ customer }: { customer: StaffCustomer }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      {/* Top row */}
      <TouchableOpacity
        style={styles.cardTop}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.8}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{customer.name.charAt(0)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName}>{customer.name}</Text>
            <View style={[styles.tagBadge, { backgroundColor: visitLabel(customer.totalVisits) === 'VIP' ? '#FEF9C3' : visitLabel(customer.totalVisits) === 'Regular' ? '#FFEDD5' : '#DBEAFE' }]}>
              <Ionicons
                name={visitLabelIcon(customer.totalVisits) as any}
                size={10}
                color={visitLabelColor(customer.totalVisits)}
                style={{ marginRight: 3 }}
              />
              <Text style={[styles.tagText, { color: visitLabelColor(customer.totalVisits) }]}>
                {visitLabel(customer.totalVisits)}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Ionicons name="call-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.cardPhone}>{customer.phone}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <Ionicons name="heart-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.cardFav}>{customer.favoriteDish}</Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.textMuted}
        />
      </TouchableOpacity>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{customer.totalVisits}</Text>
          <Text style={styles.statLabel}>Visits</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{customer.totalSpent.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {customer.lastVisit.split('-').slice(1).join('/').replace(/^0/, '')}
          </Text>
          <Text style={styles.statLabel}>Last Visit</Text>
        </View>
      </View>

      {/* Order history (expandable) */}
      {expanded && (
        <View style={styles.historyBox}>
          <Text style={styles.historyTitle}>Order History</Text>
          {customer.orderHistory.map((h, idx) => (
            <View key={idx} style={[styles.historyRow, idx < customer.orderHistory.length - 1 && styles.historyRowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyDate}>{h.date}</Text>
                <Text style={styles.historyItems} numberOfLines={1}>{h.items}</Text>
              </View>
              <Text style={styles.historyAmt}>₹{h.amount}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function CustomersScreen() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<StaffCustomer[]>(SEED_CUSTOMERS);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [search, customers]);

  const handleAddCustomer = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    const customer: StaffCustomer = {
      id: Date.now(),
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      totalVisits: 0,
      totalSpent: 0,
      lastVisit: new Date().toISOString().split('T')[0],
      favoriteDish: '—',
      orderHistory: [],
    };
    setCustomers(prev => [customer, ...prev]);
    setNewName(''); setNewPhone(''); setNewEmail('');
    setShowAdd(false);
  };

  return (
    <View style={styles.root}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
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

      {/* Summary pills */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryVal}>{customers.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryVal}>{customers.filter(c => c.totalVisits >= 30).length}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <Ionicons name="star" size={10} color="#B45309" />
            <Text style={styles.summaryLabel}>VIP</Text>
          </View>
        </View>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryVal}>{customers.filter(c => c.totalVisits >= 15 && c.totalVisits < 30).length}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <Ionicons name="flame" size={10} color="#C2410C" />
            <Text style={styles.summaryLabel}>Regular</Text>
          </View>
        </View>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryVal}>{customers.filter(c => c.totalVisits < 15).length}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <Ionicons name="person-add-outline" size={10} color="#1D4ED8" />
            <Text style={styles.summaryLabel}>New</Text>
          </View>
        </View>
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon="people-outline" title="No customers found" subtitle="Try a different search term" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => String(c.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <CustomerCard customer={item} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.9}>
        <Ionicons name="person-add" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Add Customer Sheet */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowAdd(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add New Customer</Text>

            <Text style={styles.fieldLabel}>NAME *</Text>
            <TextInput
              style={styles.fieldInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Customer name"
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.fieldLabel}>PHONE *</Text>
            <TextInput
              style={styles.fieldInput}
              value={newPhone}
              onChangeText={setNewPhone}
              placeholder="10-digit mobile number"
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>EMAIL (optional)</Text>
            <TextInput
              style={styles.fieldInput}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="customer@example.com"
              placeholderTextColor={Colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.addBtn, (!newName.trim() || !newPhone.trim()) && { opacity: 0.5 }]}
              onPress={handleAddCustomer}
              disabled={!newName.trim() || !newPhone.trim()}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.addBtnText}>Add Customer</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: 12, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: FontSize.sm, color: Colors.text },

  summaryRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 12, marginBottom: 4,
  },
  summaryPill: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: 10, padding: 8, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  summaryVal: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  summaryLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  list: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 90, gap: 10 },

  // Customer card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: STAFF_GREEN,
    flexShrink: 0,
  },
  avatarText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: STAFF_GREEN },
  cardInfo: { flex: 1 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text },
  tagBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  tagText: { fontSize: 10, fontWeight: FontWeight.bold },
  cardPhone: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  cardFav: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5, borderTopColor: Colors.border,
    backgroundColor: '#FAFAF9',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 0.5, backgroundColor: Colors.border, marginVertical: 6 },

  historyBox: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 0.5, borderTopColor: Colors.border,
  },
  historyTitle: {
    fontSize: FontSize.xs, fontWeight: FontWeight.bold,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 8,
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 8 },
  historyRowBorder: { borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight },
  historyDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  historyItems: { fontSize: FontSize.sm, color: Colors.text, marginTop: 2 },
  historyAmt: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },

  // FAB
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: STAFF_GREEN,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: STAFF_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },

  // Add Customer Sheet
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: {
    fontSize: FontSize.xl, fontWeight: FontWeight.bold,
    color: Colors.text, marginBottom: 20,
  },
  fieldLabel: {
    fontSize: FontSize.xs, fontWeight: FontWeight.bold,
    color: STAFF_GREEN, letterSpacing: 1, marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: Colors.bg,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: FontSize.base, color: Colors.text,
    marginBottom: 14,
  },
  addBtn: {
    backgroundColor: STAFF_GREEN, borderRadius: 12,
    paddingVertical: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 6,
    shadowColor: STAFF_GREEN,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  addBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
