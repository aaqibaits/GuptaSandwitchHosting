/**
 * ReportsScreen.tsx
 * ─────────────────
 * All reports displayed in tabular format with outlet & period filters.
 * Outlet and Date in same row as dropdowns.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions, RefreshControl,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import Card from '../../components/common/Card';
import ScreenTitle from '../../components/common/ScreenTitle';
import {
  getRecentOrders, getSummary, getPaymentAnalytics,
  getCategorySales, getHourlySales, getTopItems,
  RecentOrder, ReportSummary, PaymentAnalytic, CategorySale, HourlySale, TopItem
} from '../../services/reportApi';
import { getAllOutlets, ApiOutlet } from '../../services/outletApi';
import { getDishes, ApiDish } from '../../services/dishesApi';

const SCREEN_WIDTH = Dimensions.get('window').width;

const PERIODS = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week',      label: 'Last 7 Days' },
  { key: 'month',     label: 'This Month' },
] as const;

type PeriodKey = typeof PERIODS[number]['key'];

const formatDate = (date: Date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

// Section component for each report table
const ReportSection = ({ title, icon, children }: { title: string; icon: React.ComponentProps<typeof Ionicons>['name']; children: React.ReactNode }) => (
  <View style={styles.sectionContainer}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <Card padding={0} style={styles.tableCard}>
      {children}
    </Card>
  </View>
);

export default function ReportsScreen() {
  const [period, setPeriod] = useState<PeriodKey>('week');
  const [selectedOutletId, setSelectedOutletId] = useState<number | undefined>(undefined);
  const [outletsList, setOutletsList] = useState<ApiOutlet[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showOutletModal, setShowOutletModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  // API datasets
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytic[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySale[]>([]);
  const [hourlySales, setHourlySales] = useState<HourlySale[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [dishes, setDishes] = useState<ApiDish[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get selected outlet name
  const selectedOutletName = useMemo(() => {
    if (selectedOutletId === undefined) return 'All Outlets';
    const outlet = outletsList.find(o => o.id === selectedOutletId);
    return outlet?.name || 'All Outlets';
  }, [selectedOutletId, outletsList]);

  // Get selected period label
  const selectedPeriodLabel = useMemo(() => {
    const periodObj = PERIODS.find(p => p.key === period);
    return periodObj?.label || 'Last 7 Days';
  }, [period]);

  // Load Outlets list on mount
  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const res = await getAllOutlets();
        if (res.success) {
          setOutletsList(res.outlets || []);
        }
      } catch (err) {
        console.error('Failed to load outlets:', err);
      }
    };
    fetchOutlets();
  }, []);

  // Format start_date and end_date based on period selection
  const filterParams = useMemo(() => {
    const todayStr = formatDate(new Date());
    let startDate = '';
    let endDate = todayStr;

    if (period === 'today') {
      startDate = todayStr;
    } else if (period === 'yesterday') {
      startDate = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
      endDate = startDate;
    } else if (period === 'week') {
      startDate = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    } else if (period === 'month') {
      startDate = formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    }

    return {
      start_date: startDate,
      end_date: endDate,
      outlet_id: selectedOutletId,
    };
  }, [period, selectedOutletId]);

  // Central fetch method
  const fetchAllReportsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryRes,
        recentRes,
        paymentRes,
        categoryRes,
        hourlyRes,
        topItemsRes,
        dishesRes
      ] = await Promise.all([
        getSummary(filterParams),
        getRecentOrders({ ...filterParams, limit: 1000 }),
        getPaymentAnalytics(filterParams),
        getCategorySales(filterParams),
        getHourlySales(filterParams),
        getTopItems({ ...filterParams, limit: 100 }),
        getDishes(),
      ]);

      setSummary(summaryRes.summary);
      setRecentOrders(recentRes.orders ?? []);
      setPaymentAnalytics(paymentRes.payments ?? []);
      setCategorySales(categoryRes.categories ?? []);
      setHourlySales(hourlyRes.hourly ?? []);
      setTopItems(topItemsRes.items ?? []);
      setDishes(dishesRes.dishes ?? []);
    } catch (err: any) {
      console.error('Failed to fetch report details:', err);
      setError(err?.message || 'Failed to fetch reporting data from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterParams]);

  // Load data on mount and filter changes
  useEffect(() => {
    fetchAllReportsData();
  }, [fetchAllReportsData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllReportsData();
  }, [fetchAllReportsData]);

  // Computed data for reports
  const dailyRows = useMemo(() => {
    const groups: Record<string, {
      date: string;
      outlet: string;
      offlineCash: number;
      offlineUpi: number;
      onlineSwiggy: number;
      onlineZomato: number;
      total: number;
      itemsSold: number;
    }> = {};

    recentOrders.forEach((order) => {
      const dateObj = new Date(order.created_at);
      const dateKey = dateObj.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short"
      });

      const outletName = order.outlet_name || 'Outlet';
      const outletId = order.outlet_id || 'unknown';
      const groupKey = `${dateKey}_${outletId}`;

      const amount = Number(order.total || 0);
      const itemsCount = Number(order.items_count || 0);

      if (!groups[groupKey]) {
        groups[groupKey] = {
          date: dateKey,
          outlet: outletName,
          offlineCash: 0,
          offlineUpi: 0,
          onlineSwiggy: 0,
          onlineZomato: 0,
          total: 0,
          itemsSold: 0
        };
      }

      const isSwiggy = order.order_type?.toLowerCase() === 'swiggy';
      const isZomato = order.order_type?.toLowerCase() === 'zomato';

      if (isSwiggy) {
        groups[groupKey].onlineSwiggy += amount;
      } else if (isZomato) {
        groups[groupKey].onlineZomato += amount;
      } else {
        if (order.payment_method?.toLowerCase() === 'cash') {
          groups[groupKey].offlineCash += amount;
        } else {
          groups[groupKey].offlineUpi += amount;
        }
      }
      groups[groupKey].total += amount;
      groups[groupKey].itemsSold += itemsCount;
    });

    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [recentOrders]);

  const paymentBreakdown = useMemo(() => {
    let offlineCash = 0;
    let offlineUpi = 0;
    let onlineSwiggy = 0;
    let onlineZomato = 0;

    recentOrders.forEach((order) => {
      const amount = Number(order.total || 0);
      const isSwiggy = order.order_type?.toLowerCase() === 'swiggy';
      const isZomato = order.order_type?.toLowerCase() === 'zomato';

      if (isSwiggy) {
        onlineSwiggy += amount;
      } else if (isZomato) {
        onlineZomato += amount;
      } else {
        if (order.payment_method?.toLowerCase() === 'cash') {
          offlineCash += amount;
        } else {
          offlineUpi += amount;
        }
      }
    });

    return {
      offlineCash,
      offlineUpi,
      onlineSwiggy,
      onlineZomato,
      offlineTotal: offlineCash + offlineUpi,
      onlineTotal: onlineSwiggy + onlineZomato,
      totalPayments: offlineCash + offlineUpi + onlineSwiggy + onlineZomato
    };
  }, [recentOrders]);

  const platformStats = useMemo(() => {
    const stats = {
      swiggy: { orders: 0, revenue: 0 },
      zomato: { orders: 0, revenue: 0 },
      direct: { orders: 0, revenue: 0 }
    };

    recentOrders.forEach((order) => {
      const amount = Number(order.total || 0);
      const type = order.order_type?.toLowerCase();
      if (type === 'swiggy') {
        stats.swiggy.orders += 1;
        stats.swiggy.revenue += amount;
      } else if (type === 'zomato') {
        stats.zomato.orders += 1;
        stats.zomato.revenue += amount;
      } else {
        stats.direct.orders += 1;
        stats.direct.revenue += amount;
      }
    });

    return stats;
  }, [recentOrders]);

  const peakHoursRows = useMemo(() => {
    const slots: Record<string, { slot: string; orders: number; revenue: number }> = {};
    for (let h = 0; h < 24; h += 2) {
      const startStr = `${h.toString().padStart(2, '0')}:00`;
      const endStr = `${(h + 2).toString().padStart(2, '0')}:00`;
      const key = `${startStr} - ${endStr}`;
      slots[key] = { slot: key, orders: 0, revenue: 0 };
    }

    hourlySales.forEach((row) => {
      const h = Number(row.hour);
      const slotIndex = Math.floor(h / 2) * 2;
      const startStr = `${slotIndex.toString().padStart(2, '0')}:00`;
      const endStr = `${(slotIndex + 2).toString().padStart(2, '0')}:00`;
      const key = `${startStr} - ${endStr}`;

      if (slots[key]) {
        slots[key].orders += Number(row.orders || 0);
        slots[key].revenue += Number(row.revenue || 0);
      }
    });

    return Object.values(slots)
      .filter((s) => s.orders > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [hourlySales]);

  const ingredientUsage = useMemo(() => {
    const ingredientMap = new Map<string, number>();

    topItems.forEach((item) => {
      const qtySold = Number(item.qty_sold ?? 0);
      if (qtySold <= 0) return;

      let recipe = RECIPES[item.name];

      if (!recipe) {
        const dishObj = dishes.find((d) => d.name === item.name);
        if (dishObj && dishObj.ingredients) {
          recipe = dishObj.ingredients.map((ingName) => ({
            name: ingName,
            qty: 50
          }));
        }
      }

      if (recipe) {
        recipe.forEach((ing) => {
          const totalIngQty = ing.qty * qtySold;
          ingredientMap.set(
            ing.name,
            (ingredientMap.get(ing.name) || 0) + totalIngQty
          );
        });
      }
    });

    return Array.from(ingredientMap.entries())
      .map(([name, qty]) => ({ name, quantity: qty, unit: 'grams' }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [topItems, dishes]);

  const totalIngredientCost = useMemo(() => {
    return ingredientUsage.reduce((sum, ing) => {
      const costPerGram = COST_PER_GRAM[ing.name] || 0.2;
      return sum + ing.quantity * costPerGram;
    }, 0);
  }, [ingredientUsage]);

  const foodCostPercentage = useMemo(() => {
    const totalRev = summary?.total_revenue || 0;
    if (!totalRev) return 0;
    return (totalIngredientCost / totalRev) * 100;
  }, [totalIngredientCost, summary]);

  const totalGST = summary?.total_gst || 0;

  // Render Modal for Outlet Selection
  const renderOutletModal = () => (
    <Modal
      visible={showOutletModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowOutletModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowOutletModal(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Outlet</Text>
            <TouchableOpacity onPress={() => setShowOutletModal(false)}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            <TouchableOpacity
              style={[styles.modalItem, selectedOutletId === undefined && styles.modalItemActive]}
              onPress={() => {
                setSelectedOutletId(undefined);
                setShowOutletModal(false);
              }}
            >
              <Text style={[styles.modalItemText, selectedOutletId === undefined && styles.modalItemTextActive]}>
                All Outlets
              </Text>
              {selectedOutletId === undefined && (
                <Ionicons name="checkmark" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
            {outletsList.map((outlet) => (
              <TouchableOpacity
                key={outlet.id}
                style={[styles.modalItem, selectedOutletId === outlet.id && styles.modalItemActive]}
                onPress={() => {
                  setSelectedOutletId(outlet.id);
                  setShowOutletModal(false);
                }}
              >
                <Text style={[styles.modalItemText, selectedOutletId === outlet.id && styles.modalItemTextActive]}>
                  {outlet.name}
                </Text>
                {selectedOutletId === outlet.id && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Render Modal for Date Selection
  const renderDateModal = () => (
    <Modal
      visible={showDateModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDateModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowDateModal(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            <TouchableOpacity onPress={() => setShowDateModal(false)}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalList}>
            {PERIODS.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[styles.modalItem, period === key && styles.modalItemActive]}
                onPress={() => {
                  setPeriod(key);
                  setShowDateModal(false);
                }}
              >
                <Text style={[styles.modalItemText, period === key && styles.modalItemTextActive]}>
                  {label}
                </Text>
                {period === key && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Fetching report metrics…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      <ScreenTitle title="Reports" subtitle="Complete business analytics" />

      {/* Filter Section - Outlet and Date in same row */}
      <View style={styles.filterSection}>
        <View style={styles.filterRow}>
          {/* Outlet Dropdown */}
          <TouchableOpacity 
            style={styles.filterDropdown}
            onPress={() => setShowOutletModal(true)}
          >
            <Text style={styles.filterLabel}>Outlet</Text>
            <View style={styles.filterValue}>
              <Text style={styles.filterValueText}>{selectedOutletName}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Date Dropdown */}
          <TouchableOpacity 
            style={styles.filterDropdown}
            onPress={() => setShowDateModal(true)}
          >
            <Text style={styles.filterLabel}>Date</Text>
            <View style={styles.filterValue}>
              <Text style={styles.filterValueText}>{selectedPeriodLabel}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      {renderOutletModal()}
      {renderDateModal()}

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={32} color={Colors.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAllReportsData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Revenue</Text>
              <Text style={styles.summaryValue}>₹{summary?.total_revenue?.toLocaleString('en-IN') || 0}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Orders</Text>
              <Text style={styles.summaryValue}>{summary?.total_orders || 0}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Avg. Ticket</Text>
              <Text style={styles.summaryValue}>₹{summary?.avg_order_value || 0}</Text>
            </View>
          </View>

          {/* 1. Daily Sales Report */}
          <ReportSection title="Daily Sales Report" icon="calendar-outline">
            <View style={[styles.tableRow, styles.tableHeadRow]}>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Date</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1.2 }]}>Outlet</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Cash</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>UPI</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Swiggy</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Zomato</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Total</Text>
            </View>
            {dailyRows.length === 0 ? (
              <View style={styles.emptyTableRow}><Text style={styles.emptyText}>No data available</Text></View>
            ) : (
              dailyRows.map((row, idx) => (
                <View key={idx} style={[styles.tableRow, idx < dailyRows.length - 1 && styles.tableRowBorder]}>
                  <Text style={[styles.tableCell, { flex: 1 }]}>{row.date}</Text>
                  <Text style={[styles.tableCell, { flex: 1.2 }]} numberOfLines={1}>{row.outlet}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>₹{row.offlineCash.toLocaleString('en-IN')}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>₹{row.offlineUpi.toLocaleString('en-IN')}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>₹{row.onlineSwiggy.toLocaleString('en-IN')}</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>₹{row.onlineZomato.toLocaleString('en-IN')}</Text>
                  <Text style={[styles.tableCell, styles.tableCellBold, { flex: 1 }]}>₹{row.total.toLocaleString('en-IN')}</Text>
                </View>
              ))
            )}
            <View style={[styles.tableRow, styles.totalRow]}>
              <Text style={[styles.tableCell, { flex: 2.2 }]}>Total</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}></Text>
              <Text style={[styles.tableCell, { flex: 1 }]}></Text>
              <Text style={[styles.tableCell, { flex: 1 }]}></Text>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 1 }]}>
                ₹{(dailyRows.reduce((sum, r) => sum + r.total, 0)).toLocaleString('en-IN')}
              </Text>
            </View>
          </ReportSection>

          {/* 2. Cash / Online Report */}
          <ReportSection title="Cash / Online Report" icon="cash-outline">
            <View style={[styles.tableRow, styles.tableHeadRow]}>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1.5 }]}>Payment Mode</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Amount (₹)</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Percentage</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Cash (Offline)</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>₹{paymentBreakdown.offlineCash.toLocaleString('en-IN')}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {paymentBreakdown.totalPayments ? ((paymentBreakdown.offlineCash / paymentBreakdown.totalPayments) * 100).toFixed(1) : 0}%
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>UPI (Offline)</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>₹{paymentBreakdown.offlineUpi.toLocaleString('en-IN')}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {paymentBreakdown.totalPayments ? ((paymentBreakdown.offlineUpi / paymentBreakdown.totalPayments) * 100).toFixed(1) : 0}%
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Swiggy (Online)</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>₹{paymentBreakdown.onlineSwiggy.toLocaleString('en-IN')}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {paymentBreakdown.totalPayments ? ((paymentBreakdown.onlineSwiggy / paymentBreakdown.totalPayments) * 100).toFixed(1) : 0}%
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Zomato (Online)</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>₹{paymentBreakdown.onlineZomato.toLocaleString('en-IN')}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>
                {paymentBreakdown.totalPayments ? ((paymentBreakdown.onlineZomato / paymentBreakdown.totalPayments) * 100).toFixed(1) : 0}%
              </Text>
            </View>
            <View style={[styles.tableRow, styles.totalRow]}>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 1.5 }]}>Total</Text>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 1 }]}>₹{paymentBreakdown.totalPayments.toLocaleString('en-IN')}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>100%</Text>
            </View>
          </ReportSection>

          {/* 3. GST Report */}
          <ReportSection title="GST Report" icon="receipt-outline">
            <View style={[styles.tableRow, styles.tableHeadRow]}>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1.5 }]}>Component</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Rate</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Amount (₹)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Taxable Value</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>-</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>₹{((summary?.total_revenue || 0) - totalGST).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>CGST</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>9%</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>₹{(totalGST / 2).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>SGST</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>9%</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>₹{(totalGST / 2).toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.tableRow, styles.totalRow]}>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 1.5 }]}>Total GST</Text>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 1 }]}>18%</Text>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 1, color: Colors.primary }]}>₹{totalGST.toLocaleString('en-IN')}</Text>
            </View>
          </ReportSection>

          {/* 4. Category Report */}
          <ReportSection title="Category Report" icon="pricetag-outline">
            <View style={[styles.tableRow, styles.tableHeadRow]}>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1.5 }]}>Category</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Items Sold</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Revenue (₹)</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 0.8 }]}>Share</Text>
            </View>
            {categorySales.length === 0 ? (
              <View style={styles.emptyTableRow}><Text style={styles.emptyText}>No data available</Text></View>
            ) : (
              categorySales.map((cat, idx) => {
                const totalRev = summary?.total_revenue || 1;
                const pct = ((cat.revenue / totalRev) * 100).toFixed(1);
                return (
                  <View key={idx} style={[styles.tableRow, idx < categorySales.length - 1 && styles.tableRowBorder]}>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>{cat.category || 'Uncategorized'}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{cat.items_sold}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>₹{cat.revenue.toLocaleString('en-IN')}</Text>
                    <Text style={[styles.tableCell, { flex: 0.8 }]}>{pct}%</Text>
                  </View>
                );
              })
            )}
          </ReportSection>

          {/* 5. Hourly Report */}
          <ReportSection title="Hourly Report" icon="time-outline">
            <View style={[styles.tableRow, styles.tableHeadRow]}>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1.2 }]}>Time Slot</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 0.8 }]}>Orders</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Revenue (₹)</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 0.8 }]}>Avg. Ticket</Text>
            </View>
            {peakHoursRows.length === 0 ? (
              <View style={styles.emptyTableRow}><Text style={styles.emptyText}>No data available</Text></View>
            ) : (
              peakHoursRows.map((row, idx) => {
                const avgTicket = row.orders ? Math.round(row.revenue / row.orders) : 0;
                return (
                  <View key={idx} style={[styles.tableRow, idx < peakHoursRows.length - 1 && styles.tableRowBorder]}>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>{row.slot}</Text>
                    <Text style={[styles.tableCell, { flex: 0.8 }]}>{row.orders}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>₹{row.revenue.toLocaleString('en-IN')}</Text>
                    <Text style={[styles.tableCell, { flex: 0.8 }]}>₹{avgTicket.toLocaleString('en-IN')}</Text>
                  </View>
                );
              })
            )}
          </ReportSection>

          {/* 6. Swiggy / Zomato Report */}
          <ReportSection title="Swiggy / Zomato Report" icon="bicycle-outline">
            <View style={[styles.tableRow, styles.tableHeadRow]}>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1.2 }]}>Platform</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 0.8 }]}>Orders</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Gross (₹)</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 0.8 }]}>Commission</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Net (₹)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.2, color: Colors.purple }]}>Swiggy</Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>{platformStats.swiggy.orders}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>₹{platformStats.swiggy.revenue.toLocaleString('en-IN')}</Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>15%</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>₹{Math.round(platformStats.swiggy.revenue * 0.85).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.2, color: Colors.red }]}>Zomato</Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>{platformStats.zomato.orders}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>₹{platformStats.zomato.revenue.toLocaleString('en-IN')}</Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>15%</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>₹{Math.round(platformStats.zomato.revenue * 0.85).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.2, color: Colors.green }]}>Direct POS</Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>{platformStats.direct.orders}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>₹{platformStats.direct.revenue.toLocaleString('en-IN')}</Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>0%</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>₹{platformStats.direct.revenue.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.tableRow, styles.totalRow]}>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 1.2 }]}>Total</Text>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 0.8 }]}>{recentOrders.length}</Text>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 1 }]}>
                ₹{(platformStats.swiggy.revenue + platformStats.zomato.revenue + platformStats.direct.revenue).toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>-</Text>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 1 }]}>
                ₹{Math.round(platformStats.direct.revenue + (platformStats.swiggy.revenue + platformStats.zomato.revenue) * 0.85).toLocaleString('en-IN')}
              </Text>
            </View>
          </ReportSection>

          {/* 7. Food Cost Report */}
          <ReportSection title="Food Cost Report" icon="nutrition-outline">
            <View style={[styles.tableRow, styles.tableHeadRow]}>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 2 }]}>Ingredient</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Quantity (kg)</Text>
              <Text style={[styles.tableCell, styles.tableHead, { flex: 1 }]}>Cost (₹)</Text>
            </View>
            <View style={[styles.tableRow, { backgroundColor: '#FFF8F2' }]}>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 2 }]}>Total Revenue</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>-</Text>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 1 }]}>₹{summary?.total_revenue?.toLocaleString('en-IN') || 0}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 2 }]}>Total Ingredient Cost</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>-</Text>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 1 }]}>₹{Math.round(totalIngredientCost).toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.tableRow, styles.totalRow]}>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 2 }]}>Food Cost %</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>-</Text>
              <Text style={[styles.tableCell, styles.tableCellBold, { flex: 1, color: foodCostPercentage > 35 ? Colors.red : Colors.green }]}>
                {foodCostPercentage.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.divider} />
            {ingredientUsage.length === 0 ? (
              <View style={styles.emptyTableRow}><Text style={styles.emptyText}>No ingredient data available</Text></View>
            ) : (
              ingredientUsage.slice(0, 10).map((ing, idx) => {
                const cost = ing.quantity * (COST_PER_GRAM[ing.name] || 0.2);
                return (
                  <View key={idx} style={[styles.tableRow, idx < ingredientUsage.length - 1 && styles.tableRowBorder]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{ing.name}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{Math.round(ing.quantity / 1000).toLocaleString('en-IN')} kg</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>₹{Math.round(cost).toLocaleString('en-IN')}</Text>
                  </View>
                );
              })
            )}
          </ReportSection>
        </>
      )}
    </ScrollView>
  );
}

const COST_PER_GRAM: Record<string, number> = {
  "Chicken": 0.35,
  "Butter": 0.5,
  "Cream": 0.4,
  "Tomato Puree": 0.08,
  "Spices": 0.6,
  "Paneer": 0.45,
  "Yogurt": 0.1,
  "Bell Peppers": 0.12,
  "Flour": 0.04,
  "Garlic": 0.2,
  "Rice": 0.06,
  "Saffron": 3.5,
  "Milk Powder": 0.25,
  "Sugar": 0.05,
  "Rose Water": 0.3,
  "Rice Batter": 0.05,
  "Potato": 0.03,
  "Onion": 0.04,
  "Milk": 0.06,
  "Coffee": 1.2,
  "Ice Cream": 0.18,
  "Noodles": 0.15,
  "Cabbage": 0.025,
  "Carrot": 0.04,
  "Spring Roll Sheet": 0.1,
};

const RECIPES: Record<string, { name: string; qty: number }[]> = {
  "Butter Chicken": [
    { name: "Chicken", qty: 200 },
    { name: "Butter", qty: 30 },
    { name: "Cream", qty: 25 },
    { name: "Tomato Puree", qty: 80 },
    { name: "Spices", qty: 15 }
  ],
  "Paneer Tikka": [
    { name: "Paneer", qty: 180 },
    { name: "Yogurt", qty: 40 },
    { name: "Spices", qty: 10 },
    { name: "Bell Peppers", qty: 50 }
  ],
  "Garlic Naan": [
    { name: "Flour", qty: 80 },
    { name: "Butter", qty: 10 },
    { name: "Garlic", qty: 5 }
  ],
  "Biryani": [
    { name: "Rice", qty: 150 },
    { name: "Chicken", qty: 120 },
    { name: "Spices", qty: 20 },
    { name: "Saffron", qty: 2 }
  ],
  "Gulab Jamun": [
    { name: "Milk Powder", qty: 50 },
    { name: "Sugar", qty: 40 },
    { name: "Rose Water", qty: 5 }
  ],
  "Masala Dosa": [
    { name: "Rice Batter", qty: 120 },
    { name: "Potato", qty: 80 },
    { name: "Onion", qty: 30 },
    { name: "Spices", qty: 8 }
  ],
  "Cold Coffee": [
    { name: "Milk", qty: 150 },
    { name: "Coffee", qty: 8 },
    { name: "Sugar", qty: 15 },
    { name: "Ice Cream", qty: 40 }
  ],
  "Spring Rolls": [
    { name: "Noodles", qty: 60 },
    { name: "Cabbage", qty: 40 },
    { name: "Carrot", qty: 30 },
    { name: "Spring Roll Sheet", qty: 25 }
  ]
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 48 },

  // Filter Section - Outlet and Date in same row
  filterSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
  },
  filterValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterValueText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    width: SCREEN_WIDTH - 48,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  modalItemActive: {
    backgroundColor: '#F5F5F5',
  },
  modalItemText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  modalItemTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },

  // Summary Cards
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },

  // Section Styles
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  tableCard: {
    overflow: 'hidden',
  },

  // Table Styles
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tableHeadRow: {
    backgroundColor: '#F4F4F2',
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  tableRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  totalRow: {
    backgroundColor: '#F0F0ED',
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  tableHead: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: FontSize.xs,
    color: Colors.text,
  },
  tableCellBold: {
    fontWeight: FontWeight.semibold,
  },
  emptyTableRow: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },

  // Loading/Error
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.red,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: Colors.surface,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});