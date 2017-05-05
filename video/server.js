function configureServerSocket(io){
    var connections = new Array();

    io.sockets.on('connection', function (socket) {

        console.log("Klient '" + socket.id +"' dołączył się do serwera");

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

            connections.push({a: dane.cel, b: dane.od, ca: dane.index, cb: dane.indexZewn});
        });

        socket.on('disconnect', function() {
            console.log("Klient '" + socket.id +"' odłączył się od serwera");

            let connectionsToRemove = new Array();

            connections.forEach(function(connection) { if(connection.a != socket.id) return;
                io.to(connection.b).emit('disconn', connection.cb);
                connectionsToRemove.push(connection);         
            }, this);

            connections.forEach(function(connection) { if(connection.b != socket.id) return;
                io.to(connection.a).emit('disconn', connection.ca);
                connectionsToRemove.push(connection);            
            }, this);

            connectionsToRemove.forEach(function(connection) {
                let n = connections.indexOf(connection); connections.splice(n, 1);  
            }, this);
        });
    });
}

module.exports = { serverSocketIO: configureServerSocket };