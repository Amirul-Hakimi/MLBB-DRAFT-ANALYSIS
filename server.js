const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const { HERO_DATASET, getHeroLanes, getHeroPickRate, getHeroBanRate } = require('./public/js/hero-data.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

const AI_DECISION_DELAY_MS = 1000;
const SIM_AUTO_INTERVAL_MS = 1000;
const PVP_DISCONNECT_TIMEOUT_MS = 30000;

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

const activeRooms = {};

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
        if (laneCandidates.length > 0) {
            candidateHeroes = laneCandidates;
        }
    }

    return selectWeightedRandomHero(candidateHeroes, h => {
        // Weight selection by explicit role-specific pick rates
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
        if (room.simInterval) {
            clearInterval(room.simInterval);
            room.simInterval = null;
        }
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
            if (success) {
                processAITurnIfNecessary(roomId);
            }
        }, AI_DECISION_DELAY_MS);
    }
}

function performRoomReset(room, roomId) {
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
        room.draftState.started = false;
        if (room.players.A) room.players.A.ready = false;
        if (room.players.B) room.players.B.ready = false;
    } else {
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

function destroyRoom(roomId, reason = 'Room closed.') {
    const room = activeRooms[roomId];
    if (!room) return;
    if (room.simInterval) clearInterval(room.simInterval);
    if (room.aiTimer) clearTimeout(room.aiTimer);
    if (room.cleanupTimer) clearTimeout(room.cleanupTimer);

    io.to(roomId).emit('room_dismissed', { message: reason });
    delete activeRooms[roomId];
    console.log(`[ROOM CLOSED] Room ${roomId}: ${reason}`);
}

function getRoomPlayersSummary(room) {
    return {
        A: room.players.A ? { connected: !!room.players.A.connected, ready: !!room.players.A.ready } : null,
        B: room.players.B ? { connected: !!room.players.B.connected, ready: !!room.players.B.ready } : null
    };
}

// =========================================================================
// SOCKET CONNECTION & EVENT LISTENERS
// =========================================================================

io.on('connection', (socket) => {
    // CREATE ROOM
    socket.on('create_room', (payload) => {
        if (!payload || typeof payload !== 'object') return;

        const playerToken = sanitizeString(payload.playerToken, 32);
        const mode = ['pvp', 'vs_ai', 'auto_sim'].includes(payload.mode) ? payload.mode : 'vs_ai';
        const roomId = generateUniqueRoomId();

        activeRooms[roomId] = {
            roomId: roomId,
            mode: mode,
            hostToken: playerToken,
            generationId: 1,
            pendingResetBy: null,
            cleanupTimer: null,
            players: {
                A: mode === 'auto_sim' ? { socketId: 'AI_BOT_A', playerToken: 'AI_BOT_A', connected: true, ready: true } : { socketId: socket.id, playerToken, connected: true, ready: mode !== 'pvp' },
                B: mode === 'pvp' ? null : { socketId: 'AI_BOT_B', playerToken: 'AI_BOT_B', connected: true, ready: true }
            },
            status: mode === 'pvp' ? 'waiting' : 'ready',
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

        socket.emit('room_created', {
            roomId: roomId,
            yourTeam: socket.assignedTeam,
            mode: mode,
            status: activeRooms[roomId].status,
            draftState: activeRooms[roomId].draftState,
            players: getRoomPlayersSummary(activeRooms[roomId])
        });

        io.to(roomId).emit('draft_updated', {
            roomId: roomId,
            draftState: activeRooms[roomId].draftState,
            status: activeRooms[roomId].status,
            mode: mode,
            players: getRoomPlayersSummary(activeRooms[roomId])
        });
    });

    // JOIN ROOM
    socket.on('join_room', (payload) => {
        if (!payload || typeof payload !== 'object') return;

        const cleanRoomId = sanitizeString(payload.targetRoomId, 6).toUpperCase();
        const playerToken = sanitizeString(payload.playerToken, 32);
        const room = activeRooms[cleanRoomId];

        if (!room) {
            socket.emit('room_error', { message: `Room '${cleanRoomId}' does not exist or expired.` });
            return;
        }

        // Reconnect Auto-Sim
        if (room.mode === 'auto_sim') {
            if (room.cleanupTimer) {
                clearTimeout(room.cleanupTimer);
                room.cleanupTimer = null;
            }
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

        // Reconnect Existing Player
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

            io.to(cleanRoomId).emit('player_reconnected', {
                team: existingTeam,
                players: getRoomPlayersSummary(room)
            });

            io.to(cleanRoomId).emit('draft_updated', {
                roomId: cleanRoomId,
                draftState: room.draftState,
                status: room.status,
                mode: room.mode,
                players: getRoomPlayersSummary(room)
            });
            return;
        }

        // New Player Joining PvP
        if (room.mode !== 'pvp' || (room.players.A && room.players.B)) {
            socket.emit('room_error', { message: 'Cannot join room (Full or Not in PvP mode).' });
            return;
        }

        room.players.B = { socketId: socket.id, playerToken: playerToken, connected: true, ready: false };
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

        io.to(cleanRoomId).emit('draft_updated', {
            roomId: cleanRoomId,
            draftState: room.draftState,
            status: room.status,
            mode: room.mode,
            players: getRoomPlayersSummary(room)
        });
    });

    // TOGGLE READY
    socket.on('toggle_ready', () => {
        const roomId = socket.currentRoomId;
        const playerTeam = socket.assignedTeam;
        const room = activeRooms[roomId];
        if (!room || room.mode !== 'pvp' || room.draftState.started) return;

        if (room.players[playerTeam]) {
            room.players[playerTeam].ready = !room.players[playerTeam].ready;
        }

        const bothReady = room.players.A && room.players.B && room.players.A.connected && room.players.B.connected && room.players.A.ready && room.players.B.ready;

        if (bothReady) {
            room.draftState.started = true;
            room.status = 'drafting';
        }

        io.to(roomId).emit('draft_updated', {
            roomId: roomId,
            draftState: room.draftState,
            status: bothReady ? 'drafting' : 'waiting',
            mode: room.mode,
            players: getRoomPlayersSummary(room)
        });
    });

    // HUMAN SELECTION
    socket.on('select_hero', (payload) => {
        if (!payload || typeof payload.heroId !== 'string') return;
        const heroId = sanitizeString(payload.heroId, 30).toLowerCase();
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];
        if (!room || room.mode === 'auto_sim') return;

        if (!room.draftState.started) {
            socket.emit('draft_error', { message: 'The draft has not started yet.' });
            return;
        }

        if (room.mode === 'pvp' && (!room.players.A || !room.players.B || !room.players.A.connected || !room.players.B.connected)) {
            socket.emit('draft_error', { message: 'Waiting for both players to connect.' });
            return;
        }

        const playerTeam = socket.assignedTeam;
        const draft = room.draftState;
        if (draft.isComplete || draft.currentTurnIndex >= DRAFT_SEQUENCE.length) return;

        const currentTurn = DRAFT_SEQUENCE[draft.currentTurnIndex];
        if (!currentTurn || currentTurn.team !== playerTeam) return;

        const hero = HERO_DATASET.find(h => h.id === heroId);
        if (!hero) return;

        const allBanned = [...draft.bans.A, ...draft.bans.B].map(h => h.id);
        const allPicked = [...draft.picks.A, ...draft.picks.B].map(h => h.id);
        if (allBanned.includes(heroId) || allPicked.includes(heroId)) return;

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
        }

        io.to(roomId).emit('draft_updated', {
            roomId: roomId,
            draftState: draft,
            status: room.status,
            mode: room.mode,
            players: getRoomPlayersSummary(room)
        });

        processAITurnIfNecessary(roomId);
    });

    // SIMULATION CONTROLS
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

    // RESET CONTROLS
    socket.on('request_reset', () => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];
        if (!room) return;

        if (room.mode === 'vs_ai' || room.mode === 'auto_sim') {
            performRoomReset(room, roomId);
            return;
        }

        if (room.mode === 'pvp') {
            const requesterTeam = socket.assignedTeam;
            const opponentTeam = requesterTeam === 'A' ? 'B' : 'A';
            const opponent = room.players[opponentTeam];

            if (!opponent || !opponent.connected) {
                performRoomReset(room, roomId);
                return;
            }

            room.pendingResetBy = requesterTeam;

            io.to(opponent.socketId).emit('reset_requested', {
                requestedByTeam: requesterTeam
            });

            socket.emit('reset_status', {
                message: 'Reset request sent. Waiting for opponent approval...'
            });
        }
    });

    socket.on('respond_reset', ({ approved }) => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];
        if (!room || room.mode !== 'pvp' || !room.pendingResetBy) return;

        const requesterTeam = room.pendingResetBy;
        const requester = room.players[requesterTeam];

        if (approved) {
            performRoomReset(room, roomId);
            io.to(roomId).emit('reset_status', { message: 'Draft was reset by mutual agreement.' });
        } else {
            room.pendingResetBy = null;
            if (requester && requester.connected) {
                io.to(requester.socketId).emit('reset_declined', {
                    message: 'Your opponent declined the draft reset.'
                });
            }
        }
    });

    // DISCONNECT
    socket.on('disconnect', () => {
        const roomId = socket.currentRoomId;
        const playerTeam = socket.assignedTeam;
        if (!roomId || !activeRooms[roomId]) return;

        const room = activeRooms[roomId];

        if (room.mode === 'vs_ai' || room.mode === 'auto_sim') {
            if (room.simInterval) {
                clearInterval(room.simInterval);
                room.simInterval = null;
            }
            if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
            room.cleanupTimer = setTimeout(() => destroyRoom(roomId, 'Session closed.'), 45000);
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