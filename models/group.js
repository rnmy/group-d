const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema({
  name: String,
  isClosed: Boolean,
  isDeleted: Boolean,
  description: String,
  groupLeader: {
    id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User"
    },
    name: String
  },
  pending: [
    {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User"
    }
  ],
  users: [
    {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User"
    }
  ],
  rejected: [
    {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User"
    }
  ],
  removed: [
    {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User"
    }
  ],
  left: [
    {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User"
    }
  ]
})

module.exports = mongoose.model("Group", groupSchema)
