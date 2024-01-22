const { Schema, model } = require("mongoose");

const messageSchema = new Schema({
  title: {
    type: String,
  },
  conversation: {
    type: String,
  },
  username: {
    type: String,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  isStarred: {
    type: Boolean,
    default: false,
  },
  groupName: {
    type: String,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Message = model("Message", messageSchema);

module.exports = Message;
