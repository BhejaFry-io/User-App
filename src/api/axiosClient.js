import axios from 'axios';

const BASE_URL = 'https://api.bhejafry.fun/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach the JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 🟢 NEW: Interceptor to catch expired tokens and force logout
apiClient.interceptors.response.use(
  (response) => response, // If the request succeeds, just pass it through
  (error) => {
    // If the server says the token is expired or invalid (401 or 403)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Session expired. Logging out...");
      
      // Wipe the dead session data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Force reload the page to clear React state and send them to the login screen
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error); // Reject the promise so your component catch blocks still fire
  }
);