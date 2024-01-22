const { response } = require("express");
const Tag = require("../models/tag");
const User = require("../models/user");
const Message = require("../models/message");

exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;

    const users = await User.find({})
      .skip((page - 1) * limit)
      .limit(9)
      .populate("packageSelected");
    const sendingUsers = await Promise.all(
      users.map(async (user) => {
        const allTags = await Tag.find({ owner: user.id }).select({
          _id: 0,
          value: 1,
        });

        return {
          id: user.id,
          name: user.name,
          joinedData: user.createdAt,
          packageSelected: user.packageSelected,
          keywords: allTags,
        };
      })
    );

    res.status(200).json(sendingUsers);
  } catch (error) {
    next(error);
  }
};

exports.getAllTransaction = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;

    const allPackageSelected = await User.find({
      packageSelected: { $exists: true },
    })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("packageSelected")
      .select({ _id: 0, packageSelected: 1 });

    res.status(200).json(allPackageSelected);
  } catch (error) {
    next(error);
  }
};

exports.getAllMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query?.page) || 1;
    const limit = parseInt(req.query?.limit) || 12;

    const messages = await Message.find({})
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId");

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};
