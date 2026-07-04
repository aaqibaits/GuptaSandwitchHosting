import api from "./api";

// ── GET all ingredients ──────────────────────────────────
export const fetchIngredients = async () => {
  const res = await api.get("/ingredients");
  return res.data.data; // API returns { success, data: [...] }
};

// ── GET recipe rows for a specific dish ─────────────────
// Returns array of { ingredient_id, ingredient_name, unit, quantity_required }
export const fetchDishIngredients = async (dishId) => {
  const res = await api.get(`/ingredients/dish/${dishId}`);
  return res.data.data;
};

// ── POST create new ingredient ───────────────────────────
export const createIngredient = async (data) => {
  const res = await api.post("/ingredients", data);
  return res.data.data;
};

// ── PUT update existing ingredient ──────────────────────
export const updateIngredient = async (id, data) => {
  const res = await api.put(`/ingredients/${id}`, data);
  return res.data.data;
};

// ── DELETE ingredient ────────────────────────────────────
export const deleteIngredient = async (id) => {
  const res = await api.delete(`/ingredients/${id}`);
  return res.data;
};
