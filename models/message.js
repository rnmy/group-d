const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    text: String,
    author: {
        id: {
          type: mongoose.Schema.Types.ObjectID,
          ref: "User"
        },
        username: String
      },
    time: String,
    date: String
})

module.exports = mongoose.model("Message", messageSchema)