var io = require('socket.io').listen(8080);
    console.log("Uruchomiono serwer na porcie *.8080");

io.sockets.on('connection', function (socket) {

  socket.on('hello', function(){
      var _ids = new Array();
      Object.keys(io.sockets.connected).forEach(function(c) {
        if(c != socket.id) _ids.push(c);
      });
      socket.emit('hello', _ids);
  });

  socket.on('offer', function(dane){
     console.log("OD: " + dane.od + " DO: " + dane.cel + " (OFERTA)");
     io.to(dane.cel).emit('offer', dane);
  });

  socket.on('candidate', function(dane){
      console.log("OD: " + dane.od + " DO: " + dane.cel + " (KANDYDAT)");
      io.to(dane.cel).emit('candidate', dane);
  });

  socket.on('answer', function(dane){
      console.log("OD: " + dane.od + " DO: " + dane.cel + " (ODPOWIEDŹ)");
      io.to(dane.cel).emit('answer', dane);
  });
});