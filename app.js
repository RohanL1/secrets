
require('dotenv').config()
// console.log(process.env) // remove this after you've confirmed it working

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate = require('mongoose-findorcreate');
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


const userSchema = new mongoose.Schema({
  googleId : String,
  email : String,
  password : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// userSchema.plugin(encrypt,{secret : process.env.SECRET , encryptedFields: ['password']} );

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

/////////////////////////// ROOT
app.get("/", (req, res)=> {
  res.render("home");
});

/////////////////////////// AUTH/GOOGLE
app.route("/auth/google")

.get(passport.authenticate('google', { scope:[ 'profile' ] }));


/////////////////////////// AUTH/GOOGLE/SECRET
//below code WORKS
// app.get( '/auth/google/secrets',
//     passport.authenticate( 'google', {
//         successRedirect: '/secrets',
//         failureRedirect: '/login'
// }));

app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        failureRedirect: '/login'
}), (req, res )=> {
  // console.log(req);
  res.redirect("/secrets");
});


/////////////////////////// LOGIN
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
/////////////////////////// SECRET
app.get("/secrets", (req,res) => {
    if (req.isAuthenticated()){
      res.render("secrets");
    }
    else {
      res.redirect("/login");
    }
});


/////////////////////////// REGISTER
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

/////////////////////////// LOGOUT
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
