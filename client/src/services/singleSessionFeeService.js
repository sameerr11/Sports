import api from './api';

// Get all single session fees
export const getSingleSessionFees = async () => {
  try {
    const response = await api.get('/single-session-fees');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching single session fees:', error);
    throw error.response?.data?.message || 'Failed to fetch single session fees';
  }
};

// Get single session fee by sport type
export const getSingleSessionFeeBySport = async (sportType) => {
  try {
    const response = await api.get(`/single-session-fees/${sportType}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching single session fee for ${sportType}:`, error);
    throw error.response?.data?.message || 'Failed to fetch single session fee';
  }
};

// Create a single session fee
export const createSingleSessionFee = async (feeData) => {
  try {
    const response = await api.post('/single-session-fees', feeData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating single session fee:', error);
    throw error.response?.data?.message || 'Failed to create single session fee';
  }
};

// Update a single session fee
export const updateSingleSessionFee = async (sportType, feeData) => {
  try {
    const response = await api.put(`/single-session-fees/${sportType}`, feeData);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating single session fee for ${sportType}:`, error);
    throw error.response?.data?.message || 'Failed to update single session fee';
  }
};

// Delete a single session fee
export const deleteSingleSessionFee = async (sportType) => {
  try {
    const response = await api.delete(`/single-session-fees/${sportType}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error deleting single session fee for ${sportType}:`, error);
    throw error.response?.data?.message || 'Failed to delete single session fee';
  }
}; 