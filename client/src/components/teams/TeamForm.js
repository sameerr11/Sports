import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, TextField, Button, Grid, Paper,
  FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { createTeam, getTeamById, updateTeam } from '../../services/teamService';

const TeamForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    name: '',
    sportType: '',
    description: '',
    ageGroup: '',
    level: 'Beginner',
    logo: ''
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        if (isEditMode) {
          const team = await getTeamById(id);
          setFormData({
            name: team.name,
            sportType: team.sportType,
            description: team.description || '',
            ageGroup: team.ageGroup || '',
            level: team.level,
            logo: team.logo || ''
          });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
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
              <TextField
                required
                fullWidth
                label="Sport Type"
                name="sportType"
                value={formData.sportType}
                onChange={handleChange}
                placeholder="e.g. Soccer, Basketball, Tennis"
              />
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
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Team description, goals, achievements, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Logo URL"
                name="logo"
                value={formData.logo}
                onChange={handleChange}
                placeholder="https://example.com/logo.jpg"
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<Save />}
                size="large"
              >
                {isEditMode ? 'Update Team' : 'Create Team'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default TeamForm; 