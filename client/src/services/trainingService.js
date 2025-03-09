import api from './api';

// Create a new training session
export const createTraining = async (trainingData) => {
  try {
    const response = await api.post('/trainings', trainingData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to create training session';
  }
};

// Get all trainings (with optional filters)
export const getTrainings = async (filters = {}) => {
  try {
    const response = await api.get('/trainings', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch trainings';
  }
};

// Get player's trainings
export const getPlayerTrainings = async () => {
  try {
    const response = await api.get('/trainings/player');
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch player trainings';
  }
};

// Get coach's trainings
export const getCoachTrainings = async () => {
  try {
    const response = await api.get('/trainings/coach');
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch coach trainings';
  }
};

// Get training by ID
export const getTrainingById = async (id) => {
  try {
    const response = await api.get(`/trainings/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch training details';
  }
};

// Update training
export const updateTraining = async (id, trainingData) => {
  try {
    const response = await api.put(`/trainings/${id}`, trainingData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update training';
  }
};

// Delete training
export const deleteTraining = async (id) => {
  try {
    const response = await api.delete(`/trainings/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to delete training';
  }
};

// Update attendance
export const updateAttendance = async (id, attendanceData) => {
  try {
    const response = await api.put(`/trainings/${id}/attendance`, { attendance: attendanceData });
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update attendance';
  }
};

// Get trainings for a child (parent view)
export const getChildTrainings = async (childId) => {
  try {
    const response = await api.get(`/trainings/child/${childId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch child trainings';
  }
}; 