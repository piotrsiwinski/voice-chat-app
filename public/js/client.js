$(document).ready(onDocumentReady);
function onDocumentReady(){
    $("#start-chat-button").click(startChatOnClick);
}

function startChatOnClick() {
    var socket = io.connect('http://localhost:3000');

    /***********************************************************************************************************************/
    /* DOSTĘP DO MULTIMEDIÓW - UTWORZENIE LOKALNEGO STREAMU I WYŚWIETLENIE GO */

    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    })
        .then(function (stream) {
            document.getElementById("localVideo").srcObject = stream;
            window.localStream = stream;

            socket.emit('hello', 'Test'); // <-- 'Test' - nazwa pokoju
        })
        .catch(function (e) {
            console.log('getUserMedia() error: ', e);
        });

    /***********************************************************************************************************************/
    /*
     OTRZYMANIE IDENTYFIKATORÓW DOŁĄCZONYCH DO SERWERA KLIENTÓW - UTWORZENIE LICZBY PEERÓW ODPOWIADAJĄCEJ ICH ILOŚCI -
     WYSŁANIE OFERTY POŁĄCZENIA DO KAŻDEGO Z DOWIĄZANYCH DO SERWERA KLIENTÓW KORZYSTAJĄC POJEDYNCZO Z UTWORZONYCH WCZEŚNIEJ NA TEN CEL PEERÓW
     */

    var peers = new Array();

    socket.on('hello', function (clientsNames) {

        clientsNames.forEach(function (client) {

            let conn = new webkitRTCPeerConnection({"iceServers": [{"url": "stun:stun.1.google.com:19302"}]}, {
                optional: [{RtpDataChannels: true}]
            });

            conn.addStream(window.localStream);

            conn.createOffer({offerToReceiveAudio: 1, offerToReceiveVideo: 1}).then(function (offer) {
                    conn.setLocalDescription(offer);

                    peers.push(conn);
                    let n = peers.indexOf(conn);

                    peers[n].onaddstream = function (e) {

                        let videoElement = document.createElement('video');
                        videoElement.setAttribute("class", "remoteVideo");
                        videoElement.setAttribute("id", "video_Socket_" + n);
                        videoElement.setAttribute("autoplay", "autoplay");
                        videoElement.setAttribute("controls", "controls");
                        videoElement.setAttribute("width", "240");
                        videoElement.setAttribute("height", "240");

                        videoElement.srcObject = e.stream;
                        document.getElementById("remotes").appendChild(videoElement);
                    }

                    socket.emit('offer', {oferta: offer, cel: client, od: socket.id, index: n});
                },
                function (error) {
                    alert("Błąd: " + error);
                });

        }, this);
    });

    /***********************************************************************************************************************/
    /*
     OTRZYMANIE NADESŁANEJ PRZEZ INNEGO KLIENTA OFERTY - DLA OTRZYMANEJ OFERTY TWORZONY JEST NOWY PEER DO KTÓREGO DOWIĄZYWANY JEST LOKALNY STREAM
     WYGENEROWANIE ODPOWIEDZI DLA KLIENTA KTÓRY WYSŁAŁ DO NAS OFERTĘ I WYSŁANIE JEJ DO TEGO KLIENTA WSKAZUJĄC KONKRETNY PEER PRZECHOWYWANY PRZEZ TEGO KLIENTA
     */
    socket.on('offer', function (dane) {

        let conn = new webkitRTCPeerConnection({"iceServers": [{"url": "stun:stun.1.google.com:19302"}]}, {
            optional: [{RtpDataChannels: true}]
        });

        conn.addStream(window.localStream);

        conn.setRemoteDescription(new RTCSessionDescription(dane.oferta));
        conn.createAnswer().then(function (answer) {

                conn.setLocalDescription(answer);

                conn.onicecandidate = function (event) {
                    if (event.candidate) {
                        socket.emit('candidate', {
                            kandydat: event.candidate,
                            cel: dane.od,
                            od: socket.id,
                            index: dane.index
                        });
                    }
                };

                peers.push(conn);
                let n = peers.indexOf(conn);

                peers[n].onaddstream = function (e) {

                    let videoElement = document.createElement('video');
                    videoElement.setAttribute("class", "remoteVideo");
                    videoElement.setAttribute("id", "video_Socket_" + n);
                    videoElement.setAttribute("autoplay", "autoplay");
                    videoElement.setAttribute("controls", "controls");
                    videoElement.setAttribute("width", "240");
                    videoElement.setAttribute("height", "240");

                    videoElement.srcObject = e.stream;
                    document.getElementById("remotes").appendChild(videoElement);
                }

                socket.emit('answer', {odpowiedz: answer, cel: dane.od, od: socket.id, index: dane.index, indexZewn: n});
            },
            function (error) {
                alert("Błąd: " + error);
            });
    });

    /***********************************************************************************************************************/
    /* OTRZYMANO DANE KONFIGURACYJNE OD KLIENTA Z KTÓRYM NAWIĄZANO POŁĄCZENIE */

    socket.on('candidate', function (dane) {
        (peers[dane.index]).addIceCandidate(new RTCIceCandidate(dane.kandydat));
    });

    /***********************************************************************************************************************/
    /* OTRZYMANO ODPOWIEDŹ OD KLIENTA DO KTÓREGO WCZEŚNIEJ WYSŁANA ZOSTAŁA OFERTA */

    socket.on('answer', function (dane) {
        (peers[dane.index]).setRemoteDescription(new RTCSessionDescription(dane.odpowiedz));
    });

    /***********************************************************************************************************************/
    /* OTRZYMANO INFORMACJĘ Z SERWERA KTÓRY PEER NALEŻY WYŁĄCZYĆ A PODGLĄD STREAMA UKRYĆ PONIEWAŻ KLIENT TEN SIĘ ROZŁĄCZYŁ Z SERWEREM */

    socket.on('disconn', function (n) {

        peers[n].close();
        peers[n] = null;

        let remoteVideos = document.getElementById("remotes");
        let videoElement = document.getElementById("video_Socket_" + n);

        remoteVideos.removeChild(videoElement);
    });

    /***********************************************************************************************************************/
    /* PROŚBA O POTWIERDZENIE CHĘCI WYJŚCIA BĄDŹ PRZEŁADOWANIA STRONY */

    window.onbeforeunload = function (event) {
        return 'Zamknięcie konwersacji';
    }
}

