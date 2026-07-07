const { pool } = require('../../config/database');

// ── Get all ingredients ────────────────────────────────────────────────
const getAllIngredients = async () => {
  try {
    const result = await pool.query(
      `SELECT id, uuid, name, unit, cost_per_unit, current_stock, reorder_level, created_at, updated_at
       FROM ingredients
       WHERE is_deleted = false
       ORDER BY id DESC`
    );
    return result.rows;
  } catch (error) {
    console.error('Error in getAllIngredients:', error);
    throw error;
  }
};

// ── Get ingredient by ID ───────────────────────────────────────────────
const getIngredientById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT id, uuid, name, unit, cost_per_unit, current_stock, reorder_level, created_at, updated_at
       FROM ingredients WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in getIngredientById:', error);
    throw error;
  }
};

// ── Insert new ingredient ──────────────────────────────────────────────
const insertIngredient = async (data) => {
  try {
    const result = await pool.query(
      `INSERT INTO ingredients (name, unit, cost_per_unit, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, uuid, name, unit, cost_per_unit, current_stock, reorder_level, created_at, updated_at`,
      [data.name.trim(), data.unit, parseFloat(data.cost_per_unit) || 0]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error in insertIngredient:', error);
    throw error;
  }
};

// ── Update existing ingredient ─────────────────────────────────────────
const updateIngredient = async (id, data) => {
  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name.trim());
    }
    if (data.unit !== undefined) {
      updates.push(`unit = $${paramCount++}`);
      values.push(data.unit);
    }
    if (data.cost_per_unit !== undefined) {
      updates.push(`cost_per_unit = $${paramCount++}`);
      values.push(parseFloat(data.cost_per_unit) || 0);
    }

    if (updates.length === 0) {
      return await getIngredientById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE ingredients SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, uuid, name, unit, cost_per_unit, current_stock, reorder_level, created_at, updated_at`,
      values
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error in updateIngredient:', error);
    throw error;
  }
};

// ── Delete ingredient ──────────────────────────────────────────────────
const deleteIngredient = async (id) => {
  try {
    // Delete recipe mapping first to prevent it showing in future orders
    await pool.query('DELETE FROM dish_ingredients WHERE ingredient_id = $1', [id]);
    // Soft-delete the ingredient to keep transaction history
    await pool.query('UPDATE ingredients SET is_deleted = true WHERE id = $1', [id]);
  } catch (error) {
    console.error('Error in deleteIngredient:', error);
    throw error;
  }
};

// ── Get recipe (dish_ingredients) for a dish ───────────────────────────
const getDishIngredients = async (dishId) => {
  try {
    const result = await pool.query(
      `SELECT di.ingredient_id, i.name AS ingredient_name, i.unit, di.quantity_required
       FROM dish_ingredients di
       JOIN ingredients i ON di.ingredient_id = i.id
       WHERE di.dish_id = $1
       ORDER BY i.name ASC`,
      [dishId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error in getDishIngredients:', error);
    throw error;
  }
};

// ── Save recipe rows into dish_ingredients (replace all) ──────────────
// recipe = [{ ingredient_id, quantity_required }, ...]
const saveDishIngredients = async (client, dishId, recipe) => {
  // Delete existing recipe for this dish first
  await client.query('DELETE FROM dish_ingredients WHERE dish_id = $1', [dishId]);

  if (!recipe || recipe.length === 0) {
    await client.query('UPDATE dishes SET ingredients = ARRAY[]::text[] WHERE id = $1', [dishId]);
    return;
  }

  for (const row of recipe) {
    const ingId = parseInt(row.ingredient_id, 10);
    const qty = parseFloat(row.quantity_required);
    if (!ingId || isNaN(qty) || qty <= 0) continue;
    await client.query(
      `INSERT INTO dish_ingredients (dish_id, ingredient_id, quantity_required)
       VALUES ($1, $2, $3)
       ON CONFLICT (dish_id, ingredient_id) DO UPDATE SET quantity_required = $3`,
      [dishId, ingId, qty]
    );
  }

  // Fetch all ingredient names directly from DB for 100% reliability
  const res = await client.query(
    `SELECT i.name 
     FROM dish_ingredients di 
     JOIN ingredients i ON di.ingredient_id = i.id 
     WHERE di.dish_id = $1`,
    [dishId]
  );
  
  const ingredientNames = res.rows.map(r => r.name.trim());

  // Sync to dish card preview column
  await client.query(
    'UPDATE dishes SET ingredients = $1::text[] WHERE id = $2',
    [ingredientNames, dishId]
  );
};

module.exports = {
  getAllIngredients,
  getIngredientById,
  insertIngredient,
  updateIngredient,
  deleteIngredient,
  getDishIngredients,
  saveDishIngredients,
};
