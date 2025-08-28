
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // or specify your allowed origin
    methods: ["GET", "POST"]
  }
});

let users = {};

io.on('connection', (socket) => {
  // User joins
  socket.on('join', (username) => {
    users[socket.id] = { username, status: 'online' };
    io.emit('users', users);
  });

  // User sends a message
  socket.on('message', (msg) => {
    io.emit('message', { ...msg, time: new Date() });
  });

  // User typing status
  socket.on('typing', (isTyping) => {
    if (users[socket.id]) {
      users[socket.id].typing = isTyping;
      io.emit('users', users);
    }
  });

  // User disconnects
  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('users', users);
  });
});

app.get('/', (req, res) => {
  res.send('Express server with Socket.IO is running.');
});

httpServer.listen(8080, '0.0.0.0', () => {
  console.log('Express & Socket.IO server running on port 8080');
});