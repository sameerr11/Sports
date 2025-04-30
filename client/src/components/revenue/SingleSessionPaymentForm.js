import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import { getRegistrationFees } from '../../services/registrationService';
import { addRevenueTransaction } from '../../services/revenueService';
import { getSingleSessionFees } from '../../services/singleSessionFeeService';
import { isAdmin } from '../../services/authService';
import RefreshIcon from '@mui/icons-material/Refresh';

const SingleSessionPaymentForm = () => {
  const [loading, setLoading] = useState(false);
  const [feesLoading, setFeesLoading] = useState(false);
  const [singleSessionFees, setSingleSessionFees] = useState([]);
  const [feeInfo, setFeeInfo] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const sportOptions = ['Basketball', 'Football', 'Volleyball', 'Self Defense', 'Karate', 'Gymnastics', 'Gym', 'Zumba', 'Swimming', 'Ping Pong'];

  const [formData, setFormData] = useState({
    visitorName: '',
    visitorEmail: '',
    visitorPhone: '',
    sport: '',
    amount: '',
    paymentMethod: 'Cash',
    notes: ''
  });

  useEffect(() => {
    fetchSingleSessionFees();
  }, []);

  const fetchSingleSessionFees = async () => {
    try {
      setFeesLoading(true);
      const fees = await getSingleSessionFees();
      setSingleSessionFees(fees);
    } catch (error) {
      console.error('Error fetching single session fees:', error);
      showSnackbar('Failed to load single session fees', 'error');
    } finally {
      setFeesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prevState => {
      const newState = { ...prevState, [name]: value };
      
      // If sport has changed, try to update the fee amount
      if (name === 'sport' && value) {
        updateFeeAmount(value, newState);
      }
      
      return newState;
    });
  };

  const updateFeeAmount = (sportValue, formState) => {
    if (!sportValue) {
      setFeeInfo(null);
      return;
    }
    
    setFeesLoading(true);
    
    try {
      // Find the configured single session fee for this sport
      const matchingFee = singleSessionFees.find(
        fee => fee.sportType === sportValue && fee.isActive
      );
      
      if (matchingFee) {
        // Directly update the formData state instead of relying on the formState parameter
        setFormData(prevState => ({
          ...prevState,
          amount: matchingFee.amount
        }));
        
        // Set fee info for display
        setFeeInfo({
          sport: sportValue,
          amount: matchingFee.amount
        });
      } else {
        // If no fee is configured, leave it blank for manual entry
        setFormData(prevState => ({
          ...prevState,
          amount: ''
        }));
        
        // Clear fee info
        setFeeInfo(null);
        
        // Show warning in snackbar
        showSnackbar(`No fee configuration found for ${sportValue}. Please set manually.`, 'warning');
      }
    } catch (error) {
      console.error('Error finding fee:', error);
      setFeeInfo(null);
    } finally {
      setFeesLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.visitorName || !formData.sport || !formData.amount) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create revenue transaction
      const transactionData = {
        amount: parseFloat(formData.amount),
        sourceType: 'Registration', // Using existing source type
        description: `Single session payment: ${formData.sport} - ${formData.visitorName}`,
        date: new Date().toISOString().split('T')[0],
        notes: `Visitor: ${formData.visitorName}\nEmail: ${formData.visitorEmail}\nPhone: ${formData.visitorPhone}\nPayment Method: ${formData.paymentMethod}\n${formData.notes}`
      };
      
      await addRevenueTransaction(transactionData);
      
      // Reset form
      setFormData({
        visitorName: '',
        visitorEmail: '',
        visitorPhone: '',
        sport: '',
        amount: '',
        paymentMethod: 'Cash',
        notes: ''
      });
      
      showSnackbar('Single session payment recorded successfully', 'success');
    } catch (error) {
      console.error('Error submitting payment:', error);
      showSnackbar('Failed to record payment. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const needsReset = feeInfo && Number(formData.amount) !== feeInfo.amount;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Single Session Payment
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Record payments for visitors participating in a single session/day
      </Typography>
      
      {isAdmin() && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
        >
          You can configure single session fees in the{' '}
          <a href="/admin/single-session-fees" style={{ color: 'inherit', fontWeight: 'bold' }}>
            Single Session Fees
          </a>{' '}
          page.
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>
            Visitor Information
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Visitor Name"
                name="visitorName"
                value={formData.visitorName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="visitorEmail"
                type="email"
                value={formData.visitorEmail}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="visitorPhone"
                value={formData.visitorPhone}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Session Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="sport-label">Sport</InputLabel>
                <Select
                  labelId="sport-label"
                  name="sport"
                  value={formData.sport}
                  onChange={handleChange}
                  label="Sport"
                >
                  {sportOptions.map(sport => (
                    <MenuItem key={sport} value={sport}>{sport}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Amount ($)"
                name="amount"
                type="number"
                InputProps={{ 
                  inputProps: { min: 0, step: "0.01" },
                  endAdornment: (
                    <>
                      {feesLoading && <CircularProgress size={20} />}
                      {needsReset && (
                        <InputAdornment position="end">
                          <Tooltip title={`Reset to standard fee: $${feeInfo.amount}`}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  amount: feeInfo.amount
                                }));
                              }}
                            >
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      )}
                    </>
                  )
                }}
                value={formData.amount}
                onChange={handleChange}
                helperText={feeInfo ? `Standard fee for ${feeInfo.sport}: $${feeInfo.amount}` : "Amount will auto-populate when a sport is selected"}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="payment-method-label">Payment Method</InputLabel>
                <Select
                  labelId="payment-method-label"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  label="Payment Method"
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Card">Card</MenuItem>
                  <MenuItem value="BankTransfer">Bank Transfer</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional information about this visitor or session"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              sx={{ minWidth: 150 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Record Payment'}
            </Button>
          </Box>
        </form>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SingleSessionPaymentForm; 