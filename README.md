# Video Conference Server — Socket.IO Load Test

## Описание

простенький видео конф
---

### старт

### 1. Установка зависимостей

```sh
npm install
```

### 2. Запуск сервера

В одном терминале:
```sh
node server.js
```

Сервер будет слушать порт 3000.

### 3. Запуск нагрузочного теста (30 клиентов)

В другом терминале:
```sh
npm start
```

создастся 30 клиентов, которые подключатся к серверу и присоединятся к комнате `testroom`.

Тест автоматически завершится через 60 секунд

