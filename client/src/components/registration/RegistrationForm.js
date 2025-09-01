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
  CircularProgress,
  Link
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { createPlayerRegistration, getRegistrationFees } from '../../services/registrationService';
import { useAuth } from '../../contexts/AuthContext';
import { isAdmin, isAccounting } from '../../services/authService';

// Add a function to generate invoice number
const generateInvoiceNumber = () => {
  const prefix = 'REG';
  // Use current date in YYMMDD format
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  // Add a small random number (1-100)
  const random = Math.floor(Math.random() * 100) + 1;
  return `${prefix}-${year}${month}${day}-${random}`;
};

const RegistrationForm = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, initialized } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [registrationFees, setRegistrationFees] = useState([]);
  const [feeLoading, setFeeLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [feeBreakdown, setFeeBreakdown] = useState([]);

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
      transactionId: '',
      invoiceNumber: generateInvoiceNumber()  // Add auto-generated invoice number
    },
    notes: ''
  });

  const sportOptions = ['Basketball', 'Football', 'Volleyball', 'Self Defense', 'Karate', 'Gymnastics', 'Gym', 'Zumba', 'Swimming', 'Ping Pong', 'Fitness', 'Crossfit'];
  const periodOptions = ['1 Month', '3 Months', '6 Months', '1 Year'];

  useEffect(() => {
    // Fetch registration fees when component mounts
    fetchRegistrationFees();
  }, []);
  
  const fetchRegistrationFees = async () => {
    try {
      const fees = await getRegistrationFees();
      console.log('Fetched registration fees:', fees);
      setRegistrationFees(fees);
    } catch (err) {
      console.error('Error fetching registration fees:', err);
      // Don't set error here to avoid disrupting the form
    }
  };
  
  // Function to find and update fee amount when sports or period changes
  const updateFeeAmount = () => {
    // Only proceed if both sports and period are selected
    if (!formData.sports.length || !formData.registrationPeriod) {
      console.log('Cannot update fee: missing sport or period', {
        sports: formData.sports,
        period: formData.registrationPeriod
      });
      return;
    }
    
    setFeeLoading(true);
    
    try {
      let totalAmount = 0;
      let feesFound = 0;
      let missingFees = [];
      let breakdown = [];
      
      // Process each selected sport
      formData.sports.forEach(sport => {
        console.log(`Checking fee for sport: ${sport}`);
        
        const matchingFee = registrationFees.find(
          fee => fee.sportType === sport && 
                 fee.period === formData.registrationPeriod && 
                 fee.isActive
        );
        
        if (matchingFee) {
          console.log(`Found fee for ${sport}:`, matchingFee.amount);
          totalAmount += matchingFee.amount;
          feesFound++;
          
          // Add to fee breakdown
          breakdown.push({
            sport,
            amount: matchingFee.amount,
            currency: matchingFee.currency || formData.fee.currency
          });
        } else {
          console.log(`No fee configuration found for ${sport}`);
          missingFees.push(sport);
          
          // Add to fee breakdown with unknown amount
          breakdown.push({
            sport,
            amount: null,
            currency: formData.fee.currency
          });
        }
      });
      
      // Store fee breakdown
      setFeeBreakdown(breakdown);
      
      // Update the form with the total amount if any fees were found
      if (feesFound > 0) {
        console.log(`Calculated total fee for ${feesFound} sports: ${totalAmount}`);
        
        // Use functional state update to avoid race conditions
        setFormData(prevData => ({
          ...prevData,
          fee: {
            ...prevData.fee,
            amount: totalAmount,
            // Keep the existing currency
            currency: prevData.fee.currency
          }
        }));
        
        // Show success message with breakdown
        let message = `Total fee: ${totalAmount} ${formData.fee.currency}`;
        if (feesFound < formData.sports.length) {
          message += ` (${feesFound}/${formData.sports.length} sports)`;
        }
        
        setSnackbar({
          open: true,
          message,
          severity: 'info'
        });
        
        // If some fees were missing, show a warning
        if (missingFees.length > 0) {
          setTimeout(() => {
            setSnackbar({
              open: true,
              message: `Missing fee configuration for: ${missingFees.join(', ')}. ${(isAdmin() || isAccounting()) ? 'Please configure these fees or adjust manually.' : 'Total may be incomplete.'}`,
              severity: 'warning'
            });
          }, 3000);
        }
      } else {
        console.log('No matching fees found for any selected sports');
        
        // Show a warning if no matching fee was found
        setSnackbar({
          open: true,
          message: `No configured fees found for selected sports with period ${formData.registrationPeriod}. ${(isAdmin() || isAccounting()) ? 'Please set the fees manually.' : 'Please contact an administrator.'}`,
          severity: 'warning'
        });
      }
    } catch (err) {
      console.error('Error updating fee amount:', err);
      setSnackbar({
        open: true,
        message: 'Error updating fee amount: ' + err.message,
        severity: 'error'
      });
    } finally {
      setFeeLoading(false);
    }
  };

  // Add effect to update fee when sports or period changes
  useEffect(() => {
    if (formData.sports.length > 0 && formData.registrationPeriod) {
      console.log("useEffect triggering fee update due to sports/period change");
      // Use short timeout to ensure state is stable
      const timeoutId = setTimeout(() => {
        updateFeeAmount();
      }, 100);
      
      // Cleanup function
      return () => clearTimeout(timeoutId);
    }
  }, [formData.sports, formData.registrationPeriod]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = ${value}`);
    
    // Handle nested fields (those containing dots)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      // Check if the fee amount is being changed manually (by non-admin/non-accounting)
      if (name === 'fee.amount' && !isAdmin() && !isAccounting()) {
        // Prevent manual changes for users who are not admin or accounting
        return;
      }
      
      setFormData(prevData => ({
        ...prevData,
        [parent]: {
          ...prevData[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
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
    console.log("Sports selection changed:", value);
    
    // Make sure we're setting it as an array
    setFormData(prevData => ({
      ...prevData,
      sports: Array.isArray(value) ? value : [value]
    }));
  };

  const handlePeriodChange = (event) => {
    const { value } = event.target;
    console.log("Period selection changed:", value);
    
    setFormData(prevData => ({
      ...prevData,
      registrationPeriod: value
    }));
    
    // After updating period, trigger fee update
    setTimeout(() => updateFeeAmount(), 50);
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
      
      // Validate required fields
      if (!formData.player.firstName || !formData.player.lastName || !formData.player.email) {
        throw new Error('Please fill in all required player information fields');
      }
      
      if (formData.sports.length === 0) {
        throw new Error('Please select at least one sport');
      }
      
      if (!formData.registrationPeriod) {
        throw new Error('Please select a registration period');
      }
      
      if (!formData.fee.amount || formData.fee.amount <= 0) {
        throw new Error('Fee amount must be greater than zero');
      }
      
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
      
      const response = await createPlayerRegistration(completeFormData);
      console.log('Registration successful:', response);
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
                  id="sports-select"
                  multiple
                  value={formData.sports}
                  onChange={handleSportsChange}
                  input={<OutlinedInput label="Sports" />}
                  renderValue={(selected) => selected.join(', ')}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 224,
                        width: 250,
                      },
                    },
                  }}
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
                  onChange={handlePeriodChange}
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
                
                {/* Fee breakdown display */}
                {formData.sports.length > 0 && formData.registrationPeriod && feeBreakdown.length > 0 && (
                  <Box sx={{ mb: 2, borderLeft: '4px solid #1976d2', pl: 2, py: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Fee Breakdown:
                    </Typography>
                    
                    {feeBreakdown.map((fee, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{fee.sport}:</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {fee.amount !== null 
                            ? `${fee.amount.toFixed(2)} ${fee.currency}` 
                            : "Not configured"}
                        </Typography>
                      </Box>
                    ))}
                    
                    {feeBreakdown.length > 1 && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1" fontWeight="bold">Total:</Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {formData.fee.amount.toFixed(2)} {formData.fee.currency}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                )}
                
                <TextField
                  fullWidth
                  required
                  type="number"
                  InputProps={{ 
                    inputProps: { min: 0, step: "0.01" },
                    readOnly: !isAdmin() && !isAccounting(),
                    endAdornment: feeLoading && <CircularProgress size={20} />
                  }}
                  margin="normal"
                  label="Fee Amount"
                  name="fee.amount"
                  value={formData.fee.amount}
                  onChange={handleChange}
                  disabled={!isAdmin() && !isAccounting()}
                  helperText={(isAdmin() || isAccounting()) 
                    ? "Fee will auto-populate based on sports and period if configured" 
                    : "Fee is automatically set based on sports and period configured by admin"
                  }
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
              <FormControl required fullWidth>
                <InputLabel id="payment-method-label">Payment Method</InputLabel>
                <Select
                  labelId="payment-method-label"
                  name="fee.paymentMethod"
                  value={formData.fee.paymentMethod}
                  onChange={handleChange}
                  label="Payment Method"
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Credit Card">Credit Card</MenuItem>
                  <MenuItem value="Debit Card">Debit Card</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl required fullWidth>
                <InputLabel id="payment-status-label">Payment Status</InputLabel>
                <Select
                  labelId="payment-status-label"
                  name="fee.paymentStatus"
                  value={formData.fee.paymentStatus}
                  onChange={handleChange}
                  label="Payment Status"
                >
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {formData.fee.paymentMethod !== 'Cash' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Transaction ID"
                  name="fee.transactionId"
                  value={formData.fee.transactionId}
                  onChange={handleChange}
                  placeholder="Enter transaction reference if applicable"
                />
              </Grid>
            )}
          </Grid>
          
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Additional Notes
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Registration Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional information about this registration"
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
        open={snackbar.open || !!error || success} 
        autoHideDuration={6000} 
        onClose={() => {
          setSnackbar({...snackbar, open: false});
          setError(null);
          setSuccess(false);
        }}
      >
        <Alert 
          severity={snackbar.open ? snackbar.severity : error ? 'error' : 'success'} 
          onClose={() => {
            setSnackbar({...snackbar, open: false});
            setError(null);
            setSuccess(false);
          }}
        >
          {snackbar.open ? snackbar.message : error || 'Player registration successful!'}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RegistrationForm; 