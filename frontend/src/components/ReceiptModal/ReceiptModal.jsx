// components/ReceiptModal.js
import React from 'react';
import './ReceiptModal.css';

const ReceiptModal = ({ data, onClose }) => {
  const { total, method, tableId, order } = data;

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-head">
          <h3>Gupta Sandwitch</h3>
          <p>MG Road, Pune • +91 98765 43210</p>
          <p style={{ marginTop: '6px', fontSize: '10px', opacity: 0.6 }}>
            {new Date().toLocaleString('en-IN')}
          </p>
        </div>
        <div className="receipt-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px', color: 'var(--muted)' }}>
            <span>Table {tableId}</span>
            <span>{method}</span>
          </div>
          {order.map((item, idx) => (
            <div key={idx} className="receipt-row">
              <span>{item.emoji} {item.name} x{item.qty}</span>
              <span>₹{item.price * item.qty}</span>
            </div>
          ))}
          <div className="receipt-row" style={{ color: 'var(--muted)' }}>
            <span>GST</span>
            <span>incl.</span>
          </div>
          {/* <div className="receipt-row" style={{ color: 'var(--muted)' }}>
            <span>Service</span>
            <span>incl.</span>
          </div> */}
          <div className="receipt-total">
            <span>TOTAL</span>
            <span>₹{total}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginTop: '10px' }}>
            GST included
          </div>
        </div>
        <div className="receipt-footer">
          <p>Thank you for dining with us! 🙏</p>
          {/* <p style={{ marginTop: '4px' }}>GSTIN: 27AABCS1234F1Z5</p> */}
          <button className="btn-print" onClick={onClose}>
            <i className="ti ti-printer"></i> Print & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;