import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Alert, CircularProgress 
} from '@mui/material';
import { getStoredUser } from '../../services/authService';
import { getAllUsers } from '../../services/userService';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlayers();
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

  return (
    <Box sx={{ padding: 2 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {displayName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This dashboard provides access to player information and documents.
        </Typography>
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