const Joi = require('joi');

const addOutletSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Outlet name must be at least 3 characters.',
    'any.required': 'Outlet name is required.'
  }),
  address: Joi.string().min(5).max(500).required().messages({
    'string.min': 'Address must be at least 5 characters.',
    'any.required': 'Address is required.'
  }),
  phone: Joi.string().pattern(/^\+?[0-9\s\-]{10,15}$/).required().messages({
    'string.pattern.base': 'Please provide a valid 10-15 digit phone number.',
    'any.required': 'Phone number is required.'
  }),
  manager: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Manager name must be at least 2 characters.',
    'any.required': 'Manager name is required.'
  }),
  email: Joi.string().email().allow(null, '').optional().messages({
    'string.email': 'Please provide a valid email address.'
  }),
  username: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9_]+$/).required().messages({
    'string.min': 'Username must be at least 3 characters.',
    'string.pattern.base': 'Username must contain only letters, numbers, and underscores.',
    'any.required': 'Username is required.'
  }),
  password: Joi.string().min(6).max(50).required().messages({
    'string.min': 'Password must be at least 6 characters.',
    'any.required': 'Password is required.'
  }),
  status: Joi.string().valid('active', 'inactive').default('active').optional(),
  access_token: Joi.string().min(1).max(255).required().messages({
    'any.required': 'Access Token is required.'
  }),
  swiggy_id: Joi.string().max(100).allow(null, '').optional(),
  zomato_id: Joi.string().max(100).allow(null, '').optional()
});

const updateOutletSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Outlet name must be at least 3 characters.',
    'any.required': 'Outlet name is required.'
  }),
  address: Joi.string().min(5).max(500).required().messages({
    'string.min': 'Address must be at least 5 characters.',
    'any.required': 'Address is required.'
  }),
  phone: Joi.string().pattern(/^\+?[0-9\s\-]{10,15}$/).required().messages({
    'string.pattern.base': 'Please provide a valid 10-15 digit phone number.',
    'any.required': 'Phone number is required.'
  }),
  manager: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Manager name must be at least 2 characters.',
    'any.required': 'Manager name is required.'
  }),
  email: Joi.string().email().allow(null, '').optional(),
  status: Joi.string().valid('active', 'inactive').default('active').optional(),
  access_token: Joi.string().min(1).max(255).required().messages({
    'any.required': 'Access Token is required.'
  }),
  swiggy_id: Joi.string().max(100).allow(null, '').optional(),
  zomato_id: Joi.string().max(100).allow(null, '').optional(),
  username: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9_]+$/).required().messages({
    'string.min': 'Username must be at least 3 characters.',
    'string.pattern.base': 'Username must contain only letters, numbers, and underscores.',
    'any.required': 'Username is required.'
  }),
  password: Joi.string().min(6).max(50).allow(null, '').optional().messages({
    'string.min': 'Password must be at least 6 characters.'
  })
});

const updateOutletCredsSchema = Joi.object({
  username: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9_]+$/).required().messages({
    'string.min': 'Username must be at least 3 characters.',
    'string.pattern.base': 'Username must contain only letters, numbers, and underscores.',
    'any.required': 'Username is required.'
  }),
  password: Joi.string().min(6).max(50).allow(null, '').optional().messages({
    'string.min': 'Password must be at least 6 characters.'
  })
});

const addUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'any.required': 'Staff name is required.'
  }),
  email: Joi.string().email().allow(null, '').optional(),
  username: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9_]+$/).required().messages({
    'string.min': 'Username must be at least 3 characters.',
    'string.pattern.base': 'Username must contain only letters, numbers, and underscores.',
    'any.required': 'Username is required.'
  }),
  password: Joi.string().min(6).max(50).required().messages({
    'string.min': 'Password must be at least 6 characters.',
    'any.required': 'Password is required.'
  }),
  roleLabel: Joi.string().required().messages({
    'any.required': 'Role label is required.'
  }),
  appRole: Joi.string().valid('Admin', 'Staff').required().messages({
    'any.required': 'App role is required (Admin or Staff).'
  }),
  permissions: Joi.any().required().messages({
    'any.required': 'Permissions configuration is required.'
  }),
  status: Joi.string().valid('active', 'inactive').default('active').optional()
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'any.required': 'Staff name is required.'
  }),
  email: Joi.string().email().allow(null, '').optional(),
  username: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9_]+$/).required().messages({
    'string.min': 'Username must be at least 3 characters.',
    'string.pattern.base': 'Username must contain only letters, numbers, and underscores.',
    'any.required': 'Username is required.'
  }),
  password: Joi.string().min(6).max(50).allow(null, '').optional().messages({
    'string.min': 'Password must be at least 6 characters.'
  }),
  roleLabel: Joi.string().required().messages({
    'any.required': 'Role label is required.'
  }),
  appRole: Joi.string().valid('Admin', 'Staff').required().messages({
    'any.required': 'App role is required (Admin or Staff).'
  }),
  permissions: Joi.any().required().messages({
    'any.required': 'Permissions configuration is required.'
  }),
  status: Joi.string().valid('active', 'inactive').default('active').optional()
});

module.exports = {
  addOutletSchema,
  updateOutletSchema,
  updateOutletCredsSchema,
  addUserSchema,
  updateUserSchema
};
