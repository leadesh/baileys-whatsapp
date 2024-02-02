const express = require("express");
const { verifyAccessToken } = require("../helper/jwt_helper");
const { isAdmin } = require("../helper/roles_checker");
const {
  getAllUsers,
  getAllTransaction,
  getAllMessages,
  editPackage,
  getPackages,
  login,
} = require("../controllers/admin.controller");

const router = express.Router();

router.use((req, res, next) => {
  if (req.path === '/login') {
    return next();
  }
  verifyAccessToken(req, res, next);
});

// router.use(verifyAccessToken);

router.route("/users").get(isAdmin, getAllUsers);

router.route("/transactions").get(isAdmin, getAllTransaction);

router.route("/allMessages").get(isAdmin, getAllMessages);

router.route("/editPackage").post(isAdmin, editPackage);

router.route("/packages").get(isAdmin, getPackages);

router.route('/login').post(login);

module.exports = router;
