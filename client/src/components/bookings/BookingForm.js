import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Box, TextField, Button, Grid, Paper, Alert,
  FormControl, InputLabel, Select, MenuItem, FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { createBooking } from '../../services/bookingService';
import { getTeams } from '../../services/teamService';
import { isAuthenticated, isCoach, isPlayer } from '../../services/authService';

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
    // Calculate total price when start or end time changes
    if (formData.startTime && formData.endTime && court) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      
      // Calculate duration in hours
      const durationHours = (end - start) / (1000 * 60 * 60);
      
      if (durationHours > 0) {
        setTotalPrice(durationHours * court.hourlyRate);
      } else {
        setTotalPrice(0);
      }
    }
  }, [formData.startTime, formData.endTime, court]);

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, date }));
    
    // Reset times when date changes
    setFormData(prev => ({ 
      ...prev, 
      date,
      startTime: null,
      endTime: null
    }));
  };

  const handleStartTimeChange = (time) => {
    if (!time) return;
    
    // Combine date and time
    const dateTime = new Date(formData.date);
    dateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
    
    setFormData(prev => ({ ...prev, startTime: dateTime }));
  };

  const handleEndTimeChange = (time) => {
    if (!time) return;
    
    // Combine date and time
    const dateTime = new Date(formData.date);
    dateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
    
    setFormData(prev => ({ ...prev, endTime: dateTime }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

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
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={handleDateChange}
                minDate={new Date()}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>
            
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
                  <MenuItem value="Rental">Rental</MenuItem>
                  <MenuItem value="Training">Training</MenuItem>
                  <MenuItem value="Match">Match</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
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
            
            {totalPrice > 0 && (
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