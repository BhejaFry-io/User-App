import React, { createContext, useState, useEffect } from 'react';
import { loginWithGoogle } from '../api/services';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 1. Initialize user from localStorage [cite: 339]
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const login = async (googleIdToken) => {
    try {
      const data = await loginWithGoogle(googleIdToken);
      if (data.success) {
        setToken(data.data.token);
        setUser(data.data.user);
        
        // 2. Save both token and user object [cite: 342]
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user)); 
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // 3. Clear user on logout [cite: 344]
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};