const mongoose = require("mongoose");

const mongoConnection = () => {
  mongoose
    .connect(process.env.mongo_url)
    .then(() => {
      console.log("Mongo DB connected");
    })
    .catch((err) => {
      console.log("Error connecting");
    });
};

module.exports = mongoConnection;
