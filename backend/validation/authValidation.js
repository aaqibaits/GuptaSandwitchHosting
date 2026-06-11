const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().min(3).max(100).required().messages({
    'any.required': 'Email or username is required.',
    'string.empty': 'Email or username cannot be empty.'
  }),
  password: Joi.string().min(6).max(30).required().messages({
    'string.min': 'Password must be at least 6 characters.',
    'string.max': 'Password cannot exceed 30 characters.',
    'any.required': 'Password is required.',
    'string.empty': 'Password cannot be empty.'
  })
});

module.exports = { loginSchema };
