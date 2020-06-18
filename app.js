const express = require("express");
const app = express();
//Commenting to test

const seedDB = require("./seeds");
//seedDB();

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/group-d", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
const Event = require("./models/event");
const User = require("./models/user");
const Group = require("./models/group");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const methodOverride = require('method-override');
app.use(methodOverride("_method"));

app.set("view engine", "ejs");

//==================================
//        EVENTS ROUTES
//==================================

app.get("/", (req, res) => {
    res.redirect("/events");
});

app.get("/events", (req, res) => {
    Event.find({}, (err, allEvents) => {
        if(err){
            console.log(err);
        } else {
            res.render("./events/index", {events: allEvents});
        }
    });
});

app.get("/events/new", (req, res) => {
    res.render("./events/new");
});


app.post("/events", (req, res) => {
    const newEvent = req.body.event;
    Event.create(newEvent, (err, event) => {
        if(err){
            console.log(err);
        } else {
            res.redirect("/events");
        }
    })
})

//Show route
app.get("/events/:id", (req, res) => {
  Event.findById(req.params.id).populate("groups").exec((err, foundEvent) => {
    if(err) {
      res.redirect("/events")
    } else {
      res.render("./events/show", {event: foundEvent});
    }
  })
})

// Form for editing event
app.get("/events/:id/edit", (req, res) => {
  Event.findById(req.params.id, (err, foundEvent) => {
    if(err) {
      res.redirect("/events")
    } else {
      res.render("./events/edit", {event: foundEvent});
    }
  })
})

// Updating logic
app.put("/events/:id/", (req, res) => {
  Event.findByIdAndUpdate(req.params.id, req.body.event, (err, updatedEvent) => {
    if(err) {
      res.redirect("/events")
    } else {
      res.redirect("/events/" + req.params.id)
    }
  })
})

//==================================
//        GROUPS ROUTES
//==================================

// Show page for group
app.get("/events/:id/groups/:groupid", (req, res) => {
// Have a button that lets you join group
// Find event by req.params.id
// Find group by req.params.groupid
  Event.findById(req.params.id, (err, foundEvent) => {
    if (err) {
      res.redirect("/events")
    } else {
      Group.findById(req.params.groupid).populate("users").exec(
        (err, foundGroup) => {
          if (err) {
            res.redirect("/events/" + req.params.id)
          } else {
            res.render("./groups/show", {group: foundGroup, event: foundEvent})
          }
        })
      }
    })
  })

// Add group to an event
app.get("/events/:id/groups/new", (req, res) => {
  res.render("./groups/new")
})

app.post("/events/:id/groups", (req, res) => {
  res.redirect("/events/" + req.params.id)
})

// Join a group logic
app.put("/events/:id/groups/:groupid", (req, res) => {
  console.log(req.body.newUser)
  const user = new User(
    {
      name: req.body.newUser
    })
    user.save()
    console.log(user)
  Group.findByIdAndUpdate(req.params.groupid,
    {
      $push: {users: user},
      $inc: {size: 1}
    }, (err, group) => {
    if(err) {
      res.redirect("/events")
    } else {
      res.redirect("/events/" + req.params.id + "/groups/" + req.params.groupid)
    }
  })
})


app.listen(3000, () => {
    console.log("SERVER START");
})
