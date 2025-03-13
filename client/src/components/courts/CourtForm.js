import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, TextField, Button, Grid, Paper,
  FormControl, InputLabel, Select, MenuItem, Divider, IconButton,
  InputAdornment, FormHelperText, Alert, Avatar, CircularProgress
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ArrowBack, Save, Add, Delete, CloudUpload } from '@mui/icons-material';
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
    capacity: 1,
    hourlyRate: '',
    availability: { ...initialAvailability },
    image: ''
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allowedSportTypes = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Others'];

  useEffect(() => {
    const fetchCourt = async () => {
      try {
        if (isEditMode) {
          const court = await getCourtById(id);
          setFormData({
            name: court.name,
            sportType: court.sportType,
            location: court.location,
            capacity: court.capacity,
            hourlyRate: court.hourlyRate,
            availability: court.availability || { ...initialAvailability },
            image: court.image || ''
          });
          
          if (court.image) {
            setImagePreview(court.image);
          }
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImageLoading(true);
      
      // Create a FileReader to read the image
      const reader = new FileReader();
      reader.onloadend = () => {
        // Create an image element to get dimensions for resizing
        const img = new Image();
        img.onload = () => {
          // Create a canvas to resize the image
          const canvas = document.createElement('canvas');
          
          // Calculate new dimensions (max width/height of 800px while maintaining aspect ratio)
          let width = img.width;
          let height = img.height;
          const maxSize = 800;
          
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
          
          // Set canvas dimensions and draw resized image
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get resized image as data URL (JPEG format with 0.8 quality to reduce size)
          const resizedImage = canvas.toDataURL('image/jpeg', 0.8);
          
          // Update preview and form data with resized image
          setImagePreview(resizedImage);
          setFormData(prev => ({
            ...prev,
            image: resizedImage
          }));
          setImageLoading(false);
        };
        img.src = reader.result; // Use the file reader result to load the image
      };
      reader.readAsDataURL(file);
    }
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
    setValidationErrors({});
    setSubmitting(true);
    
    const errors = {};
    if (!allowedSportTypes.includes(formData.sportType)) {
      errors.sportType = 'Please select a valid sport type';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setSubmitting(false);
      return;
    }
    
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
    } finally {
      setSubmitting(false);
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
              <FormControl required fullWidth error={!!validationErrors.sportType}>
                <InputLabel id="sport-type-label">Sport Type</InputLabel>
                <Select
                  labelId="sport-type-label"
                  id="sportType"
                  name="sportType"
                  value={formData.sportType}
                  onChange={handleChange}
                  label="Sport Type"
                >
                  <MenuItem value="Football">Football</MenuItem>
                  <MenuItem value="Cricket">Cricket</MenuItem>
                  <MenuItem value="Basketball">Basketball</MenuItem>
                  <MenuItem value="Tennis">Tennis</MenuItem>
                  <MenuItem value="Others">Others</MenuItem>
                </Select>
                {validationErrors.sportType && (
                  <FormHelperText>{validationErrors.sportType}</FormHelperText>
                )}
              </FormControl>
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
              <Typography variant="subtitle1" gutterBottom>Court Image</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="court-image-upload"
                  type="file"
                  onChange={handleImageChange}
                  disabled={imageLoading}
                />
                <label htmlFor="court-image-upload">
                  <Button 
                    variant="outlined" 
                    component="span"
                    startIcon={imageLoading ? <CircularProgress size={20} /> : <CloudUpload />}
                    sx={{ mb: 2 }}
                    disabled={imageLoading}
                  >
                    {imageLoading ? 'Processing...' : 'Upload Image'}
                  </Button>
                </label>
                {imagePreview && (
                  <Box mt={2} sx={{ width: '100%' }}>
                    <img 
                      src={imagePreview} 
                      alt="Court preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px', 
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }} 
                    />
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Availability Schedule
              </Typography>
              <FormHelperText sx={{ mb: 2 }}>
                Set the time slots when this court is available for booking. 
                Days without any time slots will be considered as not available.
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
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        bgcolor: (theme) => alpha(theme.palette.error.light, 0.1),
                        p: 1,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Box component="span" sx={{ color: 'error.main', mr: 1, display: 'flex', alignItems: 'center' }}>
                        •
                      </Box>
                      No availability for {day} - This court will not be bookable on {day}s
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
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Save />}
                size="large"
                disabled={submitting || imageLoading}
              >
                {isEditMode 
                  ? (submitting ? 'Updating...' : 'Update Court') 
                  : (submitting ? 'Creating...' : 'Create Court')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default CourtForm; 