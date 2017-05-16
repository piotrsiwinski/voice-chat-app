// class Room {
//   constructor (name, password) {
//     this.name = name;
//     this.password = password;
//   }
// }

const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: ['true', 'Room name is required'],
    minlength: [4, 'Name is too short. It has to contain at least 4 characters']

  },
  password: {
    type: String,
    required: ['true', 'Password is required']
  }
});

// RoomSchema.methods.generateHash = function(password) {
//   return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
// };

RoomSchema.methods.validPassword = function(password) {
  let room = this;
  return bcrypt.compareSync(password, room.password);
};

RoomSchema.pre('save', function(next){
  var room = this;
  if(room.isModified('password')){
    room.password =  bcrypt.hashSync(room.password, bcrypt.genSaltSync(8), null);
    next();
  }else{
    next();
  }
});


var Room = mongoose.model('Room', RoomSchema);

module.exports = {Room};