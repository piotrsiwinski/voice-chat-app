$(document).ready(onDocumentReady);

function onDocumentReady(){
    $("#start-chat-button").click(startChatButtonOnClick);
}

var socket = null;

function startChatButtonOnClick() {
    configureSocketIO("camera");
    $(this).hide();
}

function streamWindowButtonOnClick(){
    if(socket !== null)
    {
        clearRemotes();
        socket.disconnect(); socket = null;
        configureSocketIO("window");
    }
}

function defaultStream() {
    clearRemotes();
    socket.disconnect(); socket = null;
    configureSocketIO("camera");
}

function clearRemotes() {

    if(window.localStream !== null && window.localStream !== undefined && window.localStream.getAudioTracks().length > 0) window.localStream.getAudioTracks()[0].stop();
    if(window.localStream !== null && window.localStream !== undefined && window.localStream.getVideoTracks().length > 0) window.localStream.getVideoTracks()[0].stop();

    let remoteVideos = document.getElementById("remotes");
    while (remoteVideos.firstChild) {
        remoteVideos.removeChild(remoteVideos.firstChild);
    }

    let messages = document.getElementById("messages");
    while (messages.firstChild) {
        messages.removeChild(messages.firstChild);
    }

    let buttons = document.getElementById("buttons");
    let btnCamera = document.getElementById("btnCamera");

    if(btnCamera !== null) buttons.removeChild(btnCamera);
}

function generateMessage(id, type, text, buttons) {

    let panel = document.createElement('div');
        panel.setAttribute("class", "panel panel-" + type);
        panel.setAttribute("id", id);

    let panelH = document.createElement('div');
        panelH.setAttribute("class", "panel-heading");
        panelH.innerText = "UWAGA";

        panel.appendChild(panelH);

    let panelB = document.createElement('div');
        panelB.setAttribute("class", "panel-body");

    let panelT = document.createElement('p');
        panelT.innerText = text;

        panelB.appendChild(panelT);
        panel.appendChild(panelB);

    let panelF = document.createElement('div');
        panelF.setAttribute("class", "panel-footer");

    buttons.forEach(function(button, index){

        let panelBtn = document.createElement('button');
            panelBtn.setAttribute("type", "button"); 
            panelBtn.setAttribute("class", "btn btn-" + button.type);
            panelBtn.setAttribute("id", "panelBtn-"+ index);
            panelBtn.setAttribute("style", "margin-right: 4px; margin-bottom: 4px;");
            panelBtn.innerHTML = button.text;

            panelBtn.onclick = button.callBack;

        panelF.appendChild(panelBtn);
    });

    panel.appendChild(panelF);

    document.getElementById("messages").appendChild(panel);
}

function configureSocketIO(type) {

    /***********************************************************************************************************************/
    /* DOSTĘP DO MULTIMEDIÓW - UTWORZENIE LOKALNEGO STREAMU I WYŚWIETLENIE GO */

    socket = io.connect('http://localhost:3000');
  
    if(type === "camera") navigator.mediaDevices.getUserMedia({audio: true, video: true}).then(function(stream) {
    
        document.getElementById("localVideo").srcObject = stream;
        window.localStream = stream;

        var url = window.location.href.split("/");
        var roomName = url[url.length-1];

        socket.emit('hello', roomName);

        generateMessage('success', 'success', 'Udostępniasz podgląd ze swojej kamery. Jeśli chcesz pokazać dowolne okno, wciśnij przycisk poniżej i wybierz je.', [
            {type: 'primary', text: 'Podgląd okna', callBack: function(){ $("#success").hide(); streamWindowButtonOnClick(); }}
            ]);

    }).catch(function(err) {
        generateMessage('error', 'danger', 'Błąd dostępu do mediów: ' + err.name, [
            {type: 'danger', text: 'Spróbuj ponownie', callBack: function(){ $("#error").hide(); defaultStream(); }},
            {type: 'primary', text: 'Podgląd okna', callBack: function(){ $("#error").hide(); streamWindowButtonOnClick(); }}
            ]);
    });
    else getScreenId(function (error, sourceId, screen_constraints) {

        if(error === null){

            generateMessage('success', 'success', 'Udostępniasz podgląd wybranego okna. Jeśli chcesz pokazać inne okno, wciśnij [przycisk 1] i wybierz je. Jeśli chcesz powrócić do podglądu z kamery, wciśnij [przycisk 2].', [
            {type: 'primary', text: 'Podgląd innego okna', callBack: function(){ $("#success").hide(); streamWindowButtonOnClick(); }},
            {type: 'success', text: 'Podgląd z kamery', callBack: function(){ $("#success").hide(); defaultStream(); }}
            ]);

            navigator.mediaDevices.getUserMedia(screen_constraints).then(function(stream) {
            
                document.getElementById("localVideo").srcObject = stream;
                window.localStream = stream;

                var url = window.location.href.split("/");
                var roomName = url[url.length-1];

                socket.emit('hello', roomName);

            }).catch(function(err) {
                generateMessage('error', 'danger', 'Błąd przy próbie uzyskania podglądu okna: ' + err.name, [
                    {type: 'danger', text: 'Spróbuj ponownie', callBack: function(){ $("#error").hide(); streamWindowButtonOnClick(); }},
                    {type: 'primary', text: 'Podgląd z kamery', callBack: function(){ $("#error").hide(); defaultStream(); }}
                ]);
            });
        }
        else {
            // error  ==  'permission-denied' || 'not-installed' || 'installed-disabled' || 'not-chrome'
            if(error == 'not-installed') {
                generateMessage('warning', 'warning', 'Nie posiadasz rozszerzenia dla chrome, które umożliwia udostępnianie podglądu wybranego okna. Możesz powrócić do podglądu z kamery, wciskając [przycisk 1] lub zainstalować rozszerzenie, wciskając [przycisk 2]', [
                    {type: 'primary', text: 'Podgląd z kamery', callBack: function(){ $("#warning").hide(); defaultStream(); }},
                    {type: 'success', text: 'Przejdź do strony z rozszerzeniem', callBack: function(){ $("#warning").hide(); window.location.href = "https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk";}}
                ]);
            }
        }
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

