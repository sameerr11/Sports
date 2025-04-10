import React from 'react';
import { 
  Box, Typography, Paper, Grid, 
  Divider, Button, Alert
} from '@mui/material';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import { useNavigate } from 'react-router-dom';

const BookingConfirmation = ({ booking }) => {
  const navigate = useNavigate();

  if (!booking) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          No booking information available.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.href = '/guest-booking'}
          sx={{ mt: 2 }}
        >
          Start New Booking
        </Button>
      </Box>
    );
  }

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateTime) => {
    return new Date(dateTime).toLocaleDateString([], { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleStartNewBooking = () => {
    window.location.href = '/guest-booking';
  };

  // Get court type information
  const isBasketballCourt = booking.court?.sportType === 'Basketball';
  const courtTypeInfo = isBasketballCourt ? `(${booking.courtType || 'Full Court'})` : '';

  return (
    <Box sx={{ textAlign: 'center' }}>
      <CheckCircleOutline 
        color="success" 
        sx={{ fontSize: 60, mb: 2 }} 
      />
      <Typography variant="h5" gutterBottom>
        Booking Confirmed!
      </Typography>
      <Typography variant="body1" gutterBottom>
        Your booking reference is: <strong>{booking.bookingReference}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Please save this reference for any future inquiries.
      </Typography>
      
      <Paper sx={{ mt: 4, p: 3, maxWidth: 500, mx: 'auto' }}>
        <Typography variant="h6" gutterBottom align="left">
          Booking Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Court:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography variant="body1">
              {booking.court?.name} {courtTypeInfo}
            </Typography>
          </Grid>
          
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Sport:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography variant="body1">
              {booking.court?.sportType}
            </Typography>
          </Grid>
          
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Date:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography variant="body1">
              {formatDate(booking.startTime)}
            </Typography>
          </Grid>
          
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Time:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography variant="body1">
              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Name:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography variant="body1">
              {booking.guestName}
            </Typography>
          </Grid>
          
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Email:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography variant="body1">
              {booking.guestEmail}
            </Typography>
          </Grid>
          
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Total Amount:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography variant="body1" fontWeight="bold">
              ${booking.totalPrice?.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
        A confirmation email has been sent to {booking.guestEmail}. Please make sure to check your spam folder if you don't see it in your inbox.
      </Alert>
      
      <Button 
        variant="contained" 
        onClick={handleStartNewBooking}
        sx={{ mt: 3 }}
      >
        Book Another Court
      </Button>
    </Box>
  );
};

export default BookingConfirmation; 