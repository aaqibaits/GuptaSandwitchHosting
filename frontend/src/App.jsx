// App.jsx - Combined Admin & Staff App

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import TopBar from './components/TopBar/TopBar';
import POSPage from './pages/POSPage/POSPage';
import KOTPage from './pages/KOTPage/KOTPage';
import ReportsPage from './pages/ReportsPage/ReportsPage';
import PaymentModal from './components/PaymentModal/PaymentModal';
import ReceiptModal from './components/ReceiptModal/ReceiptModal';
import Toast from './components/Toast/Toast';
import LiveOrdersPage from './pages/LiveOrdersPage/LiveOrdersPage';
import Login from './pages/LoginPage/LoginPage';
import { createOrder, getDashboardStats } from './services/posApi';
import api from './services/api';

// Admin Panel Imports
import AdminSidebar from './components/AdminSidebar/AdminSidebar';
import AdminTopbar from './components/AdminTopbar/AdminTopbar';
import Dashboard from './pages/Admin/Dashboard/Dashboard';
import Dishes from './pages/Admin/Dishes/Dishes';
import Reports from './pages/Admin/Reports/Reports';
import Accounting from './pages/Admin/Accounting/Accounting';
// ✅ ADDED: Import AccountingForm — was missing, so the "Add entry" flow had nowhere to render
import AccountingForm from './pages/Admin/Accounting/AccountingForm';
import Outlets from './pages/Admin/Outlets/Outlets';
import StaffAccounting from './pages/StaffAccounting/StaffAccounting';
import './App.css';

const speakText = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    
    // Find a Hindi voice if available
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('HI'));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
};

// ── Keep your existing DEFAULT_MENU_ITEMS array exactly as it is ──
const DEFAULT_MENU_ITEMS = [
  // ... your full menu items unchanged ...
];

function App() {
  // ── Auth state ──────────────────────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // ── Staff State ─────────────────────────────────────────────────────────
  const [currentOrder, setCurrentOrder] = useState([]);
  const [menuItems, setMenuItems] = useState(DEFAULT_MENU_ITEMS);
  const [salesTotal, setSalesTotal] = useState(4820);
  const [orderCount, setOrderCount] = useState(7);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [discount, setDiscount] = useState({ value: 0, type: 'pct' });
  const [orderType, setOrderType] = useState('dine');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Dashboard Stats
  const [stats, setStats] = useState({
    activeOrdersCount: 0,
    todayTotalSales: 0,
    todayTotalOrders: 0,
    activeKotCount: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Staff UI State
  const [staffActivePage, setStaffActivePage] = useState('pos');
  const [selectedOutlet, setSelectedOutlet] = useState("All Outlets");
  const [toastMessage, setToastMessage] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    localStorage.setItem('soundEnabled', String(soundEnabled));
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Live / Platform Orders State (persisted at App level so changing tabs does not wipe them)
  const [liveOrders, setLiveOrders] = useState([]);
  const [liveStats, setLiveStats] = useState({
    swiggy: { pending: 0, preparing: 0, ready: 0, completed: 0, total: 0 },
    zomato: { pending: 0, preparing: 0, ready: 0, completed: 0, total: 0 }
  });
  const [liveSocketConnected, setLiveSocketConnected] = useState(false);

  // ── Accounting sub-navigation ──────────────────────────────────────────
  // ✅ ADDED: The Accounting section has two views: the ledger list and the
  //    create/edit form. Because the whole app uses state-based navigation
  //    (no React Router), we track the accounting sub-page here and pass
  //    an `onNavigate` callback down so the child components never need
  //    useNavigate() or useParams().
  //
  //    accountingSubPage: 'list' | 'form'
  //    accountingEditId:  null (create mode) | number (edit mode)
  const [accountingSubPage, setAccountingSubPage] = useState('list');
  const [accountingEditId, setAccountingEditId] = useState(null);

  // Called by Accounting.jsx and AccountingForm.js to change sub-page
  const handleAccountingNavigate = (page, id = null) => {
    setAccountingSubPage(page);
    setAccountingEditId(id !== undefined ? id : null);
  };

  // Reset accounting sub-page whenever the user leaves the accounting section
  useEffect(() => {
    if (staffActivePage !== 'accounting') {
      setAccountingSubPage('list');
      setAccountingEditId(null);
    }
  }, [staffActivePage]);

  // Default active page based on user role on login
  useEffect(() => {
    if (currentUser) {
      const isAdmin =
        currentUser.authType === 'admin' ||
        currentUser.role === 'ADMIN' ||
        currentUser.role === 'SUPER_ADMIN';
      
      if (isAdmin) {
        setStaffActivePage('dashboard');
      } else if (currentUser.role_label === 'Kitchen Staff') {
        setStaffActivePage('kot');
      } else {
        setStaffActivePage('pos');
      }
    }
  }, [currentUser]);

  // Persist session across page refreshes
  useEffect(() => {
    const savedToken =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token');

    const savedUserRaw =
      localStorage.getItem('user') ||
      sessionStorage.getItem('user');

    const savedAuthType =
      localStorage.getItem('authType') ||
      sessionStorage.getItem('authType');

    if (savedToken && savedUserRaw) {
      try {
        const savedUser = JSON.parse(savedUserRaw);
        if (savedUser?.outlet_id) {
          sessionStorage.setItem('gs_outlet_id', String(savedUser.outlet_id));
        }
        setCurrentUser({
          ...savedUser,
          token: savedToken,
          authType: savedAuthType || savedUser?.authType || null,
        });
        setIsLoggedIn(true);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('authType');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('authType');
        sessionStorage.removeItem('gs_outlet_id');
      }
    }
  }, []);

  const handleLogin = (user, token) => {
    const authType =
      localStorage.getItem('authType') ||
      sessionStorage.getItem('authType') ||
      (user?.role_label ? 'user' : 'admin');

    if (user?.outlet_id) {
      sessionStorage.setItem('gs_outlet_id', String(user.outlet_id));
    }

    setCurrentUser({ ...user, token, authType });
    setIsLoggedIn(true);

    if (localStorage.getItem('token') || localStorage.getItem('user')) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('authType', authType);
    } else {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('authType', authType);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authType');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('authType');
    sessionStorage.removeItem('gs_outlet_id');

    setStaffActivePage('pos');
    showToast('👋 Logged out successfully');
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Staff Functions
  const loadStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      if (data) {
        setStats({
          activeOrdersCount: Number(data.activeOrdersCount || 0),
          todayTotalSales: Number(data.todayTotalSales || 0),
          todayTotalOrders: Number(data.todayTotalOrders || 0),
          activeKotCount: Number(data.activeKotCount || 0),
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    if (
      currentUser?.authType === 'admin' ||
      currentUser?.role === 'ADMIN' ||
      currentUser?.role === 'SUPER_ADMIN'
    ) {
      return undefined;
    }
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, [isLoggedIn, currentUser, loadStats]);

  // Keep liveStats synchronized with liveOrders
  useEffect(() => {
    const s = {
      swiggy: { pending: 0, preparing: 0, ready: 0, completed: 0, total: 0 },
      zomato: { pending: 0, preparing: 0, ready: 0, completed: 0, total: 0 }
    };
    liveOrders.forEach(o => { 
      if (s[o.platform] && s[o.platform][o.status] !== undefined) {
        s[o.platform][o.status]++; 
        s[o.platform].total++; 
      }
    });
    setLiveStats(s);
  }, [liveOrders]);

  // Setup Socket.io connection in the background for live orders
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return undefined;
    if (
      currentUser.authType === 'admin' ||
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'SUPER_ADMIN'
    ) {
      return undefined;
    }

    let socket = null;

    const initSocket = () => {
      const socketUrl = (
        import.meta.env.VITE_API_URL ||
        import.meta.env.REACT_APP_API_URL ||
        'http://localhost:5000/api'
      ).replace('/api', '');

      let outletId = currentUser.outlet_id || sessionStorage.getItem('gs_outlet_id') || 1;

      socket = window.io(socketUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true
      });

      socket.on('connect', () => {
        setLiveSocketConnected(true);
        socket.emit('join_outlet', Number(outletId));
        console.log(`🔌 Connected to live orders socket in App.jsx. Room: outlet_${outletId}`);
      });

      socket.on('disconnect', () => {
        setLiveSocketConnected(false);
        console.log('❌ Disconnected from live orders socket in App.jsx');
      });

      socket.on('connect_error', (err) => {
        setLiveSocketConnected(false);
        console.error('Socket connection error in App.jsx:', err);
      });

      socket.on('NEW_PLATFORM_ORDER', (data) => {
        if (!data || !data.order) return;

        if (soundEnabledRef.current) {
          const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});
          speakText('Nayi order prapt hui hai. New order received.');
        }

        const platform = data.order.orderType || 'swiggy';
        const mappedItems = (data.items || []).map(item => ({
          id: item.dishId || item.id,
          name: item.dishName || item.name || 'Dish Item',
          qty: item.quantity || item.qty || 1,
          price: Number(item.unitPrice || item.price || 0),
          special: item.specialInstructions || '',
          time: item.timeRequired || '10-15 min'
        }));

        const newOrder = {
          id: data.order.id,
          kotId: data.kot?.id || null,
          platform,
          platformOrderId: data.order.platformOrderId || data.order.orderNumber,
          customerName: data.order.customerName || 'Customer',
          customerPhone: data.order.customerPhone || '0000000000',
          items: mappedItems,
          total: Number(data.order.totalAmount || data.order.total || 0),
          status: data.order.status || 'pending',
          orderTime: data.order.orderTime ? new Date(data.order.orderTime) : new Date(),
          deliveryAddress: data.order.deliveryAddress || 'Not Provided',
          specialInstructions: data.order.specialInstructions || '',
          estimatedTime: data.order.estimatedTime || 25,
          paymentMethod: data.order.paymentMethod || 'Online'
        };

        setLiveOrders(prev => {
          if (prev.find(o => o.id === newOrder.id || o.platformOrderId === newOrder.platformOrderId)) {
            return prev;
          }
          return [newOrder, ...prev];
        });

        showToast(`🛵 New ${platform.toUpperCase()} order from ${newOrder.customerName}!`);

        if (localStorage.getItem('autoAccept') === 'true' && newOrder.kotId) {
          api.patch(`/pos/kots/${newOrder.kotId}/status`, { status: 'preparing' })
            .then(() => {
              setLiveOrders(prev => prev.map(o => o.id === newOrder.id ? { ...o, status: 'preparing' } : o));
              showToast(`✅ Auto-accepted order from ${newOrder.customerName}!`);
            })
            .catch(err => {
              console.error('Auto-accept failed:', err);
            });
        }
      });

      socket.on('KOT_STATUS_UPDATE', (data) => {
        if (!data || !data.orderId) return;
        setLiveOrders(prev => prev.map(order => {
          if (order.id === data.orderId) {
            if (data.orderStatus) {
              return {
                ...order,
                status: data.orderStatus
              };
            }
            // Mapping database status to live order status
            const nextStatus = data.status === 'ready' 
              ? 'ready' 
              : (data.status === 'served' || data.status === 'dispatched' ? 'completed' : (data.status === 'cancelled' ? 'cancelled' : order.status));
            
            return {
              ...order,
              status: nextStatus
            };
          }
          return order;
        }));
      });
    };

    if (window.io) {
      initSocket();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
      script.async = true;
      script.onload = () => {
        initSocket();
      };
      document.body.appendChild(script);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isLoggedIn, currentUser]);

  const getTotalForOrder = () => {
    const subtotal = currentOrder.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let discountAmount = 0;
    if (discount.value > 0) {
      discountAmount = discount.type === 'pct'
        ? Math.round((subtotal * discount.value / 100) * 100) / 100
        : Math.min(discount.value, subtotal);
    }
    return Math.round((subtotal - discountAmount) * 100) / 100;
  };

  const handlePaymentComplete = async (method) => {
    if (currentOrder.length === 0) {
      showToast('⚠️ No items in cart');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        outletId: Number(currentUser?.outlet_id || sessionStorage.getItem('gs_outlet_id')),
        orderType,
        paymentMethod: method.toLowerCase(),
        items: currentOrder.map(item => ({
          dishId: Number(item.dishId ?? item.id),
          quantity: Number(item.qty ?? 1),
          specialInstructions: item.specialInstructions || null
        })),
        discount: {
          type: discount.type === 'pct' ? 'percentage' : 'fixed',
          value: Number(discount.value)
        },
        expectedTotal: Number(getTotalForOrder())
      };

      await createOrder(payload);
      setPaymentModalOpen(false);
      setCurrentOrder([]);
      setDiscount({ value: 0, type: 'pct' });
      showToast('✅ Order placed & sent to kitchen!');
      loadStats();
    } catch (err) {
      console.error(err);
      showToast(`❌ Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeReceipt = () => {
    setReceiptData(null);
    showToast('🖨️ Receipt printed!');
  };

  // ── Show Login if not authenticated ────────────────────────────────────
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // ── Admin Dashboard ────────────────────────────────────────────────────
  if (
    currentUser?.authType === 'admin' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'SUPER_ADMIN'
  ) {
    return (
      <div className="app admin-app">
        <AdminSidebar
          currentPage={staffActivePage}
          setCurrentPage={setStaffActivePage}
          onLogout={handleLogout}
        />
        <div className="main">
          <AdminTopbar
            title="Admin Dashboard"
            user={currentUser}
            onLogout={handleLogout}
            selectedOutlet={selectedOutlet}
            onOutletChange={setSelectedOutlet}
          />
          <div className="content">
            {staffActivePage === 'dashboard' && (
              <Dashboard selectedOutlet={selectedOutlet} />
            )}
            {staffActivePage === 'dishes' && (
              <Dishes
                menuItems={menuItems}
                setMenuItems={setMenuItems}
                selectedOutlet={selectedOutlet}
              />
            )}
            {staffActivePage === 'reports' && (
              <Reports selectedOutlet={selectedOutlet} />
            )}

            {/* ✅ UPDATED: Accounting section now renders either the ledger list OR the
                  create/edit form, controlled by `accountingSubPage` state.
                  Both components receive `onNavigate` so they can switch between views
                  without needing React Router at all. */}
            {staffActivePage === 'accounting' && (
              accountingSubPage === 'form' ? (
                <AccountingForm
                  id={accountingEditId}
                  onNavigate={handleAccountingNavigate}
                />
              ) : (
                <Accounting
                  selectedOutlet={selectedOutlet}
                  onNavigate={handleAccountingNavigate}
                />
              )
            )}

            {staffActivePage === 'outlets' && (
              <Outlets currentUser={currentUser} />
            )}
          </div>
        </div>
        <Toast message={toastMessage} />
      </div>
    );
  }

  // ── Staff POS System ────────────────────────────────────────────────────
  return (
    <div className="app staff-app">
      <Sidebar
        activePage={staffActivePage}
        setActivePage={setStaffActivePage}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <div className="content">
        <TopBar
          openOrdersCount={stats.activeOrdersCount}
          activeKotCount={stats.activeKotCount}
          salesTotal={stats.todayTotalSales}
          orderCount={stats.todayTotalOrders}
          isLoadingStats={isLoadingStats}
        />
        {staffActivePage === 'pos' && (
          <POSPage
            currentOrder={currentOrder}
            setCurrentOrder={setCurrentOrder}
            discount={discount}
            setDiscount={setDiscount}
            getTotalForOrder={getTotalForOrder}
            setPaymentModalOpen={setPaymentModalOpen}
            showToast={showToast}
            menuItems={menuItems}
            onUpdateMenu={setMenuItems}
            orderType={orderType}
            setOrderType={setOrderType}
            onCashPayment={() => handlePaymentComplete('Cash')}
            onOnlinePayment={() => handlePaymentComplete('Online')}
          />
        )}
        {staffActivePage === 'kot' && (
          <KOTPage
            showToast={showToast}
            isActive={staffActivePage === 'kot'}
            onStatsRefresh={loadStats}
          />
        )}
        {staffActivePage === 'reports' && <ReportsPage />}
        {staffActivePage === 'live-orders' && (
          <LiveOrdersPage
            showToast={showToast}
            orders={liveOrders}
            setOrders={setLiveOrders}
            stats={liveStats}
            isConnected={liveSocketConnected}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
          />
        )}
        {staffActivePage === 'accounting' && (
          <StaffAccounting currentUser={currentUser} />
        )}
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onConfirm={handlePaymentComplete}
        total={getTotalForOrder()}
        orderItems={currentOrder}
      />

      {/* {receiptData && <ReceiptModal data={receiptData} onClose={closeReceipt} />} */}

      <Toast message={toastMessage} />
    </div>
  );
}

export default App;