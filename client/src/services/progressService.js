import api from './api';

// Create a new player assessment
export const createAssessment = async (assessmentData) => {
  try {
    const response = await api.post('/progress', assessmentData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to create assessment';
  }
};

// Get all assessments for a player
export const getPlayerAssessments = async (playerId) => {
  try {
    const response = await api.get(`/progress/player/${playerId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch player assessments';
  }
};

// Get latest assessment for a player
export const getLatestAssessment = async (playerId) => {
  try {
    const response = await api.get(`/progress/player/${playerId}/latest`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch latest assessment';
  }
};

// Get assessments for a team
export const getTeamAssessments = async (teamId) => {
  try {
    const response = await api.get(`/progress/team/${teamId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch team assessments';
  }
};

// Get assessment by ID
export const getAssessmentById = async (id) => {
  try {
    const response = await api.get(`/progress/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch assessment details';
  }
};

// Update assessment
export const updateAssessment = async (id, assessmentData) => {
  try {
    const response = await api.put(`/progress/${id}`, assessmentData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update assessment';
  }
};

// Update development goals
export const updateGoals = async (id, goals) => {
  try {
    const response = await api.put(`/progress/${id}/goals`, { developmentGoals: goals });
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update development goals';
  }
};

// Get progress for a child (parent view)
export const getChildProgress = async (childId) => {
  try {
    const response = await api.get(`/progress/child/${childId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch child progress';
  }
}; 