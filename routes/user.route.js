const express = require("express");
const { reseatPassword } = require("../controllers/user.controller");
const router = express.Router();

router.route("/reseatPassword").post(reseatPassword);

module.exports = router;
