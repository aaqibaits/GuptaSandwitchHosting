import React, { useState, useMemo, useCallback } from 'react';
import MenuPanel from '../../components/MenuPanel/MenuPanel';
import OrderPanel from '../../components/OrderPanel/OrderPanel';
import { applyDiscount, clearCurrentOrder } from '../../services/posApi';
import './POSPage.css';
import VoiceBot from "../../components/VoiceBot";
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';

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
  const [confirmSwitch, setConfirmSwitch] = useState({ isOpen: false, pendingType: null });

  const applyTypeChange = useCallback(
    (newType) => {
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
    },
    [setOrderType, setCurrentOrder, showToast]
  );

  const handleConfirmSwitch = useCallback(() => {
    if (confirmSwitch.pendingType) {
      applyTypeChange(confirmSwitch.pendingType);
    }
    setConfirmSwitch({ isOpen: false, pendingType: null });
  }, [confirmSwitch.pendingType, applyTypeChange]);

  const handleCancelSwitch = useCallback(() => {
    setConfirmSwitch({ isOpen: false, pendingType: null });
  }, []);

  const orderTotals = useMemo(() => {
    const subtotal = currentOrder.reduce(
      (sum, item) => sum + (item.price || 0) * (item.qty || 1),
      0
    );
    const calculated = applyDiscount({ subtotal, discount, orderType });
    return {
      discountAmount: calculated.discountAmount,    
      total: calculated.total,
    };
  }, [currentOrder, discount, orderType]);

  const handleAddItem = useCallback(
    (item) => {
      const qtyToAdd = item.qty || 1;
      setCurrentOrder((prev) => {
        const existing = prev.find(
          (o) => o.id === item.id || o.dishId === item.dishId
        );
        if (existing) {
          return prev.map((o) =>
            o.id === item.id || o.dishId === item.dishId
              ? { ...o, qty: o.qty + qtyToAdd }
              : o
          );
        }
        return [...prev, { ...item, qty: qtyToAdd }];
      });
      showToast?.(
        `✅ ${qtyToAdd > 1 ? qtyToAdd + ' ' : ''}${item.name} added (${orderType === 'parcel' ? 'Parcel' : 'Dine-in'})`
      );
    },
    [setCurrentOrder, showToast, orderType]
  );

  const handleRemoveItem = useCallback((dishId, quantity = 1) => {
    let removedName = "";
    let actualRemovedQty = 0;
    setCurrentOrder((prev) => {
      if (prev.length === 0) return prev;
      const targetId = dishId || prev[prev.length - 1].id;
      const item = prev.find((o) => o.id === targetId || o.dishId === targetId);
      if (!item) return prev;
      removedName = item.name;
      actualRemovedQty = Math.min(item.qty, quantity);
      if (item.qty <= quantity) {
        return prev.filter((o) => o.id !== targetId && o.dishId !== targetId);
      }
      return prev.map((o) =>
        o.id === targetId || o.dishId === targetId
          ? { ...o, qty: o.qty - quantity }
          : o
      );
    });
    if (removedName) {
      showToast?.(`🗑️ Removed ${actualRemovedQty} ${removedName}`);
    } else {
      showToast?.("🛒 Cart is empty");
    }
  }, [setCurrentOrder, showToast]);

  const handleClearCart = useCallback(() => {
    setCurrentOrder([]);
    showToast?.("🧹 Cart cleared");
  }, [setCurrentOrder, showToast]);

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

      if (currentOrder.length > 0) {
        setConfirmSwitch({ isOpen: true, pendingType: newType });
      } else {
        applyTypeChange(newType);
      }
    },
    [orderType, currentOrder.length, applyTypeChange]
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
      <VoiceBot
        onAddItem={handleAddItem}
        showToast={showToast}
        orderType={orderType}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderTypeChange={handleOrderTypeChange}
        isConfirmationOpen={confirmSwitch.isOpen}
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
      />
      <ConfirmationModal
        isOpen={confirmSwitch.isOpen}
        title="Switch Order Type"
        message={`Switch to ${confirmSwitch.pendingType === 'parcel' ? 'Parcel' : 'Dine-in'}? Prices will update for items in cart.`}
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
      />
    </div>
  );
};

export default POSPage;
