// Establish Socket Connection
const socket = io();

// DOM References
const connectionStatus = document.getElementById('connection-status');
const setupScreen = document.getElementById('setup-screen');
const draftScreen = document.getElementById('draft-screen');

const btnModeCreate = document.getElementById('btn-mode-create');
const btnModeJoin = document.getElementById('btn-mode-join');
const joinInputGroup = document.getElementById('join-input-group');
const roomIdInput = document.getElementById('room-id-input');
const btnEnterRoom = document.getElementById('btn-enter-room');
const btnLeaveRoom = document.getElementById('btn-leave-room');

const roomDisplayTag = document.getElementById('room-display-tag');
const turnBannerText = document.getElementById('turn-banner-text');
const phaseBannerText = document.getElementById('phase-banner-text');

let currentMode = 'create'; // 'create' or 'join'
window.myAssignedTeam = null;
window.currentRoomId = null;

// --- SOCKET CONNECTION BADGES ---
socket.on('connect', () => {
    connectionStatus.innerText = 'Online';
    connectionStatus.className = 'status-badge connected';
});

socket.on('disconnect', () => {
    connectionStatus.innerText = 'Offline';
    connectionStatus.className = 'status-badge disconnected';
});

// --- LOBBY UI LISTENERS ---
btnModeCreate.addEventListener('click', () => {
    currentMode = 'create';
    btnModeCreate.className = 'btn btn-primary';
    btnModeJoin.className = 'btn btn-secondary';
    joinInputGroup.classList.add('hidden');
});

btnModeJoin.addEventListener('click', () => {
    currentMode = 'join';
    btnModeJoin.className = 'btn btn-primary';
    btnModeCreate.className = 'btn btn-secondary';
    joinInputGroup.classList.remove('hidden');
});

btnEnterRoom.addEventListener('click', () => {
    if (currentMode === 'create') {
        socket.emit('create_room');
    } else {
        const inputCode = roomIdInput.value.trim().toUpperCase();
        if (!inputCode) {
            alert('Please enter a 6-character Room ID.');
            return;
        }
        socket.emit('join_room', inputCode);
    }
});

btnLeaveRoom.addEventListener('click', () => {
    socket.emit('leave_room');
    showSetupScreen();
});

// --- SERVER ROOM RESPONSE EVENTS ---

// Event 1: Room Successfully Created (You are Team A)
socket.on('room_created', (data) => {
    window.currentRoomId = data.roomId;
    window.myAssignedTeam = data.yourTeam;

    showDraftScreen(data.roomId, `You are Team ${data.yourTeam} (Host)`);
    turnBannerText.innerText = 'Waiting for Opponent...';
    phaseBannerText.innerText = `Share Room Code: ${data.roomId}`;
});

// Event 2: Room Successfully Joined (You are Team B)
socket.on('room_joined', (data) => {
    window.currentRoomId = data.roomId;
    window.myAssignedTeam = data.yourTeam;

    showDraftScreen(data.roomId, `You are Team ${data.yourTeam}`);
});

// Event 3: Both Players Present
socket.on('room_status_update', (data) => {
    turnBannerText.innerText = 'Lobby Full - Both Players Connected!';
    phaseBannerText.innerText = `You: Team ${window.myAssignedTeam}`;
});

// Event 4: Opponent Left
socket.on('player_left', (data) => {
    alert(data.message);
    turnBannerText.innerText = 'Waiting for Opponent...';
    phaseBannerText.innerText = 'Opponent disconnected.';
});

// Event 5: Errors (e.g. Room Full, Not Found)
socket.on('room_error', (data) => {
    alert(`Error: ${data.message}`);
});

// Helper Functions
function showDraftScreen(roomId, roleSubtitle) {
    roomDisplayTag.innerText = `ROOM: ${roomId}`;
    setupScreen.classList.add('hidden');
    setupScreen.classList.remove('active');
    draftScreen.classList.remove('hidden');
    draftScreen.classList.add('active');
}

function showSetupScreen() {
    draftScreen.classList.add('hidden');
    draftScreen.classList.remove('active');
    setupScreen.classList.remove('hidden');
    setupScreen.classList.add('active');
    window.currentRoomId = null;
    window.myAssignedTeam = null;
}