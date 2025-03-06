import api from './api';

// Get all courts
export const getCourts = async () => {
  try {
    const response = await api.get('/courts');
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch courts';
  }
};

// Get court by ID
export const getCourtById = async (id) => {
  try {
    const response = await api.get(`/courts/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch court';
  }
};

// Create court
export const createCourt = async (courtData) => {
  try {
    const response = await api.post('/courts', courtData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to create court';
  }
};

// Update court
export const updateCourt = async (id, courtData) => {
  try {
    const response = await api.put(`/courts/${id}`, courtData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update court';
  }
};

// Delete court
export const deleteCourt = async (id) => {
  try {
    const response = await api.delete(`/courts/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to delete court';
  }
};

// Get court availability
export const getCourtAvailability = async (id, date) => {
  try {
    const response = await api.get(`/courts/${id}/availability`, {
      params: { date }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch court availability';
  }
}; 