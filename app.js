
require('dotenv').config()
console.log(process.env) // remove this after you've confirmed it working

const express = require('express');
const mongoose = require('mongoose');
const encrypt= require('mongoose-encryption');
// const lodash = require('lodash');
// const https = require('https');

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/userDB');
// mongoose.connect('mongodb+srv://rohan:rohan%4014697@cluster0.c1szl.mongodb.net/todolistDB').catch(err=> {
//   if (err)
//   console.log(err);
// });

const userSchema = new mongoose.Schema({
  email : String,
  password : String
});


userSchema.plugin(encrypt,{secret : process.env.SECRET , encryptedFields: ['password']} );

const User = mongoose.model("User", userSchema);

app.get("/", (req, res)=> {
  res.render("home");
});

app.route("/login")
.get((req, res)=> {
  res.render("login");
})


.post((req, res)=> {
  const userName = req.body.username;
  const password = req.body.password;

  User.findOne({email: userName}, (err, result)=>{
    if (err){
      console.log(err);
    }
    else {
      if (result){
        if(password === result.password)
        {
          res.render("secrets");
        }
      }
    }
  });

});

app.route("/register")

.get( (req, res)=> {
  res.render("register");
})


.post( (req, res)=> {
  let tempUser = new User ({
    email: req.body.username,
    password : req.body.password
  });
  tempUser.save((err)=> {
    if (!err){
      res.render("secrets");
    }
    else
    res.send("something went wrong, pls try again !")
  });
});


let port = process.env.PORT;
if (port == null || port == ""){
  port = 3000;
}
app.listen(port, () => {
  console.log("Server have started successfully");
});
