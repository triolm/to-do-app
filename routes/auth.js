const express = require('express');
const router = express.Router();

const User = require('../models/users');
const {isLoggedIn} = require('../middleware');
const passport = require('passport');

router.get("/register", (req, res) => {
    res.render('register.ejs')
});
router.get("/login", (req, res) => {
    res.render('login.ejs')
});

router.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    const user = new User({ email, username })
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, err => {
        if (err) return next(err);
        res.redirect('/notes');
    })
    req.flash('info', 'Welcome!')
    passport.authenticate()
});

router.get('/logout', isLoggedIn, async (req, res) => {
    await req.logout();
    req.session.user_id = res.user;
    res.redirect('/')
    req.flash("success", "Logged out.")
});

router.post('/login',
    passport.authenticate('local', { failureRedirect: '/login', failureFlash: 'Username and password do not match.' }),
    (req, res) => {
        req.flash("success", "Logged in sucessfully.")
        req.session.redirect ? res.redirect(req.session.redirect) : res.redirect('/notes')
    });

module.exports = router;