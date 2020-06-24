const express = require("express"),
      app = express(),
      mongoose = require("mongoose"),
      bodyParser = require("body-parser"),
      passport = require("passport"),
      LocalStrategy = require("passport-local"),
      methodOverride = require('method-override'),
      seedDB = require("./seeds"),
      Event = require("./models/event"),
      User = require("./models/user"),
      Group = require("./models/group")


//seedDB();

// Requiring routes
const indexRoutes = require("./routes/index"),
      eventRoutes = require("./routes/events"),
      groupRoutes = require("./routes/groups"),
      userRoutes = require("./routes/users")

mongoose.connect("mongodb://localhost/group-d", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));

// PASSPORT CONFIGURATION
app.use(require("express-session")({
  secret: "Once again Rusty wins cutest dog!",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function(req, res, next){
 res.locals.currentUser = req.user;
 next();
});

app.set("view engine", "ejs");

// ROUTES 
app.use("/", indexRoutes)
app.use("/events", eventRoutes)
app.use("/events/:id/groups", groupRoutes)
app.use("/users/:userId", userRoutes)

function getAllUsers(groupID) {
  return new Promise((resolve, reject) => {
    Group.findById(groupID).populate("users").exec((err, group) => {
      if (err) {
        return reject(err)
      } else {
        resolve(group.users.map((user) => user._id))
      }
    })
  })
}

function getAllPending(groupID) {
  return new Promise((resolve, reject) => {
    Group.findById(groupID).populate("pending").exec((err, group) => {
      if (err) {
        return reject(err)
      } else {
        resolve(group.pending.map((user) => user._id))
      }
    })
  })
}




// Returns array of group IDs that user is part of
function getGroupIDs(userID) {
  // Go through all groups' pending 
  // If userID exists inside, store the group ID 
  return new Promise((resolve, reject) => {
    let id = []
    Group.find({}, {pending: 1, rejected: 1, users: 1}, (err, result) => {
      if(err) {
        reject(err)
      } else {
        for (const res of result) { 
          if(res.pending.includes(userID) 
          || res.rejected.includes(userID)
          || res.users.includes(userID)) {
            id.push(res._id) 
          }
        }
        resolve(id)
      }
    })
})} 

function getEventIDs(idArray) {
  return new Promise((resolve, reject) => {
    let id = []
    Event.find({}, {groups: 1}, (err, result) => {
      if (err) {
        reject(err)
      } else {
        for (const res of result) {
          for (const groupID of idArray)
          if(res.groups.includes(groupID)) {
            id.push(res._id)
          }
        }
        resolve(id)
      }
    })
  })
}
function getEvent(groupID) { 
  return new Promise((resolve, reject) => {
    Event.find({}, {groups: 1}, (err, result) => {
      if (err) {
        reject(err)
      } else {
        for (const res of result) {
          const eventid = res._id
          if(res.groups.includes(groupID)) {
            const newObj = createObject(groupID, eventid) 
            resolve(newObj)
          }
        }
      }
    })
  })
}

function createObject(groupID, eventID) {
  let obj = {}
  obj.group = groupID
  obj.event = eventID 
  return obj
}

function getGroupAndEvent(obj) { 
  return new Promise((resolve, reject) => {
    Group.findById(obj.group, (err, foundGroup) => {
      if(err) {
        reject(err)
      } else {
        Event.findById(obj.event, (err, foundEvent) => {
          if(err) {
            reject(err)
          } else {
            const newObj = changeObject(obj, foundGroup, foundEvent)
            resolve(newObj)
          }
        })
      }
    })
  })
}

function changeObject(obj, group, event) {
  obj.group = group 
  obj.event = event 
  return obj
}

//Middleware
function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
      return next();
  }
  res.redirect("/login");
}

app.listen(3000, () => {
    console.log("SERVER START");
})
