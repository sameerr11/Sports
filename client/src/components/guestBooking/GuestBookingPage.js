import React, { useState } from 'react';
import { Container, Typography, Box, Stepper, Step, StepLabel, Paper, Button } from '@mui/material';
import CourtSelection from './CourtSelection';
import TimeSelection from './TimeSelection';
import GuestDetails from './GuestDetails';
import PaymentConfirmation from './PaymentConfirmation';
import BookingConfirmation from './BookingConfirmation';

const steps = ['Select Court', 'Select Time', 'Your Details', 'Payment', 'Confirmation'];

const GuestBookingPage = () => {
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
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
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
  );
};

export default GuestBookingPage; 