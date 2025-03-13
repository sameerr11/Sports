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
      upcomingBookings: 0,
      totalTeams: 0,
      activeTournaments: 0
    },
    upcomingBookings: [],
    recentActivity: [],
    userTeams: []
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

  const getActivityIcon = (type) => {
    switch(type) {
      case 'booking':
        return <Event sx={{ color: theme.palette.primary.main }} />;
      case 'team':
        return <People sx={{ color: theme.palette.success.main }} />;
      case 'tournament':
        return <EmojiEvents sx={{ color: theme.palette.warning.main }} />;
      case 'court':
        return <LocationOn sx={{ color: theme.palette.error.main }} />;
      default:
        return <Event />;
    }
  };

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

  const { stats, upcomingBookings, recentActivity, userTeams } = dashboardData;

  return (
    <Box className="dashboard-container">
      <Box className="dashboard-welcome">
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.firstName || 'User'}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Here's what's happening with your sports activities
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} className="dashboard-stats">
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} className="stats-card">
            <Box className="stats-card-content">
              <Box>
                <Typography variant="h6" color="text.secondary">Total Bookings</Typography>
                <Typography variant="h4">{stats.totalBookings}</Typography>
              </Box>
              <Avatar className="stats-icon booking-icon">
                <Event />
              </Avatar>
            </Box>
            <Box className="stats-footer">
              <Typography variant="body2" color="success.main" display="flex" alignItems="center">
                <ArrowUpward fontSize="small" /> 12% increase
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} className="stats-card">
            <Box className="stats-card-content">
              <Box>
                <Typography variant="h6" color="text.secondary">Upcoming Bookings</Typography>
                <Typography variant="h4">{stats.upcomingBookings}</Typography>
              </Box>
              <Avatar className="stats-icon upcoming-icon">
                <AccessTime />
              </Avatar>
            </Box>
            <Box className="stats-footer">
              <Typography variant="body2" color="success.main" display="flex" alignItems="center">
                <ArrowUpward fontSize="small" /> 5% increase
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} className="stats-card">
            <Box className="stats-card-content">
              <Box>
                <Typography variant="h6" color="text.secondary">My Teams</Typography>
                <Typography variant="h4">{stats.totalTeams}</Typography>
              </Box>
              <Avatar className="stats-icon team-icon">
                <SportsSoccer />
              </Avatar>
            </Box>
            <Box className="stats-footer">
              <Typography variant="body2" color="success.main" display="flex" alignItems="center">
                <ArrowUpward fontSize="small" /> 8% growth
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} className="stats-card">
            <Box className="stats-card-content">
              <Box>
                <Typography variant="h6" color="text.secondary">Active Tournaments</Typography>
                <Typography variant="h4">{stats.activeTournaments}</Typography>
              </Box>
              <Avatar className="stats-icon tournament-icon">
                <EmojiEvents />
              </Avatar>
            </Box>
            <Box className="stats-footer">
              <Typography variant="body2" color="error.main" display="flex" alignItems="center">
                <ArrowDownward fontSize="small" /> 3% decrease
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Dashboard Content */}
      <Grid container spacing={3} className="dashboard-content">
        {/* Upcoming Bookings */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} className="dashboard-card">
            <CardHeader
              title="Upcoming Bookings"
              action={
                <IconButton aria-label="settings">
                  <MoreVert />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <Typography variant="body1" align="center" sx={{ py: 2 }}>
                  No upcoming bookings found
                </Typography>
              ) : (
                <List>
                  {upcomingBookings.map((booking) => (
                    <React.Fragment key={booking._id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar className="booking-avatar">
                            <Event />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={booking.court?.name || 'Court'}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {formatDate(booking.startTime)} at {formatTime(booking.startTime)}
                              </Typography>
                              {` — ${booking.purpose || 'Practice'}`}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button 
                  component={Link} 
                  to="/bookings/me" 
                  variant="outlined" 
                  color="primary"
                >
                  View All Bookings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} className="dashboard-card">
            <CardHeader
              title="Recent Activity"
              action={
                <IconButton aria-label="settings">
                  <MoreVert />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              {recentActivity.length === 0 ? (
                <Typography variant="body1" align="center" sx={{ py: 2 }}>
                  No recent activity found
                </Typography>
              ) : (
                <List>
                  {recentActivity.map((activity) => (
                    <React.Fragment key={activity.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar className="activity-avatar">
                            {getActivityIcon(activity.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.title}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {activity.description}
                              </Typography>
                              {` — ${activity.time}`}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* My Teams */}
        <Grid item xs={12}>
          <Card elevation={3} className="dashboard-card">
            <CardHeader
              title="My Teams"
              action={
                <IconButton aria-label="settings">
                  <MoreVert />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              {userTeams.length === 0 ? (
                <Typography variant="body1" align="center" sx={{ py: 2 }}>
                  You are not a member of any teams
                </Typography>
              ) : (
                <Grid container spacing={3}>
                  {userTeams.map((team) => (
                    <Grid item xs={12} sm={6} md={4} key={team._id}>
                      <Paper elevation={2} className="team-card">
                        <Box className="team-card-header">
                          <Typography variant="h6">{team.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{team.sportType}</Typography>
                        </Box>
                        <Box className="team-card-content">
                          <Box className="team-stat">
                            <Typography variant="body2" color="text.secondary">Members</Typography>
                            <Typography variant="h6">{team.players?.length || 0}</Typography>
                          </Box>
                          <Box className="team-stat">
                            <Typography variant="body2" color="text.secondary">Wins</Typography>
                            <Typography variant="h6" color="success.main">{team.wins || 0}</Typography>
                          </Box>
                          <Box className="team-stat">
                            <Typography variant="body2" color="text.secondary">Losses</Typography>
                            <Typography variant="h6" color="error.main">{team.losses || 0}</Typography>
                          </Box>
                        </Box>
                        <Box className="team-card-footer">
                          <Button 
                            component={Link} 
                            to={`/teams/${team._id}`} 
                            variant="outlined" 
                            size="small" 
                            fullWidth
                          >
                            View Team
                          </Button>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button 
                  component={Link} 
                  to="/teams" 
                  variant="contained" 
                  color="primary"
                >
                  View All Teams
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Team Scheduling Section for Supervisors */}
        {supervisor && (
          <Grid container spacing={3} className="dashboard-content">
            <Grid item xs={12}>
              <Card elevation={3} className="dashboard-card">
                <CardHeader
                  title="Team Training & Match Scheduling"
                  action={
                    <Button 
                      component={Link} 
                      to="/teams/schedule" 
                      variant="contained" 
                      color="primary"
                      startIcon={<Event />}
                    >
                      Manage Schedules
                    </Button>
                  }
                />
                <Divider />
                <CardContent>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 2, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        width: 200,
                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                      }}
                    >
                      {userTeams.length > 0 && userTeams[0].sportType ? 
                        React.cloneElement(getSportIcon(userTeams[0].sportType), { 
                          sx: { fontSize: 40, color: theme.palette.primary.main, mb: 1 } 
                        }) : 
                        <FitnessCenter sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
                      }
                      <Typography variant="h6" gutterBottom>Schedule Training</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                        Plan team training sessions
                      </Typography>
                      <Button 
                        component={Link} 
                        to="/teams/schedule" 
                        variant="outlined" 
                        color="primary" 
                        size="small"
                      >
                        Schedule
                      </Button>
                    </Paper>
                    
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 2, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        width: 200,
                        bgcolor: alpha(theme.palette.secondary.main, 0.1)
                      }}
                    >
                      {userTeams.length > 0 && userTeams[0].sportType ? 
                        React.cloneElement(getSportIcon(userTeams[0].sportType), { 
                          sx: { fontSize: 40, color: theme.palette.secondary.main, mb: 1 } 
                        }) : 
                        <SportsScore sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 1 }} />
                      }
                      <Typography variant="h6" gutterBottom>Schedule Matches</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                        Plan team matches and events
                      </Typography>
                      <Button 
                        component={Link} 
                        to="/teams/schedule" 
                        variant="outlined" 
                        color="secondary" 
                        size="small"
                      >
                        Schedule
                      </Button>
                    </Paper>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard; 