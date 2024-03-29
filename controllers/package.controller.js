const Package = require("../models/package");
const User = require("../models/user");
const allPackages = require("../packages/allPackages.json");
const { addDays, isAfter, parseISO } = require("date-fns");

exports.addNewPackage = async (req, res, next) => {
  try {
    const data = req.data;
    const todayTime = new Date();
    const startTime = todayTime.toISOString();

    if (data?.packageSelected) {
      await Package.findByIdAndDelete(data.packageSelected.id);
    }

    let trialPeriodEndTime = new Date(todayTime);
    trialPeriodEndTime = addDays(trialPeriodEndTime, 7);
    const currentUser = await User.findById(data.id);

    const { package } = req.body;
    let newPackage;
    if (package === "Basic") {
      newPackage = new Package({
        ...allPackages[0],
        startTime,
        trialPeriodEndTime: trialPeriodEndTime.toISOString(),
      });
    } else {
      newPackage = new Package({
        ...allPackages[1],
        startTime,
        trialPeriodEndTime: trialPeriodEndTime.toISOString(),
      });
    }

    await newPackage.save();
    currentUser.packageSelected = newPackage._id;
    await currentUser.save();

    await currentUser.populate("packageSelected");

    res.status(200).json(currentUser);
  } catch (error) {
    next(error);
  }
};

exports.checkTrialPeriod = async (req, res, next) => {
  try {
    const data = req.data;

    const { packageSelected } = await User.findById(data.id).populate(
      "packageSelected"
    );
    if (!packageSelected) throw new Error("Package not found to check");
    const currentTime = new Date();
    if (isAfter(currentTime, packageSelected.trialPeriodEndTime)) {
      await Package.findByIdAndUpdate(packageSelected.id, {
        $set: { subscriptionStatus: "trialEnded" },
      });
      res
        .status(403)
        .json(
          "Your 7-day trial has ended. To continue enjoying Leadesh, please choose a plan and make a payment"
        );
    } else {
      res.status(200).json("Trial period continues");
    }
  } catch (error) {
    next(error);
  }
};
