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
  Divider
} from '@mui/material';
import { getRegistrationFees } from '../../services/registrationService';
import { addRevenueTransaction } from '../../services/revenueService';
import { isAdmin } from '../../services/authService';

const SingleSessionPaymentForm = () => {
  const [loading, setLoading] = useState(false);
  const [feesLoading, setFeesLoading] = useState(false);
  const [registrationFees, setRegistrationFees] = useState([]);
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
    fetchRegistrationFees();
  }, []);

  const fetchRegistrationFees = async () => {
    try {
      setFeesLoading(true);
      const fees = await getRegistrationFees();
      setRegistrationFees(fees);
    } catch (error) {
      console.error('Error fetching registration fees:', error);
      showSnackbar('Failed to load registration fees', 'error');
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
    if (!sportValue) return;
    
    setFeesLoading(true);
    
    try {
      // Find fee for this sport with "1 Month" period as a base reference
      // This is arbitrary - we'll divide by 30 to get a daily rate
      const matchingFee = registrationFees.find(
        fee => fee.sportType === sportValue && 
              fee.period === '1 Month' && 
              fee.isActive
      );
      
      if (matchingFee) {
        // Calculate single session fee as 1/30 of the monthly fee with a minimum
        const singleSessionFee = Math.max(5, Math.round(matchingFee.amount / 30));
        
        setFormData({
          ...formState,
          amount: singleSessionFee
        });
        
        showSnackbar(`Single session fee for ${sportValue}: $${singleSessionFee}`, 'info');
      } else {
        showSnackbar(`No fee configuration found for ${sportValue}. Please set manually.`, 'warning');
      }
    } catch (error) {
      console.error('Error calculating fee:', error);
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Single Session Payment
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Record payments for visitors participating in a single session/day
      </Typography>
      
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
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
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
                  endAdornment: feesLoading && <CircularProgress size={20} />
                }}
                value={formData.amount}
                onChange={handleChange}
                helperText="Amount will auto-calculate based on selected sport"
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
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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