// =========================================================================
// APPLICATION CLIENT CONTROLLER (main.js)
// =========================================================================

const socket = io();

// Local Player Token (Unique per browser tab/session)
let clientPlayerToken = sessionStorage.getItem('mlbb_player_token');
if (!clientPlayerToken) {
    clientPlayerToken = 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    sessionStorage.setItem('mlbb_player_token', clientPlayerToken);
}

// Client View State
let currentRoomId = null;
let currentAssignedTeam = 'SPEC'; // 'A' | 'B' | 'SPEC'
window.currentRoomMode = 'vs_ai'; // 'vs_ai' | 'auto_sim' | 'pvp'
let currentDraftState = null;
let isSubmittingAction = false;
let disconnectInterval = null;

// Filter State
let currentFilterMode = 'lane'; // 'lane' | 'role'
let currentCategoryFilter = 'ALL';
let currentSearchQuery = '';

const LANE_FILTERS = [
    { label: 'ALL', key: 'ALL' },
    { label: 'EXP', key: 'EXP' },
    { label: 'JUNGLE', key: 'Jungle' },
    { label: 'MID', key: 'Mid' },
    { label: 'GOLD', key: 'Gold' },
    { label: 'ROAM', key: 'Roam' }
];

const CLASS_FILTERS = [
    { label: 'ALL', key: 'ALL' },
    { label: 'TANK', key: 'Tank' },
    { label: 'FIGHTER', key: 'Fighter' },
    { label: 'ASSASSIN', key: 'Assassin' },
    { label: 'MAGE', key: 'Mage' },
    { label: 'MARKSMAN', key: 'Marksman' },
    { label: 'SUPPORT', key: 'Support' }
];

// DOM References
let setupScreen, lobbyScreen, draftScreen;
let connectionStatus, connDot, connLabel;
let btnModeAi, btnModeSim, btnModeCreate, btnModeJoin, joinInputGroup, roomIdInput, btnEnterRoom;
let lobbyRoomCode, btnCopyCode, copyToast, lobbyPlayerAName, lobbyPlayerBName, lobbyPlayerAStatus, lobbyPlayerBStatus, btnLobbyLeave, btnToggleReady, readyBtnText;
let simControlBar, btnSimStep, btnSimAuto, btnSimPause, btnSimReset;
let blueBans, redBans, bluePicks, redPicks, roomDisplayTag, turnBannerText, phaseBannerText, resetStatusBanner;
let timelineStrip, recommendationPanel, recTitleText, recChipsContainer;
let heroSearchInput, filterPillsContainer, modeLaneBtn, modeRoleBtn, heroGrid;
let draftLogList, btnManualReset, btnLeaveRoom;
let resetConfirmModal, resetRequestText, btnAcceptReset, btnDeclineReset;
let postDraftModal, scoreTeamA, scoreTeamB, breakdownTeamA, breakdownTeamB, compPicksA, compBansA, compLanesA, compPicksB, compBansB, compLanesB, btnCloseModal;
let disconnectModal, disconnectCountdown, btnLeaveNow;

// =========================================================================
// AVATAR GENERATION (Real Image Resolvers)
// =========================================================================

// Special alias dictionary for heroes whose repo image keys differ from default IDs
const HERO_IMAGE_ALIASES = {
    "popol_and_kupa": "popol-and-kupa",
    "x_borg": "x.borg",
    "yi_sun_shin": "yi-sun-shin",
    "yu_zhong": "yu-zhong",
    "lapu_lapu": "lapu-lapu",
    "luo_yi": "luo-yi",
    "change": "chang-e",
    "sora": "cici",
    "zetian": "zhuxin"
};

function createHeroAvatarHTML(hero, customClass = '') {
    if (!hero) return '';
    const name = hero.name || 'Hero';
    
    // Clean name for URL encoding (replace apostrophe with %27 for Chang'e)
    const cleanWikiName = name.replace(/\s+/g, '_').replace(/'/g, '%27');
    
    const localSrc = hero.image || `/assets/heroes/${hero.id}.png`;
    const aliasKey = HERO_IMAGE_ALIASES[hero.id] || hero.id.replace(/_/g, '-');
    
    // Direct working CDN mirrors
    const githubMirror = `https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/${aliasKey}.png`;
    const wikiMirror = `https://mobile-legends.fandom.com/wiki/Special:FilePath/${cleanWikiName}.png`;
    const fallbackDirect = `https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/change.png`;

    return `
        <div class="hero-avatar-wrapper ${customClass}">
            <img class="hero-img" 
                 src="${localSrc}" 
                 alt="${name}" 
                 loading="lazy"
                 onerror="
                    if (!this.dataset.triedGithub) {
                        this.dataset.triedGithub = 'true';
                        this.src = '${githubMirror}';
                    } else if (!this.dataset.triedWiki) {
                        this.dataset.triedWiki = 'true';
                        this.src = '${wikiMirror}';
                    } else if (!this.dataset.triedDirect) {
                        this.dataset.triedDirect = 'true';
                        this.src = '${fallbackDirect}';
                    }
                 " />
        </div>
    `;
}
// =========================================================================
// INITIALIZATION
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Screens
    setupScreen = document.getElementById('setup-screen');
    lobbyScreen = document.getElementById('lobby-screen');
    draftScreen = document.getElementById('draft-screen');

    // Status
    connectionStatus = document.getElementById('connection-status');
    connDot = connectionStatus?.querySelector('.status-dot');
    connLabel = connectionStatus?.querySelector('.status-label');

    // Setup screen elements
    btnModeAi = document.getElementById('btn-mode-ai');
    btnModeSim = document.getElementById('btn-mode-sim');
    btnModeCreate = document.getElementById('btn-mode-create');
    btnModeJoin = document.getElementById('btn-mode-join');
    joinInputGroup = document.getElementById('join-input-group');
    roomIdInput = document.getElementById('room-id-input');
    btnEnterRoom = document.getElementById('btn-enter-room');

    // Lobby screen elements
    lobbyRoomCode = document.getElementById('lobby-room-code');
    btnCopyCode = document.getElementById('btn-copy-code');
    copyToast = document.getElementById('copy-toast');
    lobbyPlayerAName = document.getElementById('lobby-player-a-name');
    lobbyPlayerBName = document.getElementById('lobby-player-b-name');
    lobbyPlayerAStatus = document.getElementById('lobby-player-a-status');
    lobbyPlayerBStatus = document.getElementById('lobby-player-b-status');
    btnLobbyLeave = document.getElementById('btn-lobby-leave');
    btnToggleReady = document.getElementById('btn-toggle-ready');
    readyBtnText = document.getElementById('ready-btn-text');

    // Draft screen elements
    simControlBar = document.getElementById('sim-control-bar');
    btnSimStep = document.getElementById('btn-sim-step');
    btnSimAuto = document.getElementById('btn-sim-auto');
    btnSimPause = document.getElementById('btn-sim-pause');
    btnSimReset = document.getElementById('btn-sim-reset');

    blueBans = document.getElementById('blue-bans');
    redBans = document.getElementById('red-bans');
    bluePicks = document.getElementById('blue-picks');
    redPicks = document.getElementById('red-picks');
    roomDisplayTag = document.getElementById('room-display-tag');
    turnBannerText = document.getElementById('turn-banner-text');
    phaseBannerText = document.getElementById('phase-banner-text');
    resetStatusBanner = document.getElementById('reset-status-banner');

    timelineStrip = document.getElementById('timeline-strip');
    recommendationPanel = document.getElementById('recommendation-panel');
    recTitleText = document.getElementById('rec-title-text');
    recChipsContainer = document.getElementById('rec-chips-container');

    // Filters & Grid
    heroSearchInput = document.getElementById('hero-search');
    filterPillsContainer = document.getElementById('filterPillsContainer');
    modeLaneBtn = document.getElementById('modeLaneBtn');
    modeRoleBtn = document.getElementById('modeRoleBtn');
    heroGrid = document.getElementById('hero-grid');

    // Bottom Tools
    draftLogList = document.getElementById('draft-log-list');
    btnManualReset = document.getElementById('btn-manual-reset');
    btnLeaveRoom = document.getElementById('btn-leave-room');

    // Modals
    resetConfirmModal = document.getElementById('reset-confirm-modal');
    resetRequestText = document.getElementById('reset-request-text');
    btnAcceptReset = document.getElementById('btn-accept-reset');
    btnDeclineReset = document.getElementById('btn-decline-reset');

    postDraftModal = document.getElementById('post-draft-modal');
    scoreTeamA = document.getElementById('score-team-a');
    scoreTeamB = document.getElementById('score-team-b');
    breakdownTeamA = document.getElementById('breakdown-team-a');
    breakdownTeamB = document.getElementById('breakdown-team-b');
    compPicksA = document.getElementById('comp-picks-a');
    compBansA = document.getElementById('comp-bans-a');
    compLanesA = document.getElementById('comp-lanes-a');
    compPicksB = document.getElementById('comp-picks-b');
    compBansB = document.getElementById('comp-bans-b');
    compLanesB = document.getElementById('comp-lanes-b');
    btnCloseModal = document.getElementById('btn-close-modal');

    disconnectModal = document.getElementById('disconnect-modal');
    disconnectCountdown = document.getElementById('disconnect-countdown');
    btnLeaveNow = document.getElementById('btn-leave-now');

    initSetupListeners();
    initDraftListeners();
    initDualFilterSystem();
    buildTimelineTrack();
    renderFilterPills();
    renderHeroGrid();
});

// =========================================================================
// SCREEN SWITCHING
// =========================================================================
function showScreen(screenId) {
    [setupScreen, lobbyScreen, draftScreen].forEach(s => {
        if (s) s.classList.add('hidden');
    });
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
}

// =========================================================================
// SETUP SCREEN & MODE SELECTORS
// =========================================================================
let selectedSetupMode = 'vs_ai';

function initSetupListeners() {
    const modeCards = [btnModeAi, btnModeSim, btnModeCreate, btnModeJoin];

    function setSetupMode(mode, activeCard) {
        selectedSetupMode = mode;
        modeCards.forEach(c => c && c.classList.remove('active'));
        if (activeCard) activeCard.classList.add('active');

        if (mode === 'join_pvp') {
            joinInputGroup?.classList.remove('hidden');
            roomIdInput?.focus();
        } else {
            joinInputGroup?.classList.add('hidden');
        }
    }

    btnModeAi?.addEventListener('click', () => setSetupMode('vs_ai', btnModeAi));
    btnModeSim?.addEventListener('click', () => setSetupMode('auto_sim', btnModeSim));
    btnModeCreate?.addEventListener('click', () => setSetupMode('create_pvp', btnModeCreate));
    btnModeJoin?.addEventListener('click', () => setSetupMode('join_pvp', btnModeJoin));

    btnEnterRoom?.addEventListener('click', () => {
        if (selectedSetupMode === 'vs_ai') {
            createRoom('vs_ai');
        } else if (selectedSetupMode === 'auto_sim') {
            createRoom('auto_sim');
        } else if (selectedSetupMode === 'create_pvp') {
            createRoom('pvp');
        } else if (selectedSetupMode === 'join_pvp') {
            const targetCode = roomIdInput.value.trim().toUpperCase();
            if (targetCode.length > 0) {
                joinRoom(targetCode);
            } else {
                alert('Please enter a 6-character room code.');
            }
        }
    });
}

function createRoom(mode) {
    window.currentRoomMode = mode;
    socket.emit('create_room', { mode: mode, playerToken: clientPlayerToken });
}

function joinRoom(roomId) {
    socket.emit('join_room', { targetRoomId: roomId, playerToken: clientPlayerToken });
}

// =========================================================================
// DUAL MODE FILTER LOGIC
// =========================================================================
function initDualFilterSystem() {
    if (modeLaneBtn && modeRoleBtn) {
        modeLaneBtn.addEventListener('click', () => {
            if (currentFilterMode === 'lane') return;
            currentFilterMode = 'lane';
            currentCategoryFilter = 'ALL';
            modeLaneBtn.classList.remove('btn-secondary');
            modeLaneBtn.classList.add('active');
            modeRoleBtn.classList.add('btn-secondary');
            modeRoleBtn.classList.remove('active');
            renderFilterPills();
            renderHeroGrid();
        });

        modeRoleBtn.addEventListener('click', () => {
            if (currentFilterMode === 'role') return;
            currentFilterMode = 'role';
            currentCategoryFilter = 'ALL';
            modeRoleBtn.classList.remove('btn-secondary');
            modeRoleBtn.classList.add('active');
            modeLaneBtn.classList.add('btn-secondary');
            modeLaneBtn.classList.remove('active');
            renderFilterPills();
            renderHeroGrid();
        });
    }

    if (heroSearchInput) {
        heroSearchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.trim();
            renderHeroGrid();
        });
    }
}

function renderFilterPills() {
    if (!filterPillsContainer) return;
    filterPillsContainer.innerHTML = '';

    const filterList = currentFilterMode === 'lane' ? LANE_FILTERS : CLASS_FILTERS;

    filterList.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `lane-btn ${currentCategoryFilter.toUpperCase() === item.key.toUpperCase() ? 'active' : ''}`;
        btn.textContent = item.label;

        btn.addEventListener('click', () => {
            currentCategoryFilter = item.key;
            renderFilterPills();
            renderHeroGrid();
        });

        filterPillsContainer.appendChild(btn);
    });
}

function renderHeroGrid() {
    if (!heroGrid) return;
    heroGrid.innerHTML = '';

    const recData = getRecommendations();
    const recommendedIds = recData.list ? recData.list.map(h => h.id) : [];

    const filteredHeroes = HERO_DATASET.filter(hero => {
        const matchesName = hero.name.toLowerCase().includes(currentSearchQuery.toLowerCase());

        let matchesCategory = false;
        if (currentCategoryFilter.toUpperCase() === 'ALL') {
            matchesCategory = true;
        } else if (currentFilterMode === 'lane') {
            const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
            matchesCategory = lanes.some(l => l.toUpperCase() === currentCategoryFilter.toUpperCase());
        } else if (currentFilterMode === 'role') {
            const classes = (typeof getHeroClasses === 'function') ? getHeroClasses(hero) : (hero.heroClass || []);
            matchesCategory = classes.some(c => c.toUpperCase() === currentCategoryFilter.toUpperCase());
        }

        return matchesName && matchesCategory;
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

        const displayTags = (currentFilterMode === 'lane')
            ? ((typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []))
            : ((typeof getHeroClasses === 'function') ? getHeroClasses(hero) : (hero.heroClass || []));

        const tagsHtml = displayTags.map(t => `<span class="tag-badge">${t}</span>`).join('');
        const badgeHtml = isRecommended ? `<span class="rec-badge">REC</span>` : '';

        card.innerHTML = `
            ${badgeHtml}
            ${createHeroAvatarHTML(hero, 'card-avatar')}
            <div class="card-info">
                <span class="card-name">${hero.name}</span>
                <div class="card-tags">${tagsHtml}</div>
            </div>
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

function updateTimelineUI() {
    DRAFT_SEQUENCE.forEach((seq, idx) => {
        const el = document.getElementById(`timelineStep_${idx}`);
        if (!el) return;

        el.classList.remove('active', 'completed');
        if (idx < draftState.currentTurnIndex) {
            el.classList.add('completed');
        } else if (idx === draftState.currentTurnIndex && !draftState.isComplete && draftState.started) {
            el.classList.add('active');
        }
    });
}

// =========================================================================
// DRAFT INTERACTION & CONTROLS
// =========================================================================
function initDraftListeners() {
    // Copy Room Code
    btnCopyCode?.addEventListener('click', () => {
        if (!currentRoomId) return;
        navigator.clipboard.writeText(currentRoomId).then(() => {
            copyToast?.classList.remove('hidden');
            setTimeout(() => copyToast?.classList.add('hidden'), 2000);
        });
    });

    // Toggle Ready in Staging
    btnToggleReady?.addEventListener('click', () => {
        socket.emit('toggle_ready');
    });

    // Leave Lobby / Exit Room
    btnLobbyLeave?.addEventListener('click', () => window.location.reload());
    btnLeaveRoom?.addEventListener('click', () => window.location.reload());
    btnLeaveNow?.addEventListener('click', () => window.location.reload());

    // Simulation Controls
    btnSimStep?.addEventListener('click', () => socket.emit('sim_step'));
    btnSimAuto?.addEventListener('click', () => socket.emit('sim_start_auto'));
    btnSimPause?.addEventListener('click', () => socket.emit('sim_pause_auto'));
    btnSimReset?.addEventListener('click', () => socket.emit('request_reset'));
    btnManualReset?.addEventListener('click', () => socket.emit('request_reset'));

    // Reset Confirmation Modal
    btnAcceptReset?.addEventListener('click', () => {
        socket.emit('respond_reset', { approved: true });
        resetConfirmModal?.classList.add('hidden');
    });
    btnDeclineReset?.addEventListener('click', () => {
        socket.emit('respond_reset', { approved: false });
        resetConfirmModal?.classList.add('hidden');
    });

    // Close Post-Draft Evaluation
    btnCloseModal?.addEventListener('click', () => {
        postDraftModal?.classList.add('hidden');
    });
}

// =========================================================================
// UI SYNCHRONIZATION FROM SERVER
// =========================================================================
function syncStagingLobbyUI(roomPayload) {
    const { roomId, players, status } = roomPayload;
    if (lobbyRoomCode) lobbyRoomCode.textContent = roomId || '------';

    // Player A
    if (players?.A) {
        lobbyPlayerAName.textContent = (currentAssignedTeam === 'A') ? 'Host (You)' : 'Player A';
        lobbyPlayerAStatus.textContent = players.A.ready ? 'READY' : 'WAITING';
        lobbyPlayerAStatus.className = `slot-status-badge ${players.A.ready ? 'ready' : 'waiting'}`;
    } else {
        lobbyPlayerAName.textContent = 'Waiting for Host...';
        lobbyPlayerAStatus.textContent = 'WAITING';
        lobbyPlayerAStatus.className = 'slot-status-badge waiting';
    }

    // Player B
    if (players?.B) {
        lobbyPlayerBName.textContent = (currentAssignedTeam === 'B') ? 'Player B (You)' : 'Opponent';
        lobbyPlayerBStatus.textContent = players.B.ready ? 'READY' : 'WAITING';
        lobbyPlayerBStatus.className = `slot-status-badge ${players.B.ready ? 'ready' : 'waiting'}`;
    } else {
        lobbyPlayerBName.textContent = 'Waiting for Player...';
        lobbyPlayerBStatus.textContent = 'WAITING';
        lobbyPlayerBStatus.className = 'slot-status-badge waiting';
    }

    // Ready Button
    if (readyBtnText && players && players[currentAssignedTeam]) {
        const isReady = players[currentAssignedTeam].ready;
        readyBtnText.textContent = isReady ? 'CANCEL READY' : 'READY UP';
        btnToggleReady.className = `btn btn-large ${isReady ? 'btn-secondary' : 'btn-gold'}`;
    }
}

function syncDraftArenaUI(roomPayload) {
    isSubmittingAction = false;
    const { draftState: serverDraft, status, mode, players, roomId } = roomPayload;
    draftState = serverDraft;

    // Room ID
    if (roomDisplayTag) roomDisplayTag.textContent = `ROOM: ${roomId || '------'}`;

    // Show/Hide Auto-Sim Toolbar
    if (simControlBar) {
        if (mode === 'auto_sim') {
            simControlBar.classList.remove('hidden');
        } else {
            simControlBar.classList.add('hidden');
        }
    }

    // Render Bans
    renderBanChips(blueBans, draftState.bans?.A || []);
    renderBanChips(redBans, draftState.bans?.B || []);

    // Render Picks
    renderPickList(bluePicks, draftState.picks?.A || [], 'A');
    renderPickList(redPicks, draftState.picks?.B || [], 'B');

    // Update Announcer
    updateAnnouncerHeadline(status, mode);

    // Update Recommendations
    renderRecommendations();

    // Update Timeline & Hero Deck
    updateTimelineUI();
    renderHeroGrid();

    // Update Log Ticker
    renderActionLogs();

    // Show Post-Draft Modal on Complete
    if (draftState.isComplete) {
        showPostDraftEvaluation();
    }
}

function renderBanChips(container, bans) {
    if (!container) return;
    container.innerHTML = '';
    if (bans.length === 0) {
        container.innerHTML = '<span class="empty-ban-text">None</span>';
        return;
    }

    bans.forEach(hero => {
        const chip = document.createElement('div');
        chip.className = 'ban-badge';
        chip.innerHTML = `
            ${createHeroAvatarHTML(hero, 'ban-avatar')}
            <span>${hero.name}</span>
        `;
        container.appendChild(chip);
    });
}

function renderPickList(container, picks, teamKey) {
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        const hero = picks[i];
        const li = document.createElement('li');

        if (hero) {
            const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
            li.className = 'pick-slot locked';
            li.innerHTML = `
                ${createHeroAvatarHTML(hero, 'pick-avatar')}
                <div class="pick-meta">
                    <span class="hero-title">${hero.name}</span>
                    <span class="role-desc">${lanes.join('/')}</span>
                </div>
            `;
        } else {
            li.className = 'pick-slot pending';
            li.innerHTML = `
                <span class="slot-idx">Pick ${i + 1}</span>
                <span class="slot-placeholder">Pending...</span>
            `;
        }
        container.appendChild(li);
    }
}

function updateAnnouncerHeadline(status, mode) {
    if (!turnBannerText || !phaseBannerText) return;

    if (draftState.isComplete) {
        turnBannerText.textContent = 'DRAFT COMPLETE';
        phaseBannerText.textContent = 'Review team evaluation details';
        return;
    }

    const currentTurn = getCurrentTurn();
    if (!currentTurn) return;

    const actionText = currentTurn.action.toUpperCase();
    const teamText = `Team ${currentTurn.team}`;
    turnBannerText.textContent = `Turn ${currentTurn.turn}: ${teamText} ${actionText}`;
    phaseBannerText.textContent = `${currentTurn.phase} ${mode === 'pvp' ? `(You: Team ${currentAssignedTeam})` : ''}`;
}

function renderRecommendations() {
    if (!recChipsContainer) return;
    recChipsContainer.innerHTML = '';

    if (draftState.isComplete || window.currentRoomMode === 'auto_sim') {
        recChipsContainer.innerHTML = '<span class="rec-empty">No active recommendations</span>';
        return;
    }

    const recData = getRecommendations();
    if (!recData.list || recData.list.length === 0) {
        recChipsContainer.innerHTML = '<span class="rec-empty">No candidates available</span>';
        return;
    }

    if (recTitleText) {
        recTitleText.textContent = (recData.type === 'ban') ? 'Suggested Bans:' : 'Suggested Picks:';
    }

    recData.list.forEach(hero => {
        const chip = document.createElement('div');
        chip.className = `rec-chip ${recData.type === 'ban' ? 'rec-ban' : 'rec-pick'}`;
        
        const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
        chip.innerHTML = `
            ${createHeroAvatarHTML(hero, 'rec-avatar')}
            <div class="rec-info">
                <span class="rec-name">${hero.name}</span>
                <span class="rec-role">${lanes.join('/')}</span>
            </div>
        `;

        chip.addEventListener('click', () => {
            if (isSubmittingAction || isHeroUnavailable(hero.id)) return;
            isSubmittingAction = true;
            socket.emit('select_hero', { heroId: hero.id });
        });

        recChipsContainer.appendChild(chip);
    });
}

function renderActionLogs() {
    if (!draftLogList) return;
    draftLogList.innerHTML = '';
    const logs = draftState.draftLog || [];

    if (logs.length === 0) {
        draftLogList.innerHTML = '<li class="log-item placeholder">Draft initialized. Waiting for first action...</li>';
        return;
    }

    logs.forEach(l => {
        const li = document.createElement('li');
        li.className = 'log-item';
        li.textContent = `Turn ${l.turn} [${l.phase}]: Team ${l.team} ${l.action.toUpperCase()}ED ${l.hero}`;
        draftLogList.appendChild(li);
    });
    draftLogList.scrollTop = draftLogList.scrollHeight;
}

function showPostDraftEvaluation() {
    if (!postDraftModal) return;

    const evalA = evaluateTeamDraft(draftState.picks?.A || []);
    const evalB = evaluateTeamDraft(draftState.picks?.B || []);

    if (scoreTeamA) scoreTeamA.textContent = `${evalA.score}`;
    if (scoreTeamB) scoreTeamB.textContent = `${evalB.score}`;

    if (breakdownTeamA) {
        breakdownTeamA.innerHTML = evalA.breakdown.map(b => `<li class="${b.type}">${b.text}</li>`).join('');
    }
    if (breakdownTeamB) {
        breakdownTeamB.innerHTML = evalB.breakdown.map(b => `<li class="${b.type}">${b.text}</li>`).join('');
    }

    if (compPicksA) compPicksA.textContent = (draftState.picks?.A || []).map(h => h.name).join(', ') || '-';
    if (compBansA) compBansA.textContent = (draftState.bans?.A || []).map(h => h.name).join(', ') || '-';
    if (compLanesA) compLanesA.textContent = evalA.coveredLanes.join(', ') || 'None';

    if (compPicksB) compPicksB.textContent = (draftState.picks?.B || []).map(h => h.name).join(', ') || '-';
    if (compBansB) compBansB.textContent = (draftState.bans?.B || []).map(h => h.name).join(', ') || '-';
    if (compLanesB) compLanesB.textContent = evalB.coveredLanes.join(', ') || 'None';

    postDraftModal.classList.remove('hidden');
}

// =========================================================================
// SOCKET EVENT HANDLERS
// =========================================================================
socket.on('connect', () => {
    if (connectionStatus) {
        connectionStatus.className = 'status-badge connected';
        if (connLabel) connLabel.textContent = 'Online';
    }
});

socket.on('disconnect', () => {
    if (connectionStatus) {
        connectionStatus.className = 'status-badge disconnected';
        if (connLabel) connLabel.textContent = 'Offline';
    }
});

socket.on('room_created', (data) => {
    currentRoomId = data.roomId;
    currentAssignedTeam = data.yourTeam;
    window.currentRoomMode = data.mode;

    if (data.mode === 'pvp' && !data.draftState.started) {
        showScreen('lobby-screen');
        syncStagingLobbyUI(data);
    } else {
        showScreen('draft-screen');
        syncDraftArenaUI(data);
    }
});

socket.on('room_joined', (data) => {
    currentRoomId = data.roomId;
    currentAssignedTeam = data.yourTeam;
    window.currentRoomMode = data.mode;

    if (data.mode === 'pvp' && !data.draftState.started) {
        showScreen('lobby-screen');
        syncStagingLobbyUI(data);
    } else {
        showScreen('draft-screen');
        syncDraftArenaUI(data);
    }
});

socket.on('draft_updated', (data) => {
    if (data.mode === 'pvp' && !data.draftState.started) {
        showScreen('lobby-screen');
        syncStagingLobbyUI(data);
    } else {
        showScreen('draft-screen');
        syncDraftArenaUI(data);
    }
});

socket.on('room_error', (data) => {
    alert(data.message || 'Room error occurred.');
});

socket.on('reset_requested', () => {
    resetConfirmModal?.classList.remove('hidden');
});

socket.on('reset_declined', (data) => {
    alert(data.message || 'Reset request was declined.');
});

socket.on('player_disconnected', (data) => {
    if (disconnectModal) {
        let remainingSeconds = data.timeoutSeconds || 30;
        if (disconnectCountdown) disconnectCountdown.textContent = remainingSeconds;
        disconnectModal.classList.remove('hidden');

        if (disconnectInterval) clearInterval(disconnectInterval);
        disconnectInterval = setInterval(() => {
            remainingSeconds--;
            if (disconnectCountdown) disconnectCountdown.textContent = Math.max(0, remainingSeconds);
            if (remainingSeconds <= 0) {
                clearInterval(disconnectInterval);
            }
        }, 1000);
    }
});

socket.on('player_reconnected', () => {
    if (disconnectInterval) clearInterval(disconnectInterval);
    disconnectModal?.classList.add('hidden');
});

socket.on('room_dismissed', (data) => {
    if (disconnectInterval) clearInterval(disconnectInterval);
    alert(data.message || 'Room was closed.');
    window.location.reload();
});