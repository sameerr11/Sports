import api from './api';

// Create a new game
export const createGame = async (gameData) => {
  try {
    const response = await api.post('/games', gameData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to create game';
  }
};

// Get all games (with optional filters)
export const getGames = async (filters = {}) => {
  try {
    const response = await api.get('/games', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch games';
  }
};

// Get player's games
export const getPlayerGames = async () => {
  try {
    const response = await api.get('/games/player');
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch player games';
  }
};

// Get coach's games
export const getCoachGames = async () => {
  try {
    const response = await api.get('/games/coach');
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch coach games';
  }
};

// Get game by ID
export const getGameById = async (id) => {
  try {
    const response = await api.get(`/games/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch game details';
  }
};

// Update game
export const updateGame = async (id, gameData) => {
  try {
    const response = await api.put(`/games/${id}`, gameData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update game';
  }
};

// Delete game
export const deleteGame = async (id) => {
  try {
    const response = await api.delete(`/games/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to delete game';
  }
};

// Update game lineups
export const updateLineups = async (id, lineups) => {
  try {
    const response = await api.put(`/games/${id}/lineups`, { lineups });
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update lineups';
  }
};

// Update game result
export const updateResult = async (id, result, status) => {
  try {
    const response = await api.put(`/games/${id}/result`, { result, status });
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update result';
  }
};

// Get games for a child (parent view)
export const getChildGames = async (childId) => {
  try {
    const response = await api.get(`/games/child/${childId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch child games';
  }
}; 