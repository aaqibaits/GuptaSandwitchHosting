/**
 * DashboardScreen.tsx
 * ───────────────────
 * Admin dashboard — period-filtered bar chart + 3 KPI metric cards.
 * Mirrors Dashboard.jsx from the web admin panel.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import MetricCard from '../../components/common/MetricCard';
import Card from '../../components/common/Card';
import ScreenTitle from '../../components/common/ScreenTitle';
import { getOutletDashboardStats, DashboardStats } from '../../services/outletApi';

const SCREEN_WIDTH = Dimensions.get('window').width;

const OUTLETS = ['Koregaon Park', 'Baner', 'Kothrud'];

const PERIOD_DATA: Record<string, number[]> = {
  today:     [112, 84, 61],
  yesterday: [128, 97, 72],
  week:      [810, 612, 448],
  month:     [3420, 2580, 1920],
};

const PERIODS = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week',      label: 'Last week' },
  { key: 'month',     label: 'Last month' },
];

export default function DashboardScreen() {
  const [period, setPeriod] = useState('today');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOutletDashboardStats();
      setStats(res.stats);
    } catch {
      // Stats unavailable — show zeros
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Derived display values
  const outletNames = stats?.outlets ?? [];
  const periodOrders = stats?.periodData?.[period as 'today' | 'yesterday' | 'week' | 'month'] ?? [];

  const combined = outletNames.map((name, idx) => ({
    name,
    orders: periodOrders[idx] ?? 0,
  }));
  combined.sort((a, b) => b.orders - a.orders);

  const total = combined.reduce((sum, item) => sum + item.orders, 0);
  const avg = combined.length ? Math.round(total / combined.length) : 0;
  const topOutlet = combined.length > 0 ? combined[0] : null;

  const chartLabels = combined.map(o => o.name.split(' ')[0]);
  const chartData = {
    labels: chartLabels.length ? chartLabels : ['No data'],
    datasets: [{ data: combined.length ? combined.map(o => o.orders) : [0] }],
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle title="Dashboard" subtitle="Orders overview across all outlets" />

      {/* Period filter pills */}
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

      {/* Metric cards row */}
      <View style={styles.metricsRow}>
        <MetricCard label="Total orders" value={loading ? '…' : total} sub="All outlets" />
        <MetricCard
          label="Best outlet"
          value={loading ? '…' : (topOutlet?.name.split(' ')[0] ?? '—')}
          sub={topOutlet ? `${topOutlet.orders} orders` : '—'}
          valueStyle={{ fontSize: FontSize.lg }}
        />
        <MetricCard
          label="Avg per outlet"
          value={loading ? '…' : avg}
          sub="orders"
        />
      </View>

      {/* Bar chart */}
      <Card style={styles.chartCard} padding={16}>
        <Text style={styles.chartTitle}>Orders sold — by outlet</Text>
        <BarChart
          data={chartData}
          width={SCREEN_WIDTH - 72}
          height={200}
          fromZero
          withInnerLines={false}
          showBarTops={false}
          chartConfig={{
            backgroundColor: Colors.surface,
            backgroundGradientFrom: Colors.surface,
            backgroundGradientTo: Colors.surface,
            decimalPlaces: 0,
            color: () => Colors.dark,
            labelColor: () => Colors.textMuted,
            barPercentage: 0.55,
            propsForLabels: { fontSize: 11 },
          }}
          style={{ borderRadius: 8, marginLeft: -16 }}
          yAxisLabel=""
          yAxisSuffix=""
        />
      </Card>

      {/* Outlet breakdown table */}
      <Card padding={0}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Outlet breakdown</Text>
        </View>
        {combined.length === 0 ? (
          <View style={{ padding: 16 }}>
            <Text style={{ color: Colors.textMuted, textAlign: 'center' }}>
              {loading ? 'Loading…' : 'No outlet data available'}
            </Text>
          </View>
        ) : combined.map((item, idx) => (
          <View
            key={item.name}
            style={[styles.tableRow, idx < combined.length - 1 && styles.tableRowBorder]}
          >
            <View style={styles.outletDot}>
              <View style={[
                styles.dot,
                { backgroundColor: ['#1a1208', '#c8970a', '#5DCAA5'][idx % 3] }
              ]} />
              <Text style={styles.outletName}>{item.name}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowOrders}>{item.orders} orders</Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>

  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 32 },


  pillRow: { marginBottom: 14, flexGrow: 0 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: Colors.dark,
    borderColor: Colors.dark,
  },
  pillText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
  },
  pillTextActive: { color: Colors.gold },

  metricsRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 12,
  },

  chartCard: { marginBottom: 12 },
  chartTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 12,
  },

  tableHeader: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    backgroundColor: '#F9F9F7',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tableHeaderText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tableRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  outletDot: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  outletName: {
    fontSize: FontSize.base,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowOrders: { fontSize: FontSize.sm, color: Colors.textMuted },
  rowRevenue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  rowTrend: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, minWidth: 36 },
});
