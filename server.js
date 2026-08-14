const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

// Master Hero Dataset (Server Truth)
const HERO_DATASET = [
    { id: "fanny", name: "Fanny", lanes: ["Jungle"] },
    { id: "ling", name: "Ling", lanes: ["Jungle"] },
    { id: "joy", name: "Joy", lanes: ["EXP", "Jungle"] },
    { id: "hayabusa", name: "Hayabusa", lanes: ["Jungle"] },
    { id: "nolan", name: "Nolan", lanes: ["Jungle"] },
    { id: "chou", name: "Chou", lanes: ["EXP", "Roam"] },
    { id: "terizla", name: "Terizla", lanes: ["EXP"] },
    { id: "paquito", name: "Paquito", lanes: ["EXP", "Jungle"] },
    { id: "arlott", name: "Arlott", lanes: ["EXP", "Roam"] },
    { id: "ruby", name: "Ruby", lanes: ["EXP", "Roam"] },
    { id: "tigreal", name: "Tigreal", lanes: ["Roam"] },
    { id: "diggie", name: "Diggie", lanes: ["Roam"] },
    { id: "mathilda", name: "Mathilda", lanes: ["Roam", "Mid"] },
    { id: "minotaur", name: "Minotaur", lanes: ["Roam"] },
    { id: "angela", name: "Angela", lanes: ["Roam"] },
    { id: "fredrinn", name: "Fredrinn", lanes: ["Jungle", "EXP"] },
    { id: "pharsa", name: "Pharsa", lanes: ["Mid"] },
    { id: "valentina", name: "Valentina", lanes: ["Mid"] },
    { id: "novaria", name: "Novaria", lanes: ["Mid"] },
    { id: "yve", name: "Yve", lanes: ["Mid"] },
    { id: "xavier", name: "Xavier", lanes: ["Mid"] },
    { id: "beatrix", name: "Beatrix", lanes: ["Gold"] },
    { id: "wanwan", name: "Wanwan", lanes: ["Gold"] },
    { id: "claude", name: "Claude", lanes: ["Gold"] },
    { id: "karrie", name: "Karrie", lanes: ["Gold"] },
    { id: "brody", name: "Brody", lanes: ["Gold"] }
];

// Exact 20-Step Draft Sequence Enforced by Server
const DRAFT_SEQUENCE = [
    // Ban Phase 1 (6 actions: A, B, A, B, A, B)
    { turn: 1,  phase: 'Ban Phase 1',  action: 'ban',  team: 'A' },
    { turn: 2,  phase: 'Ban Phase 1',  action: 'ban',  team: 'B' },
    { turn: 3,  phase: 'Ban Phase 1',  action: 'ban',  team: 'A' },
    { turn: 4,  phase: 'Ban Phase 1',  action: 'ban',  team: 'B' },
    { turn: 5,  phase: 'Ban Phase 1',  action: 'ban',  team: 'A' },
    { turn: 6,  phase: 'Ban Phase 1',  action: 'ban',  team: 'B' },

    // Pick Phase 1 (6 actions: A, B, B, A, A, B)
    { turn: 7,  phase: 'Pick Phase 1', action: 'pick', team: 'A' },
    { turn: 8,  phase: 'Pick Phase 1', action: 'pick', team: 'B' },
    { turn: 9,  phase: 'Pick Phase 1', action: 'pick', team: 'B' },
    { turn: 10, phase: 'Pick Phase 1', action: 'pick', team: 'A' },
    { turn: 11, phase: 'Pick Phase 1', action: 'pick', team: 'A' },
    { turn: 12, phase: 'Pick Phase 1', action: 'pick', team: 'B' },

    // Ban Phase 2 (4 actions: B, A, B, A)
    { turn: 13, phase: 'Ban Phase 2',  action: 'ban',  team: 'B' },
    { turn: 14, phase: 'Ban Phase 2',  action: 'ban',  team: 'A' },
    { turn: 15, phase: 'Ban Phase 2',  action: 'ban',  team: 'B' },
    { turn: 16, phase: 'Ban Phase 2',  action: 'ban',  team: 'A' },

    // Pick Phase 2 (4 actions: B, A, A, B)
    { turn: 17, phase: 'Pick Phase 2', action: 'pick', team: 'B' },
    { turn: 18, phase: 'Pick Phase 2', action: 'pick', team: 'A' },
    { turn: 19, phase: 'Pick Phase 2', action: 'pick', team: 'A' },
    { turn: 20, phase: 'Pick Phase 2', action: 'pick', team: 'B' }
];

// Active Rooms State Store
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

io.on('connection', (socket) => {
    console.log(`[CONNECTED] Socket ID: ${socket.id}`);

    // CREATE ROOM
    socket.on('create_room', () => {
        const roomId = generateUniqueRoomId();

        activeRooms[roomId] = {
            roomId: roomId,
            players: {
                A: { socketId: socket.id },
                B: null
            },
            status: 'waiting',
            draftState: createFreshDraftState()
        };

        socket.join(roomId);
        socket.currentRoomId = roomId;
        socket.assignedTeam = 'A';

        socket.emit('room_created', {
            roomId: roomId,
            yourTeam: 'A',
            draftState: activeRooms[roomId].draftState
        });
    });

    // JOIN ROOM
    socket.on('join_room', (targetRoomId) => {
        const cleanRoomId = targetRoomId.trim().toUpperCase();
        const room = activeRooms[cleanRoomId];

        if (!room) {
            socket.emit('room_error', { message: `Room '${cleanRoomId}' does not exist.` });
            return;
        }

        if (room.players.A && room.players.B) {
            socket.emit('room_error', { message: `Room '${cleanRoomId}' is full (Max 2 players).` });
            return;
        }

        let assignedTeam = 'B';
        if (!room.players.A) {
            assignedTeam = 'A';
            room.players.A = { socketId: socket.id };
        } else {
            room.players.B = { socketId: socket.id };
        }

        room.status = 'ready';
        socket.join(cleanRoomId);
        socket.currentRoomId = cleanRoomId;
        socket.assignedTeam = assignedTeam;

        socket.emit('room_joined', {
            roomId: cleanRoomId,
            yourTeam: assignedTeam,
            draftState: room.draftState
        });

        io.to(cleanRoomId).emit('draft_updated', {
            roomId: cleanRoomId,
            draftState: room.draftState,
            status: 'ready'
        });
    });

    // AUTHORITATIVE ACTION VALIDATION
    socket.on('select_hero', ({ heroId }) => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];

        if (!room) {
            socket.emit('draft_error', { message: 'Room session not found.' });
            return;
        }

        const playerTeam = socket.assignedTeam;
        if (!playerTeam) {
            socket.emit('draft_error', { message: 'You are not assigned to a team.' });
            return;
        }

        const draft = room.draftState;

        if (draft.isComplete) {
            socket.emit('draft_error', { message: 'The draft is already complete!' });
            return;
        }

        const currentTurn = DRAFT_SEQUENCE[draft.currentTurnIndex];

        // Guard: Check Turn Ownership
        if (currentTurn.team !== playerTeam) {
            socket.emit('draft_error', { message: `Not your turn! Waiting for Team ${currentTurn.team}.` });
            return;
        }

        // Guard: Check Hero Existence
        const hero = HERO_DATASET.find(h => h.id === heroId);
        if (!hero) {
            socket.emit('draft_error', { message: `Invalid Hero ID: ${heroId}` });
            return;
        }

        // Guard: Check Hero Availability
        const allBanned = [...draft.bans.A, ...draft.bans.B].map(h => h.id);
        const allPicked = [...draft.picks.A, ...draft.picks.B].map(h => h.id);
        if (allBanned.includes(heroId) || allPicked.includes(heroId)) {
            socket.emit('draft_error', { message: `${hero.name} is already banned or picked!` });
            return;
        }

        // EXECUTE AUTHORITATIVE STATE UPDATE
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

        // Server advances turn index
        draft.currentTurnIndex++;

        if (draft.currentTurnIndex >= DRAFT_SEQUENCE.length) {
            draft.isComplete = true;
        }

        console.log(`[TURN ${currentTurn.turn}] Room ${roomId}: Team ${playerTeam} ${currentTurn.action}ed ${hero.name}`);

        // Broadcast master state to both room sockets
        io.to(roomId).emit('draft_updated', {
            roomId: roomId,
            draftState: draft,
            status: room.status
        });
    });

    socket.on('disconnect', () => {
        const roomId = socket.currentRoomId;
        if (!roomId || !activeRooms[roomId]) return;

        const room = activeRooms[roomId];
        const team = socket.assignedTeam;

        if (team === 'A') room.players.A = null;
        if (team === 'B') room.players.B = null;

        if (!room.players.A && !room.players.B) {
            delete activeRooms[roomId];
            console.log(`[ROOM DESTROYED] ${roomId}`);
        } else {
            io.to(roomId).emit('player_left', {
                message: `Team ${team} player disconnected. Draft paused.`,
                status: 'paused'
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`MLBB Authoritative Draft Server running at http://localhost:3000`);
});