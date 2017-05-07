var express = require('express');
var router = express.Router();
const _ = require('lodash');
var { User } = require('./../models/user');

var {passport} = require('./../authentication/passport');

router.get('/login', (req, res) => {
  res.render('account/login');
});

router.post('/login',
  passport.authenticate('login', {
    successRedirect: '/',
    failureRedirect: '/account/login',
    failureFlash: true
  })
);

router.get('/register', (req, res) => {
  res.render('account/register');
});

router.post('/register', (req, res) => {
  res.redirect('/');
});

router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

router.get('/details', (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect('/account/login');
  }
  res.render('account/details');
});

module.exports = router;