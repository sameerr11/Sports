import React, { useState } from 'react';
import { 
  Box, Typography, TextField, Button, Grid, 
  CircularProgress, Paper, Divider
} from '@mui/material';
import { createGuestBooking } from '../../services/guestBookingService';

const GuestDetails = ({
  guestDetails,
  setGuestDetails,
  selectedCourt,
  selectedDate,
  selectedTimeSlot,
  onBack,
  onNext,
  setBooking,
  setError
}) => {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGuestDetails(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for the field being typed in
    setLocalError(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      guestName: '',
      guestEmail: '',
      guestPhone: ''
    };

    if (!guestDetails.guestName.trim()) {
      errors.guestName = 'Name is required';
      isValid = false;
    }

    if (!guestDetails.guestEmail.trim()) {
      errors.guestEmail = 'Email is required';
      isValid = false;
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(guestDetails.guestEmail)) {
      errors.guestEmail = 'Please enter a valid email address';
      isValid = false;
    }

    if (!guestDetails.guestPhone.trim()) {
      errors.guestPhone = 'Phone number is required';
      isValid = false;
    }

    setLocalError(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare booking data
      const bookingData = {
        court: selectedCourt.id,
        startTime: selectedTimeSlot.start,
        endTime: selectedTimeSlot.end,
        ...guestDetails,
        notes: ''
      };

      // Create booking
      const response = await createGuestBooking(bookingData);
      setBooking(response.booking);
      onNext();
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!selectedCourt || !selectedTimeSlot) return 0;
    
    const start = new Date(selectedTimeSlot.start);
    const end = new Date(selectedTimeSlot.end);
    const durationHours = (end - start) / (1000 * 60 * 60);
    
    return durationHours * selectedCourt.hourlyRate;
  };

  const totalPrice = calculateTotalPrice();
  
  // Format the date/time for display
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString([], {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h6" gutterBottom>
        Your Details
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            id="guestName"
            label="Full Name"
            name="guestName"
            value={guestDetails.guestName}
            onChange={handleChange}
            error={!!localError.guestName}
            helperText={localError.guestName}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            id="guestEmail"
            label="Email Address"
            name="guestEmail"
            type="email"
            value={guestDetails.guestEmail}
            onChange={handleChange}
            error={!!localError.guestEmail}
            helperText={localError.guestEmail}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            id="guestPhone"
            label="Phone Number"
            name="guestPhone"
            value={guestDetails.guestPhone}
            onChange={handleChange}
            error={!!localError.guestPhone}
            helperText={localError.guestPhone}
          />
        </Grid>
      </Grid>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Booking Summary
        </Typography>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Court
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedCourt.name}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Date
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedDate.toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Booking Time
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatDateTime(selectedTimeSlot.start)} to {formatDateTime(selectedTimeSlot.end)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Duration
              </Typography>
              <Typography variant="body1" gutterBottom>
                {(new Date(selectedTimeSlot.end) - new Date(selectedTimeSlot.start)) / (1000 * 60 * 60)} hours
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Total Price
              </Typography>
              <Typography variant="body1" fontWeight="bold" gutterBottom>
                ${totalPrice.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Proceed to Payment'}
        </Button>
      </Box>
    </Box>
  );
};

export default GuestDetails; 