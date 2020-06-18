//hi

const express = require("express");
const app = express();

const seedDB = require("./seeds");
seedDB();

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/group-d", {useNewUrlParser: true, useUnifiedTopology: true});
const Event = require("./models/event");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.redirect("/events");
});

app.get("/events", (req, res) => {
    res.render("./events/index");
});

app.get("/events/new", (req, res) => {
    res.render("./events/new");
});

app.post("/events/new", (req, res) => {
    
})

app.get("/events/:id", (req, res) => {
    res.render("./events/show");
})

app.get("/events/:id/edit", (req, res) => {
    res.render("./events/edit");
})

app.put("/events/:id/", (req, res) => {

})

app.listen(3000, () => {
    console.log("SERVER START");
})
