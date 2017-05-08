const express = require('express');
const router = express.Router();
const _ = require('lodash');
const {Room} = require('./../models/room');
let {authenticate} = require('./../middleware/authentication/authenticate');

router.get('/', authenticate, (req, res) => {
  res.render('chat/index', {title: 'Chat'});
});

router.post('/', authenticate, (req, res) => {
  const body = _.pick(req.body, ['name', 'password']);
  let room = new Room(body.name, body.password);

  if (!room.name) {
    return res.render('chat/index', {
      title: 'Chat',
      errors: {
        name: 'Name cannot be empty'
      }
    });
  }
  res.redirect(`/chat/${room.name}`);
});

router.get('/room', authenticate, (req, res) => {
  res.render('chat/room');
});

router.get('/:name', authenticate, (req, res) => {
  let roomName = req.params['name'];

  res.render('chat/room', {title: roomName});
});

module.exports = router;
