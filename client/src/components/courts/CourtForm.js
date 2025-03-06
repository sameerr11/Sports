import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, TextField, Button, Grid, Paper,
  FormControl, InputLabel, Select, MenuItem, Divider, IconButton,
  InputAdornment, FormHelperText, Alert
} from '@mui/material';
import { ArrowBack, Save, Add, Delete } from '@mui/icons-material';
import { createCourt, getCourtById, updateCourt } from '../../services/courtService';

const initialAvailability = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: []
};

const CourtForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    name: '',
    sportType: '',
    location: '',
    description: '',
    capacity: 1,
    hourlyRate: '',
    availability: { ...initialAvailability },
    image: ''
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCourt = async () => {
      try {
        if (isEditMode) {
          const court = await getCourtById(id);
          setFormData({
            name: court.name,
            sportType: court.sportType,
            location: court.location,
            description: court.description || '',
            capacity: court.capacity,
            hourlyRate: court.hourlyRate,
            availability: court.availability || { ...initialAvailability },
            image: court.image || ''
          });
        }
      } catch (err) {
        setError(err.toString());
      } finally {
        setLoading(false);
      }
    };

    fetchCourt();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };

  const addTimeSlot = (day) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: [...prev.availability[day], { start: '09:00', end: '10:00' }]
      }
    }));
  };

  const removeTimeSlot = (day, index) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: prev.availability[day].filter((_, i) => i !== index)
      }
    }));
  };

  const handleTimeSlotChange = (day, index, field, value) => {
    setFormData(prev => {
      const updatedSlots = [...prev.availability[day]];
      updatedSlots[index] = { ...updatedSlots[index], [field]: value };
      
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [day]: updatedSlots
        }
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    try {
      if (isEditMode) {
        await updateCourt(id, formData);
      } else {
        await createCourt(formData);
      }
      setSuccess(true);
      setTimeout(() => {
        navigate('/courts');
      }, 2000);
    } catch (err) {
      setError(err.toString());
    }
  };

  if (loading) {
    return <Typography>Loading court data...</Typography>;
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/courts')}
          sx={{ mb: 2 }}
        >
          Back to Courts
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Court' : 'Add New Court'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Court {isEditMode ? 'updated' : 'created'} successfully!</Alert>}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Court Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Sport Type"
                name="sportType"
                value={formData.sportType}
                onChange={handleChange}
                placeholder="e.g. Tennis, Basketball, Soccer"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Main Building, Floor 2"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleNumberChange}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Hourly Rate"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleNumberChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Availability Schedule
              </Typography>
              <FormHelperText sx={{ mb: 2 }}>
                Set the time slots when this court is available for booking
              </FormHelperText>

              {days.map((day) => (
                <Box key={day} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ textTransform: 'capitalize', flex: 1 }}>
                      {day}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => addTimeSlot(day)}
                    >
                      Add Time Slot
                    </Button>
                  </Box>
                  
                  {formData.availability[day].length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No time slots added for {day}
                    </Typography>
                  ) : (
                    formData.availability[day].map((slot, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 1,
                          gap: 2
                        }}
                      >
                        <TextField
                          label="Start Time"
                          type="time"
                          value={slot.start}
                          onChange={(e) => handleTimeSlotChange(day, index, 'start', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ step: 300 }}
                          size="small"
                          sx={{ width: 150 }}
                        />
                        <TextField
                          label="End Time"
                          type="time"
                          value={slot.end}
                          onChange={(e) => handleTimeSlotChange(day, index, 'end', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ step: 300 }}
                          size="small"
                          sx={{ width: 150 }}
                        />
                        <IconButton 
                          color="error" 
                          onClick={() => removeTimeSlot(day, index)}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    ))
                  )}
                  <Divider sx={{ mt: 2 }} />
                </Box>
              ))}
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<Save />}
                size="large"
              >
                {isEditMode ? 'Update Court' : 'Create Court'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default CourtForm; 