import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Stepper, Step, StepLabel, Paper, Button, 
  IconButton, TextField, Grid, MenuItem, Select, FormControl, InputLabel,
  CircularProgress, Snackbar, Alert, FormHelperText
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { format } from 'date-fns';
import ultrasLogo from '../../assets/images/ultras_logo.png';
import * as guestBookingService from '../../services/guestBookingService';

// Detect if we're on booking subdomain
const isBookingSubdomain = () => {
  try {
    const hostname = window.location.hostname || '';
    return hostname.startsWith('booking.');
  } catch (err) {
    console.error('Error detecting subdomain:', err);
    return false;
  }
};

const steps = ['Select Court', 'Select Time', 'Your Details', 'Payment', 'Confirmation'];

// Integrated components that were previously separate
const CourtSelection = ({ selectedDate, setSelectedDate, selectedCourt, setSelectedCourt, onNext }) => {
  const [availableCourts, setAvailableCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAvailableCourts = async () => {
      try {
        setLoading(true);
        setError('');
        
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const { courts } = await guestBookingService.getAvailableCourts(formattedDate);
        
        setAvailableCourts(courts || []);
      } catch (err) {
        console.error('Error fetching courts:', err);
        setError('Unable to fetch available courts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailableCourts();
  }, [selectedDate]);

  const handleSelectCourt = (courtId) => {
    setSelectedCourt(courtId);
    onNext();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select a Date and Court
      </Typography>
      
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Booking Date"
          value={selectedDate}
          onChange={(newDate) => setSelectedDate(newDate)}
          renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
          disablePast
          minDate={new Date()}
        />
      </LocalizationProvider>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ my: 2 }}>
          {error}
        </Typography>
      ) : availableCourts.length === 0 ? (
        <Typography sx={{ my: 2 }}>
          No courts available on the selected date. Please select another date.
        </Typography>
      ) : (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {availableCourts.map((court) => (
            <Grid item xs={12} sm={6} md={4} key={court.id}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2,
                  cursor: 'pointer',
                  border: court.id === selectedCourt ? '2px solid #1976d2' : 'none',
                  '&:hover': {
                    boxShadow: 6
                  }
                }}
                onClick={() => handleSelectCourt(court.id)}
              >
                <Typography variant="h6">{court.name}</Typography>
                <Typography variant="body2" color="textSecondary">{court.sportType}</Typography>
                <Typography variant="body2">{court.location}</Typography>
                <Typography variant="subtitle1" sx={{ mt: 1 }}>
                  ${court.hourlyRate}/hour
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

const TimeSelection = ({ selectedCourt, selectedDate, selectedTimeSlot, setSelectedTimeSlot, onBack, onNext }) => {
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        setLoading(true);
        setError('');
        
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const response = await guestBookingService.getCourtAvailability(selectedCourt, formattedDate);
        
        setAvailableTimeSlots(response.availableSlots || []);
      } catch (err) {
        console.error('Error fetching time slots:', err);
        setError('Unable to fetch available time slots. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, [selectedCourt, selectedDate]);

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid time';
    }
  };

  const handleSelectTimeSlot = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    onNext();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select a Time Slot
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ my: 2 }}>
          {error}
        </Typography>
      ) : availableTimeSlots.length === 0 ? (
        <Typography sx={{ my: 2 }}>
          No time slots available for this court on the selected date.
        </Typography>
      ) : (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {availableTimeSlots.map((slot, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2,
                  cursor: 'pointer',
                  border: selectedTimeSlot && 
                         selectedTimeSlot.start === slot.start && 
                         selectedTimeSlot.end === slot.end 
                         ? '2px solid #1976d2' : 'none',
                  '&:hover': {
                    boxShadow: 6
                  }
                }}
                onClick={() => handleSelectTimeSlot(slot)}
              >
                <Typography variant="h6">
                  {formatTime(slot.start)} - {formatTime(slot.end)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {((new Date(slot.end) - new Date(slot.start)) / (1000 * 60 * 60)).toFixed(1)} hours
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Box sx={{ display: 'flex', mt: 3 }}>
        <Button onClick={onBack} sx={{ mr: 1 }}>
          Back
        </Button>
      </Box>
    </Box>
  );
};

const GuestDetails = ({ 
  guestDetails, setGuestDetails, selectedCourt, selectedDate, 
  selectedTimeSlot, onBack, onNext, setBooking, setError 
}) => {
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [selectedCourtDetails, setSelectedCourtDetails] = useState(null);

  useEffect(() => {
    const fetchCourtDetails = async () => {
      try {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const response = await guestBookingService.getCourtAvailability(selectedCourt, formattedDate);
        setSelectedCourtDetails(response.court);
      } catch (err) {
        console.error('Error fetching court details:', err);
      }
    };
    
    fetchCourtDetails();
  }, [selectedCourt, selectedDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGuestDetails(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!guestDetails.guestName.trim()) {
      errors.guestName = 'Name is required';
    }
    
    if (!guestDetails.guestEmail.trim()) {
      errors.guestEmail = 'Email is required';
    } else if (!emailRegex.test(guestDetails.guestEmail)) {
      errors.guestEmail = 'Please enter a valid email';
    }
    
    if (!guestDetails.guestPhone.trim()) {
      errors.guestPhone = 'Phone number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const bookingData = {
        court: selectedCourt,
        startTime: selectedTimeSlot.start,
        endTime: selectedTimeSlot.end,
        guestName: guestDetails.guestName,
        guestEmail: guestDetails.guestEmail,
        guestPhone: guestDetails.guestPhone,
        notes: guestDetails.notes || ''
      };
      
      const response = await guestBookingService.createGuestBooking(bookingData);
      setBooking(response.booking);
      onNext();
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(typeof err === 'string' ? err : 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid time';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Details
      </Typography>
      
      <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          Booking Summary
        </Typography>
        <Typography variant="body2">
          Date: {format(selectedDate, 'MMMM dd, yyyy')}
        </Typography>
        <Typography variant="body2">
          Time: {selectedTimeSlot ? `${formatTime(selectedTimeSlot.start)} - ${formatTime(selectedTimeSlot.end)}` : ''}
        </Typography>
        <Typography variant="body2">
          Court: {selectedCourtDetails?.name}
        </Typography>
        {selectedCourtDetails && selectedTimeSlot && (
          <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
            Total Price: $
            {(
              selectedCourtDetails.hourlyRate * 
              ((new Date(selectedTimeSlot.end) - new Date(selectedTimeSlot.start)) / (1000 * 60 * 60))
            ).toFixed(2)}
          </Typography>
        )}
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Full Name"
            name="guestName"
            value={guestDetails.guestName}
            onChange={handleInputChange}
            error={!!formErrors.guestName}
            helperText={formErrors.guestName}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            name="guestEmail"
            value={guestDetails.guestEmail}
            onChange={handleInputChange}
            error={!!formErrors.guestEmail}
            helperText={formErrors.guestEmail}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            name="guestPhone"
            value={guestDetails.guestPhone}
            onChange={handleInputChange}
            error={!!formErrors.guestPhone}
            helperText={formErrors.guestPhone}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Additional Notes (Optional)"
            name="notes"
            value={guestDetails.notes || ''}
            onChange={handleInputChange}
            multiline
            rows={3}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Continue'}
        </Button>
      </Box>
    </Box>
  );
};

const PaymentConfirmation = ({ booking, onBack, onNext, setError }) => {
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [loading, setLoading] = useState(false);

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  const handlePaymentSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      await guestBookingService.updateGuestBookingPayment(booking._id, {
        paymentMethod,
        payLater: paymentMethod === 'Cash' // Pay later for Cash option
      });
      
      onNext();
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(typeof err === 'string' ? err : 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Payment
      </Typography>
      
      <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          Booking Details
        </Typography>
        <Typography variant="body2">
          Reference: {booking?.bookingReference}
        </Typography>
        <Typography variant="body2">
          Court: {booking?.court?.name}
        </Typography>
        <Typography variant="body2">
          Date: {booking ? format(new Date(booking.startTime), 'MMMM dd, yyyy') : ''}
        </Typography>
        <Typography variant="body2">
          Time: {booking ? `${format(new Date(booking.startTime), 'h:mm a')} - ${format(new Date(booking.endTime), 'h:mm a')}` : ''}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
          Total Amount: ${booking?.totalPrice.toFixed(2)}
        </Typography>
      </Box>
      
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Payment Method</InputLabel>
        <Select
          value={paymentMethod}
          onChange={handlePaymentMethodChange}
          label="Payment Method"
        >
          <MenuItem value="Card">Credit/Debit Card</MenuItem>
          <MenuItem value="Mobile">Mobile Payment</MenuItem>
          <MenuItem value="Cash">Cash (Pay at venue)</MenuItem>
        </Select>
        {paymentMethod === 'Cash' && (
          <FormHelperText>
            You'll need to pay at the venue before your booking time.
          </FormHelperText>
        )}
      </FormControl>
      
      {paymentMethod === 'Card' && (
        <Typography variant="body2" sx={{ mb: 3 }}>
          For demonstration purposes, we're simulating card payment. In a real application, you would integrate with a payment gateway here.
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button 
          variant="contained" 
          onClick={handlePaymentSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : paymentMethod === 'Cash' ? 'Confirm Pay Later' : 'Pay Now'}
        </Button>
      </Box>
    </Box>
  );
};

const BookingConfirmation = ({ booking }) => {
  const handleDownloadReceipt = () => {
    // In a real app, you would generate and download a PDF receipt
    alert('In a real application, this would download a PDF receipt.');
  };

  const isSubdomain = isBookingSubdomain();
  
  const returnToMainSite = () => {
    if (isSubdomain) {
      // If on subdomain, go to main domain
      window.location.href = window.location.href.replace('booking.', '');
    } else {
      // If on main site, just go to home
      window.location.href = '/';
    }
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom color="primary">
        Booking Confirmed!
      </Typography>
      
      <Box sx={{ my: 3, p: 3, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          {booking?.bookingReference}
        </Typography>
        <Typography variant="body2">
          Please save this reference number for your records.
        </Typography>
      </Box>
      
      <Typography variant="body1" paragraph>
        An email confirmation has been sent to {booking?.guestEmail}.
      </Typography>
      
      <Typography variant="body2" paragraph>
        You can cancel your booking up to 24 hours before the scheduled time by using the link in your confirmation email.
      </Typography>
      
      <Box sx={{ mt: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', gap: 2 }}>
        <Button variant="outlined" onClick={handleDownloadReceipt}>
          Download Receipt
        </Button>
        <Button variant="contained" onClick={returnToMainSite}>
          Return to Main Site
        </Button>
      </Box>
    </Box>
  );
};

const GuestBookingPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [guestDetails, setGuestDetails] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    notes: ''
  });
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  const isSubdomain = isBookingSubdomain();

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleBackToMain = () => {
    if (isSubdomain) {
      window.location.href = window.location.href.replace('booking.', '');
    } else {
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    // Clear error when step changes
    setError('');
  }, [activeStep]);

  useEffect(() => {
    // Show snackbar when error or success is set
    if (error || success) {
      setOpenSnackbar(true);
    }
  }, [error, success]);

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <CourtSelection 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedCourt={selectedCourt}
            setSelectedCourt={setSelectedCourt}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <TimeSelection
            selectedCourt={selectedCourt}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
            setSelectedTimeSlot={setSelectedTimeSlot}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <GuestDetails
            guestDetails={guestDetails}
            setGuestDetails={setGuestDetails}
            selectedCourt={selectedCourt}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
            onBack={handleBack}
            onNext={handleNext}
            setBooking={setBooking}
            setError={setError}
          />
        );
      case 3:
        return (
          <PaymentConfirmation
            booking={booking}
            onBack={handleBack}
            onNext={handleNext}
            setError={setError}
          />
        );
      case 4:
        return (
          <BookingConfirmation
            booking={booking}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box
      sx={{
        backgroundImage: `url(${ultrasLogo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        position: 'relative'
      }}
    >
      <Button
        variant="contained"
        startIcon={<ArrowBackIcon />}
        onClick={handleBackToMain}
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          backgroundColor: 'rgba(25, 118, 210, 0.8)',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.9)',
          }
        }}
      >
        {isSubdomain ? 'Back to Main Site' : 'Back to Login'}
      </Button>
      
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(5px)'
          }}
        >
          <Typography variant="h4" gutterBottom align="center">
            Book a Court
          </Typography>
          <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
            Book your favorite sport court without needing an account
          </Typography>
          
          <Box sx={{ mt: 4, mb: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          
          <Box sx={{ mt: 4 }}>
            {getStepContent(activeStep)}
          </Box>
        </Paper>
      </Container>
      
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={error ? "error" : "success"} 
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GuestBookingPage;