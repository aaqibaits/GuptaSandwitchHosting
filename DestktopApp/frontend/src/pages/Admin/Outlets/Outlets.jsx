import React, { useState, useEffect } from "react";
import "./Outlets.css";
import * as api from "../../../services/outletApi";

// ── Screen definitions mirroring App.js ──────────────────────────────────
const ADMIN_SCREENS = [
  { key: "dashboard", label: "Dashboard", icon: "ti-layout-dashboard" },
  { key: "dishes", label: "Dishes", icon: "ti-tools-kitchen-2" },
  { key: "reports", label: "Reports", icon: "ti-chart-bar" },
  { key: "accounting", label: "Accounting", icon: "ti-calculator" },
  { key: "outlets", label: "Outlets", icon: "ti-building-store" },
];

const STAFF_SCREENS = [
  { key: "pos", label: "POS", icon: "ti-cash-register" },
  { key: "kot", label: "KOT", icon: "ti-clipboard-list" },
  { key: "reports", label: "Reports", icon: "ti-chart-bar" },
  { key: "live-orders", label: "Live Orders", icon: "ti-live-view" },
];

const PRESET_ROLES = [
  {
    label: "Manager",
    appRole: "Staff",
    description: "Full Staff access",
    permissions: { admin: [], staff: ["pos", "kot", "reports", "live-orders"] },
  },
  {
    label: "Cashier",
    appRole: "Staff",
    description: "POS + Live Orders",
    permissions: { admin: [], staff: ["pos", "live-orders"] },
  },
  {
    label: "Kitchen Staff",
    appRole: "Staff",
    description: "Kitchen (KOT) access",
    permissions: { admin: [], staff: ["kot"] },
  },
  {
    label: "Custom",
    appRole: "Staff",
    description: "Pick any screens",
    permissions: { admin: [], staff: [] },
  },
];

const INITIAL_OUTLETS = [
  {
    id: 1,
    name: "Koregaon Park",
    address: "Shop 12, Lane 5, Koregaon Park, Pune - 411001",
    phone: "9876543210",
    manager: "Ramesh Gupta",
    email: "kp@guptasandwich.in",
    username: "outlet_kp",
    password: "kp@1234",
    status: "active",
    users: [
      {
        id: 101,
        name: "Ankit Sharma",
        email: "ankit@guptasandwich.in",
        username: "ankit_kp",
        password: "ankit@123",
        roleLabel: "Cashier",
        appRole: "Staff",
        permissions: { admin: [], staff: ["pos", "live-orders"] },
        status: "active",
      },
    ],
  },
  {
    id: 2,
    name: "Baner",
    address: "Plot 8, Baner Road, Baner, Pune - 411045",
    phone: "9876543211",
    manager: "Suresh Sharma",
    email: "baner@guptasandwich.in",
    username: "outlet_baner",
    password: "baner@1234",
    status: "active",
    users: [],
  },
  {
    id: 3,
    name: "Kothrud",
    address: "Near Vanaz, Kothrud, Pune - 411038",
    phone: "9876543212",
    manager: "Dinesh Patil",
    email: "kothrud@guptasandwich.in",
    username: "outlet_kothrud",
    password: "kothrud@1234",
    status: "inactive",
    users: [],
  },
];

const BLANK_OUTLET_FORM = {
  name: "", address: "", phone: "", manager: "",
  email: "", username: "", password: "", confirmPassword: "", status: "active",
  access_token: "", swiggy_id: "", zomato_id: ""
};

const BLANK_USER_FORM = {
  name: "", email: "", username: "", password: "", confirmPassword: "",
  roleLabel: "Cashier", appRole: "Staff",
  permissions: { admin: [], staff: ["pos", "live-orders"] },
  status: "active",
};

export default function Outlets({ currentUser }) {
  const isSuperAdmin = currentUser?.is_super_admin || currentUser?.role === 'SUPER_ADMIN';
  const myOutletId = currentUser?.outlet_id || currentUser?.outletId;
  const [outlets, setOutlets] = useState([]);

  const displayedOutlets = outlets.filter((o) => {
    if (isSuperAdmin) return true;
    return o.id === myOutletId;
  });

  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    try {
      const result = await api.fetchOutlets();
      if (result.success) {
        setOutlets(result.data);
      } else {
        console.error("Error fetching outlets:", result.message);
      }
    } catch (err) {
      console.error("Error fetching outlets:", err);
    }
  };

  // Outlet modal state
  const [showAddOutlet, setShowAddOutlet] = useState(false);
  const [editOutlet, setEditOutlet] = useState(null);
  const [editOutletMode, setEditOutletMode] = useState("details");
  const [outletForm, setOutletForm] = useState(BLANK_OUTLET_FORM);
  const [outletErrors, setOutletErrors] = useState({});

  // User modal state
  const [userModalOutlet, setUserModalOutlet] = useState(null); // outlet whose users we're managing
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [userForm, setUserForm] = useState(BLANK_USER_FORM);
  const [userErrors, setUserErrors] = useState({});
  const [showPassMap, setShowPassMap] = useState({});

  const [successMsg, setSuccessMsg] = useState("");
  const [deleteOutletWarning, setDeleteOutletWarning] = useState(null);
  const [deleteUserWarning, setDeleteUserWarning] = useState(null);

  // ── helpers ──
  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };
  const togglePass = (k) => setShowPassMap(p => ({ ...p, [k]: !p[k] }));

  // ── Outlet handlers ──
  const handleOutletChange = (e) => {
    const { name, value } = e.target;
    setOutletForm(f => ({ ...f, [name]: value }));
    setOutletErrors(e => ({ ...e, [name]: "" }));
  };

  const validateOutlet = (isEdit = false) => {
    const errs = {};
    if (!outletForm.name.trim()) errs.name = "Required";
    if (!outletForm.address.trim()) errs.address = "Required";
    if (!outletForm.phone.trim()) errs.phone = "Required";
    if (!outletForm.manager.trim()) errs.manager = "Required";
    if (!outletForm.access_token || !outletForm.access_token.trim()) errs.access_token = "Required";
    if (!outletForm.username.trim()) errs.username = "Required";
    if (!isEdit || outletForm.password) {
      if (!outletForm.password) errs.password = "Required";
      else if (outletForm.password.length < 6) errs.password = "Min 6 chars";
      if (outletForm.password !== outletForm.confirmPassword) errs.confirmPassword = "Mismatch";
    }
    return errs;
  };

  const openAddOutlet = () => { setOutletForm(BLANK_OUTLET_FORM); setOutletErrors({}); setShowAddOutlet(true); };

  const handleAddOutlet = async () => {
    const errs = validateOutlet(false);
    if (Object.keys(errs).length) { setOutletErrors(errs); return; }
    try {
      const result = await api.addOutlet(outletForm);
      if (result.success) {
        setOutlets(o => [...o, result.data]);
        setShowAddOutlet(false);
        flash(`Outlet "${outletForm.name}" added!`);
      } else {
        flash(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      const errors = err.response?.data?.errors || {};
      if (Object.keys(errors).length > 0) {
        setOutletErrors(errors);
      } else {
        const errorMsg = err.response?.data?.message || "Failed to add outlet";
        setOutletErrors({ general: errorMsg });
      }
    }
  };

  const openEditOutlet = (outlet, mode = "details") => {
    setEditOutlet(outlet); setEditOutletMode(mode);
    setOutletForm({
      ...outlet,
      password: "",
      confirmPassword: "",
      access_token: outlet.access_token || "",
      swiggy_id: outlet.swiggy_id || "",
      zomato_id: outlet.zomato_id || ""
    });
    setOutletErrors({});
  };

  const handleEditOutletSave = async () => {
    const isCredOnly = editOutletMode === "credentials";
    const errs = {};
    if (!isCredOnly) {
      if (!outletForm.name.trim()) errs.name = "Required";
      if (!outletForm.address.trim()) errs.address = "Required";
      if (!outletForm.phone.trim()) errs.phone = "Required";
      if (!outletForm.manager.trim()) errs.manager = "Required";
      if (!outletForm.access_token || !outletForm.access_token.trim()) errs.access_token = "Required";
    }
    if (!outletForm.username.trim()) errs.username = "Required";
    if (outletForm.password) {
      if (outletForm.password.length < 6) errs.password = "Min 6 chars";
      if (outletForm.password !== outletForm.confirmPassword) errs.confirmPassword = "Mismatch";
    }
    if (Object.keys(errs).length) { setOutletErrors(errs); return; }

    try {
      const result = isCredOnly
        ? await api.updateOutletCredentials(editOutlet.id, outletForm)
        : await api.updateOutlet(editOutlet.id, outletForm);
      if (result.success) {
        setOutlets(prev => prev.map(o => o.id === editOutlet.id ? result.data : o));
        setEditOutlet(null);
        flash("Outlet updated!");
      } else {
        flash(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      const errors = err.response?.data?.errors || {};
      if (Object.keys(errors).length > 0) {
        setOutletErrors(errors);
      } else {
        const errorMsg = err.response?.data?.message || "Failed to update outlet";
        setOutletErrors({ general: errorMsg });
      }
    }
  };

  const toggleOutletStatus = async (id) => {
    const target = outlets.find(o => o.id === id);
    if (!target) return;
    const nextStatus = target.status === "active" ? "inactive" : "active";
    try {
      const result = await api.toggleOutletStatus(id, nextStatus);
      if (result.success) {
        setOutlets(prev => prev.map(o => o.id === id ? result.data : o));
        flash(`Outlet status updated to ${nextStatus}!`);
      } else {
        flash(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Failed to toggle status";
      flash(`Error: ${errorMsg}`);
    }
  };

  const requestDeleteOutlet = (outlet) => {
    setDeleteOutletWarning({
      id: outlet.id,
      name: outlet.name,
    });
  };

  const cancelDeleteOutlet = () => {
    setDeleteOutletWarning(null);
  };

  const handleDeleteOutlet = async () => {
    if (!deleteOutletWarning) return;
    const { id } = deleteOutletWarning;
    try {
      const result = await api.deleteOutlet(id);
      if (result.success) {
        setOutlets(o => o.filter(x => x.id !== id));
        flash("Outlet deleted.");
      } else {
        flash(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Failed to delete outlet";
      flash(`Error: ${errorMsg}`);
    } finally {
      setDeleteOutletWarning(null);
    }
  };

  // ── User handlers ──
  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserForm(f => ({ ...f, [name]: value }));
    setUserErrors(e => ({ ...e, [name]: "" }));
  };

  const applyPreset = (label) => {
    const preset = PRESET_ROLES.find(p => p.label === label);
    if (!preset) return;
    setUserForm(f => ({
      ...f,
      roleLabel: preset.label,
      appRole: preset.appRole,
      permissions: label === "Custom" ? { admin: [], staff: [] } : { ...preset.permissions },
    }));
  };

  const toggleScreen = (section, key) => {
    setUserForm(f => {
      const list = f.permissions[section];
      const updated = list.includes(key) ? list.filter(k => k !== key) : [...list, key];
      return { ...f, permissions: { ...f.permissions, [section]: updated } };
    });
  };

  const validateUser = (isEdit = false) => {
    const errs = {};
    if (!userForm.name.trim()) errs.name = "Required";
    if (!userForm.username.trim()) errs.username = "Required";
    if (!isEdit || userForm.password) {
      if (!userForm.password) errs.password = "Required";
      else if (userForm.password.length < 6) errs.password = "Min 6 chars";
      if (userForm.password !== userForm.confirmPassword) errs.confirmPassword = "Mismatch";
    }
    const hasAny = userForm.permissions.admin.length + userForm.permissions.staff.length > 0;
    if (!hasAny) errs.permissions = "Select at least one screen";
    return errs;
  };

  const openAddUser = (outlet) => {
    setUserModalOutlet(outlet);
    setUserForm(BLANK_USER_FORM);
    setUserErrors({});
    setShowAddUser(true);
  };

  const handleAddUser = async () => {
    const errs = validateUser(false);
    if (Object.keys(errs).length) { setUserErrors(errs); return; }
    try {
      const result = await api.addUser(userModalOutlet.id, userForm);
      if (result.success) {
        setOutlets(prev => prev.map(o => o.id === userModalOutlet.id ? { ...o, users: [...o.users, result.data] } : o));
        setShowAddUser(false);
        flash(`User "${userForm.name}" added to ${userModalOutlet.name}!`);
      } else {
        flash(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      const errors = err.response?.data?.errors || {};
      if (Object.keys(errors).length > 0) {
        setUserErrors(errors);
      } else {
        const errorMsg = err.response?.data?.message || "Failed to add user";
        setUserErrors({ general: errorMsg });
      }
    }
  };

  const openEditUser = (outlet, user) => {
    setUserModalOutlet(outlet);
    setEditUser(user);
    setUserForm({ ...user, password: "", confirmPassword: "" });
    setUserErrors({});
  };

  const handleEditUserSave = async () => {
    const errs = validateUser(true);
    if (Object.keys(errs).length) { setUserErrors(errs); return; }
    try {
      const result = await api.updateUser(userModalOutlet.id, editUser.id, userForm);
      if (result.success) {
        setOutlets(prev => prev.map(o => o.id === userModalOutlet.id
          ? { ...o, users: o.users.map(u => u.id === editUser.id ? result.data : u) }
          : o
        ));
        setEditUser(null);
        flash("User updated!");
      } else {
        flash(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      const errors = err.response?.data?.errors || {};
      if (Object.keys(errors).length > 0) {
        setUserErrors(errors);
      } else {
        const errorMsg = err.response?.data?.message || "Failed to update user";
        setUserErrors({ general: errorMsg });
      }
    }
  };

  const toggleUserStatus = async (outletId, userId) => {
    const outlet = outlets.find(o => o.id === outletId);
    if (!outlet) return;
    const user = outlet.users.find(u => u.id === userId);
    if (!user) return;
    const nextStatus = user.status === "active" ? "inactive" : "active";

    try {
      const result = await api.toggleUserStatus(outletId, userId, nextStatus);
      if (result.success) {
        setOutlets(prev => prev.map(o => o.id === outletId
          ? { ...o, users: o.users.map(u => u.id === userId ? result.data : u) }
          : o
        ));
        flash(`User status updated to ${nextStatus}!`);
      } else {
        flash(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Failed to toggle status";
      flash(`Error: ${errorMsg}`);
    }
  };

  const requestDeleteUser = (outletId, user) => {
    setDeleteUserWarning({
      outletId,
      userId: user.id,
      name: user.name,
    });
  };

  const cancelDeleteUser = () => {
    setDeleteUserWarning(null);
  };

  const handleDeleteUser = async () => {
    if (!deleteUserWarning) return;
    const { outletId, userId } = deleteUserWarning;
    try {
      const result = await api.deleteUser(outletId, userId);
      if (result.success) {
        setOutlets(prev => prev.map(o => o.id === outletId ? { ...o, users: o.users.filter(u => u.id !== userId) } : o));
        flash("User deleted.");
      } else {
        flash(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Failed to delete user";
      flash(`Error: ${errorMsg}`);
    } finally {
      setDeleteUserWarning(null);
    }
  };

  const getDisplayScreens = (u) => {
    const role = String(u.roleLabel || '').trim().toLowerCase();
    if (role === 'manager') return 'Full Access';
    if (role === 'cashier') return 'POS, Live Orders';
    if (role === 'kitchen staff') return 'KOT';
    
    const screens = [...(u.permissions?.admin || []), ...(u.permissions?.staff || [])];
    const screenMapping = {
      'pos': 'POS',
      'kot': 'KOT',
      'reports': 'Reports',
      'live-orders': 'Live Orders',
      'dashboard': 'Dashboard',
      'dishes': 'Dishes',
      'accounting': 'Accounting',
      'outlets': 'Outlets'
    };
    return screens.map(key => screenMapping[key] || key).join(', ') || '—';
  };

  const isCustom = userForm.roleLabel === "Custom";
  const activeUserModal = showAddUser || !!editUser;
  const activeUserForm = userForm;

  return (
    <div className="outlets">
      {/* Top bar */}
      <div className="outlets-header">
        <div className="outlets-header-left">
          <div className="outlets-title">Outlets</div>
          <div className="outlets-count">{displayedOutlets.length} total</div>
        </div>
        {isSuperAdmin && (
          <button className="add-btn" onClick={openAddOutlet}>
            <i className="ti ti-plus" /> Add outlet
          </button>
        )}
      </div>

      {successMsg && (
        <div className="success-banner">
          <i className="ti ti-circle-check" /> {successMsg}
        </div>
      )}

      {/* Outlet cards */}
      <div className="outlets-grid">
        {displayedOutlets.map((o) => (
          <div key={o.id} className={`outlet-card ${o.status === "inactive" ? "outlet-card--inactive" : ""}`}>
            <div className="outlet-card-header">
              <div>
                <div className="outlet-name">{o.name}</div>
                <div className="outlet-manager"><i className="ti ti-user" /> {o.manager}</div>
              </div>
              <span className={`status-dot ${o.status === "active" ? "status-dot--active" : "status-dot--inactive"}`}>
                {o.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="outlet-detail"><i className="ti ti-map-pin" /><span>{o.address}</span></div>
            <div className="outlet-detail"><i className="ti ti-phone" /><span>{o.phone}</span></div>
            {o.email && <div className="outlet-detail"><i className="ti ti-mail" /><span>{o.email}</span></div>}
            <div className="outlet-detail"><i className="ti ti-user-circle" /><span className="outlet-username">{o.username}</span></div>

            {/* ── Users section ── */}
            <div className="users-section">
              <div className="users-section-header">
                <span className="users-section-title">
                  <i className="ti ti-users" /> Staff Users
                  <span className="users-badge">{o.users.length}</span>
                </span>
                <button className="add-user-btn" onClick={() => openAddUser(o)}>
                  <i className="ti ti-user-plus" /> Add user
                </button>
              </div>

              {o.users.length === 0 ? (
                <div className="no-users">No users added yet</div>
              ) : (
                <div className="users-list">
                  {o.users.map(u => (
                    <div key={u.id} className={`user-row ${u.status === "inactive" ? "user-row--inactive" : ""}`}>
                      <div className="user-avatar">{u.name.charAt(0)}</div>
                      <div className="user-info">
                        <div className="user-name">{u.name}</div>
                        <div className="user-meta">
                          <span className={`role-chip role-chip--${u.appRole.toLowerCase()}`}>{u.roleLabel}</span>
                          <span className="user-screens">
                            {getDisplayScreens(u)}
                          </span>
                        </div>
                      </div>
                      <div className="user-row-actions">
                        <button className="icon-btn" title="Edit" onClick={() => openEditUser(o, u)}><i className="ti ti-edit" /></button>
                        <button
                          className={`icon-btn ${u.status === "active" ? "icon-btn--warn" : "icon-btn--success"}`}
                          title={u.status === "active" ? "Deactivate" : "Activate"}
                          onClick={() => toggleUserStatus(o.id, u.id)}
                        >
                          <i className={`ti ${u.status === "active" ? "ti-player-pause" : "ti-player-play"}`} />
                        </button>
                        <button className="icon-btn icon-btn--danger" title="Delete" onClick={() => requestDeleteUser(o.id, u)}><i className="ti ti-trash" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isSuperAdmin && (
              <div className="outlet-actions">
                <button className="outline-btn" onClick={() => openEditOutlet(o, "details")}><i className="ti ti-edit" /> Edit details</button>
                <button className="outline-btn" onClick={() => openEditOutlet(o, "platform")}><i className="ti ti-settings" /> Platform setup</button>
                <button className="outline-btn" onClick={() => openEditOutlet(o, "credentials")}><i className="ti ti-lock" /> Credentials</button>
                <button
                  className={`outline-btn ${o.status === "active" ? "outline-btn--warn" : "outline-btn--success"}`}
                  onClick={() => toggleOutletStatus(o.id)}
                >
                  <i className={`ti ${o.status === "active" ? "ti-player-pause" : "ti-player-play"}`} />
                  {o.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <button className="outline-btn outline-btn--danger" onClick={() => requestDeleteOutlet(o)}><i className="ti ti-trash" /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── ADD OUTLET MODAL ── */}
      {showAddOutlet && (
        <div className="modal-bg" onClick={(e) => e.target.className === "modal-bg" && setShowAddOutlet(false)}>
          <div className="modal">
            <div className="modal-title">Add New Outlet</div>
            <button className="modal-close" onClick={() => setShowAddOutlet(false)}><i className="ti ti-x" /></button>

            {outletErrors.general && (
              <div className="form-error-banner" style={{ padding: '8px 12px', background: '#ffebeb', color: '#d93025', borderRadius: '4px', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-alert-circle" /> {outletErrors.general}
              </div>
            )}

            <div className="modal-section-label">Outlet details</div>
            <div className="form-row">
              <label className="form-label">Outlet name *</label>
              <input className={`form-input ${outletErrors.name ? "form-input--error" : ""}`} name="name" value={outletForm.name} onChange={handleOutletChange} placeholder="e.g. Koregaon Park" />
              {outletErrors.name && <div className="form-error">{outletErrors.name}</div>}
            </div>
            <div className="form-row">
              <label className="form-label">Address *</label>
              <textarea className={`form-input form-textarea ${outletErrors.address ? "form-input--error" : ""}`} name="address" value={outletForm.address} onChange={handleOutletChange} placeholder="Full address with pin code" />
              {outletErrors.address && <div className="form-error">{outletErrors.address}</div>}
            </div>
            <div className="two-inputs">
              <div className="form-row">
                <label className="form-label">Phone *</label>
                <input className={`form-input ${outletErrors.phone ? "form-input--error" : ""}`} name="phone" value={outletForm.phone} onChange={handleOutletChange} placeholder="10-digit number" />
                {outletErrors.phone && <div className="form-error">{outletErrors.phone}</div>}
              </div>
              <div className="form-row">
                <label className="form-label">Manager name *</label>
                <input className={`form-input ${outletErrors.manager ? "form-input--error" : ""}`} name="manager" value={outletForm.manager} onChange={handleOutletChange} placeholder="Full name" />
                {outletErrors.manager && <div className="form-error">{outletErrors.manager}</div>}
              </div>
            </div>
            <div className="form-row">
              <label className="form-label">Email</label>
              <input className={`form-input ${outletErrors.email ? "form-input--error" : ""}`} name="email" value={outletForm.email} onChange={handleOutletChange} placeholder="outlet@guptasandwich.in" />
              {outletErrors.email && <div className="form-error">{outletErrors.email}</div>}
            </div>
            <div className="form-row">
              <label className="form-label">Status</label>
              <select className="form-input" name="status" value={outletForm.status} onChange={handleOutletChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="modal-section-label" style={{ marginTop: 8 }}>Platform setup</div>
            <div className="form-row">
              <label className="form-label">Access Token *</label>
              <input className={`form-input ${outletErrors.access_token ? "form-input--error" : ""}`} name="access_token" value={outletForm.access_token || ""} onChange={handleOutletChange} placeholder="Enter Access Token" />
              {outletErrors.access_token && <div className="form-error">{outletErrors.access_token}</div>}
            </div>
            <div className="two-inputs">
              <div className="form-row">
                <label className="form-label">Swiggy ID</label>
                <input className={`form-input ${outletErrors.swiggy_id ? "form-input--error" : ""}`} name="swiggy_id" value={outletForm.swiggy_id || ""} onChange={handleOutletChange} placeholder="Swiggy Outlet ID" />
                {outletErrors.swiggy_id && <div className="form-error">{outletErrors.swiggy_id}</div>}
              </div>
              <div className="form-row">
                <label className="form-label">Zomato ID</label>
                <input className={`form-input ${outletErrors.zomato_id ? "form-input--error" : ""}`} name="zomato_id" value={outletForm.zomato_id || ""} onChange={handleOutletChange} placeholder="Zomato Outlet ID" />
                {outletErrors.zomato_id && <div className="form-error">{outletErrors.zomato_id}</div>}
              </div>
            </div>
            <div className="modal-section-label" style={{ marginTop: 8 }}>Login credentials</div>
            <div className="form-row">
              <label className="form-label">Username / ID *</label>
              <input className={`form-input ${outletErrors.username ? "form-input--error" : ""}`} name="username" value={outletForm.username} onChange={handleOutletChange} placeholder="e.g. outlet_kp" />
              {outletErrors.username && <div className="form-error">{outletErrors.username}</div>}
            </div>
            <div className="two-inputs">
              <div className="form-row">
                <label className="form-label">Password *</label>
                <div className="pass-wrap">
                  <input className={`form-input ${outletErrors.password ? "form-input--error" : ""}`} name="password" type={showPassMap.oAdd ? "text" : "password"} value={outletForm.password} onChange={handleOutletChange} placeholder="Min 6 characters" />
                  <button className="pass-toggle" onClick={() => togglePass("oAdd")}><i className={`ti ${showPassMap.oAdd ? "ti-eye-off" : "ti-eye"}`} /></button>
                </div>
                {outletErrors.password && <div className="form-error">{outletErrors.password}</div>}
              </div>
              <div className="form-row">
                <label className="form-label">Confirm password *</label>
                <div className="pass-wrap">
                  <input className={`form-input ${outletErrors.confirmPassword ? "form-input--error" : ""}`} name="confirmPassword" type={showPassMap.oAddC ? "text" : "password"} value={outletForm.confirmPassword} onChange={handleOutletChange} placeholder="Re-enter password" />
                  <button className="pass-toggle" onClick={() => togglePass("oAddC")}><i className={`ti ${showPassMap.oAddC ? "ti-eye-off" : "ti-eye"}`} /></button>
                </div>
                {outletErrors.confirmPassword && <div className="form-error">{outletErrors.confirmPassword}</div>}
              </div>
            </div>
            <button className="submit-btn" onClick={handleAddOutlet}>Add Outlet</button>
          </div>
        </div>
      )}

      {/* ── EDIT OUTLET MODAL ── */}
      {editOutlet && (
        <div className="modal-bg" onClick={(e) => e.target.className === "modal-bg" && setEditOutlet(null)}>
          <div className="modal">
            <div className="modal-title">{editOutletMode === "credentials" ? "Update credentials" : "Edit outlet"} — {editOutlet.name}</div>
            <button className="modal-close" onClick={() => setEditOutlet(null)}><i className="ti ti-x" /></button>

            {outletErrors.general && (
              <div className="form-error-banner" style={{ padding: '8px 12px', background: '#ffebeb', color: '#d93025', borderRadius: '4px', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-alert-circle" /> {outletErrors.general}
              </div>
            )}

            <div className="edit-mode-row">
              <button className={`mode-btn ${editOutletMode === "details" ? "mode-btn--active" : ""}`} onClick={() => setEditOutletMode("details")}><i className="ti ti-building-store" /> Outlet details</button>
              <button className={`mode-btn ${editOutletMode === "platform" ? "mode-btn--active" : ""}`} onClick={() => setEditOutletMode("platform")}><i className="ti ti-settings" /> Platform setup</button>
              <button className={`mode-btn ${editOutletMode === "credentials" ? "mode-btn--active" : ""}`} onClick={() => setEditOutletMode("credentials")}><i className="ti ti-lock" /> Login credentials</button>
            </div>
            {editOutletMode === "details" && (
              <>
                <div className="form-row">
                  <label className="form-label">Outlet name *</label>
                  <input className={`form-input ${outletErrors.name ? "form-input--error" : ""}`} name="name" value={outletForm.name} onChange={handleOutletChange} />
                  {outletErrors.name && <div className="form-error">{outletErrors.name}</div>}
                </div>
                <div className="form-row">
                  <label className="form-label">Address *</label>
                  <textarea className={`form-input form-textarea ${outletErrors.address ? "form-input--error" : ""}`} name="address" value={outletForm.address} onChange={handleOutletChange} />
                  {outletErrors.address && <div className="form-error">{outletErrors.address}</div>}
                </div>
                <div className="two-inputs">
                  <div className="form-row">
                    <label className="form-label">Phone *</label>
                    <input className={`form-input ${outletErrors.phone ? "form-input--error" : ""}`} name="phone" value={outletForm.phone} onChange={handleOutletChange} />
                    {outletErrors.phone && <div className="form-error">{outletErrors.phone}</div>}
                  </div>
                  <div className="form-row">
                    <label className="form-label">Manager name *</label>
                    <input className={`form-input ${outletErrors.manager ? "form-input--error" : ""}`} name="manager" value={outletForm.manager} onChange={handleOutletChange} />
                    {outletErrors.manager && <div className="form-error">{outletErrors.manager}</div>}
                  </div>
                </div>
                <div className="form-row">
                  <label className="form-label">Email</label>
                  <input className={`form-input ${outletErrors.email ? "form-input--error" : ""}`} name="email" value={outletForm.email} onChange={handleOutletChange} />
                  {outletErrors.email && <div className="form-error">{outletErrors.email}</div>}
                </div>
                <div className="form-row"><label className="form-label">Status</label><select className="form-input" name="status" value={outletForm.status} onChange={handleOutletChange}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              </>
            )}
            {editOutletMode === "platform" && (
              <>
                <div className="form-row">
                  <label className="form-label">Access Token *</label>
                  <input className={`form-input ${outletErrors.access_token ? "form-input--error" : ""}`} name="access_token" value={outletForm.access_token || ""} onChange={handleOutletChange} placeholder="Enter Access Token" />
                  {outletErrors.access_token && <div className="form-error">{outletErrors.access_token}</div>}
                </div>
                <div className="two-inputs">
                  <div className="form-row">
                    <label className="form-label">Swiggy ID</label>
                    <input className={`form-input ${outletErrors.swiggy_id ? "form-input--error" : ""}`} name="swiggy_id" value={outletForm.swiggy_id || ""} onChange={handleOutletChange} placeholder="Swiggy Outlet ID" />
                    {outletErrors.swiggy_id && <div className="form-error">{outletErrors.swiggy_id}</div>}
                  </div>
                  <div className="form-row">
                    <label className="form-label">Zomato ID</label>
                    <input className={`form-input ${outletErrors.zomato_id ? "form-input--error" : ""}`} name="zomato_id" value={outletForm.zomato_id || ""} onChange={handleOutletChange} placeholder="Zomato Outlet ID" />
                    {outletErrors.zomato_id && <div className="form-error">{outletErrors.zomato_id}</div>}
                  </div>
                </div>
              </>
            )}
            {editOutletMode === "credentials" && (
              <>
                <div className="cred-info"><i className="ti ti-info-circle" /> Leave password blank to keep existing password unchanged.</div>
                <div className="form-row"><label className="form-label">Username / ID *</label><input className={`form-input ${outletErrors.username ? "form-input--error" : ""}`} name="username" value={outletForm.username} onChange={handleOutletChange} />{outletErrors.username && <div className="form-error">{outletErrors.username}</div>}</div>
                <div className="two-inputs">
                  <div className="form-row">
                    <label className="form-label">New password</label>
                    <div className="pass-wrap">
                      <input className={`form-input ${outletErrors.password ? "form-input--error" : ""}`} name="password" type={showPassMap.oEdit ? "text" : "password"} value={outletForm.password} onChange={handleOutletChange} placeholder="Leave blank to keep" />
                      <button className="pass-toggle" onClick={() => togglePass("oEdit")}><i className={`ti ${showPassMap.oEdit ? "ti-eye-off" : "ti-eye"}`} /></button>
                    </div>
                    {outletErrors.password && <div className="form-error">{outletErrors.password}</div>}
                  </div>
                  <div className="form-row">
                    <label className="form-label">Confirm new password</label>
                    <div className="pass-wrap">
                      <input className={`form-input ${outletErrors.confirmPassword ? "form-input--error" : ""}`} name="confirmPassword" type={showPassMap.oEditC ? "text" : "password"} value={outletForm.confirmPassword} onChange={handleOutletChange} placeholder="Re-enter new password" />
                      <button className="pass-toggle" onClick={() => togglePass("oEditC")}><i className={`ti ${showPassMap.oEditC ? "ti-eye-off" : "ti-eye"}`} /></button>
                    </div>
                    {outletErrors.confirmPassword && <div className="form-error">{outletErrors.confirmPassword}</div>}
                  </div>
                </div>
              </>
            )}
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setEditOutlet(null)}>Cancel</button>
              <button className="submit-btn submit-btn--inline" onClick={handleEditOutletSave}>Save changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT USER MODAL ── */}
      {activeUserModal && (
        <div className="modal-bg" onClick={(e) => { if (e.target.className === "modal-bg") { setShowAddUser(false); setEditUser(null); } }}>
          <div className="modal modal--wide">
            <div className="modal-title">
              {editUser ? `Edit user — ${editUser.name}` : `Add user to ${userModalOutlet?.name}`}
            </div>
            <button className="modal-close" onClick={() => { setShowAddUser(false); setEditUser(null); }}><i className="ti ti-x" /></button>

            {userErrors.general && (
              <div className="form-error-banner" style={{ padding: '8px 12px', background: '#ffebeb', color: '#d93025', borderRadius: '4px', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-alert-circle" /> {userErrors.general}
              </div>
            )}

            {/* Basic info */}
            <div className="modal-section-label">User details</div>
            <div className="two-inputs">
              <div className="form-row">
                <label className="form-label">Full name *</label>
                <input className={`form-input ${userErrors.name ? "form-input--error" : ""}`} name="name" value={userForm.name} onChange={handleUserChange} placeholder="e.g. Ankit Sharma" />
                {userErrors.name && <div className="form-error">{userErrors.name}</div>}
              </div>
              <div className="form-row">
                <label className="form-label">Email</label>
                <input className={`form-input ${userErrors.email ? "form-input--error" : ""}`} name="email" value={userForm.email} onChange={handleUserChange} placeholder="user@guptasandwich.in" />
                {userErrors.email && <div className="form-error">{userErrors.email}</div>}
              </div>
            </div>

            <div className="two-inputs">
              <div className="form-row">
                <label className="form-label">Username *</label>
                <input className={`form-input ${userErrors.username ? "form-input--error" : ""}`} name="username" value={userForm.username} onChange={handleUserChange} placeholder="e.g. ankit_kp" />
                {userErrors.username && <div className="form-error">{userErrors.username}</div>}
              </div>
              <div className="form-row">
                <label className="form-label">Status</label>
                <select className="form-input" name="status" value={userForm.status} onChange={handleUserChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {editUser && (
              <div className="cred-info"><i className="ti ti-info-circle" /> Leave password blank to keep existing password unchanged.</div>
            )}

            <div className="two-inputs">
              <div className="form-row">
                <label className="form-label">{editUser ? "New password" : "Password *"}</label>
                <div className="pass-wrap">
                  <input className={`form-input ${userErrors.password ? "form-input--error" : ""}`} name="password" type={showPassMap.uPass ? "text" : "password"} value={userForm.password} onChange={handleUserChange} placeholder={editUser ? "Leave blank to keep" : "Min 6 characters"} />
                  <button className="pass-toggle" onClick={() => togglePass("uPass")}><i className={`ti ${showPassMap.uPass ? "ti-eye-off" : "ti-eye"}`} /></button>
                </div>
                {userErrors.password && <div className="form-error">{userErrors.password}</div>}
              </div>
              <div className="form-row">
                <label className="form-label">{editUser ? "Confirm new password" : "Confirm password *"}</label>
                <div className="pass-wrap">
                  <input className={`form-input ${userErrors.confirmPassword ? "form-input--error" : ""}`} name="confirmPassword" type={showPassMap.uConf ? "text" : "password"} value={userForm.confirmPassword} onChange={handleUserChange} placeholder="Re-enter password" />
                  <button className="pass-toggle" onClick={() => togglePass("uConf")}><i className={`ti ${showPassMap.uConf ? "ti-eye-off" : "ti-eye"}`} /></button>
                </div>
                {userErrors.confirmPassword && <div className="form-error">{userErrors.confirmPassword}</div>}
              </div>
            </div>

            {/* Role & permissions */}
            <div className="modal-section-label" style={{ marginTop: 12 }}>Role & Screen Access</div>

            {/* Preset role picker */}
            <div className="preset-roles">
              {PRESET_ROLES.map(p => (
                <button
                  key={p.label}
                  className={`preset-role-btn ${userForm.roleLabel === p.label ? "preset-role-btn--active" : ""}`}
                  onClick={() => applyPreset(p.label)}
                >
                  <span className="preset-role-name">{p.label}</span>
                  <span className="preset-role-desc">{p.description}</span>
                </button>
              ))}
            </div>

            {/* Screen permission grid */}
            <div className="permissions-grid">
              {/* Admin screens */}
              <div className="perm-group">
                <div className="perm-group-label">
                  <i className="ti ti-shield-lock" /> Admin Screens
                </div>
                <div className="perm-screens">
                  {ADMIN_SCREENS.map(s => {
                    const checked = userForm.permissions.admin.includes(s.key);
                    return (
                      <label key={s.key} className={`perm-screen ${checked ? "perm-screen--on" : ""} ${!isCustom ? "perm-screen--locked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => isCustom && toggleScreen("admin", s.key)}
                          disabled={!isCustom}
                        />
                        <i className={`ti ${s.icon}`} />
                        <span>{s.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Staff screens */}
              <div className="perm-group">
                <div className="perm-group-label">
                  <i className="ti ti-device-desktop" /> Staff Screens
                </div>
                <div className="perm-screens">
                  {STAFF_SCREENS.map(s => {
                    const checked = userForm.permissions.staff.includes(s.key);
                    return (
                      <label key={s.key} className={`perm-screen ${checked ? "perm-screen--on" : ""} ${!isCustom ? "perm-screen--locked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => isCustom && toggleScreen("staff", s.key)}
                          disabled={!isCustom}
                        />
                        <i className={`ti ${s.icon}`} />
                        <span>{s.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {userErrors.permissions && (
              <div className="form-error" style={{ marginTop: 6 }}>{userErrors.permissions}</div>
            )}

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => { setShowAddUser(false); setEditUser(null); }}>Cancel</button>
              <button className="submit-btn submit-btn--inline" onClick={editUser ? handleEditUserSave : handleAddUser}>
                {editUser ? "Save changes" : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteOutletWarning && (
        <div className="delete-warning-overlay">
          <div className="delete-warning-toast">
            <div className="delete-warning-toast__icon">⚠️</div>
            <h3 className="delete-warning-toast__title" style={{ marginBottom: 16 }}>Delete the outlet?</h3>
            <div className="delete-warning-toast__actions">
              <button className="delete-warning-toast__cancel" onClick={cancelDeleteOutlet}>Cancel</button>
              <button className="delete-warning-toast__confirm" onClick={handleDeleteOutlet}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {deleteUserWarning && (
        <div className="delete-warning-overlay">
          <div className="delete-warning-toast">
            <div className="delete-warning-toast__icon">⚠️</div>
            <h3 className="delete-warning-toast__title" style={{ marginBottom: 16 }}>
              Delete user <strong>{deleteUserWarning.name}</strong>?
            </h3>
            <div className="delete-warning-toast__actions">
              <button className="delete-warning-toast__cancel" onClick={cancelDeleteUser}>Cancel</button>
              <button className="delete-warning-toast__confirm" onClick={handleDeleteUser}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}