// =========================================================================
// MAIN CLIENT INTERACTIVITY, DISCONNECT COUNTDOWN & REAL-TIME SYNC
// =========================================================================

const socket = io({
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000
});

function getOrCreatePlayerToken() {
    let token = sessionStorage.getItem('mlbb_player_token');
    if (!token) {
        token = 'PLR-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        sessionStorage.setItem('mlbb_player_token', token);
    }
    return token;
}

const myPlayerToken = getOrCreatePlayerToken();

// Screen Elements
const connectionStatus = document.getElementById('connection-status');
const setupScreen = document.getElementById('setup-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const draftScreen = document.getElementById('draft-screen');

// Setup Controls
const btnModeAi = document.getElementById('btn-mode-ai');
const btnModeSim = document.getElementById('btn-mode-sim');
const btnModeCreate = document.getElementById('btn-mode-create');
const btnModeJoin = document.getElementById('btn-mode-join');
const joinInputGroup = document.getElementById('join-input-group');
const roomIdInput = document.getElementById('room-id-input');
const btnEnterRoom = document.getElementById('btn-enter-room');

// Lobby Staging Controls
const lobbyRoomCode = document.getElementById('lobby-room-code');
const btnCopyCode = document.getElementById('btn-copy-code');
const copyToast = document.getElementById('copy-toast');
const lobbyPlayerAName = document.getElementById('lobby-player-a-name');
const lobbyPlayerAStatus = document.getElementById('lobby-player-a-status');
const lobbyPlayerBName = document.getElementById('lobby-player-b-name');
const lobbyPlayerBStatus = document.getElementById('lobby-player-b-status');
const btnToggleReady = document.getElementById('btn-toggle-ready');
const readyBtnText = document.getElementById('ready-btn-text');
const btnLobbyLeave = document.getElementById('btn-lobby-leave');

// Disconnect Modal Controls
const disconnectModal = document.getElementById('disconnect-modal');
const disconnectCountdown = document.getElementById('disconnect-countdown');
const disconnectModalText = document.getElementById('disconnect-modal-text');
const btnLeaveNow = document.getElementById('btn-leave-now');
let disconnectInterval = null;

// Draft Board Controls
const simControlBar = document.getElementById('sim-control-bar');
const btnSimStep = document.getElementById('btn-sim-step');
const btnSimAuto = document.getElementById('btn-sim-auto');
const btnSimPause = document.getElementById('btn-sim-pause');
const btnSimReset = document.getElementById('btn-sim-reset');
const btnManualReset = document.getElementById('btn-manual-reset');
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

// Reset Approval Controls
const resetConfirmModal = document.getElementById('reset-confirm-modal');
const btnAcceptReset = document.getElementById('btn-accept-reset');
const btnDeclineReset = document.getElementById('btn-decline-reset');
const resetStatusBanner = document.getElementById('reset-status-banner');

// Post-Draft Modal Controls
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

let currentMode = 'vs_ai';
let currentSearchQuery = '';
let currentLaneFilter = 'ALL';
let isSubmittingAction = false;
window.myAssignedTeam = null;
window.currentRoomId = null;
window.currentRoomMode = null;

// =========================================================================
// HERO PORTRAIT & FALLBACK HELPER
// =========================================================================

/**
 * Creates an image element with a robust fallback to initials if the portrait fails to load.
 */
function createHeroAvatarHTML(hero, extraClass = '') {
    if (!hero) return '';
    const initials = hero.name.substring(0, 2).toUpperCase();
    const imgSrc = hero.image || '';

    return `
        <div class="hero-avatar-wrap ${extraClass}">
            <img class="hero-avatar-img" 
                 src="${imgSrc}" 
                 alt="${hero.name}" 
                 loading="lazy" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="avatar-fallback" style="display: none;">${initials}</div>
        </div>
    `;
}

function findHeroById(id) {
    return HERO_DATASET.find(h => h.id === id) || { id, name: id, lanes: [] };
}

// =========================================================================
// SOCKET CONNECTION & LIFECYCLE
// =========================================================================

socket.on('connect', () => {
    if (connectionStatus) {
        connectionStatus.className = 'status-badge connected';
        const label = connectionStatus.querySelector('.status-label');
        if (label) label.innerText = 'Online';
    }

    const savedRoomId = sessionStorage.getItem('mlbb_active_room');
    if (savedRoomId && !window.currentRoomId) {
        socket.emit('join_room', {
            targetRoomId: savedRoomId,
            playerToken: myPlayerToken
        });
    }
});

socket.on('disconnect', () => {
    if (connectionStatus) {
        connectionStatus.className = 'status-badge disconnected';
        const label = connectionStatus.querySelector('.status-label');
        if (label) label.innerText = 'Reconnecting...';
    }
});

socket.on('player_disconnected', ({ disconnectedTeam, timeoutSeconds }) => {
    if (disconnectInterval) clearInterval(disconnectInterval);

    let timeLeft = timeoutSeconds || 30;
    disconnectCountdown.innerText = timeLeft;
    disconnectModalText.innerText = `Opponent (Team ${disconnectedTeam}) disconnected. Waiting for them to return...`;
    disconnectModal.classList.remove('hidden');

    disconnectInterval = setInterval(() => {
        timeLeft--;
        disconnectCountdown.innerText = timeLeft;
        if (timeLeft <= 0) clearInterval(disconnectInterval);
    }, 1000);
});

socket.on('player_reconnected', () => {
    if (disconnectInterval) clearInterval(disconnectInterval);
    disconnectModal.classList.add('hidden');
});

socket.on('room_dismissed', ({ message }) => {
    if (disconnectInterval) clearInterval(disconnectInterval);
    disconnectModal.classList.add('hidden');
    alert(message);
    sessionStorage.removeItem('mlbb_active_room');
    location.reload();
});

socket.on('draft_updated', ({ draftState: serverState, mode, status, players, isReset }) => {
    if (!isReset && typeof draftState !== 'undefined' && draftState && draftState.version !== undefined && serverState.version !== undefined) {
        if (serverState.version < draftState.version) return;
    }

    if (mode) window.currentRoomMode = mode;
    draftState = serverState;
    isSubmittingAction = false;

    if (window.currentRoomMode === 'pvp' && !draftState.started) {
        showLobbyScreen(window.currentRoomId, players);
    } else {
        showDraftScreen(window.currentRoomId, window.currentRoomMode);
        updateUI();
    }
});

socket.on('draft_error', (data) => {
    isSubmittingAction = false;
    alert(`Action Error: ${data.message}`);
});

socket.on('room_error', (data) => {
    alert(data.message);
    sessionStorage.removeItem('mlbb_active_room');
    showSetupScreen();
});

// =========================================================================
// SCREEN ROUTING & LOBBY MANAGEMENT
// =========================================================================

function showSetupScreen() {
    draftScreen.classList.add('hidden');
    lobbyScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
}

function showLobbyScreen(roomId, players) {
    setupScreen.classList.add('hidden');
    draftScreen.classList.add('hidden');
    lobbyScreen.classList.remove('hidden');

    lobbyRoomCode.innerText = roomId;

    const myTeam = window.myAssignedTeam;
    const playerA = players && players.A;
    const playerB = players && players.B;

    lobbyPlayerAName.innerText = myTeam === 'A' ? 'You (Team A)' : 'Opponent (Team A)';
    if (playerA && playerA.connected) {
        lobbyPlayerAStatus.innerText = playerA.ready ? 'READY' : 'WAITING';
        lobbyPlayerAStatus.className = `slot-status-badge ${playerA.ready ? 'ready' : 'waiting'}`;
    } else {
        lobbyPlayerAStatus.innerText = 'OFFLINE';
        lobbyPlayerAStatus.className = 'slot-status-badge waiting';
    }

    if (playerB && playerB.connected) {
        lobbyPlayerBName.innerText = myTeam === 'B' ? 'You (Team B)' : 'Opponent (Team B)';
        lobbyPlayerBStatus.innerText = playerB.ready ? 'READY' : 'WAITING';
        lobbyPlayerBStatus.className = `slot-status-badge ${playerB.ready ? 'ready' : 'waiting'}`;
    } else {
        lobbyPlayerBName.innerText = 'Waiting for Player B...';
        lobbyPlayerBStatus.innerText = 'WAITING';
        lobbyPlayerBStatus.className = 'slot-status-badge waiting';
    }

    const myData = myTeam === 'A' ? playerA : playerB;
    if (myData && myData.ready) {
        btnToggleReady.className = 'btn btn-secondary btn-large';
        readyBtnText.innerText = 'CANCEL READY';
    } else {
        btnToggleReady.className = 'btn btn-gold btn-large';
        readyBtnText.innerText = 'READY UP';
    }
}

function showDraftScreen(roomId, mode) {
    if (roomDisplayTag) roomDisplayTag.innerText = `ROOM: ${roomId}`;
    setupScreen.classList.add('hidden');
    lobbyScreen.classList.add('hidden');
    draftScreen.classList.remove('hidden');

    if (simControlBar) {
        if (mode === 'auto_sim') {
            simControlBar.classList.remove('hidden');
        } else {
            simControlBar.classList.add('hidden');
        }
    }

    if (btnManualReset) {
        if (mode === 'auto_sim') {
            btnManualReset.classList.add('hidden');
        } else {
            btnManualReset.classList.remove('hidden');
        }
    }
}

btnToggleReady.addEventListener('click', () => socket.emit('toggle_ready'));

btnCopyCode.addEventListener('click', () => {
    const code = lobbyRoomCode.innerText;
    navigator.clipboard.writeText(code).then(() => {
        copyToast.classList.remove('hidden');
        setTimeout(() => copyToast.classList.add('hidden'), 2000);
    });
});

btnLobbyLeave.addEventListener('click', () => {
    sessionStorage.removeItem('mlbb_active_room');
    location.reload();
});

btnLeaveRoom.addEventListener('click', () => {
    sessionStorage.removeItem('mlbb_active_room');
    location.reload();
});

btnLeaveNow.addEventListener('click', () => {
    if (disconnectInterval) clearInterval(disconnectInterval);
    sessionStorage.removeItem('mlbb_active_room');
    location.reload();
});

// =========================================================================
// MODE SELECTION & ENTRY
// =========================================================================

function setActiveModeCard(selectedBtn) {
    [btnModeAi, btnModeSim, btnModeCreate, btnModeJoin].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    if (selectedBtn) selectedBtn.classList.add('active');
}

btnModeAi.addEventListener('click', () => {
    currentMode = 'vs_ai';
    setActiveModeCard(btnModeAi);
    joinInputGroup.classList.add('hidden');
});

btnModeSim.addEventListener('click', () => {
    currentMode = 'auto_sim';
    setActiveModeCard(btnModeSim);
    joinInputGroup.classList.add('hidden');
});

btnModeCreate.addEventListener('click', () => {
    currentMode = 'create';
    setActiveModeCard(btnModeCreate);
    joinInputGroup.classList.add('hidden');
});

btnModeJoin.addEventListener('click', () => {
    currentMode = 'join';
    setActiveModeCard(btnModeJoin);
    joinInputGroup.classList.remove('hidden');
    roomIdInput.focus();
});

btnEnterRoom.addEventListener('click', () => {
    if (currentMode === 'vs_ai' || currentMode === 'auto_sim') {
        socket.emit('create_room', { playerToken: myPlayerToken, mode: currentMode });
    } else if (currentMode === 'create') {
        socket.emit('create_room', { playerToken: myPlayerToken, mode: 'pvp' });
    } else {
        const inputCode = roomIdInput.value.trim().toUpperCase();
        if (!inputCode) {
            alert('Please enter a 6-character room code.');
            return;
        }
        socket.emit('join_room', { targetRoomId: inputCode, playerToken: myPlayerToken });
    }
});

socket.on('room_created', (data) => {
    window.currentRoomId = data.roomId;
    window.myAssignedTeam = data.yourTeam;
    window.currentRoomMode = data.mode;
    draftState = data.draftState;

    sessionStorage.setItem('mlbb_active_room', data.roomId);

    if (data.mode === 'pvp') {
        showLobbyScreen(data.roomId, data.players);
    } else {
        showDraftScreen(data.roomId, data.mode);
        updateUI();
    }
});

socket.on('room_joined', (data) => {
    window.currentRoomId = data.roomId;
    window.myAssignedTeam = data.yourTeam;
    window.currentRoomMode = data.mode;
    draftState = data.draftState;

    sessionStorage.setItem('mlbb_active_room', data.roomId);

    if (data.mode === 'pvp' && !data.draftState.started) {
        showLobbyScreen(data.roomId, data.players);
    } else {
        showDraftScreen(data.roomId, data.mode);
        updateUI();
    }
});

// =========================================================================
// RESET & SIM CONTROLS
// =========================================================================

socket.on('reset_requested', () => {
    if (resetConfirmModal) resetConfirmModal.classList.remove('hidden');
});

socket.on('reset_status', ({ message }) => {
    if (resetStatusBanner) {
        resetStatusBanner.innerText = message;
        resetStatusBanner.classList.remove('hidden');
        setTimeout(() => {
            if (resetStatusBanner) resetStatusBanner.classList.add('hidden');
        }, 3500);
    }
});

socket.on('reset_declined', ({ message }) => {
    if (resetStatusBanner) {
        resetStatusBanner.innerText = message;
        resetStatusBanner.classList.remove('hidden');
        setTimeout(() => resetStatusBanner.classList.add('hidden'), 4000);
    }
});

if (btnAcceptReset) {
    btnAcceptReset.addEventListener('click', () => {
        socket.emit('respond_reset', { approved: true });
        if (resetConfirmModal) resetConfirmModal.classList.add('hidden');
    });
}

if (btnDeclineReset) {
    btnDeclineReset.addEventListener('click', () => {
        socket.emit('respond_reset', { approved: false });
        if (resetConfirmModal) resetConfirmModal.classList.add('hidden');
    });
}

if (btnManualReset) btnManualReset.addEventListener('click', () => socket.emit('request_reset'));
if (btnSimReset) btnSimReset.addEventListener('click', () => socket.emit('request_reset'));
if (btnSimStep) btnSimStep.addEventListener('click', () => socket.emit('sim_step'));
if (btnSimAuto) btnSimAuto.addEventListener('click', () => socket.emit('sim_start_auto'));
if (btnSimPause) btnSimPause.addEventListener('click', () => socket.emit('sim_pause_auto'));

// =========================================================================
// RENDERERS (WITH CONSISTENT HERO PRESENTATION)
// =========================================================================

function renderTimeline() {
    if (!timelineStrip) return;
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
    if (!draftLogList) return;
    draftLogList.innerHTML = '';
    draftState.draftLog.forEach(log => {
        const heroObj = findHeroById(log.hero ? log.hero.toLowerCase() : '');
        const li = document.createElement('li');
        li.className = `team-${log.team}`;
        li.innerHTML = `
            <div class="log-item-wrap">
                ${createHeroAvatarHTML(heroObj, 'log-avatar')}
                <span>[Turn ${log.turn}] Team ${log.team} ${log.action.toUpperCase()}ED <strong>${log.hero}</strong></span>
            </div>
        `;
        draftLogList.appendChild(li);
    });
    draftLogList.scrollTop = draftLogList.scrollHeight;
}

function renderRecommendations() {
    const recContainer = document.getElementById('rec-chips-container');
    const recTitleText = document.getElementById('rec-title-text');
    const recPanel = document.getElementById('recommendation-panel');
    if (!recContainer || !recPanel) return;

    if (window.currentRoomMode === 'auto_sim' || draftState.isComplete) {
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
        recTitleText.innerText = 'High Priority Ban Suggestions:';
    } else {
        const laneStr = recData.neededLanes.length > 0 ? recData.neededLanes.join(', ') : 'Flex Fill';
        recTitleText.innerText = `Suggested Picks (Needs: ${laneStr}):`;
    }

    recData.list.forEach(hero => {
        const chip = document.createElement('button');
        chip.className = 'rec-chip';
        chip.innerHTML = `
            ${createHeroAvatarHTML(hero, 'rec-chip-avatar')}
            <span>${hero.name}</span> 
            <small>(${hero.lanes.join('/')})</small>
        `;
        chip.addEventListener('click', () => {
            if (isSubmittingAction) return;
            isSubmittingAction = true;
            socket.emit('select_hero', { heroId: hero.id });
        });
        recContainer.appendChild(chip);
    });
}

// Replace renderHeroGrid in public/js/main.js with this:
function renderHeroGrid() {
    if (!heroGrid) return;
    heroGrid.innerHTML = '';
    const recData = getRecommendations();
    const recommendedIds = recData.list ? recData.list.map(h => h.id) : [];

    const filteredHeroes = HERO_DATASET.filter(hero => {
        const matchesName = hero.name.toLowerCase().includes(currentSearchQuery.toLowerCase());
        
        // CASE-INSENSITIVE ROLE MATCHING
        const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
        const matchesLane = (currentLaneFilter.toUpperCase() === 'ALL') || 
            lanes.some(lane => lane.toUpperCase() === currentLaneFilter.toUpperCase());
            
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

        const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
        const tagsHtml = lanes.map(l => `<span class="tag">${l}</span>`).join('');
        const badgeHtml = isRecommended ? `<span class="rec-badge">⭐ REC</span>` : '';

        card.innerHTML = `
            ${badgeHtml}
            ${createHeroAvatarHTML(hero, 'hero-grid-avatar')}
            <div class="hero-name">${hero.name}</div>
            <div class="lane-tags">${tagsHtml}</div>
        `;

        if (!isSimMode && !unavailable && !draftState.isComplete) {
            card.addEventListener('click', () => {
                if (isSubmittingAction) return;
                isSubmittingAction = true;
                socket.emit('select_hero', { heroId: hero.id });
            });
        }

        heroGrid.appendChild(card);
    });
}

function renderBans(team, bansElement) {
    if (!bansElement) return;
    const bans = draftState.bans[team] || [];
    if (bans.length === 0) {
        bansElement.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">None</span>';
        return;
    }
    bansElement.innerHTML = bans.map(hero => `
        <div class="ban-chip-item">
            ${createHeroAvatarHTML(hero, 'ban-chip-avatar')}
            <span>${hero.name}</span>
        </div>
    `).join('');
}

function renderSlots(team, picksListElement) {
    if (!picksListElement) return;
    picksListElement.innerHTML = '';
    const picks = draftState.picks[team] || [];

    for (let i = 0; i < 5; i++) {
        const hero = picks[i];
        const li = document.createElement('li');
        if (hero) {
            li.className = 'pick-slot filled';
            li.innerHTML = `
                ${createHeroAvatarHTML(hero, 'pick-slot-avatar')}
                <div class="pick-slot-info">
                    <span class="pick-slot-name">${hero.name}</span>
                    <span class="slot-lanes">${hero.lanes.join('/')}</span>
                </div>
            `;
        } else {
            li.className = 'pick-slot empty';
            li.innerHTML = `<span>Pick ${i + 1} Pending...</span>`;
        }
        picksListElement.appendChild(li);
    }
}

function updateTurnStatusUI() {
    renderBans('A', blueBans);
    renderBans('B', redBans);

    renderSlots('A', bluePicks);
    renderSlots('B', redPicks);

    const turnAnnouncer = document.querySelector('.turn-announcer-center');

    if (draftState.isComplete && draftState.currentTurnIndex >= 20) {
        if (turnBannerText) turnBannerText.innerText = 'DRAFT COMPLETE';
        if (phaseBannerText) phaseBannerText.innerText = 'Evaluation Ready';
        if (turnAnnouncer) turnAnnouncer.className = 'turn-announcer-center';
        if (teamABox) teamABox.classList.remove('active-turn');
        if (teamBBox) teamBBox.classList.remove('active-turn');
        showPostDraftAnalysis();
        return;
    } else {
        if (postDraftModal) postDraftModal.classList.add('hidden');
    }

    const turn = getCurrentTurn();
    if (!turn) return;

    const actionUpper = turn.action.toUpperCase();
    const spectatorSubtext = window.currentRoomMode === 'auto_sim' ? '(Spectating AI)' : `(You: Team ${window.myAssignedTeam})`;
    
    if (turnBannerText) turnBannerText.innerText = `Turn ${turn.turn}: Team ${turn.team} ${actionUpper}`;
    if (phaseBannerText) phaseBannerText.innerText = `${turn.phase} ${spectatorSubtext}`;

    if (turnAnnouncer) {
        turnAnnouncer.className = `turn-announcer-center ${turn.action === 'ban' ? 'action-ban' : 'action-pick'}`;
    }

    if (teamABox && teamBBox) {
        if (turn.team === 'A') {
            teamABox.classList.add('active-turn');
            teamBBox.classList.remove('active-turn');
        } else {
            teamBBox.classList.add('active-turn');
            teamABox.classList.remove('active-turn');
        }
    }
}

function showPostDraftAnalysis() {
    if (!postDraftModal) return;
    const resultA = evaluateTeamDraft(draftState.picks.A);
    const resultB = evaluateTeamDraft(draftState.picks.B);

    if (scoreTeamA) scoreTeamA.innerText = resultA.score;
    if (scoreTeamB) scoreTeamB.innerText = resultB.score;

    if (breakdownTeamA) breakdownTeamA.innerHTML = resultA.breakdown.map(item => `<li class="${item.type}">${item.text}</li>`).join('');
    if (breakdownTeamB) breakdownTeamB.innerHTML = resultB.breakdown.map(item => `<li class="${item.type}">${item.text}</li>`).join('');

    if (compPicksA) compPicksA.innerText = draftState.picks.A.map(h => h.name).join(', ') || 'None';
    if (compPicksB) compPicksB.innerText = draftState.picks.B.map(h => h.name).join(', ') || 'None';
    if (compBansA) compBansA.innerText = draftState.bans.A.map(h => h.name).join(', ') || 'None';
    if (compBansB) compBansB.innerText = draftState.bans.B.map(h => h.name).join(', ') || 'None';

    if (compLanesA) compLanesA.innerText = resultA.coveredLanes.join(', ') || 'None';
    if (compLanesB) compLanesB.innerText = resultB.coveredLanes.join(', ') || 'None';

    postDraftModal.classList.remove('hidden');
}

if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
        if (postDraftModal) postDraftModal.classList.add('hidden');
    });
}

function updateUI() {
    renderTimeline();
    renderRecommendations();
    renderHeroGrid();
    renderDraftLog();
    updateTurnStatusUI();
}

if (heroSearch) {
    heroSearch.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        renderHeroGrid();
    });
}

laneButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        laneButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLaneFilter = btn.dataset.lane.toUpperCase();
        renderHeroGrid();
    });
});