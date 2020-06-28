const mongoose = require('mongoose')
const passportLocalMongoose = require("passport-local-mongoose");
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = new mongoose.Schema({
  name: String,
  email: {type: String, unique: true, uniqueCaseInsensitive: true},
  username: String,
  password: String,
  organization: String,
  profilePic: String,
  bio: String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(uniqueValidator, {message: 'This email is already linked to an existing account'});

module.exports = mongoose.model("User", userSchema)
