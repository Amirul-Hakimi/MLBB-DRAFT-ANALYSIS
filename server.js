const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

const AI_DECISION_DELAY_MS = 1200;
const SIM_AUTO_INTERVAL_MS = 1200;

// Master Hero Dataset (Authoritative Server Truth)
const HERO_DATASET = [
    { id: "fanny", name: "Fanny", lanes: ["Jungle"], banWeight: 9, pickWeight: 8 },
    { id: "ling", name: "Ling", lanes: ["Jungle"], banWeight: 8, pickWeight: 8 },
    { id: "joy", name: "Joy", lanes: ["EXP", "Jungle"], banWeight: 7, pickWeight: 7 },
    { id: "hayabusa", name: "Hayabusa", lanes: ["Jungle"], banWeight: 8, pickWeight: 8 },
    { id: "nolan", name: "Nolan", lanes: ["Jungle"], banWeight: 8, pickWeight: 8 },
    { id: "chou", name: "Chou", lanes: ["EXP", "Roam"], banWeight: 5, pickWeight: 7 },
    { id: "terizla", name: "Terizla", lanes: ["EXP"], banWeight: 6, pickWeight: 8 },
    { id: "paquito", name: "Paquito", lanes: ["EXP", "Jungle"], banWeight: 6, pickWeight: 7 },
    { id: "arlott", name: "Arlott", lanes: ["EXP", "Roam"], banWeight: 7, pickWeight: 7 },
    { id: "ruby", name: "Ruby", lanes: ["EXP", "Roam"], banWeight: 5, pickWeight: 7 },
    { id: "tigreal", name: "Tigreal", lanes: ["Roam"], banWeight: 8, pickWeight: 8 },
    { id: "diggie", name: "Diggie", lanes: ["Roam"], banWeight: 9, pickWeight: 8 },
    { id: "mathilda", name: "Mathilda", lanes: ["Roam", "Mid"], banWeight: 9, pickWeight: 9 },
    { id: "minotaur", name: "Minotaur", lanes: ["Roam"], banWeight: 7, pickWeight: 8 },
    { id: "angela", name: "Angela", lanes: ["Roam"], banWeight: 6, pickWeight: 7 },
    { id: "fredrinn", name: "Fredrinn", lanes: ["Jungle", "EXP"], banWeight: 6, pickWeight: 7 },
    { id: "pharsa", name: "Pharsa", lanes: ["Mid"], banWeight: 5, pickWeight: 7 },
    { id: "valentina", name: "Valentina", lanes: ["Mid"], banWeight: 8, pickWeight: 8 },
    { id: "novaria", name: "Novaria", lanes: ["Mid"], banWeight: 6, pickWeight: 7 },
    { id: "yve", name: "Yve", lanes: ["Mid"], banWeight: 5, pickWeight: 6 },
    { id: "xavier", name: "Xavier", lanes: ["Mid"], banWeight: 5, pickWeight: 7 },
    { id: "beatrix", name: "Beatrix", lanes: ["Gold"], banWeight: 4, pickWeight: 7 },
    { id: "wanwan", name: "Wanwan", lanes: ["Gold"], banWeight: 8, pickWeight: 7 },
    { id: "claude", name: "Claude", lanes: ["Gold"], banWeight: 6, pickWeight: 8 },
    { id: "karrie", name: "Karrie", lanes: ["Gold"], banWeight: 5, pickWeight: 7 },
    { id: "brody", name: "Brody", lanes: ["Gold"], banWeight: 5, pickWeight: 7 }
];

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

// Helper: Sanitize alphanumeric strings
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

function createFreshDraftState() {
    return {
        currentTurnIndex: 0,
        isComplete: false,
        bans: { A: [], B: [] },
        picks: { A: [], B: [] },
        draftLog: []
    };
}

function selectWeightedRandomHero(heroList, weightKey) {
    if (!heroList || heroList.length === 0) return null;
    const totalWeight = heroList.reduce((sum, hero) => sum + (hero[weightKey] || 5), 0);
    let randomRoll = Math.random() * totalWeight;

    for (const hero of heroList) {
        randomRoll -= (hero[weightKey] || 5);
        if (randomRoll <= 0) return hero;
    }
    return heroList[0];
}

function computeAIMoveForTeam(draftState, activeTeam) {
    const currentTurn = DRAFT_SEQUENCE[draftState.currentTurnIndex];
    const allBannedIds = [...draftState.bans.A, ...draftState.bans.B].map(h => h.id);
    const allPickedIds = [...draftState.picks.A, ...draftState.picks.B].map(h => h.id);
    const availableHeroes = HERO_DATASET.filter(h => !allBannedIds.includes(h.id) && !allPickedIds.includes(h.id));

    if (availableHeroes.length === 0) return null;

    if (currentTurn.action === 'ban') {
        return selectWeightedRandomHero(availableHeroes, 'banWeight');
    }

    const ALL_LANES = ['EXP', 'Jungle', 'Mid', 'Gold', 'Roam'];
    const teamCoveredLanes = new Set();
    draftState.picks[activeTeam].forEach(hero => (hero.lanes || []).forEach(l => teamCoveredLanes.add(l)));
    const neededLanes = ALL_LANES.filter(l => !teamCoveredLanes.has(l));

    let candidateHeroes = [];
    if (neededLanes.length > 0) {
        candidateHeroes = availableHeroes.filter(hero => hero.lanes.some(lane => neededLanes.includes(lane)));
    }
    if (candidateHeroes.length === 0) {
        candidateHeroes = availableHeroes;
    }

    return selectWeightedRandomHero(candidateHeroes, 'pickWeight');
}

function executeDraftStep(roomId) {
    const room = activeRooms[roomId];
    if (!room) return false;
    const draft = room.draftState;
    if (draft.isComplete) return false;

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
        status: room.status
    });

    return true;
}

function processAITurnIfNecessary(roomId) {
    const room = activeRooms[roomId];
    if (!room || room.mode !== 'vs_ai') return;
    const draft = room.draftState;
    if (draft.isComplete) return;

    const currentTurn = DRAFT_SEQUENCE[draft.currentTurnIndex];
    if (currentTurn.team === 'B') {
        setTimeout(() => {
            if (!activeRooms[roomId] || draft.isComplete) return;
            const success = executeDraftStep(roomId);
            if (success) {
                processAITurnIfNecessary(roomId);
            }
        }, AI_DECISION_DELAY_MS);
    }
}

// =========================================================================
// AUTHORITATIVE SOCKET EVENT HANDLING WITH FULL VALIDATION
// =========================================================================

io.on('connection', (socket) => {
    console.log(`[CONNECTED] Socket ID: ${socket.id}`);

    // --- CREATE ROOM ---
    socket.on('create_room', (payload) => {
        // Validation: payload structure
        if (!payload || typeof payload !== 'object') {
            socket.emit('room_error', { message: 'Malformed payload.' });
            return;
        }

        const playerToken = sanitizeString(payload.playerToken, 32);
        const mode = ['pvp', 'vs_ai', 'auto_sim'].includes(payload.mode) ? payload.mode : 'vs_ai';
        const roomId = generateUniqueRoomId();

        activeRooms[roomId] = {
            roomId: roomId,
            mode: mode,
            players: {
                A: mode === 'auto_sim' ? { socketId: 'AI_BOT_A', playerToken: 'AI_BOT_A' } : { socketId: socket.id, playerToken },
                B: mode === 'pvp' ? null : { socketId: 'AI_BOT_B', playerToken: 'AI_BOT_B' }
            },
            status: 'ready',
            simInterval: null,
            draftState: createFreshDraftState()
        };

        socket.join(roomId);
        socket.currentRoomId = roomId;
        socket.assignedTeam = mode === 'auto_sim' ? 'SPEC' : 'A';
        socket.playerToken = playerToken;

        socket.emit('room_created', {
            roomId: roomId,
            yourTeam: socket.assignedTeam,
            mode: mode,
            draftState: activeRooms[roomId].draftState
        });

        io.to(roomId).emit('draft_updated', {
            roomId: roomId,
            draftState: activeRooms[roomId].draftState,
            status: 'ready'
        });
    });

    // --- JOIN ROOM ---
    socket.on('join_room', (payload) => {
        if (!payload || typeof payload !== 'object') {
            socket.emit('room_error', { message: 'Malformed join payload.' });
            return;
        }

        const cleanRoomId = sanitizeString(payload.targetRoomId, 6).toUpperCase();
        const playerToken = sanitizeString(payload.playerToken, 32);
        const room = activeRooms[cleanRoomId];

        // Guard 1: Room existence
        if (!room) {
            socket.emit('room_error', { message: `Room '${cleanRoomId}' does not exist.` });
            return;
        }

        // Guard 2: Reconnection validation
        let existingTeam = null;
        if (room.players.A && room.players.A.playerToken === playerToken) existingTeam = 'A';
        if (room.players.B && room.players.B.playerToken === playerToken) existingTeam = 'B';

        if (existingTeam) {
            room.players[existingTeam].socketId = socket.id;
            socket.join(cleanRoomId);
            socket.currentRoomId = cleanRoomId;
            socket.assignedTeam = existingTeam;
            socket.playerToken = playerToken;

            socket.emit('room_joined', {
                roomId: cleanRoomId,
                yourTeam: existingTeam,
                mode: room.mode,
                draftState: room.draftState
            });

            io.to(cleanRoomId).emit('draft_updated', {
                roomId: cleanRoomId,
                draftState: room.draftState,
                status: 'ready'
            });
            return;
        }

        // Guard 3: Mode check
        if (room.mode !== 'pvp') {
            socket.emit('room_error', { message: 'Cannot join a single-player or simulation lobby.' });
            return;
        }

        // Guard 4: Capacity check
        if (room.players.A && room.players.B) {
            socket.emit('room_error', { message: 'This draft room is full (Max 2 players).' });
            return;
        }

        room.players.B = { socketId: socket.id, playerToken: playerToken, connected: true };
        socket.join(cleanRoomId);
        socket.currentRoomId = cleanRoomId;
        socket.assignedTeam = 'B';
        socket.playerToken = playerToken;

        socket.emit('room_joined', {
            roomId: cleanRoomId,
            yourTeam: 'B',
            mode: room.mode,
            draftState: room.draftState
        });

        io.to(cleanRoomId).emit('draft_updated', {
            roomId: cleanRoomId,
            draftState: room.draftState,
            status: 'ready'
        });
    });

    // --- AUTHORITATIVE HERO SELECTION (SELECT HERO) ---
    socket.on('select_hero', (payload) => {
        // 1. Payload validation
        if (!payload || typeof payload !== 'object' || typeof payload.heroId !== 'string') {
            socket.emit('draft_error', { message: 'Invalid hero payload.' });
            return;
        }

        const heroId = sanitizeString(payload.heroId, 30).toLowerCase();
        const roomId = socket.currentRoomId;

        // 2. Room membership validation
        if (!roomId || !activeRooms[roomId]) {
            socket.emit('draft_error', { message: 'You are not connected to a valid room.' });
            return;
        }

        const room = activeRooms[roomId];
        if (room.mode === 'auto_sim') {
            socket.emit('draft_error', { message: 'Manual picks are disabled in Auto-Sim mode.' });
            return;
        }

        // 3. Team assignment validation
        const playerTeam = socket.assignedTeam;
        if (playerTeam !== 'A' && playerTeam !== 'B') {
            socket.emit('draft_error', { message: 'You do not have a valid team assignment.' });
            return;
        }

        const draft = room.draftState;

        // 4. Draft completion validation
        if (draft.isComplete || draft.currentTurnIndex >= DRAFT_SEQUENCE.length) {
            socket.emit('draft_error', { message: 'The draft has already finished!' });
            return;
        }

        // 5. Turn ownership & Phase validation
        const currentTurn = DRAFT_SEQUENCE[draft.currentTurnIndex];
        if (currentTurn.team !== playerTeam) {
            socket.emit('draft_error', { message: `Not your turn! Waiting for Team ${currentTurn.team}.` });
            return;
        }

        // 6. Master Hero DB validation
        const hero = HERO_DATASET.find(h => h.id === heroId);
        if (!hero) {
            socket.emit('draft_error', { message: `Hero '${heroId}' does not exist in the database.` });
            return;
        }

        // 7. Hero availability validation
        const allBanned = [...draft.bans.A, ...draft.bans.B].map(h => h.id);
        const allPicked = [...draft.picks.A, ...draft.picks.B].map(h => h.id);
        if (allBanned.includes(heroId) || allPicked.includes(heroId)) {
            socket.emit('draft_error', { message: `${hero.name} has already been banned or picked!` });
            return;
        }

        // --- 8. ATOMIC STATE UPDATE ---
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

        if (draft.currentTurnIndex >= DRAFT_SEQUENCE.length) {
            draft.isComplete = true;
        }

        console.log(`[ACTION VALIDATED] Room ${roomId} | Turn ${currentTurn.turn} | Team ${playerTeam} ${currentTurn.action}ed ${hero.name}`);

        // Broadcast authoritative state
        io.to(roomId).emit('draft_updated', {
            roomId: roomId,
            draftState: draft,
            status: room.status
        });

        // Trigger AI step if playing Vs AI
        processAITurnIfNecessary(roomId);
    });

    // --- SIMULATION CONTROLS VALIDATION ---
    socket.on('sim_step', () => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];
        if (!room || room.mode !== 'auto_sim') return;
        executeDraftStep(roomId);
    });

    socket.on('sim_start_auto', () => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];
        if (!room || room.mode !== 'auto_sim' || room.simInterval) return;

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

    socket.on('sim_reset', () => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];
        if (!room || room.mode !== 'auto_sim') return;

        if (room.simInterval) {
            clearInterval(room.simInterval);
            room.simInterval = null;
        }

        room.draftState = createFreshDraftState();
        io.to(roomId).emit('draft_updated', {
            roomId: roomId,
            draftState: room.draftState,
            status: 'ready'
        });
    });

    // --- CLEANUP ON DISCONNECT ---
    socket.on('disconnect', () => {
        const roomId = socket.currentRoomId;
        if (!roomId || !activeRooms[roomId]) return;
        const room = activeRooms[roomId];

        if (room.simInterval) clearInterval(room.simInterval);
        if (room.mode !== 'pvp') {
            delete activeRooms[roomId];
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`MLBB Authoritative Secure Server running at http://localhost:${PORT}`);
});