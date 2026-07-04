const {
  getAllIngredients,
  getIngredientById,
  insertIngredient,
  updateIngredient,
  deleteIngredient,
  getDishIngredients,
} = require('./ingredientsSqlc');
const { logActivity } = require('../../utils/auditLogger');

// ── GET all ingredients ────────────────────────────────────────────────
const getIngredients = async (req, res) => {
  try {
    const ingredients = await getAllIngredients();
    const formatted = ingredients.map((i) => ({
      id: i.id,
      uuid: i.uuid,
      name: i.name,
      unit: i.unit,
      cost_per_unit: parseFloat(i.cost_per_unit) || 0,
      current_stock: parseFloat(i.current_stock) || 0,
      reorder_level: i.reorder_level ? parseFloat(i.reorder_level) : null,
      created_at: i.created_at,
      updated_at: i.updated_at,
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('❌ getIngredients error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST create ingredient ─────────────────────────────────────────────
const createIngredient = async (req, res) => {
  try {
    const { name, unit, cost_per_unit } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Ingredient name is required' });
    }
    if (!unit || !['litre', 'kg', 'pack'].includes(unit)) {
      return res.status(400).json({ success: false, error: 'Unit must be one of: litre, kg, pack' });
    }
    if (cost_per_unit === undefined || cost_per_unit === '') {
      return res.status(400).json({ success: false, error: 'Cost per unit is required' });
    }

    const ingredient = await insertIngredient({ name, unit, cost_per_unit });

    logActivity({
      req,
      action: 'INGREDIENT_CREATE',
      entityType: 'ingredient',
      entityId: ingredient.id,
      newValues: ingredient,
    });

    res.status(201).json({ success: true, data: ingredient });
  } catch (err) {
    console.error('❌ createIngredient error:', err);
    // Handle duplicate name (unique constraint)
    const status = err.message?.includes('unique') || err.code === '23505' ? 409 : 500;
    res.status(status).json({
      success: false,
      error: status === 409 ? 'An ingredient with this name already exists' : err.message,
    });
  }
};

// ── PUT update ingredient ──────────────────────────────────────────────
const editIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit, cost_per_unit } = req.body;

    const oldIngredient = await getIngredientById(id);
    if (!oldIngredient) {
      return res.status(404).json({ success: false, error: 'Ingredient not found' });
    }

    if (unit && !['litre', 'kg', 'pack'].includes(unit)) {
      return res.status(400).json({ success: false, error: 'Unit must be one of: litre, kg, pack' });
    }

    const ingredient = await updateIngredient(id, { name, unit, cost_per_unit });

    logActivity({
      req,
      action: 'INGREDIENT_UPDATE',
      entityType: 'ingredient',
      entityId: id,
      oldValues: oldIngredient,
      newValues: ingredient,
    });

    res.json({ success: true, data: ingredient });
  } catch (err) {
    console.error('❌ editIngredient error:', err);
    const status = err.code === '23505' ? 409 : 500;
    res.status(status).json({
      success: false,
      error: status === 409 ? 'An ingredient with this name already exists' : err.message,
    });
  }
};

// ── DELETE ingredient ──────────────────────────────────────────────────
const removeIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const oldIngredient = await getIngredientById(id);

    if (!oldIngredient) {
      return res.status(404).json({ success: false, error: 'Ingredient not found' });
    }

    await deleteIngredient(id);

    logActivity({
      req,
      action: 'INGREDIENT_DELETE',
      entityType: 'ingredient',
      entityId: id,
      oldValues: oldIngredient,
    });

    res.json({ success: true, message: 'Ingredient deleted successfully' });
  } catch (err) {
    console.error('❌ removeIngredient error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET recipe rows for a specific dish ─────────────────────────────
const getDishRecipe = async (req, res) => {
  try {
    const { dishId } = req.params;
    const rows = await getDishIngredients(dishId);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('❌ getDishRecipe error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getIngredients, createIngredient, editIngredient, removeIngredient, getDishRecipe };
