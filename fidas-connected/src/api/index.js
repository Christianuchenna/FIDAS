/**
 * FiDAS API Client
 * Central axios instance — all API calls go through here.
 * Automatically attaches JWT token from localStorage to every request.
 */

import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fidas_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem('fidas_token');
      localStorage.removeItem('fidas_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth endpoints ────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login:    (data) => API.post('/auth/login', data),
  getMe:    ()     => API.get('/auth/me'),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword:  (token, data) => API.post(`/auth/reset-password/${token}`, data),
  updateProfile:  (data) => API.patch('/auth/me', data),
  changePassword: (data) => API.patch('/auth/change-password', data),
};
// ── Document endpoints ────────────────────────────────────────────────────────
export const documentAPI = {
  getStatus: () => API.get('/documents/status'),

  upload: (docType, file) => {
    const formData = new FormData();
    formData.append('doc_type', docType);
    formData.append('document', file);
    return API.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  finalize: () => API.post('/documents/finalize'),
};

// ── Admin endpoints ───────────────────────────────────────────────────────────
// Uses its own token (fidas_admin_token) instead of the shared interceptor,
// so an admin session never conflicts with a student session in another tab.
export const adminAPI = {
  login: (data) => API.post('/admin/login', data),
  getClearedStudents: () => {
    const adminToken = localStorage.getItem('fidas_admin_token');
    return API.get('/admin/cleared-students', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  },
};

// ── Contact endpoint ──────────────────────────────────────────────────────────
export const contactAPI = {
  send: (data) => API.post('/contact', data),
};
export default API;
