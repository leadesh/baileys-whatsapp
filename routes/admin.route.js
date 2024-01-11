const express = require("express");
const { verifyAccessToken } = require("../helper/jwt_helper");
const { isAdmin } = require("../helper/roles_checker");
const { getAllUsers } = require("../controllers/admin.controller");

const router = express.Router();

router.use(verifyAccessToken);

router.route("/users").get(isAdmin, getAllUsers);
