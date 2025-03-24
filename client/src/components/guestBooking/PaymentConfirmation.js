import React, { useState } from 'react';
import { 
  Box, Typography, Button, Grid, 
  CircularProgress, Paper, Divider, 
  FormControl, FormLabel, RadioGroup, 
  FormControlLabel, Radio, Alert,
  Chip
} from '@mui/material';
import { updateGuestBookingPayment } from '../../services/guestBookingService';
import { AccessTime } from '@mui/icons-material';

const PaymentConfirmation = ({ booking, onBack, onNext, setError }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Card');

  if (!booking) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          No booking information available.
        </Typography>
        <Button onClick={onBack} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // For pay later option
      if (paymentMethod === 'Cash') {
        // Update booking with Cash payment method but keep status as pending
        const response = await updateGuestBookingPayment(booking._id, {
          paymentMethod: 'Cash',
          paymentStatus: 'Unpaid',
          payLater: true
        });
        
        // Move to confirmation step
        onNext();
        return;
      }
      
      // For online payment options
      // Simulate payment processing
      // In a real application, this would integrate with a payment gateway
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update booking payment status
      const response = await updateGuestBookingPayment(booking._id, {
        paymentMethod,
        paymentId: `PAY-${Date.now()}`
      });

      // Move to confirmation step
      onNext();
    } catch (err) {
      setError(`Payment failed: ${err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate booking duration in hours
  const calculateDuration = () => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    return (end - start) / (1000 * 60 * 60);
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const duration = calculateDuration();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Payment
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body1">Booking Reference:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" align="right" fontWeight="bold">
              {booking.bookingReference}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body1">Court:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" align="right">
              {booking.court.name}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>
              Booking Time
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={1}>
              <AccessTime sx={{ mr: 1, fontSize: '1rem' }} />
              <Typography variant="body2">
                {formatDateTime(booking.startTime)} to {formatDateTime(booking.endTime)}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Chip 
                label={`${duration} hours`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
              <Typography variant="body2">
                Rate: ${booking.court.hourlyRate}/hour
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body1" fontWeight="bold">Total Amount:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" fontWeight="bold" align="right">
              ${booking.totalPrice.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">Select Payment Method</FormLabel>
        <RadioGroup 
          value={paymentMethod} 
          onChange={handlePaymentMethodChange}
          row
        >
          <FormControlLabel value="Card" control={<Radio />} label="Credit Card" />
          <FormControlLabel value="Mobile" control={<Radio />} label="Mobile Payment" />
          <FormControlLabel value="Cash" control={<Radio />} label="Pay Later at Court" />
        </RadioGroup>
      </FormControl>

      {paymentMethod === 'Card' && (
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Credit Card Payment
          </Typography>
          <Typography variant="body2" gutterBottom color="text.secondary">
            In a real application, this would integrate with a payment gateway like Stripe or PayPal.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            For this demo, clicking "Complete Payment" will simulate a successful payment.
          </Typography>
        </Paper>
      )}

      {paymentMethod === 'Mobile' && (
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Mobile Payment
          </Typography>
          <Typography variant="body2" gutterBottom color="text.secondary">
            In a real application, this would integrate with mobile payment services.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            For this demo, clicking "Complete Payment" will simulate a successful payment.
          </Typography>
        </Paper>
      )}

      {paymentMethod === 'Cash' && (
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Pay Later at Court
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Your booking will be reserved but payment will be collected when you arrive at the court.
          </Alert>
          <Typography variant="body2" gutterBottom color="text.secondary">
            Please arrive 15 minutes before your booking time to complete payment.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bring your booking reference number with you: <strong>{booking.bookingReference}</strong>
          </Typography>
        </Paper>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handlePayment}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 
            paymentMethod === 'Cash' ? 'Confirm Booking' : 'Complete Payment'}
        </Button>
      </Box>
    </Box>
  );
};

export default PaymentConfirmation; 