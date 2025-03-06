import api from './api';

// Get all users
export const getUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to get users';
  }
};

// Get user by ID
export const getUserById = async (id) => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to get user';
  }
};

// Create user
export const createUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to create user';
  }
};

// Update user
export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update user';
  }
};

// Delete user
export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to delete user';
  }
};

// Change user password
export const changePassword = async (id, password) => {
  try {
    const response = await api.put(`/users/${id}/password`, { password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to change password';
  }
}; 