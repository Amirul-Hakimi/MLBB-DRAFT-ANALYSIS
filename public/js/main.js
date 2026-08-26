// =========================================================================
// APPLICATION CLIENT CONTROLLER (main.js)
// =========================================================================

const socket = io();

// Local Player Token & Active Room Tracking (Session-isolated per browser tab)
let clientPlayerToken = sessionStorage.getItem('mlbb_player_token');
if (!clientPlayerToken) {
    clientPlayerToken = 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    sessionStorage.setItem('mlbb_player_token', clientPlayerToken);
}

let savedRoomId = sessionStorage.getItem('mlbb_active_room_id');
let currentRoomId = savedRoomId || null;
let currentAssignedTeam = 'SPEC';
window.currentRoomMode = 'vs_ai';
let currentDraftState = null;
let isSubmittingAction = false;
let disconnectInterval = null;

// Filter & Cache State
let currentFilterMode = 'lane';
let currentCategoryFilter = 'ALL';
let currentSearchQuery = '';
let searchDebounceTimer = null;
const heroCardNodeCache = new Map();
let cachedRecommendedIds = new Set();

// Turn Timer & Audio State
let turnTimerInterval = null;
let remainingTurnSeconds = 30;
let audioCtx = null;
let isSynthPlaying = false;
let isMusicPlaying = false; // general music play state (synth or html audio)
let synthInterval = null;
let synthGain = null;
let padOscs = []; // active pad oscillators for richer procedural texture
let proceduralNoiseBuffer = null; // noise buffer used for hi-hats/percussion

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
let blueBans, redBans, bluePicks, redPicks, roomDisplayTag, turnBannerText, phaseBannerText, btnReopenEval, resetStatusBanner;
let timelineStrip, recommendationPanel, recTitleText, recChipsContainer;
let heroSearchInput, filterPillsContainer, modeLaneBtn, modeRoleBtn, heroGrid;
let draftLogList, btnManualReset, btnLeaveRoom;
let resetConfirmModal, resetRequestText, btnAcceptReset, btnDeclineReset;
let postDraftModal, btnCloseModal, btnRematch, btnNewDraft, btnReturnLobby;
let historyModal, btnViewHistory, btnCloseHistory, historyListContainer;
let disconnectModal, disconnectCountdown, btnLeaveNow;
let pvpChatCard;

// =========================================================================
// SYNTHESIZED WEB AUDIO ENGINE (RICH 16-STEP PROCEDURAL MUSIC)
// =========================================================================
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playClickSound() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
}

function playTickSound() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
}

function playTimesUpSound() {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
}

// -------------------------------------------------------------------------
// HIGH-FIDELITY SYNTHETIC PERCUSSION & INSTRUMENT HELPERS
// -------------------------------------------------------------------------
function playKick(ctx, time, dest) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.08);
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.25);
}

function playSnare(ctx, time, dest) {
    // Noise snap
    if (!proceduralNoiseBuffer) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
        proceduralNoiseBuffer = buf;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = proceduralNoiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, time);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);
    noise.start(time);
    noise.stop(time + 0.2);

    // Body tone
    const osc = ctx.createOscillator();
    const toneGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(60, time + 0.08);
    toneGain.gain.setValueAtTime(0.3, time);
    toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(toneGain);
    toneGain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.12);
}

function playHiHat(ctx, time, dest, isOpen = false) {
    if (!proceduralNoiseBuffer) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
        proceduralNoiseBuffer = buf;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = proceduralNoiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);
    const gain = ctx.createGain();
    const dur = isOpen ? 0.2 : 0.045;
    gain.gain.setValueAtTime(isOpen ? 0.25 : 0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + dur + 0.01);
}

function playSynthBass(ctx, freq, time, dur, dest, isLoFi = false) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    
    osc.type = isLoFi ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isLoFi ? 350 : 800, time);
    filter.frequency.exponentialRampToValueAtTime(isLoFi ? 150 : 250, time + dur);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + dur + 0.05);
}

function playMelodyNote(ctx, freq, time, dur, dest, isChime = false) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isChime ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(isChime ? 0.18 : 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + dur + 0.05);
}

// -------------------------------------------------------------------------
// MULTI-GENRE COMPOSITIONS (Lo-Fi Chill, Synthwave, Deep Drone, Space Ambience)
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
// HIGH-ENERGY ESPORTS PROCEDURAL MUSIC COMPOSITIONS
// -------------------------------------------------------------------------
function startProceduralMusic(trackType = 'track1') {
    stopProceduralMusic();
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        try { ctx.resume(); } catch (e) {}
    }

    synthGain = ctx.createGain();
    const volumeSlider = document.getElementById('music-volume');
    const volumeLevel = volumeSlider ? parseFloat(volumeSlider.value) : 0.4;
    synthGain.gain.setValueAtTime(Math.max(0.03, volumeLevel * 0.6), ctx.currentTime);
    synthGain.connect(ctx.destination);

    // Track 1: Lo-Fi Chill Beats (Key: F Major / D Minor)
    const loFiMelody = [349.23, 392.00, 440.00, 523.25, 587.33, 698.46, 587.33, 523.25, 440.00, 0, 392.00, 349.23, 440.00, 0, 523.25, 0];
    const loFiBass = [174.61, 0, 174.61, 0, 146.83, 0, 146.83, 0, 130.81, 0, 130.81, 0, 116.54, 0, 130.81, 0];

    // Track 2: Cyberpunk Synthwave (Key: A Minor, Driving 16th Arp)
    const synthwaveArp = [220.00, 261.63, 329.63, 440.00, 329.63, 261.63, 220.00, 261.63, 196.00, 246.94, 293.66, 392.00, 293.66, 246.94, 196.00, 246.94];
    const synthwaveBass = [55.00, 55.00, 110.00, 55.00, 55.00, 55.00, 110.00, 55.00, 49.00, 49.00, 98.00, 49.00, 43.65, 43.65, 87.31, 43.65];

    // Track 3: MPL Tournament Anthem (High Hype Stadium Dance, Key: C Minor / Eb Major)
    const anthemLead = [261.63, 311.13, 392.00, 523.25, 466.16, 392.00, 311.13, 392.00, 349.23, 392.00, 466.16, 523.25, 587.33, 523.25, 466.16, 392.00];
    const anthemChords = [261.63, 0, 261.63, 311.13, 233.08, 0, 233.08, 349.23, 207.65, 0, 207.65, 311.13, 233.08, 0, 261.63, 0];

    // Track 4: Neo Cyber Rush (Fast-Paced Electro / DnB, Key: E Minor)
    const dnbArp = [329.63, 392.00, 493.88, 587.33, 659.25, 493.88, 392.00, 493.88, 293.66, 369.99, 440.00, 587.33, 440.00, 369.99, 440.00, 493.88];
    const dnbBass = [82.41, 0, 82.41, 164.81, 0, 82.41, 0, 164.81, 73.42, 0, 73.42, 146.83, 0, 73.42, 0, 146.83];

    let step = 0;
    isSynthPlaying = true;
    isMusicPlaying = true;

    // Set tempo based on track genre
    let tempoMs = 180; // Lo-Fi
    if (trackType === 'track2') tempoMs = 130; // Synthwave
    if (trackType === 'track3') tempoMs = 125; // MPL Anthem (120 BPM)
    if (trackType === 'track4') tempoMs = 90;  // Neo Cyber Rush (166 BPM DnB feel)

    synthInterval = setInterval(() => {
        if (!isSynthPlaying || !audioCtx) return;
        try {
            const now = ctx.currentTime;
            const beatStep = step % 16;

            // 1. LO-FI CHILL
            if (trackType === 'track1') {
                if (beatStep === 0 || beatStep === 6 || beatStep === 10) playKick(ctx, now, synthGain);
                if (beatStep === 4 || beatStep === 12) playSnare(ctx, now, synthGain);
                if (beatStep % 2 === 0) playHiHat(ctx, now, synthGain, beatStep === 14);

                if (loFiBass[beatStep] > 0) playSynthBass(ctx, loFiBass[beatStep], now, 0.35, synthGain, true);
                if (loFiMelody[beatStep] > 0) playMelodyNote(ctx, loFiMelody[beatStep], now, 0.45, synthGain, true);
            } 
            // 2. SYNTHWAVE DRIVE
            else if (trackType === 'track2') {
                if (beatStep % 4 === 0) playKick(ctx, now, synthGain);
                if (beatStep === 4 || beatStep === 12) playSnare(ctx, now, synthGain);
                playHiHat(ctx, now, synthGain, beatStep % 4 === 2);

                playSynthBass(ctx, synthwaveBass[beatStep], now, 0.15, synthGain, false);
                playMelodyNote(ctx, synthwaveArp[beatStep], now, 0.12, synthGain, false);
            }
            // 3. MPL TOURNAMENT ANTHEM (Stadium EDM / Festival Vibe)
            else if (trackType === 'track3') {
                // Driving EDM 4-on-the-floor beat
                if (beatStep % 4 === 0) playKick(ctx, now, synthGain);
                if (beatStep === 4 || beatStep === 12) playSnare(ctx, now, synthGain);
                playHiHat(ctx, now, synthGain, beatStep % 2 === 1);

                // Punchy brass chord stab
                if (anthemChords[beatStep] > 0) {
                    playSynthBass(ctx, anthemChords[beatStep] / 2, now, 0.22, synthGain, false);
                }
                // Anthemic festival lead
                if (anthemLead[beatStep] > 0) {
                    playMelodyNote(ctx, anthemLead[beatStep], now, 0.18, synthGain, false);
                }
            }
            // 4. NEO CYBER RUSH (High-Octane Drum & Bass)
            else if (trackType === 'track4') {
                // Breakbeat drum pattern: Kick on 0, 10; Snare on 4, 12; rapid rolling hats
                if (beatStep === 0 || beatStep === 10) playKick(ctx, now, synthGain);
                if (beatStep === 4 || beatStep === 12) playSnare(ctx, now, synthGain);
                playHiHat(ctx, now, synthGain, beatStep % 4 === 2);

                // Reese rolling sub-bass
                if (dnbBass[beatStep] > 0) {
                    playSynthBass(ctx, dnbBass[beatStep], now, 0.11, synthGain, false);
                }
                // Fast arpeggiated synth run
                playMelodyNote(ctx, dnbArp[beatStep], now, 0.08, synthGain, false);
            }
            step++;
        } catch (e) {}
    }, tempoMs);
}

function stopProceduralMusic() {
    if (synthInterval) {
        clearInterval(synthInterval);
        synthInterval = null;
    }
    try {
        padOscs.forEach(p => {
            try { if (p.pad1) p.pad1.stop(); } catch (e) {}
            try { if (p.pad2) p.pad2.stop(); } catch (e) {}
            try { if (p.padGain) p.padGain.disconnect(); } catch (e) {}
        });
    } catch (e) {}
    padOscs = [];
    isSynthPlaying = false;
    isMusicPlaying = false;
}

function initMusicPlayer() {
    const btnToggle = document.getElementById('btn-toggle-music');
    const selectTrack = document.getElementById('music-track-select');
    const volumeSlider = document.getElementById('music-volume');

    btnToggle?.addEventListener('click', () => {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const selectedVal = selectTrack?.value || 'track1';
        if (selectedVal === 'none') {
            stopProceduralMusic();
            if (btnToggle) btnToggle.textContent = '▶ Play';
            return;
        }

        if (isMusicPlaying) {
            stopProceduralMusic();
            if (btnToggle) btnToggle.textContent = '▶ Play';
        } else {
            startProceduralMusic(selectedVal);
            if (btnToggle) btnToggle.textContent = '⏸ Pause';
        }
    });

    selectTrack?.addEventListener('change', () => {
        if (isMusicPlaying) {
            startProceduralMusic(selectTrack.value);
        }
    });

    volumeSlider?.addEventListener('input', (e) => {
        if (synthGain && audioCtx) {
            synthGain.gain.setValueAtTime(parseFloat(e.target.value) * 0.7, audioCtx.currentTime);
        }
    });
}

// =========================================================================
// IN-ROOM PVP CHAT CONTROLLER
// =========================================================================
function initChatController() {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatContainer = document.getElementById('chat-messages-container');

    chatForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput?.value.trim();
        if (!text) return;
        socket.emit('send_chat_message', { text });
        if (chatInput) chatInput.value = '';
    });

    socket.on('new_chat_message', (msg) => {
        if (!chatContainer) return;
        const msgDiv = document.createElement('div');
        const isMe = msg.senderTeam === currentAssignedTeam;
        const teamColor = msg.senderTeam === 'A' ? '#38bdf8' : (msg.senderTeam === 'B' ? '#f87171' : '#f59e0b');

        msgDiv.innerHTML = `
            <span style="font-size: 0.7rem; color: #64748b;">[${msg.timestamp}]</span>
            <strong style="color: ${teamColor};">Team ${msg.senderTeam}${isMe ? ' (You)' : ''}:</strong> 
            <span style="color: #f1f5f9;">${msg.text}</span>
        `;
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    });
}

// =========================================================================
// AUTHORITATIVE 30-SECOND TURN TIMER
// =========================================================================
function startTurnTimer() {
    clearInterval(turnTimerInterval);
    if (!draftState || draftState.isComplete || !draftState.started || window.currentRoomMode === 'auto_sim') {
        const timerClock = document.getElementById('turn-timer-clock');
        if (timerClock && draftState && draftState.isComplete) {
            timerClock.innerHTML = `⏱️ <span id="timer-seconds-display">0</span>s`;
            timerClock.style.color = '#64748b';
        }
        return;
    }

    const timerDisplay = document.getElementById('timer-seconds-display');
    const timerClock = document.getElementById('turn-timer-clock');

    function syncTick() {
        if (!draftState.turnExpiresAt) {
            remainingTurnSeconds = 30;
        } else {
            remainingTurnSeconds = Math.max(0, Math.ceil((draftState.turnExpiresAt - Date.now()) / 1000));
        }

        if (timerDisplay) timerDisplay.textContent = remainingTurnSeconds;
        if (timerClock) {
            if (remainingTurnSeconds <= 5) {
                timerClock.style.color = '#ef4444';
            } else if (remainingTurnSeconds <= 10) {
                timerClock.style.color = '#f59e0b';
            } else {
                timerClock.style.color = '#10b981';
            }
        }

        if (remainingTurnSeconds <= 5 && remainingTurnSeconds > 0) {
            playTickSound();
        }

        if (remainingTurnSeconds <= 0) {
            clearInterval(turnTimerInterval);
            playTimesUpSound();
        }
    }

    syncTick();
    turnTimerInterval = setInterval(syncTick, 1000);
}

// =========================================================================
// GLOBAL POST-DRAFT EVALUATION CONTROLLER (RELIABLE DISPLAY OVERRIDE)
// =========================================================================
window.forceOpenEvaluationModal = function(e) {
    if (e && e.preventDefault) {
        e.preventDefault();
        e.stopPropagation();
    }
    const modal = document.getElementById('post-draft-modal');
    if (!modal) return;
    
    showPostDraftEvaluation();
    
    modal.classList.remove('hidden');
    modal.classList.add('active-modal');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('opacity', '1', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
};

window.openPostDraftModal = window.forceOpenEvaluationModal;

window.closePostDraftModal = function() {
    const modal = document.getElementById('post-draft-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('active-modal');
    modal.style.setProperty('display', 'none', 'important');
    modal.style.setProperty('opacity', '0', 'important');
    modal.style.setProperty('visibility', 'hidden', 'important');
    modal.style.setProperty('pointer-events', 'none', 'important');
};

// Toast Notification
function showToast(message, type = 'error', durationMs = 3000) {
    const toast = document.getElementById('app-toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    if (toastIcon) {
        toastIcon.textContent = type === 'error' ? '⚠️' : (type === 'success' ? '✓' : 'ℹ️');
    }
    
    toast.className = `app-toast toast-${type}`;
    toast.classList.remove('hidden');

    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, durationMs);
}

function updateConnectionBadge(state) {
    const badge = document.getElementById('connection-status');
    const label = badge?.querySelector('.status-label');
    if (!badge || !label) return;

    badge.className = `status-badge ${state.toLowerCase()}`;
    label.textContent = state.toUpperCase();
}

function clearActiveRoomSession() {
    sessionStorage.removeItem('mlbb_active_room_id');
    currentRoomId = null;
}

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
    
    const assetKey = HERO_IMAGE_ALIASES[hero.id] || hero.id.replace(/_/g, '-');
    const cleanWikiName = name.replace(/\s+/g, '_').replace(/'/g, '%27');

    const primaryUrl = `https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/${encodeURIComponent(assetKey)}.png`;
    const secondaryUrl = `https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/${assetKey.replace(/'/g, '')}.png`;
    const wikiUrl = `https://mobile-legends.fandom.com/wiki/Special:FilePath/${cleanWikiName}.png`;
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
                    } else if (!this.dataset.triedWiki) {
                        this.dataset.triedWiki = 'true';
                        this.src = '${wikiUrl}';
                    }
                 " />
        </div>
    `;
}

// =========================================================================
// INITIALIZATION
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    setupScreen = document.getElementById('setup-screen');
    lobbyScreen = document.getElementById('lobby-screen');
    draftScreen = document.getElementById('draft-screen');

    connectionStatus = document.getElementById('connection-status');
    connDot = connectionStatus?.querySelector('.status-dot');
    connLabel = connectionStatus?.querySelector('.status-label');

    btnModeAi = document.getElementById('btn-mode-ai');
    btnModeSim = document.getElementById('btn-mode-sim');
    btnModeCreate = document.getElementById('btn-mode-create');
    btnModeJoin = document.getElementById('btn-mode-join');
    joinInputGroup = document.getElementById('join-input-group');
    roomIdInput = document.getElementById('room-id-input');
    btnEnterRoom = document.getElementById('btn-enter-room');

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
    btnReopenEval = document.getElementById('btn-reopen-eval');
    resetStatusBanner = document.getElementById('reset-status-banner');

    timelineStrip = document.getElementById('timeline-strip');
    recommendationPanel = document.getElementById('recommendation-panel');
    recTitleText = document.getElementById('rec-title-text');
    recChipsContainer = document.getElementById('rec-chips-container');

    heroSearchInput = document.getElementById('hero-search');
    filterPillsContainer = document.getElementById('filterPillsContainer');
    modeLaneBtn = document.getElementById('modeLaneBtn');
    modeRoleBtn = document.getElementById('modeRoleBtn');
    heroGrid = document.getElementById('hero-grid');

    draftLogList = document.getElementById('draft-log-list');
    btnManualReset = document.getElementById('btn-manual-reset');
    btnLeaveRoom = document.getElementById('btn-leave-room');
    pvpChatCard = document.getElementById('pvp-chat-card');

    resetConfirmModal = document.getElementById('reset-confirm-modal');
    resetRequestText = document.getElementById('reset-request-text');
    btnAcceptReset = document.getElementById('btn-accept-reset');
    btnDeclineReset = document.getElementById('btn-decline-reset');

    postDraftModal = document.getElementById('post-draft-modal');
    btnCloseModal = document.getElementById('btn-close-modal');
    btnRematch = document.getElementById('btn-rematch');
    btnNewDraft = document.getElementById('btn-new-draft');
    btnReturnLobby = document.getElementById('btn-return-lobby');

    historyModal = document.getElementById('history-modal');
    btnViewHistory = document.getElementById('btn-view-history');
    btnCloseHistory = document.getElementById('btn-close-history');
    historyListContainer = document.getElementById('history-list-container');

    disconnectModal = document.getElementById('disconnect-modal');
    disconnectCountdown = document.getElementById('disconnect-countdown');
    btnLeaveNow = document.getElementById('btn-leave-now');

    initSetupListeners();
    initDraftListeners();
    initDualFilterSystem();
    initMusicPlayer();
    initChatController();
    buildTimelineTrack();
    renderFilterPills();
    buildInitialHeroGrid();
});

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
                showToast('Please enter a 6-character room code.', 'error');
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
            updateHeroGridState();
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
            updateHeroGridState();
        });
    }

    if (heroSearchInput) {
        heroSearchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.trim();
            if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                updateHeroGridState();
            }, 150);
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
            updateHeroGridState();
        });

        filterPillsContainer.appendChild(btn);
    });
}

function buildInitialHeroGrid() {
    if (!heroGrid) return;
    heroGrid.innerHTML = '';
    heroCardNodeCache.clear();

    const fragment = document.createDocumentFragment();

    HERO_DATASET.forEach(hero => {
        const card = document.createElement('div');
        card.className = 'hero-card';
        card.dataset.heroId = hero.id;

        const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
        const classes = (typeof getHeroClasses === 'function') ? getHeroClasses(hero) : (hero.heroClass || []);

        card.dataset.name = hero.name.toLowerCase();
        card.dataset.lanes = lanes.join(',').toLowerCase();
        card.dataset.classes = classes.join(',').toLowerCase();

        const displayTags = (currentFilterMode === 'lane') ? lanes : classes;
        const tagsHtml = displayTags.map(t => `<span class="tag-badge">${t}</span>`).join('');

        card.innerHTML = `
            ${createHeroAvatarHTML(hero, 'card-avatar')}
            <div class="card-info">
                <span class="card-name">${hero.name}</span>
                <div class="card-tags">${tagsHtml}</div>
            </div>
        `;

        card.addEventListener('click', () => {
            if (card.classList.contains('disabled') || isSubmittingAction) return;
            const heroId = card.dataset.heroId;
            if (!heroId || isHeroUnavailable(heroId)) return;

            playClickSound();
            isSubmittingAction = true;
            socket.emit('select_hero', { heroId: heroId });
        });

        heroCardNodeCache.set(hero.id, card);
        fragment.appendChild(card);
    });

    heroGrid.appendChild(fragment);
    updateHeroGridState();
}

function updateHeroGridState() {
    if (heroCardNodeCache.size === 0) return;

    const query = currentSearchQuery.toLowerCase();
    const filterKey = currentCategoryFilter.toLowerCase();
    const isSimMode = window.currentRoomMode === 'auto_sim';
    const isComplete = (typeof draftState !== 'undefined' && draftState) ? draftState.isComplete : false;

    let recommendedIdSet = new Set();
    if (!isComplete && !isSimMode && typeof getRecommendations === 'function') {
        const recData = getRecommendations();
        if (recData && Array.isArray(recData.list)) {
            recData.list.forEach(h => {
                if (h && h.id) recommendedIdSet.add(h.id);
            });
        }
    }

    heroCardNodeCache.forEach((card, heroId) => {
        const matchesName = !query || card.dataset.name.includes(query);
        let matchesCategory = (filterKey === 'all');

        if (!matchesCategory) {
            if (currentFilterMode === 'lane') {
                matchesCategory = card.dataset.lanes.includes(filterKey);
            } else {
                matchesCategory = card.dataset.classes.includes(filterKey);
            }
        }

        if (!matchesName || !matchesCategory) {
            card.style.display = 'none';
            return;
        }
        card.style.display = 'flex';

        const hero = HERO_DATASET.find(h => h.id === heroId);
        const tagsContainer = card.querySelector('.card-tags');
        if (tagsContainer && hero) {
            const displayTags = (currentFilterMode === 'lane')
                ? ((typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []))
                : ((typeof getHeroClasses === 'function') ? getHeroClasses(hero) : (hero.heroClass || []));
            tagsContainer.innerHTML = displayTags.map(t => `<span class="tag-badge">${t}</span>`).join('');
        }

        const unavailable = isHeroUnavailable(heroId);
        const shouldDisable = unavailable || isComplete || isSimMode;
        const isRecommended = recommendedIdSet.has(heroId) && !shouldDisable;

        let recBadge = card.querySelector('.rec-badge');

        if (shouldDisable) {
            card.classList.add('disabled');
            card.classList.remove('recommended');
            if (recBadge) recBadge.remove();
        } else {
            card.classList.remove('disabled');
            if (isRecommended) {
                card.classList.add('recommended');
                if (!recBadge) {
                    const badge = document.createElement('span');
                    badge.className = 'rec-badge';
                    badge.textContent = 'REC';
                    card.prepend(badge);
                }
            } else {
                card.classList.remove('recommended');
                if (recBadge) recBadge.remove();
            }
        }
    });
}

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

function initDraftListeners() {
    btnCopyCode?.addEventListener('click', () => {
        if (!currentRoomId) return;
        navigator.clipboard.writeText(currentRoomId).then(() => {
            copyToast?.classList.remove('hidden');
            setTimeout(() => copyToast?.classList.add('hidden'), 2000);
        });
    });

    btnToggleReady?.addEventListener('click', () => socket.emit('toggle_ready'));

    btnLobbyLeave?.addEventListener('click', () => {
        clearActiveRoomSession();
        socket.emit('leave_room');
        window.location.reload();
    });

    btnLeaveRoom?.addEventListener('click', () => {
        clearActiveRoomSession();
        socket.emit('leave_room');
        window.location.reload();
    });

    btnLeaveNow?.addEventListener('click', () => {
        clearActiveRoomSession();
        window.location.reload();
    });

    btnReturnLobby?.addEventListener('click', () => {
        clearActiveRoomSession();
        socket.emit('leave_room');
        window.location.reload();
    });

    btnSimStep?.addEventListener('click', () => socket.emit('sim_step'));
    btnSimAuto?.addEventListener('click', () => socket.emit('sim_start_auto'));
    btnSimPause?.addEventListener('click', () => socket.emit('sim_pause_auto'));
    btnSimReset?.addEventListener('click', () => socket.emit('request_reset'));
    btnManualReset?.addEventListener('click', () => socket.emit('request_reset'));

    btnAcceptReset?.addEventListener('click', () => {
        socket.emit('respond_reset', { approved: true });
        resetConfirmModal?.classList.add('hidden');
    });
    btnDeclineReset?.addEventListener('click', () => {
        socket.emit('respond_reset', { approved: false });
        resetConfirmModal?.classList.add('hidden');
    });

    btnCloseModal?.addEventListener('click', () => {
        window.closePostDraftModal();
    });

    btnRematch?.addEventListener('click', () => {
        window.closePostDraftModal();
        socket.emit('request_rematch');
    });

    btnNewDraft?.addEventListener('click', () => {
        window.closePostDraftModal();
        socket.emit('request_reset');
    });

    btnViewHistory?.addEventListener('click', () => {
        socket.emit('get_draft_history');
        historyModal?.classList.remove('hidden');
    });

    btnCloseHistory?.addEventListener('click', () => {
        historyModal?.classList.add('hidden');
    });

    btnReopenEval?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.openPostDraftModal();
    });
}

function syncStagingLobbyUI(roomPayload) {
    const { roomId, players, status } = roomPayload;
    if (lobbyRoomCode) lobbyRoomCode.textContent = roomId || '------';

    if (players?.A) {
        lobbyPlayerAName.textContent = (currentAssignedTeam === 'A') ? 'Host (You)' : 'Player A';
        lobbyPlayerAStatus.textContent = players.A.ready ? 'READY' : 'WAITING';
        lobbyPlayerAStatus.className = `slot-status-badge ${players.A.ready ? 'ready' : 'waiting'}`;
    } else {
        lobbyPlayerAName.textContent = 'Waiting for Host...';
        lobbyPlayerAStatus.textContent = 'WAITING';
        lobbyPlayerAStatus.className = 'slot-status-badge waiting';
    }

    if (players?.B) {
        lobbyPlayerBName.textContent = (currentAssignedTeam === 'B') ? 'Player B (You)' : 'Opponent';
        lobbyPlayerBStatus.textContent = players.B.ready ? 'READY' : 'WAITING';
        lobbyPlayerBStatus.className = `slot-status-badge ${players.B.ready ? 'ready' : 'waiting'}`;
    } else {
        lobbyPlayerBName.textContent = 'Waiting for Player...';
        lobbyPlayerBStatus.textContent = 'WAITING';
        lobbyPlayerBStatus.className = 'slot-status-badge waiting';
    }

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

    if (roomDisplayTag) roomDisplayTag.textContent = `ROOM: ${roomId || '------'}`;

    if (simControlBar) {
        if (mode === 'auto_sim') {
            simControlBar.classList.remove('hidden');
        } else {
            simControlBar.classList.add('hidden');
        }
    }

    if (pvpChatCard) {
        if (mode === 'pvp') {
            pvpChatCard.classList.remove('hidden');
            pvpChatCard.style.display = 'flex';
        } else {
            pvpChatCard.classList.add('hidden');
            pvpChatCard.style.display = 'none';
        }
    }

    renderBanChips(blueBans, draftState.bans?.A || []);
    renderBanChips(redBans, draftState.bans?.B || []);

    renderPickList(bluePicks, draftState.picks?.A || [], 'A');
    renderPickList(redPicks, draftState.picks?.B || [], 'B');

    updateAnnouncerHeadline(status, mode);
    renderRecommendations();
    updateTimelineUI();
    updateHeroGridState();
    renderActionLogs();

    if (draftState.isComplete) {
        clearInterval(turnTimerInterval);
        showPostDraftEvaluation();
    } else if (draftState.started) {
        startTurnTimer();
    }
}

function renderBanChips(container, bans) {
    if (!container) return;
    container.innerHTML = '';

    const safeBans = (bans || []).filter(Boolean);

    if (safeBans.length === 0) {
        container.innerHTML = '<span class="empty-ban-text" style="color:#64748b; font-size:0.75rem;">None</span>';
        return;
    }

    safeBans.forEach(hero => {
        const chip = document.createElement('div');
        if (hero.isSkipped || hero.id === 'skipped' || hero.name === 'None (Timeout)') {
            chip.className = 'ban-badge skipped-ban';
            chip.innerHTML = `<span>🚫 Skipped</span>`;
        } else {
            chip.className = 'ban-badge';
            chip.innerHTML = `
                <div class="ban-avatar-box">
                    ${createHeroAvatarHTML(hero, 'ban-avatar-img')}
                </div>
                <span class="ban-hero-name">${hero.name}</span>
            `;
        }
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

    const isComplete = draftState && draftState.isComplete;

    if (isComplete) {
        turnBannerText.textContent = 'DRAFT COMPLETE';
        phaseBannerText.classList.add('hidden');
        if (btnReopenEval) {
            btnReopenEval.classList.remove('hidden');
        }
        return;
    }

    // STRICT: Keep evaluation button hidden during the active draft
    if (btnReopenEval) {
        btnReopenEval.classList.add('hidden');
    }

    phaseBannerText.classList.remove('hidden');
    phaseBannerText.className = 'phase-badge';

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
            playClickSound();
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
    const modal = document.getElementById('post-draft-modal');
    if (!modal) return;

    const state = (typeof draftState !== 'undefined' && draftState) ? draftState : currentDraftState;
    if (!state) return;

    const picksA = (state.picks?.A || []).filter(h => h && h.id && !h.isSkipped);
    const bansA = (state.bans?.A || []).filter(h => h && h.id && !h.isSkipped);
    const picksB = (state.picks?.B || []).filter(h => h && h.id && !h.isSkipped);
    const bansB = (state.bans?.B || []).filter(h => h && h.id && !h.isSkipped);

    let evalResult;
    try {
        if (typeof evaluateDraftComparison === 'function') {
            evalResult = evaluateDraftComparison(picksA, bansA, picksB, bansB);
        } else {
            evalResult = { scoreA: 80, scoreB: 80, categories: [] };
        }
    } catch (err) {
        console.warn('Evaluation fallback engaged:', err);
        evalResult = { scoreA: 80, scoreB: 80, categories: [] };
    }

    const scoreAEl = document.getElementById('eval-score-a');
    const scoreBEl = document.getElementById('eval-score-b');
    const tagAEl = document.getElementById('advantage-tag-a');
    const tagBEl = document.getElementById('advantage-tag-b');

    if (scoreAEl) scoreAEl.textContent = evalResult.scoreA || 0;
    if (scoreBEl) scoreBEl.textContent = evalResult.scoreB || 0;

    // Neutral, non-predictive draft advantage phrasing (Never says "Team A will win")
    if (evalResult.scoreA > evalResult.scoreB) {
        if (tagAEl) { tagAEl.textContent = 'Draft Advantage'; tagAEl.className = 'score-advantage-tag active'; }
        if (tagBEl) { tagBEl.textContent = 'Evenly Matched'; tagBEl.className = 'score-advantage-tag'; }
    } else if (evalResult.scoreB > evalResult.scoreA) {
        if (tagBEl) { tagBEl.textContent = 'Draft Advantage'; tagBEl.className = 'score-advantage-tag active'; }
        if (tagAEl) { tagAEl.textContent = 'Evenly Matched'; tagAEl.className = 'score-advantage-tag'; }
    } else {
        if (tagAEl) { tagAEl.textContent = 'Evenly Matched'; tagAEl.className = 'score-advantage-tag'; }
        if (tagBEl) { tagBEl.textContent = 'Evenly Matched'; tagBEl.className = 'score-advantage-tag'; }
    }

    const matrixContainer = document.getElementById('comparison-matrix-list');
    if (matrixContainer && Array.isArray(evalResult.categories)) {
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

    const picksAContainer = document.getElementById('lineup-picks-a');
    const bansAContainer = document.getElementById('lineup-bans-a');
    const picksBContainer = document.getElementById('lineup-picks-b');
    const bansBContainer = document.getElementById('lineup-bans-b');

    if (picksAContainer) picksAContainer.innerHTML = picksA.map(h => createHeroAvatarHTML(h, 'lineup-avatar')).join('');
    if (bansAContainer) bansAContainer.innerHTML = `<span class="sub-label">Bans:</span> ` + (bansA.map(h => `<span class="lineup-ban-name">${h.name}</span>`).join(', ') || 'None');
    if (picksBContainer) picksBContainer.innerHTML = picksB.map(h => createHeroAvatarHTML(h, 'lineup-avatar')).join('');
    if (bansBContainer) bansBContainer.innerHTML = `<span class="sub-label">Bans:</span> ` + (bansB.map(h => `<span class="lineup-ban-name">${h.name}</span>`).join(', ') || 'None');

    modal.classList.remove('hidden');
    modal.classList.add('active-modal');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('opacity', '1', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
}

// Sockets
socket.on('connect', () => {
    updateConnectionBadge('CONNECTED');
    const activeRoom = sessionStorage.getItem('mlbb_active_room_id');
    if (activeRoom) {
        socket.emit('join_room', { targetRoomId: activeRoom, playerToken: clientPlayerToken });
    }
});

socket.on('disconnect', () => {
    updateConnectionBadge('DISCONNECTED');
    clearInterval(turnTimerInterval);
    showToast('Disconnected from server. Reconnecting...', 'error');
});

socket.io.on('reconnect_attempt', () => {
    updateConnectionBadge('RECONNECTING');
});

socket.io.on('reconnect', () => {
    updateConnectionBadge('CONNECTED');
    showToast('Reconnected to draft arena.', 'success');
    const activeRoom = sessionStorage.getItem('mlbb_active_room_id');
    if (activeRoom) {
        socket.emit('join_room', { targetRoomId: activeRoom, playerToken: clientPlayerToken });
    }
});

socket.io.on('reconnect_failed', () => {
    updateConnectionBadge('DISCONNECTED');
    showToast('Failed to reconnect. Please check your internet connection.', 'error');
});

socket.on('room_created', (data) => {
    currentRoomId = data.roomId;
    sessionStorage.setItem('mlbb_active_room_id', data.roomId);
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
    sessionStorage.setItem('mlbb_active_room_id', data.roomId);
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
                    <strong style="color: #38bdf8;">Team A Picks:</strong> ${entry.picks.A.filter(Boolean).map(h => h.name).join(', ') || 'None'}<br/>
                    <strong style="color: #64748b;">Team A Bans:</strong> ${entry.bans.A.filter(Boolean).map(h => h.name).join(', ') || 'None'}
                </div>
                <div>
                    <strong style="color: #f87171;">Team B Picks:</strong> ${entry.picks.B.filter(Boolean).map(h => h.name).join(', ') || 'None'}<br/>
                    <strong style="color: #64748b;">Team B Bans:</strong> ${entry.bans.B.filter(Boolean).map(h => h.name).join(', ') || 'None'}
                </div>
            </div>
        `;

        container.appendChild(card);
    });
});

socket.on('app_error', (data) => {
    isSubmittingAction = false;
    showToast(data.message || 'Action rejected by server.', 'error');
});

socket.on('room_error', (data) => {
    clearActiveRoomSession();
    showToast(data.message || 'Room error occurred.', 'error');
    showScreen('setup-screen');
});

socket.on('draft_error', (data) => {
    isSubmittingAction = false;
    showToast(data.message || 'Invalid draft action.', 'error');
});

socket.on('reset_requested', () => {
    resetConfirmModal?.classList.remove('hidden');
    resetConfirmModal?.classList.add('active-modal');
    resetConfirmModal?.style.setProperty('display', 'flex', 'important');
});

socket.on('reset_declined', (data) => {
    showToast(data.message || 'Reset request was declined.', 'error');
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
    showToast('Opponent reconnected to the draft room.', 'success');
});

socket.on('room_dismissed', (data) => {
    clearActiveRoomSession();
    clearInterval(turnTimerInterval);
    if (disconnectInterval) clearInterval(disconnectInterval);
    alert(data.message || 'Room was closed.');
    window.location.reload();
});