// Establish Socket.IO Connection
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

const heroGrid = document.getElementById('hero-grid');
const heroSearch = document.getElementById('hero-search');
const laneButtons = document.querySelectorAll('.lane-btn');

const roomDisplayTag = document.getElementById('room-display-tag');
const turnBannerText = document.getElementById('turn-banner-text');
const phaseBannerText = document.getElementById('phase-banner-text');
const teamABox = document.getElementById('team-a-box');
const teamBBox = document.getElementById('team-b-box');
const blueBans = document.getElementById('blue-bans');
const redBans = document.getElementById('red-bans');
const bluePicks = document.getElementById('blue-picks');
const redPicks = document.getElementById('red-picks');
const timelineStrip = document.getElementById('timeline-strip');
const draftLogList = document.getElementById('draft-log-list');

// Global App State
let currentMode = 'create';
let currentSearchQuery = '';
let currentLaneFilter = 'ALL';
window.myAssignedTeam = null;
window.currentRoomId = null;

// Socket Status Events
socket.on('connect', () => {
    connectionStatus.innerText = 'Online';
    connectionStatus.className = 'status-badge connected';
});

socket.on('disconnect', () => {
    connectionStatus.innerText = 'Offline';
    connectionStatus.className = 'status-badge disconnected';
});

// AUTHORITATIVE STATE RECEIVER
socket.on('draft_updated', ({ draftState: serverState }) => {
    draftState = serverState;
    updateUI();
});

socket.on('draft_error', (data) => {
    alert(`Action Error: ${data.message}`);
});

socket.on('room_error', (data) => {
    alert(`Room Error: ${data.message}`);
});

socket.on('player_left', (data) => {
    alert(data.message);
});

// Lobby Navigation Events
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
            alert('Please enter a valid 6-character Room ID.');
            return;
        }
        socket.emit('join_room', inputCode);
    }
});

btnLeaveRoom.addEventListener('click', () => {
    location.reload();
});

socket.on('room_created', (data) => {
    window.currentRoomId = data.roomId;
    window.myAssignedTeam = data.yourTeam;
    draftState = data.draftState;

    showDraftScreen(data.roomId);
    turnBannerText.innerText = 'Waiting for Opponent...';
    phaseBannerText.innerText = `Share Code: ${data.roomId} (You: Team A)`;
});

socket.on('room_joined', (data) => {
    window.currentRoomId = data.roomId;
    window.myAssignedTeam = data.yourTeam;
    draftState = data.draftState;

    showDraftScreen(data.roomId);
});

// Timeline Strip Renderer
function renderTimeline() {
    timelineStrip.innerHTML = '';

    DRAFT_SEQUENCE.forEach((step, index) => {
        const item = document.createElement('div');
        item.className = `timeline-step team-${step.team}`;

        if (index < draftState.currentTurnIndex) {
            item.classList.add('completed');
        } else if (index === draftState.currentTurnIndex && !draftState.isComplete) {
            item.classList.add('active');
        }

        const actionLetter = step.action === 'ban' ? 'B' : 'P';
        item.innerText = `${step.turn}:${actionLetter}`;
        timelineStrip.appendChild(item);
    });
}

// Action Log Renderer
function renderDraftLog() {
    draftLogList.innerHTML = '';
    
    draftState.draftLog.forEach(log => {
        const li = document.createElement('li');
        li.className = `team-${log.team}`;
        li.innerText = `[Turn ${log.turn}] Team ${log.team} ${log.action.toUpperCase()}ED ${log.hero}`;
        draftLogList.appendChild(li);
    });

    draftLogList.scrollTop = draftLogList.scrollHeight;
}

// Recommendation Chips Renderer
function renderRecommendations() {
    const recContainer = document.getElementById('rec-chips-container');
    const recTitleText = document.getElementById('rec-title-text');
    const recPanel = document.getElementById('recommendation-panel');
    
    if (!recContainer || !recPanel) return;
    recContainer.innerHTML = '';

    const recData = getRecommendations();

    if (recData.type === 'complete') {
        recPanel.style.display = 'none';
        return;
    }

    recPanel.style.display = 'block';

    if (recData.type === 'ban') {
        recTitleText.innerText = 'High Priority Deny / Ban Suggestions:';
    } else {
        const laneStr = recData.neededLanes.length > 0 ? recData.neededLanes.join(', ') : 'Flex';
        recTitleText.innerText = `Suggested Picks (Needs: ${laneStr}):`;
    }

    recData.list.forEach(hero => {
        const chip = document.createElement('button');
        chip.className = 'rec-chip';
        chip.innerHTML = `<span>${hero.name}</span> <span class="chip-role">(${hero.lanes.join('/')})</span>`;
        
        chip.addEventListener('click', () => {
            socket.emit('select_hero', { heroId: hero.id });
        });

        recContainer.appendChild(chip);
    });
}

// Hero Grid Renderer
function renderHeroGrid() {
    heroGrid.innerHTML = '';

    const recData = getRecommendations();
    const recommendedIds = recData.list.map(h => h.id);

    const filteredHeroes = HERO_DATASET.filter(hero => {
        const matchesName = hero.name.toLowerCase().includes(currentSearchQuery.toLowerCase());
        const matchesLane = (currentLaneFilter === 'ALL') || hero.lanes.includes(currentLaneFilter);
        return matchesName && matchesLane;
    });

    filteredHeroes.forEach(hero => {
        const card = document.createElement('div');
        card.className = 'hero-card';

        const unavailable = isHeroUnavailable(hero.id);
        const isRecommended = recommendedIds.includes(hero.id) && !unavailable && !draftState.isComplete;

        if (unavailable || draftState.isComplete) {
            card.classList.add('disabled');
        } else if (isRecommended) {
            card.classList.add('recommended');
        }

        const tagsHtml = hero.lanes.map(l => `<span class="tag">${l}</span>`).join('');
        const badgeHtml = isRecommended ? `<span class="rec-badge">⭐ REC</span>` : '';

        card.innerHTML = `
            ${badgeHtml}
            <div class="hero-name">${hero.name}</div>
            <div class="lane-tags">${tagsHtml}</div>
        `;

        card.addEventListener('click', () => {
            socket.emit('select_hero', { heroId: hero.id });
        });

        heroGrid.appendChild(card);
    });
}

// Turn Status & Team Panels Renderer
function updateTurnStatusUI() {
    blueBans.innerText = 'Bans: ' + (draftState.bans.A.map(h => h.name).join(', ') || 'None');
    redBans.innerText = 'Bans: ' + (draftState.bans.B.map(h => h.name).join(', ') || 'None');

    bluePicks.innerHTML = draftState.picks.A.map(h => `<li>${h.name}</li>`).join('');
    redPicks.innerHTML = draftState.picks.B.map(h => `<li>${h.name}</li>`).join('');

    if (draftState.isComplete) {
        turnBannerText.innerText = 'DRAFT COMPLETE!';
        phaseBannerText.innerText = 'All 20 actions performed.';
        teamABox.classList.remove('active-turn');
        teamBBox.classList.remove('active-turn');
        return;
    }

    const turn = getCurrentTurn();
    const actionUpper = turn.action.toUpperCase();
    
    turnBannerText.innerText = `Turn ${turn.turn}: Team ${turn.team} ${actionUpper} (You: Team ${window.myAssignedTeam})`;
    phaseBannerText.innerText = turn.phase;

    if (turn.team === 'A') {
        teamABox.classList.add('active-turn');
        teamBBox.classList.remove('active-turn');
    } else {
        teamBBox.classList.add('active-turn');
        teamABox.classList.remove('active-turn');
    }
}

// Master UI Redraw Trigger
function updateUI() {
    renderTimeline();
    renderRecommendations();
    renderHeroGrid();
    renderDraftLog();
    updateTurnStatusUI();
}

// Search & Filter Listeners
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

function showDraftScreen(roomId) {
    roomDisplayTag.innerText = `ROOM: ${roomId}`;
    setupScreen.classList.add('hidden');
    setupScreen.classList.remove('active');
    draftScreen.classList.remove('hidden');
    draftScreen.classList.add('active');
    updateUI();
}