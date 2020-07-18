const chai = require('chai')
const chaiHttp = require('chai-http')
const request = require('supertest')
const app = require('../../app.js')
const mongoose = require('mongoose')
const db = require('../db-handler')
const fs = require('fs')
const expect = require('chai').expect 
const assert = require('chai').assert 
const Event = require("../../models/event")
const Group = require("../../models/group")
const User = require("../../models/user")
const Notification = require("../../models/notification")
const {
    getGroupIDs, 
    createObject,
    getEvent,
    changeObject,
    getGroupAndEvent,
    escapeRegex,
    getAllUsers,
    getAllPending,
    checkBookmarks,
    getNotif
} = require("../../helper")
const { 
    userAInfo, 
    userBInfo, 
    userCInfo, 
    testGroupAInfo, 
    testGroupBInfo, 
    testGroupCInfo,
    testEventAInfo,
    testEventBInfo,
    testNotificationAInfo,
    testNotificationBInfo
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

describe("Testing escapeRegex helper function", () => {
    it("Converts a string by interpreting metacharacters as character literals", (done) => {
        const escape1 = escapeRegex("/beep/")
        const escape2 = escapeRegex("beep")
        const escape3 = escapeRegex("/[A-Z]*/")
        const escape4 = escapeRegex("[A-Z]*")
        const escape5 = escapeRegex("/^boop$/")
        const escape6 = escapeRegex("^boop$")
        const escape7 = escapeRegex("/(?:.*)/")
        const escape8 = escapeRegex("(?:.*)")
        const escape9 = escapeRegex("/(?:beep|boop)/")
        const escape10 = escapeRegex("(?:beep|boop)")

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

describe("Testing getAllUsers helper function", () => {
    let userA, userB, groupA
    beforeEach(async () => {
        userA = await User.create(userAInfo)
        userB = await User.create(userBInfo)
        groupA = await Group.create(testGroupAInfo)
    })
    afterEach(async () => db.clearDatabase())
    it("Test 1: No users in group", async () => {
        const noUsers = [];
        const groupUsers = await getAllUsers(groupA._id)

        expect(groupUsers).to.eql(noUsers)
    })
    it("Test 2: userA in group", async () => {
        const users = [userA._id]
        await groupA.users.push(userA)
        await groupA.save()
        const groupUsers = await getAllUsers(groupA._id)
        
        expect(groupUsers).to.eql(users)
    })
    it("Test 3: userA and userB in group", async () => {
        const users = [userA._id, userB._id]
        await groupA.users.push(userA)
        await groupA.users.push(userB)
        await groupA.save()
        const groupUsers = await getAllUsers(groupA._id)

        expect(groupUsers).to.eql(users)
    })
    it("Test 4: userA and userB in group, then userA left group", async () => {
        const users = [userB._id]
        await groupA.users.push(userA)
        await groupA.users.push(userB)
        await groupA.users.shift()
        await groupA.save()
        const groupUsers = await getAllUsers(groupA._id)

        expect(groupUsers).to.eql(users)
    })
})

describe("Testing getAllPending helper function", () => {
    let userA, userB, groupA
    beforeEach(async () => {
        userA = await User.create(userAInfo)
        userB = await User.create(userBInfo)
        groupA = await Group.create(testGroupAInfo)
    })
    afterEach(async () => db.clearDatabase())
    it("Test 1: No pending users in group", async () => {
        const noPending = [];
        const groupPending = await getAllPending(groupA._id)

        expect(groupPending).to.eql(noPending)
    })
    it("Test 2: userA pending to join group", async () => {
        const pending = [userA._id]
        await groupA.pending.push(userA)
        await groupA.save()
        const groupPending = await getAllPending(groupA._id)
        
        expect(groupPending).to.eql(pending)
    })
    it("Test 3: userA and userB pending to join group", async () => {
        const pending = [userA._id, userB._id]
        await groupA.pending.push(userA)
        await groupA.pending.push(userB)
        await groupA.save()
        const groupPending = await getAllPending(groupA._id)

        expect(groupPending).to.eql(pending)
    })
    it("Test 4: userA and userB pending to join group, then userA removed join group request", async () => {
        const pending = [userB._id]
        await groupA.pending.push(userA)
        await groupA.pending.push(userB)
        await groupA.pending.shift()
        await groupA.save()
        const groupPending = await getAllPending(groupA._id)

        expect(groupPending).to.eql(pending)
    })
})

describe("Testing checkBookmarks helper function", () => {
    let user, anotherUser, eventA, eventB 
    beforeEach(async () => {
        user = await User.create(userAInfo)
        anotherUser = await User.create(userBInfo)
        eventA = await Event.create(testEventAInfo)
        eventB = await Event.create(testEventBInfo)
    })
    afterEach(async () => db.clearDatabase())
    it("Test 1: User has no bookmarks", (done) => {
        const A = checkBookmarks(eventA, user._id)
        const B = checkBookmarks(eventB, user._id)

        expect(A).to.be.false
        expect(B).to.be.false
        done()
    })
    it("Tets 2: User bookmarks event A but not event B", async () => {
        await eventA.bookmarks.push(user._id)
        await eventA.save()
        const A = checkBookmarks(eventA, user._id)
        const B = checkBookmarks(eventB, user._id)

        expect(A).to.be.true
        expect(B).to.be.false
    })
    it("Tets 3: User bookmarks both events A and B", async () => {
        await eventA.bookmarks.push(user._id)
        await eventB.bookmarks.push(user._id)
        await eventA.save()
        await eventB.save()
        const A = checkBookmarks(eventA, user._id)
        const B = checkBookmarks(eventB, user._id)

        expect(A).to.be.true
        expect(B).to.be.true
    })
    it("Tets 4: User bookmarks both events A and B, then removes bookmark for event A", async () => {
        await eventA.bookmarks.push(user._id)
        await eventB.bookmarks.push(user._id)
        await eventA.bookmarks.shift(user._id)
        await eventA.save()
        await eventB.save()
        const A = checkBookmarks(eventA, user._id)
        const B = checkBookmarks(eventB, user._id)

        expect(A).to.be.false
        expect(B).to.be.true
    })
    it("Tets 5: Two users bookmark event A", async () => {
        await eventA.bookmarks.push(user._id)
        await eventA.bookmarks.push(anotherUser._id)
        await eventA.save()
        const A = checkBookmarks(eventA, user._id)
        const B = checkBookmarks(eventA, anotherUser._id)

        expect(A).to.be.true
        expect(B).to.be.true
    })
})

describe("Testing getNotif helper function", () => {
    let notificationA, groupA, eventA
    before(async () => {
        notificationA = await Notification.create({text:"NotificationA", event:eventA, group:groupA, date:new Date(2020, 8, 28)})
        await notificationA.save()
    })
    after(async () => db.clearDatabase())
    it("Get notification based on ID", async () => {
        const A = await getNotif(notificationA._id)

        expect(A.text).to.eql(notificationA.text)
        expect(A.event).to.eql(notificationA.event)
        expect(A.group).to.eql(notificationA.group)
        expect(A.date).to.eql(notificationA.date)
    })
})

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

