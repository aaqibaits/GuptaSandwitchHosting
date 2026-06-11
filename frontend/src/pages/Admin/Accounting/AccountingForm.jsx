// ✅ FIX: Removed `useNavigate` and `useParams` from React Router.
//    The rest of the app doesn't use React Router — navigation is driven by
//    `staffActivePage` state in App.jsx. Calling these hooks outside a <Router>
//    throws an error at runtime.
//
//    Instead, this component now accepts two props:
//      • id         — the entry ID when editing (null/undefined for "create" mode)
//      • onNavigate — callback to switch back to the ledger list: onNavigate('list')
import React, { useState, useEffect } from "react";
import {
  fetchOutlets,
  fetchLedgerEntry,
  createLedgerEntry,
  updateLedgerEntry,
  getBillImageUrl,
} from "../../../services/accountingApi";
import "./AccountingForm.css";

export default function AccountingForm({ id, onNavigate }) {
  const isEdit = !!id;

  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    outlet_id: "",
    transaction_id: "",
    amount: "",
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: "",
    payment_date: "",
    status: "pending",
  });
  const [existingBillUrl, setExistingBillUrl] = useState("");
  const [billFile, setBillFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Cleanup object URL on unmount to avoid memory leak
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const normalizeImageUrl = (url) => getBillImageUrl(url);

  useEffect(() => {
    const loadOutlets = async () => {
      try {
        const res = await fetchOutlets();
        if (res.success) setOutlets(res.data);
      } catch (err) {
        console.error("Failed to load outlets", err);
      }
    };
    loadOutlets();

    if (isEdit) {
      const loadEntry = async () => {
        setLoading(true);
        try {
          const res = await fetchLedgerEntry(id);
          if (res.success) {
            const entry = res.data;
            setFormData({
              outlet_id: entry.outlet_id,
              transaction_id: entry.transaction_id,
              amount: entry.amount,
              order_date: entry.order_date.split('T')[0],
              delivery_date: entry.delivery_date ? entry.delivery_date.split('T')[0] : "",
              payment_date: entry.payment_date ? entry.payment_date.split('T')[0] : "",
              status: entry.status,
            });
            const url = normalizeImageUrl(entry.bill_url);
            if (url) setExistingBillUrl(url);
          }
        } catch (err) {
          console.error("Failed to load entry", err);
        } finally {
          setLoading(false);
        }
      };
      loadEntry();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "bill_url") {
      const file = files[0];
      setBillFile(file);
      if (file) {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(URL.createObjectURL(file));
      } else {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("outlet_id", formData.outlet_id);
      payload.append("transaction_id", formData.transaction_id);
      payload.append("amount", formData.amount);
      payload.append("order_date", formData.order_date);
      if (formData.delivery_date) payload.append("delivery_date", formData.delivery_date);
      if (formData.payment_date) payload.append("payment_date", formData.payment_date);
      payload.append("status", formData.status);
      if (billFile) payload.append("bill_url", billFile);

      let res;
      if (isEdit) {
        res = await updateLedgerEntry(id, payload);
      } else {
        res = await createLedgerEntry(payload);
      }

      if (res.success) {
        // ✅ FIX: was navigate("/admin/accounting") — now calls the prop callback
        onNavigate('list');
      } else {
        alert("Error: " + res.message);
      }
    } catch (err) {
      console.error("Submit error", err);
      alert("Failed to save entry");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="accounting-form-container">
      <div className="form-header">
        <h2>{isEdit ? "Edit Accounting Entry" : "Add New Accounting Entry"}</h2>
        {/* ✅ FIX: was navigate("/admin/accounting") */}
        <button className="modal-close" type="button" onClick={() => onNavigate('list')}>×</button>
      </div>
      <form onSubmit={handleSubmit} className="accounting-form">
        <div className="form-row">
          <div className="form-group">
            <label>Outlet *</label>
            <select name="outlet_id" value={formData.outlet_id} onChange={handleChange} required>
              <option value="">Select outlet</option>
              {outlets.map(outlet => (
                <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Transaction ID *</label>
            <input
              type="text"
              name="transaction_id"
              value={formData.transaction_id}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group wide">
            <label>Amount (₹) *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Order Date *</label>
            <input
              type="date"
              name="order_date"
              value={formData.order_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Delivery Date</label>
            <input
              type="date"
              name="delivery_date"
              value={formData.delivery_date}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Payment Date</label>
            <input
              type="date"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="pending">Pending</option>
              <option value="due">Due</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group wide">
            <label>Bill</label>
            <input type="file" name="bill_url" accept="image/*" onChange={handleChange} />
            {imagePreview ? (
              <div className="existing-bill">
                <div className="image-preview">
                  <img src={imagePreview} alt="preview" />
                </div>
              </div>
            ) : existingBillUrl ? (
              <div className="existing-bill">
                <a href={existingBillUrl} target="_blank" rel="noopener noreferrer">
                  View current bill
                </a>
                <div className="image-preview--small">
                  <img src={existingBillUrl} alt="current bill" />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="form-actions">
          {/* ✅ FIX: was navigate("/admin/accounting") */}
          <button type="button" onClick={() => onNavigate('list')}>Cancel</button>
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? "Saving..." : (isEdit ? "Update" : "Add entry")}
          </button>
        </div>
      </form>
    </div>
  );
}
