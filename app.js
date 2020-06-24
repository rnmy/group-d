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

app.listen(3000, () => {
    console.log("SERVER START");
})
