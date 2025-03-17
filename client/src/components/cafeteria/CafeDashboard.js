import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Alert
} from '@mui/material';
import { formatCurrency } from '../../utils/format';
import { format } from 'date-fns';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const CafeDashboard = () => {
  const [sessionSummaries, setSessionSummaries] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgSessionRevenue, setAvgSessionRevenue] = useState(0);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [changePinOpen, setChangePinOpen] = useState(false);

  useEffect(() => {
    // Load session summaries from localStorage
    const summaries = JSON.parse(localStorage.getItem('cafeSessionSummaries') || '[]');
    setSessionSummaries(summaries);

    // Calculate totals and averages
    if (summaries.length > 0) {
      const total = summaries.reduce((sum, session) => sum + session.totalSales, 0);
      setTotalRevenue(total);
      setAvgSessionRevenue(total / summaries.length);
    }
    
    // Load current PIN
    const storedPin = localStorage.getItem('cafePIN');
    if (storedPin) {
      setCurrentPin(storedPin);
    }
  }, []);

  // Format date and time for display
  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return format(new Date(isoString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Calculate session duration in hours and minutes
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end - start;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${diffHrs}h ${diffMins}m`;
    } catch (error) {
      return 'Invalid time';
    }
  };

  const handleSavePin = () => {
    // Validate PIN
    if (!newPin || newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    
    // Save PIN to localStorage
    localStorage.setItem('cafePIN', newPin);
    setCurrentPin(newPin);
    setPinError('');
    setPinSuccess('PIN updated successfully');
    
    // Reset fields
    setNewPin('');
    setConfirmPin('');
    setChangePinOpen(false);
    
    // Clear success message after a few seconds
    setTimeout(() => {
      setPinSuccess('');
    }, 3000);
  };

  const handleToggleShowPin = () => {
    setShowPin(!showPin);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Cafe Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Sessions
              </Typography>
              <Typography variant="h4">
                {sessionSummaries.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4">
                {formatCurrency(totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg. Revenue per Session
              </Typography>
              <Typography variant="h4">
                {formatCurrency(avgSessionRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Cashier PIN
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  {currentPin ? '••••' : 'Not Set'}
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary"
                  size="small"
                  onClick={() => setChangePinOpen(true)}
                >
                  {currentPin ? 'Change' : 'Set PIN'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {pinSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {pinSuccess}
        </Alert>
      )}

      <Typography variant="h5" gutterBottom>
        Session History
      </Typography>
      
      {sessionSummaries.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No session summaries available yet.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Starting Balance</TableCell>
                <TableCell>Sales</TableCell>
                <TableCell>Final Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessionSummaries.map((session, index) => (
                <TableRow key={index}>
                  <TableCell>{session.date}</TableCell>
                  <TableCell>{formatDateTime(session.startTime)}</TableCell>
                  <TableCell>{formatDateTime(session.endTime)}</TableCell>
                  <TableCell>{calculateDuration(session.startTime, session.endTime)}</TableCell>
                  <TableCell>{formatCurrency(session.startingBalance)}</TableCell>
                  <TableCell>{formatCurrency(session.totalSales)}</TableCell>
                  <TableCell>{formatCurrency(session.finalBalance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 3, textAlign: 'right' }}>
        <Button 
          variant="outlined" 
          color="secondary"
          onClick={() => {
            if (window.confirm('Are you sure you want to clear all session history?')) {
              localStorage.removeItem('cafeSessionSummaries');
              setSessionSummaries([]);
              setTotalRevenue(0);
              setAvgSessionRevenue(0);
            }
          }}
        >
          Clear History
        </Button>
      </Box>

      {/* Change PIN Dialog */}
      <Dialog open={changePinOpen} onClose={() => setChangePinOpen(false)}>
        <DialogTitle>
          {currentPin ? 'Change Cashier PIN' : 'Set Cashier PIN'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ width: '300px', pt: 1 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              This PIN will be required for cashiers to start a session
            </Typography>
            
            <TextField
              fullWidth
              margin="normal"
              label="New PIN"
              type={showPin ? 'text' : 'password'}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
              error={!!pinError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleToggleShowPin}
                      edge="end"
                    >
                      {showPin ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Confirm PIN"
              type={showPin ? 'text' : 'password'}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
              error={!!pinError}
              helperText={pinError}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePinOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePin} variant="contained" color="primary">
            Save PIN
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CafeDashboard; 