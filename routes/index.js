const express = require('express')
const router = express.Router()
const passport = require("passport")
const User = require("../models/user")

// Landing page
router.get("/", (req, res) => {
    res.render("landing");
  });

// show register form
router.get("/register", function(req, res){
    res.render("./auth/register");
  });
  
//handle sign up logic
router.post("/register", function(req, res){
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
      req.flash("error", err.message)
      console.log(err);
      return res.redirect("/register");
    }
    passport.authenticate("local")(req, res, function(){
      req.flash("success", "Successfully created account")
      res.redirect("/events");
    });
  });
});
  
// show login form
router.get("/login", function(req, res){
  res.render("./auth/login");
});
  
// handling login logic
router.post("/login", passport.authenticate("local",
  {
    successRedirect: "/events",
    failureRedirect: "/login"
  }), function(req, res){
});
  
// logout
router.get("/logout", function(req, res){
  req.logout();
  req.flash("success", "You have been logged out")
  res.redirect("/");
});

module.exports = router