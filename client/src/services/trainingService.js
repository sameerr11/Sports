import api from './api';

// Get teams where current user is a coach
export const getCoachTeams = async () => {
  try {
    const response = await api.get('/teams/coach');
    return response.data;
  } catch (error) {
    console.error('Error fetching coach teams:', error);
    throw error.response?.data?.msg || 'Failed to fetch teams';
  }
};

// Get training plans assigned to current coach
export const getCoachTrainingPlans = async () => {
  try {
    const response = await api.get('/training-plans/coach');
    return response.data;
  } catch (error) {
    console.error('Error fetching coach training plans:', error);
    throw error.response?.data?.msg || 'Failed to fetch training plans';
  }
};

// Get training plans for a specific team
export const getTeamTrainingPlans = async (teamId) => {
  try {
    const response = await api.get(`/training-plans/team/${teamId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching team training plans:', error);
    throw error.response?.data?.msg || 'Failed to fetch team training plans';
  }
};

// Get training plan by ID
export const getTrainingPlanById = async (id) => {
  try {
    const response = await api.get(`/training-plans/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching training plan:', error);
    throw error.response?.data?.msg || 'Failed to fetch training plan';
  }
};

// Update training plan status
export const updateTrainingPlanStatus = async (id, status) => {
  try {
    const response = await api.put(`/training-plans/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating training plan status:', error);
    throw error.response?.data?.msg || 'Failed to update training plan';
  }
}; 