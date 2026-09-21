import axios from 'axios';

const getDefaultApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://testforge-server.vercel.app';
  }
  return 'http://localhost:5000';
};

const BASE_URL = getDefaultApiUrl();

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: automatically attach Authorization Bearer token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract error messages cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      (Array.isArray(error.response?.data?.errors)
        ? error.response.data.errors.join(', ')
        : null) ||
      (error.code === 'ERR_NETWORK' || error.message === 'Network Error'
        ? `Network Error: Unable to connect to TestForge backend server at ${BASE_URL}. Please check that the server is running.`
        : error.message) ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
