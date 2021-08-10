const express = require('express');
const app = express();
const session = require('express-session')
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate')
const User = require('./models/users')
const Note = require('./models/notes')
const bson = require('bson')
// const cookieParser = require('cookie-parser');
// const bodyParser = require('body-parser');

const passport = require('passport');
const LocalStrategy = require('passport-local');

const passportLocalMongoose = require('passport-local-mongoose');

const TimeAgo = require('javascript-time-ago')
// English.
const en = require('javascript-time-ago/locale/en')
TimeAgo.addDefaultLocale(en)
// Create formatter (English).
//const timeAgo = 
const timeAgo = new TimeAgo('en-US');


const mongoose = require('mongoose');
const path = require('path');
const { title } = require('process');
const { get } = require('http');

mongoose.connect('mongodb://localhost:27017/todoapp', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("connection open")
    })
    .catch(err => {
        console.log(err)
    })

mongoose.set('useFindAndModify', false);

const sessionConfig = {
    secret: 'secret',
    proxy: true,
    resave: true,
    saveUninitialized: true
}

mongoose.set('useCreateIndex', true);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(session(sessionConfig))

app.use(passport.initialize());
app.use(passport.session());

// app.use(cookieParser(sessionConfig.secret))
// app.use(express.bodyParser());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
})

app.engine('ejs', ejsMate)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.get("/", (req, res) => {
    res.send("potato")
})

app.get("/notes", async (req, res) => {
    const notes = await Note.find({ author: req.user._id })
    res.render('index.ejs', { notes, timeAgo });
});

app.get("/notes/new", async (req, res) => {
    const notes = await Note.find({})
    res.render('new.ejs', { notes });
});

app.post("/notes/new", async (req, res) => {
    const { title, body } = req.body
    const date = Date.now();
    const newNote = new Note({ title, body, date, author: req.user._id });
    await newNote.save();
    res.redirect(`/notes/${newNote._id}`);
})

app.get("/notes/:id", async (req, res) => {
    const { id } = req.params;
    const note = await Note.findById(id).populate('author');
    console.log(note)
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

app.get("/register", (req, res) => {
    res.render('register.ejs')
})
app.get("/login", (req, res) => {
    res.render('login.ejs')
})

app.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    const user = new User({ email, username })
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, err => {
        if (err) return next(err);
        res.redirect('/notes');
    })

})

app.get('/logout', async (req, res) => {
    await req.logout();
    req.session.user_id = res.user;
    res.redirect('/')
})

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/notes');
    });


app.listen(3000, () => {
    console.log("listening on port 3000")
})