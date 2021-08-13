const Note = require('./models/notes')
const mongoose = require('mongoose');


module.exports.isLoggedIn = (req, res, next) => {
    req.user ? next() : res.redirect("/login")
}

module.exports.hasAccess = async (req, res, next) => {
    let { id } = req.params;
    const note = await Note.findById(id);
    if (parseInt(note.author) != parseInt(req.user._id) && !note.sharedUsers.includes(req.user._id)) {
        req.flash("danger", "You don't have permission to access that.");
        return res.redirect("/notes")
    }
    next();
}

module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const note = await Note.findById(id)
    if (parseInt(note.author) != parseInt(req.user._id)) {
        res.flash("danger", "You do not have permission to do that.");
        return res.redirect("/notes")
    }
    next();
}