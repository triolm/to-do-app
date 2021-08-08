const express = require('express');
const app = express();
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate')

const TimeAgo = require('javascript-time-ago')
// English.
const en = require('javascript-time-ago/locale/en')
TimeAgo.addDefaultLocale(en)
// Create formatter (English).
const timeAgo = new TimeAgo('en-US')

const mongoose = require('mongoose');
const path = require('path');
const { title } = require('process');

mongoose.connect('mongodb://localhost:27017/todoapp', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("connection open")
    })
    .catch(err => {
        console.log(err)
    })

mongoose.set('useFindAndModify', false);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
    },
    date: {
        type: String
    }

});

const Note = mongoose.model('Note', noteSchema)

app.engine('ejs', ejsMate)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get("/notes", async (req, res) => {
    const notes = await Note.find({})
    res.render('index.ejs', { notes, timeAgo });
});

app.get("/notes/new", async (req, res) => {
    const notes = await Note.find({})
    res.render('new.ejs', { notes });
});

app.post("/notes/new", async (req, res) => {
    const { title, body } = req.body
    const date = Date.now();
    const newNote = new Note({ title, body, date });
    await newNote.save();
    res.redirect(`/notes/${newNote._id}`);
})

app.get("/notes/:id", async (req, res) => {
    const { id } = req.params;
    const note = await Note.findById(id);
    res.render('show.ejs', { note, timeAgo });
})

app.get("/notes/:id/edit", async (req, res) => {
    const { id } = req.params;
    const note = await Note.findById(id);
    res.render('edit.ejs', { note });
})

app.put("/notes/:id", async (req, res) => {
    const { id } = req.params;
    const { title, body } = req.body;
    const date = Date.now();
    const note = await Note.findByIdAndUpdate(id, { title, body, date });
    res.redirect(`/notes/${id}`);
})

app.delete("/notes/:id", async (req, res) => {
    const { id } = req.params;
    const { title, body } = req.body;
    const note = await Note.findByIdAndDelete(id);
    res.redirect('/notes/');
})

app.listen(3000, () => {
    console.log("listening on port 3000")
})