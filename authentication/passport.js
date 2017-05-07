var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var {User} = require('./../models/user');

passport.serializeUser(function (user, done) {
  console.log(`in middleware ${user}`);
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  console.log(`in middleware ${user}`);
  User.findById({id}, function (err, user) {
    done(err, user);
  });
});

passport.use('login', new LocalStrategy(function (email, password, done) {
    User.findOne({ email: email }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, {message: 'Incorrect username.'});
      }
      return done(null, user);
    });
  }
));

module.exports = {passport};