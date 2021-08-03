const express = require('express');
const ejs = require('ejs');
const expressLayout = require('express-ejs-layouts');
const path = require('path');
const PORT = process.env.PORT || 3300;

const app = express();




app.get('/', (req, res) => {

        res.render('home');
      

});


// set Template Engine 
app.use(expressLayout);
app.set('views', path.join(__dirname, '/resources/views'));
app.set('view engine', 'ejs');








app.listen(PORT, () => {

        console.log(`Server started & tuned at port ${PORT}`);


});