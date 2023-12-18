const JWT = require("jsonwebtoken");
const User = require("../models/user");

exports.signAccessToken = (userId) => {
  return new Promise((resolve, reject) => {
    const payload = {};
    const access_key = process.env.ACCESS_TOKEN_SECRET;
    const options = {
      audience: userId,
      issuer: "NeonFlake",
      expiresIn: "10d",
    };
    JWT.sign(payload, access_key, options, (err, data) => {
      if (err) reject({ status: 500, message: err.message });
      resolve(data);
    });
  });
};

exports.verifyAccessToken = (req, res, next) => {
  if (!req?.cookies.jwt)
    return res
      .status(401)
      .json({ status: 401, message: "Access Token is required" });
  const token = req.cookies.jwt;

  JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
    if (err) {
      if (err.name === "JsonWebTokenError")
        throw next({ status: 403, message: "Authentication failed" });
      else throw next({ status: 401, message: err.message });
    }
    req.userId = payload.aud;
    User.findById(req.userId)
      .then((data) => {
        if (data) {
          req.data = data;
          next();
        } else {
          throw next({ status: 401, message: "User not found" });
        }
      })
      .catch((err) => {
        next({ status: 500, message: err.message });
      });
  });
};

exports.signRefreshToken = (userId) => {
  return new Promise((resolve, reject) => {
    const payload = {};
    const refresh_key = process.env.REFRESH_TOKEN_SECRET;
    const options = {
      audience: userId,
      issuer: "Apoorv Pandey",
      expiresIn: "1d",
    };

    JWT.sign(payload, refresh_key, options, (err, result) => {
      if (err) reject({ status: 500, message: err.message });

      resolve(result);
    });
  });
};

exports.verifyRefreshToken = (req, res, next) => {
  if (!req.cookies.jwt)
    return next({
      status: 401,
      message: "Error no refresh token provided",
    });
  const token = req.cookies.jwt;

  JWT.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
    if (err && err.name !== "TokenExpiredError")
      return next({ status: 401, message: err.message });
    else if (err && err.name === "TokenExpiredError") {
      const output = JWT.verify(token, process.env.REFRESH_TOKEN_SECRET, {
        ignoreExpiration: true,
      });
      req.userInfo = { token: output.aud, isExpired: true };
    } else {
      req.userInfo = { token: payload.aud, isExpired: false };
    }
    next();
  });
};
