const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Статические файлы
app.use(express.static('public'));

// Хранение активных комнат
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Присоединение к комнате
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    // Получаем список уже присутствующих
    const usersInRoom = Array.from(rooms.get(roomId));
    // Отправляем список новому участнику
    socket.emit('all-users', usersInRoom.filter(id => id !== userId));
    rooms.get(roomId).add(userId);
    
    // Уведомляем других участников о новом пользователе
    socket.to(roomId).emit('user-connected', userId);

    // Обработка сигналов WebRTC
    socket.on('signal', (data) => {
      io.to(data.target).emit('signal', {
        signal: data.signal,
        from: userId
      });
    });

    // Отключение пользователя
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