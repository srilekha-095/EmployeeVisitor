import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token is rejected (expired / account removed), log the user out
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const onAuthPage = ['/login', '/register'].includes(window.location.pathname);
    if (error.response?.status === 401 && localStorage.getItem('token') && !onAuthPage) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
