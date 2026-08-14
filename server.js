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

// Master Hero Dataset
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

// Reusable AI Move Calculator for ANY team (A or B)
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

// Execute a single step of the draft on the server
function executeDraftStep(roomId, actingTeam) {
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
            const success = executeDraftStep(roomId, 'B');
            if (success) {
                processAITurnIfNecessary(roomId);
            }
        }, AI_DECISION_DELAY_MS);
    }
}

io.on('connection', (socket) => {
    console.log(`[CONNECTED] Socket ID: ${socket.id}`);

    // CREATE ROOM
    socket.on('create_room', ({ playerToken, mode = 'vs_ai' }) => {
        const roomId = generateUniqueRoomId();

        activeRooms[roomId] = {
            roomId: roomId,
            mode: mode, // 'pvp', 'vs_ai', or 'auto_sim'
            players: {
                A: mode === 'auto_sim' ? { socketId: 'AI_BOT_A' } : { socketId: socket.id, playerToken },
                B: mode === 'pvp' ? null : { socketId: 'AI_BOT_B' }
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

    // JOIN ROOM
    socket.on('join_room', ({ targetRoomId, playerToken }) => {
        const cleanRoomId = targetRoomId.trim().toUpperCase();
        const room = activeRooms[cleanRoomId];

        if (!room) {
            socket.emit('room_error', { message: `Room '${cleanRoomId}' does not exist.` });
            return;
        }

        if (room.mode !== 'pvp') {
            socket.emit('room_error', { message: `Cannot join non-PvP lobby.` });
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

    // HUMAN HERO SELECTION (PvP / Vs AI)
    socket.on('select_hero', ({ heroId }) => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];
        if (!room || room.mode === 'auto_sim') return;

        const playerTeam = socket.assignedTeam;
        const draft = room.draftState;
        if (draft.isComplete) return;

        const currentTurn = DRAFT_SEQUENCE[draft.currentTurnIndex];
        if (currentTurn.team !== playerTeam) {
            socket.emit('draft_error', { message: `Not your turn!` });
            return;
        }

        const hero = HERO_DATASET.find(h => h.id === heroId);
        if (!hero) return;

        const allBanned = [...draft.bans.A, ...draft.bans.B].map(h => h.id);
        const allPicked = [...draft.picks.A, ...draft.picks.B].map(h => h.id);
        if (allBanned.includes(heroId) || allPicked.includes(heroId)) {
            socket.emit('draft_error', { message: `${hero.name} already chosen!` });
            return;
        }

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

        io.to(roomId).emit('draft_updated', {
            roomId: roomId,
            draftState: draft,
            status: room.status
        });

        processAITurnIfNecessary(roomId);
    });

    // --- AUTO-SIM CONTROL EVENTS ---

    // 1. Step Forward by 1 Turn
    socket.on('sim_step', () => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];
        if (!room || room.mode !== 'auto_sim') return;
        executeDraftStep(roomId);
    });

    // 2. Start Auto-Play Loop
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

    // 3. Pause Auto-Play
    socket.on('sim_pause_auto', () => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];
        if (!room || !room.simInterval) return;

        clearInterval(room.simInterval);
        room.simInterval = null;
    });

    // 4. Reset Simulation
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
    console.log(`MLBB Authoritative Server running at http://localhost:${PORT}`);
});