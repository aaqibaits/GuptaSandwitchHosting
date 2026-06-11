const { pool } = require('../../config/database');

// ── Get all dishes with their outlets ─────────────────────────────────
const getAllDishes = async () => {
  try {
    const result = await pool.query(
      `SELECT 
         d.*,
         c.id as category_id,
         c.name as category_name,
         COALESCE(
           json_agg(o.name) FILTER (WHERE o.name IS NOT NULL), 
           '[]'
         ) as outlets
       FROM dishes d
       LEFT JOIN categories c ON d.category_id = c.id
       LEFT JOIN dish_outlets do2 ON d.id = do2.dish_id
       LEFT JOIN outlets o ON do2.outlet_id = o.id
       GROUP BY d.id, c.id, c.name
       ORDER BY d.id DESC`
    );
    return result.rows;
  } catch (error) {
    console.error("Error in getAllDishes:", error);
    throw error;
  }
};

// ── Get all categories ─────────────────────────────────────────────────
const getAllCategories = async () => {
  try {
    const result = await pool.query(
      "SELECT id, name, description FROM categories WHERE is_active = true ORDER BY display_order ASC, name ASC"
    );
    return result.rows;
  } catch (error) {
    console.error("Error in getAllCategories:", error);
    throw error;
  }
};

// ── Get or create category by name ────────────────────────────────────
const getOrCreateCategory = async (categoryName) => {
  if (!categoryName) return null;
  try {
    const categoryResult = await pool.query(
      "SELECT id FROM categories WHERE LOWER(name) = LOWER($1)",
      [categoryName]
    );
    if (categoryResult.rows.length > 0) {
      return categoryResult.rows[0].id;
    }
    const insertResult = await pool.query(
      `INSERT INTO categories (name, is_active, created_at, updated_at)
       VALUES ($1, true, NOW(), NOW()) RETURNING id`,
      [categoryName]
    );
    return insertResult.rows[0].id;
  } catch (error) {
    console.error("Error in getOrCreateCategory:", error);
    throw error;
  }
};

// ── Link dish to outlets in dish_outlets table ────────────────────────
const linkDishToOutlets = async (client, dishId, outlets) => {
  // Delete existing links first
  await client.query("DELETE FROM dish_outlets WHERE dish_id = $1", [dishId]);

  if (!outlets || outlets.length === 0) return;

  // If "All" is selected, link to every outlet
  if (outlets.includes("All")) {
    const allOutlets = await client.query("SELECT id FROM outlets");
    for (const outlet of allOutlets.rows) {
      await client.query(
        "INSERT INTO dish_outlets (dish_id, outlet_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [dishId, outlet.id]
      );
    }
    return;
  }

  // Otherwise link to specific outlets by name
  for (const outletName of outlets) {
    const outletResult = await client.query(
      "SELECT id FROM outlets WHERE LOWER(name) = LOWER($1)",
      [outletName]
    );
    if (outletResult.rows.length > 0) {
      await client.query(
        "INSERT INTO dish_outlets (dish_id, outlet_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [dishId, outletResult.rows[0].id]
      );
    }
  }
};

// ── Insert new dish ────────────────────────────────────────────────────
const insertDish = async (data) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const categoryId = await getOrCreateCategory(data.category);
    if (!categoryId) throw new Error("Failed to get or create category");

    // Convert ingredients string to array
    let ingredientsArray = [];
    if (data.ingredients && typeof data.ingredients === 'string' && data.ingredients.trim()) {
      ingredientsArray = data.ingredients.split(',').map(i => i.trim()).filter(i => i);
    }

    // Parse outlets
    let parsedOutlets = ['All'];
    if (data.outlets) {
      parsedOutlets = typeof data.outlets === 'string'
        ? JSON.parse(data.outlets)
        : data.outlets;
    }

    const result = await client.query(
      `INSERT INTO dishes 
         (name, category_id, dine_price, parcel_price, swiggy_price, zomato_price, 
          ingredients, image_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::text[], $8, NOW(), NOW())
       RETURNING *`,
      [
        data.name,
        categoryId,
        data.dine_price || 0,
        data.parcel_price || 0,
        data.swiggy_price || null,
        data.zomato_price || null,
        ingredientsArray,
        data.image_url || null,
      ]
    );

    const dishId = result.rows[0].id;

    // Link to outlets
    await linkDishToOutlets(client, dishId, parsedOutlets);

    await client.query("COMMIT");

    // Return dish with category and outlets
    const final = await pool.query(
      `SELECT d.*, c.name as category_name,
         COALESCE(json_agg(o.name) FILTER (WHERE o.name IS NOT NULL), '[]') as outlets
       FROM dishes d
       LEFT JOIN categories c ON d.category_id = c.id
       LEFT JOIN dish_outlets do2 ON d.id = do2.dish_id
       LEFT JOIN outlets o ON do2.outlet_id = o.id
       WHERE d.id = $1
       GROUP BY d.id, c.id, c.name`,
      [dishId]
    );
    return final.rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in insertDish:", error);
    throw error;
  } finally {
    client.release();
  }
};

// ── Update existing dish ───────────────────────────────────────────────
const updateDish = async (id, data) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.name) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.category) {
      const categoryId = await getOrCreateCategory(data.category);
      updates.push(`category_id = $${paramCount++}`);
      values.push(categoryId);
    }
    if (data.dine_price !== undefined) {
      updates.push(`dine_price = $${paramCount++}`);
      values.push(data.dine_price);
    }
    if (data.parcel_price !== undefined) {
      updates.push(`parcel_price = $${paramCount++}`);
      values.push(data.parcel_price);
    }
    if (data.swiggy_price !== undefined) {
      updates.push(`swiggy_price = $${paramCount++}`);
      values.push(data.swiggy_price);
    }
    if (data.zomato_price !== undefined) {
      updates.push(`zomato_price = $${paramCount++}`);
      values.push(data.zomato_price);
    }
    if (data.ingredients !== undefined) {
      let ingredientsArray = [];
      if (typeof data.ingredients === 'string' && data.ingredients.trim()) {
        ingredientsArray = data.ingredients.split(',').map(i => i.trim()).filter(i => i);
      }
      updates.push(`ingredients = $${paramCount++}::text[]`);
      values.push(ingredientsArray);
    }
    if (data.image_url) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(data.image_url);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      values.push(id);
      await client.query(
        `UPDATE dishes SET ${updates.join(", ")} WHERE id = $${paramCount}`,
        values
      );
    }

    // Update outlet links if provided
    if (data.outlets !== undefined) {
      const parsedOutlets = typeof data.outlets === 'string'
        ? JSON.parse(data.outlets)
        : data.outlets;
      await linkDishToOutlets(client, id, parsedOutlets);
    }

    await client.query("COMMIT");

    // Return updated dish with category and outlets
    const final = await pool.query(
      `SELECT d.*, c.name as category_name,
         COALESCE(json_agg(o.name) FILTER (WHERE o.name IS NOT NULL), '[]') as outlets
       FROM dishes d
       LEFT JOIN categories c ON d.category_id = c.id
       LEFT JOIN dish_outlets do2 ON d.id = do2.dish_id
       LEFT JOIN outlets o ON do2.outlet_id = o.id
       WHERE d.id = $1
       GROUP BY d.id, c.id, c.name`,
      [id]
    );
    return final.rows[0] || null;

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in updateDish:", error);
    throw error;
  } finally {
    client.release();
  }
};

// ── Delete dish ────────────────────────────────────────────────────────
// const deleteDish = async (id) => {
//   try {
//     // dish_outlets rows auto-delete due to ON DELETE CASCADE
//     await pool.query("DELETE FROM dishes WHERE id = $1", [id]);
//   } catch (error) {
//     console.error("Error in deleteDish:", error);
//     throw error;
//   }
// };

const deleteDish = async (id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Delete from all related tables first, then the dish
    await client.query("DELETE FROM dish_outlets WHERE dish_id = $1", [id]);
    await client.query("DELETE FROM dish_ingredients WHERE dish_id = $1", [id]);
    await client.query("DELETE FROM order_items WHERE dish_id = $1", [id]);
    await client.query("DELETE FROM platform_availability WHERE dish_id = $1", [id]);
    await client.query("DELETE FROM dishes WHERE id = $1", [id]);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in deleteDish:", error);
    throw error;
  } finally {
    client.release();
  }
};

const getDishById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT d.*, c.name as category_name,
         COALESCE(json_agg(o.name) FILTER (WHERE o.name IS NOT NULL), '[]') as outlets
       FROM dishes d
       LEFT JOIN categories c ON d.category_id = c.id
       LEFT JOIN dish_outlets do2 ON d.id = do2.dish_id
       LEFT JOIN outlets o ON do2.outlet_id = o.id
       WHERE d.id = $1
       GROUP BY d.id, c.id, c.name`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error in getDishById:", error);
    throw error;
  }
};

// ── Create a new category ──────────────────────────────────────────────
const createCategory = async (name) => {
  if (!name || !name.trim()) throw new Error("Category name is required");

  // Check for duplicate (case-insensitive)
  const existing = await pool.query(
    "SELECT id, name FROM categories WHERE LOWER(name) = LOWER($1)",
    [name.trim()]
  );
  if (existing.rows.length > 0) {
    throw new Error(`Category "${existing.rows[0].name}" already exists`);
  }

  const result = await pool.query(
    `INSERT INTO categories (name, is_active, display_order, created_at, updated_at)
     VALUES ($1, true, 0, NOW(), NOW())
     RETURNING id, name, description`,
    [name.trim()]
  );
  return result.rows[0];
};

module.exports = { getAllDishes, getAllCategories, insertDish, updateDish, deleteDish, getDishById, createCategory };