import { apiClient } from './axiosClient';

// --- AUTH ---
// POST /api/auth/google
export const loginWithGoogle = async (idToken) => {
  const response = await apiClient.post('/auth/google', { idToken });
  return response.data;
};

// 🟢 NEW: POST /api/auth/guest
export const loginGuestAPI = async (username) => {
  const response = await apiClient.post('/auth/guest', { username });
  return response.data;
};

// --- ROOMS ---
// POST /api/rooms
export const createRoom = async (roomData) => {
  const response = await apiClient.post('/rooms', roomData);
  return response.data;
};

// POST /api/rooms/join
export const joinRoom = async (joinData) => {
  // joinData can be { roomId } or { inviteCode }
  const response = await apiClient.post('/rooms/join', joinData);
  return response.data;
};

// GET /api/rooms/:id/participants
export const getRoomParticipants = async (roomId) => {
  const response = await apiClient.get(`/rooms/${roomId}/participants`);
  return response.data;
};

// POST /api/rooms/:id/leave
export const leaveRoom = async (roomId) => {
  const response = await apiClient.post(`/rooms/${roomId}/leave`);
  return response.data;
};

export const getRoomDetails = async (roomId) => {
  const response = await apiClient.get(`/rooms/${roomId}`);
  return response.data;
};

// PUT /api/rooms/:id/categories
export const updateRoomCategories = async (roomId, categoryIds) => {
  const response = await apiClient.put(`/rooms/${roomId}/categories`, { categories: categoryIds });
  return response.data;
};

export const getCategories = async () => {
  const response = await apiClient.get('/categories');
  return response.data;
};

// PUT /api/rooms/:id/settings
export const updateRoomSettings = async (roomId, settings) => {
  const response = await apiClient.put(`/rooms/${roomId}/settings`, { settings });
  return response.data;
};

// POST /api/rooms/:id/start (Updated endpoint)
export const startGame = async (roomId) => {
  const response = await apiClient.post(`/rooms/${roomId}/start`);
  return response.data;
};