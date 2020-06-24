let Event = require("../models/event");
let Group = require("../models/group");
let User = require("../models/user");

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
        Group.find({}, {pending: 1, rejected: 1, users: 1}, (err, result) => {
            if(err) {
                reject(err)
            } else {
                for (const res of result) { 
                    if(res.pending.includes(userID) 
                       || res.rejected.includes(userID)
                       || res.users.includes(userID)) {
                            id.push(res._id) 
                    }
                }
                resolve(id)
            }
        })
    })
} 
  
helperObj.getEventIDs = function(idArray) {
    return new Promise((resolve, reject) => {
        let id = []
        Event.find({}, {groups: 1}, (err, result) => {
            if (err) {
                reject(err)
            } else {
                for (const res of result) {
                    for (const groupID of idArray)
                        if(res.groups.includes(groupID)) {
                        id.push(res._id)
                        }
                }
                resolve(id)
            }
        })
    })
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
                        const newObj = createObject(groupID, eventid) 
                        resolve(newObj)
                    }
                }
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
                        const newObj = changeObject(obj, foundGroup, foundEvent)
                        resolve(newObj)
                    }
                })
            }
        })
    })
}
  
helperObj.changeObject = function(obj, group, event) {
    obj.group = group 
    obj.event = event 
    return obj
}

module.exports = helperObj;