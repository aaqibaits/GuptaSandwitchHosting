/**
 * StaffReportsScreen.tsx (staff/ReportsScreen.tsx)
 * ─────────────────────────────────────────────────
 * Staff-level sales summary:
 *  - Period picker
 *  - KPI cards (orders, revenue, avg order value)
 *  - Hourly bar chart
 *  - Payment mode breakdown
 *  - Top-selling items
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import MetricCard from '../../components/common/MetricCard';
import Card from '../../components/common/Card';
import ScreenTitle from '../../components/common/ScreenTitle';
import {
  getSummary, getPaymentAnalytics, getTopItems, getHourlySales,
  ReportSummary, PaymentAnalytic, TopItem, HourlySale, ReportParams,
} from '../../services/reportApi';

const SCREEN_WIDTH = Dimensions.get('window').width;
const STAFF_GREEN = '#16A34A';

// ── Mock data per period ──────────────────────────────────────────────────────
const PERIOD_DATA = {
  today: {
    orders: 47, revenue: 9_840, avg: 209,
    hourly: [2, 4, 8, 12, 10, 7, 4],
    hourLabels: ['11', '12', '13', '14', '15', '16', '17'],
    payments: [
      { method: 'Cash',   pct: 45, amount: 4_428 },
      { method: 'UPI',    pct: 35, amount: 3_444 },
      { method: 'Card',   pct: 12, amount: 1_181 },
      { method: 'Online', pct: 8,  amount: 787 },
    ],
    topItems: [
      { name: 'Paneer Cheesy Grilled (Jumbo)', qty: 18, revenue: 3_060 },
      { name: 'Veggie Cheesy Grilled (Jumbo)', qty: 14, revenue: 2_100 },
      { name: 'Gupta Special Panini',          qty: 8,  revenue: 1_600 },
      { name: 'French Fries',                  qty: 22, revenue: 1_980 },
      { name: 'Cold Coffee',                   qty: 11, revenue: 1_100 },
    ],
  },
  yesterday: {
    orders: 53, revenue: 11_240, avg: 212,
    hourly: [3, 6, 9, 14, 11, 8, 2],
    hourLabels: ['11', '12', '13', '14', '15', '16', '17'],
    payments: [
      { method: 'Cash',   pct: 40, amount: 4_496 },
      { method: 'UPI',    pct: 38, amount: 4_271 },
      { method: 'Card',   pct: 15, amount: 1_686 },
      { method: 'Online', pct: 7,  amount: 787 },
    ],
    topItems: [
      { name: 'Paneer Cheesy Grilled (Jumbo)', qty: 22, revenue: 3_740 },
      { name: 'French Fries',                  qty: 19, revenue: 1_710 },
      { name: 'Mint Mojito Blast',             qty: 14, revenue: 1_260 },
      { name: 'Gupta Special Panini',          qty: 10, revenue: 2_000 },
      { name: 'Veg Cheese Burger',             qty: 16, revenue: 1_200 },
    ],
  },
  week: {
    orders: 312, revenue: 66_480, avg: 213,
    hourly: [18, 42, 58, 74, 62, 38, 20],
    hourLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    payments: [
      { method: 'Cash',   pct: 42, amount: 27_922 },
      { method: 'UPI',    pct: 36, amount: 23_933 },
      { method: 'Card',   pct: 14, amount: 9_307 },
      { method: 'Online', pct: 8,  amount: 5_318 },
    ],
    topItems: [
      { name: 'Paneer Cheesy Grilled (Jumbo)', qty: 112, revenue: 19_040 },
      { name: 'French Fries',                  qty: 98,  revenue: 8_820 },
      { name: 'Gupta Special Panini',          qty: 64,  revenue: 12_800 },
      { name: 'Veg Cheese Burger',             qty: 87,  revenue: 6_525 },
      { name: 'Cold Coffee',                   qty: 74,  revenue: 7_400 },
    ],
  },
  month: {
    orders: 1_248, revenue: 267_120, avg: 214,
    hourly: [80, 168, 220, 290, 242, 160, 88],
    hourLabels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
    payments: [
      { method: 'Cash',   pct: 41, amount: 109_519 },
      { method: 'UPI',    pct: 37, amount: 98_834 },
      { method: 'Card',   pct: 14, amount: 37_397 },
      { method: 'Online', pct: 8,  amount: 21_370 },
    ],
    topItems: [
      { name: 'Paneer Cheesy Grilled (Jumbo)', qty: 448, revenue: 76_160 },
      { name: 'French Fries',                  qty: 392, revenue: 35_280 },
      { name: 'Gupta Special Panini',          qty: 256, revenue: 51_200 },
      { name: 'Veg Cheese Burger',             qty: 348, revenue: 26_100 },
      { name: 'Cold Coffee',                   qty: 296, revenue: 29_600 },
    ],
  },
};

const PERIODS = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week',      label: 'This Week' },
  { key: 'month',     label: 'This Month' },
] as const;

type PeriodKey = typeof PERIODS[number]['key'];

const PAYMENT_ICON_NAMES: Record<string, string> = {
  Cash: 'cash-outline', UPI: 'phone-portrait-outline', Card: 'card-outline', Online: 'globe-outline',
};

const PAYMENT_COLORS = ['#16A34A', '#2563EB', '#9333EA', '#F97316'];

function fmt(n: number): string {
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const formatDate = (date: Date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

export default function StaffReportsScreen() {
  const [period, setPeriod] = useState<PeriodKey>('today');

  // Real API state
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [payments, setPayments] = useState<PaymentAnalytic[]>([]);
  const [topItems, setTopItemsState] = useState<TopItem[]>([]);
  const [hourly, setHourly] = useState<HourlySale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async (p: PeriodKey) => {
    setLoading(true);

    const todayStr = formatDate(new Date());
    let startDate = '';
    let endDate = todayStr;

    if (p === 'today') {
      startDate = todayStr;
    } else if (p === 'yesterday') {
      startDate = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
      endDate = startDate;
    } else if (p === 'week') {
      startDate = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    } else if (p === 'month') {
      startDate = formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    }

    const params: ReportParams = {
      start_date: startDate,
      end_date: endDate,
    };

    try {
      const [sumRes, payRes, topRes, hrRes] = await Promise.all([
        getSummary(params),
        getPaymentAnalytics(params),
        getTopItems({ ...params, limit: 5 }),
        getHourlySales(params),
      ]);
      setSummary(sumRes.summary);
      setPayments(payRes.payments ?? []);
      setTopItemsState(topRes.items ?? []);
      setHourly(hrRes.hourly ?? []);
    } catch {
      // Keep previous data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(period); }, [period, fetchReports]);

  // Chart data
  const chartLabels = hourly.map(h => String(h.label));
  const chartData = {
    labels: chartLabels.length ? chartLabels : ['--'],
    datasets: [{ data: hourly.length ? hourly.map(h => h.orders) : [0] }],
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle title="My Sales Report" subtitle={`Performance for this outlet`} />

      {/* Period pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
        {PERIODS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.pill, period === key && styles.pillActive]}
            onPress={() => setPeriod(key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, period === key && styles.pillTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* KPI cards */}
      <View style={styles.metricsRow}>
        <MetricCard label="Orders" value={loading ? '…' : (summary?.total_orders ?? 0)} sub="this period" />
        <MetricCard label="Revenue" value={loading ? '…' : `₹${fmt(summary?.total_revenue ?? 0)}`} sub="gross sales" />
        <MetricCard label="Avg Order" value={loading ? '…' : `₹${summary?.avg_order_value ?? 0}`} sub="per order" />
      </View>

      {/* Bar chart */}
      <Card style={styles.chartCard} padding={16}>
        <Text style={styles.chartTitle}>
          {period === 'week' ? 'Orders by Day' : period === 'month' ? 'Orders by Week' : 'Orders by Hour'}
        </Text>
        <BarChart
          data={chartData}
          width={SCREEN_WIDTH - 72}
          height={180}
          fromZero
          withInnerLines={false}
          showBarTops={false}
          chartConfig={{
            backgroundColor: Colors.surface,
            backgroundGradientFrom: Colors.surface,
            backgroundGradientTo: Colors.surface,
            decimalPlaces: 0,
            color: () => STAFF_GREEN,
            labelColor: () => Colors.textMuted,
            barPercentage: 0.6,
            propsForLabels: { fontSize: 10 },
          }}
          style={{ borderRadius: 8, marginLeft: -16 }}
          yAxisLabel=""
          yAxisSuffix=""
        />
      </Card>

      {/* Payment breakdown */}
      <Card padding={16} style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <Ionicons name="card-outline" size={16} color={Colors.text} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Payment Breakdown</Text>
        </View>
        {(payments.length ? payments : []).map((p, idx) => (
          <View key={p.payment_method} style={styles.payRow}>
            <Ionicons name={(PAYMENT_ICON_NAMES[p.payment_method] ?? 'wallet-outline') as any} size={16} color={PAYMENT_COLORS[idx % 4]} />
            <Text style={styles.payMethod}>{p.payment_method}</Text>
            <View style={styles.payBarWrap}>
              <View style={[styles.payBar, { width: `${p.percentage}%`, backgroundColor: PAYMENT_COLORS[idx % 4] }]} />
            </View>
            <Text style={styles.payPct}>{Math.round(p.percentage)}%</Text>
            <Text style={styles.payAmt}>₹{p.amount?.toLocaleString()}</Text>
          </View>
        ))}
        {payments.length === 0 && <Text style={{ color: Colors.textMuted }}>{loading ? 'Loading…' : 'No data'}</Text>}
      </Card>

      {/* Top items */}
      <Card padding={0} style={styles.sectionCard}>
        <View style={styles.tableHead}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="trophy-outline" size={14} color={Colors.textMuted} style={{ marginRight: 5 }} />
            <Text style={styles.tableHeadText}>Top Selling Items</Text>
          </View>
        </View>
        {topItems.map((item, idx) => (
          <View
            key={item.name}
            style={[styles.tableRow, idx < topItems.length - 1 && styles.tableRowBorder]}
          >
            <View style={[styles.rankBadge, { backgroundColor: idx === 0 ? '#FEF9C3' : Colors.bg }]}>
              <Text style={[styles.rankText, { color: idx === 0 ? '#B45309' : Colors.textMuted }]}>
                #{idx + 1}
              </Text>
            </View>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.itemQty}>{item.qty_sold} sold</Text>
            <Text style={styles.itemRev}>₹{item.revenue?.toLocaleString()}</Text>
          </View>
        ))}
        {topItems.length === 0 && (
          <View style={{ padding: 16 }}>
            <Text style={{ color: Colors.textMuted, textAlign: 'center' }}>{loading ? 'Loading…' : 'No data'}</Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 32 },

  pillRow: { marginBottom: 14, flexGrow: 0 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, marginRight: 8,
  },
  pillActive: { backgroundColor: STAFF_GREEN, borderColor: STAFF_GREEN },
  pillText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textMuted },
  pillTextActive: { color: '#fff' },

  metricsRow: { flexDirection: 'row', marginHorizontal: -4, marginBottom: 12 },

  chartCard: { marginBottom: 12 },
  chartTitle: {
    fontSize: FontSize.base, fontWeight: FontWeight.semibold,
    color: Colors.text, marginBottom: 12,
  },

  sectionCard: { marginBottom: 12 },
  sectionTitle: {
    fontSize: FontSize.base, fontWeight: FontWeight.semibold,
    color: Colors.text,
  },

  payRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  payMethod: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium, width: 48 },
  payBarWrap: { flex: 1, height: 8, backgroundColor: Colors.bg, borderRadius: 4, overflow: 'hidden' },
  payBar: { height: 8, borderRadius: 4 },
  payPct: { fontSize: FontSize.xs, color: Colors.textMuted, width: 32, textAlign: 'right' },
  payAmt: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.text, width: 70, textAlign: 'right' },

  tableHead: {
    padding: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    backgroundColor: '#F9F9F7',
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
  },
  tableHeadText: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  tableRowBorder: { borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  rankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  itemName: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  itemQty: { fontSize: FontSize.xs, color: Colors.textMuted, width: 52 },
  itemRev: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text, width: 70, textAlign: 'right' },
});
