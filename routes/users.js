const express = require('express')
const router = express.Router({mergeParams: true})
const User = require("../models/user")
const middleware = require('../middleware')

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
router.get("/", middleware.isLoggedIn, (req, res) => {
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
 router.get("/pending", middleware.isLoggedIn, (req, res) => {
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
 })

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
            let updatedUser
            if (req.file == undefined) {
              updatedUser = User.findByIdAndUpdate(req.params.userId,
                {
                  bio: req.sanitize(req.body.bio),
                  organization: req.sanitize(req.body.organization),
                  email: req.sanitize(req.body.email)
                })
            } else {
              if (!(user.profilePic === '')) {
                fs.unlinkSync(`./public/uploads/${user.profilePic}`)
              }
              updatedUser = User.findByIdAndUpdate(req.params.userId,
                {
                  bio: req.sanitize(req.body.bio),
                  organization: req.sanitize(req.body.organization),
                  profilePic: req.file.filename,
                  email: req.sanitize(req.body.email)
                }
              )
            }
          updatedUser.exec((err, user) => {
            if(err) {
              console.log(err)
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
})
        


// Show form to change password
router.get("/change_password", middleware.isLoggedIn, (req, res) => {
  User.findById(req.params.userId, (err, foundUser) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId")
    } else {
      res.render("./users/change_password", {user: foundUser})
    }
  })
})

// Change password logic
router.put("/change_password", middleware.isLoggedIn, (req, res) => {
  User.findById(req.params.userId)
      .then(foundUser => {
          foundUser.changePassword(req.body.current, req.body.new)
              .then(() => {
                req.flash("success", "Password was changed successfully")
                res.redirect("/users/" + req.params.userId)
              })
              .catch((error) => {
                req.flash("error", "Incorrect current password")
                res.redirect("/users/" + req.params.userId + "/change_password")
              })
      })
      .catch((error) => {
        req.flash("error", "Something went wrong...Try again")
        res.redirect("/users/" + req.params.userId)
      });
})

module.exports = router
