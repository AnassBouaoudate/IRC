import React, { useState } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
import ChannelChat from './components/ChannelChat';

const App = () => {
  const [user, setUser] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);

  return (
    <div className="app">
      {user ? (
        currentChannel ? (
          <ChannelChat 
            username={user} 
            setUsername={setUser} 
            channel={currentChannel} 
            changeChannel={setCurrentChannel} 
          />
        ) : (
          <Chat 
            username={user} 
            setUsername={setUser} 
            changeChannel={setCurrentChannel} 
          />
        )
      ) : (
        <Login setUser={setUser} />
      )}
    </div>
  );
};

export default App;

