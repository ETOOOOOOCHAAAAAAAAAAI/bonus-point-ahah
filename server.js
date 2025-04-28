const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
app.use(express.static('public'));
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    const usersInRoom = Array.from(rooms.get(roomId));
    socket.emit('all-users', usersInRoom.filter(id => id !== userId));
    rooms.get(roomId).add(userId);
    socket.to(roomId).emit('user-connected', userId);
    socket.on('signal', (data) => {
      io.to(data.target).emit('signal', {
        signal: data.signal,
        from: userId
      });
    });
    socket.on('disconnect', () => {
      rooms.get(roomId)?.delete(userId);
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
