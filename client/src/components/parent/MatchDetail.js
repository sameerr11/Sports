import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Grid, Paper, Chip, Divider,
  Card, CardContent, Alert, CircularProgress, useTheme, alpha
} from '@mui/material';
import { 
  ArrowBack, SportsSoccer, AccessTime, LocationOn, Event, Group, Notes
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../services/api';

const MatchDetail = () => {
  const { id } = useParams();
  const theme = useTheme();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        const response = await api.get(`/bookings/${id}`);
        setMatch(response.data);
      } catch (err) {
        console.error('Error fetching match data:', err);
        setError('Failed to load match details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!match) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Match not found.
      </Alert>
    );
  }

  const formatLocation = (court) => {
    if (!court) return 'Location not specified';
    return `${court.name}, ${court.location || 'No specific location'}`;
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 3, pb: 5 }}>
      <Box sx={{ mb: 3 }}>
        <Button 
          component={Link} 
          to="/parent" 
          startIcon={<ArrowBack />} 
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Match Details
        </Typography>
      </Box>

      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 2,
          background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.background.paper, 0.05)})`,
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SportsSoccer sx={{ fontSize: 32, mr: 2, color: theme.palette.primary.main }} />
              <Typography variant="h5" component="h2">
                {match.team ? match.team.name : 'No Team'} Match
              </Typography>
              <Chip 
                label={match.status} 
                color={
                  match.status === 'Confirmed' ? 'success' : 
                  match.status === 'Cancelled' ? 'error' : 'primary'
                }
                size="small" 
                sx={{ ml: 2 }} 
              />
            </Box>
            <Divider sx={{ mb: 3 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ mb: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Event sx={{ mr: 1 }} /> Date & Time
                </Typography>
                <Box sx={{ mb: 2, pl: 4 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {format(new Date(match.startTime), 'EEEE, MMMM d, yyyy')}
                  </Typography>
                  <Typography variant="body1">
                    <AccessTime sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                    {format(new Date(match.startTime), 'h:mm a')} - {format(new Date(match.endTime), 'h:mm a')}
                  </Typography>
                </Box>

                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
                  <LocationOn sx={{ mr: 1 }} /> Location
                </Typography>
                <Box sx={{ mb: 2, pl: 4 }}>
                  <Typography variant="body1">
                    {match.court ? (
                      <>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {match.court.name}
                        </Typography>
                        <Typography variant="body1">
                          {match.court.location}
                        </Typography>
                      </>
                    ) : (
                      'Location not specified'
                    )}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ mb: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Group sx={{ mr: 1 }} /> Team Information
                </Typography>
                <Box sx={{ mb: 2, pl: 4 }}>
                  {match.team ? (
                    <>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {match.team.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Sport: {match.team.sportType}
                      </Typography>
                      {match.team.description && (
                        <Typography variant="body2" paragraph>
                          {match.team.description}
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant="body1">
                      No team information available
                    </Typography>
                  )}
                </Box>

                {match.notes && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
                      <Notes sx={{ mr: 1 }} /> Notes
                    </Typography>
                    <Box sx={{ pl: 4 }}>
                      <Typography variant="body1">
                        {match.notes}
                      </Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default MatchDetail; 