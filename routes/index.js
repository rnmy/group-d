const express = require('express')
const router = express.Router()
const passport = require("passport")
const User = require("../models/user")
const multer = require('multer')
const path = require('path')
const helper = require('../helper')
//const middleware = require('../middleware')
//const crypto = require('crypto')
//const sgMail = require('@sendgrid/mail')
//sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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


// Landing page
router.get("/", (req, res) => {
    res.render("landing");
});

// show register form
router.get("/register", function(req, res){
    res.render("./auth/register", {
      data: {},
      error: ''
    });
  });

//handle sign up logic without email verification
router.post("/register",function(req, res){
  upload(req, res, (err) => {
    if (err) {
      res.render("./auth/register", {
        data: req.body,
        error: "Please upload only images for your profile picture (e.g. .jpeg/.png files)"
      })
    } else {
        let newUser
        if (req.file == undefined) {
          newUser = new User(
            {
              name: req.sanitize(req.body.name),
              email: req.sanitize(req.body.email),
              username: req.sanitize(req.body.username),
              organization: req.sanitize(req.body.organization),
              profilePic: ''
            });
        } else {
          newUser = new User(
            {
              name: req.sanitize(req.body.name),
              email:req.sanitize(req.body.email),
              username: req.sanitize(req.body.username),
              organization: req.sanitize(req.body.organization),
              profilePic: req.file.filename
            });
        }
        User.register(newUser, req.body.password, function(err, user){
          if(err){
            req.flash("error", err.message)
            console.log(err);
            return res.redirect("/register");
          }
          passport.authenticate("local")(req, res, function(){
            req.flash("success", "Successfully created account")
            res.redirect("/events");
          });
        });
      }
    }
  )
});
  
//handle sign up logic WITH EMAIL VERIFICATION
// router.post("/register", async function(req, res){
//   upload(req, res, (err) => {
//     if (err) {
//       res.render("./auth/register", {
//         data: req.body,
//         error: "Please upload only images for your profile picture (e.g. .jpeg/.png files)"
//       })
//     } else {
//         let newUser
//         if (req.file == undefined) {
//           newUser = new User(
//             {
//               name: req.sanitize(req.body.name),
//               email: req.sanitize(req.body.email),
//               emailToken: crypto.randomBytes(64).toString('hex'),
//               isVerified: false,
//               username: req.sanitize(req.body.username),
//               organization: req.sanitize(req.body.organization),
//               profilePic: ''
//             });
//         } else {
//           newUser = new User(
//             {
//               name: req.sanitize(req.body.name),
//               email:req.sanitize(req.body.email),
//               emailToken: crypto.randomBytes(64).toString('hex'),
//               isVerified: false,
//               username: req.sanitize(req.body.username),
//               organization: req.sanitize(req.body.organization),
//               profilePic: req.file.filename
//             });
//         }
//         User.register(newUser, req.body.password, async function(err, user){
//           if(err){
//             req.flash("error", err.message)
//             console.log(err)
//             return res.redirect("/register");
//           } 
//           const msg = {
//             to: user.email,
//             from: 'team.groupdapp@gmail.com',
//             subject: "Verify your group'd account",
//             text: `Thank you for registering with group'd, ${user.name}! Click here to verify your account to start using group'd today: http://${req.headers.host}/verify-email?token=${user.emailToken}`,
//             html: `
//             <h1>Thank you for registering with group'd, ${user.name}!</h1>
//             <h3>To verify your account, click <a href="http://${req.headers.host}/verify-email?token=${user.emailToken}">here</a> and start using group'd today!`
//           }
//           try {
//             await sgMail.send(msg)
//             req.flash("success", "Thanks for registering! Please check your email to verify your account before logging in!")
//             res.redirect('/')
//           } catch(err) {
//             console.log(err)
//             req.flash("error", "Something went wrong...Try again")
//             res.redirect("/register")
//           }
//         });
//       }
//     }
//   )
// });

// Email verification route 
// router.get('/verify-email', async (req, res, next) => {
//   try {
//     const user = await User.findOne({emailToken: req.query.token})
//     if (!user) {
//       req.flash("error", "Invalid token! Please contact us for assistance using our contact form!")
//       return res.redirect('/')
//     }
//     user.emailToken = null 
//     user.isVerified = true
//     await user.save()
//     await req.login(user, async (err) => {
//       if (err) return next(err)
//       const redirectUrl = req.session.redirectTo || '/events'
//       delete req.session.redirectTo
//       req.flash("success", `Welcome to group'd, ${user.username}!`)
//       res.redirect(redirectUrl)
//     })
//   } catch (err) {
//     console.log(err)
//     req.flash("error", "Something went wrong...Try again")
//     res.redirect("back")
//   }
// })
  
// show login form
router.get("/login", function(req, res){
  res.render("./auth/login");
});
  
// handling login logic (add isVerified if email verification is working)
router.post("/login", passport.authenticate("local",
  {
    successRedirect: "/events",
    failureRedirect: "/login",
    failureFlash: true
  }), function(req, res){
});
  
// logout
router.get("/logout", function(req, res){
  req.logout();
  req.flash("success", "You have been logged out")
  res.redirect("/");
});

module.exports = router