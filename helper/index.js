const Event = require("../models/event"),
      Group = require("../models/group"),
      User = require("../models/user"),
      Notification = require("../models/notification")

const path = require('path')

// all the helper functions go here
let helperObj = {};

helperObj.getAllUsers = function(groupID) {
    return new Promise((resolve, reject) => {
        Group.findById(groupID).populate("users").exec((err, group) => {
            if (err) {
                return reject(err)
            } else {
                resolve(group.users.map((user) => user._id))
            }
        })
    })
}
  
helperObj.getAllPending = function(groupID) {
    return new Promise((resolve, reject) => {
        Group.findById(groupID).populate("pending").exec((err, group) => {
            if (err) {
                return reject(err)
            } else {
                resolve(group.pending.map((user) => user._id))
            }
        })
    })
}

// Returns array of group IDs that user is part of
helperObj.getGroupIDs = function(userID) {
    // Go through all groups' pending 
    // If userID exists inside, store the group ID 
    return new Promise((resolve, reject) => {
        let id = []
        Group.find({}, {pending: 1, rejected: 1, users: 1, removed: 1, left: 1}, (err, result) => {
            if(err) {
                reject(err)
            } else {
                for (const res of result) { 
                    if(res.pending.includes(userID) 
                       || res.rejected.includes(userID)
                       || res.users.includes(userID)
                       || res.removed.includes(userID)
                       || res.left.includes(userID)) {
                            id.push(res._id) 
                    }
                }
                resolve(id)
            }
        })
    })
} 
  

helperObj.createObject = function(groupID, eventID) {
    let obj = {}
    obj.group = groupID
    obj.event = eventID 
    return obj
}

helperObj.getEvent = function(groupID) { 
    return new Promise((resolve, reject) => {
        Event.find({}, {groups: 1}, (err, result) => {
            if (err) {
                reject(err)
            } else {
                for (const res of result) {
                    const eventid = res._id
                    if(res.groups.includes(groupID)) {
                        const newObj = helperObj.createObject(groupID, eventid) 
                        resolve(newObj)
                    }
                }
            }
        })
    })
}
  
  
helperObj.changeObject = function(obj, group, event) {
    obj.group = group 
    obj.event = event 
    return obj
}
  
helperObj.getGroupAndEvent = function(obj) { 
    return new Promise((resolve, reject) => {
        Group.findById(obj.group, (err, foundGroup) => {
            if(err) {
                reject(err)
            } else {
                Event.findById(obj.event, (err, foundEvent) => {
                    if(err) {
                    reject(err)
                    } else {
                        const newObj = helperObj.changeObject(obj, foundGroup, foundEvent)
                        resolve(newObj)
                    }
                })
            }
        })
    })
}

helperObj.checkFileType = function(file, cb) {
    // Check extension AND mimetype (because files are easily renameable)
    // Allowed extensions 
    const fileTypes = /jpeg|jpg|png|gif/
    // Check extensions
    const extname = fileTypes.test(path.extname(file.originalname.toLowerCase()))
    // Check mimetype
    const mimetype = fileTypes.test(file.mimetype)
  
    if (extname && mimetype) {
        return cb(null, true)
    } else {
        return cb('Error: Images only')
    }
  }

helperObj.checkBookmarks = function(event, userID) {
    return event.bookmarks.includes(userID)
}

helperObj.getNotif = function(notifID) {
    return new Promise((resolve, reject) => {
        Notification.findById(notifID).populate("event").populate("group").exec((err, notif) => {
        if (err) {
          reject(err)
        } else {      
          resolve(notif)
        }
      })
    })
}

module.exports = helperObj;