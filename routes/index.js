var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('home/index', {title: 'Express'});
});

router.get('/about', (req, res, next) => {
  res.render('home/about', {title: 'About'});
});

router.get('/contact', (req, res, next) => {
  res.render('home/contact', {title: 'Contact'});
});

module.exports = router;
