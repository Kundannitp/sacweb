require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const multer=require("multer");
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

/**Creating Storage********/
var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./Images");
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

var upload = multer({
    storage: Storage
}).array("imgUploader", 3);

app.get("/profile",function(req,res){
    res.render("profile");
});

app.post("/api/Upload", function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            return res.end("Something went wrong!");
        }
        return res.end("File uploaded sucessfully!.");
    });
});

/**************************/

app.use(session({
    secret:process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://Kundan2000:Kundan2000@@k2j-ebqyx.mongodb.net/SacWeb3", {
    useNewUrlParser: true,
    useUnifiedTopology: true
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

const NoticeSchema=new mongoose.Schema({
    name:String,
    notice:String,
    noticelink:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Blogs=new mongoose.model("Blogs",BlogsSchema);
const Notice=new mongoose.model("Notices",NoticeSchema);

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
var noticelinkarr=new Array();
//Google Developer Console Id kundannitp3316@gmail.com
passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/sacweb",
        // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
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

app.get("/", function (req, res) {
        var buttontext = "SIGNIN";
        if (req.isAuthenticated()) {
            buttontext = "LOGOUT";
            // console.log(profileuser);
            
        } else {
            console.log("not Authenticated");
        }

        Notice.find(function (err, noticearr) {
            if (err) {
                console.log(err);
            } else {
                for (var i = 0; i < noticearr.length; i++) {
                    var j;
                    for(j=0;j<Pname.length;j++){
                        if (noticearr[i].name === Pname[j] && noticearr[i].notice===eventdis[j]&&noticelinkarr[j]===noticearr[i].noticelink){
                            break;
                        }
                    }
                    if(j==Pname.length){
                        Pname.push(noticearr[i].name);
                        eventdis.push(noticearr[i].notice);
                        noticelinkarr.push(noticearr[i].noticelink);
                    }
                }
            }
        });

        Blogs.find(function (err, blogsarr) {
            if (err) {
                console.log(err);
            } else {
                for (var i = 0; i < blogsarr.length; i++) {
                    var j;
                    for(j=0;j<personName.length;j++){
                        if (imgblog[j] === blogsarr[i].imgurl && personName[j] === blogsarr[i].name && blogs1[j] === blogsarr[i].post
                            && blogshead[j] === blogsarr[i].posttitle){
                                break;
                            }
                    }
                    if(j==personName.length){
                        imgblog.push(blogsarr[i].imgurl);
                        personName.push(blogsarr[i].name);
                        blogs1.push(blogsarr[i].post);
                        blogshead.push(blogsarr[i].posttitle);
                    }
                }
            }
        });



        var v = {
            proimgsrc: proimgsrc,
            personname: personname,
            blogs: blogs1,
            bloghead: blogshead,
            personname1: personName,
            blogimg: imgblog,
            buttontext: buttontext,
            Pname: Pname,
            eventdis: eventdis,
            noticelink:noticelinkarr
        }
        res.render('blogs', v);
});
app.get("/auth/google",
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

app.get("/auth/google/sacweb",
    passport.authenticate('google', {
        failureRedirect: "/"
    }),
    function (req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect("/profileuser");
});

app.get("/profileuser", (req, res) => {
    res.send(profileuser);
})

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});


/***************Testing route*************/

app.post('/testing',function(req,res){
    var name1=req.body.name;
    var email1=req.body.email;
    console.log(req.body);
    var val = {
        name: name1,
        email: email1
    }
    res.send(val);
});

app.get('/testing',function(req,res){
    res.render('testing');
})


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
    res.redirect('/');
});

app.get('/header',function(req,res){
    res.render('mainbody',{
        css:"mainbody"
    })
})


app.listen(process.env.PORT||3000, function () {
    console.log("Server started on port 3000.");
});