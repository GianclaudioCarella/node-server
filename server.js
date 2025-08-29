const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      // 'http://localhost:3000',
      // 'http://localhost:3001',
      // 'http://192.168.2.94:3000',
      // 'http://192.168.2.94:3001',
      'https://private-chat-teal.vercel.app/',
      'https://gmc-server-node-dxgzduech2fxftdv.swedencentral-01.azurewebsites.net'],
    methods: ["GET", "POST"]
  }
});


// Generate 5 random room names
function generateRoomNames(count) {
  const rooms = [];
  const adjectives = ['Blue', 'Green', 'Red', 'Yellow', 'Purple', 'Orange', 'Silver', 'Golden', 'Happy', 'Silent'];
  const nouns = ['Tiger', 'Eagle', 'Shark', 'Wolf', 'Lion', 'Falcon', 'Bear', 'Panther', 'Dragon', 'Phoenix'];
  while (rooms.length < count) {
    const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}`;
    if (!rooms.includes(name)) rooms.push(name);
  }
  return rooms;
}

const ROOM_COUNT = 5;
const roomNames = generateRoomNames(ROOM_COUNT);
// { roomName: { socketId: { username, typing } } }
const rooms = {};
roomNames.forEach(room => { rooms[room] = {}; });

io.on('connection', (socket) => {
  // Send available rooms to the client
  socket.emit('roomList', roomNames);

  // User joins a room
  socket.on('joinRoom', ({ username, room }) => {
    if (!roomNames.includes(room)) {
      socket.emit('error', 'Room does not exist.');
      return;
    }
    // Leave all rooms first
    for (const r of roomNames) {
      if (rooms[r][socket.id]) {
        delete rooms[r][socket.id];
        socket.leave(r);
        io.to(r).emit('users', rooms[r]);
        io.to(r).emit('message', { system: true, text: `${username} left the room.`, time: new Date() });
      }
    }
    // Join new room
    rooms[room][socket.id] = { username, typing: false };
    socket.join(room);
    io.to(room).emit('users', rooms[room]);
    io.to(room).emit('message', { system: true, text: `${username} joined the room.`, time: new Date() });
  });

  // User sends a message to a room
  socket.on('message', ({ room, msg, username }) => {
    if (roomNames.includes(room) && rooms[room][socket.id]) {
      io.to(room).emit('message', { username, text: msg, time: new Date() });
    }
  });

  // User typing status in a room
  socket.on('typing', ({ room, isTyping }) => {
    if (roomNames.includes(room) && rooms[room][socket.id]) {
      rooms[room][socket.id].typing = isTyping;
      io.to(room).emit('users', rooms[room]);
    }
  });

  // User disconnects
  socket.on('disconnect', () => {
    for (const room of roomNames) {
      if (rooms[room][socket.id]) {
        const username = rooms[room][socket.id].username;
        delete rooms[room][socket.id];
        io.to(room).emit('users', rooms[room]);
        io.to(room).emit('message', { system: true, text: `${username} left the room.`, time: new Date() });
      }
    }
  });
});

app.get('/', (req, res) => {
  res.send('Express server with Socket.IO is running.');
});

const port = process.env.PORT || 3001;
httpServer.listen(port, () => {
  console.log(`Express & Socket.IO server running on port ${port}`);
  console.log('Available chat rooms:', roomNames.join(', '));
});