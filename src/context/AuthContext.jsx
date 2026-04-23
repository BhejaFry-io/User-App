import React, { createContext, useState, useEffect } from 'react';
import { loginWithGoogle, loginGuestAPI } from '../api/services';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 1. Initialize user from localStorage
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
        
        // 2. Save both token and user object
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user)); 
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  // 🟢 Guest Login Context Function
  const loginGuest = async (username) => {
    try {
      const data = await loginGuestAPI(username);
      if (data.success) {
        setToken(data.data.token);
        setUser(data.data.user);
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user)); 
        return { success: true };
      }
    } catch (error) {
      console.error("Guest Login failed", error);
      return { success: false };
    }
  };

  // 3. Clear user and token on logout
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user'); 
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loginGuest }}>
      {children}
    </AuthContext.Provider>
  );
};