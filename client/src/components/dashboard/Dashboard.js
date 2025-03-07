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
  useTheme
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
  AccessTime
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { getStoredUser } from '../../services/authService';
import './Dashboard.css';

// Mock data - in a real app, you would fetch this from your API
const mockUpcomingBookings = [
  { id: 1, court: 'Tennis Court 1', date: '2025-03-08', time: '10:00 AM', type: 'Practice' },
  { id: 2, court: 'Basketball Court 3', date: '2025-03-09', time: '2:30 PM', type: 'Match' },
  { id: 3, court: 'Soccer Field 2', date: '2025-03-10', time: '4:00 PM', type: 'Tournament' }
];

const mockRecentActivity = [
  { id: 1, type: 'booking', title: 'New Booking', description: 'Tennis Court 1 booked for practice', time: '2 hours ago' },
  { id: 2, type: 'team', title: 'Team Update', description: 'New player added to Eagles team', time: '1 day ago' },
  { id: 3, type: 'tournament', title: 'Tournament Registration', description: 'Summer Championship registration open', time: '2 days ago' },
  { id: 4, type: 'court', title: 'Court Maintenance', description: 'Basketball Court 2 under maintenance', time: '3 days ago' }
];

const mockTeams = [
  { id: 1, name: 'Eagles', sport: 'Basketball', members: 12, wins: 8, losses: 2 },
  { id: 2, name: 'Tigers', sport: 'Soccer', members: 15, wins: 6, losses: 4 },
  { id: 3, name: 'Sharks', sport: 'Swimming', members: 8, wins: 10, losses: 0 }
];

const Dashboard = () => {
  const theme = useTheme();
  const user = getStoredUser();
  const [stats, setStats] = useState({
    totalBookings: 24,
    upcomingBookings: 3,
    totalTeams: 3,
    activeTournaments: 2
  });
  
  // In a real app, you would fetch this data from your API
  useEffect(() => {
    // Fetch dashboard data
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
              <List>
                {mockUpcomingBookings.map((booking) => (
                  <React.Fragment key={booking.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar className="booking-avatar">
                          <Event />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={booking.court}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {booking.date} at {booking.time}
                            </Typography>
                            {` — ${booking.type}`}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
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
              <List>
                {mockRecentActivity.map((activity) => (
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
              <Grid container spacing={3}>
                {mockTeams.map((team) => (
                  <Grid item xs={12} sm={6} md={4} key={team.id}>
                    <Paper elevation={2} className="team-card">
                      <Box className="team-card-header">
                        <Typography variant="h6">{team.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{team.sport}</Typography>
                      </Box>
                      <Box className="team-card-content">
                        <Box className="team-stat">
                          <Typography variant="body2" color="text.secondary">Members</Typography>
                          <Typography variant="h6">{team.members}</Typography>
                        </Box>
                        <Box className="team-stat">
                          <Typography variant="body2" color="text.secondary">Wins</Typography>
                          <Typography variant="h6" color="success.main">{team.wins}</Typography>
                        </Box>
                        <Box className="team-stat">
                          <Typography variant="body2" color="text.secondary">Losses</Typography>
                          <Typography variant="h6" color="error.main">{team.losses}</Typography>
                        </Box>
                      </Box>
                      <Box className="team-card-footer">
                        <Button 
                          component={Link} 
                          to={`/teams/${team.id}`} 
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
      </Grid>
    </Box>
  );
};

export default Dashboard; 