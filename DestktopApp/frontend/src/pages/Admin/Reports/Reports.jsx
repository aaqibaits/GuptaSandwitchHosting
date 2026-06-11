// Reports.jsx
import React, { useState, useEffect, useMemo } from "react";
import { fetchOutlets, fetchDishes } from "../../../services/dishesApi";
import {
  fetchSummaryReport,
  fetchPaymentAnalyticsReport,
  fetchCategorySalesReport,
  fetchHourlySalesReport,
  fetchOrderTypesReport,
  fetchTopItemsReport,
  fetchRecentOrdersReport
} from "../../../services/reportapi";
import "./Reports.css";
import { utils, writeFile } from "xlsx";

const COST_PER_GRAM = {
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

const formatDate = (date) => {
  const d = new Date(date);
  let month = "" + (d.getMonth() + 1);
  let day = "" + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
};

export default function Reports({ selectedOutlet = "All Outlets" }) {
  const [activeTab, setActiveTab] = useState("daily");
  const [selectedOutletId, setSelectedOutletId] = useState("all");
  const [outletsList, setOutletsList] = useState([]);
  const [dateRange, setDateRange] = useState("week");

  // Sync global selectedOutlet selection with reports filters
  useEffect(() => {
    if (!selectedOutlet || selectedOutlet === "All Outlets") {
      setSelectedOutletId("all");
    } else {
      const found = outletsList.find((o) => o.name === selectedOutlet);
      if (found) {
        setSelectedOutletId(String(found.id));
      }
    }
  }, [selectedOutlet, outletsList]);

  // Reporting Data States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [orderTypesData, setOrderTypesData] = useState(null);
  const [topItemsData, setTopItemsData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [dishesData, setDishesData] = useState([]);

  // Load Outlets once on mount
  useEffect(() => {
    const loadOutletsList = async () => {
      try {
        const outlets = await fetchOutlets();
        setOutletsList(outlets || []);
      } catch (err) {
        console.error("Failed to load outlets:", err);
      }
    };
    loadOutletsList();
  }, []);

  // Fetch all report datasets on filter change
  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      setError(null);

      const todayStr = formatDate(new Date());
      let startDate = "";
      let endDate = todayStr;

      if (dateRange === "today") {
        startDate = todayStr;
      } else if (dateRange === "yesterday") {
        startDate = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
        endDate = startDate;
      } else if (dateRange === "week") {
        startDate = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      }

      const filters = {
        outletId: selectedOutletId === "all" ? undefined : Number(selectedOutletId),
        startDate,
        endDate
      };

      try {
        const [
          summaryRes,
          paymentRes,
          categoryRes,
          hourlyRes,
          orderTypesRes,
          topItemsRes,
          recentOrdersRes,
          dishesRes
        ] = await Promise.all([
          fetchSummaryReport(filters),
          fetchPaymentAnalyticsReport(filters),
          fetchCategorySalesReport(filters),
          fetchHourlySalesReport(filters),
          fetchOrderTypesReport(filters),
          fetchTopItemsReport(filters),
          fetchRecentOrdersReport({ ...filters, limit: 1000 }),
          fetchDishes()
        ]);

        setSummaryData(summaryRes.data || summaryRes);
        setPaymentData(paymentRes.data || paymentRes);
        setCategoryData(categoryRes.data || categoryRes || []);
        setHourlyData(hourlyRes.data || hourlyRes || []);
        setOrderTypesData(orderTypesRes.data || orderTypesRes);
        setTopItemsData(topItemsRes.data || topItemsRes);
        setRecentOrders(recentOrdersRes.data || recentOrdersRes || []);
        setDishesData(dishesRes.data || dishesRes || []);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
        setError("Failed to fetch data. Is the backend API server online?");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [selectedOutletId, dateRange]);

  // Dynamic values based on summary
  const totalRevenue = summaryData?.totalRevenue || 0;

  // ── 1. Group recent orders dynamically for Daily Sales breakdown (Outlet-wise) ──
  const dailyRows = useMemo(() => {
    const groups = {};
    recentOrders.forEach((order) => {
      const dateObj = new Date(order.orderTime || order.order_time);
      const dateKey = dateObj.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short"
      });

      const outletName = order.outletName || order.outlet_name || "Outlet";
      const outletId = order.outletId || order.outlet_id || "unknown";
      
      // Separate by date AND outlet key
      const groupKey = `${dateKey}_${outletId}`;

      const amount = Number(order.totalAmount || 0);
      const itemsCount = Number(order.itemsSold || 0);

      if (!groups[groupKey]) {
        groups[groupKey] = {
          date: dateKey,
          outlet: outletName,
          offlineCash: 0,
          offlineUpi: 0,
          onlineSwiggy: 0,
          onlineZomato: 0,
          offline: 0,
          online: 0,
          total: 0,
          itemsSold: 0
        };
      }

      const isSwiggy = order.orderType === "swiggy";
      const isZomato = order.orderType === "zomato";

      if (isSwiggy) {
        groups[groupKey].onlineSwiggy += amount;
        groups[groupKey].online += amount;
      } else if (isZomato) {
        groups[groupKey].onlineZomato += amount;
        groups[groupKey].online += amount;
      } else {
        if (order.paymentMethod === "cash") {
          groups[groupKey].offlineCash += amount;
        } else {
          groups[groupKey].offlineUpi += amount;
        }
        groups[groupKey].offline += amount;
      }
      groups[groupKey].total += amount;
      groups[groupKey].itemsSold += itemsCount;
    });

    return Object.values(groups).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [recentOrders]);

  // Total items sold sum across filtered orders
  const totalItemsSold = useMemo(() => {
    return dailyRows.reduce((sum, r) => sum + r.itemsSold, 0);
  }, [dailyRows]);

  // ── 2. Cash/Online payments breakdown totals ──
  const paymentBreakdown = useMemo(() => {
    let offlineCash = 0;
    let offlineUpi = 0;
    let onlineSwiggy = 0;
    let onlineZomato = 0;

    recentOrders.forEach((order) => {
      const amount = Number(order.totalAmount || 0);
      const isSwiggy = order.orderType === "swiggy";
      const isZomato = order.orderType === "zomato";

      if (isSwiggy) {
        onlineSwiggy += amount;
      } else if (isZomato) {
        onlineZomato += amount;
      } else {
        if (order.paymentMethod === "cash") {
          offlineCash += amount;
        } else {
          offlineUpi += amount;
        }
      }
    });

    const offlineTotal = offlineCash + offlineUpi;
    const onlineTotal = onlineSwiggy + onlineZomato;

    return {
      offlineCash,
      offlineUpi,
      onlineSwiggy,
      onlineZomato,
      offlineTotal,
      onlineTotal,
      totalPayments: offlineTotal + onlineTotal
    };
  }, [recentOrders]);

  const offlineTotal = paymentBreakdown.offlineTotal;
  const onlineTotal = paymentBreakdown.onlineTotal;

  // ── 3. Platforms (Swiggy / Zomato / POS Direct) sales calculation ──
  const platformStats = useMemo(() => {
    const stats = {
      swiggy: { orders: 0, revenue: 0 },
      zomato: { orders: 0, revenue: 0 },
      direct: { orders: 0, revenue: 0 }
    };

    recentOrders.forEach((order) => {
      const amount = Number(order.totalAmount || 0);
      if (order.orderType === "swiggy") {
        stats.swiggy.orders += 1;
        stats.swiggy.revenue += amount;
      } else if (order.orderType === "zomato") {
        stats.zomato.orders += 1;
        stats.zomato.revenue += amount;
      } else {
        stats.direct.orders += 1;
        stats.direct.revenue += amount;
      }
    });

    return stats;
  }, [recentOrders]);

  // ── 4. Peak Hours grouped in 2-hour blocks ──
  const peakHoursRows = useMemo(() => {
    const slots = {};
    for (let h = 0; h < 24; h += 2) {
      const startStr = `${h.toString().padStart(2, "0")}:00`;
      const endStr = `${(h + 2).toString().padStart(2, "0")}:00`;
      const key = `${startStr} - ${endStr}`;
      slots[key] = { slot: key, orders: 0, revenue: 0 };
    }

    hourlyData.forEach((row) => {
      const h = Number(row.hour);
      const slotIndex = Math.floor(h / 2) * 2;
      const startStr = `${slotIndex.toString().padStart(2, "0")}:00`;
      const endStr = `${(slotIndex + 2).toString().padStart(2, "0")}:00`;
      const key = `${startStr} - ${endStr}`;

      if (slots[key]) {
        slots[key].orders += Number(row.ordersCount || 0);
        slots[key].revenue += Number(row.revenue || 0);
      }
    });

    return Object.values(slots)
      .filter((s) => s.orders > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [hourlyData]);

  // ── 5. Food Cost / Ingredient consumption mapping ──
  const ingredientUsage = useMemo(() => {
    if (!topItemsData || !topItemsData.topSelling) return [];

    const ingredientMap = new Map();
    const RECIPES = {
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

    topItemsData.topSelling.forEach((item) => {
      const qtySold = Number(item.quantitySold || item.quantity_sold || 0);
      if (qtySold <= 0) return;

      let recipe = RECIPES[item.dishName];

      if (!recipe) {
        const dishObj = dishesData.find((d) => d.name === item.dishName);
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
      .map(([name, qty]) => ({ name, quantity: qty, unit: "grams" }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [topItemsData, dishesData]);

  const totalIngredientCost = useMemo(() => {
    return ingredientUsage.reduce((sum, ing) => {
      const costPerGram = COST_PER_GRAM[ing.name] || 0.2;
      return sum + ing.quantity * costPerGram;
    }, 0);
  }, [ingredientUsage]);

  const foodCostPercentage = useMemo(() => {
    if (!totalRevenue) return 0;
    return (totalIngredientCost / totalRevenue) * 100;
  }, [totalIngredientCost, totalRevenue]);

  // ── Excel Exports ────────────────────────────────────────────────────────
  const exportDailySalesToExcel = () => {
    const headers = [
      ["Daily Sales Breakdown"],
      [`Filtered by Outlet: ${selectedOutletId === "all" ? "All Outlets" : outletsList.find(o => o.id === Number(selectedOutletId))?.name || "Selected Outlet"}`],
      [`Date Range: ${dateRange === "today" ? "Today" : dateRange === "yesterday" ? "Yesterday" : "Last 7 days"}`],
      [],
      ["Date", "Outlet", "Offline Cash (₹)", "Offline UPI/Online (₹)", "Offline Total (₹)", "Swiggy (₹)", "Zomato (₹)", "Online Total (₹)", "Grand Total (₹)", "Items Sold"]
    ];

    const dataRows = dailyRows.map(row => [
      row.date,
      row.outlet,
      row.offlineCash,
      row.offlineUpi,
      row.offline,
      row.onlineSwiggy,
      row.onlineZomato,
      row.online,
      row.total,
      row.itemsSold
    ]);

    const totalOfflineCash = dailyRows.reduce((s, r) => s + r.offlineCash, 0);
    const totalOfflineUpi = dailyRows.reduce((s, r) => s + r.offlineUpi, 0);
    const totalOffline = dailyRows.reduce((s, r) => s + r.offline, 0);
    const totalOnlineSwiggy = dailyRows.reduce((s, r) => s + r.onlineSwiggy, 0);
    const totalOnlineZomato = dailyRows.reduce((s, r) => s + r.onlineZomato, 0);
    const totalOnline = dailyRows.reduce((s, r) => s + r.online, 0);
    const totalGrand = dailyRows.reduce((s, r) => s + r.total, 0);
    const totalItems = dailyRows.reduce((s, r) => s + r.itemsSold, 0);

    const footerRow = [
      "Grand Total",
      "",
      totalOfflineCash,
      totalOfflineUpi,
      totalOffline,
      totalOnlineSwiggy,
      totalOnlineZomato,
      totalOnline,
      totalGrand,
      totalItems
    ];

    const worksheet = utils.aoa_to_sheet([...headers, ...dataRows, footerRow]);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Daily Sales");
    writeFile(workbook, `daily_sales_${formatDate(new Date())}.xlsx`);
  };

  const exportPaymentAnalysisToExcel = () => {
    const headers = [
      ["Cash / Online Payment Analysis"],
      [`Filtered by Outlet: ${selectedOutletId === "all" ? "All Outlets" : outletsList.find(o => o.id === Number(selectedOutletId))?.name || "Selected Outlet"}`],
      [`Date Range: ${dateRange === "today" ? "Today" : dateRange === "yesterday" ? "Yesterday" : "Last 7 days"}`],
      [],
      ["Date", "Outlet", "Offline Cash (₹)", "Offline UPI/Online (₹)", "Offline Total (₹)", "Swiggy (₹)", "Zomato (₹)", "Online Total (₹)", "Grand Total (₹)"]
    ];

    const dataRows = dailyRows.map(row => [
      row.date,
      row.outlet,
      row.offlineCash,
      row.offlineUpi,
      row.offline,
      row.onlineSwiggy,
      row.onlineZomato,
      row.online,
      row.total
    ]);

    const totalOfflineCash = dailyRows.reduce((s, r) => s + r.offlineCash, 0);
    const totalOfflineUpi = dailyRows.reduce((s, r) => s + r.offlineUpi, 0);
    const totalOffline = dailyRows.reduce((s, r) => s + r.offline, 0);
    const totalOnlineSwiggy = dailyRows.reduce((s, r) => s + r.onlineSwiggy, 0);
    const totalOnlineZomato = dailyRows.reduce((s, r) => s + r.onlineZomato, 0);
    const totalOnline = dailyRows.reduce((s, r) => s + r.online, 0);
    const totalGrand = dailyRows.reduce((s, r) => s + r.total, 0);

    const footerRow = [
      "Grand Total",
      "",
      totalOfflineCash,
      totalOfflineUpi,
      totalOffline,
      totalOnlineSwiggy,
      totalOnlineZomato,
      totalOnline,
      totalGrand
    ];

    const worksheet = utils.aoa_to_sheet([...headers, ...dataRows, footerRow]);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Payment Analysis");
    writeFile(workbook, `payment_analysis_${formatDate(new Date())}.xlsx`);
  };

  const exportCategorySalesToExcel = () => {
    const headers = [
      ["Sales by Category"],
      [`Filtered by Outlet: ${selectedOutletId === "all" ? "All Outlets" : outletsList.find(o => o.id === Number(selectedOutletId))?.name || "Selected Outlet"}`],
      [`Date Range: ${dateRange === "today" ? "Today" : dateRange === "yesterday" ? "Yesterday" : "Last 7 days"}`],
      [],
      ["Category Name", "Revenue (₹)", "Percentage Share (%)"]
    ];

    const dataRows = categoryData.map(row => [
      row.categoryName,
      Number(row.revenue),
      totalRevenue ? Math.round((Number(row.revenue) / totalRevenue) * 100) : 0
    ]);

    const footerRow = [
      "Total",
      totalRevenue,
      "100%"
    ];

    const worksheet = utils.aoa_to_sheet([...headers, ...dataRows, footerRow]);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Category Sales");
    writeFile(workbook, `category_sales_${formatDate(new Date())}.xlsx`);
  };

  const exportHourlySalesToExcel = () => {
    const headers = [
      ["Peak Hours Analysis"],
      [`Filtered by Outlet: ${selectedOutletId === "all" ? "All Outlets" : outletsList.find(o => o.id === Number(selectedOutletId))?.name || "Selected Outlet"}`],
      [`Date Range: ${dateRange === "today" ? "Today" : dateRange === "yesterday" ? "Yesterday" : "Last 7 days"}`],
      [],
      ["Time Slot", "Orders", "Revenue (₹)", "Avg. Ticket Size (₹)"]
    ];

    const dataRows = peakHoursRows.map(row => [
      row.slot,
      row.orders,
      row.revenue,
      row.orders ? Math.round(row.revenue / row.orders) : 0
    ]);

    const totalOrders = peakHoursRows.reduce((s, r) => s + r.orders, 0);
    const totalRev = peakHoursRows.reduce((s, r) => s + r.revenue, 0);

    const footerRow = [
      "Total",
      totalOrders,
      totalRev,
      totalOrders ? Math.round(totalRev / totalOrders) : 0
    ];

    const worksheet = utils.aoa_to_sheet([...headers, ...dataRows, footerRow]);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Hourly Sales");
    writeFile(workbook, `hourly_sales_${formatDate(new Date())}.xlsx`);
  };

  const exportPlatformSalesToExcel = () => {
    const headers = [
      ["Delivery Platform Sales Summary"],
      [`Filtered by Outlet: ${selectedOutletId === "all" ? "All Outlets" : outletsList.find(o => o.id === Number(selectedOutletId))?.name || "Selected Outlet"}`],
      [`Date Range: ${dateRange === "today" ? "Today" : dateRange === "yesterday" ? "Yesterday" : "Last 7 days"}`],
      [],
      ["Platform", "Orders", "Revenue (₹)", "Commission (15%) (₹)", "Net Revenue (₹)"]
    ];

    const swiggyRev = platformStats.swiggy.revenue;
    const zomatoRev = platformStats.zomato.revenue;
    const directRev = platformStats.direct.revenue;

    const dataRows = [
      ["Swiggy", platformStats.swiggy.orders, swiggyRev, swiggyRev * 0.15, swiggyRev * 0.85],
      ["Zomato", platformStats.zomato.orders, zomatoRev, zomatoRev * 0.15, zomatoRev * 0.85],
      ["Direct POS", platformStats.direct.orders, directRev, 0, directRev]
    ];

    const totalOrders = recentOrders.length;
    const totalRevenueSum = swiggyRev + zomatoRev + directRev;
    const totalCommission = (swiggyRev + zomatoRev) * 0.15;
    const totalNetRevenue = directRev + (swiggyRev + zomatoRev) * 0.85;

    const footerRow = [
      "Total Summary",
      totalOrders,
      totalRevenueSum,
      totalCommission,
      totalNetRevenue
    ];

    const worksheet = utils.aoa_to_sheet([...headers, ...dataRows, footerRow]);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Delivery Platforms");
    writeFile(workbook, `delivery_platform_sales_${formatDate(new Date())}.xlsx`);
  };

  const exportFoodCostToExcel = () => {
    const headers = [
      ["Food Cost & Ingredient Usage Breakdown"],
      [`Filtered by Outlet: ${selectedOutletId === "all" ? "All Outlets" : outletsList.find(o => o.id === Number(selectedOutletId))?.name || "Selected Outlet"}`],
      [`Date Range: ${dateRange === "today" ? "Today" : dateRange === "yesterday" ? "Yesterday" : "Last 7 days"}`],
      [],
      ["Ingredient Name", "Quantity Used (g)", "Quantity (kg)", "Est. Cost (₹)"]
    ];

    const dataRows = ingredientUsage.map(ing => {
      const cost = ing.quantity * (COST_PER_GRAM[ing.name] || 0.2);
      return [
        ing.name,
        ing.quantity,
        ing.quantity / 1000,
        Math.round(cost)
      ];
    });

    const footerRow = [
      "Total Ingredient Cost",
      "",
      "",
      Math.round(totalIngredientCost)
    ];

    const worksheet = utils.aoa_to_sheet([...headers, ...dataRows, footerRow]);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Food Cost");
    writeFile(workbook, `ingredient_food_cost_${formatDate(new Date())}.xlsx`);
  };

  // ── Tab Renderers ────────────────────────────────────────────────────────

  const renderOfflineCell = (cash, upi) => {
    if (cash > 0 && upi > 0) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", fontWeight: "500" }}>
            <span>₹{cash.toLocaleString()}</span>
            <span className="report-tag cash">Cash</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontWeight: "500" }}>
            <span>₹{upi.toLocaleString()}</span>
            <span className="report-tag upi">UPI/Online</span>
          </div>
        </div>
      );
    } else if (cash > 0) {
      return (
        <div style={{ display: "flex", alignItems: "center", fontWeight: "500" }}>
          <span>₹{cash.toLocaleString()}</span>
          <span className="report-tag cash">Cash</span>
        </div>
      );
    } else if (upi > 0) {
      return (
        <div style={{ display: "flex", alignItems: "center", fontWeight: "500" }}>
          <span>₹{upi.toLocaleString()}</span>
          <span className="report-tag upi">UPI/Online</span>
        </div>
      );
    } else {
      return <div style={{ color: "#999" }}>₹0</div>;
    }
  };

  const renderOnlineCell = (swiggy, zomato) => {
    if (swiggy > 0 && zomato > 0) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", fontWeight: "500" }}>
            <span>₹{swiggy.toLocaleString()}</span>
            <span className="report-tag swiggy">Swiggy</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", fontWeight: "500" }}>
            <span>₹{zomato.toLocaleString()}</span>
            <span className="report-tag zomato">Zomato</span>
          </div>
        </div>
      );
    } else if (swiggy > 0) {
      return (
        <div style={{ display: "flex", alignItems: "center", fontWeight: "500" }}>
          <span>₹{swiggy.toLocaleString()}</span>
          <span className="report-tag swiggy">Swiggy</span>
        </div>
      );
    } else if (zomato > 0) {
      return (
        <div style={{ display: "flex", alignItems: "center", fontWeight: "500" }}>
          <span>₹{zomato.toLocaleString()}</span>
          <span className="report-tag zomato">Zomato</span>
        </div>
      );
    } else {
      return <div style={{ color: "#999" }}>₹0</div>;
    }
  };

  const renderDailyReport = () => (
    <div className="report-table-wrapper">
      <div className="section-title">
        <span><i className="ti ti-calendar-stats"></i> Daily Sales Breakdown</span>
        <button className="export-btn-excel" onClick={exportDailySalesToExcel}>
          <i className="ti ti-file-spreadsheet"></i> Export to Excel
        </button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Outlet</th>
              <th>Offline (₹)</th>
              <th>Online (₹)</th>
              <th>Total (₹)</th>
              <th>Items Sold</th>
            </tr>
          </thead>
          <tbody>
            {dailyRows.map((row, idx) => (
              <tr key={idx}>
                <td>{row.date}</td>
                <td>{row.outlet}</td>
                <td>{renderOfflineCell(row.offlineCash, row.offlineUpi)}</td>
                <td>{renderOnlineCell(row.onlineSwiggy, row.onlineZomato)}</td>
                <td className="highlight">₹{row.total.toLocaleString()}</td>
                <td>{row.itemsSold}</td>
              </tr>
            ))}
            {dailyRows.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", color: "#999" }}>
                  No order logs recorded in this period.
                </td>
              </tr>
            )}
          </tbody>
          {dailyRows.length > 0 && (
            <tfoot>
              <tr className="total-row">
                <td colSpan="2">Grand Total</td>
                <td>
                  {renderOfflineCell(
                    dailyRows.reduce((s, r) => s + r.offlineCash, 0),
                    dailyRows.reduce((s, r) => s + r.offlineUpi, 0)
                  )}
                </td>
                <td>
                  {renderOnlineCell(
                    dailyRows.reduce((s, r) => s + r.onlineSwiggy, 0),
                    dailyRows.reduce((s, r) => s + r.onlineZomato, 0)
                  )}
                </td>
                <td>
                  ₹
                  {dailyRows.reduce((s, r) => s + r.total, 0).toLocaleString()}
                </td>
                <td>{dailyRows.reduce((s, r) => s + r.itemsSold, 0)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );

  const renderPaymentReport = () => {
    const totalPayments = paymentBreakdown.totalPayments;
    return (
      <div className="report-table-wrapper">
        <div className="section-title">
          <span><i className="ti ti-cash"></i> Cash / Online Payment Analysis</span>
          <button className="export-btn-excel" onClick={exportPaymentAnalysisToExcel}>
            <i className="ti ti-file-spreadsheet"></i> Export to Excel
          </button>
        </div>
        <div className="payment-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="ti ti-wallet"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Offline (Outlet Sales)</span>
              <span className="stat-value">₹{paymentBreakdown.offlineTotal.toLocaleString()}</span>
              <div style={{ fontSize: "12px", color: "#6c757d", marginTop: "4px" }}>
                Cash: ₹{paymentBreakdown.offlineCash.toLocaleString()} · UPI/Online: ₹{paymentBreakdown.offlineUpi.toLocaleString()}
              </div>
              <span className="stat-percent">
                {totalPayments
                  ? Math.round((paymentBreakdown.offlineTotal / totalPayments) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="ti ti-credit-card"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Online (Platform Sales)</span>
              <span className="stat-value">₹{paymentBreakdown.onlineTotal.toLocaleString()}</span>
              <div style={{ fontSize: "12px", color: "#6c757d", marginTop: "4px" }}>
                Swiggy: ₹{paymentBreakdown.onlineSwiggy.toLocaleString()} · Zomato: ₹{paymentBreakdown.onlineZomato.toLocaleString()}
              </div>
              <span className="stat-percent">
                {totalPayments
                  ? Math.round((paymentBreakdown.onlineTotal / totalPayments) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Outlet</th>
                <th>Offline (₹)</th>
                <th>Online (₹)</th>
                <th>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {dailyRows.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.date}</td>
                  <td>{row.outlet}</td>
                  <td>{renderOfflineCell(row.offlineCash, row.offlineUpi)}</td>
                  <td>{renderOnlineCell(row.onlineSwiggy, row.onlineZomato)}</td>
                  <td>₹{row.total.toLocaleString()}</td>
                </tr>
              ))}
              {dailyRows.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", color: "#999" }}>
                    No payment logs recorded in this period.
                  </td>
                </tr>
              )}
            </tbody>
            {dailyRows.length > 0 && (
              <tfoot>
                <tr className="total-row">
                  <td colSpan="2">Grand Total</td>
                  <td>
                    {renderOfflineCell(
                      dailyRows.reduce((s, r) => s + r.offlineCash, 0),
                      dailyRows.reduce((s, r) => s + r.offlineUpi, 0)
                    )}
                  </td>
                  <td>
                    {renderOnlineCell(
                      dailyRows.reduce((s, r) => s + r.onlineSwiggy, 0),
                      dailyRows.reduce((s, r) => s + r.onlineZomato, 0)
                    )}
                  </td>
                  <td>
                    ₹{dailyRows.reduce((s, r) => s + r.total, 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  };

  const renderGSTReport = () => {
    const taxableValue = summaryData?.netSales || 0;
    const totalGST = summaryData?.gstCollection || 0;
    const cgst = totalGST / 2;
    const sgst = totalGST / 2;

    return (
      <div className="report-table-wrapper">
        <div className="section-title">
          <i className="ti ti-percentage"></i> GST Report (18% - CGST 9% + SGST 9%)
        </div>
        <div className="gst-summary">
          <div className="gst-card">
            <span>Taxable Value</span>
            <strong>₹{taxableValue.toLocaleString()}</strong>
          </div>
          <div className="gst-card">
            <span>CGST (9%)</span>
            <strong>₹{cgst.toLocaleString()}</strong>
          </div>
          <div className="gst-card">
            <span>SGST (9%)</span>
            <strong>₹{sgst.toLocaleString()}</strong>
          </div>
          <div className="gst-card total">
            <span>Total GST </span>
            <strong>₹{totalGST.toLocaleString()}</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderCategoryReport = () => (
    <div className="report-table-wrapper">
      <div className="section-title">
        <span><i className="ti ti-tag"></i> Sales by Category</span>
        <button className="export-btn-excel" onClick={exportCategorySalesToExcel}>
          <i className="ti ti-file-spreadsheet"></i> Export to Excel
        </button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Revenue (₹)</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {categoryData.map((row) => (
              <tr key={row.categoryId}>
                <td><strong>{row.categoryName}</strong></td>
                <td>₹{Number(row.revenue).toLocaleString()}</td>
                <td>
                  {totalRevenue
                    ? Math.round((Number(row.revenue) / totalRevenue) * 100)
                    : 0}
                  %
                </td>
              </tr>
            ))}
            {categoryData.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: "center", color: "#999" }}>
                  No category metrics recorded.
                </td>
              </tr>
            )}
          </tbody>
          {categoryData.length > 0 && (
            <tfoot>
              <tr className="total-row">
                <td>Total</td>
                <td>₹{totalRevenue.toLocaleString()}</td>
                <td>100%</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );

  const renderHourlyReport = () => (
    <div className="report-table-wrapper">
      <div className="section-title">
        <span><i className="ti ti-clock"></i> Peak Hours Analysis</span>
        <button className="export-btn-excel" onClick={exportHourlySalesToExcel}>
          <i className="ti ti-file-spreadsheet"></i> Export to Excel
        </button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time Slot</th>
              <th>Orders</th>
              <th>Revenue (₹)</th>
              <th>Avg. Ticket</th>
            </tr>
          </thead>
          <tbody>
            {peakHoursRows.map((row, idx) => (
              <tr key={idx}>
                <td>{row.slot}</td>
                <td>{row.orders}</td>
                <td>₹{row.revenue.toLocaleString()}</td>
                <td>
                  ₹
                  {row.orders
                    ? Math.round(row.revenue / row.orders).toLocaleString()
                    : 0}
                </td>
              </tr>
            ))}
            {peakHoursRows.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", color: "#999" }}>
                  No orders logged during operational hours.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPlatformReport = () => {
    const swiggyRev = platformStats.swiggy.revenue;
    const zomatoRev = platformStats.zomato.revenue;
    const directRev = platformStats.direct.revenue;
    const totalPlatformRev = swiggyRev + zomatoRev + directRev;

    return (
      <div className="report-table-wrapper">
        <div className="section-title">
          <span><i className="ti ti-motorbike"></i> Delivery Platform Report</span>
          <button className="export-btn-excel" onClick={exportPlatformSalesToExcel}>
            <i className="ti ti-file-spreadsheet"></i> Export to Excel
          </button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>orders</th>
                <th>Revenue</th>
                <th>Commisson</th>
                <th>Net Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Swiggy</strong></td>
                <td>{platformStats.swiggy.orders}</td>
                <td>₹{swiggyRev.toLocaleString()}</td>
                <td>₹{(swiggyRev * 0.15).toLocaleString()}</td>
                <td className="highlight">
                  ₹{(swiggyRev * 0.85).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td><strong>Zomato</strong></td>
                <td>{platformStats.zomato.orders}</td>
                <td>₹{zomatoRev.toLocaleString()}</td>
                <td>₹{(zomatoRev * 0.15).toLocaleString()}</td>
                <td className="highlight">
                  ₹{(zomatoRev * 0.85).toLocaleString()}
                </td>
              </tr>
              <tr>
                <td><strong>Direct</strong></td>
                <td>{platformStats.direct.orders}</td>
                <td>₹{directRev.toLocaleString()}</td>
                <td>₹0</td>
                <td className="highlight">₹{directRev.toLocaleString()}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td>Total Summary</td>
                <td>{recentOrders.length}</td>
                <td>₹{totalPlatformRev.toLocaleString()}</td>
                <td>
                  ₹{((swiggyRev + zomatoRev) * 0.15).toLocaleString()}
                </td>
                <td>
                  ₹
                  {(
                    directRev +
                    (swiggyRev + zomatoRev) * 0.85
                  ).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const renderFoodCostReport = () => {
    return (
      <div className="report-table-wrapper">
        <div className="section-title">
          <span><i className="ti ti-salad"></i> Food Cost Report - Ingredient Usage Breakdown</span>
          <button className="export-btn-excel" onClick={exportFoodCostToExcel}>
            <i className="ti ti-file-spreadsheet"></i> Export to Excel
          </button>
        </div>
        <div className="foodcost-summary">
          <div className="cost-card">
            <span>Total Revenue</span>
            <strong>₹{totalRevenue.toLocaleString()}</strong>
          </div>
          <div className="cost-card">
            <span>Total Ingredient Cost</span>
            <strong>₹{Math.round(totalIngredientCost).toLocaleString()}</strong>
          </div>
          <div className="cost-card highlight">
            <span>Food Cost %</span>
            <strong>{foodCostPercentage.toFixed(1)}%</strong>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ingredient Name</th>
                <th>Quantity Used (grams)</th>
                <th>Quantity (kg)</th>
                <th>Est. Cost (₹)</th>
              </tr>
            </thead>
            <tbody>
              {ingredientUsage.map((ing) => {
                const cost = ing.quantity * (COST_PER_GRAM[ing.name] || 0.2);
                return (
                  <tr key={ing.name}>
                    <td>
                      <strong>{ing.name}</strong>
                    </td>
                    <td>{ing.quantity.toLocaleString()} g</td>
                    <td>{(ing.quantity / 1000).toFixed(2)} kg</td>
                    <td>₹{Math.round(cost).toLocaleString()}</td>
                  </tr>
                );
              })}
              {ingredientUsage.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    style={{ textAlign: "center", color: "#999" }}
                  >
                    No sales matching standard ingredient recipes.
                  </td>
                </tr>
              )}
            </tbody>
            {ingredientUsage.length > 0 && (
              <tfoot>
                <tr className="total-row">
                  <td colSpan="3">
                    <strong>Total Ingredient Cost</strong>
                  </td>
                  <td>
                    <strong>
                      ₹{Math.round(totalIngredientCost).toLocaleString()}
                    </strong>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="insight-box">
          <i className="ti ti-info-circle"></i>
          <span>
            Food cost percentage of {foodCostPercentage.toFixed(1)}% is{" "}
            {foodCostPercentage > 35 ? "above" : "within"} industry standard
            (28-35%).{" "}
            {foodCostPercentage > 35
              ? "Consider optimizing portion sizes or negotiating with suppliers."
              : "Great job maintaining healthy food costs!"}
          </span>
        </div>
      </div>
    );
  };

  const renderActiveTab = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: 80, color: "#888" }}>
          <i className="ti ti-loader" style={{ fontSize: 32 }} />
          <p style={{ marginTop: 12 }}>Loading business reports...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ textAlign: "center", padding: 80, color: "red" }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 32 }} />
          <p style={{ marginTop: 12 }}>{error}</p>
        </div>
      );
    }

    switch (activeTab) {
      case "daily":
        return renderDailyReport();
      case "payment":
        return renderPaymentReport();
      case "gst":
        return renderGSTReport();
      case "category":
        return renderCategoryReport();
      case "hourly":
        return renderHourlyReport();
      case "delivery":
        return renderPlatformReport();
      case "foodcost":
        return renderFoodCostReport();
      default:
        return renderDailyReport();
    }
  };

  return (
    <div className="reports-container">
      {/* Header with filters */}
      <div className="reports-header">
        <div className="header-title">
          <h1>
            <i className="ti ti-chart-bar"></i> Full Business Reports
          </h1>
          <p>
            Complete analytics · Sales · Payments · GST · Food costing with ingredient breakdown
          </p>
        </div>
        <div className="filter-bar">
          <div className="filter-group">
            <label>Outlet</label>
            <select
              value={selectedOutletId}
              onChange={(e) => setSelectedOutletId(e.target.value)}
            >
              <option value="all">All outlets</option>
              {outletsList.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>
              <i className="ti ti-calendar"></i> Date
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="week">Last 7 days</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="report-tabs">
        <button
          className={`tab-btn ${activeTab === "daily" ? "active" : ""}`}
          onClick={() => setActiveTab("daily")}
        >
          <i className="ti ti-calendar-stats"></i> Daily Sales
        </button>
        <button
          className={`tab-btn ${activeTab === "payment" ? "active" : ""}`}
          onClick={() => setActiveTab("payment")}
        >
          <i className="ti ti-cash"></i> Cash/Online
        </button>
        <button
          className={`tab-btn ${activeTab === "gst" ? "active" : ""}`}
          onClick={() => setActiveTab("gst")}
        >
          <i className="ti ti-percentage"></i> GST Report
        </button>
        <button
          className={`tab-btn ${activeTab === "category" ? "active" : ""}`}
          onClick={() => setActiveTab("category")}
        >
          <i className="ti ti-tag"></i> Categories
        </button>
        <button
          className={`tab-btn ${activeTab === "hourly" ? "active" : ""}`}
          onClick={() => setActiveTab("hourly")}
        >
          <i className="ti ti-clock"></i> Hourly
        </button>
        <button
          className={`tab-btn ${activeTab === "delivery" ? "active" : ""}`}
          onClick={() => setActiveTab("delivery")}
        >
          <i className="ti ti-motorbike"></i> Platforms
        </button>
        <button
          className={`tab-btn ${activeTab === "foodcost" ? "active" : ""}`}
          onClick={() => setActiveTab("foodcost")}
        >
          <i className="ti ti-salad"></i> Food Cost
        </button>
      </div>

      {/* Report Content */}
      <div className="report-content">{renderActiveTab()}</div>

      {/* Summary Stats Footer */}
      {!loading && !error && (
        <div className="summary-footer">
          <div className="summary-item">
            <i className="ti ti-wallet"></i>
            <span>Total Revenue</span>
            <strong>₹{totalRevenue.toLocaleString()}</strong>
          </div>
          <div className="summary-item">
            <i className="ti ti-shopping-cart"></i>
            <span>Total Items Sold</span>
            <strong>{totalItemsSold}</strong>
          </div>
          <div className="summary-item">
            <i className="ti ti-receipt"></i>
            <span>Avg. Ticket Size</span>
            <strong>
              ₹
              {recentOrders.length ? Math.round(totalRevenue / recentOrders.length).toLocaleString() : 0}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}