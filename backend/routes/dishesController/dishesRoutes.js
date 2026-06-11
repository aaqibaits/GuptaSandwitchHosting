const express = require("express");
const router = express.Router();
const upload = require("../../middleware/upload");
const {
  getDishes,
  getCategories,
  createDish,
  editDish,
  removeDish,
  addCategory,
} = require("./dishesController");
const { protect } = require("../../middleware/authMiddleware");
const validate = require("../../middleware/validate");
const { createDishSchema, updateDishSchema } = require("../../validation/dishValidation");

router.get("/", protect(), getDishes);                                                              // GET    /api/dishes
router.get("/categories", protect(), getCategories);                                                          // GET    /api/dishes/categories
router.post("/categories", protect('admin'), addCategory);                                                     // POST   /api/dishes/categories
router.post("/", protect('admin'), upload.single("image"), validate(createDishSchema), createDish); // POST   /api/dishes
router.put("/:id", protect('admin'), upload.single("image"), validate(updateDishSchema), editDish);   // PUT    /api/dishes/:id
router.delete("/:id", protect('admin'), removeDish);                                                      // DELETE /api/dishes/:id

module.exports = router;