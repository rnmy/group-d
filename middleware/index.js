let Event = require("../models/event");
let Group = require("../models/group");
let User = require("../models/user");
let Message = require("../models/message");

// all the middleware goes here
let middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that")
    res.redirect("/login");
}

middlewareObj.isEventCreator = function(req, res, next) { 
    if(req.isAuthenticated()) {
        Event.findById(req.params.id, (err, foundEvent) => {
            if (err) {
                req.flash("error", "Event not found!")
                res.redirect("/events")
            } else {
                if(foundEvent.author.id.equals(req.user._id)) { 
                    next()
                } else {
                    req.flash("error", "You don't have permission to do that!")
                    res.redirect("/events/" + req.params.id)
                }
            }
        })
    } else {
        req.flash("error", "You need to be logged in to do that")
        res.redirect("/login");
    }
}

middlewareObj.isGroupMember = function(req, res, next) {
    if(req.isAuthenticated()) {
        Group.findById(req.params.groupid, (err, foundGroup) => {
            if (err) {
                req.flash("error", "Group not found!")
                res.redirect("/events/" + req.params.id)
            } else {
                if (!(foundGroup.users.includes(req.user._id))) {
                    req.flash("error", "You don't have permission to do that!")
                    res.redirect("/events/" + req.params.id + "/groups/" + req.params.groupid)
                } else {
                    next()
                }
            }
        })
    } else {
        req.flash("error", "You need to be logged in to do that")
        res.redirect("/login");
    }
}

middlewareObj.isGroupLeader = function(req, res, next) {
    if(req.isAuthenticated()) {
        Group.findById(req.params.groupid, (err, foundGroup) => {
            if (err) {
                req.flash("error", "Group not found!")
                res.redirect("/events/" + req.params.id)
            } else {
                if (!(foundGroup.groupLeader.id.equals(req.user._id))) {
                    req.flash("error", "You don't have permission to do that!")
                    res.redirect("/events/" + req.params.id + "/groups/" + req.params.groupid)
                } else {
                    next()
                }
            }
        })
    } else {
        req.flash("error", "You need to be logged in to do that")
        res.redirect("/login");
    }
}

 middlewareObj.isMessageCreator = function(req, res, next) {
     if(req.isAuthenticated()) {
         Message.findById(req.params.messageid, (err, foundMessage) => {
             if (err) {
                req.flash("error", "Message not found!")
                res.redirect("/events/" + req.params.id + "/groups/")
             } else {
                 if (foundMessage.author.id.equals(req.user._id)) {
                     next()
                 } else {
                    req.flash("error", "You don't have permission to do that!")
                    res.redirect("/events/" + req.params.id + "/groups/" + req.params.groupid + "forum/")
                 }
             }
         })
     }
 }

 middlewareObj.isAuthorisedUser = function(req, res, next) {
     if (req.isAuthenticated()) {
         User.findById(req.params.userId, (err, foundUser) => {
             if (err) {
                req.flash("error", "User not found!")
                res.redirect("back")
             } else {
                 if (foundUser._id.equals(req.user._id)) {
                     next()
                 } else {
                    req.flash("error", "You don't have permission to do that!")
                    res.redirect("/users/" + req.params.userId)
                 }
             }
         })
     }
 }

module.exports = middlewareObj;