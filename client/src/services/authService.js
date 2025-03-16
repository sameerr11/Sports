import api from './api';
import { 
  saveAuthToken, 
  removeAuthToken, 
  saveUserToStorage, 
  removeUserFromStorage, 
  getAuthToken, 
  getStoredUser as utilGetStoredUser 
} from '../utils/auth';

// Login user
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { token } = response.data;
    
    // Store token using the utility function
    saveAuthToken(token);
    
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
    
    // Store user using the utility function
    saveUserToStorage(user);
    
    return user;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to get user data';
  }
};

// Logout user
export const logout = () => {
  removeAuthToken();
  removeUserFromStorage();
  window.location.href = '/login';
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return getAuthToken() !== null;
};

// Get stored user
export const getStoredUser = () => {
  return utilGetStoredUser();
};

// Get token
export const getToken = () => {
  return getAuthToken();
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
  return hasRole(['admin', 'supervisor']);
};

// Check if user is a cafeteria supervisor
export const isCafeteriaSupervisor = () => {
  const user = getStoredUser();
  return user && user.role === 'supervisor' && user.supervisorType === 'cafeteria';
};

// Check if user is a sports supervisor
export const isSportsSupervisor = () => {
  const user = getStoredUser();
  return user && user.role === 'supervisor' && user.supervisorType === 'sports';
};

// Check if user is a general supervisor with access to all areas
export const isGeneralSupervisor = () => {
  const user = getStoredUser();
  return user && user.role === 'supervisor' && user.supervisorType === 'general';
};

// Check if user is a supervisor for a specific sport type
export const isSportTypeSupervisor = (sportType) => {
  const user = getStoredUser();
  return user && 
         user.role === 'supervisor' && 
         user.supervisorType === 'sports' && 
         user.supervisorSportTypes && 
         user.supervisorSportTypes.includes(sportType);
};

// Check if user is cashier
export const isCashier = () => {
  const user = getStoredUser();
  return user && user.role === 'cashier';
};

// Check if user is coach
export const isCoach = () => {
  return hasRole(['admin', 'supervisor', 'coach']);
};

// Check if user is player
export const isPlayer = () => {
  return hasRole(['admin', 'supervisor', 'coach', 'player']);
};

// Check if user is ONLY a player (not admin, supervisor, or coach)
export const isPlayerOnly = () => {
  const user = getStoredUser();
  return user && user.role === 'player';
};

// Check if user is parent
export const isParent = () => {
  const user = getStoredUser();
  return user && user.role === 'parent';
};

// Check if user is guest
export const isGuest = () => {
  return hasRole('guest');
};

// Check if user is support
export const isSupport = () => {
  const user = getStoredUser();
  return user && user.role === 'support';
};

// Check if user is admin or support
export const isAdminOrSupport = () => {
  const user = getStoredUser();
  return user && (user.role === 'admin' || user.role === 'support');
};

// Check if user is accounting
export const isAccounting = () => {
  const user = getStoredUser();
  return user && (user.role === 'admin' || user.role === 'accounting');
};

export const getAuthHeader = () => {
  const token = getToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
}; 