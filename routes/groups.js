const express = require('express')
const router = express.Router({mergeParams: true})
const Group = require("../models/group")
const Event = require("../models/event")
const User = require("../models/user")
const Message = require("../models/message")

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
          req.flash("error", "Something went wrong...Try again")
          res.redirect("back")
        } else {
            Group.create(
                {
                    name: req.sanitize(req.body.groupName),
                    isClosed: false,
                    isDeleted: false,
                    description: req.sanitize(req.body.descr),
                    pending: [],
                    users: [res.locals.currentUser]
                },
                (err, group) => {
                  if(err){
                    req.flash("error", "Something went wrong...Try again")
                    res.redirect("back")
                  } else {
                    group.groupLeader.id = req.user._id;
                    group.groupLeader.name = req.user.name;
                    group.save();
                    event.groups.push(group);
                    event.save();
                    req.flash("success", 'Successfully created the group "' + group.name + '" for ' + event.name)
                    res.redirect("/events/" + eventId + "/groups/");
                  }
                }
            )
        }
    })
})

// Show group page
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
                        }).then((data) => {
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
                }
            )
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
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/events")
    } else {
      res.redirect("/events/" + req.params.id + "/groups/" + req.params.groupid)
    }
  })
})

// Cancel join group request logic
router.put("/:groupid/cancel", middleware.isLoggedIn, (req, res) => {
  Group.findById(req.params.groupid, (err, group) => {
    if(err) {
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/events")
    } else {
      group.pending.splice(group.pending.indexOf(res.locals.currentUser._id), 1)
      group.save()
      res.redirect("/events/" + req.params.id + "/groups/" + req.params.groupid)
    }
  })
})

// Show pending requests for group
router.get("/:groupid/pending", middleware.isGroupLeader, (req, res) => {
  Event.findById(req.params.id, (err, foundEvent) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
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
router.put("/:groupid/pending/:pendingid", middleware.isGroupLeader, (req, res) => {
  Group.findById(req.params.groupid, (err, foundGroup) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("back")
    } else {
      User.findById(req.params.pendingid, (err, pendingUser) => {
        if(err){
          req.flash("error", "Something went wrong...Try again")
          res.redirect("back")
        } else {
          foundGroup.pending.splice(foundGroup.pending.indexOf(pendingUser._id), 1);
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

// Close group logic
router.put("/:groupid/close", middleware.isGroupLeader, (req, res) => {
  Group.findByIdAndUpdate(req.params.groupid,
    {
      $set: {isClosed: true},
    }, (err, group) => {
    if(err) {
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/events")
    } else {
      req.flash("success", "You have closed the group '" + group.name +"'!")
      res.redirect("/events/" + req.params.id + "/groups/" + group.id)
    }
  })
})

// Reopen group logic
router.put("/:groupid/reopen", middleware.isGroupLeader, (req, res) => {
  Group.findByIdAndUpdate(req.params.groupid,
    {
      $set: {isClosed: false},
    }, (err, group) => {
    if(err) {
      req.flash("error", "Something went wrong...Try again")
      res.redirect("/events")
    } else {
      req.flash("success", "You have reopened the group '" + group.name +"'!")
      res.redirect("/events/" + req.params.id + "/groups/" + group.id)
    }
  })
})

// Show edit group page
router.get("/:groupid/edit", middleware.isGroupLeader, (req, res) => {
  Event.findById(req.params.id, (err, foundEvent) => {
    if (err) {
      req.flash("error", "Something went wrong...Try again")
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
            }).then((data) => {
                allPending = data.flat()
            }).then(() => {
                allUsers = allUsers.map((userID) => userID.toString())
                allPending = allPending.map((userID) => userID.toString())
            }).then(() => {
                res.render("./groups/edit",
                    {
                        group: foundGroup,
                        event: foundEvent,
                        users: userIDs,
                        allUsers: allUsers,
                        allPending: allPending
                    })
            }).catch((err) => console.log(err))
          }
        }
      )
    }
  })
})

// Show edit group information form
router.get("/:groupid/edit_info", middleware.isGroupLeader, (req, res) => {
  Event.findById(req.params.id, (err, foundEvent) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("back")
    } else {
      Group.findById(req.params.groupid, (err, foundGroup) => {
        if(err){
          req.flash("error", "Something went wrong...Try again")
          res.redirect("back")
        } else {
          res.render("./groups/edit_info", {event: foundEvent, group: foundGroup})
        }
      })
    }
  })
})

// Edit group information logic
router.put("/:groupid/edit_info", middleware.isGroupLeader, (req, res) => {
  Event.findById(req.params.id, (err, foundEvent) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("back")
    } else {
      Group.findByIdAndUpdate(req.params.groupid, req.body.group, (err, group) => {
        if(err){
          req.flash("error", "Something went wrong...Try again")
          res.redirect("back")
        } else {
          req.flash("success", "Successfully updated group info")
          res.redirect("/events/" + foundEvent._id + "/groups/" + group._id)
        }
      })
    }
  })
})

// Remove group member logic
router.put("/:groupid/remove/:removeid", middleware.isGroupLeader, (req, res) => {
  Event.findById(req.params.id, (err, foundEvent) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("back")
    } else {
      Group.findById(req.params.groupid, (err, foundGroup) => {
        if(err){
          req.flash("error", "Something went wrong...Try again")
          res.redirect("back")
        } else {
          User.findById(req.params.removeid, (err, removedUser) => {
            if(err){
              req.flash("error", "Something went wrong...Try again")
              res.redirect("back")
            } else {
              foundGroup.users.splice(foundGroup.users.indexOf(removedUser._id), 1)
              foundGroup.removed.push(removedUser)
              foundGroup.save()
              req.flash("success", "You have removed " + removedUser.name + " from the group.")
              res.redirect("/events/" + foundEvent._id + "/groups/" + foundGroup._id + "/edit")
            }
          })
        }
      })
    }
  })
})

// Change group leader logic
router.put("/:groupid/change_leader/:newleaderid", middleware.isGroupLeader, (req, res) => {
  Event.findById(req.params.id, (err, foundEvent) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("back")
    } else {
      Group.findById(req.params.groupid, (err, foundGroup) => {
        if(err){
          req.flash("error", "Something went wrong...Try again")
          res.redirect("back")
        } else {
          User.findById(req.params.newleaderid, (err, newLeader) => {
            if(err){
              req.flash("error", "Something went wrong...Try again")
              res.redirect("back")
            } else {
              foundGroup.groupLeader = {
                id: newLeader._id,
                name: newLeader.name
              }
              foundGroup.save()
              req.flash("success", "You have changed the group leader to " + newLeader.name + ".")
              res.redirect("/events/" + foundEvent._id + "/groups/" + foundGroup._id)
            }
          })
        }
      })
    }
  })
})

// Leave group logic
router.put("/:groupid/leave", middleware.isGroupMember, (req, res) => {
  Group.findById(req.params.groupid, (err, foundGroup) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("back")
    } else {
      foundGroup.users.splice(foundGroup.users.indexOf(res.locals.currentUser._id), 1)
      foundGroup.left.push(res.locals.currentUser)
      foundGroup.save()
      req.flash("success", "You have left the group '" + foundGroup.name + "'.")
      res.redirect("/events/" + req.params.id)
    }
  })
})

// "Delete" group logic 
router.put("/:groupid/delete", middleware.isGroupLeader, (req, res) => {
  Group.findById(req.params.groupid, (err, foundGroup) => {
    if(err) {
      req.flash("error", "Something went wrong...Try again")
      res.redirect("back")
    } else {
      foundGroup.isDeleted = true 
      foundGroup.users.splice(foundGroup.users.indexOf(res.locals.currentUser._id), 1)
      foundGroup.left.push(res.locals.currentUser) 
      foundGroup.save()
      req.flash("success", "You deleted the group '" + foundGroup.name + "'.")
      res.redirect("/events/" + req.params.id)
    }
  })
})

// Show group forum
router.get("/:groupid/forum", middleware.isGroupMember, (req, res) => {
  Event.findById(req.params.id, (err, foundEvent) => {
    if (err) {
      req.flash("error", "Something went wrong...Try again")
      res.redirect("back")
    } else {
      Group.findById(req.params.groupid).populate("messages").exec((err, foundGroup) => {
        if (err) {
          req.flash("error", "Something went wrong...Try again")
          res.redirect("back")
        } else {
          res.render("./groups/forum", {group: foundGroup, event: foundEvent})
        }
      })
    }
  })
})

// Add a message to group forum
router.post("/:groupid/forum", middleware.isGroupMember, (req, res) => {
      Group.findById(req.params.groupid, (err, foundGroup) => {
        if(err) {
          req.flash("error", "Something went wrong...Try again")
          res.redirect("back")
        } else {
          req.body.message.text = req.sanitize(req.body.message.text)
          Message.create(req.body.message, (err, message) => {
            if (err) {
              console.log(err)
              req.flash("error", "Something went wrong...Try again")
              res.redirect("back")
            } else {
              message.author.id = req.user._id
              message.author.username = req.user.username
              const date = new Date()
              const dateOptions = {month : "short", day : "numeric", year : "numeric"};
              const timeOptions = {hour: "numeric", minute: "numeric"}
              message.date = date.toLocaleDateString("en-US", dateOptions)
              message.time = date.toLocaleTimeString("en-US", timeOptions)
              message.save()
              foundGroup.messages.push(message)
              foundGroup.save()
              
              res.redirect("/events/" + req.params.id + "/groups/" + req.params.groupid + "/forum")
            }
          })
        }
      })
  })

  // Delete your comment 
  router.delete("/:groupid/forum/:messageid", middleware.isMessageCreator, (req, res) => {
    Message.findByIdAndRemove(req.params.messageid, (err, foundMessage) => {
      if(err) {
        req.flash("error", "Something went wrong...Try again")
        res.redirect("back")
      } else {
        req.flash("success", "Message deleted")
        res.redirect("/events/" + req.params.id + "/groups/" + req.params.groupid + "/forum")
      }
    })
  })

module.exports = router
