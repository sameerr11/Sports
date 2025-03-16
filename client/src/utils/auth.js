// Storage keys
const TOKEN_KEY = 'sports_auth_token';
const USER_KEY = 'sports_user';

// Get stored auth token
export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Save auth token
export const saveAuthToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Remove auth token
export const removeAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// Get stored user
export const getStoredUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  try {
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (error) {
    console.error('Error parsing stored user:', error);
    removeUserFromStorage(); // Clear invalid data
  }
  return null;
};

// Save user to storage
export const saveUserToStorage = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Remove user from storage
export const removeUserFromStorage = () => {
  localStorage.removeItem(USER_KEY);
};

// Clear all auth data
export const clearAuthData = () => {
  removeAuthToken();
  removeUserFromStorage();
};

// Get auth header for API requests
export const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { 'x-auth-token': token } : {};
}; 