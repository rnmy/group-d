const chai = require('chai')
const chaiHttp = require('chai-http')
const app = require('../../app.js')
const mongoose = require('mongoose')
const db = require('../db-handler')
const expect = require('chai').expect 
const passport = require("passport")
const Event = require("../../models/event")
const Group = require("../../models/group")
const User = require("../../models/user")
const Notification = require("../../models/notification")
const puppeteer = require('puppeteer')
const { 
    mockUserInfo,
    testEventAInfo,
    testEventBInfo
} = require("../seeding/seeds")

describe("Testing user routes with puppeteer", () => {
    let page, browser
    before(async () => {
        await db.connect()
        browser = await puppeteer.launch(
            {
                executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                headless: false,    
                slowMo: 40,    
                timeout: 0
            })
            page = await browser.newPage()
            await page.setViewport({ width: 1382, height: 702 })
    }) 
    after(async () => {
        await browser.close()
    })
    describe("Accessing user profile pages", () => {
        before(async() => {
            await User.register(mockUserInfo, "password")
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
        })
        after(async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
            await navigationPromise
            await db.clearDatabase()

        })
        it("Should load user's profile page", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(1) > .nav-link')
            await navigationPromise            
            const headerText = await page.$eval('body > .container > .jumbotron > h1', a=> a.innerText)
            expect(headerText).to.equal("MockUser")
        })
        
        it("Should load user's groups", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.container > .mb-5 > .nav > .nav-item:nth-child(2) > .nav-link')
            await navigationPromise
            const displayText = await page.$eval('body > .container > .table > caption > em', a=>a.innerText)
            expect(displayText).to.equal("You currently have no active groups.")
            const headerText = await page.$eval('body > .container > .jumbotron > .mb-4', a=>a.innerText)
            expect(headerText).to.equal("MockUser's Groups")
        })
        it("Should load user's bookmarks", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.container > .mb-5 > .nav > .nav-item:nth-child(3) > .nav-link')
            await navigationPromise
            const displayText = await page.$eval('.container > .container > .row > .text-secondary > em', a => a.innerText)
            expect(displayText).to.equal("You currently have not bookmarked any events.")
            const headerText = await page.$eval('body > .container > .jumbotron > .mb-4', a => a.innerText)
            expect(headerText).to.equal("MockUser's Bookmarks")
        })
        it("Should load user's activity log", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.container > .mb-5 > .nav > .nav-item:nth-child(4) > .nav-link')
            await navigationPromise
            const displayText = await page.$eval('body > .container > .table > caption > em', a => a.innerText)
            expect(displayText).to.equal("No new activity.")
            const headerText = await page.$eval('body > .container > .jumbotron > .mb-4', a => a.innerText)
            expect(headerText).to.equal("MockUser's Activity Log")
        })
        it("Should load edit profile and change password pages", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.container > .mb-5 > .nav > .dropdown > .nav-link')
            await page.click('.mb-5 > .nav > .nav-item > .dropdown-menu > .dropdown-item:nth-child(1)')
            await navigationPromise
            const text1 = await page.$eval('body > .container > .container > .mb-3 > strong', a => a.innerText)
            expect(text1).to.equal("Edit Profile")
            await page.click('.container > .mb-5 > .nav > .dropdown > .nav-link')
            await page.click('.mb-5 > .nav > .nav-item > .dropdown-menu > .dropdown-item:nth-child(2)')
            await navigationPromise
            const text2 = await page.$eval('body > .container > .container > .mb-3 > strong', a => a.innerText)
            expect(text2).to.equal("Change Password")
        })
    })

    describe("Changing password", () => {
        before(async() => {
            await User.register(mockUserInfo, "password")
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
        })
        after(async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
            await navigationPromise
            await db.clearDatabase()
        })
        it("Should not be able to change password if current password is given wrongly", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(1) > .nav-link')
            await navigationPromise
            await page.click('.container > .mb-5 > .nav > .dropdown > .nav-link')
            await page.click('.mb-5 > .nav > .nav-item > .dropdown-menu > .dropdown-item:nth-child(2)')
            await navigationPromise
            const oldPassword = await page.waitForSelector('.container > .container > form > .form-group:nth-child(1) > .form-control')
            await oldPassword.type("password1")
            const newPassword = await page.waitForSelector('.container #new')
            await newPassword.type("password")
            const newPasswordConfirm = await page.waitForSelector('.container #confirm')
            await newPasswordConfirm.type("password")
            await page.click('body #submit')
            await navigationPromise
            const alert = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert).to.equal("Incorrect current password")
        })
        it("Should successfully change password when current password is entered correctly", async () => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(1) > .nav-link')
            await navigationPromise
            await page.click('.container > .mb-5 > .nav > .dropdown > .nav-link')
            await page.click('.mb-5 > .nav > .nav-item > .dropdown-menu > .dropdown-item:nth-child(2)')
            await navigationPromise
            const oldPassword = await page.waitForSelector('.container > .container > form > .form-group:nth-child(1) > .form-control')
            await oldPassword.type("password")
            const newPassword = await page.waitForSelector('.container #new')
            await newPassword.type("password1")
            const newPasswordConfirm = await page.waitForSelector('.container #confirm')
            await newPasswordConfirm.type("password1")
            await page.click('body #submit')
            await navigationPromise
            const alert = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert).to.equal("Password was changed successfully")
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
            await navigationPromise
        })
        it("Login with old password should fail", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.row > .col > .form-group > a > .btn')
            await navigationPromise
            const username = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
            await username.type("MockUser")
            const password = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
            await password.type("password")

            await page.click('.container > div > form > .form-group > .btn')
            await navigationPromise 
            const alert = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert).to.equal("Password or username is incorrect")
        })
        it("Login with new password should succeed", async() => {
            const navigationPromise = page.waitForNavigation()
            const username = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
            await username.type("MockUser")
            const password = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
            await password.type("password1")

            await page.click('.container > div > form > .form-group > .btn')
            await navigationPromise 
            expect(page.url()).to.equal("http://localhost:8080/events")
        })
    })
    describe("Updating profile", () => {
        before(async() => {
            await User.register(mockUserInfo, "password")
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
        })
        after(async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
            await navigationPromise
            await db.clearDatabase()
            await db.clearUploads()
        })
        it("Should not update profile if wrong type of file uploaded", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(1) > .nav-link')
            await navigationPromise
            await page.click('.container > .mb-5 > .nav > .dropdown > .nav-link')
            await page.click('.mb-5 > .nav > .nav-item > .dropdown-menu > .dropdown-item:nth-child(1)')
            await navigationPromise
            const picUpload = await page.$('input[type=file]')
            let fileToUpload = 'test/seeding/files/test.pdf'
            await picUpload.uploadFile(fileToUpload)
            const bio = await page.waitForSelector('.container #bio')
            await bio.click({ clickCount: 3 })
            await bio.type("Test")
            const email = await page.waitForSelector('.container #email')
            await email.click({ clickCount: 3 })
            await email.type("testing@test.com")
            const organization = await page.waitForSelector('.container #organization')
            await organization.click({ clickCount: 3 })
            await organization.type("Test")
            await page.click('body > .container > .container > form > .btn')
            await navigationPromise
            const alert = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert).to.equal("Please only upload images (.jpg/.jpeg/.png files)!")
        })
        it("Should successfully update profile", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(1) > .nav-link')
            await navigationPromise
            await page.click('.container > .mb-5 > .nav > .dropdown > .nav-link')
            await page.click('.mb-5 > .nav > .nav-item > .dropdown-menu > .dropdown-item:nth-child(1)')
            await navigationPromise
            const picUpload = await page.$('input[type=file]')
            let fileToUpload = 'test/seeding/files/test.jpg'
            await picUpload.uploadFile(fileToUpload)
            const bio = await page.waitForSelector('.container #bio')
            await bio.click({ clickCount: 3 })
            await bio.type("Test")
            const email = await page.waitForSelector('.container #email')
            await email.click({ clickCount: 3 })
            await email.type("testing@test.com")
            const organization = await page.waitForSelector('.container #organization')
            await organization.click({ clickCount: 3 })
            await organization.type("Test")
            await page.click('body > .container > .container > form > .btn')
            await navigationPromise
            const alert = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert).to.equal("Successfully updated profile") 
            const newOrg = await page.$eval('.row > .col-lg-3 > .card > .card-body > .card-subtitle', a=>a.innerHTML)
            expect(newOrg).to.equal("Test")
            const newBio = await page.$eval('.row > .col-lg-3 > .card > .card-body > .card-text', a => a.innerText)
            expect(newBio).to.equal("Test")
            const src = await page.$eval('img.profile[src]', img => img.getAttribute('src'))
            expect(src).to.not.equal("/placeholder/placeholder.png")
        })
    })
    describe("Adding and removing experience, interests and skills", () => {
        before(async() => {
            await User.register(mockUserInfo, "password")
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
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(1) > .nav-link')
            await navigationPromise
        })
        after(async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
            await navigationPromise
            await db.clearDatabase()
            await db.clearUploads()
        })
        it("Should add a new experience", async () => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.card:nth-child(1) > .card-body > .card-title > .row > .btn > .fa-plus')
            await navigationPromise
            const newExp = await page.waitForSelector('.card-text > form > .row > .ml-3 > .form-control')
            await newExp.type("Testing")
            const descr =  await page.waitForSelector('.card-text > form > .row > .form-group:nth-child(2) > .form-control')
            await descr.type("Test")
            await page.click('.card-text > form > .row > .form-group > .btn')
            await navigationPromise
            const alert = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert).to.equal("Successfully added experience")
            const updatedExp = await page.$eval('.col-lg-9 > .card > .card-body > .card-text > h5', a => a.innerText)
            expect(updatedExp).to.equal("Testing")
            const updatedDescr = await page.$eval('.col-lg-9 > .card > .card-body > .card-text > p', a => a.innerText)
            expect(updatedDescr).to.equal("Test")
        })
        it("Same experience cannot be added, case insensitive", async () => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.card:nth-child(1) > .card-body > .card-title > .row > .btn > .fa-plus')
            await navigationPromise
            const newExp = await page.waitForSelector('.card-text > form > .row > .ml-3 > .form-control')
            await newExp.type("Testing")
            const descr =  await page.waitForSelector('.card-text > form > .row > .form-group:nth-child(2) > .form-control')
            await descr.type("Test")
            await page.click('.card-text > form > .row > .form-group > .btn')
            await navigationPromise
            const alert = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert).to.equal("This experience already exists")
            await page.click('.card:nth-child(1) > .card-body > .card-title > .row > .btn > .fa-plus')
            await navigationPromise
            const newExp2 = await page.waitForSelector('.card-text > form > .row > .ml-3 > .form-control')
            await newExp2.type("testing")
            const descr2 =  await page.waitForSelector('.card-text > form > .row > .form-group:nth-child(2) > .form-control')
            await descr2.type("Test")
            await page.click('.card-text > form > .row > .form-group > .btn')
            await navigationPromise
            const alert2 = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert2).to.equal("This experience already exists")
        })
        it("Should delete added experience", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.card:nth-child(1) > .card-body > .card-title > .row > .btn > .fa-trash')
            await navigationPromise
            await page.click('.row > form > .form-group > .btn > .fa')
            await navigationPromise
            const alert = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert).to.equal("Successfully removed experience")
            const displayText = await page.$eval('.col-lg-9 > .card > .card-body > .card-text > h5', a => a.innerText)
            expect(displayText).to.equal("The user has not input any experiences")
        })
        it("Should add new skill", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.card:nth-child(2) > .card-body > .card-title > .row > .btn > .fa-plus')
            await navigationPromise
            const skill = await page.waitForSelector('.card-body > form > .row > .form-group > .form-control')
            await skill.type("Testing")
            await page.click('.card-body > form > .row > .form-group > .btn')
            await navigationPromise
            const alert = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert).to.equal("Successfully added skill")
            const newSkill = await page.$eval('.card > .card-body > ul > .row > li', a => a.innerHTML)
            expect(newSkill).to.equal("Testing")
        })
        it("Same skill cannot be added, case insensitive", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.card:nth-child(2) > .card-body > .card-title > .row > .btn > .fa-plus')
            await navigationPromise
            const skill = await page.waitForSelector('.card-body > form > .row > .form-group > .form-control')
            await skill.type("Testing")
            await page.click('.card-body > form > .row > .form-group > .btn')
            await navigationPromise
            const alert = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert).to.equal("You already have that skill!")
            await page.click('.card:nth-child(2) > .card-body > .card-title > .row > .btn > .fa-plus')
            await navigationPromise
            const skill2 = await page.waitForSelector('.card-body > form > .row > .form-group > .form-control')
            await skill2.type("testing")
            await page.click('.card-body > form > .row > .form-group > .btn')
            await navigationPromise
            const alert2 = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert2).to.equal("You already have that skill!")
        })
        it("Should delete added skill", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.card:nth-child(2) > .card-body > .card-title > .row > .btn > .fa-trash')
            await navigationPromise
            await page.click('.row > form > .form-group > .btn > .fa')
            await navigationPromise
            const alert = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert).to.equal("Successfully removed skill")
            const displayText = await page.$eval('.row > .col-lg-9 > .card:nth-child(2) > .card-body > h5', a => a.innerText)
            expect(displayText).to.equal("The user has not input any skills")
        })
        it("Should add a new interest", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.card:nth-child(3) > .card-body > .card-title > .row > .btn > .fa-plus')
            await navigationPromise
            const interest = await page.waitForSelector('.card-body > form > .row > .form-group > .form-control')
            await interest.type("Test")
            await page.click('.card-body > form > .row > .form-group > .btn')
            await navigationPromise
            const alert = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert).to.equal("Successfully added interest")
        })
        it("Same interest cannot be added, case insensitive", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.card:nth-child(3) > .card-body > .card-title > .row > .btn > .fa-plus')
            await navigationPromise
            const interest = await page.waitForSelector('.card-body > form > .row > .form-group > .form-control')
            await interest.type("Test")
            await page.click('.card-body > form > .row > .form-group > .btn')
            await navigationPromise
            const alert = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert).to.equal("You already have that interest!")
            await page.click('.card:nth-child(3) > .card-body > .card-title > .row > .btn > .fa-plus')
            await navigationPromise
            const interest2 = await page.waitForSelector('.card-body > form > .row > .form-group > .form-control')
            await interest2.type("test")
            await page.click('.card-body > form > .row > .form-group > .btn')
            await navigationPromise
            const alert2 = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert2).to.equal("You already have that interest!")
        })
        it("Should remove added interest", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.card:nth-child(3) > .card-body > .card-title > .row > .btn > .fa-trash')
            await navigationPromise
            await page.click('.row > form > .form-group > .btn > .fa')
            await navigationPromise
            const alert = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert).to.equal("Successfully removed interest")
            const displayText = await page.$eval('.row > .col-lg-9 > .card:nth-child(3) > .card-body > h5', a => a.innerText)
            expect(displayText).to.equal("The user has not input any interests")
        })
    })
    describe("Viewing and clearing notifications", () => {
        before(async() => {
            await User.register(mockUserInfo, "password")
            await Event.create(testEventAInfo)
            await Event.create(testEventBInfo)
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
        })
        after(async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
            await navigationPromise
            await db.clearDatabase()
            await db.clearUploads()
        })
        it("Notification should be added upon creation of a group", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
            await navigationPromise
            await page.click('body > .container > .nav > .nav-item > .text-dark')
            await navigationPromise
            await page.click('body > .container > .btn')
            await navigationPromise
            const groupName =   await page.waitForSelector('.container > div > #createGroup > .form-group:nth-child(1) > .form-control')
            await groupName.type("TestGroup")
            const groupDescr = await page.waitForSelector('.container > div > #createGroup > .form-group:nth-child(2) > .form-control')
            await groupDescr.type("Testing")
            page.on("dialog", async dialog => {
                await dialog.accept();
              })
            await page.click('.container > div > #createGroup > .form-group > .btn')
            await navigationPromise
            const alert = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert).to.equal('Successfully created the group "TestGroup" for EventA')
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(1) > .nav-link')
            await navigationPromise
            await page.click('.container > .mb-5 > .nav > .nav-item:nth-child(4) > .nav-link')
            await navigationPromise
            const notification = await page.$eval('.container > .table > tbody > tr:nth-child(1) > td:nth-child(1)', a => a.innerHTML)
            expect(notification).to.not.equal("No new activity.")
            await page.click('.table > tbody > tr:nth-child(1) > .mb-1 > .btn')
            await navigationPromise
            const groupCreated = await page.$eval('body > .container > .display-4', a => a.innerText)
            expect(groupCreated).to.equal("You are viewing: TestGroup")
            await page.goBack()  
        })
        it("Should successfully clear notification", async() => {
            const navigationPromise = page.waitForNavigation()
            await page.click('tbody > tr:nth-child(1) > .mb-1 > .d-inline > .btn')
            await navigationPromise
            const cleared = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(cleared).to.equal("Notification cleared")
            const displayText = await page.$eval('body > .container > .table > caption > em', a => a.innerText)
            expect(displayText).to.equal("No new activity.")
        })
    })
})
