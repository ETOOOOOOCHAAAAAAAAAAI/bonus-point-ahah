const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');
const roomForm = document.getElementById('room-form');
const roomIdInput = document.getElementById('room-id');
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const roomInfo = document.getElementById('room-info');

const peers = {};
let myStream;
let currentRoomId = null;
let myId = null;

// Генерация случайного ID комнаты
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8);
}

// Создание новой комнаты
createRoomBtn.addEventListener('click', () => {
    const roomId = generateRoomId();
    roomIdInput.value = roomId;
    joinRoom(roomId);
});

// Присоединение к существующей комнате
joinRoomBtn.addEventListener('click', () => {
    const roomId = roomIdInput.value.trim();
    if (roomId) {
        joinRoom(roomId);
    } else {
        alert('Пожалуйста, введите ID комнаты');
    }
});

// Функция присоединения к комнате
function joinRoom(roomId) {
    currentRoomId = roomId;
    roomForm.style.display = 'none';
    roomInfo.style.display = 'block';
    roomInfo.textContent = `Комната: ${roomId}`;
    joinBtn.style.display = 'block';
    
    // Обновляем URL с ID комнаты
    window.history.pushState({}, '', `/${roomId}`);
}

// Получение доступа к камере и микрофону
async function getMedia() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        addVideoStream(myStream, 'me');

        // Получаем свой socket.id
        socket.on('connect', () => {
            myId = socket.id;
        });
        // Присоединение к комнате
        socket.emit('join-room', currentRoomId, socket.id);

        // Получаем список уже присутствующих пользователей и инициируем соединения
        socket.on('all-users', (users) => {
            users.forEach(userId => {
                if (!peers[userId]) {
                    createPeer(userId, true); // инициатор только новый
                }
            });
        });

        // Обработка входящих соединений
        socket.on('user-connected', userId => {
            // ничего не делаем, инициатор только новый участник
        });

        // Обработка отключения пользователей
        socket.on('user-disconnected', userId => {
            if (peers[userId]) {
                peers[userId].destroy();
                delete peers[userId];
            }
            removeVideoStream(userId);
        });
    } catch (err) {
        console.error('Ошибка доступа к медиаустройствам:', err);
    }
}

// Добавление видео в сетку
function addVideoStream(stream, userId) {
    if (document.getElementById('video-' + userId)) return;
    const video = document.createElement('video');
    video.id = 'video-' + userId;
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    const container = document.createElement('div');
    container.className = 'video-container';
    container.appendChild(video);
    videoGrid.appendChild(container);
}

function removeVideoStream(userId) {
    const video = document.getElementById('video-' + userId);
    if (video && video.parentNode) {
        video.parentNode.remove();
    }
}

// Создание peer-соединения
function createPeer(userId, initiator) {
    const peer = new SimplePeer({
        initiator: initiator,
        trickle: false,
        stream: myStream
    });

    peer.on('signal', signal => {
        socket.emit('signal', {
            target: userId,
            signal
        });
    });

    peer.on('stream', userStream => {
        addVideoStream(userStream, userId);
    });

    peer.on('error', err => {
        console.error('Ошибка peer соединения:', err);
    });

    peers[userId] = peer;
}

// Обработка входящих сигналов
socket.on('signal', data => {
    if (!peers[data.from]) {
        createPeer(data.from, false); // не инициатор, если уже есть peer — не создаём
    }
    peers[data.from].signal(data.signal);
});

// Обработчики кнопок
joinBtn.addEventListener('click', () => {
    getMedia();
    joinBtn.style.display = 'none';
    leaveBtn.style.display = 'block';
});

leaveBtn.addEventListener('click', () => {
    if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
    }
    Object.values(peers).forEach(peer => peer.destroy());
    videoGrid.innerHTML = '';
    joinBtn.style.display = 'block';
    leaveBtn.style.display = 'none';
    roomForm.style.display = 'flex';
    roomInfo.style.display = 'none';
    currentRoomId = null;
    myId = null;
});

// Проверка URL при загрузке страницы
window.addEventListener('load', () => {
    const path = window.location.pathname;
    if (path.length > 1) {
        const roomId = path.substring(1);
        roomIdInput.value = roomId;
        joinRoom(roomId);
    }
}); 