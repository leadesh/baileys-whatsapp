const Joi = require("joi");

exports.createSignUpValidation = Joi.object({
  name: Joi.string().required().min(1).messages({
    "string.base": "Name must be a string",
    "string.required": "Name is required",
    "string.min": "Name must have minimum of length 1",
  }),
  number: Joi.number().required().messages({
    "number.base": "Phone number must be a number",
    "number.empty": "Phone number is required",
  }),
  referralCode: Joi.string().messages({
    "string.base": "Referral Code must be a string",
  }),
  password: Joi.string()
    .min(8)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]+$"
      )
    )
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base":
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
});

exports.createSignInValidation = Joi.object({
  number: Joi.number().required().messages({
    "number.base": "Phone number must be a number",
    "number.empty": "Phone number is required",
  }),
  password: Joi.string()
    .min(8)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]+$"
      )
    )
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base":
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
});

exports.passwordValidation = Joi.string()
  .min(8)
  .pattern(
    new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]+$"
    )
  )
  .required()
  .messages({
    "string.base": "Password must be a string",
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters long",
    "string.pattern.base":
      "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
  });

exports.tagValidation = Joi.string().max(25).required().messages({
  "string.base": "Tag must be a string",
  "string.empty": "Tag is required",
  "string.max": "Tag is more than 25 characters long",
});

exports.createMessageValidation = Joi.object({
  conversation: Joi.string().required().messages({
    "string.base": "Message must be a string",
    "string.empty": "Message is required",
  }),
  groupName: Joi.string().messages({
    "string.base": "Group name must be a string",
  }),
  senderName: Joi.string().required().messages({
    "string.base": "sender name must be a string",
    "string.empty": "Sender name is required",
  }),
  senderNumber: Joi.number().messages({
    "number.base": "sender name must be a number",
  }),
  timestamp: Joi.string().required().messages({
    "string.base": "message timestamp must be a string",
    "string.empty": "message timestamp name is required",
  }),
});
