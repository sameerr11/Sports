import api from './api';

// Get all user salaries
export const getUserSalaries = async () => {
  try {
    const response = await api.get('/user-salaries');
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch user salaries';
  }
};

// Get user salary by user ID
export const getUserSalaryByUserId = async (userId) => {
  try {
    const response = await api.get(`/user-salaries/${userId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      // Return null if user salary not found
      return null;
    }
    throw error.response?.data?.msg || `Failed to fetch salary for user`;
  }
};

// Update user salary
export const updateUserSalary = async (userSalaryData) => {
  try {
    const response = await api.post('/user-salaries', userSalaryData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update user salary';
  }
};

// Delete user salary
export const deleteUserSalary = async (userId) => {
  try {
    const response = await api.delete(`/user-salaries/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to delete user salary';
  }
}; 