/**
 * services/ingredientsApi.ts
 * ──────────────────────────
 * Maps to backend: /api/ingredients
 */

import { request } from './api';

export interface Ingredient {
  id: number;
  name: string;
  unit: 'kg' | 'litre' | 'pack';
  cost_per_unit: number;
  current_stock?: number;
  reorder_level?: number | null;
}

export interface CreateIngredientPayload {
  name: string;
  unit: 'kg' | 'litre' | 'pack';
  cost_per_unit: number;
}

export async function fetchIngredients(): Promise<Ingredient[]> {
  const res = await request<{ success: boolean; data: Ingredient[] }>('GET', '/api/ingredients');
  return res.data;
}

export async function createIngredient(data: CreateIngredientPayload): Promise<Ingredient> {
  const res = await request<{ success: boolean; data: Ingredient }>('POST', '/api/ingredients', data);
  return res.data;
}

export async function updateIngredient(id: number, data: CreateIngredientPayload): Promise<Ingredient> {
  const res = await request<{ success: boolean; data: Ingredient }>('PUT', `/api/ingredients/${id}`, data);
  return res.data;
}

export async function deleteIngredient(id: number): Promise<{ success: boolean; message?: string }> {
  return request<{ success: boolean; message?: string }>('DELETE', `/api/ingredients/${id}`);
}

export interface DishIngredient {
  ingredient_id: number;
  ingredient_name: string;
  unit: 'kg' | 'litre' | 'pack';
  quantity_required: number;
}

export async function fetchDishIngredients(dishId: number): Promise<DishIngredient[]> {
  const res = await request<{ success: boolean; data: DishIngredient[] }>('GET', `/api/ingredients/dish/${dishId}`);
  return res.data;
}
