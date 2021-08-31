const express = require('express');
const router = express.Router();

const User = require('../models/users');
const Note = require('../models/notes');
const { hasAccess, isLoggedIn, isAuthor, convertToUnix } = require('../middleware');

const TimeAgo = require('javascript-time-ago')
const en = require('javascript-time-ago/locale/en')
TimeAgo.addDefaultLocale(en)

const timeAgo = new TimeAgo('en-US');

router.get("/", isLoggedIn, async (req, res) => {
    const notes = await Note.find({ author: req.user._id }).sort({ editDate: -1 })
    const sharedNotes = await Note.find({ sharedUsers: req.user._id }).sort({ editDate: -1 }).populate('author')
    res.render('index.ejs', { notes, sharedNotes, timeAgo });
});

router.get("/new", isLoggedIn, async (req, res) => {
    const notes = await Note.find({})
    res.render('new.ejs', { notes, md });
});

router.post("/new", isLoggedIn, async (req, res) => {
    const { title, body, date, time } = req.body
    const dueDate = convertToUnix(date, time);
    if (dueDate == "nodate") {
        req.flash("danger", "Date required");
        res.redirect("/notes/new");
        return;
    }
    const createDate = Date.now();
    const newNote = new Note({ title, body, createDate: createDate, editDate: createDate, author: req.user._id });
    if (dueDate) newNote.dueDate = dueDate;
    await newNote.save();
    res.redirect(`/notes/${newNote._id}`);
});

router.get('/todo', isLoggedIn, async (req, res) => {
    const notes = await Note.find({ $or: [{ author: req.user._id }, { sharedUsers: req.user._id }], isCompleted: !true, dueDate: { $gte: Date.now() } }).sort({ editDate: -1 }).populate('author')
    const overdue = await Note.find({ $or: [{ author: req.user._id }, { sharedUsers: req.user._id }], isCompleted: !true, dueDate: { $lt: Date.now() } }).sort({ editDate: -1 }).populate('author')
    res.render('todo.ejs', { notes, overdue, timeAgo });
})


router.get("/:id", isLoggedIn, hasAccess, async (req, res) => {
    const { id } = req.params;
    const note = await Note.findById(id).populate('author');
    res.render('show.ejs', { note, timeAgo, md });
});

router.get("/:id/edit", isLoggedIn, isAuthor, async (req, res) => {
    const { id } = req.params;
    const note = await Note.findById(id);
    res.render('edit.ejs', { note });
});

router.put("/:id", isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const { title, body } = req.body;
    const date = Date.now();
    const note = await Note.findByIdAndUpdate(id, { title, body, editDate: date });
    req.flash("success", "Note updated sucessfully.")
    res.redirect(`/notes/${id}`);
});

router.patch('/:id', isLoggedIn, hasAccess, async (req, res) => {
    const { id } = req.params;
    const note = await Note.findById(id)
    note.isCompleted = note.isCompleted ? false : true;
    await note.save()
    res.redirect(`/notes/${id}`)
})

router.delete("/:id", isLoggedIn, isAuthor, async (req, res) => {
    const { id } = req.params;
    const { title, body } = req.body;
    const note = await Note.findByIdAndDelete(id);
    req.flash("success", "Note deleted sucessfully.")
    res.redirect('/notes/');
});

router.get('/:id/share', isLoggedIn, isAuthor, async (req, res) => {
    const { id } = req.params;
    const note = await Note.findById(id)
    res.render('share.ejs', { note })
});

router.post('/:id/share', isLoggedIn, isAuthor, async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;
    shareUser = await User.findOne({ username });
    const note = await Note.findById(id);
    note.sharedUsers.push(shareUser._id);
    await note.save();
    req.flash("success", `Note sucessfully shared with ${username}.`)
    res.redirect(`/notes/${id}`);
});

module.exports = router;