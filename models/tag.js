const { Schema, model } = require("mongoose");

const tagSchema = new Schema(
  {
    value: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Tag = model("Tag", tagSchema);

module.exports = Tag;
