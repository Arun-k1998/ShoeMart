require('dotenv').config()
const mongoose = require("mongoose");
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGOCONNECT)
.then(()=>{
  console.log("running");
})


const path = require('path')
const morgan = require('morgan')

const express = require('express');
const app = express();

app.use(express.static(path.join(__dirname,'public')))
app.use(function (req, res, next) {
    res.set("cache-control", "no-store");
    next();
  });
  
app.use(morgan('dev'))
const userRoute = require('./routes/UserRoute');
app.use('/',userRoute);

const adminRoute = require('./routes/adminRoute')
app.use('/admin',adminRoute)


app.listen(3000,()=>{
    console.log('server is running........')
});