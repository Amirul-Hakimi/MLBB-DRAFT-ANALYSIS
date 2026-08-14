// =========================================================================
// MAIN CLIENT INTERACTIVITY, REAL-TIME SYNC, SIMULATION & EVALUATION
// =========================================================================

const socket = io();

function getOrCreatePlayerToken() {
    let token = sessionStorage.getItem('mlbb_player_token');
    if (!token) {
        token = 'PLR-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        sessionStorage.setItem('mlbb_player_token', token);
    }
    return token;
}

const myPlayerToken = getOrCreatePlayerToken();

// Core Screen References
const connectionStatus = document.getElementById('connection-status');
const setupScreen = document.getElementById('setup-screen');
const draftScreen = document.getElementById('draft-screen');

// Setup Controls
const btnModeAi = document.getElementById('btn-mode-ai');
const btnModeSim = document.getElementById('btn-mode-sim');
const btnModeCreate = document.getElementById('btn-mode-create');
const btnModeJoin = document.getElementById('btn-mode-join');
const joinInputGroup = document.getElementById('join-input-group');
const roomIdInput = document.getElementById('room-id-input');
const btnEnterRoom = document.getElementById('btn-enter-room');
const btnLeaveRoom = document.getElementById('btn-leave-room');

// Sim Toolbar Controls
const simControlBar = document.getElementById('sim-control-bar');
const btnSimStep = document.getElementById('btn-sim-step');
const btnSimAuto = document.getElementById('btn-sim-auto');
const btnSimPause = document.getElementById('btn-sim-pause');
const btnSimReset = document.getElementById('btn-sim-reset');

// Draft Board Controls
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

// Evaluation Modal Controls
const postDraftModal = document.getElementById('post-draft-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const scoreTeamA = document.getElementById('score-team-a');
const scoreTeamB = document.getElementById('score-team-b');
const breakdownTeamA = document.getElementById('breakdown-team-a');
const breakdownTeamB = document.getElementById('breakdown-team-b');
const compPicksA = document.getElementById('comp-picks-a');
const compPicksB = document.getElementById('comp-picks-b');
const compBansA = document.getElementById('comp-bans-a');
const compBansB = document.getElementById('comp-bans-b');
const compLanesA = document.getElementById('comp-lanes-a');
const compLanesB = document.getElementById('comp-lanes-b');

// App Global States
let currentMode = 'vs_ai'; // 'vs_ai', 'auto_sim', 'create', 'join'
let currentSearchQuery = '';
let currentLaneFilter = 'ALL';
window.myAssignedTeam = null;
window.currentRoomId = null;
window.currentRoomMode = null;

// =========================================================================
// SOCKET CONNECTION & DRAFT UPDATES
// =========================================================================

socket.on('connect', () => {
    connectionStatus.innerText = 'Online';
    connectionStatus.className = 'status-badge connected';
});

socket.on('disconnect', () => {
    connectionStatus.innerText = 'Offline';
    connectionStatus.className = 'status-badge disconnected';
});

socket.on('draft_updated', ({ draftState: serverState }) => {
    draftState = serverState;
    updateUI();
});

socket.on('draft_error', (data) => alert(`Action Error: ${data.message}`));
socket.on('room_error', (data) => {
    alert(`Room Error: ${data.message}`);
    showSetupScreen();
});

// =========================================================================
// LOBBY MODE SWITCHING & CREATION
// =========================================================================

function resetModeButtons() {
    [btnModeAi, btnModeSim, btnModeCreate, btnModeJoin].forEach(b => {
        if (b) b.className = 'btn btn-secondary';
    });
    joinInputGroup.classList.add('hidden');
}

btnModeAi.addEventListener('click', () => {
    resetModeButtons();
    currentMode = 'vs_ai';
    btnModeAi.className = 'btn btn-primary';
});

btnModeSim.addEventListener('click', () => {
    resetModeButtons();
    currentMode = 'auto_sim';
    btnModeSim.className = 'btn btn-primary';
});

btnModeCreate.addEventListener('click', () => {
    resetModeButtons();
    currentMode = 'create';
    btnModeCreate.className = 'btn btn-primary';
});

btnModeJoin.addEventListener('click', () => {
    resetModeButtons();
    currentMode = 'join';
    btnModeJoin.className = 'btn btn-primary';
    joinInputGroup.classList.remove('hidden');
});

btnEnterRoom.addEventListener('click', () => {
    if (currentMode === 'vs_ai' || currentMode === 'auto_sim') {
        socket.emit('create_room', { playerToken: myPlayerToken, mode: currentMode });
    } else if (currentMode === 'create') {
        socket.emit('create_room', { playerToken: myPlayerToken, mode: 'pvp' });
    } else {
        const inputCode = roomIdInput.value.trim().toUpperCase();
        if (!inputCode) {
            alert('Please enter a valid 6-character Room ID.');
            return;
        }
        socket.emit('join_room', { targetRoomId: inputCode, playerToken: myPlayerToken });
    }
});

btnLeaveRoom.addEventListener('click', () => {
    sessionStorage.removeItem('mlbb_active_room');
    location.reload();
});

socket.on('room_created', (data) => {
    window.currentRoomId = data.roomId;
    window.myAssignedTeam = data.yourTeam;
    window.currentRoomMode = data.mode;
    draftState = data.draftState;

    showDraftScreen(data.roomId, data.mode);
});

socket.on('room_joined', (data) => {
    window.currentRoomId = data.roomId;
    window.myAssignedTeam = data.yourTeam;
    window.currentRoomMode = data.mode;
    draftState = data.draftState;

    showDraftScreen(data.roomId, data.mode);
});

// =========================================================================
// AUTO-SIM TOOLBAR EVENT LISTENERS
// =========================================================================

btnSimStep.addEventListener('click', () => socket.emit('sim_step'));
btnSimAuto.addEventListener('click', () => socket.emit('sim_start_auto'));
btnSimPause.addEventListener('click', () => socket.emit('sim_pause_auto'));
btnSimReset.addEventListener('click', () => socket.emit('sim_reset'));

// =========================================================================
// RENDERERS
// =========================================================================

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

function renderRecommendations() {
    const recContainer = document.getElementById('rec-chips-container');
    const recTitleText = document.getElementById('rec-title-text');
    const recPanel = document.getElementById('recommendation-panel');
    if (!recContainer || !recPanel) return;

    if (window.currentRoomMode === 'auto_sim') {
        recPanel.style.display = 'none';
        return;
    }

    const recData = getRecommendations();
    if (recData.type === 'complete') {
        recPanel.style.display = 'none';
        return;
    }

    recPanel.style.display = 'block';
    recContainer.innerHTML = '';

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
        chip.addEventListener('click', () => socket.emit('select_hero', { heroId: hero.id }));
        recContainer.appendChild(chip);
    });
}

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
        const isSimMode = window.currentRoomMode === 'auto_sim';
        const isRecommended = recommendedIds.includes(hero.id) && !unavailable && !draftState.isComplete && !isSimMode;

        if (unavailable || draftState.isComplete || isSimMode) {
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

        if (!isSimMode) {
            card.addEventListener('click', () => socket.emit('select_hero', { heroId: hero.id }));
        }

        heroGrid.appendChild(card);
    });
}

function showPostDraftAnalysis() {
    const resultA = evaluateTeamDraft(draftState.picks.A);
    const resultB = evaluateTeamDraft(draftState.picks.B);

    scoreTeamA.innerText = resultA.score;
    scoreTeamB.innerText = resultB.score;

    breakdownTeamA.innerHTML = resultA.breakdown.map(item => `<li class="${item.type}">${item.text}</li>`).join('');
    breakdownTeamB.innerHTML = resultB.breakdown.map(item => `<li class="${item.type}">${item.text}</li>`).join('');

    compPicksA.innerText = draftState.picks.A.map(h => h.name).join(', ') || 'None';
    compPicksB.innerText = draftState.picks.B.map(h => h.name).join(', ') || 'None';
    compBansA.innerText = draftState.bans.A.map(h => h.name).join(', ') || 'None';
    compBansB.innerText = draftState.bans.B.map(h => h.name).join(', ') || 'None';

    compLanesA.innerText = resultA.coveredLanes.join(', ') || 'None';
    compLanesB.innerText = resultB.coveredLanes.join(', ') || 'None';

    postDraftModal.classList.remove('hidden');
}

btnCloseModal.addEventListener('click', () => postDraftModal.classList.add('hidden'));

function updateTurnStatusUI() {
    blueBans.innerText = 'Bans: ' + (draftState.bans.A.map(h => h.name).join(', ') || 'None');
    redBans.innerText = 'Bans: ' + (draftState.bans.B.map(h => h.name).join(', ') || 'None');

    bluePicks.innerHTML = draftState.picks.A.map(h => `<li>${h.name}</li>`).join('');
    redPicks.innerHTML = draftState.picks.B.map(h => `<li>${h.name}</li>`).join('');

    if (draftState.isComplete && draftState.currentTurnIndex >= 20) {
        turnBannerText.innerText = 'DRAFT COMPLETE!';
        phaseBannerText.innerText = 'All 20 actions performed.';
        teamABox.classList.remove('active-turn');
        teamBBox.classList.remove('active-turn');
        showPostDraftAnalysis();
        return;
    } else {
        postDraftModal.classList.add('hidden');
    }

    const turn = getCurrentTurn();
    if (!turn) return;

    const actionUpper = turn.action.toUpperCase();
    const spectatorSubtext = window.currentRoomMode === 'auto_sim' ? '(Spectating AI)' : `(You: Team ${window.myAssignedTeam})`;
    turnBannerText.innerText = `Turn ${turn.turn}: Team ${turn.team} ${actionUpper} ${spectatorSubtext}`;
    phaseBannerText.innerText = turn.phase;

    if (turn.team === 'A') {
        teamABox.classList.add('active-turn');
        teamBBox.classList.remove('active-turn');
    } else {
        teamBBox.classList.add('active-turn');
        teamABox.classList.remove('active-turn');
    }
}

function updateUI() {
    renderTimeline();
    renderRecommendations();
    renderHeroGrid();
    renderDraftLog();
    updateTurnStatusUI();
}

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

function showDraftScreen(roomId, mode) {
    roomDisplayTag.innerText = `ROOM: ${roomId}`;
    setupScreen.classList.add('hidden');
    draftScreen.classList.remove('hidden');

    if (mode === 'auto_sim') {
        simControlBar.classList.remove('hidden');
    } else {
        simControlBar.classList.add('hidden');
    }

    updateUI();
}

function showSetupScreen() {
    draftScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
}