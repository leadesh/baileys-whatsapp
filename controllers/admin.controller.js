const { response } = require("express");
const Tag = require("../models/tag");
const User = require("../models/user");
const Message = require("../models/message");
const Package = require("../models/package");
const { readFile, writeFile } = require("fs/promises");
const { editPackageValidation } = require("../validation/user.validity");
const path = require("path");
const MyError = require("../config/error");
const { signAccessToken } = require("../helper/jwt_helper");

exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;

    const mobileNumber = req.query.phoneNumber || "";

    const username = req.query.username || "";

    const users = await User.find({
      $or: [
        { name: { $regex: username, $options: "i" } },
        { number: { $regex: mobileNumber, $options: "i" } },
      ],
    })
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

    const totalUsers = await User.find({
      $or: [
        { name: { $regex: username, $options: "i" } },
        { number: { $regex: mobileNumber, $options: "i" } },
      ],
    }).countDocuments();

    res.status(200).json({
      users: sendingUsers,
      pageInfo: {
        totalPages: Math.ceil(totalUsers / limit),
        presentPage: page,
      },
    });
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

    const totalPackages = await User.find({
      packageSelected: { $exists: true },
    }).countDocuments();

    res.status(200).json({
      packages: allPackageSelected,
      pageInfo: {
        totalPages: Math.ceil(totalPackages / limit),
        presentPage: page,
      },
    });
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

    const messagesCount = await Message.countDocuments();

    res.status(200).json({
      messages,
      pageInfo: {
        totalPages: Math.ceil(messagesCount / limit),
        presentPage: page,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.editPackage = async (req, res, next) => {
  try {
    await editPackageValidation.validateAsync(req.body);
    const filePath = path.resolve("./packages/allPackages.json");

    let allPackages = await readFile(filePath, { encoding: "utf8" });
    allPackages = JSON.parse(allPackages);

    const id = req.body.id;

    let selectedPackages = allPackages.map((package) => {
      if (package.id === id) {
        for (let index in req.body) {
          package[index] = req.body[index];
        }
        return package;
      }
      return package;
    });

    const selectedPackagesJson = JSON.stringify(selectedPackages);

    const promise = await writeFile(filePath, selectedPackagesJson);

    res.status(200).json(selectedPackages);
  } catch (error) {
    next(error);
  }
};

exports.getPackages = async (req, res, next) => {
  try {
    const filePath = path.resolve("./packages/allPackages.json");

    let allPackages = await readFile(filePath, { encoding: "utf8" });
    allPackages = JSON.parse(allPackages);

    res.status(200).json(allPackages);
  } catch (error) {
    next(error);
  }
};


exports.login = async (req, res, next) => {
  try {
    console.log("hello");
    const { email, password } = req.body;

    console.log(email, password);
    const validUser = await User.findOne({ email });

    if (!validUser) throw new MyError("Invalid email or password");

    const isCorrectPassword = await validUser.comparePassword(password);
    if (!isCorrectPassword) {
      throw new MyError("Invalid email or password");
    }

    const token = await signAccessToken(validUser.id);
    const maxAgeInSeconds = 10 * 24 * 60 * 60 * 1000;
    res.setHeader("jwt", token);
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAgeInSeconds,
      sameSite: "none",
      secure: true,
    });
    res.status(200).json({ ...validUser._doc, jwt: token });
  } catch (error) {
    next(error)
  }
}