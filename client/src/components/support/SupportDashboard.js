import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Alert, CircularProgress,
  Button, Grid, Card, CardContent, CardActions
} from '@mui/material';
import { getStoredUser } from '../../services/authService';
import { getAllUsers } from '../../services/userService';
import { getRegistrations } from '../../services/registrationService';
import { Link } from 'react-router-dom';
import { 
  Description, 
  Assessment, 
  SportsSoccer, 
  FitnessCenter,
  HowToReg,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

// Add a helper function to format address objects
const formatAddress = (address) => {
  if (!address) return 'N/A';
  
  // If address is an object with address fields
  if (typeof address === 'object') {
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(address.zipCode);
    if (address.country) parts.push(address.country);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }
  
  // If address is already a string
  return address;
};

const SupportDashboard = () => {
  const user = getStoredUser();
  const displayName = user ? `${user.firstName}` : 'Support';
  
  const [players, setPlayers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [error, setError] = useState('');
  const [registrationsError, setRegistrationsError] = useState('');

  useEffect(() => {
    fetchPlayers();
    fetchRegistrations();
  }, []);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const users = await getAllUsers();
      // Filter only players
      const playerUsers = users.filter(user => user.role === 'player');
      setPlayers(playerUsers);
      setError('');
    } catch (err) {
      console.error('Error fetching players:', err);
      setError(err.message || 'Failed to load players. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    setRegistrationsLoading(true);
    try {
      const data = await getRegistrations();
      // Filter only pending registrations
      const pendingRegistrations = data.filter(reg => reg.status === 'Pending');
      setRegistrations(pendingRegistrations);
      setRegistrationsError('');
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setRegistrationsError(err.message || 'Failed to load registrations. Please try again.');
    } finally {
      setRegistrationsLoading(false);
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {displayName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This dashboard provides access to player information, registrations, and documents.
        </Typography>
      </Paper>
      
      {/* Quick Actions Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HowToReg sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Registrations</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Process pending player registrations and create accounts.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                component={Link} 
                to="/registrations" 
                color="primary"
              >
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Description sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Health Documents</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Manage health documents and certificates for players.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                component={Link} 
                to="/support/documents" 
                color="primary"
              >
                Manage Documents
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">Player Statistics</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Add and update player statistics, performance metrics, and skills by sport.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                component={Link} 
                to="/player-stats" 
                color="secondary"
              >
                Manage Stats
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarMonthIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Attendance Report</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Generate attendance reports for all teams to track player participation.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                component={Link} 
                to="/support/attendance-report" 
                color="info"
              >
                Generate Reports
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Broadcast</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Send notifications and announcements to users throughout the system.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                component={Link} 
                to="/admin/broadcast" 
                color="warning"
              >
                Send Notifications
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      {/* Pending Registrations Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Pending Registrations
        </Typography>
        
        {registrationsError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {registrationsError}
          </Alert>
        )}
        
        {registrationsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Player Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Sport(s)</TableCell>
                  <TableCell>Registration Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No pending registrations found
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((registration) => (
                    <TableRow key={registration._id}>
                      <TableCell>{`${registration.player.firstName} ${registration.player.lastName}`}</TableCell>
                      <TableCell>{registration.player.email}</TableCell>
                      <TableCell>{registration.sports.join(', ')}</TableCell>
                      <TableCell>{new Date(registration.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={registration.status}
                          color="warning"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          component={Link}
                          to={`/registrations/${registration._id}`}
                          variant="contained"
                          size="small"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Players Contact Information
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {players.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No players found
                    </TableCell>
                  </TableRow>
                ) : (
                  players.map((player) => (
                    <TableRow key={player._id}>
                      <TableCell>{`${player.firstName} ${player.lastName}`}</TableCell>
                      <TableCell>{player.email}</TableCell>
                      <TableCell>{player.phoneNumber || 'N/A'}</TableCell>
                      <TableCell>{formatAddress(player.address)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={player.isActive ? 'Active' : 'Inactive'} 
                          color={player.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default SupportDashboard; 