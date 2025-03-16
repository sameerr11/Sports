import api from './api';
import { getAuthToken } from '../utils/auth';

// Player Registration
export const createPlayerRegistration = async (registrationData) => {
  try {
    const response = await api.post('/registrations', registrationData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRegistrations = async () => {
  try {
    const response = await api.get('/registrations');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRegistrationById = async (id) => {
  try {
    const response = await api.get(`/registrations/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const approveRegistration = async (id, approvalData) => {
  try {
    console.log(`Calling approval API for registration ${id} with data:`, approvalData);
    const response = await api.put(`/registrations/${id}/approve`, approvalData);
    console.log('Approval API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Approval API error:', error);
    throw error;
  }
};

export const createUserAccount = async (id, accountData) => {
  try {
    const response = await api.post(`/registrations/${id}/create-account`, accountData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Registration Fees
export const getRegistrationFees = async (sportType = '') => {
  try {
    const url = sportType 
      ? `/registrations/fees?sportType=${sportType}` 
      : '/registrations/fees';
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createRegistrationFee = async (feeData) => {
  try {
    const response = await api.post('/registrations/fees', feeData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateRegistrationFee = async (id, feeData) => {
  try {
    const response = await api.put(`/registrations/fees/${id}`, feeData);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 