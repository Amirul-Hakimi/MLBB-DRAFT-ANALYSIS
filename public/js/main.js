// =========================================================================
// APPLICATION CLIENT CONTROLLER (main.js)
// =========================================================================

const socket = io();

// Local Player Token (Session-isolated per browser tab)
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
let postDraftModal, btnCloseModal, btnRematch, btnNewDraft, btnReturnLobby;
let historyModal, btnViewHistory, btnCloseHistory, historyListContainer;
let disconnectModal, disconnectCountdown, btnLeaveNow;

// =========================================================================
// AVATAR GENERATION WITH FALLBACKS
// =========================================================================

// Exact image asset mappings for special/hyphenated hero names
const HERO_IMAGE_ALIASES = {
    "change": "chang'e",
    "popol_and_kupa": "popol-and-kupa",
    "x_borg": "x.borg",
    "yi_sun_shin": "yi-sun-shin",
    "yu_zhong": "yu-zhong",
    "lapu_lapu": "lapu-lapu",
    "luo_yi": "luo-yi",
    "sora": "cici",
    "zetian": "zhuxin"
};

function createHeroAvatarHTML(hero, customClass = '') {
    if (!hero) return '';
    const name = hero.name || 'Hero';
    
    // Check alias mapping or fallback to hyphenated format
    const assetKey = HERO_IMAGE_ALIASES[hero.id] || hero.id.replace(/_/g, '-');
    
    // 1. Direct raw CDN paths (encoded for special characters like ')
    const primaryUrl = `https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/${encodeURIComponent(assetKey)}.png`;
    const secondaryUrl = `https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/${assetKey.replace(/'/g, '')}.png`;
    const localUrl = `/assets/heroes/${hero.id}.png`;

    return `
        <div class="hero-avatar-wrapper ${customClass}">
            <img class="hero-img" 
                 src="${localUrl}" 
                 alt="${name}" 
                 loading="lazy"
                 onerror="
                    if (!this.dataset.triedPrimary) {
                        this.dataset.triedPrimary = 'true';
                        this.src = '${primaryUrl}';
                    } else if (!this.dataset.triedSecondary) {
                        this.dataset.triedSecondary = 'true';
                        this.src = '${secondaryUrl}';
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

    // Setup screen
    btnModeAi = document.getElementById('btn-mode-ai');
    btnModeSim = document.getElementById('btn-mode-sim');
    btnModeCreate = document.getElementById('btn-mode-create');
    btnModeJoin = document.getElementById('btn-mode-join');
    joinInputGroup = document.getElementById('join-input-group');
    roomIdInput = document.getElementById('room-id-input');
    btnEnterRoom = document.getElementById('btn-enter-room');

    // Lobby screen
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

    // Draft screen
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

    // Reset Modal
    resetConfirmModal = document.getElementById('reset-confirm-modal');
    resetRequestText = document.getElementById('reset-request-text');
    btnAcceptReset = document.getElementById('btn-accept-reset');
    btnDeclineReset = document.getElementById('btn-decline-reset');

    // Post-Draft Evaluation Modal
    postDraftModal = document.getElementById('post-draft-modal');
    btnCloseModal = document.getElementById('btn-close-modal');
    btnRematch = document.getElementById('btn-rematch');
    btnNewDraft = document.getElementById('btn-new-draft');
    btnReturnLobby = document.getElementById('btn-return-lobby');

    // Draft History Modal
    historyModal = document.getElementById('history-modal');
    btnViewHistory = document.getElementById('btn-view-history');
    btnCloseHistory = document.getElementById('btn-close-history');
    historyListContainer = document.getElementById('history-list-container');

    // Disconnect Modal
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
// SETUP SCREEN CONTROLS
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

// =========================================================================
// TIMELINE TRACK BUILDER
// =========================================================================
function buildTimelineTrack() {
    if (!timelineStrip) return;
    timelineStrip.innerHTML = '';

    DRAFT_SEQUENCE.forEach((seq, idx) => {
        const step = document.createElement('div');
        step.className = `timeline-node team-${seq.team.toLowerCase()}`;
        step.id = `timelineStep_${idx}`;
        step.textContent = `${seq.turn}:${seq.action[0].toUpperCase()}`;
        timelineStrip.appendChild(step);
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
    btnToggleReady?.addEventListener('click', () => socket.emit('toggle_ready'));

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

    // Close Post-Draft Evaluation Modal
    btnCloseModal?.addEventListener('click', () => {
        postDraftModal?.classList.add('hidden');
    });

    // Rematch, New Draft & Return to Lobby
    btnRematch?.addEventListener('click', () => {
        postDraftModal?.classList.add('hidden');
        socket.emit('request_rematch');
    });

    btnNewDraft?.addEventListener('click', () => {
        postDraftModal?.classList.add('hidden');
        socket.emit('request_reset');
    });

    btnReturnLobby?.addEventListener('click', () => {
        window.location.reload();
    });

    // Draft History Modal Open/Close
    btnViewHistory?.addEventListener('click', () => {
        socket.emit('get_draft_history');
        historyModal?.classList.remove('hidden');
    });

    btnCloseHistory?.addEventListener('click', () => {
        historyModal?.classList.add('hidden');
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
    currentDraftState = serverDraft;

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

    // Render Compact Pick Bars
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

    // Show Post-Draft Comparison Screen on completion
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
            <div class="ban-avatar-box">
                ${createHeroAvatarHTML(hero, 'ban-avatar-img')}
            </div>
            <span class="ban-hero-name">${hero.name}</span>
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
                <div class="pick-slot-avatar">
                    ${createHeroAvatarHTML(hero, 'pick-avatar-img')}
                </div>
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

// =========================================================================
// POST-DRAFT COMPARISON SCREEN EVALUATION
// =========================================================================
function showPostDraftEvaluation() {
    const modal = document.getElementById('post-draft-modal');
    if (!modal) return;

    const state = (typeof draftState !== 'undefined' && draftState) ? draftState : currentDraftState;
    if (!state) return;

    const picksA = state.picks?.A || [];
    const bansA = state.bans?.A || [];
    const picksB = state.picks?.B || [];
    const bansB = state.bans?.B || [];

    const evalResult = (typeof evaluateDraftComparison === 'function')
        ? evaluateDraftComparison(picksA, bansA, picksB, bansB)
        : { scoreA: 75, scoreB: 75, categories: [] };

    // 1. Overall Score & Advantage Badging
    const scoreAEl = document.getElementById('eval-score-a');
    const scoreBEl = document.getElementById('eval-score-b');
    const tagAEl = document.getElementById('advantage-tag-a');
    const tagBEl = document.getElementById('advantage-tag-b');

    if (scoreAEl) scoreAEl.textContent = evalResult.scoreA;
    if (scoreBEl) scoreBEl.textContent = evalResult.scoreB;

    if (evalResult.scoreA > evalResult.scoreB) {
        if (tagAEl) { tagAEl.textContent = '⭐ Draft Advantage'; tagAEl.className = 'score-advantage-tag active'; }
        if (tagBEl) { tagBEl.textContent = 'Strategic Parity'; tagBEl.className = 'score-advantage-tag'; }
    } else if (evalResult.scoreB > evalResult.scoreA) {
        if (tagBEl) { tagBEl.textContent = '⭐ Draft Advantage'; tagBEl.className = 'score-advantage-tag active'; }
        if (tagAEl) { tagAEl.textContent = 'Strategic Parity'; tagAEl.className = 'score-advantage-tag'; }
    } else {
        if (tagAEl) { tagAEl.textContent = 'Evenly Matched'; tagAEl.className = 'score-advantage-tag'; }
        if (tagBEl) { tagBEl.textContent = 'Evenly Matched'; tagBEl.className = 'score-advantage-tag'; }
    }

    // 2. Render Comparison Matrix Rows
    const matrixContainer = document.getElementById('comparison-matrix-list');
    if (matrixContainer) {
        matrixContainer.innerHTML = '';
        evalResult.categories.forEach(cat => {
            const row = document.createElement('div');
            row.className = 'matrix-row';

            const statusA = cat.winner === 'A' 
                ? '<span class="status-strong">Stronger in this category</span>' 
                : (cat.winner === 'B' ? '<span class="status-weak">Weaker in this category</span>' : '<span class="status-equal">Equal</span>');

            const statusB = cat.winner === 'B' 
                ? '<span class="status-strong">Stronger in this category</span>' 
                : (cat.winner === 'A' ? '<span class="status-weak">Weaker in this category</span>' : '<span class="status-equal">Equal</span>');

            row.innerHTML = `
                <div class="team-stat-side team-a-side ${cat.winner === 'A' ? 'highlight-side' : ''}">
                    <span class="stat-value">${cat.statA}</span>
                    ${statusA}
                </div>
                <div class="category-info-center">
                    <span class="cat-name">${cat.name}</span>
                    <span class="cat-desc">${cat.desc}</span>
                </div>
                <div class="team-stat-side team-b-side ${cat.winner === 'B' ? 'highlight-side' : ''}">
                    <span class="stat-value">${cat.statB}</span>
                    ${statusB}
                </div>
            `;
            matrixContainer.appendChild(row);
        });
    }

    // 3. Render Hero Lineups
    const picksAContainer = document.getElementById('lineup-picks-a');
    const bansAContainer = document.getElementById('lineup-bans-a');
    const picksBContainer = document.getElementById('lineup-picks-b');
    const bansBContainer = document.getElementById('lineup-bans-b');

    if (picksAContainer) picksAContainer.innerHTML = picksA.map(h => createHeroAvatarHTML(h, 'lineup-avatar')).join('');
    if (bansAContainer) bansAContainer.innerHTML = `<span class="sub-label">Bans:</span> ` + (bansA.map(h => `<span class="lineup-ban-name">${h.name}</span>`).join(', ') || 'None');
    if (picksBContainer) picksBContainer.innerHTML = picksB.map(h => createHeroAvatarHTML(h, 'lineup-avatar')).join('');
    if (bansBContainer) bansBContainer.innerHTML = `<span class="sub-label">Bans:</span> ` + (bansB.map(h => `<span class="lineup-ban-name">${h.name}</span>`).join(', ') || 'None');

    modal.classList.remove('hidden');
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

socket.on('draft_history_data', (historyList) => {
    const container = document.getElementById('history-list-container');
    if (!container) return;
    container.innerHTML = '';

    if (!historyList || historyList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #64748b;">
                No completed drafts recorded in this session yet.
            </div>
        `;
        return;
    }

    historyList.forEach((entry, index) => {
        const evalResult = (typeof evaluateDraftComparison === 'function')
            ? evaluateDraftComparison(entry.picks.A, entry.bans.A, entry.picks.B, entry.bans.B)
            : { scoreA: 75, scoreB: 75 };

        const card = document.createElement('div');
        card.className = 'history-entry-card';
        card.style.cssText = 'background: #111927; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px;';

        const timeString = new Date(entry.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px; margin-bottom: 10px;">
                <span style="font-family: 'Rajdhani', sans-serif; font-size: 1.1rem; font-weight: 700; color: #f59e0b;">
                    Match #${historyList.length - index} &bull; Room: ${entry.roomId} (${entry.mode.toUpperCase()})
                </span>
                <span style="font-size: 0.75rem; color: #64748b;">${timeString}</span>
            </div>

            <div style="display: flex; justify-content: space-around; align-items: center; background: rgba(0,0,0,0.25); border-radius: 8px; padding: 8px; margin-bottom: 10px;">
                <div style="text-align: center;">
                    <div style="color: #38bdf8; font-weight: 700; font-size: 0.85rem;">TEAM A</div>
                    <div style="font-size: 1.5rem; font-weight: 800; color: #38bdf8; font-family: 'Rajdhani';">${evalResult.scoreA}</div>
                </div>
                <div style="color: #f59e0b; font-weight: 800; font-size: 0.9rem;">VS</div>
                <div style="text-align: center;">
                    <div style="color: #f87171; font-weight: 700; font-size: 0.85rem;">TEAM B</div>
                    <div style="font-size: 1.5rem; font-weight: 800; color: #f87171; font-family: 'Rajdhani';">${evalResult.scoreB}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.75rem;">
                <div>
                    <strong style="color: #38bdf8;">Team A Picks:</strong> ${entry.picks.A.map(h => h.name).join(', ') || 'None'}<br/>
                    <strong style="color: #64748b;">Team A Bans:</strong> ${entry.bans.A.map(h => h.name).join(', ') || 'None'}
                </div>
                <div>
                    <strong style="color: #f87171;">Team B Picks:</strong> ${entry.picks.B.map(h => h.name).join(', ') || 'None'}<br/>
                    <strong style="color: #64748b;">Team B Bans:</strong> ${entry.bans.B.map(h => h.name).join(', ') || 'None'}
                </div>
            </div>

            <details style="margin-top: 10px; font-size: 0.75rem; color: #94a3b8; cursor: pointer;">
                <summary style="font-weight: 600; color: #cbd5e1;">View 20-Turn Execution Order (${entry.draftLog.length} Actions)</summary>
                <div style="margin-top: 6px; padding: 6px; background: rgba(0,0,0,0.3); border-radius: 6px; max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px;">
                    ${entry.draftLog.map(l => `<span>Turn ${l.turn} [Team ${l.team}]: ${l.action.toUpperCase()} ${l.hero}</span>`).join('')}
                </div>
            </details>
        `;

        container.appendChild(card);
    });
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