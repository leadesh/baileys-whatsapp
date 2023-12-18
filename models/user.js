const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
  username: {
    type: String,
    reuired: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
  },
  isLogged: {
    type: Boolean,
    default: false,
  },
  tags: {
    type: [String],
    default: [],
  },
});

userSchema.statics.checkUser = async function (email, password) {
  const foundUser = await this.findOne({ email: email });
  let isValid = false;
  if (foundUser) {
    isValid = await bcrypt.compare(password, foundUser.password);
  }

  return isValid ? foundUser : false;
};

const User = model("User", userSchema);

module.exports = User;
