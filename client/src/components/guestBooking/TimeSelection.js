import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, 
  Button, CircularProgress, FormControl, FormLabel, 
  RadioGroup, Radio, FormControlLabel,
  Checkbox, Paper, Divider, Alert, CardActionArea, Tooltip
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
    
    // Create a combined time slot from first start to last end
    const combinedSlot = {
      start: sortedSlots[0].start,
      end: sortedSlots[sortedSlots.length - 1].end,
      display: `${formatTime(sortedSlots[0].start)} - ${formatTime(sortedSlots[sortedSlots.length - 1].end)}`
    };
    
    setSelectedTimeSlot(combinedSlot);
    onNext();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Time
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : timeSlots.length === 0 ? (
        <Typography>
          No available time slots found for this court on the selected date.
        </Typography>
      ) : (
        <Box>
          {error && (
            <Alert 
              severity="warning" 
              sx={{ mb: 2 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          <Typography variant="subtitle1" gutterBottom>
            Available Time Slots
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Select one or more consecutive hourly slots for your booking. 
            Multiple slots must be adjacent to each other.
            {isBasketballCourt && (
              <Box component="span" sx={{ display: 'block', mt: 1 }}>
                <SportsBasketballIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                Slots with a basketball icon have one half-court already booked. You can still book the other half.
              </Box>
            )}
          </Typography>
          
          <Grid container spacing={2}>
            {timeSlots.map((slot, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Tooltip 
                  title={slot.hasHalfCourtBooked ? "One half-court already booked. You can book the other half." : ""}
                  placement="top"
                  arrow
                >
                  <Card 
                    sx={{ 
                      mb: 1, 
                      backgroundColor: selectedSlots.some(s => s.display === slot.display) 
                        ? 'rgba(25, 118, 210, 0.3)' 
                        : 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(5px)',
                      border: selectedSlots.some(s => s.display === slot.display) ? '2px solid #1976d2' : 'none',
                      position: 'relative'
                    }}
                  >
                    <CardActionArea onClick={() => handleSlotToggle(slot)}>
                      <CardContent>
                        <Typography variant="body1" align="center">
                          {slot.display}
                        </Typography>
                        
                        {isBasketballCourt && slot.hasHalfCourtBooked && (
                          <Box sx={{ position: 'absolute', top: 5, right: 5 }}>
                            <SportsBasketballIcon fontSize="small" color="primary" />
                          </Box>
                        )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
          
          {selectedSlots.length > 0 && (
            <Paper sx={{ mt: 3, p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Selected Time Slots
              </Typography>
              <Box mb={2}>
                {selectedSlots.sort((a, b) => a.start.getTime() - b.start.getTime()).map((slot, index) => (
                  <Typography key={index} variant="body2">
                    • {slot.display}
                  </Typography>
                ))}
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body1">
                  Total Hours: <strong>{selectedSlots.length}</strong>
                </Typography>
                <Typography variant="body1">
                  Total Price: <strong>${calculateTotalPrice().toFixed(2)}</strong>
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleProceed}
          disabled={selectedSlots.length === 0}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default TimeSelection; 