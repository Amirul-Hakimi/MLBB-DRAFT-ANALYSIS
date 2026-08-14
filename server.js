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
const ABANDON_TIMEOUT_MS = 60000; // 60 seconds grace period

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

    // --- CREATE ROOM ---
    socket.on('create_room', ({ playerToken }) => {
        const roomId = generateUniqueRoomId();

        activeRooms[roomId] = {
            roomId: roomId,
            players: {
                A: { socketId: socket.id, playerToken: playerToken, connected: true },
                B: null
            },
            status: 'waiting',
            cleanupTimer: null,
            draftState: createFreshDraftState()
        };

        socket.join(roomId);
        socket.currentRoomId = roomId;
        socket.assignedTeam = 'A';
        socket.playerToken = playerToken;

        socket.emit('room_created', {
            roomId: roomId,
            yourTeam: 'A',
            draftState: activeRooms[roomId].draftState
        });
    });

    // --- JOIN / RECONNECT ROOM ---
    socket.on('join_room', ({ targetRoomId, playerToken }) => {
        const cleanRoomId = targetRoomId.trim().toUpperCase();
        const room = activeRooms[cleanRoomId];

        if (!room) {
            socket.emit('room_error', { message: `Room '${cleanRoomId}' does not exist or expired.` });
            return;
        }

        // Check if this is a RECONNECTING existing player
        let existingTeam = null;
        if (room.players.A && room.players.A.playerToken === playerToken) existingTeam = 'A';
        if (room.players.B && room.players.B.playerToken === playerToken) existingTeam = 'B';

        if (existingTeam) {
            // RECONNECT FLOW: Re-bind new socket.id to existing team slot
            room.players[existingTeam].socketId = socket.id;
            room.players[existingTeam].connected = true;

            socket.join(cleanRoomId);
            socket.currentRoomId = cleanRoomId;
            socket.assignedTeam = existingTeam;
            socket.playerToken = playerToken;

            // Cancel cleanup timer if active
            if (room.cleanupTimer) {
                clearTimeout(room.cleanupTimer);
                room.cleanupTimer = null;
                console.log(`[RECONNECTED] Room ${cleanRoomId}: Cleanup timer cancelled.`);
            }

            console.log(`[RECONNECTED] Socket ${socket.id} restored as Team ${existingTeam} in Room ${cleanRoomId}`);

            // Send full authoritative state back to reconnecting player
            socket.emit('room_joined', {
                roomId: cleanRoomId,
                yourTeam: existingTeam,
                draftState: room.draftState
            });

            // Notify room that player has restored connection
            io.to(cleanRoomId).emit('draft_updated', {
                roomId: cleanRoomId,
                draftState: room.draftState,
                status: 'ready'
            });

            io.to(cleanRoomId).emit('room_announcement', {
                message: `Team ${existingTeam} reconnected!`
            });
            return;
        }

        // NEW PLAYER JOIN FLOW
        if (room.players.A && room.players.B) {
            socket.emit('room_error', { message: `Room '${cleanRoomId}' is full.` });
            return;
        }

        let assignedTeam = 'B';
        if (!room.players.A) {
            assignedTeam = 'A';
            room.players.A = { socketId: socket.id, playerToken: playerToken, connected: true };
        } else {
            room.players.B = { socketId: socket.id, playerToken: playerToken, connected: true };
        }

        room.status = 'ready';
        socket.join(cleanRoomId);
        socket.currentRoomId = cleanRoomId;
        socket.assignedTeam = assignedTeam;
        socket.playerToken = playerToken;

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

    // --- AUTHORITATIVE HERO SELECTION ---
    socket.on('select_hero', ({ heroId }) => {
        const roomId = socket.currentRoomId;
        const room = activeRooms[roomId];

        if (!room) {
            socket.emit('draft_error', { message: 'Room session expired or not found.' });
            return;
        }

        const playerTeam = socket.assignedTeam;
        const draft = room.draftState;

        if (draft.isComplete) {
            socket.emit('draft_error', { message: 'Draft is already complete!' });
            return;
        }

        const currentTurn = DRAFT_SEQUENCE[draft.currentTurnIndex];

        if (currentTurn.team !== playerTeam) {
            socket.emit('draft_error', { message: `Not your turn! Waiting for Team ${currentTurn.team}.` });
            return;
        }

        const hero = HERO_DATASET.find(h => h.id === heroId);
        if (!hero) {
            socket.emit('draft_error', { message: `Invalid Hero ID: ${heroId}` });
            return;
        }

        const allBanned = [...draft.bans.A, ...draft.bans.B].map(h => h.id);
        const allPicked = [...draft.picks.A, ...draft.picks.B].map(h => h.id);
        if (allBanned.includes(heroId) || allPicked.includes(heroId)) {
            socket.emit('draft_error', { message: `${hero.name} is already banned or picked!` });
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
    });

    // --- DISCONNECT & RECONNECT TIMEOUT ---
    socket.on('disconnect', () => {
        const roomId = socket.currentRoomId;
        if (!roomId || !activeRooms[roomId]) return;

        const room = activeRooms[roomId];
        const team = socket.assignedTeam;

        if (team && room.players[team]) {
            room.players[team].connected = false;
        }

        console.log(`[DISCONNECT] Team ${team} (Socket ${socket.id}) disconnected from Room ${roomId}`);

        // Notify remaining player that opponent disconnected
        io.to(roomId).emit('player_left', {
            message: `Team ${team} disconnected. Waiting 60s for reconnection...`,
            status: 'paused'
        });

        // Check if both players are disconnected
        const aConnected = room.players.A && room.players.A.connected;
        const bConnected = room.players.B && room.players.B.connected;

        // If no one is connected, start 60s room destruction timer
        if (!aConnected && !bConnected) {
            if (!room.cleanupTimer) {
                console.log(`[CLEANUP SCHEDULED] Room ${roomId} will be deleted in 60s if abandoned.`);
                room.cleanupTimer = setTimeout(() => {
                    delete activeRooms[roomId];
                    console.log(`[ROOM DELETED] Room ${roomId} destroyed due to inactivity.`);
                }, ABANDON_TIMEOUT_MS);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`MLBB Authoritative Server running at http://localhost:3000`);
});