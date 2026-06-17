/**
 * services/api.ts
 * ───────────────
 * Base HTTP client for all API calls.
 * Uses native fetch (no external deps — works on Expo / React Native).
 *
 * Usage:
 *   import { request, setToken } from './api';
 *   setToken(jwt);                        // call after login
 *   const data = await request<MyType>('GET', '/api/dishes');
 */


// This must match your machine's current Wi-Fi LAN IP (run `ipconfig` to check).
// Android emulator → http://10.0.2.2:5000
// iOS simulator    → http://localhost:5000
// Physical device  → http://<YOUR_LAN_IP>:5000
export const BASE_URL = 'https://guptasandwich.work-desk.tech';

// ── Token store ───────────────────────────────────────────────────────────────
let _token: string | null = null;

export function setToken(token: string | null): void {
  _token = token;
}

export function getToken(): string | null {
  return _token;
}

// ── Custom error class ────────────────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ── Query param helper ────────────────────────────────────────────────────────
export function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (filtered.length === 0) return '';
  return '?' + filtered.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

// ── Core request function ─────────────────────────────────────────────────────
export async function request<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: object | FormData,
): Promise<T> {
  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = {};

  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  // Don't set Content-Type for FormData — let fetch set it (with boundary)
  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body
      ? isFormData
        ? (body as FormData)
        : JSON.stringify(body)
      : undefined,
  });

  // Parse response body
  let responseData: any;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    const message =
      (typeof responseData === 'object' && responseData?.message) ||
      `HTTP ${response.status}`;
    throw new ApiError(response.status, message, responseData);
  }

  return responseData as T;
}
