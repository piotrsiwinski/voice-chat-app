require('./config/config');
var {enviroment} = require('./middleware/enviroment');

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('connect-flash');
var hbs = require('hbs');
// routes
var index = require('./routes/index');
var account = require('./routes/account');
var chat = require('./routes/chat');

var {passport} = require('./middleware/authentication/passport');
var {mongoose} = require('./db/mongoose');
var {isAuthenticated} = require('./middleware/authentication/is-authenticated');
// helpers
var getCurrentYearHelper = require('./helpers/view-helpers/current-year');

var app = express();
var session_secret = 'keyboard cat';
app.use(session({
  secret: session_secret,
  resave: false,
  saveUninitialized: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper(getCurrentYearHelper.name, getCurrentYearHelper.getCurrentYear());

// check if user is authenticated
app.use(isAuthenticated);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser(session_secret));

app.use(express.static(path.join(__dirname, 'public')));
app.use(enviroment);

app.use('/', index);
app.use('/chat', chat);
app.use('/account', account);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : err.status;
  // render the error page
  res.status(err.status || 500);
  res.render('shared/error');
});

module.exports = app;
