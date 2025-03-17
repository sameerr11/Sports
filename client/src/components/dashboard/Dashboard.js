import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  Avatar, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Divider,
  Button,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import { 
  SportsSoccer, 
  LocationOn, 
  Event, 
  EmojiEvents, 
  MoreVert, 
  ArrowUpward, 
  ArrowDownward,
  People,
  AccessTime,
  FitnessCenter,
  SportsScore
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { getStoredUser, isSupervisor } from '../../services/authService';
import { getDashboardData } from '../../services/dashboardService';
import { getSportIcon } from '../../utils/sportIcons';
import './Dashboard.css';

// Removed mock data as we'll use real data from the API

const Dashboard = () => {
  const theme = useTheme();
  const user = getStoredUser();
  const supervisor = isSupervisor();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalBookings: 0,
      upcomingBookings: 0
    },
    upcomingBookings: []
  });
  
  // Fetch real data from the API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Show loading state while fetching data
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading dashboard data...</Typography>
      </Box>
    );
  }

  // Show error message if data fetch failed
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" color="error">{error}</Typography>
        <Button
          onClick={() => window.location.reload()}
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  const { stats, upcomingBookings } = dashboardData;

  return (
    <Box className="dashboard-container" sx={{ px: { xs: 2, sm: 4 }, py: 4, bgcolor: '#f8f9fa' }}>
      <Box className="dashboard-welcome" sx={{ mb: 5 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            fontWeight: 800, 
            color: theme.palette.primary.dark,
            mb: 1,
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 80,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.palette.primary.main
            }
          }}
        >
          Welcome back, {user?.firstName || 'User'}!
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary" 
          sx={{ 
            fontSize: '1.1rem', 
            maxWidth: '800px',
            mt: 2 
          }}
        >
          Here's what's happening with your sports activities
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={4} className="dashboard-stats" sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6}>
          <Paper 
            elevation={0} 
            className="stats-card" 
            sx={{
              p: 3,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.3)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -10,
                right: -10,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: alpha(theme.palette.primary.light, 0.2),
                zIndex: 0
              }
            }}
          >
            <Box className="stats-card-content" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.dark, mb: 1.5, letterSpacing: 0.5 }}>Total Bookings</Typography>
                <Typography variant="h2" sx={{ fontWeight: 700, color: theme.palette.primary.dark, letterSpacing: -1 }}>{stats.totalBookings}</Typography>
              </Box>
              <Avatar 
                className="stats-icon booking-icon" 
                sx={{ 
                  width: 70, 
                  height: 70, 
                  bgcolor: alpha(theme.palette.primary.main, 0.2), 
                  color: theme.palette.primary.dark,
                  boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`
                }}
              >
                <Event sx={{ fontSize: 34 }} />
              </Avatar>
            </Box>
            <Box className="stats-footer" sx={{ mt: 2.5, pt: 2, borderTop: `1px dashed ${alpha(theme.palette.primary.dark, 0.15)}`, position: 'relative', zIndex: 1 }}>
              <Typography variant="body2" color="primary.dark" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <ArrowUpward fontSize="small" sx={{ mr: 0.5 }} /> 12% increase from last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Paper 
            elevation={0} 
            className="stats-card" 
            sx={{
              p: 3,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.3)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -10,
                right: -10,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: alpha(theme.palette.secondary.light, 0.2),
                zIndex: 0
              }
            }}
          >
            <Box className="stats-card-content" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.secondary.dark, mb: 1.5, letterSpacing: 0.5 }}>Upcoming Bookings</Typography>
                <Typography variant="h2" sx={{ fontWeight: 700, color: theme.palette.secondary.dark, letterSpacing: -1 }}>{stats.upcomingBookings}</Typography>
              </Box>
              <Avatar 
                className="stats-icon upcoming-icon" 
                sx={{ 
                  width: 70, 
                  height: 70, 
                  bgcolor: alpha(theme.palette.secondary.main, 0.2), 
                  color: theme.palette.secondary.dark,
                  boxShadow: `0 8px 16px ${alpha(theme.palette.secondary.main, 0.2)}`
                }}
              >
                <AccessTime sx={{ fontSize: 34 }} />
              </Avatar>
            </Box>
            <Box className="stats-footer" sx={{ mt: 2.5, pt: 2, borderTop: `1px dashed ${alpha(theme.palette.secondary.dark, 0.15)}`, position: 'relative', zIndex: 1 }}>
              <Typography variant="body2" color="secondary.dark" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <ArrowUpward fontSize="small" sx={{ mr: 0.5 }} /> 5% increase from last month
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Dashboard Content */}
      <Grid container spacing={4} className="dashboard-content">
        {/* Upcoming Bookings */}
        <Grid item xs={12}>
          <Card 
            elevation={0} 
            className="dashboard-card" 
            sx={{ 
              borderRadius: 3, 
              overflow: 'hidden',
              border: `1px solid ${alpha(theme.palette.grey[300], 0.7)}`,
              boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.06)}`,
              background: 'white'
            }}
          >
            <CardHeader
              title={
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center',
                    color: theme.palette.grey[800]
                  }}
                >
                  <Event sx={{ mr: 1.5, color: theme.palette.primary.main }} /> 
                  Upcoming Bookings
                </Typography>
              }
              action={
                <Button 
                  component={Link} 
                  to="/bookings/me" 
                  variant="contained" 
                  color="primary"
                  size="small"
                  endIcon={<ArrowUpward />}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2
                  }}
                >
                  View All
                </Button>
              }
              sx={{ px: 3, pt: 3, pb: 2 }}
            />
            <Divider sx={{ mx: 3 }} />
            <CardContent sx={{ p: 0 }}>
              {upcomingBookings.length === 0 ? (
                <Box className="empty-state" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, px: 2 }}>
                  <Avatar sx={{ width: 90, height: 90, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <Event sx={{ fontSize: 50, color: theme.palette.grey[500] }} />
                  </Avatar>
                  <Typography variant="h5" sx={{ color: theme.palette.grey[800], fontWeight: 600, mb: 1 }}>
                    No upcoming bookings found
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center', maxWidth: 500 }}>
                    Book a court or facility to see your upcoming reservations here
                  </Typography>
                  <Button 
                    component={Link}
                    to="/bookings/new"
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<Event />}
                    sx={{ 
                      borderRadius: 2,
                      px: 4,
                      py: 1,
                      fontWeight: 600
                    }}
                  >
                    Book Now
                  </Button>
                </Box>
              ) : (
                <List sx={{ py: 1 }}>
                  {upcomingBookings.map((booking, index) => (
                    <React.Fragment key={booking._id}>
                      <ListItem 
                        alignItems="flex-start" 
                        sx={{ 
                          py: 2.5,
                          px: 3,
                          transition: 'all 0.2s ease',
                          '&:hover': { 
                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                            transform: 'translateX(4px)'
                          }
                        }}
                        button
                        component={Link}
                        to={`/bookings/${booking._id}`}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            className="booking-avatar" 
                            sx={{ 
                              width: 50,
                              height: 50,
                              bgcolor: alpha(theme.palette.primary.main, 0.15),
                              color: theme.palette.primary.main
                            }}
                          >
                            <Event sx={{ fontSize: 24 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.grey[800], mb: 0.5 }}>
                              {booking.court?.name || 'Court'}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <AccessTime sx={{ fontSize: 16, mr: 0.5, color: theme.palette.grey[600] }} />
                                <Typography component="span" variant="body2" sx={{ color: theme.palette.grey[700], fontWeight: 500 }}>
                                  {formatDate(booking.startTime)} at {formatTime(booking.startTime)}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ color: theme.palette.grey[600] }}>
                                {booking.purpose || 'Practice'}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < upcomingBookings.length - 1 && (
                        <Divider variant="inset" component="li" sx={{ ml: 9 }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Team Scheduling Section for Supervisors */}
        {supervisor && (
          <Grid item xs={12}>
            <Card 
              elevation={0} 
              className="dashboard-card" 
              sx={{ 
                borderRadius: 3, 
                overflow: 'hidden',
                border: `1px solid ${alpha(theme.palette.grey[300], 0.7)}`,
                boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.06)}`,
                background: 'white'
              }}
            >
              <CardHeader
                title={
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center',
                      color: theme.palette.grey[800]
                    }}
                  >
                    <SportsScore sx={{ mr: 1.5, color: theme.palette.secondary.main }} /> 
                    Team Training & Match Scheduling
                  </Typography>
                }
                action={
                  <Button 
                    component={Link} 
                    to="/teams/schedule" 
                    variant="contained" 
                    color="secondary"
                    size="small"
                    startIcon={<Event />}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 2
                    }}
                  >
                    Manage Schedules
                  </Button>
                }
                sx={{ px: 3, pt: 3, pb: 2 }}
              />
              <Divider sx={{ mx: 3 }} />
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', py: 3 }}>
                  <Paper 
                    elevation={0} 
                    className="scheduler-card" 
                    sx={{ 
                      p: 4, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      width: 280,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: `0 15px 30px ${alpha(theme.palette.primary.main, 0.15)}`,
                        transform: 'translateY(-8px)'
                      }
                    }}
                  >
                    <Avatar sx={{ 
                      width: 100, 
                      height: 100, 
                      mb: 3, 
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                      color: theme.palette.primary.main,
                      boxShadow: `0 10px 20px ${alpha(theme.palette.primary.main, 0.2)}`
                    }}>
                      <FitnessCenter sx={{ fontSize: 50 }} />
                    </Avatar>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: theme.palette.primary.dark }}>Schedule Training</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center', lineHeight: 1.6 }}>
                      Plan and organize team training sessions across facilities
                    </Typography>
                    <Button 
                      component={Link} 
                      to="/teams/schedule" 
                      variant="contained" 
                      color="primary" 
                      fullWidth
                      size="large"
                      sx={{ 
                        borderRadius: 2,
                        py: 1.2,
                        fontWeight: 600,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`
                      }}
                    >
                      Schedule Training
                    </Button>
                  </Paper>
                  
                  <Paper 
                    elevation={0} 
                    className="scheduler-card" 
                    sx={{ 
                      p: 4, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      width: 280,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.12)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: `0 15px 30px ${alpha(theme.palette.secondary.main, 0.15)}`,
                        transform: 'translateY(-8px)'
                      }
                    }}
                  >
                    <Avatar sx={{ 
                      width: 100, 
                      height: 100, 
                      mb: 3, 
                      bgcolor: alpha(theme.palette.secondary.main, 0.15),
                      color: theme.palette.secondary.main,
                      boxShadow: `0 10px 20px ${alpha(theme.palette.secondary.main, 0.2)}`
                    }}>
                      <SportsScore sx={{ fontSize: 50 }} />
                    </Avatar>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: theme.palette.secondary.dark }}>Schedule Matches</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center', lineHeight: 1.6 }}>
                      Create and manage team matches, tournaments, and events
                    </Typography>
                    <Button 
                      component={Link} 
                      to="/teams/schedule" 
                      variant="contained" 
                      color="secondary" 
                      fullWidth
                      size="large"
                      sx={{ 
                        borderRadius: 2,
                        py: 1.2,
                        fontWeight: 600,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.secondary.main, 0.2)}`
                      }}
                    >
                      Schedule Matches
                    </Button>
                  </Paper>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard; 