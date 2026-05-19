import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
  : '/api';

if (window.electronAPI) {
  baseURL = 'http://localhost:3001/api';
}

const api = axios.create({ baseURL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('sos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sos_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
