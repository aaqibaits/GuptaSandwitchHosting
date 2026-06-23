import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getCategories, getAllDishes } from '../../services/posApi';
import './MenuPanel.css';

const MENU_REFRESH_MS = 120000;

const normalizeDish = (dish, orderType) => ({
  id: dish.id,
  name: dish.name,
  cat: dish.categoryName || dish.cat || 'Other',
  categoryId: dish.categoryId,
  veg: dish.veg !== false,
  dinePrice: Number(dish.dinePrice ?? dish.price ?? 0),
  parcelPrice: Number(dish.parcelPrice ?? dish.price ?? 0),
  price: Number(
    orderType === 'parcel'
      ? (dish.parcelPrice ?? dish.price ?? 0)
      : (dish.dinePrice ?? dish.price ?? 0)
  ),
  isAvailable: dish.isAvailable !== false,
  emoji: dish.emoji || '🥪',
  imageUrl: dish.imageUrl || null,
});

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = import.meta.env.REACT_APP_API_URL ? import.meta.env.REACT_APP_API_URL.replace('/api', '') : '';
  return `${baseUrl}${url}`;
};

const MenuPanel = ({ onAddItem, onToggleDiscount, orderType = 'dine', onOrderTypeChange, showToast }) => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);
  const showToastRef = useRef(showToast);

  showToastRef.current = showToast;

  const loadMenu = useCallback(async ({ silent = false } = {}) => {
    const isFirstLoad = !hasLoadedRef.current;
    if (!silent && isFirstLoad) {
      setInitialLoading(true);
    }
    if (!silent) {
      setError(null);
    }

    try {
      const [cats, dishes] = await Promise.all([
        getCategories(),
        getAllDishes({ orderType, available: false }),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setMenuItems(
        (Array.isArray(dishes) ? dishes : []).map((d) => normalizeDish(d, orderType))
      );
      hasLoadedRef.current = true;
    } catch (err) {
      const message = err.message || 'Failed to load menu';
      setError(message);
      if (!silent && showToastRef.current) {
        showToastRef.current(`❌ ${message}`);
      }
    } finally {
      if (isFirstLoad) {
        setInitialLoading(false);
      }
    }
  }, [orderType]);

  useEffect(() => {
    loadMenu({ silent: hasLoadedRef.current });
  }, [loadMenu]);

  useEffect(() => {
    const interval = setInterval(() => loadMenu({ silent: true }), MENU_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadMenu]);

  const categoryChips = useMemo(() => {
    const names = categories.map((c) => c.name).filter(Boolean);
    return ['All', ...names];
  }, [categories]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchesCategory =
        activeCategory === 'All' || item.cat === activeCategory;
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.cat.toLowerCase().includes(query);
      return matchesCategory && matchesSearch && item.isAvailable !== false;
    });
  }, [menuItems, activeCategory, searchQuery]);

  const getCurrentPrice = (item) =>
    orderType === 'parcel' ? item.parcelPrice : item.dinePrice;

  const handleAddItem = (item) => {
    const currentPrice = getCurrentPrice(item);
    onAddItem({
      ...item,
      id: item.id,
      dishId: Number(item.id),
      price: currentPrice,
      dinePrice: item.dinePrice,
      parcelPrice: item.parcelPrice,
      orderType,
    });
  };

  const showEmptyState = !initialLoading && !error && filteredItems.length === 0;
  const showGrid = !initialLoading && !error && filteredItems.length > 0;

  return (
    <div className="center-panel">
      <div className="menu-toolbar">
        <div className="search-box">
          <i className="ti ti-search"></i>
          <input
            type="text"
            placeholder="Search menu items…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="order-type-toggle">
          <button
            type="button"
            className={`type-btn ${orderType === 'dine' ? 'active' : ''}`}
            onClick={() => onOrderTypeChange?.('dine')}
          >
            <i className="ti ti-building"></i> Dine-in
          </button>
          <button
            type="button"
            className={`type-btn ${orderType === 'parcel' ? 'active' : ''}`}
            onClick={() => onOrderTypeChange?.('parcel')}
          >
            <i className="ti ti-package"></i> Parcel
          </button>
        </div>

        <button type="button" className="top-btn" onClick={onToggleDiscount}>
          <i className="ti ti-tag"></i> Discount
        </button>
      </div>

      <div className="cat-scroll">
        {categoryChips.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`cat-chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {initialLoading && menuItems.length === 0 && (
          <div className="menu-state menu-state--initial">
            <p>Loading menu…</p>
          </div>
        )}

        {!initialLoading && error && menuItems.length === 0 && (
          <div className="menu-state menu-state-error">
            <i className="ti ti-alert-circle"></i>
            <p>{error}</p>
            <button type="button" className="menu-retry-btn" onClick={() => loadMenu({ silent: false })}>
              Retry
            </button>
          </div>
        )}

        {showEmptyState && (
          <div className="menu-state">
            <i className="ti ti-mood-empty"></i>
            <p>No items found</p>
            <small>Try another category or search term</small>
          </div>
        )}

        {showGrid &&
          filteredItems.map((item) => {
            const currentPrice = getCurrentPrice(item);
            const showPriceDiff = item.dinePrice !== item.parcelPrice;

            return (
              <div key={item.id} className="menu-item">
                <div className="item-img">
                  {item.imageUrl ? (
                    <img src={getImageUrl(item.imageUrl)} alt={item.name} className="menu-item-pic" />
                  ) : (
                    <span>{item.emoji || '🥪'}</span>
                  )}
                </div>
                <div className="item-info">
                  <div className="item-name-row">
                    <div className={`veg-dot ${!item.veg ? 'nv' : ''}`} aria-hidden />
                    <div className="item-name">{item.name}</div>
                  </div>
                  <div className="menu-item-footer">
                    <div className="price-container">
                      <span className="menu-item-price">₹{currentPrice}</span>
                      {showPriceDiff && orderType === 'dine' && (
                        <span className="parcel-hint">Parcel: ₹{item.parcelPrice}</span>
                      )}
                      {showPriceDiff && orderType === 'parcel' && (
                        <span className="dine-hint">Dine: ₹{item.dinePrice}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="menu-item-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddItem(item);
                      }}
                      aria-label={`Add ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default MenuPanel;
