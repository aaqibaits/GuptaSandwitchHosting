// components/AdminSidebar/AdminSidebar.js
import React from "react";
import "./AdminSidebar.css";

const NAV_ITEMS = [
  { page: "dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },
  { page: "dishes",    icon: "ti-soup",              label: "Dishes" },
  { page: "reports",   icon: "ti-chart-bar",         label: "Reports" },
  { page: "accounting",icon: "ti-receipt",           label: "Accounting" },
  { page: "outlets",   icon: "ti-location-pin",      label: "Outlets" },
];

export default function Sidebar({ currentPage, setCurrentPage, onLogout, currentUser }) {
  const isSuperAdmin = currentUser?.is_super_admin || currentUser?.role === 'SUPER_ADMIN';
  const allowedItems = NAV_ITEMS.filter(item => {
    if (isSuperAdmin) return true;
    if (!currentUser?.permissions?.admin) return true;
    return currentUser.permissions.admin.includes(item.page);
  });

  return (
    <aside className="sidebar1">
      <div className="sb-brand1">
        <div className="sb-brand-name1">🥪 Gupta Sandwich</div>
        <div className="sb-brand-sub1">Admin Panel</div>
      </div>

      <nav className="sb-nav1">
        <div className="sb-nav-label1">MAIN</div>
        {allowedItems.map(({ page, icon, label }) => (
          <div
            key={page}
            className={`nav-item1 ${currentPage === page ? "active" : ""}`}
            onClick={() => setCurrentPage(page)}
          >
            <i className={`ti ${icon}`} />
            {label}
          </div>
        ))}
      </nav>

      <div className="sb-foot1">
        <div className="role-pill1">
          <span>{currentUser?.role_label || currentUser?.role || 'Admin'}</span>
          <small>{isSuperAdmin ? 'All outlets access' : 'Single outlet access'}</small>
        </div>
        
        {/* Logout Button */}
        <button className="logout-btn1" onClick={onLogout}>
          <i className="ti-power-off"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}