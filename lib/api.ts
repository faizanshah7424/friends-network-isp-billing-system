import axios from 'axios';

const getBaseURL = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api/v1';
    } else {
      return 'https://friends-network-isp-billing-system-production.up.railway.app/api/v1';
    }
  }
  
  return 'http://localhost:8000/api/v1';
};

const resolvedBaseURL = getBaseURL();
console.log('[Axios] Creating instance with resolvedBaseURL:', resolvedBaseURL);

const api = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token if it exists in localStorage
api.interceptors.request.use(
  (config) => {
    console.log('[Axios Request Interceptor] Sending request to:', config.url, 'headers:', config.headers);
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('fnb_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[Axios Request Interceptor] Token attached');
      }
    }
    return config;
  },
  (error) => {
    console.error('[Axios Request Interceptor] Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally and trigger 401 redirects
api.interceptors.response.use(
  (response) => {
    console.log('[Axios Response Interceptor] Successful response from:', response.config.url);
    return response;
  },
  (error) => {
    console.error('[Axios Response Interceptor] Error received:', error.message, 'status:', error.response?.status, 'data:', error.response?.data);
    const status = error.response ? error.response.status : null;

    if (status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fnb_access_token');
        localStorage.removeItem('fnb_current_user');
        
        // Prevent infinite redirect loops if we are already on the login page
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
