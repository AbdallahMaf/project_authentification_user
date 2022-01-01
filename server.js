require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const User = require("./models/user");
const bcrypt = require("bcryptjs");

const {
    checkAuthenticated,
    checkNotAuthenticated,
} = require("./middlewares/authentification");

const app = express();

const initializePassport = require("./passport-config");
initializePassport(
    passport,
    async(email) => {
        const userFound = await User.findOne({ email })
        return userFound;
    },
    async (id) => {
        const userFound = await User.findOne({ _id: id })
        return userFound;
    }
);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(flash());
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride("_method"))
app.use(express.static("public"));

app.get("/", checkAuthenticated, (req, res) => {
    res.render("index", {name: req.user.name});
});

app.get("/inscrire", checkNotAuthenticated, (req, res) => {
    res.render("inscrire");
});

app.get("/connecter", checkNotAuthenticated, (req, res) => {
    res.render("connecter");
});

app.get("/forgetpassword", checkNotAuthenticated, (req, res) => {
    res.render("forgetpassword");
});

app.post("/connecter", 
    checkNotAuthenticated, 
    passport.authenticate("local", {
        successRedirect:"/",
        failureRedirect: "/connecter",
        failureFlash: true,
    })
);

app.post("/inscrire", checkNotAuthenticated, async (req, res) => {
    const userFound = await User.findOne({ email: req.body.email });

    if(userFound){
        req.flash("error", "Cette adresse mail existe déjà");
        res.redirect("/inscrire");
    } else {
      try { 
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        });

        await user.save();
        res.redirect("/connecter");  
      } catch (error) {
          console.log(error);
          res.redirect("/inscrire"); 
      }  
    }
});

// app.update("/forgetpassword", checkNotAuthenticated, (req, res) =>{
//     const userFound = await User.update({ email: req.body.email });

//     if(userFound){
//         req.flash("error", "Cette adresse mail n'existe pas);
//         res.redirect("/forgetpassword);
//     } else {
//       try { 
//         const hashedPassword = await bcrypt.hash(req.body.password, 10);
//         const user = new User({
//             password: hashedPassword,
//         });
//         await user.save();
//         res.redirect("/connecter");  
//       } catch (error) {
//           console.log(error);
//           res.redirect("/forgetpassword"); 
//       }  
//     }
// });

app.delete("/logout", (req,res) => {
    req.logOut()
    res.redirect("/connecter");
})

mongoose
    .connect("mongodb://localhost:27017/authentification", {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    })
    .then(() => {
        app.listen(3000, () => {
            console.log("Server is Running on Port 3000")
        });
    });