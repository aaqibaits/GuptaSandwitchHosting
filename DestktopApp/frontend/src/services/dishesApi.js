import api from "./api";

// ── GET all dishes ───────────────────────────────────────
export const fetchDishes = async () => {
  const res = await api.get("/dishes");
  return res.data;
};

// ── GET all categories ───────────────────────────────────
export const fetchCategories = async () => {
  const res = await api.get("/dishes/categories");
  return res.data;
};

// ── POST new dish (with image upload) ───────────────────
export const createDish = async (formData) => {
  const res = await api.post("/dishes", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// ── PUT update existing dish ─────────────────────────────
export const updateDish = async (id, formData) => {
  const res = await api.put(`/dishes/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// ── DELETE dish ──────────────────────────────────────────
export const deleteDish = async (id) => {
  const res = await api.delete(`/dishes/${id}`);
  return res.data;
};

// ── GET dishes by outlet ─────────────────────────────────
export const fetchDishesByOutlet = async (outlet) => {
  const res = await api.get(`/dishes?outlet=${outlet}`);
  return res.data;
};

// ── GET dishes by category ───────────────────────────────
export const fetchDishesByCategory = async (category) => {
  const res = await api.get(`/dishes?category=${category}`);
  return res.data;
};
// ── GET all outlets ──────────────────────────────────────
export const fetchOutlets = async () => {
  const res = await api.get("/outlets");
  return res.data.data; // outlets API returns { success, data: [...] }
};