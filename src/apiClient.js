import axios from 'axios';

// Get backend URL
const BACKEND_URL = import.meta.env.PROD 
  ? 'https://rams-kgmh.onrender.com' 
  : 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT access token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('rams_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to automatically refresh tokens
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response && 
      error.response.status === 401 && 
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/google')
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('rams_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${BACKEND_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          if (res.status === 200) {
            const { access_token, refresh_token } = res.data;
            localStorage.setItem('rams_access_token', access_token);
            if (refresh_token) {
              localStorage.setItem('rams_refresh_token', refresh_token);
            }
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails, clear everything and redirect to login
          localStorage.removeItem('rams_access_token');
          localStorage.removeItem('rams_refresh_token');
          localStorage.removeItem('rams_user');
          window.location.href = '/admin';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
