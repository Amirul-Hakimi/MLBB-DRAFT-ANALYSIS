const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

// In-memory room storage
const activeRooms = {};

// Helper: Generate a unique 6-character uppercase Room ID
function generateUniqueRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters like O, 0, I, 1
    let result = '';
    do {
        result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (activeRooms[result]); // Ensure code is not currently in use
    return result;
}

io.on('connection', (socket) => {
    console.log(`[CONNECTED] Socket ID: ${socket.id}`);

    // --- EVENT: CREATE ROOM ---
    socket.on('create_room', () => {
        const roomId = generateUniqueRoomId();

        // Create fresh room record
        activeRooms[roomId] = {
            roomId: roomId,
            players: {
                A: { socketId: socket.id, connected: true },
                B: null
            },
            status: 'waiting'
        };

        // Join Socket.IO room channel
        socket.join(roomId);
        socket.currentRoomId = roomId;
        socket.assignedTeam = 'A';

        console.log(`[ROOM CREATED] ID: ${roomId} by ${socket.id} (Team A)`);

        // Respond to creator
        socket.emit('room_created', {
            roomId: roomId,
            yourTeam: 'A',
            status: 'waiting',
            message: 'Room created successfully. Waiting for opponent...'
        });
    });

    // --- EVENT: JOIN ROOM ---
    socket.on('join_room', (targetRoomId) => {
        const cleanRoomId = targetRoomId.trim().toUpperCase();
        const room = activeRooms[cleanRoomId];

        // Guard 1: Room existence check
        if (!room) {
            socket.emit('room_error', { message: `Room '${cleanRoomId}' does not exist.` });
            return;
        }

        // Guard 2: Capacity check (Max 2 players)
        if (room.players.A && room.players.B) {
            socket.emit('room_error', { message: `Room '${cleanRoomId}' is full (Max 2 players).` });
            return;
        }

        // Assign player to Team B (or fill vacant Team A if reconnected)
        let assignedTeam = 'B';
        if (!room.players.A) {
            assignedTeam = 'A';
            room.players.A = { socketId: socket.id, connected: true };
        } else {
            room.players.B = { socketId: socket.id, connected: true };
        }

        room.status = 'ready';

        // Join Socket.IO room channel
        socket.join(cleanRoomId);
        socket.currentRoomId = cleanRoomId;
        socket.assignedTeam = assignedTeam;

        console.log(`[ROOM JOINED] ID: ${cleanRoomId} by ${socket.id} (Team ${assignedTeam})`);

        // Notify joining player
        socket.emit('room_joined', {
            roomId: cleanRoomId,
            yourTeam: assignedTeam,
            status: 'ready'
        });

        // Notify everyone in the room that both players are present
        io.to(cleanRoomId).emit('room_status_update', {
            roomId: cleanRoomId,
            status: 'ready',
            playerCount: 2,
            message: 'Both players connected! Lobby ready.'
        });
    });

    // --- EVENT: LEAVE / CANCEL ROOM ---
    socket.on('leave_room', () => {
        handlePlayerDisconnect(socket);
    });

    socket.on('disconnect', () => {
        handlePlayerDisconnect(socket);
    });

    function handlePlayerDisconnect(socket) {
        const roomId = socket.currentRoomId;
        if (!roomId || !activeRooms[roomId]) return;

        const room = activeRooms[roomId];
        const team = socket.assignedTeam;

        // Clear player slot
        if (team === 'A') room.players.A = null;
        if (team === 'B') room.players.B = null;

        socket.leave(roomId);
        socket.currentRoomId = null;
        socket.assignedTeam = null;

        // If both players left, destroy room record
        if (!room.players.A && !room.players.B) {
            delete activeRooms[roomId];
            console.log(`[ROOM DESTROYED] ID: ${roomId} (empty)`);
        } else {
            // Notify remaining player
            room.status = 'waiting';
            io.to(roomId).emit('player_left', {
                message: `Team ${team} player left the room. Waiting for new opponent...`,
                status: 'waiting'
            });
        }
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`MLBB Room Server running at http://localhost:3000`);
});