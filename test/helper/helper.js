const chai = require('chai')
const chaiHttp = require('chai-http')
const request = require('supertest')
const app = require('../../app.js')
const mongoose = require('mongoose')
const db = require('../db-handler')
const expect = require('chai').expect 
const helper = require('../../helper/index')

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

describe("escapeRegex", () => {
    it("converts a string by interpreting metacharacters as character literals", (done) => {
        const escape1 = helper.escapeRegex("/beep/")
        const escape2 = helper.escapeRegex("beep")
        const escape3 = helper.escapeRegex("/[A-Z]*/")
        const escape4 = helper.escapeRegex("[A-Z]*")
        const escape5 = helper.escapeRegex("/^boop$/")
        const escape6 = helper.escapeRegex("^boop$")
        const escape7 = helper.escapeRegex("/(?:.*)/")
        const escape8 = helper.escapeRegex("(?:.*)")
        const escape9 = helper.escapeRegex("/(?:beep|boop)/")
        const escape10 = helper.escapeRegex("(?:beep|boop)")

        expect(escape1).to.equal("/beep/")
        expect(escape2).to.equal("beep")
        expect(escape3).to.equal("/\\[A\\-Z\\]\\*/")
        expect(escape4).to.equal("\\[A\\-Z\\]\\*")
        expect(escape5).to.equal("/\\^boop\\$/")
        expect(escape6).to.equal("\\^boop\\$")
        expect(escape7).to.equal("/\\(\\?:\\.\\*\\)/")
        expect(escape8).to.equal("\\(\\?:\\.\\*\\)")
        expect(escape9).to.equal("/\\(\\?:beep\\|boop\\)/")
        expect(escape10).to.equal("\\(\\?:beep\\|boop\\)")
        done()
    })
})

describe("getAllUsers", () => {

})

describe("getAllPending", () => {

})

describe("checkBookmarks", () => {

})

describe("getNotif", () => {

})