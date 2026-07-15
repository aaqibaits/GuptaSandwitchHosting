/**
 * services/syncEngine.ts
 * ──────────────────────
 * Background sync engine:
 *   Phone ke SQLite (offline_orders) → Backend API → PostgreSQL (pgAdmin)
 *
 * Flow:
 *   1. getPendingOrders() — SQLite se unsynced orders lo
 *   2. createOrder() API call karo for each
 *   3. Success → markOrderSynced() → pgAdmin mein aa gaya
 *   4. Failure → retry karega next time network aayega
 *
 * Usage:
 *   runSync(token) — jab bhi network online ho jaye
 */

import { getPendingOrders, markOrderSynced, LocalOrder } from './offlineDB';
import { saveLastSyncTime } from './offlineStorage';
import { BASE_URL } from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SyncResult {
  synced: number;    // kitne orders successfully sync hue
  failed: number;    // kitne fail hue
  skipped: number;   // pehle se synced the
}

// ── Core Sync Function ────────────────────────────────────────────────────────

let isSyncing = false; // double sync prevent karo

/**
 * Main sync function — call karo jab internet aaye.
 * Returns how many orders were synced/failed.
 */
export async function runSync(token: string | null): Promise<SyncResult> {
  // Agar already sync chal raha hai to ruko
  if (isSyncing) {
    console.log('⏳ Sync already running, skipping...');
    return { synced: 0, failed: 0, skipped: 0 };
  }

  if (!token) {
    console.log('⚠️ No token available, skipping sync');
    return { synced: 0, failed: 0, skipped: 0 };
  }

  isSyncing = true;
  const result: SyncResult = { synced: 0, failed: 0, skipped: 0 };

  try {
    // Step 1: SQLite se pending orders lo
    const pendingOrders = getPendingOrders();

    if (pendingOrders.length === 0) {
      console.log('✅ Nothing to sync — all orders are up to date');
      await saveLastSyncTime();
      return result;
    }

    console.log(`🔄 Starting sync: ${pendingOrders.length} pending orders...`);

    // Step 2: Har order ko server pe bhejo
    for (const order of pendingOrders) {
      try {
        const serverOrderId = await syncSingleOrder(order, token);

        if (serverOrderId !== null) {
          // Step 3: Sync successful → SQLite mein mark karo
          markOrderSynced(order.id!, serverOrderId);
          result.synced++;
          console.log(`✅ Synced: ${order.kot_number} → Server ID: ${serverOrderId}`);
        } else {
          result.failed++;
          console.log(`❌ Failed to sync: ${order.kot_number}`);
        }
      } catch (err) {
        result.failed++;
        console.error(`❌ Error syncing ${order.kot_number}:`, err);
      }
    }

    // Step 4: Sync time update karo
    if (result.synced > 0) {
      await saveLastSyncTime();
    }

    console.log(`🏁 Sync complete — Synced: ${result.synced}, Failed: ${result.failed}`);
    return result;

  } finally {
    isSyncing = false;
  }
}

// ── Single Order Sync ─────────────────────────────────────────────────────────

/**
 * Ek offline order ko backend API pe bhejo.
 * Returns server order ID on success, null on failure.
 */
async function syncSingleOrder(order: LocalOrder, token: string): Promise<number | null> {
  try {
    // Items JSON parse karo
    const items = JSON.parse(order.items) as Array<{
      id: number;
      qty: number;
      price: number;
    }>;

    // Backend API ka format
    const apiPayload = {
      orderType:     order.order_type === 'dine-in' ? 'dine' : 'parcel',
      paymentMethod: order.payment_method.toLowerCase(),
      discount: {
        type:  order.discount_type === 'pct' ? 'percentage' : 'fixed',
        value: order.discount_value || 0,
      },
      items: items.map(item => ({
        dishId:   item.id,
        quantity: item.qty,
      })),
    };

    // POST /api/pos/orders — tumhara existing backend
    const response = await fetch(`${BASE_URL}/api/pos/orders`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`API Error ${response.status}:`, errText);
      return null;
    }

    const data = await response.json();

    // Server ne order ID aur KOT ID return kiya
    const serverOrderId = data?.data?.order?.id ?? data?.order?.id ?? null;
    const serverKotId = data?.data?.kot?.id ?? data?.kot?.id ?? null;

    // ── KOT Status Sync — SQLite se status ko server pe copy karo ───────────
    if (serverKotId && order.status && order.status !== 'pending') {
      try {
        if (order.status === 'dispatched') {
          console.log(`🔄 Syncing status 'dispatched' for local KOT ${order.kot_number} (Server KOT ID: ${serverKotId})`);
          await fetch(`${BASE_URL}/api/pos/kots/${serverKotId}/dispatch`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        } else if (order.status === 'ready') {
          console.log(`🔄 Syncing status 'ready' for local KOT ${order.kot_number} (Server KOT ID: ${serverKotId})`);
          await fetch(`${BASE_URL}/api/pos/kots/${serverKotId}/ready`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        } else {
          console.log(`🔄 Syncing status '${order.status}' for local KOT ${order.kot_number} (Server KOT ID: ${serverKotId})`);
          await fetch(`${BASE_URL}/api/pos/kots/${serverKotId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ status: order.status }),
          });
        }
      } catch (statusErr) {
        console.error(`⚠️ Failed to sync KOT status for ${order.kot_number}:`, statusErr);
      }
    }

    return serverOrderId ? Number(serverOrderId) : null;

  } catch (error) {
    console.error('Network error during sync:', error);
    return null;
  }
}

/**
 * Sync chal raha hai kya?
 */
export function isSyncRunning(): boolean {
  return isSyncing;
}
