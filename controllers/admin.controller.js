const User = require("../models/user");

exports.getAllUsers = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 9;

    const users = await User.find({})
      .skip((page - 1) * limit)
      .limit(9)
      .populate("packageSelected");
    const sendingUsers = {};
  } catch (error) {
    next(error);
  }
};
