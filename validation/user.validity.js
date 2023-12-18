const Joi = require("joi");

exports.createSignUpValidation = Joi.object({
  username: Joi.string().required().min(2),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

exports.createSignInValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});
