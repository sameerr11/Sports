import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredUser, saveUserToStorage, removeUserFromStorage } from '../utils/auth';
import { getCurrentUser } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Load user data on mount
  useEffect(() => {
    // Mark context as not initialized
    setInitialized(false);
    setLoading(true);
    
    // Check if user exists in local storage
    const storedUser = getStoredUser();
    if (storedUser) {
      // Set user immediately from storage to prevent UI flashing
      setUser(storedUser);
    }
    
    // Fetch current user from API if possible
    const fetchCurrentUser = async () => {
      try {
        const userData = await getCurrentUser();
        console.log("Fetched user data:", userData);
        setUser(userData);
        saveUserToStorage(userData);
      } catch (err) {
        console.error('Error fetching current user:', err);
        // Don't set error if it's just an unauthorized error
        if (err.response && err.response.status !== 401) {
          setError('Failed to fetch current user');
        }
        // Only clear user if there was an error
        removeUserFromStorage();
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    // Always try to fetch current user data
    fetchCurrentUser();
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

  // Return additional state to help components know if auth is properly initialized
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    initialized,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 