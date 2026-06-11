import React, { useState, useCallback, useEffect } from 'react';
import {
  getKOTTickets,
  markItemReady,
  markAllItemsReady,
  dispatchOrder,
  cancelOrder,
} from '../../services/posApi';
import './KOTPage.css';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';

const isKotReady = (kot) =>
  kot.status === 'ready' ||
  kot.allItemsReady ||
  (kot.items?.length > 0 && kot.items.every((i) => i.isReady));

const getReadyCount = (items = []) => items.filter((i) => i.isReady).length;

const formatOrderLabel = (kot) => {
  if (kot.orderType === 'parcel') return 'Parcel';
  return 'Dine-in';
  // Table labels disabled:
  // return kot.tableNumber ? `Table ${kot.tableNumber}` : 'Dine-in';
};

const KOTPage = ({ showToast, isActive, onStatsRefresh }) => {
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyKotId, setBusyKotId] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState({ isOpen: false, kot: null });

  const loadKots = useCallback(async (refreshStats = false) => {
    try {
      const data = await getKOTTickets();
      setKots(Array.isArray(data) ? data : []);
      setError(null);
      if (refreshStats) onStatsRefresh?.();
    } catch (err) {
      setError(err.message || 'Failed to load KOT tickets');
    } finally {
      setLoading(false);
    }
  }, [onStatsRefresh]);

  useEffect(() => {
    if (!isActive) return undefined;

    loadKots();
    const interval = setInterval(loadKots, 10000);

    let socket = null;

    const initSocket = () => {
      const socketUrl = (
        import.meta.env.VITE_API_URL ||
        import.meta.env.REACT_APP_API_URL ||
        'http://localhost:5000/api'
      ).replace('/api', '');

      const outletId = sessionStorage.getItem('gs_outlet_id') || 1;

      socket = window.io(socketUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true
      });

      socket.on('connect', () => {
        socket.emit('join_outlet', Number(outletId));
        console.log(`🔌 Connected to KOT socket. Room: outlet_${outletId}`);
      });

      socket.on('NEW_PLATFORM_ORDER', () => {
        loadKots();
      });

      socket.on('KOT_STATUS_UPDATE', () => {
        loadKots();
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
      clearInterval(interval);
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isActive, loadKots]);

  const pendingCount = kots.filter((k) => !isKotReady(k) && k.status !== 'dispatched').length;
  const readyCount = kots.filter((k) => isKotReady(k)).length;

  const toggleItemReady = async (kot, item) => {
    setBusyKotId(kot.id);
    try {
      await markItemReady(kot.id, item.id, !item.isReady);
      showToast?.(
        `${item.dishName} ${!item.isReady ? 'ready' : 'pending'} (${kot.kotNumber})`
      );
      await loadKots(true);
    } catch (err) {
      showToast?.(`❌ ${err.message}`);
    } finally {
      setBusyKotId(null);
    }
  };

  const handleMarkAllReady = async (kot) => {
    setBusyKotId(kot.id);
    try {
      await markAllItemsReady(kot.id);
      showToast?.(`✅ All items in ${kot.kotNumber} marked ready`);
      await loadKots(true);
    } catch (err) {
      showToast?.(`❌ ${err.message}`);
    } finally {
      setBusyKotId(null);
    }
  };

  const handleDispatchFull = async (kot) => {
    if (!isKotReady(kot)) {
      showToast?.(`⚠️ Cannot dispatch ${kot.kotNumber} — not all items ready`);
      return;
    }
    setBusyKotId(kot.id);
    try {
      await dispatchOrder(kot.id);
      showToast?.(`🚀 ${kot.kotNumber} dispatched · ${formatOrderLabel(kot)}`);
      await loadKots(true);
    } catch (err) {
      showToast?.(`❌ ${err.message}`);
    } finally {
      setBusyKotId(null);
    }
  };

  const handleCancel = (kot) => {
    setConfirmCancel({ isOpen: true, kot });
  };

  const handleConfirmCancel = async () => {
    const kot = confirmCancel.kot;
    if (!kot) return;
    setBusyKotId(kot.id);
    try {
      await cancelOrder(kot.id);
      showToast?.(`🗑️ ${kot.kotNumber} cancelled`);
      await loadKots(true);
    } catch (err) {
      showToast?.(`❌ ${err.message}`);
    } finally {
      setBusyKotId(null);
      setConfirmCancel({ isOpen: false, kot: null });
    }
  };

  return (
    <div className="kot-page">
      <div className="kot-toolbar">
        <h2>Kitchen Order Tickets</h2>
        <button type="button" className="kot-refresh-btn" onClick={loadKots} disabled={loading}>
          <i className="ti ti-refresh"></i>
        </button>
        <div className="stat-pill">
          <i className="ti ti-clock" style={{ fontSize: '14px', color: 'var(--orange)' }}></i>
          <span className="val" style={{ color: 'var(--orange)' }}>{pendingCount}</span> pending
        </div>
        <div className="stat-pill">
          <i className="ti ti-check" style={{ fontSize: '14px', color: 'var(--green)' }}></i>
          <span className="val" style={{ color: 'var(--green)' }}>{readyCount}</span> ready
        </div>
      </div>

      <div className="kot-grid">
        {loading && (
          <div className="kot-state">
            <i className="ti ti-loader"></i>
            <p>Loading tickets…</p>
          </div>
        )}

        {!loading && error && (
          <div className="kot-state kot-state-error">
            <p>{error}</p>
            <button type="button" onClick={loadKots}>Retry</button>
          </div>
        )}

        {!loading && !error && kots.length === 0 && (
          <div className="kot-state">
            <i className="ti ti-chef-hat"></i>
            <p>No active KOT tickets</p>
            <small>New orders from POS will appear here</small>
          </div>
        )}

        {!loading &&
          !error &&
          kots.map((kot) => {
            const items = kot.items || [];
            const readyItemsCount = getReadyCount(items);
            const totalItems = items.length;
            const allReady = isKotReady(kot);
            const isUrgent = kot.isUrgent || kot.minutesElapsed >= 15;
            const busy = busyKotId === kot.id;

            return (
              <div
                key={kot.id}
                className={`kot-card ${isUrgent && !allReady ? 'urgent' : ''} ${allReady ? 'ready' : ''} status-${kot.status}`}
              >
                <div className="kot-head">
                  <div className="kot-head-left">
                    <div className="kot-table">
                      {kot.kotNumber} · {formatOrderLabel(kot)}
                    </div>
                    <div className={`kot-time ${isUrgent && !allReady ? 'urgent' : ''}`}>
                      {allReady ? (
                        <>
                          <i className="ti ti-check"></i> All items ready
                        </>
                      ) : (
                        <>
                          <i className="ti ti-clock"></i> {kot.minutesElapsed || 0}m ago ·{' '}
                          {kot.orderType === 'parcel' ? 'Parcel' : 'Dine-in'}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="kot-head-right">
                    <span className={`status-badge status-${kot.status}`}>
                      {(kot.status || 'pending').toUpperCase()}
                    </span>
                    <div className="ready-progress">
                      {readyItemsCount}/{totalItems} ready · {totalItems - readyItemsCount} pending
                    </div>
                  </div>
                </div>

                <div className="kot-items">
                  {items.map((item) => (
                    <div key={item.id} className="kot-item">
                      <input
                        type="checkbox"
                        className="item-ready-checkbox"
                        checked={item.isReady || false}
                        disabled={!!busy}
                        onChange={() => toggleItemReady(kot, item)}
                      />
                      <div className="kot-qty">{item.quantity}</div>
                      <div
                        className={`kot-iname ${item.isReady ? 'item-done' : ''}`}
                      >
                        {item.dishName}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="kot-actions">
                  {allReady ? (
                    <button
                      type="button"
                      className="btn-ready dispatch"
                      disabled={!!busy}
                      onClick={() => handleDispatchFull(kot)}
                    >
                      <i className="ti ti-truck"></i> Dispatch Full Order
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-ready"
                      disabled={!!busy}
                      onClick={() => handleMarkAllReady(kot)}
                    >
                      <i className="ti ti-check-all"></i> Mark All Ready
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-cancel-kot"
                    disabled={!!busy}
                    onClick={() => handleCancel(kot)}
                  >
                    <i className="ti ti-trash"></i> Cancel
                  </button>
                </div>
              </div>
            );
          })}
      </div>
      <ConfirmationModal
        isOpen={confirmCancel.isOpen}
        title="Cancel KOT"
        message={`Cancel order ${confirmCancel.kot?.kotNumber}?`}
        isDanger={true}
        confirmText="Cancel Order"
        onConfirm={handleConfirmCancel}
        onCancel={() => setConfirmCancel({ isOpen: false, kot: null })}
      />
    </div>
  );
};

export default KOTPage;
