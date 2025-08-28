const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
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

httpServer.listen(3001, '0.0.0.0', () => {
  console.log('Socket.IO server running on port 3001');
});