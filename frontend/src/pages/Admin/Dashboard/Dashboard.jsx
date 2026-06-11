// Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { fetchOutletDashboardStats } from "../../../services/outletApi";
import "./Dashboard.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "Last week" },
  { key: "month", label: "Last month" },
];

export default function Dashboard({ selectedOutlet = "All Outlets" }) {
  const [period, setPeriod] = useState("today");
  const [outlets, setOutlets] = useState([]);
  const [periodData, setPeriodData] = useState({
    today: [],
    yesterday: [],
    week: [],
    month: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const loadStats = async (isSilent = false) => {
      try {
        if (!isSilent) {
          setLoading(true);
        }
        const response = await fetchOutletDashboardStats();
        if (active && response.success && response.data) {
          setOutlets(response.data.outlets || []);
          setPeriodData(response.data.periodData || {
            today: [],
            yesterday: [],
            week: [],
            month: [],
          });
          setError(null);
        }
      } catch (err) {
        if (active && !isSilent) {
          setError("Failed to fetch dashboard stats.");
          console.error(err);
        }
      } finally {
        if (active && !isSilent) {
          setLoading(false);
        }
      }
    };

    // Initial loading state
    loadStats(false);

    // Setup interval to fetch dashboard stats every 5 seconds (cron-like polling)
    const interval = setInterval(() => {
      loadStats(true);
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const allOrders = periodData[period] || [];
  
  // Filter based on selectedOutlet
  let filteredOutlets = outlets;
  let filteredOrders = allOrders;

  if (selectedOutlet && selectedOutlet !== "All Outlets") {
    const idx = outlets.indexOf(selectedOutlet);
    if (idx !== -1) {
      filteredOutlets = [outlets[idx]];
      filteredOrders = [allOrders[idx]];
    } else {
      filteredOutlets = [];
      filteredOrders = [];
    }
  }

  // Sort outlets by order count in descending order
  const combined = filteredOutlets.map((name, idx) => ({
    name,
    count: filteredOrders[idx] || 0
  }));
  combined.sort((a, b) => b.count - a.count);

  const finalOutlets = combined.map(item => item.name);
  const finalOrders = combined.map(item => item.count);

  const total = finalOrders.reduce((a, b) => a + b, 0);
  const topIdx = finalOrders.length > 0 ? finalOrders.indexOf(Math.max(...finalOrders)) : -1;
  const avg = finalOutlets.length > 0 ? Math.round(total / finalOutlets.length) : 0;

  // Professional single-color chart
  const chartData = {
    labels: finalOutlets,
    datasets: [
      {
        data: finalOrders,
        backgroundColor: "#3B82F6", // Professional blue
        borderRadius: 4,
        barThickness: 75, // Fixed width (approx 2cm on standard screens)
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 8,
        cornerRadius: 4,
        titleFont: { size: 12, weight: "normal" },
        bodyFont: { size: 11 },
        callbacks: {
          label: (ctx) => `${ctx.parsed.y.toLocaleString()} orders`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b", font: { size: 12, weight: "normal" } },
      },
      y: {
        grid: { color: "#e2e8f0", drawBorder: false },
        ticks: {
          color: "#64748b",
          font: { size: 11 },
          callback: (value) => value.toLocaleString(),
          stepSize: 20,
        },
        beginAtZero: true,
        max: 120,
      },
    },
  };

  if (loading) {
    return (
      <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <p style={{ color: "#64748b" }}>Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <p style={{ color: "#ef4444" }}>{error}</p>
      </div>
    );
  }

  if (outlets.length === 0) {
    return (
      <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <p style={{ color: "#64748b" }}>No active outlets found.</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Period Filter */}
      <div className="period-row1">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            className={`period-btn1 ${period === key ? "active" : ""}`}
            onClick={() => setPeriod(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid1">
        <div className="metric-card">
          <div className="metric-label">Total orders</div>
          <div className="metric-value">{total.toLocaleString()}</div>
          <div className="metric-sub">{selectedOutlet === "All Outlets" ? "All outlets" : selectedOutlet}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Best outlet</div>
          <div className="metric-value metric-value--sm">
            {topIdx !== -1 ? finalOutlets[topIdx] : "N/A"}
          </div>
          <div className="metric-sub">
            {topIdx !== -1 ? finalOrders[topIdx].toLocaleString() : 0} orders
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg per outlet</div>
          <div className="metric-value">{avg.toLocaleString()}</div>
          <div className="metric-sub">orders</div>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-card1">
        <div className="chart-card-title1">Orders sold — by outlet</div>
        <div className="chart-wrap1">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

