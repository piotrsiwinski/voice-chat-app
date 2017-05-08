var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var {User} = require('../../models/user');
var _ = require('lodash');

// passport session setup
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

// Local register strategy
passport.use('local-register', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, (req, email, password, done) => {
  process.nextTick(() => {
    User.findOne({'email': email}, (err, user) => {
      if (err) { return done(err);}
      if (user) {
        return done(null, false, req.flash('error', 'That email is already registered'));
      } else {
        let body = _.pick(req.body, ['email', 'password', 'confirmPassword']);
        if(body.password !== body.confirmPassword){
          return done(null, false, req.flash('error', "Passwords doesn't match"));
        }
        let newUser = new User();
        newUser.email = email;
        newUser.password = newUser.generateHash(password);
        newUser.save(err => {
          if (err) {throw err;}
          return done(null, newUser);
        });
      }
    });
  });
}));

passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  (req, email, password, done) => {
    process.nextTick(() => {
      User.findOne({'email': email}, (err, user) => {
        if (err) {return done(err);}
        if (!user) {
          return done(null, false, req.flash('error', 'Wrong email or password'));
        }
        if (!user.validPassword(password)) {
          return done(null, false, req.flash('error', 'Wrong email or password'));
        }
        return done(null, user);
      });
    });
  }));
module.exports = {passport};