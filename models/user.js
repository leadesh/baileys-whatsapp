const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
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
      type: String,
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




userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);

})


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

// compare password
userSchema.methods.comparePassword = async function (loginPassword) {
  return await bcrypt.compare(loginPassword, this.password);
}

const User = model("User", userSchema);

module.exports = User;
