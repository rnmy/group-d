const mongoose = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator');

const eventSchema = new mongoose.Schema({
    name: {type: String, unique: true, uniqueCaseInsensitive: true},
    url: {type: String, unique: true, uniqueCaseInsensitive: true},
    desc: String,
    requirements: String,
    prizes: String,
    date: Date,
    minGroupSize: Number,
    maxGroupSize: Number,
    groups: [
      {
        type: mongoose.Schema.Types.ObjectID,
        ref: "Group"
      }
    ],
    author: {
      id: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "User"
      },
      username: String
    },
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectID,
        ref: "User"
      }
    ]
})

eventSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Event", eventSchema);
