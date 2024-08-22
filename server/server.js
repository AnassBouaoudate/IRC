const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

let users = [];
let channels = [{ name: 'general', creator: 'system', lastMessageDate: new Date() }];
let channelTimers = {};  //stck timer

const startChannelTimer = (channelName) => {
  clearTimeout(channelTimers[channelName]);
  channelTimers[channelName] = setTimeout(() => {
    channels = channels.filter(channel => channel.name !== channelName);
    io.emit('channels', channels);
    const notificationMessage = {
      username: 'GitBot',
      text: `Le canal ${channelName} a été supprimé pour cause d'inactivité.`,
      channel: 'global'
    };
    io.emit('message', notificationMessage);
  },  172800000);
};

io.on('connection', (socket) => {
  console.log('Un utilisateur s\'est connecté');

  socket.on('join', ({ username, channel }) => {
    console.log(`${username} a rejoint ${channel}`);
    let existingUser = users.find(user => user.id === socket.id);
    let isRejoining = false;

    if (existingUser) {
      socket.leave(existingUser.channel);
      if (existingUser.channel === channel) {
        isRejoining = true;
      }
      existingUser.channel = channel;
    } else {
      existingUser = { id: socket.id, username, channel };
      users.push(existingUser);
    }

    socket.join(channel);

    users = users.filter((user, index, self) =>
      index === self.findIndex((u) => (
        u.id === user.id
      ))
    );

    io.emit('users', users);
    socket.emit('channels', channels);

    if (!isRejoining) {
      const notificationMessage = {
        username: 'GitBot',
        text: `${username} a rejoint ${channel}`,
        channel: 'global'
      };
      io.emit('message', notificationMessage);
    }
  });

  socket.on('createChannel', ({ channelName, username }) => {
    const newChannel = { name: channelName, creator: username, lastMessageDate: new Date() };
    channels.push(newChannel);
    io.emit('channels', channels);

    const notificationMessage = {
      username: 'GitBot',
      text: `${username} a créé le canal ${channelName}`,
      channel: 'global'
    };
    io.emit('message', notificationMessage);

    startChannelTimer(channelName);
  });

  socket.on('deleteChannel', ({ channelName, username }) => {
    channels = channels.filter(channel => channel.name !== channelName);
    io.emit('channels', channels);
    clearTimeout(channelTimers[channelName]); 

    const notificationMessage = {
      username: 'GitBot',
      text: `${username} a supprimé le canal ${channelName}`,
      channel: 'global'
    };
    io.emit('message', notificationMessage);
  });

  socket.on('changeChannelName', ({ oldName, newName, username }) => {
    const channel = channels.find(channel => channel.name === oldName);
    if (channel && channel.creator === username) {
      channel.name = newName;
      io.emit('channels', channels);
      io.to(oldName).emit('channelNameChanged', { oldName, newName });
      io.in(oldName).socketsJoin(newName);
      io.in(oldName).socketsLeave(oldName);

      channelTimers[newName] = channelTimers[oldName];
      delete channelTimers[oldName];

      const notificationMessage = {
        username: 'GitBot',
        text: `${username} a modifié le nom du canal ${oldName} en ${newName}`,
        channel: 'global'
      };
      io.emit('message', notificationMessage);
    } else {
      socket.emit('error', 'vous ne pouvez pas modifier le nom de ce canal');
    }
  });

  socket.on('leaveChannel', ({ username, channel }) => {
    if (channel !== 'general') {
      socket.leave(channel);
      const notificationMessage = {
        username: 'GitBot',
        text: `${username} a quitté ${channel}`,
        channel: 'global'
      };
      io.emit('message', notificationMessage);
      const user = users.find(user => user.id === socket.id);
      if (user) {
        user.channel = 'general';
      }
      socket.join('general');
      io.emit('users', users);
    }
  });

  socket.on('message', (message) => {
    const channel = channels.find(channel => channel.name === message.channel);
    if (channel) {
      channel.lastMessageDate = new Date();
    }

    io.to(message.channel).emit('message', message);

    startChannelTimer(message.channel);  //reset chq msg
  });

  socket.on('changeUsername', ({ oldUsername, newUsername }) => {
    const user = users.find(user => user.username === oldUsername);
    if (user) {
      user.username = newUsername;
      io.emit('users', users);
      const notificationMessage = {
        username: 'GitBot',
        text: `${oldUsername} a changé son nom en ${newUsername}`,
        channel: 'global'
      };
      io.emit('message', notificationMessage);
    } else {
      socket.emit('error', 'User not found.');
    }
  });

  socket.on('disconnect', () => {
    console.log('Un utilisateur s\'est déconnecté');
    users = users.filter(user => user.id !== socket.id);
    io.emit('users', users);
  });
});

const PORT = 4000;
server.listen(PORT, () => console.log(`Le serveur tourne sur le port ${PORT}`));
