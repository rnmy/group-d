const Event = require("../../models/event")
const Group = require("../../models/group")
const User = require("../../models/user")
const Notification = require("../../models/notification")
const mongoose = require('mongoose')


module.exports.userAInfo = {
    _id: new mongoose.Types.ObjectId(),
    name: "UserA",
    email: "userA@test.com",
    username: "UserA",
    password: "password",
    organization: "Test",
    profilePic: ""
}

module.exports.userBInfo = {
    _id: new mongoose.Types.ObjectId(),
    name: "UserB",
    email: "userB@test.com",
    username: "UserB",
    password: "password",
    organization: "Test",
    profilePic: ""
}

module.exports.userCInfo = {
    _id: new mongoose.Types.ObjectId(),
    name: "UserC",
    email: "userC@test.com",
    username: "UserC",
    password: "password",
    organization: "Test",
    profilePic: ""
}


module.exports.testGroupAInfo = {
    _id: new mongoose.Types.ObjectId(),
    name: "GroupA",
    isClosed: false,
    isDeleted: false
}


module.exports.testGroupBInfo = {
    _id: new mongoose.Types.ObjectId(),
    name: "GroupB",
    isClosed: false,
    isDeleted: false
}

module.exports.testGroupCInfo = {
    _id: new mongoose.Types.ObjectId(),
    name: "GroupC",
    isClosed: false,
    isDeleted: false
}

module.exports.testEventAInfo = {
    _id: new mongoose.Types.ObjectId(),
    name: "EventA",
    url: "EventAURL",
    desc: "Test",
    cat: ["Test"],
    requirements: "Test",
    prizes: "Test",
    date: new Date(2020, 7, 27),
    deadline: new Date(2020, 7, 27),
    minGroupSize: 1,
    maxGroupSize: 4
}


