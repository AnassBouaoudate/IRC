import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './Chat.css';

const socket = io('http://localhost:4000');

const Chat = ({ username, setUsername, changeChannel }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([{ name: 'general', creator: 'system' }]);
  const [newChannel, setNewChannel] = useState('');
  const [currentChannel, setCurrentChannelState] = useState('general');
  const [newChannelName, setNewChannelName] = useState('');
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connecté au serveur');
      socket.emit('join', { username, channel: currentChannel });
    });

    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('users', (users) => {
      setUsers(users);
    });

    socket.on('channels', (channels) => {
      setChannels(channels);
    });

    socket.on('channelNameChanged', ({ oldName, newName }) => {
      if (currentChannel === oldName) {
        setCurrentChannelState(newName);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('message');
      socket.off('users');
      socket.off('channels');
      socket.off('channelNameChanged');
    };
  }, [username, currentChannel]);

  const handleCommand = (command) => {
    const [action, ...args] = command.slice(1).split(' ');
    switch (action.toLowerCase()) {
      case 'create':
        if (args.length > 0) {
          const channelName = args.join(' ');
          socket.emit('createChannel', { channelName, username });
        }
        break;
      case 'delete':
        if (args.length > 0) {
          const channelName = args.join(' ');
          socket.emit('deleteChannel', { channelName, username });
          if (currentChannel === channelName) {
            setCurrentChannelState('general');
          }
        }
        break;
      case 'join':
        if (args.length > 0) {
          const channelName = args.join(' ');
          setCurrentChannelState(channelName);
          socket.emit('join', { username, channel: channelName });
        }
        break;
      case 'leave':
        if (currentChannel !== 'general') {
          socket.emit('leaveChannel', { username, channel: currentChannel });
          setCurrentChannelState('general');
        }
        break;
      case 'nick': 
        if (args.length > 0) {
          const newNickname = args.join(' ');
          socket.emit('changeUsername', { oldUsername: username, newUsername: newNickname });
          setUsername(newNickname);
        }
        break;
      default:
        console.log('Unknown command');
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      if (message.startsWith('/')) {
        handleCommand(message);
      } else {
        const chatMessage = { username, text: message, channel: currentChannel };
        socket.emit('message', chatMessage);
      }
      setMessage('');
    }
  };

  const handleCreateChannel = () => {
    if (newChannel.trim()) {
      socket.emit('createChannel', { channelName: newChannel, username });
      setNewChannel('');
    }
  };

  const handleDeleteChannel = (channelName) => {
    socket.emit('deleteChannel', { channelName, username });
    if (currentChannel === channelName) {
      setCurrentChannelState('general');
    }
  };

  const handleChangeChannelName = () => {
    if (newChannelName.trim()) {
      socket.emit('changeChannelName', { oldName: currentChannel, newName: newChannelName, username });
      setCurrentChannelState(newChannelName); 
      setNewChannelName('');
    }
  };

  const handleChangeUsername = () => {
    if (newUsername.trim()) {
      socket.emit('changeUsername', { oldUsername: username, newUsername });
      setUsername(newUsername);
      setNewUsername('');
    }
  };

  const handleLeaveChannel = () => {
    if (currentChannel !== 'general') {
      socket.emit('leaveChannel', { username, channel: currentChannel });
      setCurrentChannelState('general');
    }
  };

  const changeChannelInternal = (channel) => {
    if (currentChannel !== channel) {
      setCurrentChannelState(channel);
      socket.emit('join', { username, channel });
    }
  };

  return (
    <div className="chat-page">
      <div className="sidebar">
        <div className="channel-list">
          <h3>Channels</h3>
          <div className="channel-item">
            <span>general</span>
            <button onClick={() => changeChannelInternal('general')}>Ouvrir</button>
          </div>
          {channels.slice(1).map((channel, index) => (
            <div key={index} className="channel-item">
              <span>{channel.name}</span>
              <button onClick={() => changeChannelInternal(channel.name)}>Ouvrir</button>
            </div>
          ))}
          <input
            type="text"
            className="channel-input"
            placeholder="New channel"
            value={newChannel}
            onChange={(e) => setNewChannel(e.target.value)}
          />
          <button className="create-channel-button" onClick={handleCreateChannel}>Create Channel</button>
        </div>
      </div>
      <div className="chat-container">
        <div className="messages">
          {messages.filter(msg => msg.channel === currentChannel || msg.channel === 'global').map((msg, index) => (
            <div key={index} className={`message ${msg.username === 'GitBot' ? 'gitbot-message' : ''}`}>
              <strong>{msg.username}:</strong> {msg.text}
            </div>
          ))}
        </div>
        <div className="input-container">
          <input
            type="text"
            className="message-input"
            placeholder="Enter your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="send-button" onClick={handleSend}>Send</button>
        </div>
      </div>
      <div className="user-list">
        <h3>Utilisateurs dans {currentChannel}</h3>
        {users
          .filter(user => user.channel === currentChannel)
          .map((user, index, self) => (
            self.findIndex(u => u.username === user.username) === index && (
              <div key={user.id}>{user.username}</div>
            )
        ))}
        {channels.find(channel => channel.name === currentChannel && channel.creator === username) && (
          <div>
            <input
              type="text"
              className="channel-input"
              placeholder="New channel name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
            />
            <button className="change-channel-name-button" onClick={handleChangeChannelName}>Change Channel Name</button>
            <button className="delete-channel-button" onClick={() => handleDeleteChannel(currentChannel)}>Delete Channel</button>
            <button className="leave-channel-button" onClick={handleLeaveChannel}>Leave Channel</button>
          </div>
        )}
        <div>
          <input
            type="text"
            className="username-input"
            placeholder="New username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <button className="change-username-button" onClick={handleChangeUsername}>Change Username</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
