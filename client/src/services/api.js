import axios from 'axios';

// In production, the API is hosted on the same domain at the root URL
// In development, we use localhost:5000/api
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Use relative path in production
  : process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API Service initialized with base URL:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Set timeout to prevent long-hanging requests
    timeout: 10000
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
        console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log(`API Response: ${response.status} from ${response.config.url}`);
        return response;
    },
    (error) => {
        // Check for network errors
        if (error.message === 'Network Error') {
            console.error('Network Error: Unable to connect to the API server. Please check your connection and ensure the server is running.');
            // Show a user-friendly toast or message here if you have a notification system
        }
        else if (error.code === 'ECONNABORTED') {
            console.error('Request timeout: The server took too long to respond.');
        }
        else if (error.response) {
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

// Add a method to test API connectivity
api.testConnection = async () => {
    try {
        const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
        return { success: true, status: response.status };
    } catch (error) {
        return { 
            success: false, 
            error: error.message,
            isNetworkError: error.message === 'Network Error'
        };
    }
};

export default api; 