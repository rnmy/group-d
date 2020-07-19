const chai = require('chai')
const chaiHttp = require('chai-http')
const request = require('supertest')
const app = require('../../app.js')
const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')
const db = require('../db-handler')
const expect = require('chai').expect 
const assert = require('chai').assert 
const Event = require("../../models/event")
const Group = require("../../models/group")
const User = require("../../models/user")
const Notification = require("../../models/notification")
const { 
    userAInfo
} = require("../seeding/seeds")
const agent = request.agent(app)

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
            expect(res.req.path).to.equal('/register')
            expect(res.text).to.have.string("A user with the given username is already registered\n")
            done()
        })
    })
})

describe("GET /login", () => {
    it("Login page loads", (done) => {
        chai.request(app)
        .get("/login")
        .end((err, res) => {
            expect(res.status).to.equal(200)
            expect(res.text).to.have.string('<h1>Login!</h1>')
            expect(res.req.path).to.equal('/login')
            done()
        })
    })
})

const DefaultUserSchema = new mongoose.Schema()
DefaultUserSchema.plugin(passportLocalMongoose)
const DefaultUser = mongoose.model('DefaultUser', DefaultUserSchema)

describe("POST /login", () => {
    let TestUser
    before(async () => {
        TestUser = await new DefaultUser({ username: 'user' });
        await TestUser.setPassword('password')
        await TestUser.save()
    })
    after(async () => db.clearDatabase())
    it('Should authenticate existing user with matching password', function(done) {
        DefaultUser.authenticate()('user', 'password', function(err, result) {
            if (err) {
                return done(err);
            }

            expect(result instanceof DefaultUser).to.exist;
            expect(result.username).to.equal(TestUser.username);

            expect(result.salt).to.equal(TestUser.salt);
            expect(result.hash).to.equal(TestUser.hash);
        });

        done()
    });

    it('should not authenticate existing user with non matching password', async () => {
        const { user: result, error } = await DefaultUser.authenticate()('user', 'wrongpassword');

        expect(result).to.equal(false);
        expect(error).to.exist;
    });
})

describe("GET /logout", () => {
    it("Logout page loads", (done) => {
        chai.request(app)
        .get("/logout")
        .end((err, res) => {
            expect(res.status).to.equal(200)
            expect(res.text).to.have.string("Welcome to <strong>group'd!</strong>\n")
            expect(res.req.path).to.equal('/')
            done()
        })
    })
})