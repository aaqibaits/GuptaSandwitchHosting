import React, { useState, useEffect } from 'react';
import './TopBar.css';

const TopBar = ({
  openOrdersCount = 0,
  // occupiedTablesCount = 0, // table tracking disabled
  salesTotal = 0,
  orderCount = 0,
  activeKotCount = 0,
  isLoadingStats = false,
}) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="topbar">
      <div>
        <div className="outlet-name">Gupta Sandwich</div>
        <div className="outlet-sub">Dine-In · Takeaway · Delivery</div>
      </div>
      <div className="topbar-right">
        <div className="stat-pill" title="Active orders">
          <i className="ti ti-receipt" style={{ fontSize: '14px', color: 'var(--blue)' }}></i>
          <span className="val" style={{ color: 'var(--blue)' }}>
            {isLoadingStats ? '…' : openOrdersCount}
          </span>
          <span className="stat-label">open</span>
        </div>
        {/* Table occupancy — disabled until table management is enabled
        <div className="stat-pill" title="Occupied tables">
          <i className="ti ti-clock" style={{ color: 'var(--orange)', fontSize: '14px' }}></i>
          <span className="val" style={{ color: 'var(--orange)' }}>
            {isLoadingStats ? '…' : occupiedTablesCount}
          </span>
          <span className="stat-label">occupied</span>
        </div>
        */}
        <div className="stat-pill" title="Active KOT tickets">
          <i className="ti ti-chef-hat" style={{ fontSize: '14px', color: 'var(--red)' }}></i>
          <span className="val" style={{ color: 'var(--red)' }}>
            {isLoadingStats ? '…' : activeKotCount}
          </span>
          <span className="stat-label">KOT</span>
        </div>
        <div className="stat-pill" title="Today's sales">
          <i className="ti ti-currency-rupee" style={{ fontSize: '14px' }}></i>
          <span className="val">
            {isLoadingStats ? '…' : `₹${Number(salesTotal).toLocaleString('en-IN')}`}
          </span>
        </div>
        <div className="stat-pill" title="Today's orders">
          <i className="ti ti-list-check" style={{ fontSize: '14px' }}></i>
          <span className="val">{isLoadingStats ? '…' : orderCount}</span>
          <span className="stat-label">orders</span>
        </div>
        <div className="clock" id="clock">{currentTime}</div>
      </div>
    </div>
  );
};

export default TopBar;
