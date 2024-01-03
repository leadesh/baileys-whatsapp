const express = require("express");
const { verifyAccessToken } = require("../helper/jwt_helper");
const {
  addNewPackage,
  checkTrialPeriod,
} = require("../controllers/package.controller");

const router = express.Router();

router.route("/add").post(verifyAccessToken, addNewPackage);

router.route("/trial/check").get(verifyAccessToken, checkTrialPeriod);

module.exports = router;
