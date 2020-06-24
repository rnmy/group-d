let Event = require("../models/event");
let Group = require("../models/group");
let User = require("../models/user");

// all the middleware goes here
let middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

module.exports = middlewareObj;