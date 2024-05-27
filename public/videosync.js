
const video = document.getElementById('videoPlayer');
// Join room
const urlParams = new URLSearchParams(window.location.search);
const room = urlParams.get('roomCode') || "defaultRoomCode";
const isHost = urlParams.get("isHost");
const serverAddress = urlParams.get("serverAddress");
console.log(room)
// document.getElementById("socketScript").src = `${serverAddress}/socket.io/socket.io.js`
// io = require(`${serverAddress}/socket.io/socket.io.js`)
const socket = io.connect(serverAddress);
document.getElementById('roomCode').textContent = room;

socket.emit('joinRoom', room);

if (isHost) {
    fetch('http://localhost:3000/magnet')
        .then(response => response.text())
        .then(magnetLink => {
            socket.emit('submitMagnetLink', { room, magnetLink });
        })
        .catch(error => {
            console.error('Error fetching magnet link:', error);
        });
}

let serverEvent = false;
let seekingLocally = false;
let seekTimer;

// Listen for play event
video.addEventListener('play', () => {
    if (!serverEvent) {
        socket.emit('play', { room });
    }
});

// Listen for pause event
video.addEventListener('pause', () => {
    if (!serverEvent) {
        socket.emit('pause', { room });
    }
});

// Listen for seeking events
video.addEventListener('seeking', () => {
    // Clear any existing seekTimer
    if (seekingLocally) return;
    clearTimeout(seekTimer);

    // Set seekingLocally flag to true
    seekingLocally = true;
    socket.emit('seek', { room, time: video.currentTime });
    seekTimer = setTimeout(() => {
        seekingLocally = false;
    }, 500); // Adjust the delay as needed

});


// Socket.io events
socket.on('seek', time => {
    if (!serverEvent && !seekingLocally) {
        serverEvent = true;
        video.currentTime = time;
        serverEvent = false;
    }
});

socket.on('play', () => {
    if (!serverEvent && video.paused) {
        serverEvent = true;
        video.play();
        serverEvent = false;
    }
});

socket.on('pause', () => {
    if (!serverEvent && !video.paused) {
        serverEvent = true;
        video.pause();
        serverEvent = false;
    }
});
