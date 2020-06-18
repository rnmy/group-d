const express = require("express");
const app = express();
//Commenting to test

const seedDB = require("./seeds");
seedDB();

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/group-d", {useNewUrlParser: true, useUnifiedTopology: true});
const Event = require("./models/event");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const methodOverride = require('method-override');
app.use(methodOverride("_method"));

app.set("view engine", "ejs");

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
  Event.findById(req.params.id, (err, foundEvent) => {
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

app.listen(3000, () => {
    console.log("SERVER START");
})
