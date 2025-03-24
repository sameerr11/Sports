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

  const handleStartNewBooking = () => {
    window.location.href = '/guest-booking';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <CheckCircleOutline color="success" sx={{ fontSize: 80 }} />
      </Box>
      
      <Typography variant="h5" align="center" gutterBottom sx={{ color: 'success.main' }}>
        Booking Confirmed
      </Typography>
      
      <Typography variant="body1" align="center" paragraph>
        Your booking has been confirmed. Please save your booking reference for future reference.
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4, mt: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Booking Reference:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold" align="right">
              {booking.bookingReference}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2">Guest Name:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" align="right">
              {booking.guestName}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2">Email:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" align="right">
              {booking.guestEmail}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2">Phone:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" align="right">
              {booking.guestPhone}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2">Court:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" align="right">
              {booking.court.name}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2">Sport Type:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" align="right">
              {booking.court.sportType}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2">Location:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" align="right">
              {booking.court.location}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2">Date:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" align="right">
              {new Date(booking.startTime).toLocaleDateString()}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2">Time:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" align="right">
              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2">Total Amount:</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1" fontWeight="bold" align="right">
              ${booking.totalPrice.toFixed(2)}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2">Payment Status:</Typography>
          </Grid>
          <Grid item xs={6}>
            {booking.paymentStatus === 'Paid' ? (
              <Typography variant="body1" color="success.main" fontWeight="bold" align="right">
                Paid
              </Typography>
            ) : (
              <Typography variant="body1" color="warning.main" fontWeight="bold" align="right">
                Pay at Court
              </Typography>
            )}
          </Grid>
          
          {booking.paymentStatus === 'Unpaid' && booking.paymentMethod === 'Cash' && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                Your booking is pending until payment is received. Please arrive 15 minutes before your booking time and bring your booking reference number to complete payment at the court. Once payment is received, your booking will be confirmed.
              </Alert>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" paragraph>
          A confirmation email has been sent to {booking.guestEmail}. If you need to cancel your booking, 
          please use the cancellation link in the email or contact us with your booking reference.
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button 
          variant="contained" 
          onClick={handleStartNewBooking}
        >
          Book Another Court
        </Button>
      </Box>
    </Box>
  );
};

export default BookingConfirmation; 