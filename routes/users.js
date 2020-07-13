const express = require('express')
const router = express.Router({mergeParams: true})
const User = require("../models/user")
const Event = require("../models/event")
const middleware = require('../middleware')
const Notification = require("../models/notification")

const helper = require('../helper')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { getAllUsers } = require('../helper')

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
 router.get("/pending", middleware.isAuthorisedUser, (req, res) => {
   User.findById(req.params.userId, (err, foundUser) => {
      if(err) {
        req.flash("error", "Something went wrong...Try again")
        res.redirect("back")
      } else {
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
        res.render("./users/status", {user: foundUser, data: result})}).catch((err) => console.log(err))
      }
   })
 })

// Show form to edit own profile
router.get("/edit", middleware.isAuthorisedUser, (req, res) => {
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
router.put("/", middleware.isAuthorisedUser, (req, res) => {
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
router.get("/change_password", middleware.isAuthorisedUser, (req, res) => {
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
router.put("/change_password", middleware.isAuthorisedUser, (req, res) => {
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

// Add experience
router.get("/add_exp", middleware.isAuthorisedUser, (req, res) => {
  User.findById(req.params.userId, (err, foundUser) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId")
    } else {
      res.render("./users/add_exp", {user: foundUser})
    }
  })
})

// Add experience logic
router.put("/add_exp", middleware.isAuthorisedUser, (req, res) => {
  User.findById(req.params.userId, (err, foundUser) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId")
    } else {
      const allExpNames = foundUser.exp.map(experience => experience.name.toLowerCase())
      if(allExpNames.includes(req.body.exp.name.toLowerCase()) === -1) {
        foundUser.exp.push(req.body.exp)
        foundUser.save()       
        req.flash("success", "Successfully added experience")
        res.redirect("/users/" + req.params.userId)
      } else {              
        req.flash("error", "This experience already exists")
        res.redirect("/users/" + req.params.userId + "/add_exp")
      }
    }
  })
})

// Remove experience
router.get("/remove_exp", middleware.isAuthorisedUser, (req, res) => {
  User.findById(req.params.userId, (err, foundUser) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId")
    } else {
      res.render("./users/remove_exp", {user: foundUser})
    }
  })
})

// Remove experience logic
router.put("/remove_exp/:expName", middleware.isAuthorisedUser, (req, res) => {
  User.findById(req.params.userId, (err, foundUser) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId")
    } else {
      foundUser.exp.splice(foundUser.exp.indexOf({name: req.params.expName}), 1)
      foundUser.save()
      req.flash("success", "Successfully removed experience")
      res.redirect("/users/" + req.params.userId)
    }
  })
})

// Add skill
router.get("/add_skill", middleware.isAuthorisedUser, (req, res) => {
  User.findById(req.params.userId, (err, foundUser) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId")
    } else {
      res.render("./users/add_skill", {user: foundUser})
    }
  })
})

// Add skill logic
router.put("/add_skill", middleware.isAuthorisedUser, (req, res) => {
  User.findById(req.params.userId, (err, foundUser) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId")
    } else {
      const allSkills = foundUser.skills.map(skill => skill.toLowerCase())
      if (allSkills.includes(req.body.skill.toLowerCase())) {
        req.flash("error", "You already have that skill!")
        res.redirect("/users/" + req.params.userId)
      } else {
        foundUser.skills.push(req.body.skill)
        foundUser.save()       
        req.flash("success", "Successfully added skill")
        res.redirect("/users/" + req.params.userId)
      }  
    }
  })
})

// Remove skill
router.get("/remove_skill", middleware.isAuthorisedUser, (req, res) => {
  User.findById(req.params.userId, (err, foundUser) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId")
    } else {
      res.render("./users/remove_skill", {user: foundUser})
    }
  })
})

// Remove skill logic
router.put("/remove_skill/:skillName", middleware.isAuthorisedUser, (req, res) => {
  User.findById(req.params.userId, (err, foundUser) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId")
    } else {
      foundUser.skills.splice(foundUser.skills.indexOf(req.params.skillName), 1)
      foundUser.save()
      req.flash("success", "Successfully removed skill")
      res.redirect("/users/" + req.params.userId)
    }
  })
})

// Add interest
router.get("/add_int", middleware.isAuthorisedUser, (req, res) => {
  User.findById(req.params.userId, (err, foundUser) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId")
    } else {
      res.render("./users/add_int", {user: foundUser})
    }
  })
})

// Add interest logic
router.put("/add_int", middleware.isAuthorisedUser, (req, res) => {
  User.findById(req.params.userId, (err, foundUser) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId")
    } else {
      const allInt = foundUser.int.map(int => int.toLowerCase())
      if (allInt.includes(req.body.int.toLowerCase())) {
        req.flash("error", "You already have that interest!")
        res.redirect("/users/" + req.params.userId)
      } else {
        foundUser.int.push(req.body.int)
        foundUser.save()       
        req.flash("success", "Successfully added interest")
        res.redirect("/users/" + req.params.userId)
      }  
    }
  })
})

// Remove interest
router.get("/remove_int", middleware.isAuthorisedUser, (req, res) => {
  User.findById(req.params.userId, (err, foundUser) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId")
    } else {
      res.render("./users/remove_int", {user: foundUser})
    }
  })
})

// Remove interest logic
router.put("/remove_int/:intName", middleware.isAuthorisedUser, (req, res) => {
  User.findById(req.params.userId, (err, foundUser) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId")
    } else {
      foundUser.int.splice(foundUser.int.indexOf(req.params.intName), 1)
      foundUser.save()
      req.flash("success", "Successfully removed interest")
      res.redirect("/users/" + req.params.userId)         
    }
  })
})

// Show bookmarked events
router.get("/bookmarks", middleware.isAuthorisedUser, (req, res) => {
  const foundEvents = Event.find({})
  foundEvents.exec((err, events) => {
    if (err) {
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId")
    } else {
      Promise.all(events.filter(event => helper.checkBookmarks(event, req.user._id))).then(data => 
        res.render("./users/bookmarks", {bookmarks: data, user: req.user})).catch(err => console.log(err))
    }
  })
})

// Show all notifications
router.get("/notifications", middleware.isAuthorisedUser, (req, res) => {
  User.findById(req.user._id).populate("notifs").exec((err, user) => {
    if (err) {
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId")
    } else {
      Promise.all(user.notifs.map(notif => helper.getNotif(notif._id))).then(data => data.sort()
      ).then(data => res.render("./users/notifications", {notifs: data.reverse()})).catch(err => console.log(err))
    }
  })
})

// Clear notification
router.delete("/notifications/:notifID", (req, res) => {
  Notification.findByIdAndRemove(req.params.notifID, (err, removedNotif) => {
    if (err) {
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/users/:userId/notifications")
    } else {
      User.findById(req.user._id, (err, user) => {
        if (err) {
          req.flash("error", "Something went wrong...Try again")
          res.redirect("back")
        } else {
          user.notifs.splice(user.notifs.indexOf(removedNotif._id), 1)
          user.save()
          req.flash("success", "Notification cleared")
          res.redirect("/users/" + req.params.userId + "/notifications")
        }
      })
    }
  })
})


module.exports = router
