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
    mockUserInfo,
    testEventAInfo,
    testEventBInfo
} = require("../seeding/seeds")

describe("Testing event routes with puppeteer", () => {
    let browser, page, eventA, eventB, user
    before(async() => {
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
    beforeEach(async () => {
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
    after(async () => {
        await browser.close()
    })

    afterEach(async() => {
        await db.clearDatabase()
        await page.goto("http://localhost:8080/");
    })

    describe("Events page", () => {
        it("Should load events in database upon login", async () => {                    
            const eventsHeader = await page.$eval('body > .container > .jumbotron > .container > h1', a => a.innerText)
            expect(eventsHeader).to.equal('Events')
            const eventsHeaderDesc = await page.$eval('body > .container > .jumbotron > .container > p', a => a.innerText)
            expect(eventsHeaderDesc).to.equal('View the latest hackathons, projects and competitions you can join today!')
            const eventA = await page.$eval('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a', a => a.innerText)
            expect(eventA).to.equal('EventA')
            const eventB = await page.$eval('.col-sm-12:nth-child(3) > .card > .card-body > .card-title > a', a => a.innerText)
            expect(eventB).to.equal('EventB')
        })
        
        describe('Testing the search-filter bar', () => {
            it('Search: Event, Category: All', async() => {
                const navigationPromise = page.waitForNavigation()
                
                const search = await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .form-control')
                await search.type("Event")
                
                await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .btn')
                await page.click('.col-sm-12 > .form-inline > .row > .input-group > .btn')
                
                await navigationPromise
    
                const eventsHeader = await page.$eval('body > .container > .jumbotron > .container > h1', a => a.innerText)
                expect(eventsHeader).to.equal('Events')
                const eventsHeaderDesc = await page.$eval('body > .container > .jumbotron > .container > p', a => a.innerText)
                expect(eventsHeaderDesc).to.equal('View the latest hackathons, projects and competitions you can join today!')
                const eventA = await page.$eval('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a', a => a.innerText)
                expect(eventA).to.equal('EventA')
                const eventB = await page.$eval('.col-sm-12:nth-child(3) > .card > .card-body > .card-title > a', a => a.innerText)
                expect(eventB).to.equal('EventB')
            })

            it('Search: B, Category: All', async() => {
                const navigationPromise = page.waitForNavigation()
                
                const search = await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .form-control')
                await search.type("B")
                
                await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .btn')
                await page.click('.col-sm-12 > .form-inline > .row > .input-group > .btn')
                
                await navigationPromise
    
                const eventsHeader = await page.$eval('body > .container > .jumbotron > .container > h1', a => a.innerText)
                expect(eventsHeader).to.equal('Events')
                const eventsHeaderDesc = await page.$eval('body > .container > .jumbotron > .container > p', a => a.innerText)
                expect(eventsHeaderDesc).to.equal('View the latest hackathons, projects and competitions you can join today!')
                const eventB = await page.$eval('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a', a => a.innerText)
                expect(eventB).to.equal('EventB')
            })

            it('Search: DOESNOTEXIST, Category: All', async() => {
                const navigationPromise = page.waitForNavigation()
                
                const search = await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .form-control')
                await search.type("DOESNOTEXIST")
                
                await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .btn')
                await page.click('.col-sm-12 > .form-inline > .row > .input-group > .btn')
                
                await navigationPromise
    
                const eventsHeader = await page.$eval('body > .container > .jumbotron > .container > h1', a => a.innerText)
                expect(eventsHeader).to.equal('Events')
                const eventsHeaderDesc = await page.$eval('body > .container > .jumbotron > .container > p', a => a.innerText)
                expect(eventsHeaderDesc).to.equal('View the latest hackathons, projects and competitions you can join today!')
                const noResults = await page.$eval('body > .container > .row > .mt-4 > h3', a => a.innerText)
                expect(noResults).to.equal('No events match that query, please try again.')
            })

            it('Search: , Category: Computing', async() => {
                const navigationPromise = page.waitForNavigation()
                
                await page.waitForSelector('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
                await page.click('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
                
                await page.waitForSelector('.dropdown-menu > #bs-select-1 #bs-select-1-0')
                await page.click('.dropdown-menu > #bs-select-1 #bs-select-1-0')
                
                await page.select('.row #filter', '')
                
                await page.waitForSelector('.dropdown-menu > #bs-select-1 #bs-select-1-3')
                await page.click('.dropdown-menu > #bs-select-1 #bs-select-1-3')
                
                await page.select('.row #filter', 'Computing')
                
                await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .btn')
                await page.click('.col-sm-12 > .form-inline > .row > .input-group > .btn')
            
                await navigationPromise

                const eventsHeader = await page.$eval('body > .container > .jumbotron > .container > h1', a => a.innerText)
                expect(eventsHeader).to.equal('Events')
                const eventsHeaderDesc = await page.$eval('body > .container > .jumbotron > .container > p', a => a.innerText)
                expect(eventsHeaderDesc).to.equal('View the latest hackathons, projects and competitions you can join today!')
                const eventA = await page.$eval('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a', a => a.innerText)
                expect(eventA).to.equal('EventA')
                const eventB = await page.$eval('.col-sm-12:nth-child(3) > .card > .card-body > .card-title > a', a => a.innerText)
                expect(eventB).to.equal('EventB')
            })
            
            it('Search: , Category: Business', async() => {
                const navigationPromise = page.waitForNavigation()
                
                await page.waitForSelector('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
                await page.click('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
                
                await page.waitForSelector('.dropdown-menu > #bs-select-1 #bs-select-1-0')
                await page.click('.dropdown-menu > #bs-select-1 #bs-select-1-0')
                
                await page.select('.row #filter', 'Business')
                
                await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .btn')
                await page.click('.col-sm-12 > .form-inline > .row > .input-group > .btn')
            
                await navigationPromise
    
                const eventsHeader = await page.$eval('body > .container > .jumbotron > .container > h1', a => a.innerText)
                expect(eventsHeader).to.equal('Events')
                const eventsHeaderDesc = await page.$eval('body > .container > .jumbotron > .container > p', a => a.innerText)
                expect(eventsHeaderDesc).to.equal('View the latest hackathons, projects and competitions you can join today!')
                const eventB = await page.$eval('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a', a => a.innerText)
                expect(eventB).to.equal('EventB')
            })

            it('Search: , Category: Arts', async() => {
                const navigationPromise = page.waitForNavigation()
                
                await page.waitForSelector('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
                await page.click('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
                
                await page.waitForSelector('.dropdown-menu > #bs-select-1 #bs-select-1-0')
                await page.click('.dropdown-menu > #bs-select-1 #bs-select-1-0')
                
                await page.select('.row #filter', 'Arts')
                
                await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .btn')
                await page.click('.col-sm-12 > .form-inline > .row > .input-group > .btn')
            
                await navigationPromise
    
                const eventsHeader = await page.$eval('body > .container > .jumbotron > .container > h1', a => a.innerText)
                expect(eventsHeader).to.equal('Events')
                const eventsHeaderDesc = await page.$eval('body > .container > .jumbotron > .container > p', a => a.innerText)
                expect(eventsHeaderDesc).to.equal('View the latest hackathons, projects and competitions you can join today!')
                const noResults = await page.$eval('body > .container > .row > .mt-4 > h3', a => a.innerText)
                expect(noResults).to.equal('No events match that query, please try again.')
            })

            it('Search: Event, Category: Computing', async() => {
                const navigationPromise = page.waitForNavigation()
                
                const search = await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .form-control')
                await search.type("Event")

                await page.waitForSelector('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
                await page.click('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
                
                await page.waitForSelector('.dropdown-menu > #bs-select-1 #bs-select-1-0')
                await page.click('.dropdown-menu > #bs-select-1 #bs-select-1-0')
                
                await page.select('.row #filter', 'Computing')
                
                await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .btn')
                await page.click('.col-sm-12 > .form-inline > .row > .input-group > .btn')
            
                await navigationPromise
    
                const eventsHeader = await page.$eval('body > .container > .jumbotron > .container > h1', a => a.innerText)
                expect(eventsHeader).to.equal('Events')
                const eventsHeaderDesc = await page.$eval('body > .container > .jumbotron > .container > p', a => a.innerText)
                expect(eventsHeaderDesc).to.equal('View the latest hackathons, projects and competitions you can join today!')
                const eventA = await page.$eval('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a', a => a.innerText)
                expect(eventA).to.equal('EventA')
                const eventB = await page.$eval('.col-sm-12:nth-child(3) > .card > .card-body > .card-title > a', a => a.innerText)
                expect(eventB).to.equal('EventB')
            })

            it('Search: Event, Category: Business', async() => {
                const navigationPromise = page.waitForNavigation()
                
                const search = await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .form-control')
                await search.type("Event")

                await page.waitForSelector('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
                await page.click('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
                
                await page.waitForSelector('.dropdown-menu > #bs-select-1 #bs-select-1-0')
                await page.click('.dropdown-menu > #bs-select-1 #bs-select-1-0')
                
                await page.select('.row #filter', 'Business')
                
                await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .btn')
                await page.click('.col-sm-12 > .form-inline > .row > .input-group > .btn')
            
                await navigationPromise
    
                const eventsHeader = await page.$eval('body > .container > .jumbotron > .container > h1', a => a.innerText)
                expect(eventsHeader).to.equal('Events')
                const eventsHeaderDesc = await page.$eval('body > .container > .jumbotron > .container > p', a => a.innerText)
                expect(eventsHeaderDesc).to.equal('View the latest hackathons, projects and competitions you can join today!')
                const eventB = await page.$eval('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a', a => a.innerText)
                expect(eventB).to.equal('EventB')
            })

            it('Search: B, Category: Computing', async() => {
                const navigationPromise = page.waitForNavigation()
                
                const search = await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .form-control')
                await search.type("B")

                await page.waitForSelector('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
                await page.click('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
                
                await page.waitForSelector('.dropdown-menu > #bs-select-1 #bs-select-1-0')
                await page.click('.dropdown-menu > #bs-select-1 #bs-select-1-0')
                
                await page.select('.row #filter', 'Computing')
                
                await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .btn')
                await page.click('.col-sm-12 > .form-inline > .row > .input-group > .btn')
            
                await navigationPromise
    
                const eventsHeader = await page.$eval('body > .container > .jumbotron > .container > h1', a => a.innerText)
                expect(eventsHeader).to.equal('Events')
                const eventsHeaderDesc = await page.$eval('body > .container > .jumbotron > .container > p', a => a.innerText)
                expect(eventsHeaderDesc).to.equal('View the latest hackathons, projects and competitions you can join today!')
                const eventB = await page.$eval('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a', a => a.innerText)
                expect(eventB).to.equal('EventB')
            })

            it('Search: A, Category: Business', async() => {
                const navigationPromise = page.waitForNavigation()
                
                const search = await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .form-control')
                await search.type("A")

                await page.waitForSelector('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
                await page.click('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
                
                await page.waitForSelector('.dropdown-menu > #bs-select-1 #bs-select-1-0')
                await page.click('.dropdown-menu > #bs-select-1 #bs-select-1-0')
                
                await page.select('.row #filter', 'Business')
                
                await page.waitForSelector('.col-sm-12 > .form-inline > .row > .input-group > .btn')
                await page.click('.col-sm-12 > .form-inline > .row > .input-group > .btn')
            
                await navigationPromise
    
                const eventsHeader = await page.$eval('body > .container > .jumbotron > .container > h1', a => a.innerText)
                expect(eventsHeader).to.equal('Events')
                const eventsHeaderDesc = await page.$eval('body > .container > .jumbotron > .container > p', a => a.innerText)
                expect(eventsHeaderDesc).to.equal('View the latest hackathons, projects and competitions you can join today!')
                const noResults = await page.$eval('body > .container > .row > .mt-4 > h3', a => a.innerText)
                expect(noResults).to.equal('No events match that query, please try again.')
            })
        })
    })

    describe("Adding a new event", () => {
        it("GET and POST /events/new", async () => {
            const navigationPromise = page.waitForNavigation()

            await page.click('body > .container > .jumbotron > .container > .btn')
            await navigationPromise

            const eventName = await page.waitForSelector('.container > div > form > .form-group:nth-child(1) > .form-control')
            await eventName.type("MockEvent")
            const eventSite = await page.waitForSelector('.container > div > form > .form-group:nth-child(2) > .form-control')
            await eventSite.type("www.google.com")
            const description = await page.waitForSelector('.container > div > form > .form-group:nth-child(3) > .form-control')
            await description.type("Testing")
            await page.click('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
            await page.click('.dropdown-menu > #bs-select-1 #bs-select-1-1')
            await page.select('div #cat', 'Business')
            await page.click('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
            const requirements = await page.waitForSelector('.container > div > form > .form-group:nth-child(5) > .form-control')
            await requirements.type("Testing")
            const prizes = await page.waitForSelector('.container > div > form > .form-group:nth-child(6) > .form-control')
            await prizes.type("Testing")
            const eventDate = await page.waitForSelector('.container > div > form > .input-group:nth-child(7) > .form-control')
            await eventDate.type("27072020")
            const deadline = await page.waitForSelector('.container > div > form > .input-group:nth-child(8) > .form-control')
            await deadline.type("27072020")
            const minGroupSize = await page.waitForSelector('.container > div > form > .form-group:nth-child(9) > .form-control')
            await minGroupSize.type("1")
            const maxGroupSize = await page.waitForSelector('.container > div > form > .form-group:nth-child(10) > .form-control')
            await maxGroupSize.type("4")

            await page.click('.container > div > form > .form-group > .btn')
            await navigationPromise

            const text = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(text).to.equal('The event "MockEvent" has been created successfully')
            await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
            const eventTitle = await page.$eval('body > .container > .jumbotron > .container > .display-3', a => a.innerText)
            expect(eventTitle).to.equal("MockEvent")
            const eventAuthor = await page.$eval('body > .container > .jumbotron > .container > h6', a => a.innerText)
            expect(eventAuthor).to.equal("Submitted by MockUser")
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
            await navigationPromise
        })
    })


    describe("Adding events to bookmakrs", () => {
        it("Adding Events A and B to bookmarks", async () => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
            await navigationPromise
            await page.click('.container > .jumbotron > .container > form > .btn')
            await navigationPromise
            const alert1 = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert1).to.equal("Event saved to your bookmarks")

            await page.click('body > .navbar > .navbar-brand')
            await navigationPromise
            await page.click('.col-sm-12:nth-child(3) > .card > .card-body > .card-title > a')
            await navigationPromise
            await page.click('.container > .jumbotron > .container > form > .btn')
            await navigationPromise
            const alert2 =  await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert2).to.equal("Event saved to your bookmarks")

            await page.click('.navbar > #navbarSupportedContent #navbarDropdown')
            await page.click('#navbarSupportedContent > .navbar-nav > .nav-item > .dropdown-menu > .dropdown-item:nth-child(5)')
            await navigationPromise
            await page.click('.col-sm-12:nth-child(1) > .card > .card-body > .card-title > a')
            await navigationPromise
            const firstBookmark = await page.$eval('body > .container > .jumbotron > .container > .display-3', a => a.innerText)
            expect(firstBookmark).to.equal("EventA")
            await page.click('.navbar > #navbarSupportedContent #navbarDropdown')
            await page.click('#navbarSupportedContent > .navbar-nav > .nav-item > .dropdown-menu > .dropdown-item:nth-child(5)')
            await navigationPromise
            await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
            await navigationPromise
            const secondBookmark = await page.$eval('body > .container > .jumbotron > .container > .display-3', a => a.innerText)
            expect(secondBookmark).to.equal("EventB")
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
            await navigationPromise
        })
    })

    describe("Editing an event", () => {
        it("GET and POST /events/:id/edit", async () => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
            await navigationPromise

            await page.click('.container > .jumbotron > .container > div > .btn-success')
            await navigationPromise
            //const eventName = await page.waitForSelector('.container #eventname')
            const eventSite = await page.waitForSelector('.container #eventurl')
            await eventSite.click({ clickCount: 3 })
            await eventSite.type("www.youtube.com")
            const description = await page.waitForSelector('.container #description')
            await description.click({ clickCount: 3 })
            await description.type("Testing")
            await page.click('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
            await page.select('.container #cat', 'Computing')
            await page.click('.dropdown > .btn > .filter-option > .filter-option-inner > .filter-option-inner-inner')
            const requirements = await page.waitForSelector('.container #requirements')
            await requirements.click({ clickCount: 3 })
            await requirements.type("Testing")
            const prizes = await page.waitForSelector('.container #prizes')
            await prizes.click({ clickCount: 3 })
            await prizes.type("Testing")
            // const eventDate = await page.waitForSelector('.container #date')
            // const deadline = await page.waitForSelector('.container #deadline')
            // const minGroupSize = await page.waitForSelector('.container #min')
            // const maxGroupSize = await page.waitForSelector('.container #max')

            await page.click('body > .container > .container > form > .btn-success')
            await navigationPromise

            const alertMessage = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alertMessage).to.equal("The event has been updated successfully")
       
            await page.click('.navbar > #navbarSupportedContent > .navbar-nav > .nav-item:nth-child(2) > .nav-link')
            await navigationPromise
    
        })
    })

    describe("Removing events from bookmarks", () => {
        beforeEach(async () => {
            eventA.bookmarks.push(user)
            await eventA.save()
            eventB.bookmarks.push(user)
            await eventB.save()
        })
        it("Removing Events A and B from bookmarks", async () => {
            const navigationPromise = page.waitForNavigation()
            await page.click('.col-sm-12:nth-child(2) > .card > .card-body > .card-title > a')
            await navigationPromise
            await page.click('.container > .jumbotron > .container > form > .btn')
            await navigationPromise
            const alert1 = await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert1).to.equal("Event removed from your bookmarks")

            await page.click('body > .navbar > .navbar-brand')
            await navigationPromise
            await page.click('.col-sm-12:nth-child(3) > .card > .card-body > .card-title > a')
            await navigationPromise
            await page.click('.container > .jumbotron > .container > form > .btn')
            await navigationPromise
            const alert2 =  await page.$eval('body > .container > .alert', a => a.innerText)
            expect(alert2).to.equal("Event removed from your bookmarks")

            await page.click('.navbar > #navbarSupportedContent #navbarDropdown')
            await page.click('#navbarSupportedContent > .navbar-nav > .nav-item > .dropdown-menu > .dropdown-item:nth-child(5)')
            await navigationPromise
            const text = await page.$eval('.container > .container > .row > .text-secondary > em', a => a.innerText)
            expect(text).to.equal("You currently have not bookmarked any events.")
        })
    })
})