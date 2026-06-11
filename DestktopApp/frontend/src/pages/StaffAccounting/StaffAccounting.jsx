import React, { useState, useMemo, useEffect } from 'react';
import './StaffAccounting.css';
import {
  fetchStaffAccountingLedger,
  fetchStaffAccountingSummary,
  getBillImageUrl
} from '../../services/accountingApi';

const StaffAccounting = ({ currentUser }) => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [viewImageUrl, setViewImageUrl] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [summary, setSummary] = useState({ total_billed: 0, received: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const staffOutletName = useMemo(() => {
    return currentUser?.outlet_name || sessionStorage.getItem('gs_outlet_name') || "My Outlet";
  }, [currentUser]);

  useEffect(() => {
    const loadStaffAccounting = async () => {
      try {
        setLoading(true);
        const [ledgerData, summaryData] = await Promise.all([
          fetchStaffAccountingLedger(),
          fetchStaffAccountingSummary()
        ]);
        setLedger(ledgerData.data || []);
        setSummary(summaryData.data || { total_billed: 0, received: 0, pending: 0 });
      } catch (err) {
        console.error("Failed to load staff accounting data", err);
        setError("Failed to load accounting data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    loadStaffAccounting();
  }, []);

  const formatDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleDateString('en-IN') : "—");

  if (loading) {
    return (
      <div className="accounting" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ fontSize: '16px', color: 'var(--muted)' }}>Loading accounting ledger...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="accounting" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: '12px' }}>
        <div style={{ fontSize: '16px', color: 'var(--red)' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="accounting">
      <div className="acct-header">
        <div className="acct-title">Accounting Ledger ({staffOutletName})</div>
      </div>

      <div className="table-wrap" style={{ marginBottom: 14 }}>
        <table>
          <thead>
            <tr>
              <th>Txn ID</th>
              <th>Outlet</th>
              <th>Amount</th>
              <th>Order date</th>
              <th>Delivery date</th>
              <th>Payment date</th>
              <th>Bill</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((row) => (
              <tr key={row.id}>
                <td className="txn-id">{row.transaction_id}</td>
                <td>{row.outlet_name}</td>
                <td className="txn-amount">₹{row.amount.toLocaleString('en-IN')}</td>
                <td>{formatDate(row.order_date)}</td>
                <td>{formatDate(row.delivery_date)}</td>
                <td>{formatDate(row.payment_date)}</td>
                <td>
                  {row.bill_uploaded ? (
                    <button className="view-bill-btn" onClick={() => setViewImageUrl(getBillImageUrl(row.bill_url))}>
                      <i className="ti ti-photo" /> View bill
                    </button>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: '12px' }}>No bill</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${
                    row.status === "paid" ? "s-paid" : row.status === "pending" ? "s-pending" : "s-due"
                  }`}>
                    {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                  </span>
                </td>
                <td>
                  <button className="edit-btn" onClick={() => setSelectedRow(row)} style={{ borderRadius: '999px', padding: '6px 12px' }}>
                    <i className="ti ti-eye" /> View
                  </button>
                </td>
              </tr>
            ))}
            {ledger.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                  No entries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="acct-summary">
        <div className="metric-card">
          <div className="metric-label">Total billed</div>
          <div className="metric-value">
            ₹{summary.total_billed.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Received</div>
          <div className="metric-value metric-value--green">
            ₹{summary.received.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pending</div>
          <div className="metric-value metric-value--red">
            ₹{summary.pending.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Bill image viewer overlay */}
      {viewImageUrl && (
        <div className="image-view-overlay" onClick={() => setViewImageUrl(null)}>
          <div className="image-view-modal" onClick={(e) => e.stopPropagation()}>
            <button className="image-view-close" onClick={() => setViewImageUrl(null)}>×</button>
            <img src={viewImageUrl} alt="Bill image" style={{ borderRadius: 6 }} />
          </div>
        </div>
      )}

      {/* Read-only details view modal */}
      {selectedRow && (
        <div className="acct-details-overlay" onClick={() => setSelectedRow(null)}>
          <div className="acct-details-modal" onClick={(e) => e.stopPropagation()}>
            <button className="acct-details-close" onClick={() => setSelectedRow(null)}>×</button>
            
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>
              Transaction Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--muted)' }}>Transaction ID</span>
                <strong style={{ color: 'var(--text)' }}>{selectedRow.transaction_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--muted)' }}>Outlet</span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{selectedRow.outlet_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--muted)' }}>Amount</span>
                <strong style={{ color: 'var(--orange)', fontSize: '15px' }}>₹{selectedRow.amount.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--muted)' }}>Order Date</span>
                <span style={{ color: 'var(--text)' }}>{formatDate(selectedRow.order_date)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--muted)' }}>Delivery Date</span>
                <span style={{ color: 'var(--text)' }}>{formatDate(selectedRow.delivery_date)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--muted)' }}>Payment Date</span>
                <span style={{ color: 'var(--text)' }}>{formatDate(selectedRow.payment_date)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--muted)' }}>Payment Status</span>
                <span className={`status-badge ${
                  selectedRow.status === "paid" ? "s-paid" : selectedRow.status === "pending" ? "s-pending" : "s-due"
                }`}>
                  {selectedRow.status.charAt(0).toUpperCase() + selectedRow.status.slice(1)}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <span style={{ color: 'var(--muted)' }}>Bill Document</span>
                {selectedRow.bill_uploaded ? (
                  <img src={getBillImageUrl(selectedRow.bill_url)} alt="Bill Preview" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                ) : (
                  <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>No bill document uploaded.</span>
                )}
              </div>
            </div>

            <button 
              className="btn-print" 
              onClick={() => setSelectedRow(null)}
              style={{ marginTop: '12px', background: 'var(--sidebar)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 600, cursor: 'pointer' }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAccounting;
