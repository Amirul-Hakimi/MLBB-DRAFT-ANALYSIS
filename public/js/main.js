// Establish Socket.IO connection
const socket = io();

// DOM Element References
const connectionStatus = document.getElementById('connection-status');

// Screens
const setupScreen = document.getElementById('setup-screen');
const draftScreen = document.getElementById('draft-screen');

// Setup Screen Controls
const btnModeCreate = document.getElementById('btn-mode-create');
const btnModeJoin = document.getElementById('btn-mode-join');
const joinInputGroup = document.getElementById('join-input-group');
const roomIdInput = document.getElementById('room-id-input');
const btnEnterRoom = document.getElementById('btn-enter-room');
const btnLeaveRoom = document.getElementById('btn-leave-room');

// Draft Screen Display Elements
const roomDisplayTag = document.getElementById('room-display-tag');

// App Local State
let currentMode = 'create'; // 'create' or 'join'

// --- SOCKET SYSTEM EVENTS ---
socket.on('connect', () => {
    connectionStatus.innerText = 'Online';
    connectionStatus.classList.remove('disconnected');
    connectionStatus.classList.add('connected');
});

socket.on('disconnect', () => {
    connectionStatus.innerText = 'Offline';
    connectionStatus.classList.remove('connected');
    connectionStatus.classList.add('disconnected');
});


// --- DOM EVENT LISTENERS ---

// Switch to "Create Room" mode
btnModeCreate.addEventListener('click', () => {
    currentMode = 'create';
    btnModeCreate.className = 'btn btn-primary';
    btnModeJoin.className = 'btn btn-secondary';
    joinInputGroup.classList.add('hidden');
});

// Switch to "Join Room" mode
btnModeJoin.addEventListener('click', () => {
    currentMode = 'join';
    btnModeJoin.className = 'btn btn-primary';
    btnModeCreate.className = 'btn btn-secondary';
    joinInputGroup.classList.remove('hidden');
});

// Handle "Enter Draft Room" click
btnEnterRoom.addEventListener('click', () => {
    const selectedSide = document.querySelector('input[name="team-side"]:checked').value;

    if (currentMode === 'join') {
        const roomId = roomIdInput.value.trim().toUpperCase();
        if (!roomId) {
            alert('Please enter a valid Room ID to join.');
            return;
        }
        alert(`Joining Room [${roomId}] as ${selectedSide.toUpperCase()} Team... (Simulated)`);
        enterDraftView(roomId);
    } else {
        // Generate a temporary random 6-character code for display testing
        const generatedRoomId = 'RM' + Math.floor(1000 + Math.random() * 9000);
        alert(`Created New Room [${generatedRoomId}] as ${selectedSide.toUpperCase()} Team!`);
        enterDraftView(generatedRoomId);
    }
});

// Leave Room button
btnLeaveRoom.addEventListener('click', () => {
    draftScreen.classList.remove('active');
    draftScreen.classList.add('hidden');
    
    setupScreen.classList.remove('hidden');
    setupScreen.classList.add('active');
});

// UI Helper Function: Swap screens
function enterDraftView(roomId) {
    roomDisplayTag.innerText = `ROOM: ${roomId}`;

    setupScreen.classList.remove('active');
    setupScreen.classList.add('hidden');

    draftScreen.classList.remove('hidden');
    draftScreen.classList.add('active');
}