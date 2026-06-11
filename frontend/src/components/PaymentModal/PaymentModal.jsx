// components/PaymentModal.js
import React, { useState } from 'react';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, onConfirm, selectedTableId, getTotalForTable, tables }) => {
  const [selectedMethod, setSelectedMethod] = useState('Cash');

  if (!isOpen || !selectedTableId) return null;

  const total = getTotalForTable(selectedTableId);
  const table = tables.find(t => t.id === selectedTableId);
  const orderCount = table?.order?.length || 0;

  const paymentMethods = [
    { icon: 'ti-cash', label: 'Cash' },
    { icon: 'ti-credit-card', label: 'Card' },
    { icon: 'ti-qrcode', label: 'UPI' },
    { icon: 'ti-wallet', label: 'Wallet' },
    { icon: 'ti-arrows-split-2', label: 'Split' },
    { icon: 'ti-building-bank', label: 'Bank' }
  ];

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top">
          <button className="btn-close-modal" onClick={onClose}>
            <i className="ti ti-x"></i>
          </button>
          <h3>Collect Payment</h3>
          <div className="modal-amount">₹{total}</div>
          <div className="modal-sub">Table {selectedTableId} • {orderCount} items</div>
        </div>
        <div className="modal-body">
          <div className="modal-section">
            <label>Payment Method</label>
            <div className="pay-grid">
              {paymentMethods.map(method => (
                <div
                  key={method.label}
                  className={`pay-opt ${selectedMethod === method.label ? 'sel' : ''}`}
                  onClick={() => setSelectedMethod(method.label)}
                >
                  <i className={`ti ${method.icon}`}></i>
                  {method.label}
                </div>
              ))}
            </div>
          </div>
          <div className="modal-section">
            <label>Customer (Optional)</label>
            <div className="split-row">
              <input type="text" placeholder="Search customer or phone…" />
            </div>
          </div>
          <button className="btn-confirm" onClick={() => onConfirm(selectedMethod)}>
            <i className="ti ti-check"></i> Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;