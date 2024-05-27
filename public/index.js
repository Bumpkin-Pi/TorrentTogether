let isHost = false;
const title = document.getElementById('title');
const serverAddressStep = document.getElementById('serverAddressStep');
const hostJoinStep = document.getElementById('hostJoinStep');
const roomCodeStep = document.getElementById('roomCodeStep');
const magnetLinkStep = document.getElementById('magnetLinkStep');

const serverAddressInput = document.getElementById('serverAddress');
const roomCodeInput = document.getElementById('roomCode');
const magnetLinkInput = document.getElementById('magnetLink');

const submitServerAddressBtn = document.getElementById('submitServerAddress');
const hostRoomBtn = document.getElementById('hostRoom');
const joinRoomBtn = document.getElementById('joinRoom');
const submitRoomCodeBtn = document.getElementById('submitRoomCode');
const submitMagnetLinkBtn = document.getElementById('submitMagnetLink');

let serverAddress = '';
let roomCode = '';

submitServerAddressBtn.addEventListener('click', () => {
    serverAddress = serverAddressInput.value;
    if (serverAddress) {
        title.innerText = 'Host or Join a Room';
        serverAddressStep.classList.add('hidden');
        hostJoinStep.classList.remove('hidden');
    }
});

hostRoomBtn.addEventListener('click', () => {
    isHost = true;
    roomCode = generateRoomCode();
    title.innerText = 'Enter Magnet Link';
    hostJoinStep.classList.add('hidden');
    magnetLinkStep.classList.remove('hidden');
});

joinRoomBtn.addEventListener('click', () => {
    title.innerText = 'Enter Room Code';
    hostJoinStep.classList.add('hidden');
    roomCodeStep.classList.remove('hidden');
});

submitRoomCodeBtn.addEventListener('click', () => {
    roomCode = roomCodeInput.value;
    if (roomCode) {
        fetch(`${serverAddress}/magnet/${roomCode}`)
            .then(response => response.text())
            .then(magnetLink => {
                submitMagnetLink(magnetLink);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while fetching the magnet link.');
            });
    }
});


submitMagnetLinkBtn.addEventListener("click", function(event){
    const magnetLink = magnetLinkInput.value;
    if(magnetLink){
        submitMagnetLink(magnetLink)
    }
})

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < 15; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function submitMagnetLink(magnetLink) {
    fetch('http://localhost:3000/submit-magnet', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ magnet: magnetLink })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const destination = isHost ? "0" : "1";
                const queryParams = new URLSearchParams({
                    serverAddress: serverAddress,
                    roomCode: roomCode,
                    isHost: destination
                });
                window.location.href = `video.html?${queryParams}`;
            } else {
                alert('Failed to submit magnet link.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred.');
        });
}