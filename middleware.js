const Note = require('./models/notes')
const mongoose = require('mongoose');


module.exports.isLoggedIn = (req, res, next) => {
    req.session.redirect = req.originalUrl;
    req.user ? next() : res.redirect('/login')
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
        req.flash("danger", "You do not have permission to do that.");
        return res.redirect("/notes")
    }
    next();
}

module.exports.timeConvert = (req,res,next) => {
    const { date, time } = req.body
    if (!date && !time) return next();
    else if (!date) {
        req.flash("danger", "Date required");
        return res.redirect('/notes/new');
    }
    else if (!time) {
        req.flash("danger", "Time required");
        return res.redirect('/notes/new');
    }
    let unixDate = new Date(date);
    unixDate = unixDate.getTime();
    seconds = new Date('1970-01-01T' + time + 'Z').getTime();
    let offset = new Date().getTimezoneOffset();
    offset *= 60000;
    res.locals.dueDate = unixDate + seconds + offset;
    next();
}