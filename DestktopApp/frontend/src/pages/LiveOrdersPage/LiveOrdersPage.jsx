// pages/LiveOrdersPage/LiveOrdersPage.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './LiveOrdersPage.css';

// ── Complete Gupta Menu Data with Time Required ────────────────────────────
const INITIAL_MENU = [
  // Grilled Sandwiches
  { id: 1, name: 'Veggie Cheesy Grilled (Jumbo)', price: 150, cat: 'Grilled Sandwiches', veg: true, emoji: '🥪', swiggy: true, zomato: true, time: '10-15 min' },
  { id: 2, name: 'Veggie Cheesy Grilled (Mini)', price: 120, cat: 'Grilled Sandwiches', veg: true, emoji: '🥪', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 3, name: 'Spinach Corn Cheesy Grilled (Jumbo)', price: 170, cat: 'Grilled Sandwiches', veg: true, emoji: '🥪', swiggy: true, zomato: true, time: '10-15 min' },
  { id: 4, name: 'Spinach Corn Cheesy Grilled (Mini)', price: 140, cat: 'Grilled Sandwiches', veg: true, emoji: '🥪', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 5, name: 'Paneer Cheesy Grilled (Jumbo)', price: 170, cat: 'Grilled Sandwiches', veg: true, emoji: '🧀', swiggy: true, zomato: true, time: '10-15 min' },
  { id: 6, name: 'Paneer Cheesy Grilled (Mini)', price: 140, cat: 'Grilled Sandwiches', veg: true, emoji: '🧀', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 7, name: 'Mayo Grilled Sandwich (Jumbo)', price: 160, cat: 'Grilled Sandwiches', veg: true, emoji: '🥪', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 8, name: 'Mayo Grilled Sandwich (Mini)', price: 130, cat: 'Grilled Sandwiches', veg: true, emoji: '🥪', swiggy: true, zomato: true, time: '6-10 min' },
  { id: 9, name: 'Masala Cheesy Grilled (Jumbo)', price: 160, cat: 'Grilled Sandwiches', veg: true, emoji: '🌶️', swiggy: true, zomato: true, time: '10-15 min' },
  { id: 10, name: 'Masala Cheesy Grilled (Mini)', price: 130, cat: 'Grilled Sandwiches', veg: true, emoji: '🌶️', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 11, name: 'Paneer Chilly Cheesy Grilled (Jumbo)', price: 170, cat: 'Grilled Sandwiches', veg: true, emoji: '🧀', swiggy: true, zomato: true, time: '10-15 min' },
  { id: 12, name: 'Paneer Chilly Cheesy Grilled (Mini)', price: 140, cat: 'Grilled Sandwiches', veg: true, emoji: '🧀', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 13, name: 'Samosa Cheesy Grilled (Jumbo)', price: 160, cat: 'Grilled Sandwiches', veg: true, emoji: '🥟', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 14, name: 'Samosa Cheesy Grilled (Mini)', price: 130, cat: 'Grilled Sandwiches', veg: true, emoji: '🥟', swiggy: true, zomato: true, time: '6-10 min' },
  { id: 15, name: 'Jain Samosa Cheesy Grilled (Jumbo)', price: 170, cat: 'Grilled Sandwiches', veg: true, emoji: '🥟', swiggy: true, zomato: true, time: '10-15 min' },
  { id: 16, name: 'Jain Samosa Cheesy Grilled (Mini)', price: 140, cat: 'Grilled Sandwiches', veg: true, emoji: '🥟', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 17, name: 'Pahadi Cheesy Grilled (Jumbo)', price: 170, cat: 'Grilled Sandwiches', veg: true, emoji: '🏔️', swiggy: true, zomato: true, time: '10-15 min' },
  { id: 18, name: 'Pahadi Cheesy Grilled (Mini)', price: 140, cat: 'Grilled Sandwiches', veg: true, emoji: '🏔️', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 19, name: 'Chilly Cheesy Grilled (Jumbo)', price: 170, cat: 'Grilled Sandwiches', veg: true, emoji: '🌶️', swiggy: true, zomato: true, time: '10-15 min' },
  { id: 20, name: 'Chilly Cheesy Grilled (Mini)', price: 140, cat: 'Grilled Sandwiches', veg: true, emoji: '🌶️', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 21, name: 'Makhani Paneer Cheesy Grilled (Jumbo)', price: 170, cat: 'Grilled Sandwiches', veg: true, emoji: '🧀', swiggy: true, zomato: true, time: '10-15 min' },
  { id: 22, name: 'Makhani Paneer Cheesy Grilled (Mini)', price: 140, cat: 'Grilled Sandwiches', veg: true, emoji: '🧀', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 23, name: 'Mushroom Cheesy Grilled (Jumbo)', price: 170, cat: 'Grilled Sandwiches', veg: true, emoji: '🍄', swiggy: true, zomato: true, time: '10-15 min' },
  { id: 24, name: 'Mushroom Cheesy Grilled (Mini)', price: 140, cat: 'Grilled Sandwiches', veg: true, emoji: '🍄', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 25, name: 'Diet Grilled (Jumbo)', price: 120, cat: 'Grilled Sandwiches', veg: true, emoji: '🥗', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 26, name: 'Diet Grilled (Mini)', price: 90, cat: 'Grilled Sandwiches', veg: true, emoji: '🥗', swiggy: true, zomato: true, time: '6-10 min' },
  { id: 27, name: 'Veggie Grilled (Without Cheese) Jumbo', price: 100, cat: 'Grilled Sandwiches', veg: true, emoji: '🥪', swiggy: true, zomato: true, time: '8-12 min' },

  // Special Grilled Sandwiches / Panini
  { id: 28, name: 'Insalta Garlic Bread', price: 150, cat: 'Special Grilled / Panini', veg: true, emoji: '🍞', swiggy: true, zomato: true, time: '5-8 min' },
  { id: 29, name: 'Paneer Tikka Panini', price: 170, cat: 'Special Grilled / Panini', veg: true, emoji: '🧀', swiggy: true, zomato: true, time: '10-12 min' },
  { id: 30, name: 'Paneer Schez. Cheese Panini', price: 170, cat: 'Special Grilled / Panini', veg: true, emoji: '🧀', swiggy: true, zomato: true, time: '10-12 min' },
  { id: 31, name: 'Mushroom Schez. Cheese', price: 170, cat: 'Special Grilled / Panini', veg: true, emoji: '🍄', swiggy: true, zomato: true, time: '10-12 min' },
  { id: 32, name: 'Gupta Special Panini', price: 200, cat: 'Special Grilled / Panini', veg: true, emoji: '⭐', swiggy: true, zomato: true, time: '12-15 min' },

  // Sandwiches
  { id: 33, name: 'Veggie Toast Sandwich', price: 50, cat: 'Sandwiches', veg: true, emoji: '🍞', swiggy: true, zomato: true, time: '3-5 min' },
  { id: 34, name: 'Sada Sandwich', price: 45, cat: 'Sandwiches', veg: true, emoji: '🥪', swiggy: true, zomato: true, time: '2-4 min' },
  { id: 35, name: 'Diet Toast Sandwich', price: 45, cat: 'Sandwiches', veg: true, emoji: '🥗', swiggy: true, zomato: true, time: '3-5 min' },
  { id: 36, name: 'Masala Toast Sandwich', price: 60, cat: 'Sandwiches', veg: true, emoji: '🌶️', swiggy: true, zomato: true, time: '3-5 min' },
  { id: 37, name: 'Chocolate Bites Toast Sandwich', price: 60, cat: 'Sandwiches', veg: true, emoji: '🍫', swiggy: true, zomato: true, time: '3-5 min' },
  { id: 38, name: 'Jam Toast Sandwich', price: 55, cat: 'Sandwiches', veg: true, emoji: '🍓', swiggy: true, zomato: true, time: '3-5 min' },
  { id: 39, name: 'Veggie Mayo Toast Sandwich', price: 70, cat: 'Sandwiches', veg: true, emoji: '🥪', swiggy: true, zomato: true, time: '3-5 min' },
  { id: 40, name: 'Veggie Cheese Toast Sandwich', price: 75, cat: 'Sandwiches', veg: true, emoji: '🧀', swiggy: true, zomato: true, time: '4-6 min' },
  { id: 41, name: 'Chilly Cheese Toast Sandwich', price: 80, cat: 'Sandwiches', veg: true, emoji: '🌶️', swiggy: true, zomato: true, time: '4-6 min' },

  // Panini (Multi-grain Bread)
  { id: 42, name: 'Veggie Delight Panini', price: 140, cat: 'Panini (Multi-grain)', veg: true, emoji: '🥪', swiggy: true, zomato: true, time: '8-10 min' },
  { id: 43, name: 'Mexican Panini', price: 140, cat: 'Panini (Multi-grain)', veg: true, emoji: '🌮', swiggy: true, zomato: true, time: '8-10 min' },
  { id: 44, name: 'Regular Panini', price: 130, cat: 'Panini (Multi-grain)', veg: true, emoji: '🥪', swiggy: true, zomato: true, time: '6-8 min' },
  { id: 45, name: 'Double Cheese Butter Panini', price: 150, cat: 'Panini (Multi-grain)', veg: true, emoji: '🧀', swiggy: true, zomato: true, time: '8-10 min' },

  // Pizza
  { id: 46, name: 'Margherita Pizza (9 Inch)', price: 180, cat: 'Pizza', veg: true, emoji: '🍕', swiggy: true, zomato: true, time: '12-15 min' },
  { id: 47, name: 'Margherita Pizza (6 Inch)', price: 140, cat: 'Pizza', veg: true, emoji: '🍕', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 48, name: 'Simple Best Pizza (9 Inch)', price: 200, cat: 'Pizza', veg: true, emoji: '🍕', swiggy: true, zomato: true, time: '12-15 min' },
  { id: 49, name: 'Simple Best Pizza (6 Inch)', price: 150, cat: 'Pizza', veg: true, emoji: '🍕', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 50, name: 'Hot and Spicy Pizza (9 Inch)', price: 200, cat: 'Pizza', veg: true, emoji: '🌶️', swiggy: true, zomato: true, time: '12-15 min' },
  { id: 51, name: 'Hot and Spicy Pizza (6 Inch)', price: 150, cat: 'Pizza', veg: true, emoji: '🌶️', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 52, name: 'Corn Peas Pizza (9 Inch)', price: 200, cat: 'Pizza', veg: true, emoji: '🌽', swiggy: true, zomato: true, time: '12-15 min' },
  { id: 53, name: 'Corn Peas Pizza (6 Inch)', price: 150, cat: 'Pizza', veg: true, emoji: '🌽', swiggy: true, zomato: true, time: '8-12 min' },
  { id: 54, name: 'Traditional Gupta Style Pizza (9 Inch)', price: 250, cat: 'Pizza', veg: true, emoji: '🍕', swiggy: true, zomato: true, time: '15-18 min' },
  { id: 55, name: 'Traditional Gupta Style Pizza (6 Inch)', price: 200, cat: 'Pizza', veg: true, emoji: '🍕', swiggy: true, zomato: true, time: '10-14 min' },
  { id: 56, name: 'Paneer Lovers Chatkara Pizza (9 Inch)', price: 250, cat: 'Pizza', veg: true, emoji: '🧀', swiggy: true, zomato: true, time: '15-18 min' },
  { id: 57, name: 'Paneer Lovers Chatkara Pizza (6 Inch)', price: 200, cat: 'Pizza', veg: true, emoji: '🧀', swiggy: true, zomato: true, time: '10-14 min' },
  { id: 58, name: 'Exotic Pizza (9 Inch)', price: 250, cat: 'Pizza', veg: true, emoji: '🍕', swiggy: true, zomato: true, time: '15-18 min' },
  { id: 59, name: 'Exotic Pizza (6 Inch)', price: 200, cat: 'Pizza', veg: true, emoji: '🍕', swiggy: true, zomato: true, time: '10-14 min' },
  { id: 60, name: 'Tandoori Paneer Pizza (9 Inch)', price: 270, cat: 'Pizza', veg: true, emoji: '🔥', swiggy: true, zomato: true, time: '15-20 min' },
  { id: 61, name: 'Tandoori Paneer Pizza (6 Inch)', price: 230, cat: 'Pizza', veg: true, emoji: '🔥', swiggy: true, zomato: true, time: '10-15 min' },

  // Burgers
  { id: 62, name: 'Veg Burger', price: 50, cat: 'Burgers', veg: true, emoji: '🍔', swiggy: true, zomato: true, time: '5-7 min' },
  { id: 63, name: 'Veg Cheese Burger', price: 75, cat: 'Burgers', veg: true, emoji: '🍔', swiggy: true, zomato: true, time: '6-8 min' },
  { id: 64, name: 'Schezwan Cheese Burger', price: 75, cat: 'Burgers', veg: true, emoji: '🍔', swiggy: true, zomato: true, time: '6-8 min' },
  { id: 65, name: 'Mexican Cheese Burger', price: 75, cat: 'Burgers', veg: true, emoji: '🌮', swiggy: true, zomato: true, time: '6-8 min' },
  { id: 66, name: 'Tandoori Cheese Burger', price: 80, cat: 'Burgers', veg: true, emoji: '🔥', swiggy: true, zomato: true, time: '7-9 min' },
  { id: 67, name: 'Jain Cheese Burger', price: 80, cat: 'Burgers', veg: true, emoji: '🍔', swiggy: true, zomato: true, time: '7-9 min' },

  // Appetizers
  { id: 68, name: 'Garlic Bread (4 pcs)', price: 90, cat: 'Appetizers', veg: true, emoji: '🥖', swiggy: true, zomato: true, time: '5-7 min' },
  { id: 69, name: 'Garlic Bread with Cheese (4 pcs)', price: 110, cat: 'Appetizers', veg: true, emoji: '🧀', swiggy: true, zomato: true, time: '6-8 min' },
  { id: 70, name: 'Garlic Bread Spicy Chatkara (4 pcs)', price: 120, cat: 'Appetizers', veg: true, emoji: '🌶️', swiggy: true, zomato: true, time: '6-8 min' },
  { id: 71, name: 'French Fries', price: 90, cat: 'Appetizers', veg: true, emoji: '🍟', swiggy: true, zomato: true, time: '5-7 min' },
  { id: 72, name: 'French Fries with Peri Peri', price: 120, cat: 'Appetizers', veg: true, emoji: '🍟', swiggy: true, zomato: true, time: '5-7 min' },

  // Mocktails
  { id: 73, name: 'Fresh Lime', price: 70, cat: 'Mocktails', veg: true, emoji: '🍋', swiggy: true, zomato: true, time: '2-3 min' },
  { id: 74, name: 'Lemon Ice Tea', price: 70, cat: 'Mocktails', veg: true, emoji: '🍋', swiggy: true, zomato: true, time: '2-3 min' },
  { id: 75, name: 'Mint Mojito Blast', price: 90, cat: 'Mocktails', veg: true, emoji: '🌿', swiggy: true, zomato: true, time: '3-4 min' },
  { id: 76, name: 'Blue Lagoon Mojito', price: 90, cat: 'Mocktails', veg: true, emoji: '💙', swiggy: true, zomato: true, time: '3-4 min' },

  // Shakes & Smoothies
  { id: 77, name: 'Chocolate Shake', price: 80, cat: 'Shakes & Smoothies', veg: true, emoji: '🍫', swiggy: true, zomato: true, time: '3-5 min' },
  { id: 78, name: 'Butterscotch Milkshake', price: 80, cat: 'Shakes & Smoothies', veg: true, emoji: '🥤', swiggy: true, zomato: true, time: '3-5 min' },
  { id: 79, name: 'Kesar Thandai Milkshake', price: 80, cat: 'Shakes & Smoothies', veg: true, emoji: '🥤', swiggy: true, zomato: true, time: '3-5 min' },
  { id: 80, name: 'Pista Milkshake', price: 80, cat: 'Shakes & Smoothies', veg: true, emoji: '🥤', swiggy: true, zomato: true, time: '3-5 min' },
  { id: 81, name: 'Rose Milkshake', price: 80, cat: 'Shakes & Smoothies', veg: true, emoji: '🌹', swiggy: true, zomato: true, time: '3-5 min' },
  { id: 82, name: 'Cold Coffee', price: 100, cat: 'Shakes & Smoothies', veg: true, emoji: '☕', swiggy: true, zomato: true, time: '3-5 min' },

  // Combos
  { id: 83, name: 'Grilled Sandwich Combo', price: 250, cat: 'Combos', veg: true, emoji: '📦', swiggy: true, zomato: true, time: '12-15 min' },
  { id: 84, name: 'Panini Combo', price: 250, cat: 'Combos', veg: true, emoji: '📦', swiggy: true, zomato: true, time: '12-15 min' },
  { id: 85, name: 'Pizza Combo', price: 350, cat: 'Combos', veg: true, emoji: '📦', swiggy: true, zomato: true, time: '15-20 min' },

  // Party Combo Boxes
  { id: 86, name: 'Party Combo Box 1', price: 100, cat: 'Party Combo Boxes', veg: true, emoji: '📦', swiggy: true, zomato: true, time: '8-10 min' },
  { id: 87, name: 'Party Combo Box 2', price: 120, cat: 'Party Combo Boxes', veg: true, emoji: '📦', swiggy: true, zomato: true, time: '8-10 min' },
  { id: 88, name: 'Party Combo Box 3', price: 150, cat: 'Party Combo Boxes', veg: true, emoji: '📦', swiggy: true, zomato: true, time: '10-12 min' },
  { id: 89, name: 'Party Combo Box 4', price: 160, cat: 'Party Combo Boxes', veg: true, emoji: '📦', swiggy: true, zomato: true, time: '10-12 min' },

  // Extra Add-ons
  { id: 90, name: 'Extra Cheese', price: 30, cat: 'Extra Add-ons', veg: true, emoji: '🧀', swiggy: true, zomato: true, time: '1-2 min' },
  { id: 91, name: 'Extra Wafers', price: 30, cat: 'Extra Add-ons', veg: true, emoji: '🍪', swiggy: true, zomato: true, time: '1 min' },
  { id: 92, name: 'Extra Paneer', price: 20, cat: 'Extra Add-ons', veg: true, emoji: '🧀', swiggy: true, zomato: true, time: '2-3 min' },
  { id: 93, name: 'Extra Mushroom', price: 20, cat: 'Extra Add-ons', veg: true, emoji: '🍄', swiggy: true, zomato: true, time: '2-3 min' },
  { id: 94, name: 'Extra Mayo', price: 20, cat: 'Extra Add-ons', veg: true, emoji: '🥚', swiggy: true, zomato: true, time: '1 min' },
];

const CATEGORIES = ['All', 'Grilled Sandwiches', 'Special Grilled / Panini', 'Sandwiches', 'Panini (Multi-grain)', 'Pizza', 'Burgers', 'Appetizers', 'Mocktails', 'Shakes & Smoothies', 'Combos', 'Party Combo Boxes', 'Extra Add-ons'];

const generateMockOrder = (platform, orderId) => {
  const availableItems = INITIAL_MENU.filter(item => item[platform]);
  const randomItems = [];
  const numItems = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < numItems; i++) {
    const item = availableItems[Math.floor(Math.random() * availableItems.length)];
    if (item && !randomItems.find(r => r.id === item.id)) {
      randomItems.push({
        id: item.id,
        name: item.name,
        qty: Math.floor(Math.random() * 2) + 1,
        price: item.price,
        special: '',
        time: item.time
      });
    }
  }
  const total = randomItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  return {
    id: orderId,
    platform,
    platformOrderId: `${platform === 'swiggy' ? 'SW' : 'ZO'}${Math.floor(Math.random() * 10000)}`,
    customerName: platform === 'swiggy'
      ? ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Gupta', 'Vikram Singh'][Math.floor(Math.random() * 5)]
      : ['Neha Singh', 'Vikram Mehta', 'Anjali Nair', 'Rohan Desai', 'Kavita Joshi'][Math.floor(Math.random() * 5)],
    customerPhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    items: randomItems,
    total,
    status: 'pending',
    orderTime: new Date(),
    deliveryAddress: platform === 'swiggy'
      ? '123, Green Park Colony, Near City Mall, Pune - 411001'
      : '45, Lake View Apartments, FC Road, Pune - 411004',
    specialInstructions: platform === 'swiggy' ? 'Ring the bell twice' : 'Leave at reception',
    estimatedTime: Math.floor(Math.random() * 30) + 20,
    paymentMethod: platform === 'swiggy' ? 'Online' : 'COD'
  };
};

const EMPTY_DISH = { name: '', price: '', cat: 'Grilled Sandwiches', veg: true, emoji: '🍽️', swiggy: true, zomato: true, time: '5-10 min' };

const LiveOrdersPage = ({ showToast, orders = [], setOrders, stats, isConnected }) => {
  const [activePage, setActivePage] = useState('orders');
  const [activePlatform, setActivePlatform] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    localStorage.setItem('autoAccept', String(autoAccept));
  }, [autoAccept]);

  const [menu, setMenu] = useState(INITIAL_MENU);
  const [menuPlatform, setMenuPlatform] = useState('swiggy');
  const [menuCategory, setMenuCategory] = useState('All');
  const [menuSearch, setMenuSearch] = useState('');
  const [editingDish, setEditingDish] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDish, setNewDish] = useState(EMPTY_DISH);
  const [editForm, setEditForm] = useState({});

  const updateOrderStatus = async (id, status, kotId) => {
    try {
      if (kotId) {
        if (status === 'ready') {
          await api.patch(`/pos/kots/${kotId}/status`, { status: 'ready' });
        } else if (status === 'completed') {
          await api.post(`/pos/kots/${kotId}/dispatch`);
        }
      }
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      const msgs = { preparing: '👨‍🍳 Being prepared', ready: '✅ Ready for pickup', completed: '🎉 Completed!' };
      showToast(msgs[status]);
    } catch (error) {
      console.error(error);
      showToast(`❌ Failed to update status: ${error.response?.data?.message || error.message}`);
    }
  };

  const acceptOrder = async (id, kotId) => {
    try {
      if (kotId) {
        await api.patch(`/pos/kots/${kotId}/status`, { status: 'preparing' });
      }
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'preparing' } : o));
      showToast('✅ Order accepted!');
    } catch (error) {
      console.error(error);
      showToast(`❌ Failed to accept order: ${error.response?.data?.message || error.message}`);
    }
  };

  const rejectOrder = async (id) => {
    if (window.confirm('Reject this order?')) {
      try {
        await api.post(`/pos/orders/${id}/cancel`);
        setOrders(prev => prev.filter(o => o.id !== id));
        showToast('❌ Order rejected & cancelled');
      } catch (error) {
        console.error(error);
        showToast(`❌ Failed to reject order: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const getStatusBadgeClass = s => ({ pending: 'status-pending', preparing: 'status-preparing', ready: 'status-ready', completed: 'status-completed' }[s] ?? '');
  const getStatusText = s => ({ pending: 'Pending', preparing: 'Preparing', ready: 'Ready', completed: 'Completed' }[s] ?? s);
  const getTimeSince = t => {
    const m = Math.floor((new Date() - new Date(t)) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m} min ago`;
    return `${Math.floor(m / 60)} hr ago`;
  };

  const filteredOrders = orders.filter(o => {
    if (activePlatform !== 'all' && o.platform !== activePlatform) return false;
    if (filterStatus === 'all') {
      return o.status !== 'completed';
    }
    return o.status === filterStatus;
  });

  // Show ALL dishes, don't filter by platform availability
  const filteredMenu = menu.filter(d => {
    if (menuCategory !== 'All' && d.cat !== menuCategory) return false;
    if (menuSearch && !d.name.toLowerCase().includes(menuSearch.toLowerCase())) return false;
    return true;
  });

  const toggleDishPlatform = (id, platform) => {
    setMenu(prev => prev.map(d => {
      if (d.id === id) {
        const newValue = !d[platform];
        showToast(`✅ ${d.name} ${newValue ? 'added to' : 'removed from'} ${platform.toUpperCase()} menu`);
        return { ...d, [platform]: newValue };
      }
      return d;
    }));
  };

  const openEdit = (dish) => {
    setEditingDish(dish.id);
    setEditForm({
      name: dish.name,
      price: dish.price,
      cat: dish.cat,
      veg: dish.veg,
      emoji: dish.emoji,
      swiggy: dish.swiggy,
      zomato: dish.zomato,
      time: dish.time
    });
  };

  const saveEdit = () => {
    if (!editForm.name.trim() || !editForm.price) { showToast('⚠ Name and price required'); return; }
    setMenu(prev => prev.map(d => d.id === editingDish ? { ...d, ...editForm, price: Number(editForm.price) } : d));
    setEditingDish(null);
    showToast('✅ Dish updated!');
  };

  const addDish = () => {
    if (!newDish.name.trim() || !newDish.price) { showToast('⚠ Name and price required'); return; }
    const id = Math.max(...menu.map(d => d.id), 0) + 1;
    setMenu(prev => [...prev, { ...newDish, id, price: Number(newDish.price) }]);
    setNewDish(EMPTY_DISH);
    setShowAddForm(false);
    showToast('✅ New dish added!');
  };

  const deleteDish = (id) => {
    if (window.confirm('Delete this dish?')) {
      setMenu(prev => prev.filter(d => d.id !== id));
      showToast('🗑️ Dish deleted');
    }
  };

  const summaryCards = [
    { title: 'Total Orders', value: orders.length, icon: 'ti-receipt', color: 'blue' },
    { title: 'Pending', value: orders.filter(o => o.status === 'pending').length, icon: 'ti-clock', color: 'orange' },
    { title: 'Preparing', value: orders.filter(o => o.status === 'preparing').length, icon: 'ti-tools-kitchen-2', color: 'purple' },
    { title: 'Ready', value: orders.filter(o => o.status === 'ready').length, icon: 'ti-check', color: 'green' },
    { title: 'Completed', value: orders.filter(o => o.status === 'completed').length, icon: 'ti-circle-check', color: 'teal' },
  ];

  return (
    <div className="live-orders-page">
      <div className="live-orders-header">
        <div>
          <h2>Live Orders</h2>
          <p className="page-sub">Real-time orders from Swiggy &amp; Zomato</p>
        </div>
        <div className="header-controls">
          <div className="connection-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <button className="top-btn" onClick={() => setSoundEnabled(v => !v)}>
            <i className={`ti ${soundEnabled ? 'ti-volume-2' : 'ti-volume-off'}`}></i>
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
          <button className="top-btn" onClick={() => setAutoAccept(v => !v)}>
            <i className={`ti ${autoAccept ? 'ti-checkbox-checked' : 'ti-checkbox'}`}></i>
            Auto-Accept
          </button>
        </div>
      </div>

      <div className="page-tabs">
        <button className={`page-tab ${activePage === 'orders' ? 'active' : ''}`} onClick={() => setActivePage('orders')}>
          <i className="ti ti-shopping-cart"></i> Live Orders
          {orders.filter(o => o.status === 'pending').length > 0 && (
            <span className="tab-badge">{orders.filter(o => o.status === 'pending').length}</span>
          )}
        </button>
        <button className={`page-tab ${activePage === 'menu' ? 'active' : ''}`} onClick={() => setActivePage('menu')}>
          <i className="ti ti-menu-2"></i> Menu Manager
          <span className="tab-badge tab-badge--neutral">{menu.length}</span>
        </button>
      </div>

      {activePage === 'orders' && (
        <>
          <div className="platform-tabs">
            <button className={`platform-tab ${activePlatform === 'all' ? 'active' : ''}`} onClick={() => setActivePlatform('all')}>
              <i className="ti ti-apps"></i> All Platforms
            </button>
            <button className={`platform-tab swiggy ${activePlatform === 'swiggy' ? 'active' : ''}`} onClick={() => setActivePlatform('swiggy')}>
              <span className="platform-icon">🟠</span> Swiggy
              <span className="platform-count">{stats.swiggy.total}</span>
            </button>
            <button className={`platform-tab zomato ${activePlatform === 'zomato' ? 'active' : ''}`} onClick={() => setActivePlatform('zomato')}>
              <span className="platform-icon">🔴</span> Zomato
              <span className="platform-count">{stats.zomato.total}</span>
            </button>
          </div>

          <div className="summary-cards">
            {summaryCards.map((c, i) => (
              <div key={i} className={`summary-card ${c.color}`}>
                <div className="card-icon"><i className={`ti ${c.icon}`}></i></div>
                <div className="card-info">
                  <div className="card-value">{c.value}</div>
                  <div className="card-title">{c.title}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="filter-bar">
            <div className="status-filters">
              {['all', 'pending', 'preparing', 'ready', 'completed'].map(s => (
                <button key={s} className={`status-filter ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="orders-grid">
            {filteredOrders.length === 0 ? (
              <div className="empty-orders">
                <i className="ti ti-shopping-cart-off"></i>
                <p>No orders found</p>
                <span>Waiting for new orders...</span>
              </div>
            ) : filteredOrders.map(order => (
              <div key={order.id} className={`order-card ${order.platform} status-${order.status}`} onClick={() => setSelectedOrder(order)}>
                <div className="order-card-header">
                  <div className="platform-badge">
                    <span>{order.platform === 'swiggy' ? '🟠' : '🔴'}</span>
                    <span className="platform-name">{order.platform.toUpperCase()}</span>
                  </div>
                  <div className="order-id">#{order.platformOrderId}</div>
                  <div className="order-time">{getTimeSince(order.orderTime)}</div>
                </div>
                <div className="order-card-body">
                  <div className="customer-info">
                    <div className="customer-name"><i className="ti ti-user"></i> {order.customerName}</div>
                    <div className="order-total">₹{order.total}</div>
                  </div>
                  <div className="items-preview">
                    {order.items.slice(0, 2).map((item, i) => (
                      <div key={i} className="preview-item"><span className="item-qty">{item.qty}x</span> {item.name}</div>
                    ))}
                    {order.items.length > 2 && <div className="more-items">+{order.items.length - 2} more</div>}
                  </div>
                  <div className="est-time"><i className="ti ti-clock"></i> Est. {order.estimatedTime} min</div>
                </div>
                <div className="order-card-footer">
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>{getStatusText(order.status)}</span>
                  {order.status === 'pending' && (
                    <div className="action-buttons">
                      <button className="btn-accept" onClick={e => { e.stopPropagation(); acceptOrder(order.id, order.kotId); }}><i className="ti ti-check"></i> Accept</button>
                      <button className="btn-reject" onClick={e => { e.stopPropagation(); rejectOrder(order.id); }}><i className="ti ti-x"></i> Reject</button>
                    </div>
                  )}
                  {order.status === 'preparing' && (
                    <button className="btn-ready-action" onClick={e => { e.stopPropagation(); updateOrderStatus(order.id, 'ready', order.kotId); }}><i className="ti ti-tools-kitchen-2"></i> Mark Ready</button>
                  )}
                  {order.status === 'ready' && (
                    <button className="btn-complete" onClick={e => { e.stopPropagation(); updateOrderStatus(order.id, 'completed', order.kotId); }}><i className="ti ti-circle-check"></i> Complete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activePage === 'menu' && (
        <div className="menu-manager">
          <div className="menu-topbar">
            <div className="menu-platform-toggle">
              <button className={`mpt-btn swiggy ${menuPlatform === 'swiggy' ? 'active' : ''}`} onClick={() => setMenuPlatform('swiggy')}>🟠 Swiggy Menu</button>
              <button className={`mpt-btn zomato ${menuPlatform === 'zomato' ? 'active' : ''}`} onClick={() => setMenuPlatform('zomato')}>🔴 Zomato Menu</button>
            </div>
            <div className="menu-search-wrap">
              <i className="ti ti-search"></i>
              <input type="text" placeholder="Search dishes…" value={menuSearch} onChange={e => setMenuSearch(e.target.value)} className="menu-search" />
            </div>
            <button className="btn-add-dish" onClick={() => { setShowAddForm(true); setEditingDish(null); }}>
              <i className="ti ti-plus"></i> Add Dish
            </button>
          </div>

          <div className="menu-categories">
            {CATEGORIES.map(cat => (
              <button key={cat} className={`cat-pill ${menuCategory === cat ? 'active' : ''}`} onClick={() => setMenuCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>

          <div className="menu-stats-row">
            <div className="menu-stat">
              <span className="menu-stat__val">{menu.filter(d => d.swiggy).length}</span>
              <span className="menu-stat__label">🟠 On Swiggy</span>
            </div>
            <div className="menu-stat">
              <span className="menu-stat__val">{menu.filter(d => d.zomato).length}</span>
              <span className="menu-stat__label">🔴 On Zomato</span>
            </div>
            <div className="menu-stat">
              <span className="menu-stat__val">{menu.filter(d => d.swiggy && d.zomato).length}</span>
              <span className="menu-stat__label">Both Platforms</span>
            </div>
            <div className="menu-stat">
              <span className="menu-stat__val">{menu.length}</span>
              <span className="menu-stat__label">Total Dishes</span>
            </div>
          </div>

          {showAddForm && (
            <div className="dish-form-card dish-form-card--add">
              <div className="dish-form-title">
                <i className="ti ti-plus"></i> Add New Dish
                <button className="dish-form-close" onClick={() => setShowAddForm(false)}>×</button>
              </div>
              <div className="dish-form-grid">
                <div className="dish-form-field">
                  <label>Emoji</label>
                  <input type="text" value={newDish.emoji} onChange={e => setNewDish(p => ({ ...p, emoji: e.target.value }))} maxLength={2} className="dish-input dish-input--emoji" />
                </div>
                <div className="dish-form-field dish-form-field--wide">
                  <label>Dish Name *</label>
                  <input type="text" value={newDish.name} onChange={e => setNewDish(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Paneer Butter Masala" className="dish-input" />
                </div>
                <div className="dish-form-field">
                  <label>Price (₹) *</label>
                  <input type="number" value={newDish.price} onChange={e => setNewDish(p => ({ ...p, price: e.target.value }))} placeholder="0" className="dish-input" />
                </div>
                <div className="dish-form-field">
                  <label>Time Required</label>
                  <input type="text" value={newDish.time} onChange={e => setNewDish(p => ({ ...p, time: e.target.value }))} placeholder="e.g., 10-15 min" className="dish-input" />
                </div>
                <div className="dish-form-field">
                  <label>Category</label>
                  <select value={newDish.cat} onChange={e => setNewDish(p => ({ ...p, cat: e.target.value }))} className="dish-input">
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="dish-form-field">
                  <label>Type</label>
                  <select value={newDish.veg ? 'veg' : 'nonveg'} onChange={e => setNewDish(p => ({ ...p, veg: e.target.value === 'veg' }))} className="dish-input">
                    <option value="veg">🟢 Veg</option>
                    <option value="nonveg">🔴 Non-Veg</option>
                  </select>
                </div>
                <div className="dish-form-field">
                  <label>Platforms</label>
                  <div className="platform-checks">
                    <label className="pcheck"><input type="checkbox" checked={newDish.swiggy} onChange={e => setNewDish(p => ({ ...p, swiggy: e.target.checked }))} /> 🟠 Swiggy</label>
                    <label className="pcheck"><input type="checkbox" checked={newDish.zomato} onChange={e => setNewDish(p => ({ ...p, zomato: e.target.checked }))} /> 🔴 Zomato</label>
                  </div>
                </div>
              </div>
              <div className="dish-form-actions">
                <button className="dish-btn dish-btn--cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button className="dish-btn dish-btn--save" onClick={addDish}><i className="ti ti-check"></i> Add Dish</button>
              </div>
            </div>
          )}

          {filteredMenu.length === 0 ? (
            <div className="empty-orders">
              <i className="ti ti-bowl"></i>
              <p>No dishes found</p>
              <span>Try a different category or search term</span>
            </div>
          ) : (
            <div className="menu-table-wrap">
              <table className="menu-table">
                <thead>
                  <tr>
                    <th>Dish</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Time Required</th>
                    <th>Type</th>
                    <th className="th-center">🟠 Swiggy</th>
                    <th className="th-center">🔴 Zomato</th>
                    <th className="th-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMenu.map(dish => {
                    const isAvailableOnCurrentPlatform = menuPlatform === 'swiggy' ? dish.swiggy : dish.zomato;

                    return editingDish === dish.id ? (
                      <tr key={dish.id} className="edit-row">
                        <td>
                          <div className="edit-name-cell">
                            <input type="text" value={editForm.emoji} onChange={e => setEditForm(p => ({ ...p, emoji: e.target.value }))} maxLength={2} className="dish-input dish-input--emoji dish-input--sm" />
                            <input type="text" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="dish-input dish-input--sm" placeholder="Dish name" />
                          </div>
                        </td>
                        <td>
                          <select value={editForm.cat} onChange={e => setEditForm(p => ({ ...p, cat: e.target.value }))} className="dish-input dish-input--sm">
                            {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                          </select>
                        </td>
                        <td>
                          <div className="price-input-wrap">
                            <span className="rupee">₹</span>
                            <input type="number" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} className="dish-input dish-input--sm dish-input--price" />
                          </div>
                        </td>
                        <td>
                          <input type="text" value={editForm.time} onChange={e => setEditForm(p => ({ ...p, time: e.target.value }))} className="dish-input dish-input--sm" placeholder="e.g., 10-15 min" />
                        </td>
                        <td>
                          <select value={editForm.veg ? 'veg' : 'nonveg'} onChange={e => setEditForm(p => ({ ...p, veg: e.target.value === 'veg' }))} className="dish-input dish-input--sm">
                            <option value="veg">🟢 Veg</option>
                            <option value="nonveg">🔴 Non-Veg</option>
                          </select>
                        </td>
                        <td className="th-center">
                          <input type="checkbox" checked={editForm.swiggy} onChange={e => setEditForm(p => ({ ...p, swiggy: e.target.checked }))} className="platform-toggle-check" />
                        </td>
                        <td className="th-center">
                          <input type="checkbox" checked={editForm.zomato} onChange={e => setEditForm(p => ({ ...p, zomato: e.target.checked }))} className="platform-toggle-check" />
                        </td>
                        <td className="th-center">
                          <div className="row-actions">
                            <button className="dish-btn dish-btn--save dish-btn--sm" onClick={saveEdit}><i className="ti ti-check"></i></button>
                            <button className="dish-btn dish-btn--cancel dish-btn--sm" onClick={() => setEditingDish(null)}><i className="ti ti-x"></i></button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={dish.id} className={!isAvailableOnCurrentPlatform ? 'disabled-row' : ''}>
                        <td>
                          <div className="dish-name-cell">
                            <span className="dish-emoji">{dish.emoji}</span>
                            <span className="dish-name" style={{ textDecoration: !isAvailableOnCurrentPlatform ? 'line-through' : 'none', opacity: !isAvailableOnCurrentPlatform ? 0.6 : 1 }}>
                              {dish.name}
                              {!isAvailableOnCurrentPlatform && (
                                <span className="disabled-badge" style={{ marginLeft: '8px' }}>⛔ Not on {menuPlatform === 'swiggy' ? 'Swiggy' : 'Zomato'}</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td><span className="cat-tag">{dish.cat}</span></td>
                        <td><span className="price-tag">₹{dish.price}</span></td>
                        <td><span className="time-tag">⏱️ {dish.time}</span></td>
                        <td>
                          <span className={`veg-badge ${dish.veg ? 'veg' : 'nonveg'}`}>
                            {dish.veg ? '🟢 Veg' : '🔴 Non-Veg'}
                          </span>
                        </td>
                        <td className="th-center">
                          <button
                            className={`platform-toggle ${dish.swiggy ? 'on' : 'off'}`}
                            onClick={() => toggleDishPlatform(dish.id, 'swiggy')}
                            title={dish.swiggy ? 'Click to remove from Swiggy' : 'Click to add to Swiggy'}
                          >
                            <span className="toggle-knob"></span>
                          </button>
                        </td>
                        <td className="th-center">
                          <button
                            className={`platform-toggle ${dish.zomato ? 'on' : 'off'}`}
                            onClick={() => toggleDishPlatform(dish.id, 'zomato')}
                            title={dish.zomato ? 'Click to remove from Zomato' : 'Click to add to Zomato'}
                          >
                            <span className="toggle-knob"></span>
                          </button>
                        </td>
                        <td className="th-center">
                          <div className="row-actions">
                            <button className="row-btn row-btn--edit" onClick={() => openEdit(dish)} title="Edit"><i className="ti ti-pencil"></i></button>
                            <button className="row-btn row-btn--delete" onClick={() => deleteDish(dish.id)} title="Delete"><i className="ti ti-trash"></i></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedOrder && (
        <div className="modal-overlay open" onClick={() => setSelectedOrder(null)}>
          <div className="order-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className={`platform-header ${selectedOrder.platform}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>{selectedOrder.platform === 'swiggy' ? '🟠' : '🔴'}</span>
                  <h3>{selectedOrder.platform.toUpperCase()} Order</h3>
                </div>
                <button className="close-modal" onClick={() => setSelectedOrder(null)}>×</button>
              </div>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                {[['Order ID', selectedOrder.platformOrderId], ['Customer', selectedOrder.customerName], ['Phone', selectedOrder.customerPhone], ['Payment', selectedOrder.paymentMethod], ['Order Time', new Date(selectedOrder.orderTime).toLocaleString()]].map(([label, value]) => (
                  <div key={label} className="detail-row"><span className="detail-label">{label}:</span><span className="detail-value">{value}</span></div>
                ))}
              </div>
              <div className="detail-section">
                <h4>Items Ordered</h4>
                <div className="items-list">{selectedOrder.items.map((item, i) => (<div key={i} className="detail-item"><div className="item-info"><span className="item-qty">{item.qty}x</span><span className="item-name">{item.name}</span>{item.special && <span className="item-special">({item.special})</span>}</div><div className="item-price">₹{item.price * item.qty}</div></div>))}</div>
                <div className="order-total-detail"><span>Total</span><span className="total-amount">₹{selectedOrder.total}</span></div>
              </div>
              <div className="detail-section">
                <h4>Delivery Address</h4>
                <p className="address">{selectedOrder.deliveryAddress}</p>
                {selectedOrder.specialInstructions && (<><h4>Special Instructions</h4><p className="instructions">{selectedOrder.specialInstructions}</p></>)}
              </div>
              <div className="modal-actions">
                {selectedOrder.status === 'pending' && (<><button className="btn-reject" onClick={() => { rejectOrder(selectedOrder.id); setSelectedOrder(null); }}>Reject Order</button><button className="btn-accept" onClick={() => { acceptOrder(selectedOrder.id, selectedOrder.kotId); setSelectedOrder(null); }}>Accept Order</button></>)}
                {selectedOrder.status === 'preparing' && (<button className="btn-ready-action" onClick={() => { updateOrderStatus(selectedOrder.id, 'ready', selectedOrder.kotId); setSelectedOrder(null); }}>Mark as Ready</button>)}
                {selectedOrder.status === 'ready' && (<button className="btn-complete" onClick={() => { updateOrderStatus(selectedOrder.id, 'completed', selectedOrder.kotId); setSelectedOrder(null); }}>Complete Order</button>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveOrdersPage;