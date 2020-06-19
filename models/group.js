const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({
  name: String,
  size: Number,
  description: String,
  users: [
    {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User"
    }
  ]
})

module.exports = mongoose.model("Group", groupSchema)
