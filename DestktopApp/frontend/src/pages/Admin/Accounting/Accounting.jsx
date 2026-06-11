// ✅ FIX: Removed `useNavigate` from React Router — the rest of this app uses
//    state-based navigation (staffActivePage in App.jsx), not React Router.
//    Calling useNavigate() outside a <Router> context throws:
//      "useNavigate() may be used only in the context of a <Router> component"
//    The "Add entry" button now calls the `onNavigate` prop passed in from App.jsx.
import React, { useState, useEffect } from "react";
import {
  fetchAccountingLedger,
  fetchAccountingSummary,
  deleteLedgerEntry,
  uploadBillImage,
  updateLedgerEntry,
  getBillImageUrl,
  fetchOutlets,
} from "../../../services/accountingApi";
import "./Accounting.css";

export default function Accounting({ selectedOutlet = "All Outlets", onNavigate }) {
  const [ledger, setLedger] = useState([]);
  const [summary, setSummary] = useState({ total_billed: 0, received: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({
    outlet_id: '',
    transaction_id: '',
    amount: '',
    order_date: '',
    delivery_date: '',
    payment_date: '',
    status: 'pending'
  });
  const [editBillFile, setEditBillFile] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState(null);
  const [imageLoadAttempted, setImageLoadAttempted] = useState(false);
  const [outletsList, setOutletsList] = useState([]);
  const [selectedOutletId, setSelectedOutletId] = useState(undefined);

  const loadData = async (outletIdParam) => {
    let outletToUse = outletIdParam !== undefined ? outletIdParam : selectedOutletId;
    // treat explicit null as no filter (all outlets)
    if (outletToUse === null) outletToUse = undefined;
    setLoading(true);
    try {
      const [ledgerRes, summaryRes] = await Promise.all([
        fetchAccountingLedger(outletToUse),
        fetchAccountingSummary(outletToUse),
      ]);
      if (ledgerRes.success) setLedger(ledgerRes.data);
      if (summaryRes.success) setSummary(summaryRes.data);
    } catch (err) {
      console.error("Failed to fetch accounting data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch outlets list once to map selectedOutlet (name) -> outlet id
    const init = async () => {
      try {
        const outRes = await fetchOutlets();
        if (outRes.success) setOutletsList(outRes.data);
        else setOutletsList([]);
      } catch (err) {
        setOutletsList([]);
      }
    };
    init();
    loadData();
  }, []);

  // Re-load data whenever the selected outlet string or its resolved id changes
  useEffect(() => {
    // Resolve selectedOutlet (name) -> id. If 'All Outlets' or falsy, clear id.
    if (!selectedOutlet || selectedOutlet === 'All Outlets') {
      setSelectedOutletId(undefined);
      // pass null to explicitly load all outlets (avoid race with setState)
      loadData(null);
      return;
    }
    const found = outletsList.find(o => o.name === selectedOutlet);
    if (found) {
      setSelectedOutletId(found.id);
      loadData(found.id);
    } else {
      // If outletsList not yet loaded, attempt to fetch then reload
      (async () => {
        try {
          const outRes = await fetchOutlets();
          if (outRes.success) {
            setOutletsList(outRes.data);
            const f = outRes.data.find(o => o.name === selectedOutlet);
            setSelectedOutletId(f ? f.id : undefined);
            loadData(f ? f.id : undefined);
          }
        } catch (err) {
          console.error('Failed to resolve selected outlet', err);
        } finally {
          // if we couldn't resolve, still reload all data
          loadData();
        }
      })();
    }
  }, [selectedOutlet, outletsList]);

  const handleUploadBill = async (id) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const res = await uploadBillImage(id, file);
        if (res.success) {
          loadData();
        } else {
          alert("Upload failed: " + res.message);
        }
      } catch (err) {
        console.error("Upload error", err);
        alert("Error uploading bill");
      }
    };
    fileInput.click();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        const res = await deleteLedgerEntry(id);
        if (res.success) {
          if (editingRow === id) cancelEdit();
          loadData();
        } else alert("Delete failed: " + res.message);
      } catch (err) {
        console.error("Delete error", err);
        alert("Error deleting entry");
      }
    }
  };

  const openEdit = (row) => {
    setEditingRow(row.id);
    setEditForm({
      outlet_id: row.outlet_id || '',
      transaction_id: row.transaction_id || '',
      amount: row.amount || '',
      order_date: row.order_date ? row.order_date.split('T')[0] : '',
      delivery_date: row.delivery_date ? row.delivery_date.split('T')[0] : '',
      payment_date: row.payment_date ? row.payment_date.split('T')[0] : '',
      status: row.status || 'pending'
    });
    setEditBillFile(null);
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditBillFile(null);
    setEditForm({
      outlet_id: '',
      transaction_id: '',
      amount: '',
      order_date: '',
      delivery_date: '',
      payment_date: '',
      status: 'pending'
    });
  };

  const normalizeImageUrl = (url) => getBillImageUrl(url);

  const getValidBillPath = (path) => {
    if (!path) return null;
    const value = String(path).trim();
    if (value === '' || value.toLowerCase() === 'null' || value.toLowerCase() === 'undefined') {
      return null;
    }
    return value;
  };

  const openImage = (url) => {
    const normalized = normalizeImageUrl(url);
    if (!normalized) {
      alert('Unable to load bill. The file may be missing or invalid.');
      return;
    }
    setViewImageUrl(normalized);
    setImageLoadAttempted(false);
  };
  const closeImage = () => setViewImageUrl(null);

  const handleImageError = () => {
    const src = viewImageUrl;
    if (!src) return;
    if (!imageLoadAttempted) {
      setImageLoadAttempted(true);
      let fixed = src.replace(/\\/g, '/').trim();
      if (!fixed.startsWith('http')) {
        fixed = fixed.startsWith('/')
          ? window.location.origin + fixed
          : window.location.origin + '/' + fixed.replace(/^\/+/, '');
      }
      if (fixed !== src) {
        setViewImageUrl(fixed);
        return;
      }
    }
    console.warn('Failed to load image at', src);
    setViewImageUrl(null);
    alert('Unable to load bill. The file may be missing on the server.');
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'bill_url') {
      setEditBillFile(files[0]);
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const saveEdit = async (id) => {
    setSavingEdit(true);
    try {
      const payload = new FormData();
      payload.append('outlet_id', editForm.outlet_id);
      payload.append('transaction_id', editForm.transaction_id);
      payload.append('amount', editForm.amount);
      payload.append('order_date', editForm.order_date);
      if (editForm.delivery_date) payload.append('delivery_date', editForm.delivery_date);
      if (editForm.payment_date) payload.append('payment_date', editForm.payment_date);
      payload.append('status', editForm.status);
      if (editBillFile) payload.append('bill_url', editBillFile);

      const res = await updateLedgerEntry(id, payload);
      if (res.success) {
        setEditingRow(null);
        setEditBillFile(null);
        loadData();
      } else {
        alert('Update failed: ' + res.message);
      }
    } catch (err) {
      console.error('Save edit error', err);
      alert('Failed to update entry');
    } finally {
      setSavingEdit(false);
    }
  };

  const formatDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleDateString() : "—");

  return (
    <div className="accounting">
      <div className="acct-header">
        <div className="acct-title">Accounting Ledger</div>
        {/* ✅ FIX: was navigate("/admin/accounting/new") which requires React Router.
              Now calls onNavigate('form') which App.jsx handles by switching to AccountingForm. */}
        <button className="add-btn" onClick={() => onNavigate('form', null)}>
          <i className="ti ti-plus" /> Add entry
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
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
                  editingRow === row.id ? (
                    <tr key={row.id} className="edit-row">
                      <td>
                        <input
                          type="text"
                          name="transaction_id"
                          value={editForm.transaction_id}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>{row.outlet_name || `Outlet ${row.outlet_id}`}</td>
                      <td>
                        <input
                          type="number"
                          name="amount"
                          value={editForm.amount}
                          onChange={handleEditChange}
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          name="order_date"
                          value={editForm.order_date}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          name="delivery_date"
                          value={editForm.delivery_date}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          name="payment_date"
                          value={editForm.payment_date}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {row.bill_uploaded ? (
                            <span className="bill-uploaded">
                              <i className="ti ti-photo" /> Uploaded
                            </span>
                          ) : (
                            <span className="bill-missing">No bill</span>
                          )}
                          <input
                            type="file"
                            name="bill_url"
                            accept="image/*"
                            onChange={handleEditChange}
                          />
                        </div>
                      </td>
                      <td>
                        <select name="status" value={editForm.status} onChange={handleEditChange}>
                          <option value="pending">Pending</option>
                          <option value="due">Due</option>
                          <option value="paid">Paid</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="edit-btn"
                            onClick={() => saveEdit(row.id)}
                            disabled={savingEdit}
                            type="button"
                          >
                            <i className="ti ti-check" /> {savingEdit ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            className="delete-btn"
                            onClick={cancelEdit}
                            type="button"
                          >
                            <i className="ti ti-x" /> Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.id}>
                      <td className="txn-id">{row.transaction_id}</td>
                      <td>{row.outlet_name || `Outlet ${row.outlet_id}`}</td>
                      <td className="txn-amount">₹{Number(row.amount).toLocaleString()}</td>
                      <td>{formatDate(row.order_date)}</td>
                      <td>{formatDate(row.delivery_date)}</td>
                      <td>{formatDate(row.payment_date)}</td>
                      <td>
                        {(() => {
                          const billPath = getValidBillPath(row.bill_url);
                          return billPath ? (
                            <button className="view-bill-btn" onClick={() => openImage(billPath)}>
                              <i className="ti ti-photo" /> View bill
                            </button>
                          ) : (
                            <button className="upload-btn" onClick={() => handleUploadBill(row.id)}>
                              Upload
                            </button>
                          );
                        })()}
                      </td>
                      <td>
                        <span className={`status-badge ${
                          row.status === "paid" ? "s-paid" : row.status === "pending" ? "s-pending" : "s-due"
                        }`}>
                          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <button className="edit-btn" onClick={() => openEdit(row)}>
                          <i className="ti ti-edit" /> Edit
                        </button>
                        <button className="delete-btn" onClick={() => handleDelete(row.id)}>
                          <i className="ti ti-trash" /> Delete
                        </button>
                      </td>
                    </tr>
                  )
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

          {viewImageUrl && (
            <div className="image-view-overlay" onClick={closeImage}>
              <div className="image-view-modal" onClick={(e) => e.stopPropagation()}>
                <button className="image-view-close" onClick={closeImage}>×</button>
                <img
                  src={viewImageUrl}
                  alt="Bill image"
                  onError={handleImageError}
                  onLoad={() => setImageLoadAttempted(false)}
                />
              </div>
            </div>
          )}

          <div className="acct-summary">
            <div className="metric-card">
              <div className="metric-label">Total billed</div>
              <div className="metric-value">
                ₹{Number(summary.total_billed).toLocaleString()}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Received</div>
              <div className="metric-value metric-value--green">
                ₹{Number(summary.received).toLocaleString()}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Pending</div>
              <div className="metric-value metric-value--red">
                ₹{Number(summary.pending).toLocaleString()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}