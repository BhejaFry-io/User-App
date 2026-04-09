import React, { createContext, useState, useEffect } from 'react';
import { loginWithGoogle } from '../api/services';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    // In a real app, you might want to decode the JWT here to restore user state on refresh
    // or call the /api/me endpoint you set up in server.js
  }, [token]);

  const login = async (googleIdToken) => {
    try {
      const data = await loginWithGoogle(googleIdToken);
      if (data.success) {
        setToken(data.data.token);
        setUser(data.data.user);
        localStorage.setItem('token', data.data.token);
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};