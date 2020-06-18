const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    name: String,
    url: String,
    minGroupSize: Number,
    maxGroupSize: Number,
    groups: [
      {
        type: mongoose.Schema.Types.ObjectID,
        ref: "Group"
      }
    ]
})

module.exports = mongoose.model("Event", eventSchema);
