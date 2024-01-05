const express = require("express");
const { verifyAccessToken } = require("../helper/jwt_helper");
const {
  webHookHandler,
  startStripeSession,
  paymentSuccessHandler,
  createPortalHandler,
} = require("../controllers/stripe.controller");

const router = express.Router();

router
  .route("/create-checkout-session")
  .post(verifyAccessToken, startStripeSession);

router.route("/payment-success").post(verifyAccessToken, paymentSuccessHandler);

router.route("/webhook").post(webHookHandler);

router.route("/portal-creation").post(verifyAccessToken, createPortalHandler);

module.exports = router;
