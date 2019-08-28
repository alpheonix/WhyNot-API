var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cron = require('node-cron');
var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');


const {MongoClient} = require('./config');
const {MONGODB_URI} = require('./config');
const {dbName} = require('./config');
const {ObjectId} = require('./config');

var usersRouter = require('./routes/users/users');
var reportRouter = require('./routes/reports/report');
var eventsRouter = require('./routes/events/events');
var adminRouter = require('./routes/users/admin/adminAuth');
var likeRouter = require('./routes/match/like');
var matchRouter = require('./routes/match/match');
var app = express();

// view engine setups
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/report', reportRouter);
app.use('/events', eventsRouter);
app.use('/users/admin', adminRouter);
app.use('/users/like', likeRouter);
app.use('/users/match', matchRouter);
app.use('/public/images', express.static('public/images'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
         user: 'arthurblanc98@gmail.com',
         pass: '4kfe6fp.gmail'
     }
 });

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

cron.schedule('* * * * *',async () => {

  const client = new MongoClient(MONGODB_URI, {useNewUrlParser: true});
  try {
      await client.connect();
      const db = client.db(dbName);
      const col = db.collection('users');
      var result = await col.find().toArray();
    console.log(result);
    
      result.forEach(elem,async  => {
        console.log(result[0]._id);
        test
        var result2 =  col.findOne(
            { _id: ObjectId(result[0]._id)} )
            console.log(result2);

            const mailOptions = {
              from: 'arthurblanc98@gmail.com', // sender address
              to: result2[0].email, // list of receivers
              subject: 'Passez vite ur Whynot vous pouriez decouvrir ', // Subject line
              html: '<p>decouvrez le profil de  </p>'// plain text body
            };
            transporter.sendMail(mailOptions, function (err, info) {
              if(err)
                console.log(err)
              else
                console.log(info);
           });
      });
  } catch (err) {
      console.log(err);
      
  }
  
  console.log('running a task every minute');
});

module.exports = app;
