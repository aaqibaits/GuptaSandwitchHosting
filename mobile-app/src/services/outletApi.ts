/**
 * services/outletApi.ts
 * ─────────────────────
 * Maps to backend: /api/outlets  (all require admin JWT)
 *
 * Routes:
 *   GET    /api/outlets                            → getAllOutlets()
 *   GET    /api/outlets/dashboard/stats            → getOutletDashboardStats()
 *   POST   /api/outlets/add-outlet                 → addOutlet()
 *   PUT    /api/outlets/:id                        → updateOutlet()
 *   PUT    /api/outlets/:id/credentials            → updateOutletCredentials()
 *   DELETE /api/outlets/:id                        → deleteOutlet()
 *   PUT    /api/outlets/:id/status                 → toggleOutletStatus()
 *   POST   /api/outlets/:id/users                  → addUserToOutlet()
 *   PUT    /api/outlets/:id/users/:userId          → updateOutletUser()
 *   DELETE /api/outlets/:id/users/:userId          → deleteOutletUser()
 *   PUT    /api/outlets/:id/users/:userId/status   → toggleOutletUserStatus()
 */

import { request, BASE_URL, getToken } from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiOutletUser {
  id: number;
  name: string;
  email: string;
  username: string;
  role_label: string;
  app_role: 'Admin' | 'Staff';
  permissions: { admin: string[]; staff: string[] };
  status: 'active' | 'inactive';
}

export interface ApiOutlet {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager: string;
  email: string;
  username: string;
  status: 'active' | 'inactive';
  users: ApiOutletUser[];
  image_url: string | null;
}

export interface DashboardStats {
  outlets: string[];
  periodData: {
    today: number[];
    yesterday: number[];
    week: number[];
    month: number[];
  };
}


export interface AddOutletPayload {
  name: string;
  address: string;
  phone: string;
  manager: string;
  email?: string;
  username: string;
  password: string;
}

export interface UpdateOutletPayload {
  name?: string;
  address?: string;
  phone?: string;
  manager?: string;
  email?: string;
  username?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateOutletCredsPayload {
  username: string;
  password: string;
}

export interface AddUserPayload {
  name: string;
  email?: string;
  username: string;
  password: string;
  role_label: string;
  app_role: 'Admin' | 'Staff';
  permissions: { admin: string[]; staff: string[] };
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  username?: string;
  password?: string;
  role_label?: string;
  app_role?: 'Admin' | 'Staff';
  permissions?: { admin: string[]; staff: string[] };
  status?: 'active' | 'inactive';
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function getAllOutlets(): Promise<{ success: boolean; outlets: ApiOutlet[] }> {
  const res = await request<{ success: boolean; data: ApiOutlet[] }>('GET', '/api/outlets');
  return { success: res.success, outlets: res.data };
}

export async function getOutletDashboardStats(): Promise<{ success: boolean; stats: DashboardStats }> {
  const res = await request<{ success: boolean; data: DashboardStats }>('GET', '/api/outlets/dashboard/stats');
  return { success: res.success, stats: res.data };
}

export async function addOutlet(data: AddOutletPayload): Promise<{ success: boolean; outlet: ApiOutlet }> {
  const res = await request<{ success: boolean; data: ApiOutlet }>('POST', '/api/outlets/add-outlet', data);
  return { success: res.success, outlet: res.data };
}

export async function updateOutlet(
  id: number,
  data: UpdateOutletPayload,
): Promise<{ success: boolean; outlet: ApiOutlet }> {
  const res = await request<{ success: boolean; data: ApiOutlet }>('PUT', `/api/outlets/${id}`, data);
  return { success: res.success, outlet: res.data };
}

export async function updateOutletCredentials(
  id: number,
  data: UpdateOutletCredsPayload,
): Promise<{ success: boolean }> {
  return request('PUT', `/api/outlets/${id}/credentials`, data);
}

export async function deleteOutlet(id: number): Promise<{ success: boolean }> {
  return request('DELETE', `/api/outlets/${id}`);
}

export async function toggleOutletStatus(id: number): Promise<{ success: boolean; status: string }> {
  const res = await request<{ success: boolean; data: ApiOutlet }>('PUT', `/api/outlets/${id}/status`);
  return { success: res.success, status: res.data.status };
}

export async function addUserToOutlet(
  outletId: number,
  data: AddUserPayload,
): Promise<{ success: boolean; user: ApiOutletUser }> {
  const res = await request<{ success: boolean; data: ApiOutletUser }>('POST', `/api/outlets/${outletId}/users`, data);
  return { success: res.success, user: res.data };
}

export async function updateOutletUser(
  outletId: number,
  userId: number,
  data: UpdateUserPayload,
): Promise<{ success: boolean; user: ApiOutletUser }> {
  const res = await request<{ success: boolean; data: ApiOutletUser }>('PUT', `/api/outlets/${outletId}/users/${userId}`, data);
  return { success: res.success, user: res.data };
}

export async function deleteOutletUser(
  outletId: number,
  userId: number,
): Promise<{ success: boolean }> {
  return request('DELETE', `/api/outlets/${outletId}/users/${userId}`);
}

export async function toggleOutletUserStatus(
  outletId: number,
  userId: number,
): Promise<{ success: boolean; status: string }> {
  const res = await request<{ success: boolean; data: ApiOutletUser }>('PUT', `/api/outlets/${outletId}/users/${userId}/status`);
  return { success: res.success, status: res.data.status };
}

/**
 * Upload an outlet image (multipart/form-data).
 * Admin only.
 */
export async function uploadOutletImage(
  outletId: number,
  imageUri: string,
  mimeType = 'image/jpeg',
): Promise<{ success: boolean; outlet: ApiOutlet }> {
  const formData = new FormData();
  formData.append('image', { uri: imageUri, name: `outlet_${outletId}.jpg`, type: mimeType } as any);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}/api/outlets/${outletId}`, {
    method: 'PUT',
    headers,
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || 'Image upload failed');
  return { success: data.success, outlet: data.data };
}

