
require('dotenv').config()
console.log(process.env) // remove this after you've confirmed it working

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
// const md5 = require('md5');
//const encrypt= require('mongoose-encryption');
// const lodash = require('lodash');
// const https = require('https');

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret : "RANDOM long string for secret",
  resave : false,
  saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB');
// mongoose.connect('mongodb+srv://rohan:rohan%4014697@cluster0.c1szl.mongodb.net/todolistDB').catch(err=> {
//   if (err)
//   console.log(err);
// });

const userSchema = new mongoose.Schema({
  email : String,
  password : String
});

userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(encrypt,{secret : process.env.SECRET , encryptedFields: ['password']} );

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res)=> {
  res.render("home");
});

app.route("/login")
.get((req, res)=> {
  res.render("login");
})

//below CODE ALSO WORKS
// .post(passport.authenticate('local', {
//   successRedirect: '/secrets',
//   failureRedirect: '/login',
// }));

//if successRedirect is not defined then goes to callback funtion
.post(passport.authenticate('local', {
  //successRedirect: '/secrets',
  failureRedirect: '/login',
})
, (req, res )=> {
  console.log("logged in ");
  res.redirect("/secrets")
}

);


// HAVE BUG IN BELOW CODE 
// .post((req, res)=> {
//   let user = new User({
//     username : req.body.username,
//     password : req.body.password
//   });
//
//   req.login(user, function(err) {
//   if (err) {
//     console.log(err);
//   }
//   else {
//     passport.authenticate("local")(req, res, () => {
//       res.redirect("/secrets");
//     });
//   }
//
//   });
//
// });

app.get("/secrets", (req,res) => {
    if (req.isAuthenticated()){
      res.render("secrets");
    }
    else {
      res.redirect("/login");
    }
});

app.route("/register")

.get( (req, res)=> {
  res.render("register");
})


.post( (req, res)=> {
  User.register({username:req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    }
    else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }

    // var authenticate = User.authenticate();
    // authenticate('username', 'password', function(err, result) {
    //   if (err) { ... }
    //
    //   // Value 'result' is set to false. The user could not be authenticated since the user is not active
    // });

  });
});

app.get ("/logout", (req,res)=>{
  req.logout();
  res.redirect("/");
});


let port = process.env.PORT;
if (port == null || port == ""){
  port = 3000;
}
app.listen(port, () => {
  console.log("Server have started successfully");
});
