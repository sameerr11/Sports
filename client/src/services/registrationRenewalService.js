import api from './api';

// Get expired registrations for renewal
export const getExpiredRegistrations = async (params = {}) => {
  try {
    const response = await api.get('/registration-renewals/expired', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching expired registrations:', error);
    throw error;
  }
};

// Get registration fees
export const getRegistrationFees = async (sportType = null) => {
  try {
    const params = sportType ? { sportType } : {};
    const response = await api.get('/registration-renewals/fees', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching registration fees:', error);
    throw error;
  }
};

// Create a registration renewal
export const createRenewal = async (renewalData) => {
  try {
    const response = await api.post('/registration-renewals', renewalData);
    return response.data;
  } catch (error) {
    console.error('Error creating registration renewal:', error);
    throw error;
  }
};

// Get all renewals
export const getRenewals = async (params = {}) => {
  try {
    const response = await api.get('/registration-renewals', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching renewals:', error);
    throw error;
  }
};

// Get renewal by ID
export const getRenewalById = async (renewalId) => {
  try {
    const response = await api.get(`/registration-renewals/${renewalId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching renewal:', error);
    throw error;
  }
};

// Cancel a renewal
export const cancelRenewal = async (renewalId, notes = '') => {
  try {
    const response = await api.put(`/registration-renewals/${renewalId}/cancel`, { notes });
    return response.data;
  } catch (error) {
    console.error('Error cancelling renewal:', error);
    throw error;
  }
};
