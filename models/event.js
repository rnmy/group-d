const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    name: String,
    url: String,
    minGroupSize: Number,
    maxGroupSize: Number
})

module.exports = mongoose.model("Event", eventSchema);