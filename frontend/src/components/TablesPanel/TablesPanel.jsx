// components/TablesPanel.js
import React, { useState } from 'react';
import './TablesPanel.css';

const TablesPanel = ({ 
  tables, 
  selectedTableId, 
  setSelectedTableId, 
  activeTab, 
  setActiveTab, 
  showToast, 
  onUpdateTables,
  onSelectDeliveryOrder,
  onSelectTakeawayOrder,
  deliveryOrders,
  takeawayOrders
}) => {
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableFormData, setTableFormData] = useState({
    name: '',
    waiter: '',
    pax: 2,
    occupied: false
  });

  const waiters = ['Ravi', 'Priya', 'Amit', 'Sunita', 'Raj', 'Neha'];

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === 'take') {
      showToast('📦 Takeaway orders - Ready for pickup');
      setSelectedTableId(null);
    } else if (tab === 'del') {
      showToast('🛵 Delivery orders - Out for delivery');
      setSelectedTableId(null);
    } else {
      showToast('🪑 Floor view active - Select a table');
    }
  };

  const openAddTableModal = () => {
    setEditingTable(null);
    setTableFormData({
      name: `T${tables.length + 1}`,
      waiter: 'Ravi',
      pax: 2,
      occupied: false
    });
    setShowTableModal(true);
  };

  const openEditTableModal = (table) => {
    setEditingTable(table);
    setTableFormData({
      name: table.name,
      waiter: table.waiter,
      pax: table.pax,
      occupied: table.occupied
    });
    setShowTableModal(true);
  };

  const handleTableFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTableFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveTable = () => {
    if (!tableFormData.name.trim()) {
      showToast('⚠️ Please enter table name');
      return;
    }

    if (editingTable) {
      const updatedTables = tables.map(table =>
        table.id === editingTable.id
          ? { ...table, ...tableFormData, pax: parseInt(tableFormData.pax) }
          : table
      );
      onUpdateTables(updatedTables);
      showToast(`✅ Table ${tableFormData.name} updated successfully`);
    } else {
      const newId = Math.max(...tables.map(t => t.id), 0) + 1;
      const newTable = {
        id: newId,
        ...tableFormData,
        pax: parseInt(tableFormData.pax),
        order: [],
        occupied: tableFormData.occupied || false
      };
      onUpdateTables([...tables, newTable]);
      showToast(`✅ Table ${tableFormData.name} added successfully`);
    }
    setShowTableModal(false);
  };

  const deleteTable = (tableId, tableName) => {
    if (window.confirm(`Are you sure you want to delete ${tableName}?`)) {
      const updatedTables = tables.filter(table => table.id !== tableId);
      onUpdateTables(updatedTables);
      if (selectedTableId === tableId) {
        setSelectedTableId(null);
      }
      showToast(`🗑️ Table ${tableName} deleted successfully`);
    }
  };

  const getTableStatus = (table) => {
    if (table.occupied) return 'occupied';
    return '';
  };

  // Render Dine-In tables
  if (activeTab === 'dine') {
    return (
      <>
        <div className="left-panel">
          <div className="panel-hdr">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2>Floor View</h2>
              <button className="icon-btn" onClick={openAddTableModal} title="Add Table">
                <i className="ti ti-plus"></i>
              </button>
            </div>
            <div className="tab-row">
              <div className={`tab active`}>Dine-In</div>
              <div className="tab" onClick={() => handleTabSwitch('take')}>Takeaway</div>
              <div className="tab" onClick={() => handleTabSwitch('del')}>Delivery</div>
            </div>
          </div>
          {/* <div className="floor-label">Ground Floor</div> */}
          <div className="tables-grid">
            {tables.map(table => (
              <div
                key={table.id}
                className={`table-card ${getTableStatus(table)} ${selectedTableId === table.id ? 'selected' : ''}`}
              >
                <div className="table-actions">
                  <button className="table-edit-btn" onClick={(e) => {
                    e.stopPropagation();
                    openEditTableModal(table);
                  }} title="Edit Table">
                    <i className="ti ti-edit"></i>
                  </button>
                  <button className="table-delete-btn" onClick={(e) => {
                    e.stopPropagation();
                    deleteTable(table.id, table.name);
                  }} title="Delete Table">
                    <i className="ti ti-trash"></i>
                  </button>
                </div>
                <div className="t-dot"></div>
                <div className="table-main" onClick={() => setSelectedTableId(table.id)}>
                  <div className="t-icon">{table.occupied ? '🍽️' : '🪑'}</div>
                  <div className="t-num">{table.name}</div>
                  <div className="t-pax">{table.occupied ? `${table.pax} guests` : 'Free'}</div>
                  <div className="t-waiter">{table.waiter}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table CRUD Modal */}
        {showTableModal && (
          <div className="modal-overlay open" onClick={() => setShowTableModal(false)}>
            <div className="modal table-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-top">
                <button className="btn-close-modal" onClick={() => setShowTableModal(false)}>
                  <i className="ti ti-x"></i>
                </button>
                <h3>{editingTable ? 'Edit Table' : 'Add New Table'}</h3>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Table Name</label>
                  <input
                    type="text"
                    name="name"
                    value={tableFormData.name}
                    onChange={handleTableFormChange}
                    placeholder="e.g., T1, VIP-1, Corner Table"
                  />
                </div>
                <div className="form-group">
                  <label>Waiter Name</label>
                  <select name="waiter" value={tableFormData.waiter} onChange={handleTableFormChange}>
                    {waiters.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Number of Guests (Pax)</label>
                  <input
                    type="number"
                    name="pax"
                    value={tableFormData.pax}
                    onChange={handleTableFormChange}
                    min="1"
                    max="20"
                  />
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="occupied"
                      checked={tableFormData.occupied}
                      onChange={handleTableFormChange}
                    />
                    Table is currently occupied
                  </label>
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowTableModal(false)}>Cancel</button>
                  <button className="btn-primary" onClick={saveTable}>Save Table</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Render Takeaway Orders
  if (activeTab === 'take') {
    return (
      <div className="left-panel">
        <div className="panel-hdr">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2>Takeaway Orders</h2>
            <button className="icon-btn" onClick={() => onSelectTakeawayOrder?.(null)} title="New Takeaway">
              <i className="ti ti-plus"></i>
            </button>
          </div>
          <div className="tab-row">
            <div className="tab" onClick={() => handleTabSwitch('dine')}>Dine-In</div>
            <div className="tab active">Takeaway</div>
            <div className="tab" onClick={() => handleTabSwitch('del')}>Delivery</div>
          </div>
        </div>
        <div className="floor-label">Ready for Pickup</div>
        <div className="orders-list">
          {takeawayOrders && takeawayOrders.length > 0 ? (
            takeawayOrders.map(order => (
              <div
                key={order.id}
                className={`order-card-item ${order.status === 'ready' ? 'ready' : ''}`}
                onClick={() => onSelectTakeawayOrder?.(order)}
              >
                <div className="order-header">
                  <span className="order-id">#{order.id}</span>
                  <span className={`order-status status-${order.status}`}>
                    {order.status === 'pending' ? '⏳ Pending' : order.status === 'preparing' ? '👨‍🍳 Preparing' : '✅ Ready'}
                  </span>
                </div>
                <div className="order-customer">
                  <i className="ti ti-user"></i> {order.customerName}
                </div>
                <div className="order-items">
                  {order.items.slice(0, 2).map((item, idx) => (
                    <span key={idx}>{item.qty}x {item.name}</span>
                  ))}
                  {order.items.length > 2 && <span>+{order.items.length - 2}</span>}
                </div>
                <div className="order-footer">
                  <span className="order-total">₹{order.total}</span>
                  <span className="order-time">{order.orderTime}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-orders-list">
              <i className="ti ti-shopping-cart-off"></i>
              <p>No takeaway orders</p>
              <span>Click + to create new takeaway order</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Delivery Orders
  if (activeTab === 'del') {
    return (
      <div className="left-panel">
        <div className="panel-hdr">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2>Delivery Orders</h2>
            <button className="icon-btn" onClick={() => onSelectDeliveryOrder?.(null)} title="New Delivery">
              <i className="ti ti-plus"></i>
            </button>
          </div>
          <div className="tab-row">
            <div className="tab" onClick={() => handleTabSwitch('dine')}>Dine-In</div>
            <div className="tab" onClick={() => handleTabSwitch('take')}>Takeaway</div>
            <div className="tab active">Delivery</div>
          </div>
        </div>
        <div className="floor-label">Out for Delivery</div>
        <div className="orders-list">
          {deliveryOrders && deliveryOrders.length > 0 ? (
            deliveryOrders.map(order => (
              <div
                key={order.id}
                className={`order-card-item ${order.status === 'delivered' ? 'delivered' : ''}`}
                onClick={() => onSelectDeliveryOrder?.(order)}
              >
                <div className="order-header">
                  <span className="order-id">#{order.id}</span>
                  <span className={`order-status status-${order.status}`}>
                    {order.status === 'pending' ? '⏳ Pending' : 
                     order.status === 'confirmed' ? '✅ Confirmed' : 
                     order.status === 'preparing' ? '👨‍🍳 Preparing' : 
                     order.status === 'out-for-delivery' ? '🛵 Out for Delivery' : '📦 Delivered'}
                  </span>
                </div>
                <div className="order-customer">
                  <i className="ti ti-user"></i> {order.customerName}
                </div>
                <div className="order-address">
                  <i className="ti ti-map-pin"></i> {order.address.substring(0, 40)}...
                </div>
                <div className="order-items">
                  {order.items.slice(0, 2).map((item, idx) => (
                    <span key={idx}>{item.qty}x {item.name}</span>
                  ))}
                  {order.items.length > 2 && <span>+{order.items.length - 2}</span>}
                </div>
                <div className="order-footer">
                  <span className="order-total">₹{order.total}</span>
                  <span className="order-time">{order.orderTime}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-orders-list">
              <i className="ti ti-truck"></i>
              <p>No delivery orders</p>
              <span>Click + to create new delivery order</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default TablesPanel;