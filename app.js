require('dotenv').config()
const express = require("express"),
      app = express(),
      mongoose = require("mongoose"),
      bodyParser = require("body-parser"),
      passport = require("passport"),
      LocalStrategy = require("passport-local"),
      methodOverride = require('method-override'),
      seedDB = require("./seeds"),
      flash = require("connect-flash"),
      expressSanitizer = require('express-sanitizer')

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

const env = process.env.NODE_ENV || 'development'
if (env === 'test') {
  process.env.MONGODB_URI = "mongodb://localhost/groupd-test"
} else if (env === 'production') {
  process.env.MONGODB_URI = "mongodb+srv://JavaChip:h2Uu4HtFdAEnKFXo@cluster0-6z3um.mongodb.net/<dbname>?retryWrites=true&w=majority"
} else {
  process.env.MONGODB_URI = "mongodb://localhost/group-d"
} 

mongoose.connect(process.env.MONGODB_URI, 
  { 
    useNewUrlParser: true, 
    useUnifiedTopology: true ,
    useFindAndModify: false
  }
)

// FOR DEPLOYING
// mongoose.connect("mongodb+srv://JavaChip:h2Uu4HtFdAEnKFXo@cluster0-6z3um.mongodb.net/<dbname>?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
mongoose.set('useCreateIndex', true);

app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer())
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

if (env === 'development') {
  app.listen(3000, () => {
    console.log("SERVER START");
  })
} else if (env === 'test') {
  app.listen(8080, () => {
    console.log("SERVER START");
  })
} else {
  // FOR DEPLOYING & TESTING
  app.listen(process.env.PORT, process.env.IP, () => {
    console.log("SERVER START");
  })
}

module.exports = app