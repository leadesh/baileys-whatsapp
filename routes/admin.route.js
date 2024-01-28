const express = require("express");
const { verifyAccessToken } = require("../helper/jwt_helper");
const { isAdmin } = require("../helper/roles_checker");
const {
  getAllUsers,
  getAllTransaction,
  getAllMessages,
  editPackage,
  getPackages,
} = require("../controllers/admin.controller");

const router = express.Router();

router.use(verifyAccessToken);

router.route("/users").get(isAdmin, getAllUsers);

router.route("/transactions").get(isAdmin, getAllTransaction);

router.route("/allMessages").get(isAdmin, getAllMessages);

router.route("/editPackage").post(isAdmin, editPackage);

router.route("/packages").get(isAdmin, getPackages);

module.exports = router;
