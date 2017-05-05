function configureServerSocket(io){

    var connections = new Array();
    var rooms = new Array();

    io.sockets.on('connection', function (socket) {
        console.log("Klient '" + socket.id +"' dołączył się do serwera");

        socket.on('hello', function(roomName){
            
            socket.join(roomName);
            rooms.push({client: socket.id, roomName: roomName});
            console.log("Klient '" + socket.id +"' dołączył do pokoju '" + roomName + "'");

            var peers = [], room = io.sockets.adapter.rooms[roomName];
            if (room) {
                Object.keys(room.sockets).forEach( function(id){ if(id == socket.id) return;
                    peers.push(id);
                });
            }
            socket.emit('hello', peers);
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

            rooms.forEach(function(room) { if(room.client != socket.id) return;
                socket.leave(room.roomName); 
                let n = rooms.indexOf(room); rooms.splice(n, 1);
                console.log("Klient '" + socket.id +"' opuścił pokój '" + room.roomName + "'");   
            }, this);

            console.log("Klient '" + socket.id +"' odłączył się od serwera");
        });
    });
}

module.exports = { serverSocketIO: configureServerSocket };