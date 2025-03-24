import api from './api';

// Get available courts for a specific date
export const getAvailableCourts = async (date) => {
  try {
    const response = await api.get(`/guest-bookings/available-courts/${date}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch available courts';
  }
};

// Get availability for a specific court on a specific date
export const getCourtAvailability = async (courtId, date) => {
  try {
    const response = await api.get(`/guest-bookings/availability/${courtId}/${date}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch court availability';
  }
};

// Create guest booking
export const createGuestBooking = async (bookingData) => {
  try {
    const response = await api.post('/guest-bookings', bookingData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || error.response?.data?.errors?.[0]?.msg || 'Failed to create booking';
  }
};

// Get booking by reference
export const getGuestBookingByReference = async (reference) => {
  try {
    const response = await api.get(`/guest-bookings/reference/${reference}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to fetch booking';
  }
};

// Update booking payment
export const updateGuestBookingPayment = async (id, paymentData) => {
  try {
    const response = await api.put(`/guest-bookings/${id}/payment`, paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to process payment';
  }
};

// Cancel guest booking
export const cancelGuestBooking = async (id, email) => {
  try {
    const response = await api.put(`/guest-bookings/${id}/cancel`, { email });
    return response.data;
  } catch (error) {
    throw error.response?.data?.msg || 'Failed to cancel booking';
  }
}; 