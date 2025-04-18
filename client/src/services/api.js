import axios from 'axios';

// In production, the API is hosted on the same domain at the root URL
// In development, we use localhost:5000/api
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Use relative path in production
  : process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Use sports_auth_token to match the key in utils/auth.js
        const token = localStorage.getItem('sports_auth_token');
        if (token) {
            // Use x-auth-token header as expected by the server
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error('Response error:', error.response.status, error.response.data);
            
            if (error.response.status === 401) {
                // Handle unauthorized access - use sports_auth_token to match utils/auth.js
                localStorage.removeItem('sports_auth_token');
                localStorage.removeItem('sports_user');
                
                // Only redirect to login if we're not already on the login page
                const currentPath = window.location.pathname;
                if (currentPath !== '/login') {
                    window.location.href = '/login';
                }
            }
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        
        return Promise.reject(error);
    }
);

export default api; 