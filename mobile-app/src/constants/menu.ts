/**
 * menu.ts
 * ───────
 * Complete Gupta Sandwich menu — 94 items.
 * Identical to DEFAULT_MENU_ITEMS in the web App.js.
 */

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  cat: string;
  veg: boolean;
  emoji: string;
}

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 1,  name: 'Veggie Cheesy Grilled (Jumbo)',           price: 150, cat: 'Grilled Sandwiches',      veg: true, emoji: '🥪' },
  { id: 2,  name: 'Veggie Cheesy Grilled (Mini)',            price: 120, cat: 'Grilled Sandwiches',      veg: true, emoji: '🥪' },
  { id: 3,  name: 'Spinach Corn Cheesy Grilled (Jumbo)',     price: 170, cat: 'Grilled Sandwiches',      veg: true, emoji: '🥪' },
  { id: 4,  name: 'Spinach Corn Cheesy Grilled (Mini)',      price: 140, cat: 'Grilled Sandwiches',      veg: true, emoji: '🥪' },
  { id: 5,  name: 'Paneer Cheesy Grilled (Jumbo)',           price: 170, cat: 'Grilled Sandwiches',      veg: true, emoji: '🧀' },
  { id: 6,  name: 'Paneer Cheesy Grilled (Mini)',            price: 140, cat: 'Grilled Sandwiches',      veg: true, emoji: '🧀' },
  { id: 7,  name: 'Mayo Grilled Sandwich (Jumbo)',           price: 160, cat: 'Grilled Sandwiches',      veg: true, emoji: '🥪' },
  { id: 8,  name: 'Mayo Grilled Sandwich (Mini)',            price: 130, cat: 'Grilled Sandwiches',      veg: true, emoji: '🥪' },
  { id: 9,  name: 'Masala Cheesy Grilled (Jumbo)',           price: 160, cat: 'Grilled Sandwiches',      veg: true, emoji: '🌶️' },
  { id: 10, name: 'Masala Cheesy Grilled (Mini)',            price: 130, cat: 'Grilled Sandwiches',      veg: true, emoji: '🌶️' },
  { id: 11, name: 'Paneer Chilly Cheesy Grilled (Jumbo)',    price: 170, cat: 'Grilled Sandwiches',      veg: true, emoji: '🧀' },
  { id: 12, name: 'Paneer Chilly Cheesy Grilled (Mini)',     price: 140, cat: 'Grilled Sandwiches',      veg: true, emoji: '🧀' },
  { id: 13, name: 'Samosa Cheesy Grilled (Jumbo)',           price: 160, cat: 'Grilled Sandwiches',      veg: true, emoji: '🥟' },
  { id: 14, name: 'Samosa Cheesy Grilled (Mini)',            price: 130, cat: 'Grilled Sandwiches',      veg: true, emoji: '🥟' },
  { id: 15, name: 'Jain Samosa Cheesy Grilled (Jumbo)',      price: 170, cat: 'Grilled Sandwiches',      veg: true, emoji: '🥟' },
  { id: 16, name: 'Jain Samosa Cheesy Grilled (Mini)',       price: 140, cat: 'Grilled Sandwiches',      veg: true, emoji: '🥟' },
  { id: 17, name: 'Pahadi Cheesy Grilled (Jumbo)',           price: 170, cat: 'Grilled Sandwiches',      veg: true, emoji: '🏔️' },
  { id: 18, name: 'Pahadi Cheesy Grilled (Mini)',            price: 140, cat: 'Grilled Sandwiches',      veg: true, emoji: '🏔️' },
  { id: 19, name: 'Chilly Cheesy Grilled (Jumbo)',           price: 170, cat: 'Grilled Sandwiches',      veg: true, emoji: '🌶️' },
  { id: 20, name: 'Chilly Cheesy Grilled (Mini)',            price: 140, cat: 'Grilled Sandwiches',      veg: true, emoji: '🌶️' },
  { id: 21, name: 'Makhani Paneer Cheesy Grilled (Jumbo)',   price: 170, cat: 'Grilled Sandwiches',      veg: true, emoji: '🧀' },
  { id: 22, name: 'Makhani Paneer Cheesy Grilled (Mini)',    price: 140, cat: 'Grilled Sandwiches',      veg: true, emoji: '🧀' },
  { id: 23, name: 'Mushroom Cheesy Grilled (Jumbo)',         price: 170, cat: 'Grilled Sandwiches',      veg: true, emoji: '🍄' },
  { id: 24, name: 'Mushroom Cheesy Grilled (Mini)',          price: 140, cat: 'Grilled Sandwiches',      veg: true, emoji: '🍄' },
  { id: 25, name: 'Diet Grilled (Jumbo)',                    price: 120, cat: 'Grilled Sandwiches',      veg: true, emoji: '🥗' },
  { id: 26, name: 'Diet Grilled (Mini)',                     price: 90,  cat: 'Grilled Sandwiches',      veg: true, emoji: '🥗' },
  { id: 27, name: 'Veggie Grilled (Without Cheese) Jumbo',  price: 100, cat: 'Grilled Sandwiches',      veg: true, emoji: '🥪' },
  { id: 28, name: 'Insalta Garlic Bread',                   price: 150, cat: 'Special Grilled / Panini', veg: true, emoji: '🍞' },
  { id: 29, name: 'Paneer Tikka Panini',                    price: 170, cat: 'Special Grilled / Panini', veg: true, emoji: '🧀' },
  { id: 30, name: 'Paneer Schez. Cheese Panini',            price: 170, cat: 'Special Grilled / Panini', veg: true, emoji: '🧀' },
  { id: 31, name: 'Mushroom Schez. Cheese',                 price: 170, cat: 'Special Grilled / Panini', veg: true, emoji: '🍄' },
  { id: 32, name: 'Gupta Special Panini',                   price: 200, cat: 'Special Grilled / Panini', veg: true, emoji: '⭐' },
  { id: 33, name: 'Veggie Toast Sandwich',                  price: 50,  cat: 'Sandwiches',               veg: true, emoji: '🍞' },
  { id: 34, name: 'Sada Sandwich',                          price: 45,  cat: 'Sandwiches',               veg: true, emoji: '🥪' },
  { id: 35, name: 'Diet Toast Sandwich',                    price: 45,  cat: 'Sandwiches',               veg: true, emoji: '🥗' },
  { id: 36, name: 'Masala Toast Sandwich',                  price: 60,  cat: 'Sandwiches',               veg: true, emoji: '🌶️' },
  { id: 37, name: 'Chocolate Bites Toast Sandwich',         price: 60,  cat: 'Sandwiches',               veg: true, emoji: '🍫' },
  { id: 38, name: 'Jam Toast Sandwich',                     price: 55,  cat: 'Sandwiches',               veg: true, emoji: '🍓' },
  { id: 39, name: 'Veggie Mayo Toast Sandwich',             price: 70,  cat: 'Sandwiches',               veg: true, emoji: '🥪' },
  { id: 40, name: 'Veggie Cheese Toast Sandwich',           price: 75,  cat: 'Sandwiches',               veg: true, emoji: '🧀' },
  { id: 41, name: 'Chilly Cheese Toast Sandwich',           price: 80,  cat: 'Sandwiches',               veg: true, emoji: '🌶️' },
  { id: 42, name: 'Veggie Delight Panini',                  price: 140, cat: 'Panini (Multi-grain)',      veg: true, emoji: '🥪' },
  { id: 43, name: 'Mexican Panini',                         price: 140, cat: 'Panini (Multi-grain)',      veg: true, emoji: '🌮' },
  { id: 44, name: 'Regular Panini',                         price: 130, cat: 'Panini (Multi-grain)',      veg: true, emoji: '🥪' },
  { id: 45, name: 'Double Cheese Butter Panini',            price: 150, cat: 'Panini (Multi-grain)',      veg: true, emoji: '🧀' },
  { id: 46, name: 'Margherita Pizza (9 Inch)',              price: 180, cat: 'Pizza',                    veg: true, emoji: '🍕' },
  { id: 47, name: 'Margherita Pizza (6 Inch)',              price: 140, cat: 'Pizza',                    veg: true, emoji: '🍕' },
  { id: 48, name: 'Simple Best Pizza (9 Inch)',             price: 200, cat: 'Pizza',                    veg: true, emoji: '🍕' },
  { id: 49, name: 'Simple Best Pizza (6 Inch)',             price: 150, cat: 'Pizza',                    veg: true, emoji: '🍕' },
  { id: 50, name: 'Hot and Spicy Pizza (9 Inch)',           price: 200, cat: 'Pizza',                    veg: true, emoji: '🌶️' },
  { id: 51, name: 'Hot and Spicy Pizza (6 Inch)',           price: 150, cat: 'Pizza',                    veg: true, emoji: '🌶️' },
  { id: 52, name: 'Corn Peas Pizza (9 Inch)',               price: 200, cat: 'Pizza',                    veg: true, emoji: '🌽' },
  { id: 53, name: 'Corn Peas Pizza (6 Inch)',               price: 150, cat: 'Pizza',                    veg: true, emoji: '🌽' },
  { id: 54, name: 'Traditional Gupta Style Pizza (9 Inch)', price: 250, cat: 'Pizza',                    veg: true, emoji: '🍕' },
  { id: 55, name: 'Traditional Gupta Style Pizza (6 Inch)', price: 200, cat: 'Pizza',                    veg: true, emoji: '🍕' },
  { id: 56, name: 'Paneer Lovers Chatkara Pizza (9 Inch)', price: 250, cat: 'Pizza',                    veg: true, emoji: '🧀' },
  { id: 57, name: 'Paneer Lovers Chatkara Pizza (6 Inch)', price: 200, cat: 'Pizza',                    veg: true, emoji: '🧀' },
  { id: 58, name: 'Exotic Pizza (9 Inch)',                  price: 250, cat: 'Pizza',                    veg: true, emoji: '🍕' },
  { id: 59, name: 'Exotic Pizza (6 Inch)',                  price: 200, cat: 'Pizza',                    veg: true, emoji: '🍕' },
  { id: 60, name: 'Tandoori Paneer Pizza (9 Inch)',         price: 270, cat: 'Pizza',                    veg: true, emoji: '🔥' },
  { id: 61, name: 'Tandoori Paneer Pizza (6 Inch)',         price: 230, cat: 'Pizza',                    veg: true, emoji: '🔥' },
  { id: 62, name: 'Veg Burger',                            price: 50,  cat: 'Burgers',                  veg: true, emoji: '🍔' },
  { id: 63, name: 'Veg Cheese Burger',                     price: 75,  cat: 'Burgers',                  veg: true, emoji: '🍔' },
  { id: 64, name: 'Schezwan Cheese Burger',                price: 75,  cat: 'Burgers',                  veg: true, emoji: '🍔' },
  { id: 65, name: 'Mexican Cheese Burger',                 price: 75,  cat: 'Burgers',                  veg: true, emoji: '🌮' },
  { id: 66, name: 'Tandoori Cheese Burger',                price: 80,  cat: 'Burgers',                  veg: true, emoji: '🔥' },
  { id: 67, name: 'Jain Cheese Burger',                    price: 80,  cat: 'Burgers',                  veg: true, emoji: '🍔' },
  { id: 68, name: 'Garlic Bread (4 pcs)',                  price: 90,  cat: 'Appetizers',               veg: true, emoji: '🥖' },
  { id: 69, name: 'Garlic Bread with Cheese (4 pcs)',      price: 110, cat: 'Appetizers',               veg: true, emoji: '🧀' },
  { id: 70, name: 'Garlic Bread Spicy Chatkara (4 pcs)',   price: 120, cat: 'Appetizers',               veg: true, emoji: '🌶️' },
  { id: 71, name: 'French Fries',                          price: 90,  cat: 'Appetizers',               veg: true, emoji: '🍟' },
  { id: 72, name: 'French Fries with Peri Peri',           price: 120, cat: 'Appetizers',               veg: true, emoji: '🍟' },
  { id: 73, name: 'Fresh Lime',                            price: 70,  cat: 'Mocktails',                veg: true, emoji: '🍋' },
  { id: 74, name: 'Lemon Ice Tea',                         price: 70,  cat: 'Mocktails',                veg: true, emoji: '🍋' },
  { id: 75, name: 'Mint Mojito Blast',                     price: 90,  cat: 'Mocktails',                veg: true, emoji: '🌿' },
  { id: 76, name: 'Blue Lagoon Mojito',                    price: 90,  cat: 'Mocktails',                veg: true, emoji: '💙' },
  { id: 77, name: 'Chocolate Shake',                       price: 80,  cat: 'Shakes & Smoothies',       veg: true, emoji: '🍫' },
  { id: 78, name: 'Butterscotch Milkshake',                price: 80,  cat: 'Shakes & Smoothies',       veg: true, emoji: '🥤' },
  { id: 79, name: 'Kesar Thandai Milkshake',               price: 80,  cat: 'Shakes & Smoothies',       veg: true, emoji: '🥤' },
  { id: 80, name: 'Pista Milkshake',                       price: 80,  cat: 'Shakes & Smoothies',       veg: true, emoji: '🥤' },
  { id: 81, name: 'Rose Milkshake',                        price: 80,  cat: 'Shakes & Smoothies',       veg: true, emoji: '🌹' },
  { id: 82, name: 'Cold Coffee',                           price: 100, cat: 'Shakes & Smoothies',       veg: true, emoji: '☕' },
  { id: 83, name: 'Grilled Sandwich Combo',                price: 250, cat: 'Combos',                   veg: true, emoji: '📦' },
  { id: 84, name: 'Panini Combo',                          price: 250, cat: 'Combos',                   veg: true, emoji: '📦' },
  { id: 85, name: 'Pizza Combo',                           price: 350, cat: 'Combos',                   veg: true, emoji: '📦' },
  { id: 86, name: 'Party Combo Box 1',                     price: 100, cat: 'Party Combo Boxes',        veg: true, emoji: '📦' },
  { id: 87, name: 'Party Combo Box 2',                     price: 120, cat: 'Party Combo Boxes',        veg: true, emoji: '📦' },
  { id: 88, name: 'Party Combo Box 3',                     price: 150, cat: 'Party Combo Boxes',        veg: true, emoji: '📦' },
  { id: 89, name: 'Party Combo Box 4',                     price: 160, cat: 'Party Combo Boxes',        veg: true, emoji: '📦' },
  { id: 90, name: 'Extra Cheese',                          price: 30,  cat: 'Extra Add-ons',            veg: true, emoji: '🧀' },
  { id: 91, name: 'Extra Wafers',                          price: 30,  cat: 'Extra Add-ons',            veg: true, emoji: '🍪' },
  { id: 92, name: 'Extra Paneer',                          price: 20,  cat: 'Extra Add-ons',            veg: true, emoji: '🧀' },
  { id: 93, name: 'Extra Mushroom',                        price: 20,  cat: 'Extra Add-ons',            veg: true, emoji: '🍄' },
  { id: 94, name: 'Extra Mayo',                            price: 20,  cat: 'Extra Add-ons',            veg: true, emoji: '🥚' },
];

export const OUTLETS = ['Koregaon Park', 'Baner', 'Kothrud'] as const;
export type OutletName = typeof OUTLETS[number];

export const VALID_CREDENTIALS = [
  { email: 'admin@guptasandwich.com', password: 'admin123', role: 'Admin' as const },
  { email: 'staff@guptasandwich.com', password: 'staff123', role: 'Staff' as const },
];
