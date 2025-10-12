import React, { useState } from 'react';
import { 
  Box, Typography, Button, Grid, 
  CircularProgress, Paper, Divider, 
  FormControl, FormLabel, RadioGroup, 
  FormControlLabel, Radio, Alert,
  Chip, useMediaQuery, useTheme
} from '@mui/material';
import { updateGuestBookingPayment } from '../../services/guestBookingService';
import { AccessTime } from '@mui/icons-material';

const PaymentConfirmation = ({ booking, onBack, onNext, setError }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  if (!booking) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          No booking information available.
        </Typography>
        <Button 
          onClick={onBack} 
          sx={{ 
            mt: 2,
            color: '#0e0051',
            borderRadius: '25px',
            padding: '10px 24px',
            textTransform: 'none',
            fontSize: '1rem',
            '&:hover': {
              backgroundColor: 'rgba(14, 0, 81, 0.05)'
            }
          }}
        >
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
        
        // Update the local booking state with server response
        booking.paymentMethod = 'Cash';
        booking.paymentStatus = 'Unpaid';
        
        // Move to confirmation step
        onNext();
        return;
      }
      
      // For online payment options (Card or Mobile)
      // Simulate payment processing
      // In a real application, this would integrate with a payment gateway
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update booking payment status
      const response = await updateGuestBookingPayment(booking._id, {
        paymentMethod: paymentMethod,
        paymentStatus: 'Paid',
        paymentId: `PAY-${Date.now()}`
      });
      
      // Update the local booking state with server response
      booking.paymentMethod = paymentMethod;
      booking.paymentStatus = 'Paid';
      booking.paymentId = response.booking.paymentId;

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

  const message = booking.payLater 
    ? 'Booking created. Your booking will remain pending until payment is received at the court.'
    : 'Payment completed. Your booking is now confirmed.';

  return (
    <Box>
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{ 
          color: '#0e0051', 
          fontWeight: 600,
          mb: 2
        }}
      >
        Payment
      </Typography>

      <Paper 
        elevation={0} 
        sx={{ 
          p: 2.5, 
          mb: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '12px',
          border: '1px solid rgba(14, 0, 81, 0.1)'
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">Booking Reference:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography 
              variant="body1" 
              align="right" 
              sx={{ 
                fontWeight: "bold",
                color: '#0e0051'
              }}
            >
              {booking.bookingReference}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">Court:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" align="right">
              {booking.court.name}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1.5 }} />
            <Typography 
              variant="subtitle2" 
              gutterBottom
              sx={{ 
                color: '#0e0051',
                fontWeight: 600
              }}
            >
              Booking Time
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={1}>
              <AccessTime 
                sx={{ 
                  mr: 1, 
                  fontSize: '1rem',
                  color: '#0e0051'
                }} 
              />
              <Typography variant="body2">
                {formatDateTime(booking.startTime)} to {formatDateTime(booking.endTime)}
              </Typography>
            </Box>
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="space-between"
              flexDirection={isMobile ? 'column' : 'row'}
              gap={isMobile ? 1 : 0}
            >
              <Chip 
                label={`${duration} hours`} 
                size="small" 
                sx={{
                  backgroundColor: 'rgba(247, 147, 30, 0.1)',
                  color: '#f7931e',
                  borderColor: '#f7931e',
                  fontWeight: 500
                }}
                variant="outlined"
              />
              <Typography variant="body2">
                Rate: ${booking.court.hourlyRate}/hour
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1.5 }} />
          </Grid>
          
          <Grid item xs={6}>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: "bold",
                color: '#0e0051'
              }}
            >
              Total Amount:
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography 
              variant="body1" 
              align="right"
              sx={{ 
                fontWeight: "bold",
                color: '#f7931e',
                fontSize: '1.1rem'
              }}
            >
              ${booking.totalPrice.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <FormControl 
        component="fieldset" 
        sx={{ mb: 3 }}
      >
        <FormLabel 
          component="legend"
          sx={{ 
            color: '#0e0051',
            fontWeight: 500,
            '&.Mui-focused': {
              color: '#0e0051'
            }
          }}
        >
          Select Payment Method
        </FormLabel>
        <RadioGroup 
          value={paymentMethod} 
          onChange={handlePaymentMethodChange}
          row
          sx={{
            justifyContent: isMobile ? 'space-between' : 'flex-start',
            '& .MuiFormControlLabel-label': {
              fontSize: isMobile ? '0.9rem' : 'inherit'
            }
          }}
        >
          <FormControlLabel 
            value="Card" 
            disabled
            control={
              <Radio 
                sx={{
                  color: 'rgba(14, 0, 81, 0.3)',
                  '&.Mui-checked': {
                    color: '#f7931e',
                  },
                  '&.Mui-disabled': {
                    color: 'rgba(14, 0, 81, 0.2)',
                  }
                }}
              />
            } 
            label="Credit Card (Coming Soon)" 
            sx={{
              '& .MuiFormControlLabel-label': {
                color: 'rgba(14, 0, 81, 0.4)'
              }
            }}
          />
          <FormControlLabel 
            value="Mobile" 
            disabled
            control={
              <Radio 
                sx={{
                  color: 'rgba(14, 0, 81, 0.3)',
                  '&.Mui-checked': {
                    color: '#f7931e',
                  },
                  '&.Mui-disabled': {
                    color: 'rgba(14, 0, 81, 0.2)',
                  }
                }}
              />
            } 
            label="Mobile Payment (Coming Soon)" 
            sx={{
              '& .MuiFormControlLabel-label': {
                color: 'rgba(14, 0, 81, 0.4)'
              }
            }}
          />
          <FormControlLabel 
            value="Cash" 
            control={
              <Radio 
                sx={{
                  color: 'rgba(14, 0, 81, 0.6)',
                  '&.Mui-checked': {
                    color: '#f7931e',
                  },
                }}
              />
            } 
            label="Pay Later at Court" 
          />
        </RadioGroup>
      </FormControl>

      {paymentMethod === 'Card' && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2.5, 
            mb: 3,
            backgroundColor: 'rgba(14, 0, 81, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(14, 0, 81, 0.1)'
          }}
        >
          <Typography 
            variant="subtitle1" 
            gutterBottom
            sx={{ 
              color: '#0e0051',
              fontWeight: 600
            }}
          >
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
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2.5, 
            mb: 3,
            backgroundColor: 'rgba(14, 0, 81, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(14, 0, 81, 0.1)'
          }}
        >
          <Typography 
            variant="subtitle1" 
            gutterBottom
            sx={{ 
              color: '#0e0051',
              fontWeight: 600
            }}
          >
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
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2.5, 
            mb: 3,
            backgroundColor: 'rgba(14, 0, 81, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(14, 0, 81, 0.1)'
          }}
        >
          <Typography 
            variant="subtitle1" 
            gutterBottom
            sx={{ 
              color: '#0e0051',
              fontWeight: 600
            }}
          >
            Pay Later at Court
          </Typography>
          <Alert 
            severity="info" 
            sx={{ 
              mb: 2,
              borderRadius: '8px',
              '& .MuiAlert-icon': {
                color: '#f7931e'
              }
            }}
          >
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

      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 4,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}
      >
        <Button 
          onClick={onBack}
          sx={{
            color: '#0e0051',
            borderRadius: '25px',
            padding: '10px 24px',
            textTransform: 'none',
            fontSize: '1rem',
            '&:hover': {
              backgroundColor: 'rgba(14, 0, 81, 0.05)'
            }
          }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handlePayment}
          disabled={loading}
          sx={{
            backgroundColor: '#f7931e',
            color: 'white',
            borderRadius: '25px',
            padding: '10px 24px',
            fontWeight: 'bold',
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 4px 10px rgba(247, 147, 30, 0.3)',
            '&:hover': {
              backgroundColor: '#e08016',
              boxShadow: '0 6px 15px rgba(247, 147, 30, 0.4)',
            },
            order: { xs: -1, sm: 0 }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 
            paymentMethod === 'Cash' ? 'Confirm Booking' : 'Complete Payment'}
        </Button>
      </Box>
    </Box>
  );
};

export default PaymentConfirmation; 