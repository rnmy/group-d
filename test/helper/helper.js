const chai = require('chai')
const chaiHttp = require('chai-http')
const request = require('supertest')
const app = require('../../app.js')
const mongoose = require('mongoose')
const db = require('../db-handler')
const expect = require('chai').expect 

chai.use(chaiHttp)

before(async () => {await db.connect()})

describe("Landing page", () => {
    it("GET landing page", (done) => {
        chai.request(app).get("/").end((err, res) => {
            expect(res.status).to.equal(200)
            done()
        })
    })
})