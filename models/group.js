const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({
  name: String,
  size: Number,
  users: [
    {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User"
    }
  ]
})

module.exports = mongoose.model("Group", groupSchema)
