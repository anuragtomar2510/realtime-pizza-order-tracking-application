require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const expressLayout = require('express-ejs-layouts');
const path = require('path');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3300;
const DB_URL = process.env.MONGO_URL;
const session = require('express-session');
const flash = require('express-flash');
const MongoDbStore = require('connect-mongo');
const passport = require('passport');
const Emitter = require('events');

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

// Event emitter
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)


// assign
app.use(session({

        secret: process.env.COOKIE_SECRET,
        resave : false,
        store : mongoStore,
        saveUninitialized : false,
        cookie : {maxAge : 100 * 60 * 60 * 24}

}));


// Passport Config 

const passportInit = require('./app/http/config/passport');
passportInit(passport);
app.use(passport.initialize());
app.use(passport.session());


app.use(flash());




app.use(express.static('public'));

app.use(express.urlencoded({extended : false}));
app.use(express.json());
app.use((req, res, next) => {

        res.locals.session = req.session;
        res.locals.user = req.user;
        next();
      
});

// set Template Engine 
app.use(expressLayout);
app.set('views', path.join(__dirname, '/resources/views'));
app.set('view engine', 'ejs');


require('./routes/web')(app);
app.use((req, res) => {

        res.status(404).send('<h1>404, Page Not Found :(</h1>')
})

const server = app.listen(PORT, () => {

        console.log(`Server started & tuned at port ${PORT}`);


});


// Socket
const io = require('socket.io')(server);
io.on('connection', (socket) => {

        socket.on('join', (orderId) => {

                socket.join(orderId)

        })
})


eventEmitter.on('orderUpdated', (data) => {

        
        io.to(`order_${data._id}`).emit('orderUpdated', data);
        
})

eventEmitter.on('orderPlaced', (data) => {

       console.log(data)
        io.to('adminRoom').emit('orderPlaced', data)
        
})