require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const expressLayout = require('express-ejs-layouts');
const path = require('path');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3300;
const DB_URL = `mongodb://localhost:27017/pizza`;
const session = require('express-session');
const flash = require('express-flash');
const MongoDbStore = require('connect-mongo');

const app = express();


// Database connection

mongoose.connect(DB_URL, {

        useNewUrlParser : true,
        useCreateIndex : true,
        useUnifiedTopology : true,
        useFindAndModify : true

});

const connection = mongoose.connection;
connection.once('open', () => console.log('Connected to database successfully'
        )).catch(()=> console.log('Error while connecting to database'
));

// Session store 
const mongoStore =  new MongoDbStore({

        client : connection.getClient(),
        collectionName : 'sessions' 

});



// assign
app.use(session({

        secret: process.env.COOKIE_SECRET,
        resave : false,
        store : mongoStore,
        saveUninitialized : false,
        cookie : {maxAge : 100 * 60 * 60 * 24}

}));
app.use(flash());
app.use(express.static('public'));

app.use(express.json());
app.use((req, res, next) => {

        res.locals.session = req.session;
        next(); 
});

// set Template Engine 
app.use(expressLayout);
app.set('views', path.join(__dirname, '/resources/views'));
app.set('view engine', 'ejs');


require('./routes/web')(app);


app.listen(PORT, () => {

        console.log(`Server started & tuned at port ${PORT}`);


});