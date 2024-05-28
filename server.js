const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const {join} = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(express.static(join(__dirname, 'public')));
const PORT = process.env.PORT || 3001;

const rooms = {};
app.get('/magnet/:roomCode', (req, res) => {
    const roomCode = req.params.roomCode;
    // Check if the room exists and has a magnet link
    if (rooms[roomCode] && rooms[roomCode].magnetLink) {
        res.send(rooms[roomCode].magnetLink);
    } else {
        res.status(404).send('Magnet link not found for this room');
    }
});

// Socket.io connections
io.on('connection', socket => {
    console.log('A user connected');

    socket.on('joinRoom', room => {
        socket.join(room);
        console.log(`A user joined room: ${room}`);

        if (rooms[room] && rooms[room].magnetLink) {
            socket.emit('magnetLink', rooms[room].magnetLink);
        }
    });

    socket.on('submitMagnetLink', ({ room, magnetLink }) => {
        console.log(`Host submitted magnet link for room ${room}: ${magnetLink}`);
        rooms[room] = { magnetLink };
        io.to(room).emit('magnetLink', magnetLink);
    });

    socket.on('seek', ({ room, time }) => {
        console.log(`Seek in room ${room}: ${time}`);
        socket.to(room).emit('seek', time);
    });

    socket.on('play', ({ room }) => {
        console.log(`Play in room ${room}`);
        socket.to(room).emit('play');
    });

    socket.on('pause', ({ room }) => {
        console.log(`Pause in room ${room}`);
        socket.to(room).emit('pause');
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
