import React, { useState, useMemo, useCallback } from 'react';
import MenuPanel from '../../components/MenuPanel/MenuPanel';
import OrderPanel from '../../components/OrderPanel/OrderPanel';
import { applyDiscount, clearCurrentOrder } from '../../services/posApi';
import './POSPage.css';
import VoiceBot from "../../components/VoiceBot";

const POSPage = ({
  currentOrder,
  setCurrentOrder,
  discount,
  setDiscount,
  orderType,    
  setOrderType,
  onCashPayment,
  onOnlinePayment,
  showToast,
  isSubmitting,
  lastOrderNumber,
}) => {
  const [discountSectionOpen, setDiscountSectionOpen] = useState(false);

  const orderTotals = useMemo(() => {
    const subtotal = currentOrder.reduce(
      (sum, item) => sum + (item.price || 0) * (item.qty || 1),
      0
    );
    const calculated = applyDiscount({ subtotal, discount, orderType });
    return {
      discountAmount: calculated.discountAmount,    
      total: calculated.afterDiscount,
    };
  }, [currentOrder, discount, orderType]);

  const handleAddItem = useCallback(
    (item) => {
      setCurrentOrder((prev) => {
        const existing = prev.find(
          (o) => o.id === item.id || o.dishId === item.dishId
        );
        if (existing) {
          return prev.map((o) =>
            o.id === item.id || o.dishId === item.dishId
              ? { ...o, qty: o.qty + 1 }
              : o
          );
        }
        return [...prev, { ...item, qty: 1 }];
      });
      showToast?.(
        `✅ ${item.name} added (${orderType === 'parcel' ? 'Parcel' : 'Dine-in'})`
      );
    },
    [setCurrentOrder, showToast, orderType]
  );

  const handleQuantityChange = useCallback(
    (index, delta) => {
      setCurrentOrder((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], qty: updated[index].qty + delta };
        if (updated[index].qty <= 0) {
          updated.splice(index, 1);
        }
        return updated;
      });
    },
    [setCurrentOrder]
  );

  const handleNewOrder = useCallback(() => {
    if (currentOrder.length === 0) {
      const cleared = clearCurrentOrder();
      setDiscount(cleared.discount);
      showToast?.('🆕 New order started');
      return;
    }
    if (window.confirm('Clear current order?')) {
      const cleared = clearCurrentOrder();
      setCurrentOrder(cleared.items);
      setDiscount(cleared.discount);
      showToast?.('🆕 New order started');
    }
  }, [currentOrder.length, setCurrentOrder, setDiscount, showToast]);

  const handleOrderTypeChange = useCallback(
    (newType) => {
      if (newType === orderType) return;

      const applyTypeChange = () => {
        setOrderType(newType);
        setCurrentOrder((prev) =>
          prev.map((item) => ({
            ...item,
            price:
              newType === 'parcel'
                ? (item.parcelPrice ?? item.price)
                : (item.dinePrice ?? item.price),
          }))
        );
        showToast?.(
          `🔄 Switched to ${newType === 'parcel' ? 'Parcel' : 'Dine-in'} mode`
        );
      };

      if (currentOrder.length > 0) {
        if (
          window.confirm(
            `Switch to ${newType === 'parcel' ? 'Parcel' : 'Dine-in'}? Prices will update for items in cart.`
          )
        ) {
          applyTypeChange();
        }
      } else {
        applyTypeChange();
      }
    },
    [orderType, currentOrder.length, setOrderType, setCurrentOrder, showToast]
  );

  const handleDiscountChange = (value, type) => {
    const val = parseFloat(value) || 0;
    const resolvedType = type || 'pct';
    if (resolvedType === 'pct' && val > 100) {
      setDiscount({ value: 100, type: resolvedType });
    } else {
      setDiscount({ value: val, type: resolvedType });
    }
  };

  const clearDiscount = () => setDiscount({ value: 0, type: 'pct' });

  return (
    <div className="pos-layout">
      <MenuPanel
        onAddItem={handleAddItem}
        onToggleDiscount={() => setDiscountSectionOpen((o) => !o)}
        orderType={orderType}
        onOrderTypeChange={handleOrderTypeChange}
        showToast={showToast}
      />
      <OrderPanel
        currentOrder={currentOrder}
        onQuantityChange={handleQuantityChange}
        discount={discount}
        onDiscountChange={handleDiscountChange}
        clearDiscount={clearDiscount}
        discountSectionOpen={discountSectionOpen}
        onCashPayment={onCashPayment}
        onOnlinePayment={onOnlinePayment}
        onNewOrder={handleNewOrder}
        orderType={orderType}
        totals={orderTotals}
        isSubmitting={isSubmitting}
        orderLabel={lastOrderNumber || 'NEW'}
      />
      {/* <voicebot/> */}
      <VoiceBot onAddItem={handleAddItem} showToast={showToast} />
    </div>
  );
};

export default POSPage;
