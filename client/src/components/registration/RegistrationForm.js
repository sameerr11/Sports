import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText, 
  Checkbox, 
  ListItemText, 
  OutlinedInput, 
  Snackbar, 
  Alert, 
  Divider, 
  Box,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { createPlayerRegistration, getRegistrationFees } from '../../services/registrationService';
import { useAuth } from '../../contexts/AuthContext';

// Add a function to generate invoice number
const generateInvoiceNumber = () => {
  const prefix = 'REG';
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

const RegistrationForm = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, initialized } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [registrationFees, setRegistrationFees] = useState([]);

  // Debug auth state
  useEffect(() => {
    console.log("Auth state in RegistrationForm:", { user, authLoading, initialized });
  }, [user, authLoading, initialized]);

  // Redirect if not authenticated after auth is initialized
  useEffect(() => {
    // Only check authentication after auth context is fully initialized
    if (!initialized) return;
    
    if (!user) {
      console.log('User not authenticated after auth initialization, redirecting to login');
      setError('You must be logged in to create a registration');
      navigate('/login');
    }
  }, [user, initialized, navigate]);

  const [formData, setFormData] = useState({
    player: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      dateOfBirth: '',
      emergencyContact: {
        name: '',
        relation: '',
        phoneNumber: ''
      },
      healthNotes: ''
    },
    sports: [],
    registrationPeriod: '',
    startDate: new Date().toISOString().split('T')[0],
    fee: {
      amount: 0,
      currency: 'USD',
      paymentMethod: 'Cash',
      paymentStatus: 'Paid',
      receiptNumber: '',
      transactionId: '',
      invoiceNumber: generateInvoiceNumber()  // Add auto-generated invoice number
    },
    notes: ''
  });

  const sportOptions = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Others'];
  const periodOptions = ['1 Month', '3 Months', '6 Months', '1 Year'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleNestedChange = (e) => {
    const { name, value } = e.target;
    const [parent, child, subchild] = name.split('.');
    
    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent],
        [child]: {
          ...formData[parent][child],
          [subchild]: value
        }
      }
    });
  };

  const handleSportsChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      sports: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Additional check in case the user state changes during form fill
      if (!user) {
        console.log("User is not available at submit time:", { user });
        throw new Error('You must be logged in to create a registration');
      }
      
      console.log("User data for submission:", { 
        userId: user._id, 
        userRole: user.role
      });
      
      // Calculate endDate based on registration period
      let endDate = new Date(formData.startDate);
      switch(formData.registrationPeriod) {
        case '1 Month':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case '3 Months':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case '6 Months':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case '1 Year':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        default:
          endDate.setMonth(endDate.getMonth() + 1);
      }
      
      // Ensure the invoice number is set
      const updatedFee = {
        ...formData.fee,
        invoiceNumber: formData.fee.invoiceNumber || generateInvoiceNumber()
      };
      
      // Create a complete registration data object with explicit user ID
      const completeFormData = {
        ...formData,
        fee: updatedFee,
        endDate: endDate.toISOString().split('T')[0],
        registeredBy: user._id
      };
      
      console.log('Submitting registration data:', completeFormData);
      
      await createPlayerRegistration(completeFormData);
      setSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        navigate('/registrations');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      if (err.message === 'You must be logged in to create a registration') {
        // If auth error, redirect to login
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
      setError(err.response?.data?.msg || err.message || 'Failed to create registration');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state when checking authentication
  if (authLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Don't render the form if user is not authenticated
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Authentication Required
          </Typography>
          <Typography variant="body1">
            You must be logged in to create a registration. Redirecting to login page...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          New Player Registration
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>
            Player Information
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="First Name"
                name="player.firstName"
                value={formData.player.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                name="player.lastName"
                value={formData.player.lastName}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="email"
                label="Email"
                name="player.email"
                value={formData.player.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Phone Number"
                name="player.phoneNumber"
                value={formData.player.phoneNumber}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                name="player.address.street"
                value={formData.player.address.street}
                onChange={handleNestedChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="player.address.city"
                value={formData.player.address.city}
                onChange={handleNestedChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State/Province"
                name="player.address.state"
                value={formData.player.address.state}
                onChange={handleNestedChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postal/Zip Code"
                name="player.address.zipCode"
                value={formData.player.address.zipCode}
                onChange={handleNestedChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                name="player.address.country"
                value={formData.player.address.country}
                onChange={handleNestedChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Date of Birth"
                name="player.dateOfBirth"
                value={formData.player.dateOfBirth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Emergency Contact
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                name="player.emergencyContact.name"
                value={formData.player.emergencyContact.name}
                onChange={handleNestedChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Relationship"
                name="player.emergencyContact.relation"
                value={formData.player.emergencyContact.relation}
                onChange={handleNestedChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                name="player.emergencyContact.phoneNumber"
                value={formData.player.emergencyContact.phoneNumber}
                onChange={handleNestedChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Health Notes (allergies, medical conditions, etc.)"
                name="player.healthNotes"
                value={formData.player.healthNotes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Registration Details
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl required fullWidth>
                <InputLabel id="sports-label">Sports</InputLabel>
                <Select
                  labelId="sports-label"
                  multiple
                  value={formData.sports}
                  onChange={handleSportsChange}
                  input={<OutlinedInput label="Sports" />}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {sportOptions.map((sport) => (
                    <MenuItem key={sport} value={sport}>
                      <Checkbox checked={formData.sports.indexOf(sport) > -1} />
                      <ListItemText primary={sport} />
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select one or more sports</FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl required fullWidth>
                <InputLabel id="period-label">Registration Period</InputLabel>
                <Select
                  labelId="period-label"
                  name="registrationPeriod"
                  value={formData.registrationPeriod}
                  onChange={handleChange}
                  label="Registration Period"
                >
                  {periodOptions.map((period) => (
                    <MenuItem key={period} value={period}>
                      {period}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="date"
                label="Start Date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1, bgcolor: '#f5f5f5', mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Registration Fee
                </Typography>
                <TextField
                  fullWidth
                  required
                  type="number"
                  InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                  margin="normal"
                  label="Fee Amount"
                  name="fee.amount"
                  value={formData.fee.amount}
                  onChange={handleChange}
                />
              </Box>
            </Grid>
          </Grid>
          
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Payment Details
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Invoice Number"
                name="fee.invoiceNumber"
                value={formData.fee.invoiceNumber}
                InputProps={{
                  readOnly: true,
                }}
                onChange={handleChange}
                helperText="Auto-generated invoice number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Receipt Number"
                name="fee.receiptNumber"
                value={formData.fee.receiptNumber}
                onChange={handleChange}
                helperText="Optional receipt number"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/registrations')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || formData.sports.length === 0 || !formData.registrationPeriod}
            >
              {loading ? 'Submitting...' : 'Register Player'}
            </Button>
          </Box>
        </form>
      </Paper>
      
      <Snackbar 
        open={!!error || success} 
        autoHideDuration={6000} 
        onClose={() => {
          setError(null);
          setSuccess(false);
        }}
      >
        <Alert 
          severity={error ? 'error' : 'success'} 
          onClose={() => {
            setError(null);
            setSuccess(false);
          }}
        >
          {error || 'Player registration successful!'}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RegistrationForm; 