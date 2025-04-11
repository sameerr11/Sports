import React, { useState } from 'react';
import { 
  Box, Typography, TextField, Button, Grid, 
  CircularProgress, Paper, Divider, FormControl,
  FormLabel, RadioGroup, FormControlLabel, Radio,
  useMediaQuery, useTheme
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{ 
          color: '#0e0051', 
          fontWeight: 600,
          mb: 2
        }}
      >
        Your Details
      </Typography>

      <Grid container spacing={2}>
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
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '8px',
                '& fieldset': {
                  borderColor: 'rgba(14, 0, 81, 0.2)'
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(14, 0, 81, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#f7931e',
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#f7931e',
              },
              '& .MuiFormHelperText-root.Mui-error': {
                fontWeight: 500
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
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '8px',
                '& fieldset': {
                  borderColor: 'rgba(14, 0, 81, 0.2)'
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(14, 0, 81, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#f7931e',
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#f7931e',
              },
              '& .MuiFormHelperText-root.Mui-error': {
                fontWeight: 500
              }
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            name="guestPhone"
            label="Phone"
            value={guestDetails.guestPhone}
            onChange={handleChange}
            error={!!localError.guestPhone}
            helperText={localError.guestPhone}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '8px',
                '& fieldset': {
                  borderColor: 'rgba(14, 0, 81, 0.2)'
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(14, 0, 81, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#f7931e',
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#f7931e',
              },
              '& .MuiFormHelperText-root.Mui-error': {
                fontWeight: 500
              }
            }}
          />
        </Grid>
      </Grid>

      {isBasketballCourt && (
        <Box sx={{ mt: 3, mb: 2 }}>
          <FormControl component="fieldset">
            <FormLabel 
              component="legend"
              sx={{ 
                color: '#0e0051',
                '&.Mui-focused': {
                  color: '#0e0051',
                }
              }}
            >
              Court Type
            </FormLabel>
            <RadioGroup
              row
              name="courtType"
              value={courtType}
              onChange={handleCourtTypeChange}
            >
              <FormControlLabel 
                value="Full Court" 
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
                label="Full Court" 
              />
              <FormControlLabel 
                value="Half Court" 
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
                label="Half Court" 
              />
            </RadioGroup>
          </FormControl>
        </Box>
      )}

      <Paper 
        elevation={0} 
        sx={{ 
          p: 2.5, 
          mt: 3, 
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
            fontWeight: 600, 
            color: '#0e0051',
            mb: 1.5
          }}
        >
          Booking Summary
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Court:
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {selectedCourt?.name} {isBasketballCourt ? `(${courtType})` : ''}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Sport Type:
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {selectedCourt?.sportType}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Location:
            </Typography>
            <Typography variant="body1">
              {selectedCourt?.location}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Date:
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {formatDateTime(selectedTimeSlot?.start).split(',')[0]},
              {formatDateTime(selectedTimeSlot?.start).split(',')[1]}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Time:
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {formatDateTime(selectedTimeSlot?.start).split(',')[2]} - 
              {formatDateTime(selectedTimeSlot?.end).split(',')[2]}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Price:
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#f7931e',
                fontSize: '1.1rem'
              }}
            >
              ${totalPrice.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

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
          type="submit"
          variant="contained"
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
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Proceed to Payment'}
        </Button>
      </Box>
    </Box>
  );
};

export default GuestDetails; 