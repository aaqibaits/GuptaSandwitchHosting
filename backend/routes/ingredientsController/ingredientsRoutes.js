const express = require('express');
const router = express.Router();
const {
  getIngredients,
  createIngredient,
  editIngredient,
  removeIngredient,
  getDishRecipe,
} = require('./ingredientsController');
const { protect } = require('../../middleware/authMiddleware');

router.get('/', protect(), getIngredients);                    // GET    /api/ingredients
router.get('/dish/:dishId', protect(), getDishRecipe);          // GET    /api/ingredients/dish/:dishId
router.post('/', protect('admin'), createIngredient);           // POST   /api/ingredients
router.put('/:id', protect('admin'), editIngredient);           // PUT    /api/ingredients/:id
router.delete('/:id', protect('admin'), removeIngredient);      // DELETE /api/ingredients/:id

module.exports = router;
