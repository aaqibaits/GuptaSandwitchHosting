/**
 * services/authApi.ts
 * ───────────────────
 * Maps to backend: /api/auth
 *
 * Routes:
 *   POST /api/auth/admin/login  → loginAdmin()
 *   POST /api/auth/user/login   → loginUser()
 *   GET  /api/auth/me           → getMe()
 *   POST /api/auth/logout       → logout()
 */

import { request } from './api';

// ── Response types ─────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  uuid: string;
  name: string;
  email: string;
  username: string;
  phone: string | null;
  role: string;
  is_super_admin: boolean;
  permissions: any;
  status: string;
}

export interface StaffUser {
  id: number;
  uuid: string;
  outlet_id: number;
  name: string;
  email: string;
  username: string;
  role_label: string;
  app_role: 'Admin' | 'Staff';
  permissions: { admin: string[]; staff: string[] };
  status: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: AdminUser | StaffUser;
}

export interface MeResponse {
  success: boolean;
  userType: 'admin' | 'user';
  user: AdminUser | StaffUser;
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/admin/login
 * Authenticate an admin (HQ) account.
 */
export async function loginAdmin(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>('POST', '/api/auth/admin/login', { email, password });
}

/**
 * POST /api/auth/user/login
 * Authenticate a staff / outlet user account.
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>('POST', '/api/auth/user/login', { email, password });
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user from the JWT.
 * Requires token to be set via setToken().
 */
export async function getMe(): Promise<MeResponse> {
  return request<MeResponse>('GET', '/api/auth/me');
}

/**
 * POST /api/auth/logout
 * Invalidates the current session on the server.
 */
export async function logout(): Promise<{ success: boolean; message: string }> {
  return request('POST', '/api/auth/logout');
}
