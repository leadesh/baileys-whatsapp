const { Schema, model } = require("mongoose");

const packageSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  rate: {
    type: Number,
    required: true,
  },
  maxKeyword: {
    type: Number,
    required: true,
  },
  trialPeriod: {
    type: Number,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  trialPeriodEndTime: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});

const Package = model("Package", packageSchema);

module.exports = Package;
