import React, { useState } from 'react';
import { 
  Box, Typography, TextField, Button, Grid, 
  CircularProgress, Paper, Divider, FormControl,
  FormLabel, RadioGroup, FormControlLabel, Radio
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
  const [courtType, setCourtType] = useState('Full Court');
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

  const handleCourtTypeChange = (e) => {
    setCourtType(e.target.value);
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
        notes: '',
        courtType: isBasketballCourt ? courtType : 'Full Court'
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
    
    // Apply half-price for half court bookings (basketball only)
    const priceMultiplier = (isBasketballCourt && courtType === 'Half Court') ? 0.5 : 1;
    return durationHours * selectedCourt.hourlyRate * priceMultiplier;
  };

  // Check if selected court is a basketball court
  const isBasketballCourt = selectedCourt && selectedCourt.sportType === 'Basketball';

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
            name="guestName"
            label="Name"
            value={guestDetails.guestName}
            onChange={handleChange}
            error={!!localError.guestName}
            helperText={localError.guestName}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(0, 0, 0, 0.23)'
                }
              }
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            name="guestEmail"
            label="Email"
            type="email"
            value={guestDetails.guestEmail}
            onChange={handleChange}
            error={!!localError.guestEmail}
            helperText={localError.guestEmail}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(0, 0, 0, 0.23)'
                }
              }
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            name="guestPhone"
            label="Phone Number"
            value={guestDetails.guestPhone}
            onChange={handleChange}
            error={!!localError.guestPhone}
            helperText={localError.guestPhone}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(0, 0, 0, 0.23)'
                }
              }
            }}
          />
        </Grid>
        
        {isBasketballCourt && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Court Type</FormLabel>
                <RadioGroup
                  name="courtType"
                  value={courtType}
                  onChange={handleCourtTypeChange}
                  row
                >
                  <FormControlLabel value="Full Court" control={<Radio />} label="Full Court" />
                  <FormControlLabel value="Half Court" control={<Radio />} label="Half Court (50% off)" />
                </RadioGroup>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {courtType === 'Half Court' 
                    ? "Half court booking allows you to use half of the basketball court at half the price. Another guest may book or might have already booked the other half during the same time." 
                    : "Full court booking gives you exclusive access to the entire basketball court."}
                </Typography>
              </FormControl>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Booking Summary
        </Typography>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Court
              </Typography>
              <Typography variant="body1">
                {selectedCourt?.name}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Sport
              </Typography>
              <Typography variant="body1">
                {selectedCourt?.sportType} {isBasketballCourt && `(${courtType})`}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Date
              </Typography>
              <Typography variant="body1">
                {formatDateTime(selectedTimeSlot?.start).split(',')[0]}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Time
              </Typography>
              <Typography variant="body1">
                {formatDateTime(selectedTimeSlot?.start).split(',')[1]} - {formatDateTime(selectedTimeSlot?.end).split(',')[1]}
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Grid container justifyContent="space-between">
            <Grid item>
              <Typography variant="subtitle1">
                Total Amount
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="h6" color="primary">
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