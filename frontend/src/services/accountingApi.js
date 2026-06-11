// src/services/accountingApi.js
import api from "./api";

// GET all entries
export const fetchAccountingLedger = async (outletId) => {
  const params = outletId ? { outletId: Number(outletId) } : {};
  const res = await api.get("/accounting", { params });
  return res.data;
};

// GET summary
export const fetchAccountingSummary = async (outletId) => {
  const params = outletId ? { outletId: Number(outletId) } : {};
  const res = await api.get("/accounting/summary", { params });
  return res.data;
};

// GET outlets list
export const fetchOutlets = async () => {
  const res = await api.get("/accounting/outlets");
  return res.data;
};

// GET single entry by ID
export const fetchLedgerEntry = async (id) => {
  const res = await api.get(`/accounting/${id}`);
  return res.data;
};

// POST new entry (with optional file)
export const createLedgerEntry = async (formData) => {
  const res = await api.post("/accounting", formData);
  return res.data;
};

// PUT update entry (with optional file)
export const updateLedgerEntry = async (id, formData) => {
  const res = await api.put(`/accounting/${id}`, formData);
  return res.data;
};

// DELETE entry
export const deleteLedgerEntry = async (id) => {
  const res = await api.delete(`/accounting/${id}`);
  return res.data;
};

// Upload bill file separately (for inline upload button in the table row)
// The backend now expects the uploaded file field to be `bill_url`.
export const uploadBillImage = async (id, file) => {
  const formData = new FormData();
  formData.append('bill_url', file);
  const res = await api.put(`/accounting/${id}/bill`, formData);
  return res.data;
};

const isValidBillPath = (path) => {
  if (!path) return false;
  const value = String(path).trim();
  return value !== '' && value.toLowerCase() !== 'null' && value.toLowerCase() !== 'undefined';
};

// Resolve a stored bill path to a full URL the browser can load
export const getBillImageUrl = (path) => {
  if (!isValidBillPath(path)) return null;
  let url = String(path).trim().replace(/\\/g, '/');
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `${window.location.protocol}${url}`;
  const apiOrigin = api.defaults.baseURL
    ? api.defaults.baseURL.replace(/\/api\/?$/, '')
    : window.location.origin;
  if (url.startsWith('/')) return `${apiOrigin}${url}`;
  return `${apiOrigin}/${url.replace(/^\/+/, '')}`;
};

// Record a payment date against an entry
export const recordPayment = async (id, paymentDate) => {
  const res = await api.put(`/accounting/${id}/payment`, { payment_date: paymentDate });
  return res.data;
};

// GET all entries for staff (enforces user's outlet_id in backend)
export const fetchStaffAccountingLedger = async () => {
  const res = await api.get("/staff-accounting");
  return res.data;
};

// GET summary for staff (enforces user's outlet_id in backend)
export const fetchStaffAccountingSummary = async () => {
  const res = await api.get("/staff-accounting/summary");
  return res.data;
};