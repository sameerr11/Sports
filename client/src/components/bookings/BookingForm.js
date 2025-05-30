import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Box, TextField, Button, Grid, Paper, Alert,
  FormControl, InputLabel, Select, MenuItem, FormHelperText,
  Chip, Stack, CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { createBooking } from '../../services/bookingService';
import { getTeams } from '../../services/teamService';
import { getCourtAvailability } from '../../services/courtService';
import { isAuthenticated, isCoach, isPlayer } from '../../services/authService';
import { format } from 'date-fns';

const BookingForm = ({ courtId, court }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    court: courtId,
    date: new Date(),
    startTime: null,
    endTime: null,
    purpose: 'Rental',
    team: '',
    notes: ''
  });
  
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [availability, setAvailability] = useState(null);
  const [fetchingAvailability, setFetchingAvailability] = useState(false);
  const isCoachOrPlayer = isCoach() || isPlayer();

  useEffect(() => {
    // Only fetch teams if user is a coach or player
    if (isCoachOrPlayer) {
      const fetchTeams = async () => {
        try {
          const teamsData = await getTeams();
          setTeams(teamsData);
        } catch (err) {
          console.error('Error fetching teams:', err);
        }
      };
      
      fetchTeams();
    }
  }, [isCoachOrPlayer]);

  useEffect(() => {
    // Calculate total price when start and end times change
    if (formData.startTime && formData.endTime && court.hourlyRate) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      const durationHours = (end - start) / (1000 * 60 * 60);
      
      setTotalPrice(durationHours * court.hourlyRate);
    } else {
      setTotalPrice(0);
    }
  }, [formData.startTime, formData.endTime, court.hourlyRate]);

  const fetchCourtAvailability = async (date) => {
    setFetchingAvailability(true);
    try {
      const availabilityData = await getCourtAvailability(courtId, format(date, 'yyyy-MM-dd'));
      setAvailability(availabilityData);
      
      // Reset time selections if the day changes
      setFormData(prev => ({
        ...prev,
        startTime: null,
        endTime: null
      }));
      
      // Show error if the court is not available on this day
      if (availabilityData.courtAvailability.length === 0) {
        setError(`This court is not available on ${format(date, 'EEEE')}s. Please select another day.`);
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching court availability:', err);
      setError('Failed to fetch court availability');
    } finally {
      setFetchingAvailability(false);
    }
  };

  const handleDateChange = (date) => {
    if (!date) return;
    
    setFormData(prev => ({
      ...prev,
      date,
      startTime: null,
      endTime: null
    }));
    
    fetchCourtAvailability(date);
  };

  const handleStartTimeChange = (time) => {
    if (!time) return;
    
    const combinedDateTime = new Date(formData.date);
    combinedDateTime.setHours(time.getHours(), time.getMinutes());
    
    setFormData(prev => ({
      ...prev,
      startTime: combinedDateTime
    }));
  };

  const handleEndTimeChange = (time) => {
    if (!time) return;
    
    const combinedDateTime = new Date(formData.date);
    combinedDateTime.setHours(time.getHours(), time.getMinutes());
    
    setFormData(prev => ({
      ...prev,
      endTime: combinedDateTime
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'purpose') {
      handlePurposeChange(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePurposeChange = (purpose) => {
    // Set the new purpose
    setFormData(prev => ({
      ...prev,
      purpose,
      // If switching between Rental and Academy, clear the selected times
      // since they might not be valid for the new purpose
      startTime: null,
      endTime: null
    }));
    
    // Clear any error messages
    setError(null);
    
    // If the time slots need to be refreshed for the new purpose,
    // we can leave the availability as is since we filter it in the UI
    console.log(`Purpose changed to: ${purpose}`);
  };

  const validateForm = () => {
    if (!formData.startTime || !formData.endTime) {
      setError('Please select both start and end times');
      return false;
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    
    if (start >= end) {
      setError('End time must be after start time');
      return false;
    }

    if (start < new Date()) {
      setError('Cannot book in the past');
      return false;
    }
    
    // Check if the selected day has any availability slots
    if (!availability || availability.courtAvailability.length === 0) {
      setError(`This court is not available on ${format(formData.date, 'EEEE')}s. Please select another day.`);
      return false;
    }
    
    // Filter available slots based on booking purpose
    let availableSlots = availability.courtAvailability;
    
    if (formData.purpose === 'Training' || formData.purpose === 'Match') {
      // For training or match, only use Academy slots
      availableSlots = availability.courtAvailability.filter(slot => slot.type === 'Academy');
      if (availableSlots.length === 0) {
        setError('Academy bookings are not available on this day. Please select another day or purpose.');
        return false;
      }
    } else if (formData.purpose === 'Rental') {
      // For rentals, only use Rental slots
      availableSlots = availability.courtAvailability.filter(slot => slot.type === 'Rental');
      if (availableSlots.length === 0) {
        setError('Rental bookings are not available on this day. Please select another day or purpose.');
        return false;
      }
    }
    
    // Check if the selected time range falls within an available slot
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const endHour = end.getHours();
    const endMinute = end.getMinutes();
    
    const bookingStartMinutes = startHour * 60 + startMinute;
    const bookingEndMinutes = endHour * 60 + endMinute;
    
    const isWithinAvailableHours = availableSlots.some(slot => {
      const slotStart = slot.start.split(':').map(Number);
      const slotEnd = slot.end.split(':').map(Number);
      const slotStartMinutes = slotStart[0] * 60 + slotStart[1];
      const slotEndMinutes = slotEnd[0] * 60 + slotEnd[1];
      
      return bookingStartMinutes >= slotStartMinutes && bookingEndMinutes <= slotEndMinutes;
    });
    
    if (!isWithinAvailableHours) {
      setError(`Selected time is outside court's available ${formData.purpose === 'Training' || formData.purpose === 'Match' ? 'Academy' : 'Rental'} hours for this day`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (!isAuthenticated()) {
      setError('You must be logged in to book a court');
      return;
    }

    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const bookingData = {
        court: courtId,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose,
        notes: formData.notes
      };
      
      // Only include team if selected
      if (formData.team) {
        bookingData.team = formData.team;
      }
      
      await createBooking(bookingData);
      setSuccess(true);
      
      // Reset form
      setFormData({
        court: courtId,
        date: new Date(),
        startTime: null,
        endTime: null,
        purpose: 'Rental',
        team: '',
        notes: ''
      });
      
      setTimeout(() => {
        navigate('/bookings/me');
      }, 2000);
    } catch (err) {
      if (err.includes('Court is not available on')) {
        setError('This court is not available on the selected day. Please choose another day.');
      } else if (err.includes('Booking time is outside')) {
        setError('Your booking time is outside the court\'s available hours. Please check the available time slots.');
      } else {
        setError(err.toString());
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load - fetch availability for the current date
  useEffect(() => {
    if (courtId) {
      fetchCourtAvailability(formData.date);
    }
  }, [courtId]);

  // Check if any Academy slots are available
  const hasAcademySlots = availability?.courtAvailability?.some(slot => slot.type === 'Academy') || false;
  
  // Check if any Rental slots are available 
  const hasRentalSlots = availability?.courtAvailability?.some(slot => slot.type === 'Rental') || false;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Book {court.name}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>Booking created successfully!</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> Bookings can only be made during the court's available hours. 
                  Days without any availability slots are not bookable.
                </Typography>
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={handleDateChange}
                minDate={new Date()}
                renderInput={(params) => <TextField {...params} fullWidth />}
                disabled={loading}
              />
            </Grid>
            
            {fetchingAvailability && (
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Grid>
            )}
            
            {availability && availability.courtAvailability.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Available Time Slots for {format(formData.date, 'EEEE, MMMM d, yyyy')}:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {availability.courtAvailability
                    .filter(slot => {
                      // Filter slots based on booking purpose
                      if (formData.purpose === 'Training' || formData.purpose === 'Match') {
                        return slot.type === 'Academy';
                      } else if (formData.purpose === 'Rental') {
                        return slot.type === 'Rental';
                      }
                      return true; // Show all if no purpose selected
                    })
                    .map((slot, index) => (
                      <Chip 
                        key={index}
                        label={`${slot.start} - ${slot.end} (${slot.type})`}
                        color={slot.type === 'Academy' ? 'primary' : 'secondary'}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                </Stack>
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <TimePicker
                label="Start Time"
                value={formData.startTime}
                onChange={handleStartTimeChange}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TimePicker
                label="End Time"
                value={formData.endTime}
                onChange={handleEndTimeChange}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Purpose</InputLabel>
                <Select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  label="Purpose"
                >
                  <MenuItem value="Rental" disabled={!hasRentalSlots}>Rental</MenuItem>
                  <MenuItem value="Training" disabled={!hasAcademySlots}>Training</MenuItem>
                  <MenuItem value="Match" disabled={!hasAcademySlots}>Match</MenuItem>
                </Select>
                <FormHelperText>
                  Note: Training and Match bookings use Academy time slots, while Rental bookings use Rental time slots. 
                  Time slots available will change based on the selected purpose.
                  {!hasAcademySlots && formData.purpose !== 'Rental' && (
                    <span style={{ color: 'red' }}> No Academy slots available on this day.</span>
                  )}
                  {!hasRentalSlots && formData.purpose === 'Rental' && (
                    <span style={{ color: 'red' }}> No Rental slots available on this day.</span>
                  )}
                </FormHelperText>
              </FormControl>
            </Grid>
            
            {isCoachOrPlayer && teams.length > 0 && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Team (Optional)</InputLabel>
                  <Select
                    name="team"
                    value={formData.team}
                    onChange={handleChange}
                    label="Team (Optional)"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {teams.map((team) => (
                      <MenuItem key={team._id} value={team._id}>
                        {team.name} ({team.sportType})
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select a team if this booking is for team activities</FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes (Optional)"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any special requests or additional information"
              />
            </Grid>
            
            {totalPrice > 0 && formData.purpose === 'Rental' && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <Typography variant="h6">
                    Total Price: ${totalPrice.toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    {court.hourlyRate} per hour × {((formData.endTime - formData.startTime) / (1000 * 60 * 60)).toFixed(1)} hours
                  </Typography>
                </Paper>
              </Grid>
            )}
            
            {formData.purpose !== 'Rental' && formData.startTime && formData.endTime && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="h6">
                    Free Academy Booking
                  </Typography>
                  <Typography variant="body2">
                    No payment required for {formData.purpose.toLowerCase()} bookings
                  </Typography>
                </Paper>
              </Grid>
            )}
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                fullWidth
              >
                {loading ? 'Processing...' : 'Book Now'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>
    </LocalizationProvider>
  );
};

export default BookingForm; 