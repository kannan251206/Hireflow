import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 60000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hireflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hireflow_token');
      localStorage.removeItem('hireflow_user');
    }
    return Promise.reject(err);
  }
);

export const register    = (data) => api.post('/auth/register', data);
export const login       = (data) => api.post('/auth/login', data);
export const analyzeResume = (formData) => api.post('/candidate/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getHistory  = () => api.get('/candidate/history');
export const rankResumes = (formData) => api.post('/recruiter/rank', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export default api;
