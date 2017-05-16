const express = require('express');
const router = express.Router();
const _ = require('lodash');
const {Room} = require('./../models/room');
let {authenticate} = require('./../middleware/authentication/authenticate');

router.get('/', authenticate, (req, res) => {
  res.render('chat/index', {title: 'Chat', error: req.flash('error')});
});


router.post('/', authenticate, (req, res) => {
  const body = _.pick(req.body, ['name', 'password']);
  Room.findOne({name: body.name}).then(room => {
    if (!room) {
      let newRoom = new Room(body);

      return newRoom.save().then(() => {
        req.flash('room', 'OK');
        res.redirect(301, `/chat/${body.name}`);
      });
    } else {
      if (!room.validPassword(body.password)) {
        req.flash('error', 'Wrong password');
        return res.redirect('/chat');
      }
      req.flash('room', 'OK');
      return res.redirect(301, `/chat/${body.name}`);
    }
  }).catch(e => {
    req.flash('error', e.toString());
    res.redirect('/chat');
  });
});

router.get('/room', authenticate, (req, res) => {
  res.render('chat/room');
});

router.get('/:name', authenticate, (req, res) => {
  let room = req.flash().room;

  if(!room){
    req.flash('error', 'Type password');
    return res.redirect('/chat');
  }
  let roomName = req.params['name'];
  return res.render('chat/room', {title: roomName});

});

module.exports = router;
