const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Initialize Express app and create an HTTP server
const app = express();
const server = http.createServer(app);

// Attach Socket.IO to the HTTP server
const io = new Server(server);

// Serve all static files inside the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Set up a basic Socket.IO connection event
io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Start listening on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`MLBB Draft Server running at http://localhost:${PORT}`);
});