// components/Sidebar/Sidebar.js
import React from 'react';
import './Sidebar.css';

const Sidebar = ({ activePage, setActivePage, currentUser, onLogout }) => {
  const navItems = [
    { id: 'pos',         icon: 'ti-layout-grid',      label: 'POS' }, // was 'POS / Tables'
    { id: 'live-orders', icon: 'ti-shopping-cart',     label: 'Live Orders' },
    { id: 'kot',         icon: 'ti-tools-kitchen-2',   label: 'Kitchen (KOT)' },
    { id: 'reports',     icon: 'ti-chart-bar',         label: 'Reports' },
    { id: 'accounting',  icon: 'ti-receipt',           label: 'Accounting' },
    // { id: 'customers',   icon: 'ti-users',             label: 'Customers' },
    // { id: 'inventory',   icon: 'ti-package',           label: 'Inventory' },
  ].filter(item => {
    // Role-based hard limits
    if (currentUser?.role_label === 'Cashier') {
      return item.id === 'pos' || item.id === 'live-orders' || item.id === 'accounting';
    }
    if (currentUser?.role_label === 'Kitchen Staff') {
      return item.id === 'kot';
    }
    
    // Manager and Admin fallback
    if (currentUser?.role_label === 'Manager' || currentUser?.app_role === 'Admin') return true;
    if (!currentUser?.permissions?.staff) return true;
    return currentUser.permissions.staff.includes(item.id);
  });

  return (
    <div className="sidebar">
      {/* Logo */}
      {/* <div className="logo-box">S</div> */}

      {/* Main nav */}
      {navItems.map(item => (
        <div
          key={item.id}
          className={`nav-item ${activePage === item.id ? 'active' : ''}`}
          onClick={() => setActivePage(item.id)}
        >
          <i className={`ti ${item.icon}`}></i>
          <div className="tip">{item.label}</div>
        </div>
      ))}

      <div className="sidebar-sep"></div>

      {/* Bottom icons */}
      {/* <div className="sidebar-bottom">
        <div className="nav-item">
          <i className="ti ti-bell"></i>
          <div className="tip">Notifications</div>
        </div>
        <div className="nav-item">
          <i className="ti ti-settings"></i>
          <div className="tip">Settings</div>
        </div> 
        <div className="nav-item">
          <i className="ti ti-user-circle"></i>
          <div className="tip">Profile</div>
        </div>
      </div> */}

      {/* ── User + Logout ── */}
      <div className="sidebar-footer">
        {/* Avatar with tooltip showing email */}
        <div className="sidebar-avatar" title={currentUser?.email ?? ''}>
          <span className="sidebar-avatar__letter">
            {currentUser?.email?.[0]?.toUpperCase() ?? 'U'}
          </span>
          <div className="sidebar-avatar__tooltip">
            <span className="sidebar-avatar__role">{currentUser?.role ?? 'Staff'}</span>
            <span className="sidebar-avatar__email">{currentUser?.email ?? ''}</span>
          </div>
        </div>

        {/* Logout button */}
        <div
          className="nav-item nav-item--logout"
          onClick={onLogout}
          title="Logout"
        >
          <i className="ti ti-logout"></i>
          <div className="tip">Logout</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;