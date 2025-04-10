import React, { useState } from 'react';
import { Container, Typography, Box, Stepper, Step, StepLabel, Paper, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import CourtSelection from './CourtSelection';
import TimeSelection from './TimeSelection';
import GuestDetails from './GuestDetails';
import PaymentConfirmation from './PaymentConfirmation';
import BookingConfirmation from './BookingConfirmation';
import ultrasLogo from '../../assets/images/ultras_logo.png';

const steps = ['Select Court', 'Select Time', 'Your Details', 'Payment', 'Confirmation'];

const GuestBookingPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [guestDetails, setGuestDetails] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: ''
  });
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

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
        onClick={handleBackToLogin}
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
        Back to Login
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
            {error && (
              <Box sx={{ mb: 2 }}>
                <Typography color="error">{error}</Typography>
              </Box>
            )}
            {getStepContent(activeStep)}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default GuestBookingPage; 