const express = require('express');
const app = express();
const session = require('express-session');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const User = require('./models/users');
const Note = require('./models/notes');
const flash = require('flash');
// const bson = require('bson')
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
const { hasAccess, isLoggedIn, isAuthor, convertToUnix } = require('./middleware');

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
app.use(flash())
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

app.get("/notes", isLoggedIn, async (req, res) => {
    const notes = await Note.find({ author: req.user._id }).sort({ editDate: -1 })
    const sharedNotes = await Note.find({ sharedUsers: req.user._id }).sort({ editDate: -1 }).populate('author')
    res.render('index.ejs', { notes, sharedNotes, timeAgo });
});

app.get("/notes/new", isLoggedIn, async (req, res) => {
    const notes = await Note.find({})
    res.render('new.ejs', { notes });
});

app.post("/notes/new", isLoggedIn, async (req, res) => {
    const { title, body, date,time } = req.body
    const dueDate = convertToUnix(date,time);
    const createDate = Date.now();
    const newNote = new Note({ title, body, createDate:createDate, editDate:createDate, author: req.user._id});
    if(dueDate) newNote.dueDate = dueDate;
    await newNote.save();
    res.redirect(`/notes/${newNote._id}`);
});

app.get('/notes/todo', isLoggedIn, async (req,res) =>{
    const notes = await Note.find({ $or: [{ author: req.user._id }, { sharedUsers: req.user._id }], dueDate: { $gte: Date.now()} }).sort({ editDate: -1 }).populate('author')
    const overdue = await Note.find({ $or: [{ author: req.user._id }, { sharedUsers: req.user._id }], isCompleted:!true, dueDate: { $lt: Date.now()} }).sort({ editDate: -1 }).populate('author')
    res.render('todo.ejs', { notes, overdue, timeAgo });
})

app.get("/notes/:id", isLoggedIn, hasAccess, async (req, res) => {
    const { id } = req.params;
    const note = await Note.findById(id).populate('author');
    res.render('show.ejs', { note, timeAgo });
});

app.get("/notes/:id/edit", isLoggedIn, isAuthor, async (req, res) => {
    const { id } = req.params;
    const note = await Note.findById(id);
    res.render('edit.ejs', { note });
});

app.put("/notes/:id", isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const { title, body } = req.body;
    const date = Date.now();
    const note = await Note.findByIdAndUpdate(id, { title, body, editDate:date });
    req.flash("success", "Note updated sucessfully.")
    res.redirect(`/notes/${id}`);
});

app.patch('/notes/:id', isLoggedIn, hasAccess, async (req,res) =>{
    const {id} = req.params;
    const note = await Note.findById(id)
    note.isCompleted = note.isCompleted ? false : true;
    await note.save()
    res.redirect(`/notes/${id}`)
})

app.delete("/notes/:id", isLoggedIn, isAuthor, async (req, res) => {
    const { id } = req.params;
    const { title, body } = req.body;
    const note = await Note.findByIdAndDelete(id);
    req.flash("success", "Note deleted sucessfully.")
    res.redirect('/notes/');
});

app.get('/notes/:id/share', isLoggedIn, isAuthor, async (req, res) => {
    const { id } = req.params;
    const note = await Note.findById(id)
    res.render('share.ejs', { note })
});

app.post('/notes/:id/share', isLoggedIn, isAuthor, async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;
    shareUser = await User.findOne({ username });
    const note = await Note.findById(id);
    note.sharedUsers.push(shareUser._id);
    await note.save();
    req.flash("success", `Note sucessfully shared with ${username}.`)
    res.redirect(`/notes/${id}`);
});

app.get("/register", (req, res) => {
    res.render('register.ejs')
});
app.get("/login", (req, res) => {
    res.render('login.ejs')
});

app.post('/register', async (req, res) => {
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

app.get('/logout', isLoggedIn, async (req, res) => {
    await req.logout();
    req.session.user_id = res.user;
    res.redirect('/')
    req.flash("success", "Logged out.")
});

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login', }),
    (req, res) => {
        res.locals.errors = req.flash("error");
        req.flash("success", "Logged in sucessfully.")
        res.redirect('/notes');
    });


app.listen(3000, () => {
    console.log("listening on port 3000")
});