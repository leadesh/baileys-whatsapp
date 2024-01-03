const express = require("express");
const { verifyAccessToken } = require("../helper/jwt_helper");

const router = express.Router();

router
  .route("/create-checkout-session")
  .post(verifyAccessToken, startStripeSession);

module.exports = router;
