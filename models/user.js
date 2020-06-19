const mongoose = require('mongoose')
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  username: String,
  password: String,
  organization: String,
  profilePic: String
})

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", userSchema)
