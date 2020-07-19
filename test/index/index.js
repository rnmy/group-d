const chai = require('chai')
const chaiHttp = require('chai-http')
const request = require('supertest')
const app = require('../../app.js')
const mongoose = require('mongoose')
const db = require('../db-handler')
const expect = require('chai').expect 
const assert = require('chai').assert 
const Event = require("../../models/event")
const Group = require("../../models/group")
const User = require("../../models/user")
const Notification = require("../../models/notification")

before(async () => db.connect())

describe("GET /", () => {
    it("Landing page loads", (done) => {
       chai.request(app)
        .get("/")
        .end((err, res) => {
            expect(res.status).to.equal(200)
            expect(res.text).to.have.string("Welcome to <strong>group'd!</strong>\n")
            expect(res.req.path).to.equal('/')
            done()
        })
    })
})

describe("GET /register", () => {
    it("Register page loads", (done) => {
        chai.request(app)
        .get("/register")
        .end((err, res) => {
            expect(res.status).to.equal(200)
            expect(res.text).to.have.string('<h1 class="display-4 mb-3">Sign up</h1>')
            expect(res.req.path).to.equal('/register')
            done()
        })
    })
})

describe("POST /register", () => {
    after(async () => db.clearDatabase())
    it("New user is registered", (done) => {
        chai.request(app)
        .post("/register")
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .field('name', 'Test')
        .field('email', "test@test.com")
        .field('username', 'Test')
        .field('password', 'password')
        .field('passwordConfirm', 'password')
        .field('organization', 'Test')
        .end((err, res) => {
            expect(res.status).to.equal(200)
            expect(res).to.redirect
            expect(res.req.path).to.equal('/login')
            done()
        })
    })
    it("Registered user is saved in the database", async () => {
        const user = await User.findOne({username: "Test"})
        expect(user.name).to.eql("Test")
        expect(user.email).to.eql("test@test.com")
        expect(user.organization).to.eql("Test")

    })

    it("User with same username cannot be registered", (done) => {
        chai.request(app)
        .post("/register")
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .field('name', 'Test')
        .field('email', "test@test.com")
        .field('username', 'Test')
        .field('password', 'password')
        .field('passwordConfirm', 'password')
        .field('organization', 'Test')
        .end((err, res) => {
            expect(res).to.redirect
            expect(res.req.path).to.equal('/register')
            done()
        })
    })
})