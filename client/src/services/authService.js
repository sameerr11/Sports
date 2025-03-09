import api from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// Login user
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { token } = response.data;
    
    // Store token in localStorage
    localStorage.setItem(TOKEN_KEY, token);
    
    // Get user data
    const userData = await getCurrentUser();
    
    return userData;
  } catch (error) {
    throw error.response?.data?.msg || 'Login failed';
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    const user = response.data;
    
    // Store user in localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    return user;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to get user data';
  }
};

// Logout user
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return localStorage.getItem(TOKEN_KEY) !== null;
};

// Get stored user
export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

// Get token
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Check if user has role
export const hasRole = (role) => {
  const user = getStoredUser();
  if (!user) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  
  return user.role === role;
};

// Check if user is admin
export const isAdmin = () => {
  const user = getStoredUser();
  return user && user.role === 'admin';
};

// Check if user is supervisor
export const isSupervisor = () => {
  const user = getStoredUser();
  return user && user.role === 'supervisor';
};

// Check if user is cashier
export const isCashier = () => {
  const user = getStoredUser();
  return user && user.role === 'cashier';
};

// Check if user is coach (strictly coach role only)
export const isCoach = () => {
  const user = getStoredUser();
  return user && user.role === 'coach';
};

// Check if user is player (strictly player role only)
export const isPlayer = () => {
  const user = getStoredUser();
  return user && user.role === 'player';
};

// Check if user is parent (strictly parent role only)
export const isParent = () => {
  const user = getStoredUser();
  return user && user.role === 'parent';
};

// Check if user is guest
export const isGuest = () => {
  return hasRole('guest');
};

// Check if user has coaching privileges (admin, supervisor, or coach)
export const hasCoachingPrivileges = () => {
  return hasRole(['admin', 'supervisor', 'coach']);
};

// Check if user has player view privileges (admin, supervisor, coach, or player)
export const hasPlayerViewPrivileges = () => {
  return hasRole(['admin', 'supervisor', 'coach', 'player']);
};

export const getAuthHeader = () => {
  const token = getToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
}; 