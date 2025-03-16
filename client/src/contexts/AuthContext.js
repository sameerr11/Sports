import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredUser, saveUserToStorage, removeUserFromStorage } from '../utils/auth';
import { getCurrentUser } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user exists in local storage
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    
    // Fetch current user from API if possible
    const fetchCurrentUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        saveUserToStorage(userData);
      } catch (err) {
        console.error('Error fetching current user:', err);
        // Don't set error if it's just an unauthorized error
        if (err.response && err.response.status !== 401) {
          setError('Failed to fetch current user');
        }
        removeUserFromStorage();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (storedUser) {
      // If we have a stored user, still fetch updated data
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Login function, typically called after successful API authentication
  const login = (userData) => {
    setUser(userData);
    saveUserToStorage(userData);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    removeUserFromStorage();
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 