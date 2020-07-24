const chai = require('chai')
const chaiHttp = require('chai-http')
const app = require('../../app.js')
const mongoose = require('mongoose')
const db = require('../db-handler')
const expect = require('chai').expect 
const assert = require('chai').assert 
const passport = require("passport")
const Event = require("../../models/event")
const Group = require("../../models/group")
const User = require("../../models/user")
const Notification = require("../../models/notification")
const puppeteer = require('puppeteer')
const { 
    userAInfo,
    userBInfo,
    userCInfo,
    userDInfo,
    userEInfo,
    userFInfo,
    mockUserInfo,
    testEventAInfo,
    testEventBInfo
} = require("../seeding/seeds")

describe("Testing group routes with puppeteer", () => {
    let browser, page, userA, userB, userC, userD, userE,eventA, eventB

    before(async () => {
        await db.connect()
        browser = await puppeteer.launch(
            {
                executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                headless: false,    
                slowMo: 10,    
                timeout: 0
            })
            page = await browser.newPage()
            await page.setViewport({ width: 1382, height: 702 })

            user = await User.register(mockUserInfo, "password")
            const authorCreds = {
                id: user._id,
                username: "MockUser"
            }
            eventA = await Event.create(testEventAInfo)
            eventA.author = authorCreds
            await eventA.save()
            eventB = await Event.create(testEventBInfo)
            eventB.author = authorCreds 
            await eventB.save()

            userA = await User.register(userAInfo, "password")
            userB = await User.register(userBInfo, "password")
            userC = await User.register(userCInfo, "password")
            userD = await User.register(userDInfo, "password")
            userE = await User.register(userEInfo, "password")
            userE = await User.register(userFInfo, "password")

            const navigationPromise = page.waitForNavigation()
            await page.goto("http://localhost:8080/");
            await page.click('.row > .col > .form-group > a > .btn')
            await navigationPromise

            const username = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
            await username.type("MockUser")
            const password = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
            await password.type("password")

            await page.click('.container > div > form > .form-group > .btn')
            await navigationPromise 

            await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
            await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')          
            await navigationPromise

            await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
            await page.click('body > .container > .nav > .nav-item > .text-dark')
            await navigationPromise
            
            await page.waitForSelector('body > .container > .btn')
            await page.click('body > .container > .btn')
            await navigationPromise
            
            const name = await page.waitForSelector('.container > div > #createGroup > .form-group:nth-child(1) > .form-control')
            await name.type("Another Group")
            const desc = await page.waitForSelector('.container > div > #createGroup > .form-group:nth-child(2) > .form-control')
            await desc.type("This is another group")

            page.once('dialog', async dialog => {
                await dialog.accept();
            });
            await page.waitForSelector('.container > div > #createGroup > .form-group > .btn')
            await page.click('.container > div > #createGroup > .form-group > .btn')
            await navigationPromise

            await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
            await navigationPromise
    })

    after(async () => {
        await browser.close()
        await db.clearDatabase()
    })

    it("Should be able to create group under event", async () => {              
        const navigationPromise = page.waitForNavigation()

        // UserA logs in
        await page.click('.row > .col > .form-group > a > .btn')
        await navigationPromise

        const username = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
        await username.type("UserA")
        const password = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await password.type("password")

        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise 

        await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')          
        await navigationPromise

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')
        await navigationPromise
        
        // UserA creates Test Group
        await page.waitForSelector('body > .container > .btn')
        await page.click('body > .container > .btn')
        await navigationPromise
        
        const name = await page.waitForSelector('.container > div > #createGroup > .form-group:nth-child(1) > .form-control')
        await name.type("Test Group")
        const desc = await page.waitForSelector('.container > div > #createGroup > .form-group:nth-child(2) > .form-control')
        await desc.type("This is a test group!")

        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.container > div > #createGroup > .form-group > .btn')
        await page.click('.container > div > #createGroup > .form-group > .btn')
        await navigationPromise

        const createGroupAlert = await page.$eval('body > .container > .alert', a => a.innerText)
        expect(createGroupAlert).to.equal('Successfully created the group "Test Group" for EventA')
        const groupName = await page.$eval('body > .container > .card:nth-child(2) > .card-body > .card-title', a => a.innerText)
        expect(groupName).to.equal('Test Group')
    })

    it('Should be able to display group page', async() => {
        const navigationPromise = page.waitForNavigation()

        // UserA accesses Test Group
        await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
        await page.click('body > .container > .card:nth-child(2) > .card-body > a')           
        await navigationPromise

        const groupName = await page.$eval('body > .container > .display-4', a => a.innerText)
        expect(groupName).to.equal('You are viewing: Test Group')
        const groupLeader = await page.$eval('body > .container > h6:nth-child(2)', a => a.innerText)
        expect(groupLeader).to.equal('Group Leader: UserA')
        const groupDesc = await page.$eval('body > .container > h6 > em', a => a.innerText)
        expect(groupDesc).to.equal('This is a test group!')
        const groupStatus = await page.$eval('body > .container > .row > .col-md-9 > .text-secondary', a => a.innerText)
        expect(groupStatus).to.equal('You are currently the leader of Test Group')
    })

    it('Group leader should have access to group leader actions', async () => {
        const pendingRequests = await page.$eval('.container > .col-md-3 > .list-group > .text-decoration-none > .text-dark', a => a.innerText)
        expect(pendingRequests).to.equal('Pending Requests ')
        const groupSettings = await page.$eval('.container > .col-md-3 > .list-group > .list-group-item:nth-child(4) > .text-dark', a => a.innerText)
        expect(groupSettings).to.equal('Group Settings')  
        const deleteGroup = await page.$eval('.col-md-3 > .list-group > .list-group-item > #deleteGroup > .btn', a => a.innerText)
        expect(deleteGroup).to.equal('Delete Group')
    })

    it('Group leader should be able to edit group information', async () => {
        const navigationPromise = page.waitForNavigation()

        await page.waitForSelector('.container > .col-md-3 > .list-group > .list-group-item:nth-child(4) > .text-dark')
        await page.click('.container > .col-md-3 > .list-group > .list-group-item:nth-child(4) > .text-dark')
        await navigationPromise

        await page.waitForSelector('body > .container > .btn')
        await page.click('body > .container > .btn')
        await navigationPromise
        
        const newGroupDesc = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await newGroupDesc.click({ clickCount: 3 })
        await newGroupDesc.type("This is a new description")  

        await page.waitForSelector('.container > div > form > .form-group > .btn')
        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise

        const groupName = await page.$eval('body > .container > .display-4', a => a.innerText)
        expect(groupName).to.equal('You are viewing: Test Group')
        const groupLeader = await page.$eval('body > .container > h6:nth-child(2)', a => a.innerText)
        expect(groupLeader).to.equal('Group Leader: UserA')
        const groupDesc = await page.$eval('body > .container > h6 > em', a => a.innerText)
        expect(groupDesc).to.equal('This is a new description')
        const groupStatus = await page.$eval('body > .container > .row > .col-md-9 > .text-secondary', a => a.innerText)
        expect(groupStatus).to.equal('You are currently the leader of Test Group')

        const editGroupInfoAlert = await page.$eval('body > .container > .alert', a => a.innerText)
        expect(editGroupInfoAlert).to.equal("Successfully updated group info")
    })

    it('Should be able to delete a group when there are no current/pending members & create a new group under the same event/join another group', async () => {
        const navigationPromise = page.waitForNavigation()
        
        // UserA deletes Test Group
        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.col-md-3 > .list-group > .list-group-item > #deleteGroup > .btn')
        await page.click('.col-md-3 > .list-group > .list-group-item > #deleteGroup > .btn')
        await navigationPromise

        const deleteGroupAlert = await page.$eval('body > .container > .alert', a => a.innerText)
        expect(deleteGroupAlert).to.equal("You deleted the group 'Test Group'.")

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')
        await navigationPromise

        // UserA should be able to add another group
        const addGroupButton = await page.$eval('body > .container > .btn', a => a.innerText)
        expect(addGroupButton).to.equal("Add a group")

        await page.waitForSelector('body > .container > .card > .card-body > a')
        await page.click('body > .container > .card > .card-body > a')
        await navigationPromise

        // UserA should be able to join another group in the same event
        const joinGroupButton = await page.$eval('.row > .col-md-9 > .mt-5 > #joinGroup > .btn', a => a.innerText)
        expect(joinGroupButton).to.equal("Join this group")

        await page.waitForSelector('.container > .row > .col-md-9 > .mt-5 > a')
        await page.click('.container > .row > .col-md-9 > .mt-5 > a')
        await navigationPromise
        
        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')
        await navigationPromise

        // UserA creates Test Group 2
        await page.waitForSelector('body > .container > .btn')
        await page.click('body > .container > .btn')
        await navigationPromise
        
        const name = await page.waitForSelector('.container > div > #createGroup > .form-group:nth-child(1) > .form-control')
        await name.type("Test Group 2")
        const desc = await page.waitForSelector('.container > div > #createGroup > .form-group:nth-child(2) > .form-control')
        await desc.type("This is test group 2!")

        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.container > div > #createGroup > .form-group > .btn')
        await page.click('.container > div > #createGroup > .form-group > .btn')
        await navigationPromise

        await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await navigationPromise
    })

    it('Should be able to request to join & cancel join request for an existing group', async () => {
        const navigationPromise = page.waitForNavigation()

        // UserB logs in
        await page.click('.row > .col > .form-group > a > .btn')
        await navigationPromise

        const username = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
        await username.type("UserB")
        const password = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await password.type("password")

        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise 

        await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await navigationPromise

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')        
        await navigationPromise

        await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
        await page.click('body > .container > .card:nth-child(2) > .card-body > a')           
        await navigationPromise

        // UserB clicks "Join Group" button
        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')
        await page.click('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')            
        await navigationPromise

        const pendingAlert = await page.$eval('body > .container > .alert', a => a.innerText)
        expect(pendingAlert).to.equal('Your join request is pending')
        const pendingStatus = await page.$eval('body > .container > .row > .col-md-9 > .text-secondary', a => a.innerText)
        expect(pendingStatus).to.equal('Your request to join Test Group 2 is pending')
        
        // UserB clicks "Cancel Join Request" button
        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.row > .col-md-9 > .mt-5 > #cancelJoin > .btn')
        await page.click('.row > .col-md-9 > .mt-5 > #cancelJoin > .btn')
        await navigationPromise

        const cancelJoinAlert = await page.$eval('body > .container > .alert', a => a.innerText)
        expect(cancelJoinAlert).to.equal('You have cancelled your pending request')

        // UserB requests to join Test Group 2
        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')
        await page.click('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')            
        await navigationPromise

        const groupStatus = await page.$eval('body > .container > .row > .col-md-9 > .text-secondary', a => a.innerText)
        expect(groupStatus).to.equal('Your request to join Test Group 2 is pending')

        await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await navigationPromise
    })

    // it('Should not be able to request to join group once the number of pending requests exceed max grp size', async () => {
    //     const navigationPromise = page.waitForNavigation()

    //     // UserC requests to join Test Group 2
    //     await page.click('.row > .col > .form-group > a > .btn')
    //     await navigationPromise

    //     const cUsername = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
    //     await cUsername.type("UserC")
    //     const cPassword = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
    //     await cPassword.type("password")

    //     await page.click('.container > div > form > .form-group > .btn')
    //     await navigationPromise 

    //     await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
    //     await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
    //     await navigationPromise

    //     await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
    //     await page.click('body > .container > .nav > .nav-item > .text-dark')        
    //     await navigationPromise

    //     await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
    //     await page.click('body > .container > .card:nth-child(2) > .card-body > a')           
    //     await navigationPromise

    //     page.once('dialog', async dialog => {
    //         await dialog.accept();
    //     });
    //     await page.waitForSelector('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')
    //     await page.click('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')            
    //     await navigationPromise

    //     await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
    //     await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
    //     await navigationPromise

    //     // UserD requests to join Test Group 2
    //     await page.click('.row > .col > .form-group > a > .btn')
    //     await navigationPromise

    //     const dUsername = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
    //     await dUsername.type("UserD")
    //     const dPassword = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
    //     await dPassword.type("password")

    //     await page.click('.container > div > form > .form-group > .btn')
    //     await navigationPromise 

    //     await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
    //     await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
    //     await navigationPromise

    //     await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
    //     await page.click('body > .container > .nav > .nav-item > .text-dark')        
    //     await navigationPromise

    //     await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
    //     await page.click('body > .container > .card:nth-child(2) > .card-body > a')           
    //     await navigationPromise

    //     page.once('dialog', async dialog => {
    //         await dialog.accept();
    //     });
    //     await page.waitForSelector('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')
    //     await page.click('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')            
    //     await navigationPromise

    //     await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
    //     await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
    //     await navigationPromise

    //     // UserE requests to join Test Group 2
    //     await page.click('.row > .col > .form-group > a > .btn')
    //     await navigationPromise

    //     const eUsername = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
    //     await eUsername.type("UserE")
    //     const ePassword = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
    //     await ePassword.type("password")

    //     await page.click('.container > div > form > .form-group > .btn')
    //     await navigationPromise 

    //     await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
    //     await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
    //     await navigationPromise

    //     await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
    //     await page.click('body > .container > .nav > .nav-item > .text-dark')        
    //     await navigationPromise

    //     await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
    //     await page.click('body > .container > .card:nth-child(2) > .card-body > a')           
    //     await navigationPromise

    //     page.once('dialog', async dialog => {
    //         await dialog.accept();
    //     });
    //     await page.waitForSelector('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')
    //     await page.click('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')            
    //     await navigationPromise

    //     await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
    //     await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
    //     await navigationPromise

    //     // UserF tries to join Test Group 2
    //     await page.click('.row > .col > .form-group > a > .btn')
    //     await navigationPromise

    //     const fUsername = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
    //     await fUsername.type("UserF")
    //     const fPassword = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
    //     await fPassword.type("password")

    //     await page.click('.container > div > form > .form-group > .btn')
    //     await navigationPromise 

    //     await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
    //     await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
    //     await navigationPromise

    //     await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
    //     await page.click('body > .container > .nav > .nav-item > .text-dark')        
    //     await navigationPromise

    //     await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
    //     await page.click('body > .container > .card:nth-child(2) > .card-body > a')           
    //     await navigationPromise


    //     await expect(page).to.not.have('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')

    //     await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
    //     await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
    //     await navigationPromise
    // })

    it('Group leader should be able to accept and reject pending requests', async () => {
        const navigationPromise = page.waitForNavigation()

        // UserC requests to join Test Group 2
        await page.click('.row > .col > .form-group > a > .btn')
        await navigationPromise

        const cUsername = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
        await cUsername.type("UserC")
        const cPassword = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await cPassword.type("password")

        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise 

        await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await navigationPromise

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')        
        await navigationPromise

        await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
        await page.click('body > .container > .card:nth-child(2) > .card-body > a')           
        await navigationPromise

        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')
        await page.click('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')            
        await navigationPromise

        await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await navigationPromise

        // UserD requests to join Test Group 2
        await page.click('.row > .col > .form-group > a > .btn')
        await navigationPromise

        const dUsername = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
        await dUsername.type("UserD")
        const dPassword = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await dPassword.type("password")

        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise 

        await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await navigationPromise

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')        
        await navigationPromise

        await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
        await page.click('body > .container > .card:nth-child(2) > .card-body > a')           
        await navigationPromise

        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')
        await page.click('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')            
        await navigationPromise

        await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await navigationPromise

        // UserE requests to join Test Group 2
        await page.click('.row > .col > .form-group > a > .btn')
        await navigationPromise

        const eUsername = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
        await eUsername.type("UserE")
        const ePassword = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await ePassword.type("password")

        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise 

        await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await navigationPromise

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')        
        await navigationPromise

        await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
        await page.click('body > .container > .card:nth-child(2) > .card-body > a')           
        await navigationPromise

        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')
        await page.click('.row > .col-md-9 > .mt-5 > #joinGroup > .btn')            
        await navigationPromise

        await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await navigationPromise
        
        // UserA logs in and accesses Test Group 2
        await page.click('.row > .col > .form-group > a > .btn')
        await navigationPromise

        const aUsername = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
        await aUsername.type("UserA")
        const aPassword = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await aPassword.type("password")

        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise 

        await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await navigationPromise

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')        
        await navigationPromise

        await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
        await page.click('body > .container > .card:nth-child(2) > .card-body > a')           
        await navigationPromise

        // UserA accepts UserB, UserC, UserD and rejects UserE
        await page.waitForSelector('.container > .col-md-3 > .list-group > .text-decoration-none > .text-dark')
        await page.click('.container > .col-md-3 > .list-group > .text-decoration-none > .text-dark')
        await navigationPromise

        const pendingRequests = await page.$eval('.container > .col-md-3 > .list-group > .list-group-item > .badge', a => a.innerText)
        expect(pendingRequests).to.equal('4')

        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.row:nth-child(2) > .col-lg-9 > .card > .card-body > .mt-3 > .row > form > .btn')
        await page.click('.row:nth-child(2) > .col-lg-9 > .card > .card-body > .mt-3 > .row > form > .btn')
        await navigationPromise
        
        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.row:nth-child(2) > .col-lg-9 > .card > .card-body > .mt-3 > .row > .mx-2 > form > .btn')
        await page.click('.row:nth-child(2) > .col-lg-9 > .card > .card-body > .mt-3 > .row > .mx-2 > form > .btn')
        await navigationPromise
        
        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.row:nth-child(2) > .col-lg-9 > .card > .card-body > .mt-3 > .row > .mx-2 > form > .btn')
        await page.click('.row:nth-child(2) > .col-lg-9 > .card > .card-body > .mt-3 > .row > .mx-2 > form > .btn')
        await navigationPromise
        
        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.mt-3 > .row > .mx-2 > form > .btn')
        await page.click('.mt-3 > .row > .mx-2 > form > .btn')
        await navigationPromise

        const noPendingRequests = await page.$eval('.container > .row > .col-md-9 > .mt-3 > em', a => a.innerText)
        expect(noPendingRequests).to.equal('There are currently no pending requests.')

        await page.waitForSelector('.container > .col-md-3 > .list-group > .list-group-item:nth-child(1) > .text-dark')
        await page.click('.container > .col-md-3 > .list-group > .list-group-item:nth-child(1) > .text-dark')
        await navigationPromise

        const c = await page.$eval('.row:nth-child(4) > .col-lg-9 > .card > .card-body > .card-title', a => a.innerText)
        expect(c).to.equal('UserC')
        const d = await page.$eval('.row:nth-child(5) > .col-lg-9 > .card > .card-body > .card-title', a => a.innerText)
        expect(d).to.equal('UserD')
        const e = await page.$eval('.row:nth-child(6) > .col-lg-9 > .card > .card-body > .card-title', a => a.innerText)
        expect(e).to.equal('UserE')
    })

    it('Group leader should be able to remove a member', async () => {
        const navigationPromise = page.waitForNavigation()

        // UserA removes UserC
        await page.waitForSelector('.container > .col-md-3 > .list-group > .list-group-item:nth-child(4) > .text-dark')
        await page.click('.container > .col-md-3 > .list-group > .list-group-item:nth-child(4) > .text-dark')
        await navigationPromise

        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.row:nth-child(4) > .col-lg-9 > .card > .card-body > .card-text > div > div > #remove > .btn')
        await page.click('.row:nth-child(4) > .col-lg-9 > .card > .card-body > .card-text > div > div > #remove > .btn')
        await navigationPromise

        const removeAlert = await page.$eval('body > .container > .alert', a => a.innerText)
        expect(removeAlert).to.equal("You have removed UserC from the group.")
  
        await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await navigationPromise
    })

    it('Should update if user is rejected', async () => {
        const navigationPromise = page.waitForNavigation()

        // UserB logs in to view "rejected" status
        await page.click('.row > .col > .form-group > a > .btn')
        await navigationPromise

        const cUsername = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
        await cUsername.type("UserB")
        const cPassword = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await cPassword.type("password")

        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise 

        await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await navigationPromise

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')        
        await navigationPromise

        await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
        await page.click('body > .container > .card:nth-child(2) > .card-body > a')       
        await navigationPromise

        const rejcted = await page.$eval('body > .container > .row > .col-md-9 > .text-danger', a => a.innerText)
        expect(rejcted).to.equal("Your request to join Test Group 2 has been rejected")

        await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await navigationPromise
    })

    it('Should update if user is removed', async () => {
        const navigationPromise = page.waitForNavigation()

        // UserC logs in to view "removed" status
        await page.click('.row > .col > .form-group > a > .btn')
        await navigationPromise

        const cUsername = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
        await cUsername.type("UserC")
        const cPassword = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await cPassword.type("password")

        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise 

        await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await navigationPromise

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')        
        await navigationPromise

        await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
        await page.click('body > .container > .card:nth-child(2) > .card-body > a')       
        await navigationPromise

        const removed = await page.$eval('body > .container > .row > .col-md-9 > .text-danger', a => a.innerText)
        expect(removed).to.equal("You have been removed from Test Group 2")

        await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await navigationPromise
    })

    it('Should update if user is accepted', async () => {
        const navigationPromise = page.waitForNavigation()

        // UserD logs in to view "accepted" status
        await page.click('.row > .col > .form-group > a > .btn')
        await navigationPromise

        const cUsername = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
        await cUsername.type("UserD")
        const cPassword = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await cPassword.type("password")

        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise 

        await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await navigationPromise

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')        
        await navigationPromise

        await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
        await page.click('body > .container > .card:nth-child(2) > .card-body > a')           
        await navigationPromise

        const accepted = await page.$eval('body > .container > .row > .col-md-9 > .text-secondary', a => a.innerText)
        expect(accepted).to.equal("You are currently a member of Test Group 2")
    })

    it('Should be able to leave the group', async () => {
        const navigationPromise = page.waitForNavigation()

        // UserD chooses to leave Test Group
        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.col-md-3 > .list-group > .list-group-item > #leaveGroup > .btn')
        await page.click('.col-md-3 > .list-group > .list-group-item > #leaveGroup > .btn')

        const leaveGroupAlert = await page.$eval('body > .container > .alert', a => a.innerText)
        expect(leaveGroupAlert).to.equal("You have left the group 'Test Group 2'.")

        await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await navigationPromise
    })

    it('Group leader should be able to close the group', async () => {
        const navigationPromise = page.waitForNavigation()

        // Group leader/UserA closes Test Group 2
        await page.click('.row > .col > .form-group > a > .btn')
        await navigationPromise

        const username = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
        await username.type("UserA")
        const password = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await password.type("password")

        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise 

        await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')          
        await navigationPromise

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')
        await navigationPromise

        await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
        await page.click('body > .container > .card:nth-child(2) > .card-body > a')       
        await navigationPromise

        await page.waitForSelector('.container > .col-md-3 > .list-group > .list-group-item:nth-child(4) > .text-dark')
        await page.click('.container > .col-md-3 > .list-group > .list-group-item:nth-child(4) > .text-dark')
        await navigationPromise

        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.row > .col-md-9 > .mt-5 > #close > .btn')
        await page.click('.row > .col-md-9 > .mt-5 > #close > .btn')
        await navigationPromise

        const closeGroupAlert = await page.$eval('body > .container > .alert', a => a.innerText)
        expect(closeGroupAlert).to.equal("You have closed the group 'Test Group 2'!")
    })

    it('Group leader should be able to reopen group', async () => {
        const navigationPromise = page.waitForNavigation()

        // Group leader/UserA reopens Test Group 2
        await page.waitForSelector('.container > .col-md-3 > .list-group > .list-group-item:nth-child(4) > .text-dark')
        await page.click('.container > .col-md-3 > .list-group > .list-group-item:nth-child(4) > .text-dark')
        await navigationPromise

        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.row > .col-md-9 > .mt-5 > #reopen > .btn')
        await page.click('.row > .col-md-9 > .mt-5 > #reopen > .btn')
        await navigationPromise

        const reopenGroupAlert = await page.$eval('body > .container > .alert', a => a.innerText)
        expect(reopenGroupAlert).to.equal("You have reopened the group 'Test Group 2'!")
    })

    it('Should be able to send a message in the forum', async () => {
        const navigationPromise = page.waitForNavigation()

        // UserA sends a message in the group forum
        await page.waitForSelector('.container > .col-md-3 > .list-group > .list-group-item:nth-child(2) > .text-dark')
        await page.click('.container > .col-md-3 > .list-group > .list-group-item:nth-child(2) > .text-dark')
        await navigationPromise
        
        const newMessage = await page.waitForSelector('.container > .col-md-8 > form > .form-group > .form-control')
        newMessage.type('Hello')

        await page.waitForSelector('body > .container > .col-md-8 > form > .btn')
        await page.click('body > .container > .col-md-8 > form > .btn')
        await navigationPromise

        const messageAuthor = await page.$eval('.col-md-8 > #messageThread > .row > .col-md-12 > strong', a => a.innerText)
        expect(messageAuthor).to.equal("UserA")
        const messageContent = await page.$eval('.col-md-8 > #messageThread > .row > .col-md-12 > p', a => a.innerText)
        expect(messageContent).to.equal("Hello")

        await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await navigationPromise
    })

    it('Should display messages from other users', async () => {
        const navigationPromise = page.waitForNavigation()

        // UserE logs in to view messages in Test Group 2
        await page.click('.row > .col > .form-group > a > .btn')
        await navigationPromise

        const username = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
        await username.type("UserE")
        const password = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await password.type("password")

        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise 

        await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')          
        await navigationPromise

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')
        await navigationPromise

        await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
        await page.click('body > .container > .card:nth-child(2) > .card-body > a')       
        await navigationPromise

        await page.waitForSelector('.container > .col-md-3 > .list-group > .list-group-item:nth-child(2) > .text-dark')
        await page.click('.container > .col-md-3 > .list-group > .list-group-item:nth-child(2) > .text-dark')
        await navigationPromise

        const messageAuthor = await page.$eval('.col-md-8 > #messageThread > .row > .col-md-12 > strong', a => a.innerText)
        expect(messageAuthor).to.equal("UserA")
        const messageContent = await page.$eval('.col-md-8 > #messageThread > .row > .col-md-12 > p', a => a.innerText)
        expect(messageContent).to.equal("Hello")

        await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await navigationPromise
    })

    it('Should be able to delete message', async () => {
        const navigationPromise = page.waitForNavigation()

        // UserA logs in to delete message in Test Group 2
        await page.click('.row > .col > .form-group > a > .btn')
        await navigationPromise

        const username = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
        await username.type("UserA")
        const password = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await password.type("password")

        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise 

        await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')          
        await navigationPromise

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')
        await navigationPromise

        await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
        await page.click('body > .container > .card:nth-child(2) > .card-body > a')       
        await navigationPromise

        await page.waitForSelector('.container > .col-md-3 > .list-group > .list-group-item:nth-child(2) > .text-dark')
        await page.click('.container > .col-md-3 > .list-group > .list-group-item:nth-child(2) > .text-dark')
        await navigationPromise

        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.row > .col-md-12 > .pull-right > #delete > .btn')
        await page.click('.row > .col-md-12 > .pull-right > #delete > .btn')
        await navigationPromise

        const deleteMessageAlert = await page.$eval('body > .container > .alert', a => a.innerText)
        expect(deleteMessageAlert).to.equal('Message deleted')
        const noMessages = await page.$eval('body > .container > .col-md-8 > .text-secondary', a => a.innerText)
        expect(noMessages).to.equal('There are currently no messages.')

        await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await navigationPromise
    })

    it('Should also delete message on other user accounts', async () => {
        const navigationPromise = page.waitForNavigation()

        // UserE logs in to view group forum in Test Group 2
        await page.click('.row > .col > .form-group > a > .btn')
        await navigationPromise

        const username = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
        await username.type("UserE")
        const password = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await password.type("password")

        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise 

        await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')          
        await navigationPromise

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')
        await navigationPromise

        await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
        await page.click('body > .container > .card:nth-child(2) > .card-body > a')       
        await navigationPromise

        await page.waitForSelector('.container > .col-md-3 > .list-group > .list-group-item:nth-child(2) > .text-dark')
        await page.click('.container > .col-md-3 > .list-group > .list-group-item:nth-child(2) > .text-dark')
        await navigationPromise

        const noMessages = await page.$eval('body > .container > .col-md-8 > .text-secondary', a => a.innerText)
        expect(noMessages).to.equal('There are currently no messages.')

        await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await navigationPromise
    })

    it('Group leader should be able to transfer group leadership', async () => {
        const navigationPromise = page.waitForNavigation()

        // Group leader/UserA transfers group leadership to UserE
        await page.click('.row > .col > .form-group > a > .btn')
        await navigationPromise

        const username = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
        await username.type("UserA")
        const password = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await password.type("password")

        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise 

        await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')          
        await navigationPromise

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')
        await navigationPromise

        await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
        await page.click('body > .container > .card:nth-child(2) > .card-body > a')       
        await navigationPromise

        await page.waitForSelector('.container > .col-md-3 > .list-group > .list-group-item:nth-child(4) > .text-dark')
        await page.click('.container > .col-md-3 > .list-group > .list-group-item:nth-child(4) > .text-dark')
        await navigationPromise

        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        await page.waitForSelector('.card-text > div > div > #makeLeader > .btn')
        await page.click('.card-text > div > div > #makeLeader > .btn')
        await navigationPromise

        const changeLeaderAlert = await page.$eval('body > .container > .alert', a => a.innerText)
        expect(changeLeaderAlert).to.equal('You have changed the group leader to UserE.')
        const memberStatus = await page.$eval('body > .container > .row > .col-md-9 > .text-secondary', a => a.innerText)
        expect(memberStatus).to.equal('You are currently a member of Test Group 2')

        await page.waitForSelector('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
        await navigationPromise
    })  

    it('New group leader should have access to the group leader actions', async () => {
        const navigationPromise = page.waitForNavigation()

        // UserE logs and views group page
        await page.click('.row > .col > .form-group > a > .btn')
        await navigationPromise

        const username = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
        await username.type("UserE")
        const password = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
        await password.type("password")

        await page.click('.container > div > form > .form-group > .btn')
        await navigationPromise 

        await page.waitForSelector('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
        await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')          
        await navigationPromise

        await page.waitForSelector('body > .container > .nav > .nav-item > .text-dark')
        await page.click('body > .container > .nav > .nav-item > .text-dark')
        await navigationPromise

        await page.waitForSelector('body > .container > .card:nth-child(2) > .card-body > a')
        await page.click('body > .container > .card:nth-child(2) > .card-body > a')       
        await navigationPromise

        const leaderStatus = await page.$eval('body > .container > .row > .col-md-9 > .text-secondary', a => a.innerText)
        expect(leaderStatus).to.equal('You are currently the leader of Test Group 2')
        const pendingRequests = await page.$eval('.container > .col-md-3 > .list-group > .text-decoration-none > .text-dark', a => a.innerText)
        expect(pendingRequests).to.equal('Pending Requests ')
        const groupSettings = await page.$eval('.container > .col-md-3 > .list-group > .list-group-item:nth-child(4) > .text-dark', a => a.innerText)
        expect(groupSettings).to.equal('Group Settings')  
        // const deleteGroup = await page.$eval('.col-md-3 > .list-group > .list-group-item > #deleteGroup > .btn', a => a.innerText)
        // expect(deleteGroup).to.equal('Delete Group')
    })
})