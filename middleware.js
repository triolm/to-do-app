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
//definitely a middleware. Totally.
module.exports.convertToUnix = (date,time) =>{
    if(!date && !time) return;
    else if(!date) return "nodate"
    let unixDate = new Date(date);
    unixDate = unixDate.getTime(); 
    if (!time){ 
        time = new Date().toLocaleTimeString();
        console.log(time)
        time = time.slice(0,5)
        console.log(time)
    }
    seconds = new Date('1970-01-01T' + time + 'Z').getTime();
    console.log(seconds);
    let offset = new Date().getTimezoneOffset();
    offset *= 60000;
    return unixDate + seconds + offset;
}