const {
  getAllDishes,
  getAllCategories,
  insertDish,
  updateDish,
  deleteDish,
  getDishById,
  createCategory
} = require("./dishesSqlc");
const { logActivity } = require("../../utils/auditLogger");

const getDishes = async (req, res) => {
  try {
    const dishes = await getAllDishes();

    const formattedDishes = dishes.map(dish => ({
      id: dish.id,
      uuid: dish.uuid,
      name: dish.name,
      cat: dish.category_name,
      category_id: dish.category_id,
      dine_price: parseFloat(dish.dine_price) || 0,
      parcel_price: parseFloat(dish.parcel_price) || 0,
      swiggy_price: dish.swiggy_price ? parseFloat(dish.swiggy_price) : null,
      zomato_price: dish.zomato_price ? parseFloat(dish.zomato_price) : null,
      ingredients: dish.ingredients || [],
      outlets: dish.outlets || ['All'],
      image_url: dish.image_url,
      created_at: dish.created_at,
      updated_at: dish.updated_at
    }));

    res.json(formattedDishes);
  } catch (err) {
    console.error("❌ getDishes error:", err);
    res.status(500).json({ error: err.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (err) {
    console.error("❌ getCategories error:", err);
    res.status(500).json({ error: err.message });
  }
};

const createDish = async (req, res) => {
  try {
    console.log("=== CREATE DISH ===");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const { category, name, dine_price, parcel_price, swiggy_price, zomato_price, ingredients, outlets } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Dish name is required" });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({ error: "Category is required" });
    }

    let parsedOutlets = outlets;
    if (typeof outlets === 'string') {
      try {
        parsedOutlets = JSON.parse(outlets);
      } catch (e) {
        parsedOutlets = [outlets];
      }
    }

    const dishData = {
      name: name.trim(),
      category: category.trim(),
      dine_price: dine_price ? parseFloat(dine_price) : 0,
      parcel_price: parcel_price ? parseFloat(parcel_price) : 0,
      swiggy_price: swiggy_price ? parseFloat(swiggy_price) : null,
      zomato_price: zomato_price ? parseFloat(zomato_price) : null,
      ingredients: ingredients || '',
      outlets: parsedOutlets || ['All'],
      image_url: req.file ? `/uploads/dishes/${req.file.filename}` : null
    };

    console.log("Dish data to save:", dishData);

    const dish = await insertDish(dishData);

    console.log("Dish created:", dish);

    logActivity({
      req,
      action: 'DISH_CREATE',
      entityType: 'dish',
      entityId: dish.id,
      newValues: dish
    });

    res.status(201).json(dish);
  } catch (err) {
    console.error("❌ createDish error:", err);
    res.status(500).json({
      error: "Failed to create dish",
      message: err.message,
      details: err.original?.message
    });
  }
};

const editDish = async (req, res) => {
  try {
    const { id } = req.params;
    const oldDish = await getDishById(id);
    const { name, category, dine_price, parcel_price, swiggy_price, zomato_price, ingredients, outlets } = req.body;

    const dishData = {};

    if (name && name.trim()) dishData.name = name.trim();
    if (category && category.trim()) dishData.category = category.trim();
    if (dine_price !== undefined) dishData.dine_price = parseFloat(dine_price);
    if (parcel_price !== undefined) dishData.parcel_price = parseFloat(parcel_price);
    if (swiggy_price !== undefined) dishData.swiggy_price = swiggy_price ? parseFloat(swiggy_price) : null;
    if (zomato_price !== undefined) dishData.zomato_price = zomato_price ? parseFloat(zomato_price) : null;
    if (ingredients !== undefined) dishData.ingredients = ingredients;
    if (outlets !== undefined) {
      if (typeof outlets === 'string') {
        try {
          dishData.outlets = JSON.parse(outlets);
        } catch (e) {
          dishData.outlets = [outlets];
        }
      } else {
        dishData.outlets = outlets;
      }
    }
    if (req.file) dishData.image_url = `/uploads/dishes/${req.file.filename}`;

    const dish = await updateDish(id, dishData);

    if (!dish) {
      return res.status(404).json({ error: "Dish not found" });
    }

    logActivity({
      req,
      action: 'DISH_UPDATE',
      entityType: 'dish',
      entityId: id,
      oldValues: oldDish,
      newValues: dish
    });

    res.json(dish);
  } catch (err) {
    console.error("❌ editDish error:", err);
    res.status(500).json({ error: "Failed to update dish", message: err.message });
  }
};

const removeDish = async (req, res) => {
  try {
    const { id } = req.params;
    const oldDish = await getDishById(id);
    await deleteDish(id);

    logActivity({
      req,
      action: 'DISH_DELETE',
      entityType: 'dish',
      entityId: id,
      oldValues: oldDish
    });

    res.json({ success: true, message: "Dish deleted" });
  } catch (err) {
    console.error("❌ removeDish error:", err);
    res.status(500).json({ error: err.message });
  }
};

const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }
    const category = await createCategory(name.trim());
    res.status(201).json(category);
  } catch (err) {
    console.error("❌ addCategory error:", err);
    // Send 409 Conflict for duplicate names
    const status = err.message.includes("already exists") ? 409 : 500;
    res.status(status).json({ error: err.message });
  }
};

module.exports = { getDishes, getCategories, createDish, editDish, removeDish, addCategory };