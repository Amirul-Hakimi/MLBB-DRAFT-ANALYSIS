// =========================================================================
// MAIN CLIENT INTERACTIVITY & UI RENDERER
// =========================================================================

// 1. Establish Socket.IO Connection
const socket = io();

// 2. DOM References - Connection Status Badge
const connectionStatus = document.getElementById('connection-status');

// 3. DOM References - Screens
const setupScreen = document.getElementById('setup-screen');
const draftScreen = document.getElementById('draft-screen');

// 4. DOM References - Setup Controls
const btnModeCreate = document.getElementById('btn-mode-create');
const btnModeJoin = document.getElementById('btn-mode-join');
const joinInputGroup = document.getElementById('join-input-group');
const roomIdInput = document.getElementById('room-id-input');
const btnEnterRoom = document.getElementById('btn-enter-room');
const btnLeaveRoom = document.getElementById('btn-leave-room');

// 5. DOM References - Draft Screen Controls & Containers
const heroGrid = document.getElementById('hero-grid');
const heroSearch = document.getElementById('hero-search');
const laneButtons = document.querySelectorAll('.lane-btn');
const turnBannerText = document.getElementById('turn-banner-text');
const phaseBannerText = document.getElementById('phase-banner-text');
const teamABox = document.getElementById('team-a-box');
const teamBBox = document.getElementById('team-b-box');
const blueBans = document.getElementById('blue-bans');
const redBans = document.getElementById('red-bans');
const bluePicks = document.getElementById('blue-picks');
const redPicks = document.getElementById('red-picks');

// 6. Local State Variables
let currentMode = 'create'; // 'create' or 'join'
let currentSearchQuery = '';
let currentLaneFilter = 'ALL';


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


// --- LOBBY NAVIGATION LISTENERS ---

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

// Enter Draft Room button
btnEnterRoom.addEventListener('click', () => {
    const selectedSide = document.querySelector('input[name="team-side"]:checked').value;

    if (currentMode === 'join') {
        const roomId = roomIdInput.value.trim().toUpperCase();
        if (!roomId) {
            alert('Please enter a valid Room ID to join.');
            return;
        }
        enterDraftView(roomId);
    } else {
        const generatedRoomId = 'RM' + Math.floor(1000 + Math.random() * 9000);
        enterDraftView(generatedRoomId);
    }
});

// Leave / Reset Room button
btnLeaveRoom.addEventListener('click', () => {
    draftScreen.classList.remove('active');
    draftScreen.classList.add('hidden');
    
    setupScreen.classList.remove('hidden');
    setupScreen.classList.add('active');
});


// --- DRAFT GRID & BANNER RENDER LOGIC ---

// Render the Hero Grid based on search query, active lane filter, and draft status
function renderHeroGrid() {
    heroGrid.innerHTML = ''; // Clear existing cards

    // Filter dataset by search input and active lane tab
    const filteredHeroes = HERO_DATASET.filter(hero => {
        const matchesName = hero.name.toLowerCase().includes(currentSearchQuery.toLowerCase());
        const matchesLane = (currentLaneFilter === 'ALL') || hero.lanes.includes(currentLaneFilter);
        return matchesName && matchesLane;
    });

    // Create a visual card for each matching hero
    filteredHeroes.forEach(hero => {
        const card = document.createElement('div');
        card.className = 'hero-card';

        // Check availability from the draft engine
        const unavailable = isHeroUnavailable(hero.id);
        if (unavailable || draftState.isComplete) {
            card.classList.add('disabled');
        }

        // Render lane badges
        const tagsHtml = hero.lanes.map(l => `<span class="tag">${l}</span>`).join('');

        card.innerHTML = `
            <div class="hero-name">${hero.name}</div>
            <div class="lane-tags">${tagsHtml}</div>
        `;

        // Click Handler: Execute turn action in engine
        card.addEventListener('click', () => {
            if (unavailable || draftState.isComplete) return; 
            
            const result = executeAction(hero.id);
            if (result.success) {
                updateUI(); // Re-render whole UI upon successful move
            } else {
                alert(result.message);
            }
        });

        heroGrid.appendChild(card);
    });
}

// Update Turn Banner, Active Highlight, Banned, and Picked lists
// Update Banner, Team Panels, and Highlight Active Turn
function updateTurnStatusUI() {
    // 1. ALWAYS render the updated ban and pick lists first!
    blueBans.innerText = 'Bans: ' + draftState.bans.A.map(h => h.name).join(', ');
    redBans.innerText = 'Bans: ' + draftState.bans.B.map(h => h.name).join(', ');

    bluePicks.innerHTML = draftState.picks.A.map(h => `<li>${h.name}</li>`).join('');
    redPicks.innerHTML = draftState.picks.B.map(h => `<li>${h.name}</li>`).join('');

    // 2. Check if draft is finished
    if (draftState.isComplete) {
        turnBannerText.innerText = 'DRAFT COMPLETE!';
        phaseBannerText.innerText = 'All 20 actions performed.';
        teamABox.classList.remove('active-turn');
        teamBBox.classList.remove('active-turn');
        return;
    }

    // 3. Render active turn information
    const turn = getCurrentTurn();
    const actionUpper = turn.action.toUpperCase();
    
    turnBannerText.innerText = `Turn ${turn.turn}: Team ${turn.team} ${actionUpper}`;
    phaseBannerText.innerText = turn.phase;

    // Highlight active team box
    if (turn.team === 'A') {
        teamABox.classList.add('active-turn');
        teamBBox.classList.remove('active-turn');
    } else {
        teamBBox.classList.add('active-turn');
        teamABox.classList.remove('active-turn');
    }
}

// Master UI Update Function
function updateUI() {
    renderHeroGrid();
    updateTurnStatusUI();
}


// --- FILTER & SEARCH EVENT LISTENERS ---

heroSearch.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    renderHeroGrid();
});

laneButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        laneButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLaneFilter = btn.dataset.lane;
        renderHeroGrid();
    });
});


// --- SCREEN SWITCHING FUNCTION ---

function enterDraftView(roomId) {
    document.getElementById('room-display-tag').innerText = `ROOM: ${roomId}`;
    setupScreen.classList.remove('active');
    setupScreen.classList.add('hidden');
    
    draftScreen.classList.remove('hidden');
    draftScreen.classList.add('active');
    
    resetDraft();
    updateUI();
}