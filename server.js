const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const { HERO_DATASET, getHeroLanes, getHeroPickRate, getHeroBanRate } = require('./public/js/hero-data.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

// Configuration Constants
const AI_DECISION_DELAY_MS = 1000;
const SIM_AUTO_INTERVAL_MS = 1000;
const PVP_DISCONNECT_TIMEOUT_MS = 30000; // 30s reconnect window
const ROOM_INACTIVITY_EXPIRY_MS = 30 * 60 * 1000; // 30m idle TTL
const EMPTY_ROOM_EXPIRY_MS = 60 * 1000; // 60s cleanup if empty

// 20-Step Draft Sequence Rules
const DRAFT_SEQUENCE = [
    { turn: 1,  phase: 'Ban Phase 1',  action: 'ban',  team: 'A' },
    { turn: 2,  phase: 'Ban Phase 1',  action: 'ban',  team: 'B' },
    { turn: 3,  phase: 'Ban Phase 1',  action: 'ban',  team: 'A' },
    { turn: 4,  phase: 'Ban Phase 1',  action: 'ban',  team: 'B' },
    { turn: 5,  phase: 'Ban Phase 1',  action: 'ban',  team: 'A' },
    { turn: 6,  phase: 'Ban Phase 1',  action: 'ban',  team: 'B' },

    { turn: 7,  phase: 'Pick Phase 1', action: 'pick', team: 'A' },
    { turn: 8,  phase: 'Pick Phase 1', action: 'pick', team: 'B' },
    { turn: 9,  phase: 'Pick Phase 1', action: 'pick', team: 'B' },
    { turn: 10, phase: 'Pick Phase 1', action: 'pick', team: 'A' },
    { turn: 11, phase: 'Pick Phase 1', action: 'pick', team: 'A' },
    { turn: 12, phase: 'Pick Phase 1', action: 'pick', team: 'B' },

    { turn: 13, phase: 'Ban Phase 2',  action: 'ban',  team: 'B' },
    { turn: 14, phase: 'Ban Phase 2',  action: 'ban',  team: 'A' },
    { turn: 15, phase: 'Ban Phase 2',  action: 'ban',  team: 'B' },
    { turn: 16, phase: 'Ban Phase 2',  action: 'ban',  team: 'A' },

    { turn: 17, phase: 'Pick Phase 2', action: 'pick', team: 'B' },
    { turn: 18, phase: 'Pick Phase 2', action: 'pick', team: 'A' },
    { turn: 19, phase: 'Pick Phase 2', action: 'pick', team: 'A' },
    { turn: 20, phase: 'Pick Phase 2', action: 'pick', team: 'B' }
];

// In-Memory State Storage
const activeRooms = {};
const temporaryDraftHistory = [];

// =========================================================================
// UTILITIES & FACTORY HELPERS
// =========================================================================

function sanitizeString(input, maxLen = 20) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[^a-zA-Z0-9_-]/g, '').substring(0, maxLen);
}

function generateUniqueRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    do {
        result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (activeRooms[result]);
    return result;
}

function createFreshDraftState(currentVersion = 1) {
    return {
        version: currentVersion,
        currentTurnIndex: 0,
        isComplete: false,
        started: false,
        bans: { A: [], B: [] },
        picks: { A: [], B: [] },
        draftLog: []
    };
}

function getRoomPlayersSummary(room) {
    return {
        A: room.players.A ? { connected: !!room.players.A.connected, ready: !!room.players.A.ready } : null,
        B: room.players.B ? { connected: !!room.players.B.connected, ready: !!room.players.B.ready } : null
    };
}

function recordCompletedDraft(room) {
    if (!room || !room.draftState || !room.draftState.isComplete) return;

    const historyEntry = {
        id: 'HIST_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        roomId: room.roomId,
        mode: room.mode,
        completedAt: new Date().toISOString(),
        bans: {
            A: [...(room.draftState.bans?.A || [])],
            B: [...(room.draftState.bans?.B || [])]
        },
        picks: {
            A: [...(room.draftState.picks?.A || [])],
            B: [...(room.draftState.picks?.B || [])]
        },
        draftLog: [...(room.draftState.draftLog || [])]
    };

    temporaryDraftHistory.unshift(historyEntry);
    if (temporaryDraftHistory.length > 30) temporaryDraftHistory.pop();
}

function destroyRoom(roomId, reason = 'Room closed.') {
    const room = activeRooms[roomId];
    if (!room) return;

    if (room.simInterval) clearInterval(room.simInterval);
    if (room.aiTimer) clearTimeout(room.aiTimer);
    if (room.cleanupTimer) clearTimeout(room.cleanupTimer);

    io.to(roomId).emit('room_dismissed', { message: reason });
    delete activeRooms[roomId];
    console.log(`[ROOM PURGED] ${roomId} — Reason: ${reason}`);
}

function performRoomReset(room, roomId) {
    room.lastActivity = Date.now();
    room.generationId = (room.generationId || 1) + 1;
    room.pendingResetBy = null;

    if (room.simInterval) {
        clearInterval(room.simInterval);
        room.simInterval = null;
    }
    if (room.aiTimer) {
        clearTimeout(room.aiTimer);
        room.aiTimer = null;
    }

    const nextVersion = ((room.draftState && room.draftState.version) || 0) + 10;
    room.draftState = createFreshDraftState(nextVersion);

    if (room.mode === 'pvp') {
        room.status = 'ready';
        room.draftState.started = false;
        if (room.players.A) room.players.A.ready = false;
        if (room.players.B) room.players.B.ready = false;
    } else {
        room.status = 'drafting';
        room.draftState.started = true;
    }

    io.to(roomId).emit('draft_updated', {
        roomId: roomId,
        draftState: room.draftState,
        status: room.status,
        mode: room.mode,
        players: getRoomPlayersSummary(room),
        isReset: true
    });
}

// =========================================================================
// AI ENGINE DECISION LOGIC
// =========================================================================

function selectWeightedRandomHero(heroList, weightCalculator) {
    if (!heroList || heroList.length === 0) return null;
    const weights = heroList.map(h => Math.max(0.1, weightCalculator(h)));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let randomRoll = Math.random() * totalWeight;

    for (let i = 0; i < heroList.length; i++) {
        randomRoll -= weights[i];
        if (randomRoll <= 0) return heroList[i];
    }
    return heroList[0];
}

function computeAIMoveForTeam(draftState, activeTeam) {
    const currentTurn = DRAFT_SEQUENCE[draftState.currentTurnIndex];
    if (!currentTurn) return null;

    const allBannedIds = [...draftState.bans.A, ...draftState.bans.B].map(h => h.id);
    const allPickedIds = [...draftState.picks.A, ...draftState.picks.B].map(h => h.id);
    const availableHeroes = HERO_DATASET.filter(h => !allBannedIds.includes(h.id) && !allPickedIds.includes(h.id));

    if (availableHeroes.length === 0) return null;

    if (currentTurn.action === 'ban') {
        return selectWeightedRandomHero(availableHeroes, h => getHeroBanRate(h));
    }

    const ALL_LANES = ['EXP', 'Jungle', 'Mid', 'Gold', 'Roam'];
    const teamCoveredLanes = new Set();
    draftState.picks[activeTeam].forEach(hero => {
        getHeroLanes(hero).forEach(l => teamCoveredLanes.add(l));
    });
    const neededLanes = ALL_LANES.filter(l => !teamCoveredLanes.has(l));

    let candidateHeroes = availableHeroes;
    if (neededLanes.length > 0) {
        const laneCandidates = availableHeroes.filter(hero => {
            const lanes = getHeroLanes(hero);
            return lanes.some(lane => neededLanes.includes(lane));
        });
        if (laneCandidates.length > 0) candidateHeroes = laneCandidates;
    }

    return selectWeightedRandomHero(candidateHeroes, h => {
        if (neededLanes.length > 0) {
            const matchedLane = neededLanes.find(l => h.roles && h.roles[l]);
            if (matchedLane) return h.roles[matchedLane].pickRate;
        }
        return getHeroPickRate(h);
    });
}

function executeDraftStep(roomId) {
    const room = activeRooms[roomId];
    if (!room) return false;
    room.lastActivity = Date.now();
    const draft = room.draftState;
    if (draft.isComplete || draft.currentTurnIndex >= DRAFT_SEQUENCE.length) return false;

    const currentTurn = DRAFT_SEQUENCE[draft.currentTurnIndex];
    const selectedHero = computeAIMoveForTeam(draft, currentTurn.team);
    if (!selectedHero) return false;

    if (currentTurn.action === 'ban') {
        draft.bans[currentTurn.team].push(selectedHero);
    } else {
        draft.picks[currentTurn.team].push(selectedHero);
    }

    draft.draftLog.push({
        turn: currentTurn.turn,
        phase: currentTurn.phase,
        team: currentTurn.team,
        action: currentTurn.action,
        hero: selectedHero.name
    });

    draft.currentTurnIndex++;
    draft.version = (draft.version || 0) + 1;

    if (draft.currentTurnIndex >= DRAFT_SEQUENCE.length) {
        draft.isComplete = true;
        room.status = 'completed';
        if (room.simInterval) {
            clearInterval(room.simInterval);
            room.simInterval = null;
        }
        recordCompletedDraft(room);
    }

    io.to(roomId).emit('draft_updated', {
        roomId: roomId,
        draftState: draft,
        status: room.status,
        mode: room.mode,
        players: getRoomPlayersSummary(room)
    });

    return true;
}

function processAITurnIfNecessary(roomId) {
    const room = activeRooms[roomId];
    if (!room || room.mode !== 'vs_ai') return;
    const draft = room.draftState;
    if (draft.isComplete || draft.currentTurnIndex >= DRAFT_SEQUENCE.length) return;

    const currentTurn = DRAFT_SEQUENCE[draft.currentTurnIndex];
    if (currentTurn && currentTurn.team === 'B') {
        const generation = room.generationId;

        if (room.aiTimer) clearTimeout(room.aiTimer);
        room.aiTimer = setTimeout(() => {
            if (!activeRooms[roomId] || room.generationId !== generation || draft.isComplete) return;

            const success = executeDraftStep(roomId);
            if (success) processAITurnIfNecessary(roomId);
        }, AI_DECISION_DELAY_MS);
    }
}

// =========================================================================
// SCHEDULED GARBAGE COLLECTION (INACTIVITY CLEANUP)
// =========================================================================
setInterval(() => {
    const now = Date.now();
    Object.keys(activeRooms).forEach(roomId => {
        const room = activeRooms[roomId];
        const isIdleTooLong = now - room.lastActivity > ROOM_INACTIVITY_EXPIRY_MS;
        const noPlayersConnected = (!room.players.A || !room.players.A.connected) && (!room.players.B || !room.players.B.connected);

        if (isIdleTooLong) {
            destroyRoom(roomId, 'Room expired due to inactivity.');
        } else if (noPlayersConnected && now - room.lastActivity > EMPTY_ROOM_EXPIRY_MS) {
            destroyRoom(roomId, 'Empty room auto-cleaned.');
        }
    });
}, 60000);

// =========================================================================
// SOCKET CONNECTION & EVENT HANDLERS
// =========================================================================

io.on('connection', (socket) => {
    function sendClientError(message, eventName = 'app_error') {
        socket.emit(eventName, { message });
    }

    // 1. CREATE ROOM
    socket.on('create_room', (payload) => {
        try {
            if (!payload || typeof payload !== 'object') {
                return sendClientError('Invalid room creation payload.', 'room_error');
            }

            const playerToken = sanitizeString(payload.playerToken, 32);
            const mode = ['pvp', 'vs_ai', 'auto_sim'].includes(payload.mode) ? payload.mode : 'vs_ai';
            const roomId = generateUniqueRoomId();

            activeRooms[roomId] = {
                roomId: roomId,
                mode: mode,
                hostToken: playerToken,
                createdAt: Date.now(),
                lastActivity: Date.now(),
                generationId: 1,
                pendingResetBy: null,
                cleanupTimer: null,
                players: {
                    A: mode === 'auto_sim'
                        ? { socketId: 'AI_A', playerToken: 'AI_A', connected: true, ready: true }
                        : { socketId: socket.id, playerToken, connected: true, ready: mode !== 'pvp' },
                    B: mode === 'pvp'
                        ? null
                        : { socketId: 'AI_B', playerToken: 'AI_B', connected: true, ready: true }
                },
                status: mode === 'pvp' ? 'waiting' : 'drafting',
                simInterval: null,
                aiTimer: null,
                draftState: createFreshDraftState(1)
            };

            if (mode !== 'pvp') {
                activeRooms[roomId].draftState.started = true;
            }

            socket.join(roomId);
            socket.currentRoomId = roomId;
            socket.assignedTeam = mode === 'auto_sim' ? 'SPEC' : 'A';
            socket.playerToken = playerToken;

            // Direct emission to creator (Prevents redundant broadcast)
            socket.emit('room_created', {
                roomId: roomId,
                yourTeam: socket.assignedTeam,
                mode: mode,
                status: activeRooms[roomId].status,
                draftState: activeRooms[roomId].draftState,
                players: getRoomPlayersSummary(activeRooms[roomId])
            });

        } catch (err) {
            console.error(`[CREATE_ROOM ERROR] Socket ${socket.id}:`, err);
            sendClientError('Failed to create match room.', 'room_error');
        }
    });

    // 2. JOIN ROOM
    socket.on('join_room', (payload) => {
        try {
            if (!payload || typeof payload !== 'object') {
                return sendClientError('Invalid room join request.', 'room_error');
            }

            const cleanRoomId = sanitizeString(payload.targetRoomId, 6).toUpperCase();
            const playerToken = sanitizeString(payload.playerToken, 32);
            const room = activeRooms[cleanRoomId];

            if (!room) {
                return sendClientError(`Room '${cleanRoomId}' not found or expired.`, 'room_error');
            }

            room.lastActivity = Date.now();

            // Reconnect Auto-Sim Spectator
            if (room.mode === 'auto_sim') {
                socket.join(cleanRoomId);
                socket.currentRoomId = cleanRoomId;
                socket.assignedTeam = 'SPEC';
                socket.playerToken = playerToken;

                socket.emit('room_joined', {
                    roomId: cleanRoomId,
                    yourTeam: 'SPEC',
                    mode: room.mode,
                    status: room.status,
                    draftState: room.draftState,
                    players: getRoomPlayersSummary(room)
                });
                return;
            }

            // Seat Resumption for Existing Players
            let existingTeam = null;
            if (room.players.A && room.players.A.playerToken === playerToken) existingTeam = 'A';
            if (room.players.B && room.players.B.playerToken === playerToken) existingTeam = 'B';

            if (existingTeam) {
                if (room.cleanupTimer) {
                    clearTimeout(room.cleanupTimer);
                    room.cleanupTimer = null;
                }

                room.players[existingTeam].socketId = socket.id;
                room.players[existingTeam].connected = true;

                socket.join(cleanRoomId);
                socket.currentRoomId = cleanRoomId;
                socket.assignedTeam = existingTeam;
                socket.playerToken = playerToken;

                socket.emit('room_joined', {
                    roomId: cleanRoomId,
                    yourTeam: existingTeam,
                    mode: room.mode,
                    status: room.status,
                    draftState: room.draftState,
                    players: getRoomPlayersSummary(room)
                });

                socket.to(cleanRoomId).emit('player_reconnected', {
                    team: existingTeam,
                    players: getRoomPlayersSummary(room)
                });

                socket.to(cleanRoomId).emit('draft_updated', {
                    roomId: cleanRoomId,
                    draftState: room.draftState,
                    status: room.status,
                    mode: room.mode,
                    players: getRoomPlayersSummary(room)
                });
                return;
            }

            // 2-Player Enclosure Check
            if (room.mode !== 'pvp' || (room.players.A && room.players.B)) {
                return sendClientError('Access Denied: Room is already full (Max 2 players).', 'room_error');
            }

            // Assign Seat B
            room.players.B = { socketId: socket.id, playerToken: playerToken, connected: true, ready: false };
            room.status = 'ready';

            socket.join(cleanRoomId);
            socket.currentRoomId = cleanRoomId;
            socket.assignedTeam = 'B';
            socket.playerToken = playerToken;

            socket.emit('room_joined', {
                roomId: cleanRoomId,
                yourTeam: 'B',
                mode: room.mode,
                status: room.status,
                draftState: room.draftState,
                players: getRoomPlayersSummary(room)
            });

            socket.to(cleanRoomId).emit('draft_updated', {
                roomId: cleanRoomId,
                draftState: room.draftState,
                status: room.status,
                mode: room.mode,
                players: getRoomPlayersSummary(room)
            });

        } catch (err) {
            console.error(`[JOIN_ROOM ERROR] Socket ${socket.id}:`, err);
            sendClientError('Failed to join match room.', 'room_error');
        }
    });

    // 3. READY-UP PROTOCOL
    socket.on('toggle_ready', () => {
        try {
            const roomId = socket.currentRoomId;
            const room = activeRooms[roomId];
            if (!room || room.mode !== 'pvp') return;

            const team = socket.assignedTeam;
            if (!team || !room.players || !room.players[team]) return;

            room.lastActivity = Date.now();
            room.players[team].ready = !room.players[team].ready;

            if (room.players.A && room.players.A.ready && room.players.B && room.players.B.ready) {
                room.draftState.started = true;
                room.status = 'drafting';
            }

            io.to(roomId).emit('draft_updated', {
                roomId: roomId,
                draftState: room.draftState,
                status: room.status,
                mode: room.mode,
                players: getRoomPlayersSummary(room)
            });
        } catch (err) {
            console.error(`[TOGGLE_READY ERROR] Socket ${socket.id}:`, err);
        }
    });

    // 4. ACTION TURN EXECUTION (WITH VALIDATION GUARDRAILS)
    socket.on('select_hero', (payload) => {
        try {
            if (!payload || typeof payload.heroId !== 'string') {
                return sendClientError('Invalid hero selection payload.', 'draft_error');
            }

            const heroId = sanitizeString(payload.heroId, 30).toLowerCase();
            const roomId = socket.currentRoomId;
            const room = activeRooms[roomId];

            if (!room) {
                return sendClientError('Draft session not found or expired.', 'room_error');
            }

            if (room.mode === 'auto_sim') {
                return sendClientError('Manual picks are disabled in Auto-Sim mode.', 'draft_error');
            }

            if (!room.draftState.started) {
                return sendClientError('Draft is waiting for players to Ready Up.', 'draft_error');
            }

            if (room.mode === 'pvp' && (!room.players.A || !room.players.B || !room.players.A.connected || !room.players.B.connected)) {
                return sendClientError('Waiting for opponent to connect.', 'draft_error');
            }

            const playerTeam = socket.assignedTeam;
            const draft = room.draftState;

            if (draft.isComplete || draft.currentTurnIndex >= DRAFT_SEQUENCE.length) {
                return sendClientError('The draft is already complete.', 'draft_error');
            }

            const currentTurn = DRAFT_SEQUENCE[draft.currentTurnIndex];
            if (!currentTurn || currentTurn.team !== playerTeam) {
                return sendClientError(`It is currently Team ${currentTurn.team}'s turn.`, 'draft_error');
            }

            const hero = HERO_DATASET.find(h => h.id === heroId);
            if (!hero) {
                return sendClientError(`Hero '${heroId}' not recognized in roster.`, 'draft_error');
            }

            const allBanned = [...draft.bans.A, ...draft.bans.B].map(h => h.id);
            const allPicked = [...draft.picks.A, ...draft.picks.B].map(h => h.id);

            if (allBanned.includes(heroId) || allPicked.includes(heroId)) {
                return sendClientError(`${hero.name} has already been banned or picked.`, 'draft_error');
            }

            room.lastActivity = Date.now();

            if (currentTurn.action === 'ban') {
                draft.bans[playerTeam].push(hero);
            } else {
                draft.picks[playerTeam].push(hero);
            }

            draft.draftLog.push({
                turn: currentTurn.turn,
                phase: currentTurn.phase,
                team: playerTeam,
                action: currentTurn.action,
                hero: hero.name
            });

            draft.currentTurnIndex++;
            draft.version = (draft.version || 0) + 1;

            if (draft.currentTurnIndex >= DRAFT_SEQUENCE.length) {
                draft.isComplete = true;
                room.status = 'completed';
                recordCompletedDraft(room);
            }

            io.to(roomId).emit('draft_updated', {
                roomId: roomId,
                draftState: draft,
                status: room.status,
                mode: room.mode,
                players: getRoomPlayersSummary(room)
            });

            try {
                processAITurnIfNecessary(roomId);
            } catch (aiErr) {
                console.error(`[AI ENGINE ERROR] Room ${roomId}:`, aiErr);
                sendClientError('AI engine encountered a calculation issue.', 'draft_error');
            }

        } catch (err) {
            console.error(`[SELECT_HERO ERROR] Socket ${socket.id}:`, err);
            sendClientError('Unexpected error processing turn action.', 'draft_error');
        }
    });

    // 5. SIMULATION CONTROLS
    socket.on('sim_step', () => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];
        if (!room || room.mode === 'pvp') return;
        executeDraftStep(roomId);
    });

    socket.on('sim_start_auto', () => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];
        if (!room || room.mode === 'pvp' || room.simInterval) return;

        room.simInterval = setInterval(() => {
            if (!activeRooms[roomId] || room.draftState.isComplete) {
                clearInterval(room.simInterval);
                room.simInterval = null;
                return;
            }
            executeDraftStep(roomId);
        }, SIM_AUTO_INTERVAL_MS);
    });

    socket.on('sim_pause_auto', () => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];
        if (!room || !room.simInterval) return;

        clearInterval(room.simInterval);
        room.simInterval = null;
    });

    // 6. DRAFT HISTORY ARCHIVE RETRIEVAL
    socket.on('get_draft_history', () => {
        socket.emit('draft_history_data', temporaryDraftHistory);
    });

    // 7. REMATCH REQUEST
    socket.on('request_rematch', () => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];
        if (!room) return;
        performRoomReset(room, roomId);
    });

    // 8. RESET PROTOCOL
    socket.on('request_reset', () => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];
        if (!room) return;

        if (room.mode !== 'pvp') {
            performRoomReset(room, roomId);
            return;
        }

        const requesterTeam = socket.assignedTeam;
        const opponentTeam = requesterTeam === 'A' ? 'B' : 'A';
        const opponent = room.players[opponentTeam];

        if (!opponent || !opponent.connected) {
            performRoomReset(room, roomId);
            return;
        }

        room.pendingResetBy = requesterTeam;
        io.to(opponent.socketId).emit('reset_requested', { requestedByTeam: requesterTeam });
        socket.emit('reset_status', { message: 'Reset request sent. Waiting for opponent confirmation...' });
    });

    socket.on('respond_reset', ({ approved }) => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];
        if (!room || room.mode !== 'pvp' || !room.pendingResetBy) return;

        const requesterTeam = room.pendingResetBy;
        const requester = room.players[requesterTeam];

        if (approved) {
            performRoomReset(room, roomId);
            io.to(roomId).emit('reset_status', { message: 'Draft reset by mutual confirmation.' });
        } else {
            room.pendingResetBy = null;
            if (requester && requester.connected) {
                io.to(requester.socketId).emit('reset_declined', { message: 'Opponent declined reset.' });
            }
        }
    });

    // 9. LEAVE ROOM & DISCONNECT HANDLING
    socket.on('leave_room', () => {
        const roomId = socket.currentRoomId;
        if (roomId && activeRooms[roomId]) {
            destroyRoom(roomId, 'A player manually left the lobby.');
        }
    });

    socket.on('disconnect', () => {
        const roomId = socket.currentRoomId;
        const playerTeam = socket.assignedTeam;
        if (!roomId || !activeRooms[roomId]) return;

        const room = activeRooms[roomId];
        room.lastActivity = Date.now();

        if (room.mode !== 'pvp') {
            if (room.simInterval) {
                clearInterval(room.simInterval);
                room.simInterval = null;
            }
            if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
            room.cleanupTimer = setTimeout(() => destroyRoom(roomId, 'Solo practice session closed.'), 45000);
            return;
        }

        if (room.players[playerTeam]) {
            room.players[playerTeam].connected = false;
            room.players[playerTeam].ready = false;
        }

        socket.to(roomId).emit('player_disconnected', {
            disconnectedTeam: playerTeam,
            timeoutSeconds: PVP_DISCONNECT_TIMEOUT_MS / 1000
        });

        io.to(roomId).emit('draft_updated', {
            roomId: roomId,
            draftState: room.draftState,
            status: 'waiting',
            mode: room.mode,
            players: getRoomPlayersSummary(room)
        });

        if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
        room.cleanupTimer = setTimeout(() => {
            destroyRoom(roomId, 'Room dismissed: Opponent failed to reconnect within 30 seconds.');
        }, PVP_DISCONNECT_TIMEOUT_MS);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`MLBB Authoritative Server running at http://localhost:${PORT}`);
});