const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      errors: { wrap: { label: '' } }
    });

    if (error) {
      const errorMessages = error.details.map(d => d.message).join(', ');
      
      // Construct a key-value map of field-specific errors
      const errorsMap = {};
      error.details.forEach(d => {
        const fieldName = d.path.join('.');
        if (!errorsMap[fieldName]) {
          errorsMap[fieldName] = d.message;
        }
      });

      return res.status(400).json({
        success: false,
        message: errorMessages,
        errors: errorsMap
      });
    }

    req[source] = value;
    next();
  };
};

module.exports = validate;

