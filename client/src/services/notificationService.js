import api from './api';

// Get user notifications
export const getUserNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to get notifications';
  }
};

// Mark notification as read
export const markAsRead = async (id) => {
  try {
    const response = await api.put(`/notifications/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to mark notification as read';
  }
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  try {
    const response = await api.put('/notifications/read-all');
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to mark all notifications as read';
  }
};

// Delete notification
export const deleteNotification = async (id) => {
  try {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to delete notification';
  }
};

// Get unread notification count
export const getUnreadCount = async () => {
  try {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to get unread count';
  }
};

// Send notification to users
export const sendNotification = async (notificationData) => {
  try {
    const response = await api.post('/notifications/send', notificationData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to send notification';
  }
}; 

// Send broadcast notification to users (with email)
export const sendBroadcastNotification = async (broadcastData) => {
  try {
    const response = await api.post('/notifications/broadcast', broadcastData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to send broadcast notification';
  }
}; 