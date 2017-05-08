var express = require('express');
var router = express.Router();
var {passport} = require('../middleware/authentication/passport');
let {authenticate} = require('./../middleware/authentication/authenticate');

router.get('/login', (req, res) => {
  res.render('account/login', {message: req.flash('error')});
});

router.post('/login',
  passport.authenticate('local-login', {
    successRedirect: '/',
    failureRedirect: '/account/login',
    failureFlash: true
  })
);

router.get('/register', (req, res) => {
  res.render('account/register', {message: req.flash('error')});
});

router.post('/register', passport.authenticate('local-register', {
  successRedirect: '/',
  failureRedirect: '/account/register',
  failureFlash: true
}));

router.post('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

router.get('/details', authenticate, (req, res) => {
  res.render('account/details');
});

module.exports = router;