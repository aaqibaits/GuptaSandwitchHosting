/**
 * services/auditApi.ts
 * ────────────────────
 * Maps to backend: /api/audit-logs  (requires admin JWT)
 *
 * Routes:
 *   GET /api/audit-logs  → fetchLogs()
 */

import { request, buildQuery } from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  admin_id: number | null;
  user_id: number | null;
  outlet_id: number | null;
  ip_address: string | null;
  old_values: any;
  new_values: any;
  created_at: string;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  action?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * GET /api/audit-logs
 * Fetches audit logs. Requires admin JWT.
 */
export async function fetchLogs(
  params?: AuditLogParams,
): Promise<{ success: boolean; logs: AuditLog[]; total: number; page: number }> {
  return request('GET', `/api/audit-logs${buildQuery(params as any)}`);
}
