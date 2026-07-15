import * as SQLite from 'expo-sqlite';

// ── Database open ────────────────────────────────────────────────────────────
// Yeh automatically gupta_offline.db file phone mein bana deta hai
const db = SQLite.openDatabaseSync('gupta_offline.db');

// ── Types ────────────────────────────────────────────────────────────────────

export interface LocalOrder {
  id?: number;
  kot_number: string;
  order_type: string;       // 'dine-in' | 'parcel'
  table_label: string;
  payment_method: string;   // 'Cash' | 'UPI' | 'Card' | 'Online'
  items: string;            // JSON stringified CartItem[]
  subtotal: number;
  total: number;
  discount_type: string;    // 'pct' | 'flat'
  discount_value: number;
  created_at: string;       // ISO string
  synced: number;           // 0 = pending, 1 = synced to server
  server_order_id?: number; // server se mila hua order id after sync
  status: string;           // 'pending' | 'preparing' | 'ready' | 'dispatched' | 'cancelled'
}

export interface LocalMenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  dine_price: number;
  parcel_price: number;
  emoji: string;
  is_available: number;     // SQLite has no boolean, 0/1 use karo
  image_url: string | null;
  updated_at: string;
}

// ── Database Initialization ──────────────────────────────────────────────────

/**
 * App start hone pe ek baar call karo.
 * Tables already exist karein to CREATE IF NOT EXISTS kuch nahi karega.
 */
export function initDatabase(): void {
  try {
    // Offline orders table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS offline_orders (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        kot_number       TEXT NOT NULL,
        order_type       TEXT NOT NULL,
        table_label      TEXT NOT NULL,
        payment_method   TEXT NOT NULL,
        items            TEXT NOT NULL,
        subtotal         REAL NOT NULL DEFAULT 0,
        total            REAL NOT NULL DEFAULT 0,
        discount_type    TEXT NOT NULL DEFAULT 'pct',
        discount_value   REAL NOT NULL DEFAULT 0,
        created_at       TEXT NOT NULL,
        synced           INTEGER NOT NULL DEFAULT 0,
        server_order_id  INTEGER,
        status           TEXT NOT NULL DEFAULT 'pending'
      );
    `);

    // Migration: add status column to offline_orders if it doesn't exist
    try {
      db.execSync("ALTER TABLE offline_orders ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';");
      console.log('✅ Migrated SQLite DB: status column added to offline_orders');
    } catch (e) {
      // Column already exists, safe to ignore
    }

    // Menu cache table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS menu_cache (
        id           INTEGER PRIMARY KEY,
        name         TEXT NOT NULL,
        category     TEXT NOT NULL,
        price        REAL NOT NULL DEFAULT 0,
        dine_price   REAL NOT NULL DEFAULT 0,
        parcel_price REAL NOT NULL DEFAULT 0,
        emoji        TEXT DEFAULT '🍔',
        is_available INTEGER NOT NULL DEFAULT 1,
        image_url    TEXT,
        updated_at   TEXT NOT NULL
      );
    `);

    console.log('✅ Offline SQLite DB initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize offline DB:', error);
  }
}

// ── Offline Orders — CRUD ────────────────────────────────────────────────────

/**
 * Phone ke SQLite mein ek nayi order save karo.
 * Returns the newly created local ID.
 */
export function saveOrderLocally(order: Omit<LocalOrder, 'id' | 'synced' | 'server_order_id' | 'status'>): number {
  try {
    const result = db.runSync(
      `INSERT INTO offline_orders
        (kot_number, order_type, table_label, payment_method, items,
         subtotal, total, discount_type, discount_value, created_at, synced, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending')`,
      [
        order.kot_number,
        order.order_type,
        order.table_label,
        order.payment_method,
        order.items,
        order.subtotal,
        order.total,
        order.discount_type,
        order.discount_value,
        order.created_at,
      ]
    );
    console.log(`📦 Order saved locally: ${order.kot_number} (id: ${result.lastInsertRowId})`);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('❌ Failed to save order locally:', error);
    return -1;
  }
}

/**
 * Saare local orders lo (latest first).
 */
export function getLocalOrders(): LocalOrder[] {
  try {
    const rows = db.getAllSync<LocalOrder>(
      'SELECT * FROM offline_orders ORDER BY created_at DESC'
    );
    return rows;
  } catch (error) {
    console.error('❌ Failed to get local orders:', error);
    return [];
  }
}

/**
 * Sirf wo orders lo jo abhi tak server pe sync nahi hue.
 */
export function getPendingOrders(): LocalOrder[] {
  try {
    const rows = db.getAllSync<LocalOrder>(
      'SELECT * FROM offline_orders WHERE synced = 0 ORDER BY created_at ASC'
    );
    return rows;
  } catch (error) {
    console.error('❌ Failed to get pending orders:', error);
    return [];
  }
}

/**
 * Pending orders ka count do.
 */
export function getPendingOrdersCount(): number {
  try {
    const result = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM offline_orders WHERE synced = 0'
    );
    return result?.count ?? 0;
  } catch (error) {
    console.error('❌ Failed to get pending count:', error);
    return 0;
  }
}

/**
 * Server pe successfully sync hone ke baad order ko synced mark karo.
 */
export function markOrderSynced(localId: number, serverOrderId?: number): void {
  try {
    db.runSync(
      'UPDATE offline_orders SET synced = 1, server_order_id = ? WHERE id = ?',
      [serverOrderId ?? null, localId]
    );
    console.log(`✅ Order ${localId} marked as synced (server id: ${serverOrderId})`);
  } catch (error) {
    console.error('❌ Failed to mark order as synced:', error);
  }
}

/**
 * Ek specific order delete karo (id se).
 */
export function deleteLocalOrder(localId: number): void {
  try {
    db.runSync('DELETE FROM offline_orders WHERE id = ?', [localId]);
  } catch (error) {
    console.error('❌ Failed to delete local order:', error);
  }
}

/**
 * Local offline order ka status (e.g. dispatched, cancelled, preparing) update karo.
 */
export function updateLocalOrderStatus(localId: number, status: string): void {
  try {
    db.runSync(
      'UPDATE offline_orders SET status = ? WHERE id = ?',
      [status, localId]
    );
    console.log(`✅ Local order ${localId} status updated to: ${status}`);
  } catch (error) {
    console.error('❌ Failed to update local order status:', error);
  }
}

// ── Menu Cache — CRUD ────────────────────────────────────────────────────────

/**
 * Server se aaya menu phone mein cache karo.
 * Pehle purana data delete karo, phir naaya insert karo.
 */
export function saveMenuToCache(items: LocalMenuItem[]): void {
  try {
    // Purana menu clear karo
    db.runSync('DELETE FROM menu_cache');

    // Naaya menu insert karo
    for (const item of items) {
      db.runSync(
        `INSERT OR REPLACE INTO menu_cache
          (id, name, category, price, dine_price, parcel_price, emoji, is_available, image_url, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.name,
          item.category,
          item.price,
          item.dine_price,
          item.parcel_price,
          item.emoji,
          item.is_available,
          item.image_url ?? null,
          item.updated_at,
        ]
      );
    }
    console.log(`📋 Menu cached: ${items.length} items`);
  } catch (error) {
    console.error('❌ Failed to cache menu:', error);
  }
}

/**
 * Cached menu lo from SQLite.
 * Returns empty array if no cache exists.
 */
export function getCachedMenu(): LocalMenuItem[] {
  try {
    const rows = db.getAllSync<LocalMenuItem>(
      'SELECT * FROM menu_cache WHERE is_available = 1 ORDER BY name ASC'
    );
    return rows;
  } catch (error) {
    console.error('❌ Failed to get cached menu:', error);
    return [];
  }
}

/**
 * Kitne menu items cache mein hain.
 */
export function getCachedMenuCount(): number {
  try {
    const result = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM menu_cache'
    );
    return result?.count ?? 0;
  } catch (error) {
    return 0;
  }
}

// ── Utility ──────────────────────────────────────────────────────────────────

/**
 * Debug: saare offline orders print karo (development ke liye).
 */
export function debugPrintAllOrders(): void {
  const orders = getLocalOrders();
  console.log('=== Offline Orders ===');
  orders.forEach(o => {
    console.log(`${o.kot_number} | ${o.order_type} | ₹${o.total} | synced=${o.synced}`);
  });
  console.log(`Total: ${orders.length}`);
}
