const express = require('express')
const router = express.Router({mergeParams: true})
const Group = require("../models/group")
const Event = require("../models/event")
const User = require("../models/user")
const Message = require("../models/message")
const Notification = require("../models/notification")

const middleware = require('../middleware'),
      helper = require('../helper')
const group = require('../models/group')

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
                    Notification.create(
                      {
                        text: `You created the group '${group.name}' under the event '${event.name}'.`,
                        event: event, 
                        group: group, 
                        date: new Date(), 
                      }, (err, notif) => {
                        if (err) {
                          req.flash("error", "Something went wrong...Try again")
                          res.redirect("back")
                        } else {
                          User.findById(req.user._id, (err, user) => {
                            if (err) {
                              req.flash("error", "Something went wrong...Try again")
                              res.redirect("back")
                            } else {
                              user.notifs.push(notif)
                              user.save()
                              req.flash("success", 'Successfully created the group "' + group.name + '" for ' + event.name)
                              res.redirect("/events/" + eventId + "/groups/");
                            }
                          })  
                        }
                      }
                    )
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
      Event.findById(req.params.id, (err, event) => {
        if(err) {
          req.flash("error", "Something went wrong...Try again")
          res.redirect("/events" + req.params.id)
        } else {
          Notification.create(
            {
              text: `You requested to join '${group.name}' under the event '${event.name}'.`,
              event: event,
              group: group,
              date: new Date()
            }, (err, notif) => {
              User.findById(req.user._id, (err, user) => {
                if (err) {
                  req.flash("error", "Something went wrong...Try again")
                  res.redirect("/events" + req.params.id)
                } else {
                  user.notifs.push(notif)
                  user.save()
                  req.flash("success", "Your join request is pending")
                  res.redirect("/events/" + req.params.id + "/groups/" + req.params.groupid)
                }
              })
            })
        }
      })
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
      Event.findById(req.params.id, (err, event) => {
        if (err) {
          req.flash("error", "Something went wrong...Try again")
          res.redirect("/events")
        } else {
          Notification.create(
            {
              text: `You cancelled your request to join '${group.name}' under the event '${event.name}'`,
              event: event,
              group: group,
              date: new Date()
            }, (err, notif) => {
              User.findById(req.user._id, (err, user) => {
                if (err) {
                  req.flash("error", "Something went wrong...Try again")
                  res.redirect("/events")
                } else {
                  user.notifs.push(notif)
                  user.save()
                  req.flash("success", "You have cancelled your pending request")
                  res.redirect("/events/" + req.params.id + "/groups/" + req.params.groupid)
                } 
              })
            }
          )
        }
      })
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
          User.findById(req.params.pendingid, (err, pendingUser) => {
            if(err){
              req.flash("error", "Something went wrong...Try again")
              res.redirect("back")
            } else {
              foundGroup.pending.splice(foundGroup.pending.indexOf(pendingUser._id), 1);
              const action = req.body.action;
              if(action === "Accept"){
                foundGroup.users.push(pendingUser);
                Notification.create(
                  {
                    text: `Your request to join '${foundGroup.name}' under the event '${foundEvent.name}' has been accepted.`,
                    event: foundEvent,
                    group: foundGroup,
                    date: new Date()
                  }, (err, notif) => {
                    if (err) {
                      req.flash("error", "Something went wrong...Try again")
                      res.redirect("back")
                    } else {
                      pendingUser.notifs.push(notif)
                      pendingUser.save()
                    }
                  }
                )
                if(foundGroup.users.length >= foundEvent.maxGroupSize){
                  foundGroup.pending.forEach((autoReject) => {
                    foundGroup.rejected.push(autoReject)
                    Notification.create(
                      {
                        text: `Your request to join '${foundGroup.name}' under the event '${foundEvent.name}' has been rejected.`,
                        event: foundEvent,
                        group: foundGroup,
                        date: new Date()
                      }, (err, notif) => {
                        if (err) {
                          req.flash("error", "Something went wrong...Try again")
                          res.redirect("back")
                        } else {
                          User.findById(autoReject._id, (err, rejectedUser) => {
                            if (err) {
                              req.flash("error", "Something went wrong...Try again")
                              res.redirect("back")
                            } else {
                              rejectedUser.notifs.push(notif)
                              rejectedUser.save()
                            }
                          })
                          
                        }
                      }
                    )
                  })
                  foundGroup.pending.length = 0
                }
              } else if(action === "Reject"){
                foundGroup.rejected.push(pendingUser);
                Notification.create(
                  {
                    text: `Your request to join '${foundGroup.name}' under the event '${foundEvent.name}' has been rejected.`,
                    event: foundEvent,
                    group: foundGroup,
                    date: new Date()
                  }, (err, notif) => {
                    if (err) {
                      req.flash("error", "Something went wrong...Try again")
                      res.redirect("back")
                    } else {
                      pendingUser.notifs.push(notif)
                      pendingUser.save()
                    }
                  }
                )
              }
              foundGroup.save();
              res.redirect("/events/" + req.params.id + "/groups/" + req.params.groupid + "/pending");
            }
          })
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
      Event.findById(req.params.id, (err, event) => {
        if (err) { 
          req.flash("error", "Something went wrong...Try again")
          res.redirect("/events")
        } else {
          Notification.create(
            {
              text: `You closed the group '${group.name}' under the event '${event.name}'.`,
              event: event,
              group: group,
              date: new Date()
            }, (err, notif) => {
              User.findById(req.user._id, (err, user) => {
                if (err) {
                  req.flash("error", "Something went wrong...Try again")
                  res.redirect("/events")
                } else {
                  user.notifs.push(notif)
                  user.save()
                  req.flash("success", "You have closed the group '" + group.name +"'!")
                  res.redirect("/events/" + req.params.id + "/groups/" + group.id)
                }
              })
            }
          )
        }
      })  
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
      Event.findById(req.params.id, (err, event) => {
        if (err) {
          req.flash("error", "Something went wrong...Try again")
          res.redirect("/events")
        } else {
          Notification.create(
            {
              text: `You reopened the group '${group.name}' under the event '${event.name}'.`,
              event: event,
              group: group,
              date: new Date()
            }, (err, notif) => {
              User.findById(req.user._id, (err, user) => {
                if (err) {
                  req.flash("error", "Something went wrong...Try again")
                  res.redirect("/events")
                } else {
                  user.notifs.push(notif)
                  user.save()
                  req.flash("success", "You have reopened the group '" + group.name +"'!")
                  res.redirect("/events/" + req.params.id + "/groups/" + group.id)
                }
              })
            }
          )
        }
      }) 
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
              Notification.create(
                {
                text: `You were removed from the group '${foundGroup.name}' under the event '${foundEvent.name}'.`,
                event: foundEvent,
                group: foundGroup,
                date: new Date()
              }, (err, notif) => {
                if (err) {
                  req.flash("error", "Something went wrong...Try again")
                  res.redirect("back")
                } else {
                  removedUser.notifs.push(notif)
                  removedUser.save()
                  req.flash("success", "You have removed " + removedUser.name + " from the group.")
                  res.redirect("/events/" + foundEvent._id + "/groups/" + foundGroup._id + "/edit")
                } 
              })
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
      Event.findById(req.params.id, (err, event) => {
        if (err) {
          req.flash("error", "Something went wrong...Try again")
          res.redirect("back")
        } else {
          Notification.create(
            {
              text: `You left the group '${foundGroup.name}' under the event '${event.name}'.`,
              event: event,
              group: foundGroup, 
              date: new Date()
            }, (err, notif) => {
              if (err) {
                req.flash("error", "Something went wrong...Try again")
                res.redirect("back")
              } else {
                User.findById(req.user._id, (err, user) => {
                  if (err) {
                    req.flash("error", "Something went wrong...Try again")
                    res.redirect("back")
                  } else {
                    user.notifs.push(notif)
                    user.save()
                    req.flash("success", "You have left the group '" + foundGroup.name + "'.")
                    res.redirect("/events/" + req.params.id)
                  }
                })
              }
            })
        }
      })  
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
      foundGroup.isClosed = false
      foundGroup.users.splice(foundGroup.users.indexOf(res.locals.currentUser._id), 1)
      foundGroup.left.push(res.locals.currentUser) 
      foundGroup.save()
      Event.findById(req.params.id, (err, event) => {
        if (err) {
          req.flash("error", "Something went wrong...Try again")
          res.redirect("back")
        } else {
          Notification.create(
            {
              text: `You deleted the group '${foundGroup.name}' from '${event.name}'.`,
              event: event,
              group: foundGroup,
              date: new Date()
            }, (err, notif) => {
              User.findById(req.user._id, (err, user) => {
                if (err) {
                  req.flash("error", "Something went wrong...Try again")
                  res.redirect("back")
                } else {
                  user.notifs.push(notif)
                  user.save()
                  req.flash("success", "You deleted the group '" + foundGroup.name + "'.")
                  res.redirect("/events/" + req.params.id)
                }
              })
            }
          )
        }
      }) 
    }
  })
})

// Show group forum
router.get("/:groupid/forum", middleware.isGroupMember, (req, res) => {
  User.findById(req.user._id, (err, foundUser) => {
    if(err){
      req.flash("error", "Something went wrong...Try again")
      res.redirect("back")
    } else {
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
              res.render("./groups/forum", {user: foundUser, group: foundGroup, event: foundEvent})
            }
          })
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
              const dateOptions = {month : "short", day : "numeric", year : "numeric"};
              const timeOptions = {hour: "numeric", minute: "numeric", timeZone: "Asia/Singapore"}

              message.date = new Date().toLocaleDateString("en-US", dateOptions)
              message.time = new Date().toLocaleTimeString("en-US", timeOptions)

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
        Group.findById(req.params.groupid, (err, group) => {
          if (err) {
            req.flash("error", "Something went wrong...Try again")
            res.redirect("back")
          } else {
            group.messages.splice(group.messages.indexOf(foundMessage._id), 1)
            group.save()
            req.flash("success", "Message deleted")
            res.redirect("/events/" + req.params.id + "/groups/" + req.params.groupid + "/forum")
          }
        })
      }
    })
  })

module.exports = router
