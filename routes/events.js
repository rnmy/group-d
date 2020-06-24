const express = require('express')
const router = express.Router()
const Event = require("../models/event")

//==================================
//        EVENTS ROUTES
//==================================
// Show events page
router.get("/", isLoggedIn, (req, res) => {
    Event.find({}, (err, allEvents) => {
        if(err){
            console.log(err);
        } else {
            res.render("./events/index", {events: allEvents});
        }
    });
});

// Show form to add new event
router.get("/new", isLoggedIn, (req, res) => {
    res.render("./events/new");
});

// Add new event to DB
router.post("/events", isLoggedIn, (req, res) => {
    const newEvent = req.body.event;
    Event.create(newEvent, (err, event) => {
        if(err){
            console.log(err);
        } else {
            res.redirect("/events");
        }
    })
})

// Show particular event
router.get("/:id", isLoggedIn, (req, res) => {
  Event.findById(req.params.id).populate("groups").exec((err, foundEvent) => {
    if(err) {
      res.redirect("/events")
    } else {
      let groups = foundEvent.populate("groups").groups
      let allUsers 
      let allPending

      Promise.all(groups.map(group => getAllUsers(group)))
      .then((data) => {
        allUsers = data.flat()
      }).then(() => {
        const data = Promise.all(groups.map(group => getAllPending(group)))
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
router.get("/:id/edit", isLoggedIn, (req, res) => {
  Event.findById(req.params.id, (err, foundEvent) => {
    if(err) {
      res.redirect("/events")
    } else {
      res.render("./events/edit", {event: foundEvent});
    }
  })
})

// Updating event logic
router.put("/:id/", isLoggedIn, (req, res) => {
  Event.findByIdAndUpdate(req.params.id, req.body.event, (err, updatedEvent) => {
    if(err) {
      res.redirect("/events")
    } else {
      res.redirect("/events/" + req.params.id)
    }
  })
})

module.exports = router