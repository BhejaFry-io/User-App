import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Only connect if we have a valid JWT token
    if (token) {
      const newSocket = io('https://api.bhejafry.fun', {
        auth: {
          token: token // Pass the JWT to the backend middleware
        }
      });

      newSocket.on('connect', () => {
        console.log('🟢 Connected to Socket server');
      });

      newSocket.on('connect_error', (err) => {
        console.error('🔴 Socket connection error:', err.message);
      });

      setSocket(newSocket);

      // Cleanup on unmount or token change
      return () => {
        newSocket.disconnect();
      };
    }
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};