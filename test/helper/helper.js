const chai = require('chai')
const chaiHttp = require('chai-http')
const request = require('supertest')
const app = require('../../app.js')
const mongoose = require('mongoose')
const db = require('../db-handler')
const fs = require('fs')
const expect = require('chai').expect 
const Event = require("../../models/event")
const Group = require("../../models/group")
const User = require("../../models/user")
const {
    getGroupIDs, 
    createObject,
    getEvent,
    changeObject,
    getGroupAndEvent
} = require("../../helper")
const { 
    userAInfo, 
    userBInfo, 
    userCInfo, 
    testGroupAInfo, 
    testGroupBInfo, 
    testGroupCInfo,
    testEventAInfo
} = require("../seeding/seeds")


chai.use(chaiHttp)

before(async () => await db.connect())
after(async () => db.clearDatabase())

//A simple test
// describe("Testing all helper functions", () => {
//     it("GET landing page", (done) => {
//         chai.request(app).get("/").end((err, res) => {
//             expect(res.status).to.equal(200)
//             done()
//         })
//     })
// })

describe("Testing getGroupIDs helper function", () => {
    let userA, userB, userC, groupA, groupB, groupC 
    before(async () => {
        userA = await User.create(userAInfo)
        userB = await User.create(userBInfo)
        userC = await User.create(userCInfo)
        groupA = await Group.create(testGroupAInfo)
        groupB = await Group.create(testGroupBInfo)
        groupC = await Group.create(testGroupCInfo)
    })
    after(async () => db.clearDatabase())
    it("Test 1: User A is in Group A and B", async () => {
        await groupA.users.push(userA)
        await groupA.save()
        await groupB.pending.push(userA)
        await groupB.save()
        const arrA = [groupA._id, groupB._id]
        const idA = await getGroupIDs(userA._id)
        expect(idA).to.eql(arrA)
    })
    it("Test 2: User B is in Group B and C", async () => {
        await groupB.users.push(userB)
        await groupB.save()
        await groupC.left.push(userB)
        await groupC.save()
        const arrB = [groupB._id, groupC._id]
        const idB = await getGroupIDs(userB._id)
        expect(idB).to.eql(arrB)
    })

    it("Test 3: User C is in Group A, B and C", async () => {
        await groupC.users.push(userC)
        await groupC.save()
        await groupA.removed.push(userC)
        await groupA.save()
        await groupB.rejected.push(userC)
        await groupB.save()
        const arrC = [groupA._id, groupB._id, groupC._id]
        const idC = await getGroupIDs(userC._id)
        expect(idC).to.eql(arrC)
    })
})

describe("Testing createObject helper function", () => {
    let testID1, testID2
    before(() => {
        testID1 = new mongoose.Types.ObjectId()
        testID2 = new mongoose.Types.ObjectId()
    })
    it("Correct object should be created", (done) => {
        const obj = createObject(testID1, testID2)
        expect(obj).to.be.a('object')
        expect(obj.group).to.eql(testID1)
        expect(obj.event).to.eql(testID2)
        done()
    })
})

describe("Testing getEvent helper function", () => {
    let groupA, eventA
    before(async () => {
        groupA = await Group.create(testGroupAInfo)
        eventA = await Event.create(testEventAInfo)
    })
    after(async () => db.clearDatabase())
    it("Group is correctly under Event", async () => {
        await eventA.groups.push(groupA)
        await eventA.save()
        const returnedObj = await getEvent(groupA._id)
        const expectedObj = {group: groupA._id, event: eventA._id}
        expect(returnedObj).to.be.a('object')
        expect(returnedObj).to.eql(expectedObj)
    })
})

describe("Testing changeObject helper function", () => {
    let groupA, eventA
    before(async () => {
        groupA = await Group.create(testGroupAInfo)
        eventA = await Event.create(testEventAInfo)
    })
    after(async () => db.clearDatabase())
    it("Correct object should be returned", async () => {
        const initialObj = {group: "group", event: "event"}
        const returnedObj = changeObject(initialObj, groupA, eventA)
        const expectedObj = {group: groupA, event: eventA}
        expect(returnedObj).to.eql(expectedObj)
    })
})

describe("Testing getGroupAndEvent helper function", () => {
    let groupA, eventA, initialObj
    before(async () => {
        groupA = await Group.create(testGroupAInfo)
        eventA = await Event.create(testEventAInfo)
        await eventA.groups.push(groupA)
        await eventA.save()
        initialObj = {group: groupA._id, event: eventA._id}
    })
    after(async () => db.clearDatabase())
    it("Correct group and event information is returned", async () => {
        const returnedObj = await getGroupAndEvent(initialObj)
        const expectedObj = {group: groupA, event: eventA}
        expect(returnedObj.group._id).to.eql(expectedObj.group._id)
        expect(returnedObj.event._name).to.eql(expectedObj.event._name)
    })
})

describe("Testing checkFileType helper function", () => {
    afterEach(async () => {
        db.clearDatabase()
        db.clearUploads()
    })
    it("Test 1: Uploading a pdf file flashes an error message", (done) => {
        chai.request(app)
        .post("/register")
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .field('name', 'Test')
        .field('email', "test@test.com")
        .field('username', 'Test')
        .field('password', 'password')
        .field('passwordConfirm', 'password')
        .field('organization', 'Test')
        .attach('file', fs.readFileSync('test/seeding/files/test.pdf'),
        'test.pdf').end((err, res) => {
        expect(res.text).to.have.string('Please upload only images for your profile picture (e.g. .jpeg/.png files)\n')
        done()
        })
    }) 
    it("Test 2: Uploading a jpg file is successful", (done) => {
        chai.request(app)
        .post("/register")
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .field('name', 'Test')
        .field('email', "test@test.com")
        .field('username', 'Test')
        .field('password', 'password')
        .field('passwordConfirm', 'password')
        .field('organization', 'Test')
        .attach('file', fs.readFileSync('test/seeding/files/test.jpg'),
        'test.jpg').end((err, res) => {
        expect(res.text).to.not.have.string('Please upload only images for your profile picture (e.g. .jpeg/.png files)\n')
        done()
        })
    })
    it("Test 3: Uploading a png file is successful", (done) => {
        chai.request(app)
        .post("/register")
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .field('name', 'Test')
        .field('email', "test@test.com")
        .field('username', 'Test')
        .field('password', 'password')
        .field('passwordConfirm', 'password')
        .field('organization', 'Test')
        .attach('file', fs.readFileSync('test/seeding/files/test.png'),
        'test.png').end((err, res) => {
        expect(res.text).to.not.have.string('Please upload only images for your profile picture (e.g. .jpeg/.png files)\n')
        done()
        })
    })
    it("Test 4: Uploading a jpeg file is successful", (done) => {
        chai.request(app)
        .post("/register")
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .field('name', 'Test')
        .field('email', "test@test.com")
        .field('username', 'Test')
        .field('password', 'password')
        .field('passwordConfirm', 'password')
        .field('organization', 'Test')
        .attach('file', fs.readFileSync('test/seeding/files/test.jpeg'),
        'test.jpeg').end((err, res) => {
        expect(res.text).to.not.have.string('Please upload only images for your profile picture (e.g. .jpeg/.png files)\n')
        done()
        })
    })
})