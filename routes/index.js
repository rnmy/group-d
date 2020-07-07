const express = require('express')
const router = express.Router()
const passport = require("passport")
const User = require("../models/user")
const multer = require('multer')
const path = require('path')
const helper = require('../helper')

const storage = multer.diskStorage({
  destination: './public/uploads',
  filename: function(req, file, cb) {
      // extname extracts .jpeg, .png etc
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
      fileSize: 1000000
  },
  fileFilter: function(req, file, cb) {
      helper.checkFileType(file, cb)
  }
}).single('file')


// Landing page
router.get("/", (req, res) => {
    res.render("landing");
  });

// show register form
router.get("/register", function(req, res){
    res.render("./auth/register", {
      data: {},
      error: ''
    });
  });
  
//handle sign up logic
router.post("/register",function(req, res){
  upload(req, res, (err) => {
    if (err) {
      res.render("./auth/register", {
        data: req.body,
        error: "Please upload only images for your profile picture (e.g. .jpeg/.png files)"
      })
    } else {
        let newUser
        if (req.file == undefined) {
          newUser = new User(
            {
              name: req.body.name,
              email:req.body.email,
              username: req.body.username,
              organization: req.body.organization,
              profilePic: ''
            });
        } else {
          newUser = new User(
            {
              name: req.body.name,
              email:req.body.email,
              username: req.body.username,
              organization: req.body.organization,
              profilePic: req.file.filename
            });
        }
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
      }
    }
  )
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