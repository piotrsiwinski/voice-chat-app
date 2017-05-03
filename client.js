var socket = io.connect('http://localhost:8080');

/***********************************************************************************************************************/
/* DOSTĘP DO MULTIMEDIÓW - UTWORZENIE LOKALNEGO STREAMU I WYŚWIETLENIE GO */

navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  })
  .then(function(stream){ 
    document.getElementById("localVideo").srcObject = stream;
    window.localStream = stream;

    socket.emit('hello');
  })
  .catch(function(e) {
    console.log('getUserMedia() error: ', e);
  });

/***********************************************************************************************************************/
/* 
    OTRZYMANIE IDENTYFIKATORÓW DOŁĄCZONYCH DO SERWERA KLIENTÓW - UTWORZENIE LICZBY GNIAZDEK ODPOWIADAJĄCEJ ICH LICZBIE -
    WYSŁANIE OFERTY POŁĄCZENIA DO KAŻDEGO Z DOWIĄZANYCH DO SERWERA KLIENTÓW KORZYSTAJĄC POJEDYNCZO Z UTWORZONYCH WCZEŚNIEJ NA TEN CEL GNIAZDEK
*/

var sockets = new Array();

socket.on('hello', function(clientsNames){

    if(clientsNames.length > 0)
    clientsNames.forEach( function(clientName, clientIndex, clientArray) {

        let conn = new webkitRTCPeerConnection({"iceServers": [{ "url": "stun:stun.1.google.com:19302" }]}, { 
            optional: [{RtpDataChannels: true}] 
        });

        conn.addStream(window.localStream);

        conn.onaddstream = function (e) {

            let videoElement = document.createElement('video');
                videoElement.setAttribute("id", "video_In_" + clientIndex);
                videoElement.setAttribute("autoplay", "autoplay");
                videoElement.setAttribute("controls", "controls");
                videoElement.setAttribute("width", "240");
                videoElement.setAttribute("height", "240");

            videoElement.srcObject = e.stream;
            document.getElementById("remotes").appendChild(videoElement);
        }

        conn.createOffer({offerToReceiveAudio: 1, offerToReceiveVideo: 1}).then(function (offer) { 
            conn.setLocalDescription(offer);

            sockets.push(conn);
            socket.emit('offer', {oferta: offer, cel: clientName, od: socket.id, index: sockets.indexOf(conn)});
        },
        function (error) {
            alert("Błąd: " + error);
        });
        
    });
});

/***********************************************************************************************************************/

var peers = new Array();

socket.on('offer', function (dane) {

    let peer = new webkitRTCPeerConnection({"iceServers": [{ "url": "stun:stun.1.google.com:19302" }]}, { 
        optional: [{RtpDataChannels: true}] 
    });

    peer.addStream(window.localStream);

    peer.setRemoteDescription(new RTCSessionDescription(dane.oferta));
    peer.createAnswer().then(function (answer) {

        peer.setLocalDescription(answer);

        peer.onaddstream = function (e) {

            let videoElement = document.createElement('video');
                videoElement.setAttribute("id", "video_Out_" + dane.index);
                videoElement.setAttribute("autoplay", "autoplay");
                videoElement.setAttribute("controls", "controls");
                videoElement.setAttribute("width", "240");
                videoElement.setAttribute("height", "240");

            videoElement.srcObject = e.stream;
            document.getElementById("remotes").appendChild(videoElement);
        } 

        peer.onicecandidate = function (event) { 
            if (event.candidate) {
                socket.emit('candidate', {kandydat: event.candidate, cel: dane.od, od: socket.id, index: dane.index});
            }
        };
  
        peers.push(peer);
        socket.emit('answer', {odpowiedz: answer, cel: dane.od, od: socket.id, index: dane.index});		
   }, 
   function (error) { 
      alert("Błąd: " + error);
   });
});

/***********************************************************************************************************************/

socket.on('candidate', function (dane) {
    (sockets[dane.index]).addIceCandidate(new RTCIceCandidate(dane.kandydat));
});

/***********************************************************************************************************************/

socket.on('answer', function(dane){
    (sockets[dane.index]).setRemoteDescription(new RTCSessionDescription(dane.odpowiedz));
});