const express = require('express')
const router = express.Router()
const Event = require("../models/event")
const middleware = require("../middleware")
const helper = require("../helper")

// Show events page
router.get("/", middleware.isLoggedIn, (req, res) => {
    Event.find({}, (err, allEvents) => {
        if(err){
            req.flash("error", "Something went wrong...Try again")
            res.redirect("back")
        } else {
            res.render("./events/index", {events: allEvents});
        }
    });
});

// Show form to add new event
router.get("/new", middleware.isLoggedIn, (req, res) => {
    res.render("./events/new");
});

// Add new event to DB
router.post("/", middleware.isLoggedIn, (req, res) => {
    const newEvent = req.body.event;
    Event.create(newEvent, (err, event) => {
        if(err){
            req.flash("error", "This event has already been created")
            res.redirect("/events")
        } else {
            req.flash("success", 'The event "' + newEvent.name + '" has been created successfully')
            res.redirect("/events");
        }
    })
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
          allPending: allPending
        })
      }).catch((err) => console.log(err))
  }})
})

// Form for editing event
router.get("/:id/edit", middleware.isLoggedIn, (req, res) => {
  Event.findById(req.params.id, (err, foundEvent) => {
    if(err) {
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/events")
    } else {
      res.render("./events/edit", {event: foundEvent});
    }
  })
})

// Updating event logic
router.put("/:id/", middleware.isLoggedIn, (req, res) => {
  Event.findByIdAndUpdate(req.params.id, req.body.event, { runValidators: true, context: 'query' }, (err, updatedEvent) => {
    if(err) {
      req.flash("error", "This event has already been created")
      res.redirect("/events")
    } else {
      req.flash("success", "The event has been updated successfully")
      res.redirect("/events/" + req.params.id)
    }
  })
})

module.exports = router