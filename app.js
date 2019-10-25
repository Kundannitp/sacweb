require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret:process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://Kundan2000:Kundan2000@@k2j-ebqyx.mongodb.net/SacWeb3", {
    useNewUrlParser: true
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

const BlogsSchema = new mongoose.Schema({
    name: String,
    posttitle: String,
    post: String,
    imgurl: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Blogs=new mongoose.model("Blogs",BlogsSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

var proimgsrc = "Images/SacLogo.jpg";
var personname = "Anonymous";
var profileuser;
var Pname = new Array();
var eventdis = new Array();
var imgblog = new Array();
var personName = new Array();
var blogs1 = new Array();
var blogshead = new Array();
Pname.push("Kundan kumar Jha");
eventdis.push("#tcf2k20 results");
Pname.push("Prabhkirat Singh");
eventdis.push("#tcf2k20 results");
Pname.push("Manish Kumar");
eventdis.push("#tcf2k20 results");
Pname.push("Rakesh Singh rajput");
eventdis.push("#tcf2k20 results");
passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/sacweb",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        profileuser=profile;
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));
Blogs.find(function (err, blogsarr) {
    if (err) {
        console.log(err);
    } else {
        for (var i = 0; i < blogsarr.length; i++) {
            imgblog.push(blogsarr[i].imgurl);
            personName.push(blogsarr[i].name);
            blogs1.push(blogsarr[i].post);
            blogshead.push(blogsarr[i].posttitle);
        }
    }
});

app.get("/", function (req, res) {
        var buttontext = "SIGNIN";
        if (req.isAuthenticated()) {
            buttontext = "LOGOUT";
        } else {
            console.log("not Authenticated");
        }

        var v = {
            proimgsrc: proimgsrc,
            personname: personname,
            blogs: blogs1,
            bloghead: blogshead,
            personname1: personName,
            blogimg: imgblog,
            buttontext: buttontext,
            Pname: Pname,
            eventdis: eventdis
        }
        res.render('blogs', v);
});
app.get("/auth/google",
    passport.authenticate('google', {
        scope: ["profile"]
    })
);

app.get("/auth/google/sacweb",
    passport.authenticate('google', {
        failureRedirect: "/"
    }),
    function (req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect("/");
    });
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

app.post("/signup", function (req, res) {

    User.register({
        username: req.body.username
    }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/");
            });
        }
    });

});

app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/");
            });
        }
    });

});

app.post('/writeBlog', function (req, res) {
    var blogs = new Blogs({
        name: "Anonymous",
        posttitle: req.body.posttitle,
        post: req.body.post,
        imgurl: "Images/SacLogo.jpg"
    });
    blogs.save();
    imgblog.push("Images/SacLogo.jpg");
    personName.push("Anonymous");
    blogs1.push(req.body.post);
    blogshead.push(req.body.posttitle);
    res.redirect('/');
});


app.listen(process.env.PORT||3000, function () {
    console.log("Server started on port 3000.");
});