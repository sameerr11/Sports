import api from './api';

// Get all bookings (admin/supervisor only)
export const getBookings = async () => {
  try {
    const response = await api.get('/bookings');
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch bookings';
  }
};

// Get user's bookings
export const getUserBookings = async () => {
  try {
    const response = await api.get('/bookings/me');
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch your bookings';
  }
};

// Get booking by ID
export const getBookingById = async (id) => {
  try {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch booking';
  }
};

// Create booking
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to create booking';
  }
};

// Update booking status (admin/supervisor only)
export const updateBookingStatus = async (id, status) => {
  try {
    const response = await api.put(`/bookings/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update booking status';
  }
};

// Cancel booking
export const cancelBooking = async (id) => {
  try {
    const response = await api.put(`/bookings/${id}/cancel`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to cancel booking';
  }
}; 