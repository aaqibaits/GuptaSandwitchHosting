import React from 'react';
import './OrderPanel.css';

// Table selection disabled for now — re-enable when floor/table management is needed
// const TABLE_OPTIONS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

const OrderPanel = ({
  currentOrder = [],
  onQuantityChange,
  discount,
  onDiscountChange,
  clearDiscount,
  discountSectionOpen,
  onCashPayment,
  onOnlinePayment,
  onNewOrder,
  orderType = 'dine',
  totals,
  isSubmitting = false,
  orderLabel = 'NEW',
}) => {
  const order = Array.isArray(currentOrder) ? currentOrder : [];

  const {
    discountAmount = 0,
    total = 0,
  } = totals || {};

  const handleCashPayment = () => {
    if (order.length === 0 || isSubmitting) return;
    onCashPayment?.();
  };

  const handleOnlinePayment = () => {
    if (order.length === 0 || isSubmitting) return;
    onOnlinePayment?.();
  };

  const summaryBlock = (
    <div className="order-summary">
      {discountAmount > 0 && (
        <div className="sum-row disc-line">
          <span>
            Discount ({discount?.type === 'pct' ? `${discount.value}%` : `₹${discount.value}`})
          </span>
          <span>-₹{discountAmount}</span>
        </div>
      )}
      <div className="sum-row total">
        <span>Total</span>
        <span>₹{total}</span>
      </div>
    </div>
  );

  if (order.length === 0) {
    return (
      <div className="right-panel">
        <div className="order-hdr">
          <div>
            <h3>Current Order</h3>
            <div className="order-meta">Add items from menu</div>
          </div>
          <div className="order-tag">{orderLabel}</div>
        </div>
        <div className="order-items-scroll">
          <div className="empty-state">
            <i className="ti ti-basket"></i>
            <p>No items added</p>
            <small>Click + on any menu item to start</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="right-panel">
      <div className="order-hdr">
        <div>
          <h3>Current Order</h3>
          <div className="order-meta">
            {order.length} {order.length === 1 ? 'item' : 'items'} ·{' '}
            {orderType === 'parcel' ? 'Parcel' : 'Dine-in'}
          </div>
        </div>
        <div className="order-tag">{orderLabel}</div>
      </div>

      {/* Table selection — disabled until table management is required
      {orderType === 'dine' && (
        <div className="table-select-band">
          <span className="table-select-label">Table</span>
          <div className="table-chips">
            {TABLE_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                className={`table-chip ${tableNumber === t ? 'active' : ''}`}
                onClick={() => onTableChange?.(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      */}

      {discountSectionOpen && (
        <div className="disc-section open">
          <div className="disc-inner">
            <input
              type="number"
              placeholder="0"
              min="0"
              max={discount?.type === 'pct' ? '100' : undefined}
              value={discount?.value || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                if (discount?.type === 'pct' && val > 100) {
                  onDiscountChange?.(100, discount?.type);
                } else {
                  onDiscountChange?.(e.target.value, discount?.type);
                }
              }}
            />
            <select
              value={discount?.type || 'pct'}
              onChange={(e) => {
                const newType = e.target.value;
                if (newType === 'pct' && (discount?.value || 0) > 100) {
                  onDiscountChange?.(100, newType);
                } else {
                  onDiscountChange?.(discount?.value || 0, newType);
                }
              }}
            >
              <option value="pct">%</option>
              <option value="flat">₹</option>
            </select>
            <button type="button" onClick={clearDiscount}>
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="order-items-scroll">
        {order.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="order-row">
            <div className="order-item-emoji">{item.emoji || '🍽️'}</div>
            <div className="or-info">
              <div className="or-name">{item.name}</div>
              <div className="or-unit">₹{item.price} each</div>
            </div>
            <div className="order-row-actions">
              <div className="qty-ctrl">
                <button
                  type="button"
                  className="qb"
                  onClick={() => onQuantityChange(idx, -1)}
                  disabled={isSubmitting}
                >
                  −
                </button>
                <span className="qn">{item.qty}</span>
                <button
                  type="button"
                  className="qb"
                  onClick={() => onQuantityChange(idx, 1)}
                  disabled={isSubmitting}
                >
                  +
                </button>
              </div>
              <div className="or-total">₹{item.price * item.qty}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="order-summary-fixed">
        {summaryBlock}
        <div className="action-btns">
          {onNewOrder && (
            <button
              type="button"
              className="btn-new"
              onClick={onNewOrder}
              disabled={isSubmitting}
            >
              <i className="ti ti-plus"></i> New Order
            </button>
          )}
          <button
            type="button"
            className="btn-cash"
            onClick={handleCashPayment}
            disabled={isSubmitting}
          >
            <i className="ti ti-wallet"></i>
            {isSubmitting ? 'Processing…' : 'Cash'}
          </button>
          <button
            type="button"
            className="btn-online"
            onClick={handleOnlinePayment}
            disabled={isSubmitting}
          >
            <i className="ti ti-credit-card"></i>
            {isSubmitting ? 'Processing…' : 'Online'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderPanel;
