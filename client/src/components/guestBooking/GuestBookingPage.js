import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Button, TextField, Grid, 
  MenuItem, Select, FormControl, InputLabel, Snackbar, Alert,
  CircularProgress, Stepper, Step, StepLabel
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
// Import your service for API calls
import * as guestBookingService from '../../services/guestBookingService';

// A custom hook to detect if we're on the booking subdomain
const useIsBookingSubdomain = () => {
  return window.location.hostname.startsWith('booking.');
};

// Define the steps for the booking process
const steps = ['Select Date', 'Select Court', 'Choose Time', 'Your Information', 'Confirmation'];

const GuestBookingPage = () => {
  const isSubdomain = useIsBookingSubdomain();
  
  // Booking state
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableCourts, setAvailableCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    notes: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookingReference, setBookingReference] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  // Fetch available courts when date changes
  useEffect(() => {
    const fetchAvailableCourts = async () => {
      try {
        setLoading(true);
        setError('');
        
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const { courts } = await guestBookingService.getAvailableCourts(formattedDate);
        
        setAvailableCourts(courts || []);
        
        // Clear subsequent selections
        setSelectedCourt('');
        setAvailableTimeSlots([]);
        setSelectedTimeSlot(null);
      } catch (err) {
        console.error('Error fetching courts:', err);
        setError('Unable to fetch available courts. Please try again later.');
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };
    
    if (activeStep === 0) {
      fetchAvailableCourts();
    }
  }, [selectedDate, activeStep]);
  
  // Fetch available time slots when court is selected
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedCourt) return;
      
      try {
        setLoading(true);
        setError('');
        
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const response = await guestBookingService.getCourtAvailability(selectedCourt, formattedDate);
        
        setAvailableTimeSlots(response.availableSlots || []);
        setSelectedTimeSlot(null);
      } catch (err) {
        console.error('Error fetching time slots:', err);
        setError('Unable to fetch available time slots. Please try again later.');
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };
    
    if (activeStep === 2) {
      fetchTimeSlots();
    }
  }, [selectedCourt, selectedDate, activeStep]);
  
  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Step navigation
  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Validate current step
  const validateCurrentStep = () => {
    switch (activeStep) {
      case 0: // Date selection
        return !!selectedDate;
      case 1: // Court selection
        return !!selectedCourt;
      case 2: // Time slot selection
        return !!selectedTimeSlot;
      case 3: // Guest information
        return (
          formData.guestName.trim() !== '' && 
          formData.guestEmail.trim() !== '' && 
          formData.guestPhone.trim() !== ''
        );
      default:
        return true;
    }
  };
  
  // Submit booking
  const handleSubmitBooking = async () => {
    if (!validateCurrentStep()) {
      setError('Please fill out all required fields.');
      setOpenSnackbar(true);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const bookingData = {
        court: selectedCourt,
        startTime: selectedTimeSlot.start,
        endTime: selectedTimeSlot.end,
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
        guestPhone: formData.guestPhone,
        notes: formData.notes
      };
      
      const { booking, message } = await guestBookingService.createGuestBooking(bookingData);
      
      setSuccess(message || 'Booking created successfully!');
      setBookingReference(booking.bookingReference);
      setOpenSnackbar(true);
      handleNext();
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.toString());
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle court selection
  const handleCourtSelect = (courtId) => {
    setSelectedCourt(courtId);
    handleNext();
  };
  
  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    handleNext();
  };
  
  // Format time for display
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid time';
    }
  };
  
  // Start over or navigate home
  const handleStartOver = () => {
    // Reset all state
    setActiveStep(0);
    setSelectedDate(new Date());
    setSelectedCourt('');
    setAvailableTimeSlots([]);
    setSelectedTimeSlot(null);
    setFormData({
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      notes: ''
    });
    setBookingReference('');
  };
  
  // Handle navigation to main website (for subdomain usage)
  const goToMainWebsite = () => {
    if (isSubdomain) {
      window.location.href = window.location.href.replace('booking.', '');
    } else {
      window.location.href = '/';
    }
  };
  
  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Date selection
        return (
          <Box sx={{ my: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Date
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Booking Date"
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                disablePast
                sx={{ mt: 2 }}
              />
            </LocalizationProvider>
            <Button 
              variant="contained" 
              onClick={handleNext} 
              disabled={!selectedDate}
              sx={{ mt: 2 }}
              fullWidth
            >
              Continue
            </Button>
          </Box>
        );
        
      case 1: // Court selection
        return (
          <Box sx={{ my: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Court
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : availableCourts.length === 0 ? (
              <Typography color="error" sx={{ my: 2 }}>
                No courts available on the selected date.
              </Typography>
            ) : (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {availableCourts.map((court) => (
                  <Grid item xs={12} sm={6} md={4} key={court.id}>
                    <Paper 
                      elevation={3} 
                      sx={{ 
                        p: 2, 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6
                        }
                      }}
                      onClick={() => handleCourtSelect(court.id)}
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
            <Button 
              variant="outlined" 
              onClick={handleBack}
              sx={{ mt: 3 }}
              fullWidth
            >
              Back
            </Button>
          </Box>
        );
        
      case 2: // Time slot selection
        return (
          <Box sx={{ my: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Time Slot
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : availableTimeSlots.length === 0 ? (
              <Typography color="error" sx={{ my: 2 }}>
                No time slots available for this court on the selected date.
              </Typography>
            ) : (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {availableTimeSlots.map((slot, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper 
                      elevation={3} 
                      sx={{ 
                        p: 2, 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6
                        }
                      }}
                      onClick={() => handleTimeSlotSelect(slot)}
                    >
                      <Typography variant="h6">
                        {formatTime(slot.start)} - {formatTime(slot.end)}
                      </Typography>
                      <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                        {Math.round((new Date(slot.end) - new Date(slot.start)) / (1000 * 60))} minutes
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
            <Button 
              variant="outlined" 
              onClick={handleBack}
              sx={{ mt: 3 }}
              fullWidth
            >
              Back
            </Button>
          </Box>
        );
        
      case 3: // Guest information form
        return (
          <Box sx={{ my: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Your Name"
                  name="guestName"
                  value={formData.guestName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Email Address"
                  name="guestEmail"
                  type="email"
                  value={formData.guestEmail}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Phone Number"
                  name="guestPhone"
                  value={formData.guestPhone}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes (Optional)"
                  name="notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button variant="outlined" onClick={handleBack}>
                Back
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSubmitBooking}
                disabled={loading || !validateCurrentStep()}
              >
                {loading ? <CircularProgress size={24} /> : 'Confirm Booking'}
              </Button>
            </Box>
          </Box>
        );
        
      case 4: // Confirmation
        return (
          <Box sx={{ my: 3, textAlign: 'center' }}>
            <Typography variant="h5" color="primary" gutterBottom>
              Booking Confirmed!
            </Typography>
            <Typography variant="body1" paragraph>
              Your booking reference is:
            </Typography>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                my: 3, 
                display: 'inline-block',
                backgroundColor: '#f5f5f5'
              }}
            >
              <Typography variant="h4">
                {bookingReference}
              </Typography>
            </Paper>
            <Typography variant="body1" paragraph>
              Please save this reference for your records. You'll need it to manage your booking.
              A confirmation email has been sent to {formData.guestEmail}.
            </Typography>
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button variant="outlined" onClick={handleStartOver}>
                Book Another Court
              </Button>
              <Button variant="contained" onClick={goToMainWebsite}>
                Return to Website
              </Button>
            </Box>
          </Box>
        );
        
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ 
        py: 5, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center'
      }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Court Booking
        </Typography>
        
        <Typography variant="subtitle1" color="textSecondary" gutterBottom align="center">
          Book a court for your sports activity
        </Typography>
        
        <Paper elevation={3} sx={{ mt: 4, p: 3, width: '100%' }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {getStepContent(activeStep)}
        </Paper>
      </Box>
      
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
    </Container>
  );
};

export default GuestBookingPage;