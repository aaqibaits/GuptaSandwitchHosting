// pages/ReportsPage.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchSummaryReport,
  fetchPaymentAnalyticsReport,
  fetchCategorySalesReport,
  fetchHourlySalesReport,
  fetchTopItemsReport,
  fetchRecentOrdersReport
} from '../../services/reportapi';
import './ReportsPage.css';

const formatDate = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

const CATEGORY_COLORS = ['#E8590C', '#F58540', '#7C3AED', '#22C55E', '#2563EB', '#F59E0B'];
const TOP_COLORS = ['#E8590C', '#F58540', '#7C3AED', '#2563EB', '#22C55E'];

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Business report state
  const [todaySummary, setTodaySummary] = useState(null);
  const [yesterdaySummary, setYesterdaySummary] = useState(null);
  const [hourlySalesList, setHourlySalesList] = useState([]);
  const [categorySalesList, setCategorySalesList] = useState([]);
  const [topItemsList, setTopItemsList] = useState([]);
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  const [recentOrdersList, setRecentOrdersList] = useState([]);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const getSubtitle = () => {
    if (dateRange === 'today') {
      return `Today — ${today}`;
    } else if (dateRange === 'yesterday') {
      const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yesterdayFormatted = yesterdayDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      return `Yesterday — ${yesterdayFormatted}`;
    } else {
      const lastWeekDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const lastWeekFormatted = lastWeekDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
      });
      const todayFormatted = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      return `Last 7 days — ${lastWeekFormatted} to ${todayFormatted}`;
    }
  };

  useEffect(() => {
    const loadReportsData = async () => {
      setLoading(true);
      setError(null);

      let startDate = '';
      let endDate = '';
      let compStartDate = '';
      let compEndDate = '';

      const todayStr = formatDate(new Date());
      const yesterdayStr = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
      const dayBeforeYesterdayStr = formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));
      const lastWeekStr = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      const twoWeeksAgoStr = formatDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000));

      if (dateRange === 'today') {
        startDate = todayStr;
        endDate = todayStr;
        compStartDate = yesterdayStr;
        compEndDate = yesterdayStr;
      } else if (dateRange === 'yesterday') {
        startDate = yesterdayStr;
        endDate = yesterdayStr;
        compStartDate = dayBeforeYesterdayStr;
        compEndDate = dayBeforeYesterdayStr;
      } else if (dateRange === 'week') {
        startDate = lastWeekStr;
        endDate = todayStr;
        compStartDate = twoWeeksAgoStr;
        compEndDate = lastWeekStr;
      }

      const outletId = Number(sessionStorage.getItem('gs_outlet_id')) || undefined;

      const filtersToday = { outletId, startDate, endDate };
      const filtersYesterday = { outletId, startDate: compStartDate, endDate: compEndDate };

      try {
        const [
          todaySum,
          yesterdaySum,
          hourlyRes,
          categoryRes,
          topItemsRes,
          paymentRes,
          recentOrdersRes
        ] = await Promise.all([
          fetchSummaryReport(filtersToday),
          fetchSummaryReport(filtersYesterday),
          fetchHourlySalesReport(filtersToday),
          fetchCategorySalesReport(filtersToday),
          fetchTopItemsReport(filtersToday),
          fetchPaymentAnalyticsReport(filtersToday),
          fetchRecentOrdersReport({ ...filtersToday, limit: 20 })
        ]);

        setTodaySummary(todaySum.data || todaySum);
        setYesterdaySummary(yesterdaySum.data || yesterdaySum);
        setHourlySalesList(hourlyRes.data || hourlyRes || []);
        setCategorySalesList(categoryRes.data || categoryRes || []);
        setTopItemsList(topItemsRes.data?.topSelling || topItemsRes.topSelling || []);
        setPaymentAnalytics(paymentRes.data || paymentRes);
        setRecentOrdersList(recentOrdersRes.data || recentOrdersRes || []);
      } catch (err) {
        console.error('Failed to fetch staff dashboard reports:', err);
        setError('Failed to fetch real-time report data. Is the backend server online?');
      } finally {
        setLoading(false);
      }
    };

    loadReportsData();
  }, [dateRange]);

  // 1. Metrics computations
  const revenue = todaySummary?.totalRevenue || 0;
  const yesterdayRevenue = yesterdaySummary?.totalRevenue || 0;
  const revenueChange = yesterdayRevenue ? Math.round(((revenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0;

  const orders = todaySummary?.totalOrders || 0;
  const yesterdayOrders = yesterdaySummary?.totalOrders || 0;
  const ordersChange = yesterdayOrders ? Math.round(((orders - yesterdayOrders) / yesterdayOrders) * 100) : 0;

  const covers = Math.round(orders * 2.4);

  const avgOrder = todaySummary?.averageOrderValue || 0;
  const yesterdayAvg = yesterdaySummary?.averageOrderValue || 0;
  const avgChange = yesterdayAvg ? Math.round(((avgOrder - yesterdayAvg) / yesterdayAvg) * 100) : 0;

  const compLabel = dateRange === 'today' ? 'vs yesterday' : (dateRange === 'yesterday' ? 'vs prev day' : 'vs prev week');

  // 2. Hourly Sales breakdown
  const hourlyData = useMemo(() => {
    // Fill active operational hours or map directly
    return hourlySalesList.map((item) => {
      const h = item.hour;
      const ampm = h >= 12 ? 'PM' : 'AM';
      let displayHour = h % 12;
      if (displayHour === 0) displayHour = 12;
      return {
        h: `${displayHour}${ampm}`,
        v: Number(item.revenue)
      };
    });
  }, [hourlySalesList]);

  const maxHourly = useMemo(() => {
    return hourlyData.length > 0 ? Math.max(...hourlyData.map((x) => x.v)) : 1;
  }, [hourlyData]);

  // 3. Category Sales breakdown
  const categoryData = useMemo(() => {
    return categorySalesList.map((item, idx) => ({
      n: item.categoryName,
      v: Number(item.revenue),
      c: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
    }));
  }, [categorySalesList]);

  const maxCategory = useMemo(() => {
    return categoryData.length > 0 ? Math.max(...categoryData.map((x) => x.v)) : 1;
  }, [categoryData]);

  // 4. Top Selling Items
  const topItems = useMemo(() => {
    return topItemsList.map((item, idx) => ({
      n: item.dishName,
      v: item.quantitySold,
      c: TOP_COLORS[idx % TOP_COLORS.length]
    }));
  }, [topItemsList]);

  const maxTop = useMemo(() => {
    return topItems.length > 0 ? Math.max(...topItems.map((x) => x.v)) : 1;
  }, [topItems]);

  // 5. Payment Methods Analysis
  const paymentMethods = useMemo(() => {
    return [
      { n: 'Cash', v: paymentAnalytics?.cash?.revenue || 0, c: '#22C55E' },
      { n: 'Online', v: paymentAnalytics?.online?.revenue || 0, c: '#2563EB' },
      { n: 'Swiggy', v: paymentAnalytics?.swiggy?.revenue || 0, c: '#E8590C' },
      { n: 'Zomato', v: paymentAnalytics?.zomato?.revenue || 0, c: '#D32F2F' }
    ];
  }, [paymentAnalytics]);

  const maxPayment = useMemo(() => {
    return paymentMethods.length > 0 ? Math.max(...paymentMethods.map((x) => x.v)) : 1;
  }, [paymentMethods]);

  // 6. Recent orders
  const recentOrders = useMemo(() => {
    return recentOrdersList.map((order) => {
      const id = order.orderNumber ? `#${order.orderNumber.split('-').pop()}` : '#';

      let tableDisplay = order.tableNumber;
      if (!tableDisplay || order.orderType !== 'dine') {
        tableDisplay = order.orderType ? order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1) : 'Takeaway';
      }

      const displayStatus = order.orderStatus === 'completed' ? 'paid' : (order.orderStatus === 'cancelled' ? 'cancelled' : 'open');

      const formattedTime = new Date(order.orderTime).toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      return {
        id,
        table: tableDisplay,
        items: order.itemsSold,
        amount: order.totalAmount,
        mode: order.paymentMethod ? order.paymentMethod.toUpperCase() : 'CASH',
        status: displayStatus,
        time: formattedTime
      };
    });
  }, [recentOrdersList]);

  const getStatusClass = (status) => {
    if (status === 'paid') return 'sb-paid';
    if (status === 'hold' || status === 'open') return 'sb-open';
    return 'sb-hold';
  };

  if (loading) {
    return (
      <div className="reports-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
          <i className="ti ti-loader" style={{ fontSize: '36px', color: 'var(--orange)', display: 'inline-block', animation: 'spin 1s linear infinite' }}></i>
          <p style={{ marginTop: '12px', fontSize: '14px' }}>Loading real-time report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', color: '#c53030' }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: '36px' }}></i>
          <p style={{ marginTop: '12px', fontSize: '14px' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-page-header">
        <div>
          <div className="page-title">Reports & Analytics</div>
          <div className="page-sub">{getSubtitle()}</div>
        </div>
        <div className="reports-filter">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="reports-select"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 days</option>
          </select>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="mc-label">
            <i className="ti ti-currency-rupee" style={{ fontSize: '16px', color: 'var(--orange)' }}></i>
            Revenue
          </div>
          <div className="mc-val" style={{ color: 'var(--orange)' }}>₹{revenue.toLocaleString('en-IN')}</div>
          <div className="mc-sub">
            <span className={`mc-badge ${revenueChange >= 0 ? 'up' : 'down'}`}>
              {revenueChange >= 0 ? '↑' : '↓'} {Math.abs(revenueChange)}%
            </span> {compLabel}
          </div>
        </div>
        <div className="metric-card">
          <div className="mc-label">
            <i className="ti ti-receipt" style={{ fontSize: '16px', color: 'var(--blue)' }}></i>
            Orders
          </div>
          <div className="mc-val" style={{ color: 'var(--blue)' }}>{orders}</div>
          <div className="mc-sub">
            <span className={`mc-badge ${ordersChange >= 0 ? 'up' : 'down'}`}>
              {ordersChange >= 0 ? '↑' : '↓'} {Math.abs(ordersChange)}%
            </span> {compLabel}
          </div>
        </div>
        <div className="metric-card">
          <div className="mc-label">
            <i className="ti ti-users" style={{ fontSize: '16px', color: 'var(--purple)' }}></i>
            Covers
          </div>
          <div className="mc-val" style={{ color: 'var(--purple)' }}>{covers}</div>
          <div className="mc-sub">Avg 2.4 per table</div>
        </div>
        <div className="metric-card">
          <div className="mc-label">
            <i className="ti ti-trending-up" style={{ fontSize: '16px', color: 'var(--green)' }}></i>
            Avg Order
          </div>
          <div className="mc-val" style={{ color: 'var(--green)' }}>₹{Math.round(avgOrder).toLocaleString('en-IN')}</div>
          <div className="mc-sub">
            <span className={`mc-badge ${avgChange >= 0 ? 'up' : 'down'}`}>
              {avgChange >= 0 ? '↑' : '↓'} {Math.abs(avgChange)}%
            </span> {compLabel}
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">
            <i className="ti ti-chart-bar" style={{ color: 'var(--orange)' }}></i>
            Hourly Revenue
          </div>
          <div className="bar-chart">
            {hourlyData.map((item, idx) => (
              <div key={idx} className="bar-row">
                <div className="bar-label">{item.h}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(item.v / maxHourly) * 100}%`, background: 'var(--orange)' }}></div>
                </div>
                <div className="bar-val">₹{item.v.toLocaleString('en-IN')}</div>
              </div>
            ))}
            {hourlyData.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '12px', padding: '20px 0' }}>
                No hourly sales data logged today.
              </div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">
            <i className="ti ti-pie-chart" style={{ color: 'var(--purple)' }}></i>
            Revenue by Category
          </div>
          <div className="bar-chart">
            {categoryData.map((item, idx) => (
              <div key={idx} className="bar-row">
                <div className="bar-label" style={{ fontSize: '11px' }}>{item.n}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(item.v / maxCategory) * 100}%`, background: item.c }}></div>
                </div>
                <div className="bar-val">₹{Math.round(item.v).toLocaleString('en-IN')}</div>
              </div>
            ))}
            {categoryData.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '12px', padding: '20px 0' }}>
                No category sales recorded today.
              </div>
            )}
          </div>
          <div className="pie-legend">
            {categoryData.map((item, idx) => (
              <div key={idx} className="pie-item">
                <div className="pie-dot" style={{ background: item.c }}></div>
                {item.n}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">
          <i className="ti ti-history" style={{ color: 'var(--blue)' }}></i>
          Recent Orders
        </div>
        <table className="tbl-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Table</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order, idx) => (
              <tr key={idx}>
                <td><b>{order.id}</b></td>
                <td>{order.table}</td>
                <td>{order.items} items</td>
                <td><b>₹{order.amount.toLocaleString('en-IN')}</b></td>
                <td>
                  <span style={{ background: '#EEE', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                    {order.mode}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ color: 'var(--muted)' }}>{order.time}</td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>
                  No recent orders logged today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">
            <i className="ti ti-star" style={{ color: 'var(--orange)' }}></i>
            Top Selling Items
          </div>
          <div className="bar-chart">
            {topItems.map((item, idx) => (
              <div key={idx} className="bar-row">
                <div className="bar-label" style={{ fontSize: '11px' }}>{item.n}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(item.v / maxTop) * 100}%`, background: item.c }}></div>
                </div>
                <div className="bar-val">{item.v} sold</div>
              </div>
            ))}
            {topItems.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '12px', padding: '20px 0' }}>
                No dishes sold today.
              </div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">
            <i className="ti ti-credit-card" style={{ color: 'var(--green)' }}></i>
            Payment Methods
          </div>
          <div className="bar-chart">
            {paymentMethods.map((item, idx) => (
              <div key={idx} className="bar-row">
                <div className="bar-label">{item.n}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(item.v / maxPayment) * 100}%`, background: item.c }}></div>
                </div>
                <div className="bar-val">₹{Math.round(item.v).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;