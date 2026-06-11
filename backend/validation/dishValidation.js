const Joi = require('joi');

const createDishSchema = Joi.object({
  name: Joi.string().min(2).max(200).required().messages({
    'any.required': 'Dish name is required.',
    'string.min': 'Dish name must be at least 2 characters.'
  }),
  category: Joi.string().required().messages({
    'any.required': 'Category is required.'
  }),
  dine_price: Joi.number().min(0).required().messages({
    'any.required': 'Dine-in price is required.',
    'number.min': 'Dine-in price cannot be negative.'
  }),
  parcel_price: Joi.number().min(0).required().messages({
    'any.required': 'Parcel price is required.',
    'number.min': 'Parcel price cannot be negative.'
  }),
  swiggy_price: Joi.number().min(0).allow(null, '').optional(),
  zomato_price: Joi.number().min(0).allow(null, '').optional(),
  ingredients: Joi.any().optional(),
  outlets: Joi.any().optional()
});

const updateDishSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  category: Joi.string().optional(),
  dine_price: Joi.number().min(0).optional(),
  parcel_price: Joi.number().min(0).optional(),
  swiggy_price: Joi.number().min(0).allow(null, '').optional(),
  zomato_price: Joi.number().min(0).allow(null, '').optional(),
  ingredients: Joi.any().optional(),
  outlets: Joi.any().optional()
});

module.exports = {
  createDishSchema,
  updateDishSchema
};
