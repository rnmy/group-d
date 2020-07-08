const express = require('express')
const router = express.Router({mergeParams: true})
const User = require("../models/user")

const helper = require('../helper')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

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


// Show user page
router.get("/", (req, res) => {
    User.findById(req.params.userId, (err, user) => {
      if(err){
        req.flash("error", "Something went wrong...Try again")
        res.redirect("back")
      } else {
        res.render("./users/show", {user: user});
      }
    });
  });
  

 // View pending requests 
 router.get("/pending", (req, res) => {
    helper.getGroupIDs(req.params.userId).then((arr) => {
      const newArr = Promise.all(arr.map((groupID) => helper.getEvent(groupID)))
      return newArr
    }).then((arr) => {
      let data = []
      for (let i = 0 ; i < arr.length; i++) {
        let groupEventPair = {}
        groupEventPair.group = arr[i].group
        groupEventPair.event = arr[i].event
        data.push(groupEventPair)
      }
      return data
    }).then((result) => {
      const newresult = Promise.all(result.map((res) => helper.getGroupAndEvent(res)))
    return newresult}).then((result) => {
    res.render("./users/status", {data: result})}).catch((err) => console.log(err)) 

// Show form to edit own profile
router.get("/edit", middleware.isLoggedIn, (req, res) => {
  User.findById(req.params.userId, (err, user) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("back")
    } else {
      res.render("./users/edit", {user: user, error: ''});
    }
  });
});

// Updating own profile logic
router.put("/", middleware.isLoggedIn, (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      const user = User.findById(req.params.userId)
      user.exec((err, foundUser) => {
        if (err) {
          req.flash("error", "Something went wrong...Try again")
          res.redirect("back")
        } else {
          res.render("./users/edit", 
          {
            user: foundUser,
            error: "Please upload only images for your profile picture (e.g. .jpeg/.png files)"
          })
        }
      })
    } else {
      User.findById(req.params.userId, (err, user) => {
        if (err) { 
          req.flash("error", "Something went wrong...Try again")
          res.redirect("back")
        } else {
          fs.unlink(`./public/uploads/${user.profilePic}`, (err, next) => {
            if (err) {
              req.flash("error", "Something went wrong...Try again")
              res.redirect("back")
            } else {
              let updatedUser
              if (req.file == undefined) { 
                updatedUser = User.findByIdAndUpdate(req.params.userId, 
                  {
                    bio: req.body.bio,
                    organization: req.body.organization,
                    email: req.body.email
                  })
              } else {
                updatedUser = User.findByIdAndUpdate(req.params.userId, 
                  {
                    bio: req.body.bio,
                    organization: req.body.organization,
                    profilePic: req.file.filename,
                    email: req.body.email
                  }
                )
              }
              updatedUser.exec((err, user) => {
                if(err) {
                  req.flash("error", "Something went wrong...Try again")
                  res.redirect("/users/:userId")
                } else {
                  req.flash("success", "Successfully updated profile")
                  res.redirect("/users/" + req.params.userId)
                }       
              })
            }
          })
        }
      })
    }
  })

  

module.exports = router