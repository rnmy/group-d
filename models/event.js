const mongoose = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator');

const eventSchema = new mongoose.Schema({
    name: {type: String, unique: true, uniqueCaseInsensitive: true},
    url: {type: String, unique: true, uniqueCaseInsensitive: true},
    minGroupSize: Number,
    maxGroupSize: Number,
    groups: [
      {
        type: mongoose.Schema.Types.ObjectID,
        ref: "Group"
      }
    ]
})

eventSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Event", eventSchema);
