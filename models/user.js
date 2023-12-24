const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  number: {
    type: Number,
    required: true,
    unique: true,
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

userSchema.statics.checkUser = async function (number, password) {
  const foundUser = await this.findOne({ number: number });
  let isValid = false;
  if (foundUser) {
    isValid = await bcrypt.compare(password, foundUser.password);
  }

  return isValid ? foundUser : false;
};

const User = model("User", userSchema);

module.exports = User;
