const express = require('express')
const router = express.Router({mergeParams: true})
const User = require("../models/user")

const helper = require('../helper')


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
  
  // Show form to edit own profile
  router.get("/edit", (req, res) => {
    User.findById(req.params.userId, (err, user) => {
      if(err){
        req.flash("error", "Something went wrong...Try again")
        res.redirect("back")
      } else {
        res.render("./users/edit", {user: user});
      }
    });
  });
  
  // Updating own profile logic
 router.put("/", (req, res) => {
    User.findByIdAndUpdate(req.params.userId, req.body.user, (err, updatedUser) => {
      if(err) {
        req.flash("error", "Something went wrong...Try again")
        res.redirect("/users/:userId")
      } else {
        req.flash("success", "Successfully updated profile")
        res.redirect("/users/" + req.params.userId)
      }
    })
  })
  
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
  })

  

module.exports = router