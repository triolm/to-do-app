const express = require('express');
const router = express.Router();

const { isLoggedIn, } = require('../middleware');
const User = require('../models/users');

router.get('/', isLoggedIn, async (req, res) => {
    res.render('profile.ejs')
})

router.get('/edit', isLoggedIn, async (req, res) => {
    res.render('editProfile.ejs')
}) 

router.patch('/', isLoggedIn, async (req, res) => {
    const { bio } = req.body;
    user = await User.findById(req.user._id);
    user.bio = bio;
    await user.save();
    res.redirect('/profile')
})

module.exports = router;