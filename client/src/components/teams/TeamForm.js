import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, TextField, Button, Grid, Paper,
  FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress,
  FormHelperText
} from '@mui/material';
import { ArrowBack, Save, CloudUpload } from '@mui/icons-material';
import { createTeam, getTeamById, updateTeam } from '../../services/teamService';
import { alpha } from '@mui/material/styles';

const TeamForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    name: '',
    sportType: '',
    ageGroup: '',
    level: 'Beginner',
    logo: ''
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allowedSportTypes = ['Basketball', 'Football', 'Volleyball', 'Self Defense', 'Karate', 'Gymnastics', 'Gym', 'Zumba', 'Swimming', 'Ping Pong'];

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        if (isEditMode) {
          const team = await getTeamById(id);
          setFormData({
            name: team.name,
            sportType: team.sportType,
            ageGroup: team.ageGroup || '',
            level: team.level,
            logo: team.logo || ''
          });
          
          if (team.logo) {
            setImagePreview(team.logo);
          }
        }
      } catch (err) {
        setError(err.toString());
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
            logo: resizedImage
          }));
          setImageLoading(false);
        };
        img.src = reader.result; // Use the file reader result to load the image
      };
      reader.readAsDataURL(file);
    }
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
        await updateTeam(id, formData);
      } else {
        await createTeam(formData);
      }
      setSuccess(true);
      setTimeout(() => {
        navigate('/teams');
      }, 2000);
    } catch (err) {
      setError(err.toString());
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Typography>Loading team data...</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/teams')}
          sx={{ mb: 2 }}
        >
          Back to Teams
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? 'Edit Team' : 'Create New Team'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Team {isEditMode ? 'updated' : 'created'} successfully!</Alert>}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Team Name"
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
                  <MenuItem value="Basketball">Basketball</MenuItem>
                  <MenuItem value="Football">Football</MenuItem>
                  <MenuItem value="Volleyball">Volleyball</MenuItem>
                  <MenuItem value="Self Defense">Self Defense</MenuItem>
                  <MenuItem value="Karate">Karate</MenuItem>
                  <MenuItem value="Gymnastics">Gymnastics</MenuItem>
                  <MenuItem value="Gym">Gym</MenuItem>
                  <MenuItem value="Zumba">Zumba</MenuItem>
                  <MenuItem value="Swimming">Swimming</MenuItem>
                  <MenuItem value="Ping Pong">Ping Pong</MenuItem>
                </Select>
                {validationErrors.sportType && (
                  <FormHelperText>{validationErrors.sportType}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Age Group"
                name="ageGroup"
                value={formData.ageGroup}
                onChange={handleChange}
                placeholder="e.g. Under 12, Adult, Senior"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  label="Level"
                >
                  <MenuItem value="Beginner">Beginner</MenuItem>
                  <MenuItem value="Intermediate">Intermediate</MenuItem>
                  <MenuItem value="Advanced">Advanced</MenuItem>
                  <MenuItem value="Professional">Professional</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Team Logo</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="team-logo-upload"
                  type="file"
                  onChange={handleImageChange}
                  disabled={imageLoading}
                />
                <label htmlFor="team-logo-upload">
                  <Button 
                    variant="outlined" 
                    component="span"
                    startIcon={imageLoading ? <CircularProgress size={20} /> : <CloudUpload />}
                    sx={{ mb: 2 }}
                    disabled={imageLoading}
                  >
                    {imageLoading ? 'Processing...' : 'Upload Logo'}
                  </Button>
                </label>
                {imagePreview && (
                  <Box mt={2} sx={{ width: '100%' }}>
                    <img 
                      src={imagePreview} 
                      alt="Team logo preview" 
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
                  ? (submitting ? 'Updating...' : 'Update Team') 
                  : (submitting ? 'Creating...' : 'Create Team')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default TeamForm; 