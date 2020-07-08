const express = require("express"),
      app = express(),
      mongoose = require("mongoose"),
      bodyParser = require("body-parser"),
      passport = require("passport"),
      LocalStrategy = require("passport-local"),
      methodOverride = require('method-override'),
      seedDB = require("./seeds"),
      flash = require("connect-flash")

// REQUIRING MODELS
const Event = require("./models/event"),
      User = require("./models/user"),
      Group = require("./models/group");

// seedDB();

// REQUIRING ROUTES
const indexRoutes = require("./routes/index"),
      eventRoutes = require("./routes/events"),
      groupRoutes = require("./routes/groups"),
      userRoutes = require("./routes/users")

mongoose.connect("mongodb://localhost/group-d", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false}); 
// FOR DEPLOYING
// mongoose.connect("mongodb+srv://JavaChip:h2Uu4HtFdAEnKFXo@cluster0-6z3um.mongodb.net/<dbname>?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
mongoose.set('useCreateIndex', true);

app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(flash())
app.use(express.static('./public'))

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
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
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

// FOR DEPLOYING
// app.listen(process.env.PORT, process.env.IP, () => {
//   console.log("SERVER START");
// })
