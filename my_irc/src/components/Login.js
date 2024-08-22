import React, { useState } from 'react';
import io from 'socket.io-client';
import './Login.css';

const socket = io('http://localhost:4000');

const Login = ({ setUser }) => {
  const [username, setUsername] = useState('');

  const handleLogin = () => {
    if (username.trim()) {
      socket.emit('join', { username, channel: 'general' });
      setUser(username);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <input
        type="text"
        className="username-input"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button className="login-button" onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
