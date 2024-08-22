import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './ChannelChat.css';

const socket = io('http://localhost:4000');

const ChannelChat = ({ username, setUsername, channel, changeChannel }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    socket.emit('join', { username, channel });

    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('users', (users) => {
      setUsers(users);
    });

    return () => {
      socket.off('message');
      socket.off('users');
    };
  }, [username, channel]);

  const handleSend = () => {
    if (message.trim()) {
      const chatMessage = { username, text: message, channel };
      socket.emit('message', chatMessage);
      setMessage('');
    }
  };

  const handleChangeUsername = () => {
    if (newUsername.trim()) {
      socket.emit('changeUsername', { oldUsername: username, newUsername });
      setUsername(newUsername);
      setNewUsername('');
    }
  };

  return (
    <div className="channel-chat-page">
      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, index) => (
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
        <h3>Utilisateurs dans {channel}</h3>
        {users
          .filter(user => user.channel === channel)
          .map((user, index, self) => (
            self.findIndex(u => u.username === user.username) === index && (
              <div key={user.id}>{user.username}</div>
            )
        ))}
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
        <button className="leave-channel-button" onClick={() => changeChannel(null)}>Leave Channel</button>
      </div>
    </div>
  );
};

export default ChannelChat;
