import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, 
  Button, CircularProgress, FormControl, FormLabel, 
  RadioGroup, Radio, FormControlLabel,
  Checkbox, Paper, Divider, Alert, CardActionArea, Tooltip,
  useMediaQuery, useTheme
} from '@mui/material';
import { getCourtAvailability } from '../../services/guestBookingService';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';

const TimeSelection = ({ 
  selectedCourt, 
  selectedDate, 
  selectedTimeSlot,
  setSelectedTimeSlot,
  onBack,
  onNext
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [isBasketballCourt, setIsBasketballCourt] = useState(false);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedCourt) return;
      
      setLoading(true);
      setError('');
      try {
        const formattedDate = formatDate(selectedDate);
        const response = await getCourtAvailability(selectedCourt.id, formattedDate);
        setAvailableSlots(response.availableSlots || []);
        setBookedSlots(response.bookedSlots || []);
        setIsBasketballCourt(response.isBasketballCourt || false);
      } catch (err) {
        setError(err.toString());
        setAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedCourt, selectedDate]);

  // Clear selected slots when court or date changes
  useEffect(() => {
    setSelectedSlots([]);
  }, [selectedCourt, selectedDate]);

  // Function to check if a time slot is already booked
  const isTimeSlotBooked = (start, end) => {
    return bookedSlots.some(bookedSlot => {
      const bookedStart = new Date(bookedSlot.startTime);
      const bookedEnd = new Date(bookedSlot.endTime);
      const courtType = bookedSlot.courtType || 'Full Court';
      
      // For basketball courts, half-court bookings don't fully block the time slot
      if (isBasketballCourt && courtType === 'Half Court') {
        // Count how many half-court bookings are in this time slot
        const halfCourtBookingsCount = bookedSlots.filter(slot => {
          const slotStart = new Date(slot.startTime);
          const slotEnd = new Date(slot.endTime);
          return (
            slot.courtType === 'Half Court' &&
            ((start >= slotStart && start < slotEnd) || 
            (end > slotStart && end <= slotEnd) ||
            (start <= slotStart && end >= slotEnd))
          );
        }).length;
        
        // If there are already 2 half-court bookings, the slot is fully booked
        return halfCourtBookingsCount >= 2;
      }
      
      // For regular full-court bookings or non-basketball courts
      return (
        courtType === 'Full Court' && 
        ((start >= bookedStart && start < bookedEnd) || 
        (end > bookedStart && end <= bookedEnd) ||
        (start <= bookedStart && end >= bookedEnd))
      );
    });
  };

  // Check if a time slot has a half court already booked
  const hasHalfCourtBooked = (start, end) => {
    if (!isBasketballCourt) return false;
    
    // Count half-court bookings for this time slot
    const halfCourtBookingsCount = bookedSlots.filter(bookedSlot => {
      const bookedStart = new Date(bookedSlot.startTime);
      const bookedEnd = new Date(bookedSlot.endTime);
      const courtType = bookedSlot.courtType || 'Full Court';
      
      // Check if there's a half-court booking that overlaps with this slot
      return (
        courtType === 'Half Court' &&
        ((start >= bookedStart && start < bookedEnd) || 
        (end > bookedStart && end <= bookedEnd) ||
        (start <= bookedStart && end >= bookedEnd))
      );
    }).length;
    
    return halfCourtBookingsCount === 1; // Return true only if exactly 1 half court is booked
  };

  // Generate one-hour time slots from available slots
  const generateHourlyTimeSlots = () => {
    const hourlySlots = [];
    
    availableSlots.forEach(slot => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);
      
      // Generate one-hour slots
      let currentStart = new Date(slotStart);
      while (currentStart < slotEnd) {
        const currentEnd = new Date(currentStart);
        currentEnd.setHours(currentEnd.getHours() + 1);
        
        // If current end time exceeds slot end time, adjust
        if (currentEnd > slotEnd) {
          break;
        }
        
        // Only add if not fully booked
        if (!isTimeSlotBooked(currentStart, currentEnd)) {
          const hasHalfBooked = hasHalfCourtBooked(currentStart, currentEnd);
          
          hourlySlots.push({
            start: new Date(currentStart),
            end: new Date(currentEnd),
            display: `${formatTime(currentStart)} - ${formatTime(currentEnd)}`,
            hasHalfCourtBooked: hasHalfBooked
          });
        }
        
        // Move to next hour
        currentStart.setHours(currentStart.getHours() + 1);
      }
    });
    
    return hourlySlots;
  };

  const timeSlots = generateHourlyTimeSlots();

  // Function to check if removing a slot would break continuity
  const wouldBreakContinuity = (slotToRemove) => {
    if (selectedSlots.length <= 2) return false;
    
    const remainingSlots = selectedSlots.filter(s => s.display !== slotToRemove.display)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Check if all remaining slots form a continuous chain
    for (let i = 0; i < remainingSlots.length - 1; i++) {
      const current = remainingSlots[i];
      const next = remainingSlots[i + 1];
      
      if (Math.abs(current.end.getTime() - next.start.getTime()) > 60000) {
        return true;
      }
    }
    
    return false;
  };
  
  const handleSlotToggle = (slot) => {
    // Check if slot is already selected
    const isSelected = selectedSlots.some(
      selected => selected.display === slot.display
    );

    if (isSelected) {
      // Check if removing this slot would break continuity
      if (wouldBreakContinuity(slot)) {
        setError('Removing this slot would break the continuous booking. Please deselect from the ends first.');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      // Remove slot if already selected and removal won't break continuity
      setSelectedSlots(selectedSlots.filter(
        selected => selected.display !== slot.display
      ));
    } else {
      // Check if adding this slot would create a non-consecutive booking
      if (selectedSlots.length > 0) {
        // Sort current selections by start time
        const sortedCurrentSlots = [...selectedSlots].sort((a, b) => 
          a.start.getTime() - b.start.getTime()
        );
        
        // Get earliest and latest slots currently selected
        const earliestSelected = sortedCurrentSlots[0];
        const latestSelected = sortedCurrentSlots[sortedCurrentSlots.length - 1];
        
        // Check if new slot is adjacent to existing selections
        const slotAdjacentToEarliest = 
          Math.abs(slot.end.getTime() - earliestSelected.start.getTime()) <= 60000 || // 1 minute tolerance
          Math.abs(slot.start.getTime() - earliestSelected.end.getTime()) <= 60000;
          
        const slotAdjacentToLatest = 
          Math.abs(slot.start.getTime() - latestSelected.end.getTime()) <= 60000 || 
          Math.abs(slot.end.getTime() - latestSelected.start.getTime()) <= 60000;
        
        // Only allow selection if slot is adjacent to current selections
        if (slotAdjacentToEarliest || slotAdjacentToLatest) {
          setSelectedSlots([...selectedSlots, slot]);
        } else {
          setError('Please select consecutive time slots only');
          setTimeout(() => setError(''), 3000);
        }
      } else {
        // First selection, always allowed
        setSelectedSlots([...selectedSlots, slot]);
      }
    }
  };

  // Calculate total price for all selected slots
  const calculateTotalPrice = () => {
    if (!selectedCourt || selectedSlots.length === 0) return 0;
    
    // Each slot is one hour, so total is hourly rate * number of slots
    return selectedCourt.hourlyRate * selectedSlots.length;
  };

  // When proceeding to next step, combine the selected slots into a single booking timeframe
  const handleProceed = () => {
    if (selectedSlots.length === 0) return;
    
    // Sort slots by start time
    const sortedSlots = [...selectedSlots].sort((a, b) => 
      a.start.getTime() - b.start.getTime()
    );
    
    // Create a single time slot from earliest start to latest end
    const combinedTimeSlot = {
      start: sortedSlots[0].start,
      end: sortedSlots[sortedSlots.length - 1].end
    };
    
    setSelectedTimeSlot(combinedTimeSlot);
    onNext();
  };

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
        Select Time Slot
      </Typography>
      
      <Typography 
        variant="body1" 
        sx={{ 
          mb: 2,
          color: '#0e0051'
        }}
      >
        Selected Court: <strong>{selectedCourt?.name}</strong>
      </Typography>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            borderRadius: '8px'
          }}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress sx={{ color: '#f7931e' }} />
        </Box>
      ) : timeSlots.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            textAlign: 'center',
            backgroundColor: 'rgba(14, 0, 81, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(14, 0, 81, 0.1)'
          }}
        >
          <Typography color="textSecondary">
            No available time slots for this date. Please select another date.
          </Typography>
        </Paper>
      ) : (
        <>
          <Typography 
            variant="subtitle1"
            sx={{ 
              mb: 2,
              fontWeight: 600,
              color: '#0e0051'
            }}
          >
            Available Time Slots
          </Typography>
          
          <Typography 
            variant="body2" 
            color="textSecondary"
            sx={{ 
              mb: 2,
              fontStyle: 'italic'
            }}
          >
            Select consecutive time slots for your booking
          </Typography>
          
          <Grid container spacing={2}>
            {timeSlots.map((slot, index) => {
              const isSelected = selectedSlots.some(
                selected => selected.display === slot.display
              );
              
              return (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <Card
                    sx={{
                      backgroundColor: isSelected 
                        ? 'rgba(247, 147, 30, 0.1)' 
                        : 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '12px',
                      border: isSelected 
                        ? '2px solid #f7931e' 
                        : '1px solid rgba(14, 0, 81, 0.1)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      boxShadow: isSelected
                        ? '0 4px 12px rgba(247, 147, 30, 0.15)'
                        : 'none',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(14, 0, 81, 0.1)',
                        backgroundColor: isSelected 
                          ? 'rgba(247, 147, 30, 0.15)'
                          : 'rgba(14, 0, 81, 0.05)'
                      }
                    }}
                    onClick={() => handleSlotToggle(slot)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography 
                        variant="body1" 
                        component="div"
                        sx={{ 
                          fontWeight: isSelected ? 'bold' : 'normal',
                          color: isSelected ? '#f7931e' : '#0e0051'
                        }}
                      >
                        {slot.display}
                      </Typography>
                      
                      {slot.hasHalfCourtBooked && isBasketballCourt && (
                        <Typography 
                          variant="caption" 
                          color="textSecondary"
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mt: 1,
                            gap: 0.5
                          }}
                        >
                          <SportsBasketballIcon fontSize="small" />
                          Half court available
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          
          {selectedSlots.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                mt: 3,
                p: 2.5,
                backgroundColor: 'rgba(14, 0, 81, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(14, 0, 81, 0.1)'
              }}
            >
              <Typography 
                variant="subtitle1"
                sx={{ 
                  fontWeight: 600,
                  color: '#0e0051',
                  mb: 1
                }}
              >
                Your Selection
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      mb: { xs: 2, md: 0 }
                    }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      Selected Time:
                    </Typography>
                    {selectedSlots.length === 1 ? (
                      <Typography 
                        variant="body1"
                        sx={{ fontWeight: 500 }}
                      >
                        {selectedSlots[0].display}
                      </Typography>
                    ) : (
                      <Typography 
                        variant="body1"
                        sx={{ fontWeight: 500 }}
                      >
                        {selectedSlots.sort((a, b) => a.start - b.start)[0].display.split('-')[0]} - 
                        {selectedSlots.sort((a, b) => a.start - b.start)[selectedSlots.length - 1].display.split('-')[1]}
                      </Typography>
                    )}
                    <Typography 
                      variant="body2" 
                      sx={{ mt: 1.5 }}
                      color="textSecondary"
                    >
                      Duration:
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontWeight: 500 }}
                    >
                      {selectedSlots.length} hour{selectedSlots.length > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      mb: 1
                    }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      Court Rate:
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontWeight: 500 }}
                    >
                      ${selectedCourt?.hourlyRate.toFixed(2)}/hour
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ mt: 1.5 }}
                      color="textSecondary"
                    >
                      Total Price:
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: '#f7931e',
                        fontSize: '1.1rem'
                      }}
                    >
                      ${calculateTotalPrice().toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
        </>
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
          onClick={handleProceed}
          disabled={selectedSlots.length === 0}
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
            '&.Mui-disabled': {
              backgroundColor: 'rgba(0, 0, 0, 0.12)',
              color: 'rgba(0, 0, 0, 0.26)'
            },
            order: { xs: -1, sm: 0 }
          }}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
};

export default TimeSelection; 