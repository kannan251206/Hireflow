import axios from 'axios';

let apiURL = process.env.REACT_APP_API_URL || 'https://hireflow-three-mu.vercel.app/api';

// Ensure the URL starts with http:// or https:// (otherwise Axios treats it as relative)
if (apiURL && !apiURL.startsWith('http://') && !apiURL.startsWith('https://')) {
  apiURL = `https://${apiURL}`;
}

// Ensure it ends with /api
if (apiURL && !apiURL.endsWith('/api') && !apiURL.endsWith('/api/')) {
  apiURL = apiURL.endsWith('/') ? `${apiURL}api` : `${apiURL}/api`;
}

const api = axios.create({
  baseURL: apiURL,
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
