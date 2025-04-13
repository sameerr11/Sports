import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Paper, 
  Button,
  Container,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CourtSelection from './CourtSelection';
import TimeSelection from './TimeSelection';
import GuestDetails from './GuestDetails';
import PaymentConfirmation from './PaymentConfirmation';
import BookingConfirmation from './BookingConfirmation';
import ultrasLogo from '../../assets/images/ultras_logo.png';

const steps = ['Select Court', 'Select Time', 'Your Details', 'Payment', 'Confirmation'];

const GuestBookingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  // Reset booking form to start from beginning
  const resetBookingForm = () => {
    setActiveStep(0);
    setSelectedCourt(null);
    setSelectedTimeSlot(null);
    setGuestDetails({
      guestName: '',
      guestEmail: '',
      guestPhone: ''
    });
    setBooking(null);
    setError('');
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
            resetBookingForm={resetBookingForm}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0a0038 0%, #140060 50%, #1a0070 100%)',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 60%), 
                            radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 60%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
        }
      }}
    >
      {/* Logo Header Section */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          padding: { xs: '2.5rem 1rem 1.5rem', sm: '2.5rem 1rem' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2,
          '&::after': {
            content: '""',
          position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            maxWidth: '500px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(247, 147, 30, 0.5), transparent)',
          }
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem',
            borderRadius: '50%',
            overflow: 'visible',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '130%',
              height: '130%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(247, 147, 30, 0.15) 0%, transparent 70%)',
              zIndex: -1,
            }
          }}
        >
          <img 
            src={ultrasLogo} 
            alt="Ultras North Lebanon" 
            style={{ 
              width: 'auto', 
              height: 'auto', 
              maxWidth: '220px',
              maxHeight: '120px',
              filter: 'drop-shadow(0 0 10px rgba(247, 147, 30, 0.3))',
              animation: 'logoGlow 3s infinite alternate'
            }} 
          />
        </Box>
        
        {/* Animated subtitle */}
        <Typography
          variant="subtitle1"
          align="center"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontStyle: 'italic',
            fontSize: { xs: '0.85rem', sm: '1rem' },
            mt: 1,
            letterSpacing: '1px',
            textShadow: '0 0 5px rgba(247, 147, 30, 0.3)',
          }}
        >
          SPORTS COMPLEX
        </Typography>
      </Box>

      {/* Form Section with enhanced styling */}
      <Container maxWidth="md" sx={{ zIndex: 1, py: { xs: 2, sm: 3, md: 4 }, flexGrow: 1 }}>
        <Paper 
          elevation={5} 
          sx={{ 
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3), 0 5px 15px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #f7931e, #ff7f00, #f7931e)',
              backgroundSize: '200% 100%',
              animation: 'gradientFlow 3s ease infinite',
            },
            padding: { xs: 2.5, sm: 3.5, md: 4.5 },
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)',
            }
          }}
        >
          <Typography 
            variant="h4" 
            gutterBottom 
            align="center" 
            sx={{ 
              color: '#0e0051', 
              fontWeight: 'bold',
              fontSize: { xs: '1.6rem', sm: '1.85rem', md: '2.1rem' },
              mt: 1,
              letterSpacing: '0.5px',
              position: 'relative',
              display: 'inline-block',
              width: '100%',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '80px',
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #f7931e, transparent)',
                borderRadius: '3px',
              }
            }}
          >
            Book a Court
          </Typography>
          <Typography 
            variant="subtitle1" 
            gutterBottom 
            align="center" 
            color="text.secondary"
            sx={{ 
              mb: 4,
              mt: 2,
              maxWidth: '80%',
              mx: 'auto',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 500,
            }}
          >
            Book your favorite sport court without needing an account
          </Typography>
          
          <Box sx={{ mt: 2, mb: 4 }}>
            <Stepper 
              activeStep={activeStep} 
              alternativeLabel={!isMobile}
              orientation={isMobile ? 'vertical' : 'horizontal'}
              sx={{
                '& .MuiStepLabel-root': {
                  color: '#0e0051',
                },
                '& .MuiStepIcon-root': {
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                  transition: 'all 0.3s ease',
                },
                '& .MuiStepIcon-root.Mui-active': {
                  color: '#f7931e',
                  filter: 'drop-shadow(0 0 3px rgba(247, 147, 30, 0.5))',
                  transform: 'scale(1.2)',
                },
                '& .MuiStepIcon-root.Mui-completed': {
                  color: '#f7931e',
                },
                '& .MuiStepConnector-line': {
                  borderColor: 'rgba(14, 0, 81, 0.2)',
                },
                '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
                  borderColor: '#f7931e',
                },
                '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
                  borderColor: '#f7931e',
                },
                '& .MuiStepLabel-label': {
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  fontWeight: 500,
                },
                '& .MuiStepLabel-label.Mui-active': {
                  fontWeight: 700,
                  color: '#0e0051',
                }
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            {error && (
              <Box sx={{ mb: 2 }}>
                <Typography color="error">{error}</Typography>
              </Box>
            )}
            {getStepContent(activeStep)}
          </Box>
        </Paper>
      </Container>
      
      {/* Styled Footer */}
      <Box 
        sx={{ 
          height: '40px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '50%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
          }
        }} 
      >
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.75rem',
            letterSpacing: '1px'
          }}
        >
          ULTRAS SPORTS COMPLEX
        </Typography>
      </Box>

      {/* Add CSS animations */}
      <Box
        sx={{
          '@keyframes gradientFlow': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
          },
          '@keyframes logoGlow': {
            '0%': { filter: 'drop-shadow(0 0 5px rgba(247, 147, 30, 0.3))' },
            '100%': { filter: 'drop-shadow(0 0 15px rgba(247, 147, 30, 0.5))' },
          }
        }}
      />
    </Box>
  );
};

export default GuestBookingPage;