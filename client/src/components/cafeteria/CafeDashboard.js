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
  Alert,
  CircularProgress,
  Pagination
} from '@mui/material';
import { formatCurrency } from '../../utils/format';
import { format } from 'date-fns';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { getSetting, updateSetting, getSessionSummaries } from '../../services/cafeteriaService';

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
  const [loadingPin, setLoadingPin] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Load PIN from database
    fetchPin();
    // Load session summaries from database
    fetchSessionSummaries();
  }, []);

  const fetchSessionSummaries = async (pageNumber = 1) => {
    try {
      setLoadingSummaries(true);
      setSummaryError('');
      
      const result = await getSessionSummaries({ page: pageNumber, limit: 10 });
      
      if (result && result.sessions) {
        setSessionSummaries(result.sessions);
        
        if (result.pagination) {
          setPage(result.pagination.page);
          setTotalPages(result.pagination.pages);
        }
        
        // Calculate totals
        if (result.sessions.length > 0) {
          const total = result.sessions.reduce((sum, session) => sum + session.totalSales, 0);
          setTotalRevenue(total);
          setAvgSessionRevenue(total / result.sessions.length);
        } else {
          setTotalRevenue(0);
          setAvgSessionRevenue(0);
        }
      }
    } catch (error) {
      console.error('Error fetching session summaries:', error);
      setSummaryError('Failed to load session summaries. Please try again.');
    } finally {
      setLoadingSummaries(false);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchSessionSummaries(value);
  };

  const fetchPin = async () => {
    try {
      setLoadingPin(true);
      const result = await getSetting('cashierPIN');
      if (result.exists) {
        setCurrentPin(result.value);
      }
    } catch (error) {
      console.error('Error loading PIN:', error);
    } finally {
      setLoadingPin(false);
    }
  };

  // Format date and time for display
  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return format(new Date(isoString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Format date only
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return format(new Date(isoString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Format time only
  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return format(new Date(isoString), 'h:mm a');
    } catch (error) {
      return 'Invalid time';
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

  const handleSavePin = async () => {
    // Validate PIN
    if (!newPin || newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    
    try {
      setSavingPin(true);
      // Save PIN to database
      await updateSetting('cashierPIN', newPin);
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
    } catch (error) {
      setPinError('Failed to update PIN: ' + error.message);
    } finally {
      setSavingPin(false);
    }
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
              {loadingPin ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
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
              )}
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
      
      {loadingSummaries ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : summaryError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {summaryError}
        </Alert>
      ) : sessionSummaries.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No session summaries available yet.
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Cashier</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Starting Balance</TableCell>
                  <TableCell>Sales</TableCell>
                  <TableCell>Final Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessionSummaries.map((session) => (
                  <TableRow key={session._id}>
                    <TableCell>{formatDate(session.date)}</TableCell>
                    <TableCell>
                      {session.cashier ? 
                        (session.cashier.firstName && session.cashier.lastName ? 
                          `${session.cashier.firstName} ${session.cashier.lastName}` : 
                          (session.cashier.name || 'Unknown')
                        ) : 'Unknown'
                      }
                    </TableCell>
                    <TableCell>{formatTime(session.startTime)}</TableCell>
                    <TableCell>{formatTime(session.endTime)}</TableCell>
                    <TableCell>{formatCurrency(session.startingBalance)}</TableCell>
                    <TableCell>{formatCurrency(session.totalSales)}</TableCell>
                    <TableCell>{formatCurrency(session.finalBalance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </>
      )}

      <Box sx={{ mt: 3, textAlign: 'right' }}>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={() => fetchSessionSummaries(1)}
          sx={{ mr: 2 }}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Change PIN Dialog */}
      <Dialog open={changePinOpen} onClose={() => !savingPin && setChangePinOpen(false)}>
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
              disabled={savingPin}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleToggleShowPin}
                      edge="end"
                      disabled={savingPin}
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
              disabled={savingPin}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePinOpen(false)} disabled={savingPin}>Cancel</Button>
          <Button 
            onClick={handleSavePin}
            variant="contained"
            color="primary"
            disabled={savingPin}
          >
            {savingPin ? <CircularProgress size={24} /> : 'Save PIN'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CafeDashboard; 