import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  loginLocal: (email: string, password: string) =>
    api.post('/auth/login-local', { email, password }),

  loginGoogle: (googleId: string, email: string, fullName: string, avatarUrl: string) =>
    api.post('/auth/login-google', { googleId, email, fullName, avatarUrl }),

  verify: () =>
    api.post('/auth/verify'),
};

export const eventsApi = {
  getMyEvents: () =>
    api.get('/events/my-events'),

  getApprovedEvents: () =>
    api.get('/events/approved'),

  getPendingEvents: () =>
    api.get('/events/pending'),

  getEvent: (id: number) =>
    api.get(`/events/${id}`),

  createEvent: (data: any) =>
    api.post('/events/create', data),

  updateEvent: (id: number, data: any) =>
    api.put(`/events/${id}`, data),

  deleteEvent: (id: number) =>
    api.delete(`/events/${id}`),

  approveEvent: (eventId: number) =>
    api.post('/events/approve', { eventId }),

  rejectEvent: (eventId: number) =>
    api.post('/events/reject', { eventId }),
};

export default api;
