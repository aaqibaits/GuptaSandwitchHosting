/**
 * services/dishesApi.ts
 * ─────────────────────
 * Maps to backend: /api/dishes
 *
 * Routes:
 *   GET    /api/dishes             → getDishes()       (any authenticated)
 *   GET    /api/dishes/categories  → getCategories()   (any authenticated)
 *   POST   /api/dishes             → createDish()      (admin only, multipart)
 *   PUT    /api/dishes/:id         → editDish()        (admin only, multipart)
 *   DELETE /api/dishes/:id         → removeDish()      (admin only)
 */

import { request, BASE_URL, getToken } from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiDish {
  id: number;
  name: string;
  category: string;
  dine_price: number;
  parcel_price: number;
  swiggy_price: number | null;
  zomato_price: number | null;
  ingredients: string[];
  image_url: string | null;
  is_available: boolean;
  outlets: string[];
}

export interface ApiCategory {
  id: number;
  name: string;
  emoji?: string;
}

export interface CreateDishPayload {
  name: string;
  category: string;
  dine_price: number;
  parcel_price: number;
  swiggy_price?: number | null;
  zomato_price?: number | null;
  ingredients?: string;
  outlet_ids?: number[];
  outlets?: string[];
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function getDishes(): Promise<{ success: boolean; dishes: ApiDish[] }> {
  const res = await request<any[]>('GET', '/api/dishes');
  const dishes: ApiDish[] = res.map((d: any) => ({
    id: d.id,
    name: d.name,
    category: d.cat ?? '',
    dine_price: Number(d.dine_price ?? d.dine_price ?? 0),
    parcel_price: Number(d.parcel_price ?? 0),
    swiggy_price: d.swiggy_price !== null ? Number(d.swiggy_price) : null,
    zomato_price: d.zomato_price !== null ? Number(d.zomato_price) : null,
    ingredients: Array.isArray(d.ingredients) ? d.ingredients : [],
    image_url: d.image_url ?? null,
    is_available: d.is_available ?? true,
    outlets: Array.isArray(d.outlets) ? d.outlets : ['All'],
  }));
  return { success: true, dishes };
}

export async function getCategories(): Promise<{ success: boolean; categories: ApiCategory[] }> {
  const res = await request<any[]>('GET', '/api/dishes/categories');
  return { success: true, categories: res };
}

/**
 * POST /api/dishes
 * Creates a dish. Sends JSON (image upload handled separately).
 * Admin only.
 */
export async function createDish(
  data: CreateDishPayload,
): Promise<{ success: boolean; dish: ApiDish }> {
  const body = {
    name: data.name,
    category: data.category,
    dine_price: data.dine_price,
    parcel_price: data.parcel_price,
    swiggy_price: data.swiggy_price,
    zomato_price: data.zomato_price,
    ingredients: data.ingredients,
    outlets: data.outlets,
  };

  const res = await request<any>('POST', '/api/dishes', body);
  const dish: ApiDish = {
    id: res.id,
    name: res.name,
    category: res.category_name ?? '',
    dine_price: Number(res.dine_price ?? 0),
    parcel_price: Number(res.parcel_price ?? 0),
    swiggy_price: res.swiggy_price !== null ? Number(res.swiggy_price) : null,
    zomato_price: res.zomato_price !== null ? Number(res.zomato_price) : null,
    ingredients: Array.isArray(res.ingredients) ? res.ingredients : [],
    image_url: res.image_url ?? null,
    is_available: res.is_available ?? true,
    outlets: Array.isArray(res.outlets) ? res.outlets : ['All'],
  };
  return { success: true, dish };
}

/**
 * PUT /api/dishes/:id
 * Updates a dish. Admin only.
 */
export async function editDish(
  id: number,
  data: Partial<CreateDishPayload>,
): Promise<{ success: boolean; dish: ApiDish }> {
  const body = {
    name: data.name,
    category: data.category,
    dine_price: data.dine_price,
    parcel_price: data.parcel_price,
    swiggy_price: data.swiggy_price,
    zomato_price: data.zomato_price,
    ingredients: data.ingredients,
    outlets: data.outlets,
  };

  const res = await request<any>('PUT', `/api/dishes/${id}`, body);
  const dish: ApiDish = {
    id: res.id,
    name: res.name,
    category: res.category_name ?? '',
    dine_price: Number(res.dine_price ?? 0),
    parcel_price: Number(res.parcel_price ?? 0),
    swiggy_price: res.swiggy_price !== null ? Number(res.swiggy_price) : null,
    zomato_price: res.zomato_price !== null ? Number(res.zomato_price) : null,
    ingredients: Array.isArray(res.ingredients) ? res.ingredients : [],
    image_url: res.image_url ?? null,
    is_available: res.is_available ?? true,
    outlets: Array.isArray(res.outlets) ? res.outlets : ['All'],
  };
  return { success: true, dish };
}

/**
 * DELETE /api/dishes/:id
 * Removes a dish. Admin only.
 */
export async function removeDish(id: number): Promise<{ success: boolean }> {
  return request('DELETE', `/api/dishes/${id}`);
}


/**
 * Upload a dish image (multipart/form-data).
 * Call this separately after createDish/editDish if you need image upload.
 */
export async function uploadDishImage(
  dishId: number,
  imageUri: string,
  mimeType = 'image/jpeg',
): Promise<{ success: boolean; image_url: string }> {
  const formData = new FormData();
  // React Native FormData accepts { uri, name, type }
  formData.append('image', { uri: imageUri, name: `dish_${dishId}.jpg`, type: mimeType } as any);

  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}/api/dishes/${dishId}`, {
    method: 'PUT',
    headers,
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || 'Image upload failed');
  return data;
}
