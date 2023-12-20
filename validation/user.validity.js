const Joi = require("joi");

exports.createSignUpValidation = Joi.object({
  name: Joi.string().required().min(2),
  number: Joi.number().min(10).required(),
  password: Joi.string().min(6).required(),
});

exports.createSignInValidation = Joi.object({
  number: Joi.string().required().min(2),
  password: Joi.string().min(6).required(),
});
