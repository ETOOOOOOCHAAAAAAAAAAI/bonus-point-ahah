const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';
const ROOM_ID = 'testroom';
const CLIENTS = 100; //

const clients = [];
let connectedCount = 0;

for (let i = 0; i < CLIENTS; i++) {
    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socket.on('connect', () => {
        socket.emit('join-room', ROOM_ID, socket.id);
        connectedCount++;
        console.log(`[${i}] Подключен к серверу (всего: ${connectedCount})`);
    });
    socket.on('disconnect', () => {
        connectedCount--;
        console.log(`[${i}] Отключен от сервера (всего: ${connectedCount})`);
    });
    clients.push(socket);
}

setTimeout(() => {
    clients.forEach(socket => socket.disconnect());
    console.log('Тест завершён.');
    process.exit(0);
}, 60000);