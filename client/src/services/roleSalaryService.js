import api from './api';

// Get all role salaries
export const getRoleSalaries = async () => {
  try {
    const response = await api.get('/role-salaries');
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch role salaries';
  }
};

// Get role salary by role
export const getRoleSalaryByRole = async (role) => {
  try {
    const response = await api.get(`/role-salaries/${role}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      // Return null if role salary not found
      return null;
    }
    throw error.response?.data?.msg || `Failed to fetch salary for ${role} role`;
  }
};

// Update role salary
export const updateRoleSalary = async (roleSalaryData) => {
  try {
    const response = await api.post('/role-salaries', roleSalaryData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update role salary';
  }
};

// Delete role salary
export const deleteRoleSalary = async (role) => {
  try {
    const response = await api.delete(`/role-salaries/${role}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to delete role salary';
  }
}; 