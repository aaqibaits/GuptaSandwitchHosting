/**
 * AccountingScreen.tsx
 * ────────────────────
 * Accounting ledger in tabular format — exactly matching the web admin panel.
 * Columns: Txn ID | Amount | Order date | Delivery date | Payment date | Bill | Status
 * The table is horizontally scrollable since mobile screens are narrower than desktop.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import MetricCard from '../../components/common/MetricCard';
import ScreenTitle from '../../components/common/ScreenTitle';
import { Transaction, TxnStatus } from '../../types';

const OUTLETS = ['All outlets', 'Koregaon Park', 'Baner', 'Kothrud'];

const INITIAL_DATA: Transaction[] = [
  { id: 'TXN001', amount: '₹12,400', order: '12 May 2025', delivery: '13 May 2025', payment: '13 May 2025', bill: true,  status: 'paid' },
  { id: 'TXN002', amount: '₹8,750',  order: '14 May 2025', delivery: '15 May 2025', payment: '—',           bill: false, status: 'pending' },
  { id: 'TXN003', amount: '₹21,000', order: '10 May 2025', delivery: '11 May 2025', payment: '11 May 2025', bill: true,  status: 'paid' },
  { id: 'TXN004', amount: '₹5,600',  order: '08 May 2025', delivery: '09 May 2025', payment: '—',           bill: false, status: 'due' },
  { id: 'TXN005', amount: '₹14,200', order: '06 May 2025', delivery: '07 May 2025', payment: '07 May 2025', bill: true,  status: 'paid' },
];

const STATUS_STYLE: Record<TxnStatus, { bg: string; text: string; label: string }> = {
  paid:    { bg: Colors.greenLight, text: Colors.green, label: 'Paid' },
  pending: { bg: Colors.orangeLight, text: Colors.orange, label: 'Pending' },
  due:     { bg: Colors.redLight, text: Colors.red, label: 'Due' },
};

// Column widths (px) — fixed so the table scrolls horizontally
const COL = {
  txnId:    100,
  amount:   90,
  date:     110,
  bill:     100,
  status:   80,
};

export default function AccountingScreen() {
  const [outlet, setOutlet] = useState('All outlets');
  const [rows, setRows]     = useState<Transaction[]>(INITIAL_DATA);

  // Calculate summary totals
  const totals = rows.reduce((acc, row) => {
    const amount = parseInt(row.amount.replace('₹', '').replace(',', ''));
    acc.totalBilled += amount;
    if (row.status === 'paid') {
      acc.received += amount;
    } else {
      acc.pending += amount;
    }
    return acc;
  }, { totalBilled: 0, received: 0, pending: 0 });

  const markUploaded = (id: string) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, bill: true } : x)));

  return (
    <View style={styles.screen}>
      {/* ── Top bar: title + outlet filter + add button ── */}
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Accounting ledger</Text>
        <View style={styles.topBarRight}>
          {/* Outlet pill filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.outletScroll}>
            {OUTLETS.map((o) => (
              <TouchableOpacity
                key={o}
                style={[styles.outletPill, outlet === o && styles.outletPillActive]}
                onPress={() => setOutlet(o)}
              >
                <Text style={[styles.outletPillText, outlet === o && styles.outletPillTextActive]}>
                  {o}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.addBtn}>
            <Ionicons name="add-circle-outline" size={16} color={Colors.gold} />
            <Text style={styles.addBtnText}> Add entry</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="Accounting" subtitle="Ledger & payment tracking" />
        
        {/* ── Ledger Table ── */}
        <View style={styles.tableCard}>
          {/* Horizontal scroll wraps the table */}
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* Table header */}
              <View style={styles.thead}>
                <Text style={[styles.th, { width: COL.txnId }]}>Txn ID</Text>
                <Text style={[styles.th, { width: COL.amount }]}>Amount</Text>
                <Text style={[styles.th, { width: COL.date }]}>Order date</Text>
                <Text style={[styles.th, { width: COL.date }]}>Delivery date</Text>
                <Text style={[styles.th, { width: COL.date }]}>Payment date</Text>
                <Text style={[styles.th, { width: COL.bill }]}>Bill</Text>
                <Text style={[styles.th, { width: COL.status }]}>Status</Text>
              </View>

              {/* Table rows */}
              {rows.map((r, idx) => {
                const s = STATUS_STYLE[r.status];
                return (
                  <View
                    key={r.id}
                    style={[styles.trow, idx % 2 === 1 && styles.trowAlt]}
                  >
                    {/* Txn ID */}
                    <Text style={[styles.td, styles.tdTxnId, { width: COL.txnId }]}>
                      {r.id}
                    </Text>

                    {/* Amount */}
                    <Text style={[styles.td, styles.tdAmount, { width: COL.amount }]}>
                      {r.amount}
                    </Text>

                    {/* Order date */}
                    <Text style={[styles.td, { width: COL.date }]}>{r.order}</Text>

                    {/* Delivery date */}
                    <Text style={[styles.td, { width: COL.date }]}>{r.delivery}</Text>

                    {/* Payment date */}
                    <Text style={[styles.td, { width: COL.date }]}>{r.payment}</Text>

                    {/* Bill */}
                    <View style={[styles.tdCell, { width: COL.bill }]}>
                      {r.bill ? (
                        <View style={[styles.uploadedBadge, { backgroundColor: Colors.greenLight }]}>
                          <Ionicons name="image-outline" size={12} color={Colors.green} />
                          <Text style={[styles.uploadedText, { color: Colors.green }]}> Uploaded</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.uploadBtn, { backgroundColor: '#F9FAFB', borderColor: Colors.border }]}
                          onPress={() => markUploaded(r.id)}
                        >
                          <Ionicons name="cloud-upload-outline" size={12} color={Colors.textMuted} />
                          <Text style={[styles.uploadBtnText, { color: Colors.textMuted }]}> Upload</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Status */}
                    <View style={[styles.tdCell, { width: COL.status }]}>
                      <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                        <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* ── Summary Metrics with #F9FAFB base color ── */}
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.metricsRow}>
          {/* Total Billed Card - Blue Theme with #F9FAFB base */}
          <View style={[styles.metricCard, { backgroundColor: '#F9FAFB' }]}>
            <View style={[styles.metricIconContainer, { backgroundColor: Colors.blueLight }]}>
              <Ionicons name="document-text-outline" size={24} color={Colors.blue} />
            </View>
            <Text style={styles.metricLabel}>Total Billed</Text>
            <Text style={[styles.metricValue, { color: Colors.blue }]}>
              ₹{totals.totalBilled.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Received Card - Green Theme with #F9FAFB base */}
          <View style={[styles.metricCard, { backgroundColor: '#F9FAFB' }]}>
            <View style={[styles.metricIconContainer, { backgroundColor: Colors.greenLight }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color={Colors.green} />
            </View>
            <Text style={styles.metricLabel}>Received</Text>
            <Text style={[styles.metricValue, { color: Colors.green }]}>
              ₹{totals.received.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Pending Card - Red Theme with #F9FAFB base */}
          <View style={[styles.metricCard, { backgroundColor: '#F9FAFB' }]}>
            <View style={[styles.metricIconContainer, { backgroundColor: Colors.redLight }]}>
              <Ionicons name="time-outline" size={24} color={Colors.red} />
            </View>
            <Text style={styles.metricLabel}>Pending</Text>
            <Text style={[styles.metricValue, { color: Colors.red }]}>
              ₹{totals.pending.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },

  // ── Top bar ────────────────────────────────────────────────────────────────
  topBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  pageTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  outletScroll: { flexGrow: 0, flex: 1 },
  outletPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F9FAFB',
    marginRight: 6,
  },
  outletPillActive: {
    backgroundColor: Colors.dark,
    borderColor: Colors.dark,
  },
  outletPillText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  outletPillTextActive: { color: Colors.gold },
  addBtn: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtnText: {
    color: Colors.gold,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  // ── Body ───────────────────────────────────────────────────────────────────
  body: { flex: 1, padding: 14 },

  // ── Table ──────────────────────────────────────────────────────────────────
  tableCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  // Header row
  thead: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F2',
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  th: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingRight: 8,
  },

  // Data rows
  trow: {
    flexDirection: 'row',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  trowAlt: {
    backgroundColor: '#FAFAF9',
  },
  td: {
    fontSize: FontSize.sm,
    color: Colors.text,
    paddingRight: 8,
  },
  tdCell: {
    paddingRight: 8,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  tdTxnId: {
    color: Colors.blue,
    fontWeight: FontWeight.semibold,
  },
  tdAmount: {
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },

  // Bill column
  uploadedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadedText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  uploadBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },

  // Status badge
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // ── Summary Metrics - Updated with #F9FAFB ─────────────────────────────────
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 0,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  metricLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});