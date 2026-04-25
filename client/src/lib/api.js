import axios from 'axios';
import { auth } from './firebase.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Dummy mode: send a specific header to identify bypass
    config.headers.Authorization = `Bearer dummy_token`;
  }
  return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────
export const registerUser  = (data)    => api.post('/auth/register', data);
export const getMe         = ()        => api.get('/auth/me');

// ─── Needs ───────────────────────────────────────────────────────────────────
export const getNeeds      = (params)  => api.get('/needs', { params });
export const getNeed       = (id)      => api.get(`/needs/${id}`);
export const createNeed    = (data)    => api.post('/needs', data);
export const updateNeed    = (id, data)=> api.patch(`/needs/${id}`, data);
export const deleteNeed    = (id)      => api.delete(`/needs/${id}`);

// ─── Volunteers ───────────────────────────────────────────────────────────────
export const getVolunteers   = (params)  => api.get('/volunteers', { params });
export const getVolunteer    = (id)      => api.get(`/volunteers/${id}`);
export const updateVolunteer = (id, data) => api.patch(`/volunteers/${id}`, data);
export const updateFcmToken  = (fcm_token) => api.patch(`/volunteers/fcm-token`, { fcm_token });

// ─── Tasks ───────────────────────────────────────────────────────────────────
export const getTasks      = (params)  => api.get('/tasks', { params });
export const getTask       = (id)      => api.get(`/tasks/${id}`);
export const createTask    = (data)    => api.post('/tasks', data);
export const smartAssignTask = (needReportId) => api.post('/tasks/assign', { needReportId });
export const updateTaskStatus = (id, status) => api.patch(`/tasks/${id}/status`, { status });

// ─── Feedback ────────────────────────────────────────────────────────────────
export const submitFeedback = (data)   => api.post('/feedback', data);
export const getFeedback    = (taskId) => api.get(`/feedback/${taskId}`);

// ─── Upload ──────────────────────────────────────────────────────────────────
export const uploadPhoto = (formData, config = {})  => api.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  ...config,
});

// ─── AI & Reports ─────────────────────────────────────────────────────────────
export const analyseUrgency      = (needReportId) => api.post('/ai/analyse-urgency', { needReportId });
export const suggestVolunteers   = (needReportId) => api.post('/ai/suggest-volunteers', { needReportId });
export const getMonthlySummary   = ()             => api.get('/reports/monthly-summary');

// ─── Users ───────────────────────────────────────────────────────────────────
export const getUsers      = ()        => api.get('/users');
export const updateUser    = (id, data)=> api.patch(`/users/${id}`, data);
export const deleteUser    = (id)      => api.delete(`/users/${id}`);

export default api;
