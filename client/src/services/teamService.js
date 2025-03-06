import api from './api';

// Get all teams
export const getTeams = async () => {
  try {
    const response = await api.get('/teams');
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch teams';
  }
};

// Get team by ID
export const getTeamById = async (id) => {
  try {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch team';
  }
};

// Create team
export const createTeam = async (teamData) => {
  try {
    const response = await api.post('/teams', teamData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to create team';
  }
};

// Update team
export const updateTeam = async (id, teamData) => {
  try {
    const response = await api.put(`/teams/${id}`, teamData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update team';
  }
};

// Delete team
export const deleteTeam = async (id) => {
  try {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to delete team';
  }
};

// Add player to team
export const addPlayerToTeam = async (teamId, playerId, position) => {
  try {
    const response = await api.post(`/teams/${teamId}/players`, {
      playerId,
      position
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to add player to team';
  }
};

// Remove player from team
export const removePlayerFromTeam = async (teamId, playerId) => {
  try {
    const response = await api.delete(`/teams/${teamId}/players/${playerId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to remove player from team';
  }
};

// Add coach to team
export const addCoachToTeam = async (teamId, coachId, role) => {
  try {
    const response = await api.post(`/teams/${teamId}/coaches`, {
      coachId,
      role
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to add coach to team';
  }
};

// Remove coach from team
export const removeCoachFromTeam = async (teamId, coachId) => {
  try {
    const response = await api.delete(`/teams/${teamId}/coaches/${coachId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to remove coach from team';
  }
}; 