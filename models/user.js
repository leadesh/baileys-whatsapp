const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    roles: {
      type: [String],
      required: true,
      enum: ["admin", "user"],
      default: ["user"],
    },
    number: {
      type: Number,
      required: true,
      unique: [true, "Phone number already exist"],
    },
    packageSelected: {
      type: Schema.Types.ObjectId,
      ref: "Package",
    },
    referralCode: {
      type: String,
      unique: true,
    },
    referrals: {
      type: [String],
      default: [],
    },
    isLogged: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.virtual("tags", {
  ref: "Tag",
  localField: "_id",
  foreignField: "owner",
});

userSchema.statics.checkUser = async function (number, password) {
  const foundUser = await this.findOne({ number: number }).populate(
    "packageSelected"
  );
  let isValid = false;
  if (foundUser) {
    isValid = await bcrypt.compare(password, foundUser.password);
  }

  return isValid ? foundUser : false;
};

const User = model("User", userSchema);

module.exports = User;
