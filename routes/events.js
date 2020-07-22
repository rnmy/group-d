const express = require('express')
const router = express.Router()
const Event = require("../models/event")
const middleware = require("../middleware")
const helper = require("../helper")
const validator = require('validator')

// Show events page
router.get("/", middleware.isLoggedIn, (req, res) => {
  // console.log(req.query)
  if(req.query.search) {
    if(req.query.filter.includes('All')) {
      const regex = new RegExp(helper.escapeRegex(req.query.search), 'gi')
      Event.find({deadline:{$gte:new Date()}}).sort({deadline: 1}).find({name: regex}, (err, searchEvents) => {
          if(err){
              req.flash("error", "Something went wrong...Try again")
              res.redirect("back")
          } else {
              res.render("./events/index", {events: searchEvents, search: req.query.search, cat: req.query.filter});
          }
      });
    } else {
      const regex = new RegExp(helper.escapeRegex(req.query.search), 'gi')
      Event.find({deadline:{$gte:new Date()}}).sort({deadline: 1}).find({$and : [{'cat' : {$in : req.query.filter}}, {name: regex}]}, (err, filterEvents) => {
        if(err){
            req.flash("error", "Something went wrong...Try again")
            res.redirect("back")
        } else {
            res.render("./events/index", {events: filterEvents, search: req.query.search, cat: req.query.filter});
        }
      })
    } 
  } else if (req.query.filter) {
    if(req.query.filter.includes('All')) {
      Event.find({deadline:{$gte:new Date()}}).sort({deadline: 1}).find({}, (err, allEvents) => {
          if(err){
              req.flash("error", "Something went wrong...Try again")
              res.redirect("back")
          } else {
              res.render("./events/index", {events: allEvents, search: "", cat: req.query.filter});
          }
      });
    } else {
      Event.find({deadline:{$gte:new Date()}}).sort({deadline: 1}).find({'cat' : {$in : req.query.filter}}, (err, filterEvents) => {
        if(err){
            req.flash("error", "Something went wrong...Try again")
            res.redirect("back")
        } else {
            res.render("./events/index", {events: filterEvents, search: req.query.search, cat: req.query.filter});
        }
      })
    } 
  } else {
    Event.find({deadline:{$gte:new Date()}}).sort({deadline: 1}).find({}, (err, allEvents) => {
        if(err){
            req.flash("error", "Something went wrong...Try again")
            res.redirect("back")
        } else {
            res.render("./events/index", {events: allEvents, search: "", cat: ['All']});
        }
    });
  }
});

// Show form to add new event
router.get("/new", middleware.isLoggedIn, (req, res) => {
    res.render("./events/new", {data: {}, cat:"", error:""});
});

// Add new event to DB
router.post("/", middleware.isLoggedIn, (req, res) => {
    const validURL = validator.isURL(req.body.event.url)
      if(!validURL){
        console.log(req.body.event.cat)
        res.render("./events/new", {data: req.body.event, cat: req.body.cat, error:"Please input a valid url"})
      } else {
        req.body.event.name = req.sanitize(req.body.event.name)
        req.body.event.url = req.sanitize(req.body.event.url)
        req.body.event.desc = req.sanitize(req.body.event.desc)
        req.body.event.cat = req.body.cat
        req.body.event.requirements = req.sanitize(req.body.event.requirements)
        req.body.event.prizes = req.sanitize(req.body.event.prizes)
        const author = {
          id: req.user._id,
          username: req.user.username
        }
        Event.create(req.body.event, (err, event) => {
          if(err){
              res.render("./events/new", {data: req.body.event, error:"This event has already been created!"})
          } else {
              event.author = author
              event.save()
              req.flash("success", 'The event "' + req.body.event.name + '" has been created successfully')
              res.redirect("/events");
          }
        })
      }
})

// Show particular event
router.get("/:id", middleware.isLoggedIn, (req, res) => {
  Event.findById(req.params.id).populate("groups").exec((err, foundEvent) => {
    if(err) {
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/events")
    } else {
      let groups = foundEvent.populate("groups").groups
      let allUsers 
      let allPending

      Promise.all(groups.map(group => helper.getAllUsers(group)))
      .then((data) => {
        allUsers = data.flat()
      }).then(() => {
        const data = Promise.all(groups.map(group => helper.getAllPending(group)))
      return data})
      .then((data) => {
        allPending = data.flat()}).then(() => {
        allUsers = allUsers.map((userID) => userID.toString())
        allPending = allPending.map((userID) => userID.toString())
      }).then(() => {
        res.render("./events/show",
        {
          event: foundEvent,
          allUsers: allUsers,
          allPending: allPending,
          currentUser: req.user
        })
      }).catch((err) => console.log(err))
  }})
})

// Form for editing event
router.get("/:id/edit", middleware.isEventCreator, (req, res) => {
  Event.findById(req.params.id, (err, foundEvent) => {
    if(err) {
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/events")
    } else {
      res.render("./events/edit", {event: foundEvent, cat: foundEvent.cat});
    }
  })
})

// Updating event logic
router.put("/:id/", middleware.isEventCreator, (req, res) => {
  req.body.event.name = req.sanitize(req.body.event.name)
  req.body.event.url = req.sanitize(req.body.event.url)
  req.body.event.desc = req.sanitize(req.body.event.desc)
  req.body.event.cat = req.body.cat
  req.body.event.requirements = req.sanitize(req.body.event.requirements)
  req.body.event.prizes = req.sanitize(req.body.event.prizes)
  Event.findByIdAndUpdate(req.params.id, req.body.event, { runValidators: true, context: 'query' }, (err, updatedEvent) => {
    if(err) {
      if (err.name === 'ValidationError') {
        req.flash("error", "That event already exists! Update failed.")
        res.redirect("/events")
      } else {
        req.flash("error", "Something went wrong...Try again")
        res.redirect("/events")
      }
    } else {
      req.flash("success", "The event has been updated successfully")
      res.redirect("/events/" + req.params.id)
    }
  })
})

// Showing event's current groups
router.get("/:id/groups", middleware.isLoggedIn, (req, res) => {
  Event.findById(req.params.id).populate("groups").exec((err, foundEvent) => {
    if(err) {
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/events")
    } else {
      let groups = foundEvent.populate("groups").groups
      let allUsers 
      let allPending

      Promise.all(groups.map(group => helper.getAllUsers(group)))
      .then((data) => {
        allUsers = data.flat()
      }).then(() => {
        const data = Promise.all(groups.map(group => helper.getAllPending(group)))
      return data})
      .then((data) => {
        allPending = data.flat()}).then(() => {
        allUsers = allUsers.map((userID) => userID.toString())
        allPending = allPending.map((userID) => userID.toString())
      }).then(() => {
        res.render("./events/groups",
        {
          event: foundEvent,
          allUsers: allUsers,
          allPending: allPending
        })
      }).catch((err) => console.log(err))
  }})
})

// Save user to bookmarks 
router.put("/:id/addbookmark", (req, res) => {
  Event.findById(req.params.id, (err, foundEvent) => {
    if (err) {
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/events")
    } else {
      foundEvent.bookmarks.push(req.user._id)
      foundEvent.save()
      req.flash("success", "Event saved to your bookmarks")
      res.redirect("/events/" + foundEvent._id)
    }
  })
})

// Remove user from bookmarks
router.put("/:id/removebookmark", (req, res) => {
  Event.findById(req.params.id, (err, foundEvent) => {
    if (err) {   
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/events")
    } else {
      foundEvent.bookmarks.splice(foundEvent.bookmarks.indexOf(req.user._id), 1)
      foundEvent.save()
      req.flash("success", "Event removed from your bookmarks")
      res.redirect("/events/" + foundEvent._id)
    }
  })
})



module.exports = router