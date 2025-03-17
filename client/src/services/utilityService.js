import api from './api';

// Get all utility bills
export const getUtilityBills = async () => {
  try {
    const response = await api.get('/utilities');
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch utility bills';
  }
};

// Get utility bill by ID
export const getUtilityBillById = async (id) => {
  try {
    const response = await api.get(`/utilities/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch utility bill';
  }
};

// Create utility bill
export const createUtilityBill = async (billData) => {
  try {
    const response = await api.post('/utilities', billData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to create utility bill';
  }
};

// Update utility bill payment status
export const updateUtilityBill = async (id, updateData) => {
  try {
    const response = await api.put(`/utilities/${id}`, updateData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update utility bill';
  }
};

// Delete utility bill
export const deleteUtilityBill = async (id) => {
  try {
    const response = await api.delete(`/utilities/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to delete utility bill';
  }
}; 