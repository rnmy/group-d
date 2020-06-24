const express = require('express')
const router = express.Router()
const Group = require("../models/group")
const Event = require("../models/event")

const middleware = require('../middleware'),
      helper = require('../helper')

// Show form to add new group
router.get("/new", middleware.isLoggedIn, (req, res) => {
    const eventId = req.params.id;
    Event.findById(eventId, (err, event) => {
        if (err) {
            console.log(err);
        } else {
            res.render("./groups/new", { event: event });
        }
    })
})

// Add new group to DB
router.post("/", middleware.isLoggedIn, (req, res) => {
    const eventId = req.params.id;
    Event.findById(eventId, (err, event) => {
        if (err) {
            console.log(err);
        } else {
            Group.create(
                {
                    name: req.body.groupName,
                    size: 1,
                    description: req.body.descr,
                    pending: [],
                    users: [res.locals.currentUser]
                },
                (err, group) => {
                    group.groupLeader.id = req.user._id;
                    group.groupLeader.name = req.user.name;
                    group.save();
                    event.groups.push(group);
                    event.save();
                    res.redirect("/events/" + eventId);
                }
            )
        }
    })
})

router.get("/:groupid", middleware.isLoggedIn, (req, res) => {
    Event.findById(req.params.id, (err, foundEvent) => {
        if (err) {
            res.redirect("/events")
        } else {
            Group.findById(req.params.groupid).populate("users").exec(
                (err, foundGroup) => {
                    if (err) {
                        res.redirect("/events/" + req.params.id)
                    } else {
                        const userIDs = foundGroup.users.map((user) => user._id)
                        let groups = foundEvent.populate("groups").groups
                        let allUsers = []
                        let allPending = []

                        Promise.all(groups.map(group => helper.getAllUsers(group))).then((data) => {
                            allUsers = data.flat()
                        }).then(() => {
                            const data = Promise.all(groups.map(group => helper.getAllPending(group)))
                            return data
                        })
                            .then((data) => {
                                allPending = data.flat()
                            }).then(() => {
                                allUsers = allUsers.map((userID) => userID.toString())
                                allPending = allPending.map((userID) => userID.toString())
                            }).then(() => {
                                res.render("./groups/show",
                                    {
                                        group: foundGroup,
                                        event: foundEvent,
                                        users: userIDs,
                                        allUsers: allUsers,
                                        allPending: allPending
                                    })
                            }).catch((err) => console.log(err))
                    }
                })
        }
    })
})

// Join group updating logic
router.put("/:groupid", middleware.isLoggedIn, (req, res) => {
    Group.findByIdAndUpdate(req.params.groupid,
      {
        $push: {pending: res.locals.currentUser},
      }, (err, group) => {
      if(err) {
        res.redirect("/events")
      } else {
        res.redirect("/events/" + req.params.id + "/groups/" + req.params.groupid)
      }
    })
  })
  
  // Show pending requests for group
  router.get("/:groupid/pending", (req, res) => {
    Event.findById(req.params.id, (err, foundEvent) => {
      if(err){
        console.log(err);
      } else {
        Group.findById(req.params.groupid).populate("pending").exec((err, foundGroup) => {
          if(err){
            console.log(err);
          } else {
            res.render("./groups/pending", {group: foundGroup, event: foundEvent});
          }
        })
      }
    })
  })
  
  // Accept/Reject pending request logic
  router.post("/:groupid/pending/:pendingid", (req, res) => {
    Group.findById(req.params.groupid, (err, foundGroup) => {
      if(err){
        console.log(err);
      } else {
        User.findById(req.params.pendingid, (err, pendingUser) => {
          if(err){
            console.log(err);
          } else {
            foundGroup.pending.splice(foundGroup.pending.indexOf(pendingUser), 1);
            const action = req.body.action;
            if(action === "Accept"){
              foundGroup.users.push(pendingUser);
            } else if(action === "Reject"){
              foundGroup.rejected.push(pendingUser);
            }
            foundGroup.save();
            res.redirect("/events/" + req.params.id + "/groups/" + req.params.groupid + "/pending");
          }
        })
      }
    })
  })



module.exports = router