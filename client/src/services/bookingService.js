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

// Get upcoming user bookings for dashboard
export const getUpcomingUserBookings = async (limit = 3) => {
  try {
    const response = await api.get('/bookings/me');
    // Filter for upcoming bookings (where the start time is in the future)
    const currentDate = new Date();
    const upcomingBookings = response.data
      .filter(booking => new Date(booking.startTime) > currentDate)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, limit);
    
    return upcomingBookings;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch upcoming bookings';
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
    // Check if it's a guest booking
    if (id.startsWith && id.startsWith('guest-')) {
      const guestId = id.replace('guest-', '');
      const response = await api.put(`/bookings/guest/${guestId}/status`, { status });
      return response.data;
    } else {
      const response = await api.put(`/bookings/${id}/status`, { status });
      return response.data;
    }
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to update booking status';
  }
};

// Cancel booking
export const cancelBooking = async (id) => {
  try {
    // Check if it's a guest booking
    if (id.startsWith && id.startsWith('guest-')) {
      const guestId = id.replace('guest-', '');
      const response = await api.put(`/bookings/guest/${guestId}/cancel`);
      return response.data;
    } else {
      const response = await api.put(`/bookings/${id}/cancel`);
      return response.data;
    }
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to cancel booking';
  }
}; 