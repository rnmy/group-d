const express = require("express");
const app = express();
//Commenting to test

const seedDB = require("./seeds");
// seedDB();

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/group-d", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
const Event = require("./models/event");
const User = require("./models/user");
const Group = require("./models/group");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const methodOverride = require('method-override');
app.use(methodOverride("_method"));

const passport = require("passport");
const LocalStrategy = require("passport-local");
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

// Landing page
app.get("/", (req, res) => {
  res.render("landing");
});

//==================================
//        EVENTS ROUTES
//==================================
// Show events page
app.get("/events", isLoggedIn, (req, res) => {
    Event.find({}, (err, allEvents) => {
        if(err){
            console.log(err);
        } else {
            res.render("./events/index", {events: allEvents});
        }
    });
});

// Show form to add new event
app.get("/events/new", isLoggedIn, (req, res) => {
    res.render("./events/new");
});

// Add new event to DB
app.post("/events", isLoggedIn, (req, res) => {
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
app.get("/events/:id", isLoggedIn, (req, res) => {
  Event.findById(req.params.id).populate("groups").exec((err, foundEvent) => {
    if(err) {
      res.redirect("/events")
    } else {
      res.render("./events/show", {event: foundEvent});
    }
  })
})

// Form for editing event
app.get("/events/:id/edit", isLoggedIn, (req, res) => {
  Event.findById(req.params.id, (err, foundEvent) => {
    if(err) {
      res.redirect("/events")
    } else {
      res.render("./events/edit", {event: foundEvent});
    }
  })
})

// Updating event logic
app.put("/events/:id/", isLoggedIn, (req, res) => {
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
// Show form to add new group
app.get("/events/:id/groups/new", isLoggedIn, (req, res) => {
  const eventId = req.params.id;
    Event.findById(eventId, (err, event) => {
        if(err){
            console.log(err);
        } else {
            res.render("./groups/new", {event: event});
        }
    })
})

// Add new group to DB
app.post("/events/:id/groups", isLoggedIn, (req, res) => {
  const eventId = req.params.id;
    Event.findById(eventId, (err, event) => {
        if(err){
            console.log(err);
        } else {
            Group.create(
              {
                name: req.body.groupName,
                size: 1,
                users: [res.locals.currentUser]
              },
              (err, group) => {
                event.groups.push(group); 
                event.save();
                res.redirect("/events/" + eventId);
              }
            )
        }
    })
})

// Show page for group
app.get("/events/:id/groups/:groupid", isLoggedIn, (req, res) => {
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

// Join group updating logic
app.put("/events/:id/groups/:groupid", isLoggedIn, (req, res) => {
  Group.findByIdAndUpdate(req.params.groupid,
    {
      $push: {users: res.locals.currentUser},
      $inc: {size: 1}
    }, (err, group) => {
    if(err) {
      res.redirect("/events")
    } else {
      res.redirect("/events/" + req.params.id + "/groups/" + req.params.groupid)
    }
  })
})

//==================================
//          USER ROUTES
//==================================
// Show user page
app.get("/users/:userId", (req, res) => {
  User.findById(req.params.userId, (err, user) => {
    if(err){
      console.log(err);
    } else {
      res.render("./users/show", {user: user});
    }
  });
});

// Show form to edit own profile
app.get("/users/:userId/edit", (req, res) => {
  User.findById(req.params.userId, (err, user) => {
    if(err){
      console.log(err);
    } else {
      res.render("./users/edit", {user: user});
    }
  });
});

// Updating own profile logic
app.put("/users/:userId", (req, res) => {
  User.findByIdAndUpdate(req.params.userId, req.body.user, (err, updatedUser) => {
    if(err) {
      res.redirect("/users/:userId")
    } else {
      res.redirect("/users/" + req.params.userId)
    }
  })
})

//==================================
//          AUTH ROUTES
//==================================

// show register form
app.get("/register", function(req, res){
  res.render("./auth/register");
});

//handle sign up logic
app.post("/register", function(req, res){
   const newUser = new User(
     {
       name: req.body.name,
       email:req.body.email,
       username: req.body.username,
       organization: req.body.organization,
       profilePic: req.body.profilePic
     });
   User.register(newUser, req.body.password, function(err, user){
       if(err){
           console.log(err);
           return res.render("./auth/register");
       }
       passport.authenticate("local")(req, res, function(){
          res.redirect("/events");
       });
   });
});

// show login form
app.get("/login", function(req, res){
  res.render("./auth/login");
});

// handling login logic
app.post("/login", passport.authenticate("local",
   {
       successRedirect: "/events",
       failureRedirect: "/login"
   }), function(req, res){
});

// logout
app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
      return next();
  }
  res.redirect("/login");
}

app.listen(3000, () => {
    console.log("SERVER START");
})
