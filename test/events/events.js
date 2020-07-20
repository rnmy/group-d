const chai = require('chai')
const chaiHttp = require('chai-http')
const app = require('../../app.js')
const mongoose = require('mongoose')
const db = require('../db-handler')
const expect = require('chai').expect 
const assert = require('chai').assert 
const Event = require("../../models/event")
const Group = require("../../models/group")
const User = require("../../models/user")
const Notification = require("../../models/notification")
const puppeteer = require('puppeteer')
const { 
    userAInfo,
    testEventAInfo,
    testEventBInfo
} = require("../seeding/seeds")

before(async() => db.connect())
beforeEach(async () => {
    await User.create(userAInfo)
    await Event.create(testEventAInfo)
    await Event.create(testEventBInfo)
})

afterEach(async() => db.clearDatabase())

