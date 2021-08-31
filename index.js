const express = require('express');
const app = express();
const session = require('express-session');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const User = require('./models/users');
const flash = require('flash');
const markdownIt = require('markdown-it')
md = new markdownIt();

const passport = require('passport');
const LocalStrategy = require('passport-local');

const passportLocalMongoose = require('passport-local-mongoose');

const noteRoutes = require('./routes/notes')
const profileRoutes = require('./routes/profile')
const authRoutes = require('./routes/auth')

const mongoose = require('mongoose');
const path = require('path');
const { isLoggedIn,} = require('./middleware');

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
    for(let i of res.locals.flash){
        if (i.type == 'error'){
            i.type = 'danger'
        }
    }
    next();
})

app.engine('ejs', ejsMate)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use('/notes', noteRoutes)
app.use('/profile', profileRoutes)
app.use('/', authRoutes)

app.get("/", (req, res) => {
    res.send("potato")
})

app.get('/friends', isLoggedIn, async(req,res) =>{
    const user = await (await User.findById(req.user._id));
    const friends = [];
    for(friend of user.friends) friends.push(await User.findById(mongoose.Types.ObjectId(friend)))
    res.render('friends.ejs', { friends })
})

app.post('/friends', isLoggedIn, async(req,res) => {
    const { username } = req.body;
    const friend = await User.findOne({ username });
    const user = req.user;
    user.friends.push(friend._id)
    await user.save();
    res.redirect('/friends')
})


app.listen(3000, () => {
    console.log("listening on port 3000")
});