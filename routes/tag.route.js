const express = require("express");
const { verifyAccessToken } = require("../helper/jwt_helper");
const {
  addTokenHandler,
  delTokenHandler,
  editTokenHandler,
  getTokenHandler,
} = require("../controllers/tag.controller");

const router = express.Router();

router.get("/", verifyAccessToken, getTokenHandler);

router.post("/add", verifyAccessToken, addTokenHandler);

router.post("/del/:id", verifyAccessToken, delTokenHandler);

router.post("/edit/:id", verifyAccessToken, editTokenHandler);

module.exports = router;
