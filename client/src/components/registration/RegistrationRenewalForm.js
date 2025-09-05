import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addMonths, addYears } from 'date-fns';
import { 
  getRegistrationFees, 
  createRenewal 
} from '../../services/registrationRenewalService';

const RegistrationRenewalForm = ({ open, onClose, onSuccess, originalRegistration }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fees, setFees] = useState([]);
  const [selectedSports, setSelectedSports] = useState([]);
  const [availableSports, setAvailableSports] = useState([]);
  const [formData, setFormData] = useState({
    registrationPeriod: '',
    startDate: new Date(),
    fee: {
      amount: 0,
      currency: 'USD',
      paymentMethod: 'Cash',
      paymentStatus: 'Paid',
      invoiceNumber: ''
    },
    notes: ''
  });
  const [isManualFee, setIsManualFee] = useState(false);

  // All available sports (same as new registration)
  const allAvailableSports = ['Basketball', 'Football', 'Volleyball', 'Self Defense', 'Karate', 'Gymnastics', 'Gym', 'Zumba', 'Swimming', 'Ping Pong', 'Fitness', 'Crossfit'];
  
  // Original sports from the registration (for reference)
  const originalSports = originalRegistration?.sports || [];

  // Registration periods
  const registrationPeriods = ['1 Month', '3 Months', '6 Months', '1 Year'];

  // Payment methods
  const paymentMethods = ['Cash', 'Card', 'BankTransfer', 'Other'];

  // Payment statuses
  const paymentStatuses = ['Paid', 'Pending', 'Failed'];

  useEffect(() => {
    if (open && originalRegistration) {
      // Initialize form with original registration data
      setSelectedSports(originalSports);
      
      // Set available sports (all sports, not just original ones)
      setAvailableSports(allAvailableSports);
      
      // For advance renewals, set start date to current registration end date
      // For expired registrations, use current date
      const isExpired = new Date(originalRegistration.endDate) < new Date();
      const startDate = isExpired ? new Date() : new Date(originalRegistration.endDate);
      
      setFormData(prev => ({
        ...prev,
        startDate: startDate,
        fee: {
          ...prev.fee,
          invoiceNumber: `REN-${Date.now()}`
        }
      }));
      
      // Load registration fees
      loadRegistrationFees();
    }
  }, [open, originalRegistration]);

  const loadRegistrationFees = async () => {
    try {
      const response = await getRegistrationFees();
      setFees(response.data);
    } catch (err) {
      console.error('Error loading registration fees:', err);
    }
  };

  const calculateTotalFee = () => {
    if (selectedSports.length === 0 || !formData.registrationPeriod) return 0;
    
    let total = 0;
    selectedSports.forEach(sport => {
      const fee = fees.find(f => f.sportType === sport && f.period === formData.registrationPeriod);
      if (fee) {
        total += fee.amount;
      }
    });
    
    return total;
  };

  // Update fee when sports or period changes (only if not in manual mode)
  useEffect(() => {
    if (!isManualFee && selectedSports.length > 0 && formData.registrationPeriod) {
      const calculatedFee = calculateTotalFee();
      setFormData(prev => ({
        ...prev,
        fee: {
          ...prev.fee,
          amount: calculatedFee
        }
      }));
    }
  }, [selectedSports, formData.registrationPeriod, isManualFee, fees]);

  const calculateEndDate = () => {
    if (!formData.startDate || !formData.registrationPeriod) return null;
    
    const startDate = new Date(formData.startDate);
    switch (formData.registrationPeriod) {
      case '1 Month':
        return addMonths(startDate, 1);
      case '3 Months':
        return addMonths(startDate, 3);
      case '6 Months':
        return addMonths(startDate, 6);
      case '1 Year':
        return addYears(startDate, 1);
      default:
        return startDate;
    }
  };

  const handleSportChange = (sport, checked) => {
    if (checked) {
      setSelectedSports([...selectedSports, sport]);
    } else {
      setSelectedSports(selectedSports.filter(s => s !== sport));
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleManualFeeChange = (value) => {
    const numericValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      fee: {
        ...prev.fee,
        amount: numericValue
      }
    }));
  };

  const toggleManualFee = () => {
    setIsManualFee(!isManualFee);
    if (!isManualFee) {
      // Switching to manual mode - keep current amount
    } else {
      // Switching back to auto mode - recalculate
      const calculatedFee = calculateTotalFee();
      setFormData(prev => ({
        ...prev,
        fee: {
          ...prev.fee,
          amount: calculatedFee
        }
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation
      if (selectedSports.length === 0) {
        setError('Please select at least one sport');
        return;
      }

      if (!formData.registrationPeriod) {
        setError('Please select a registration period');
        return;
      }

      if (!formData.fee.invoiceNumber) {
        setError('Please enter an invoice number');
        return;
      }

      const renewalData = {
        originalRegistrationId: originalRegistration._id,
        sports: selectedSports,
        registrationPeriod: formData.registrationPeriod,
        startDate: formData.startDate,
        fee: {
          ...formData.fee,
          amount: isManualFee ? formData.fee.amount : calculateTotalFee()
        },
        notes: formData.notes
      };

      await createRenewal(renewalData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create renewal');
      console.error('Error creating renewal:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSportFee = (sport) => {
    const fee = fees.find(f => f.sportType === sport && f.period === formData.registrationPeriod);
    return fee ? fee.amount : 0;
  };

  if (!originalRegistration) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.2)}`
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" fontWeight={700}>
              Renew & Extend Registration
            </Typography>
            {isManualFee && (
              <Chip
                label="Manual Fee"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {originalRegistration.userId?.firstName} {originalRegistration.userId?.lastName} 
            ({originalRegistration.userId?.email})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            You can renew existing sports, add new ones, or extend active registrations before expiry
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Sports Selection */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select Sports for Renewal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You can renew existing sports or add new ones. Original sports are marked with a badge.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {allAvailableSports.map((sport) => {
                  const isOriginalSport = originalSports.includes(sport);
                  const isSelected = selectedSports.includes(sport);
                  
                  return (
                    <FormControlLabel
                      key={sport}
                      control={
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => handleSportChange(sport, e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{sport}</Typography>
                          {isOriginalSport && (
                            <Chip
                              label="Original"
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: '20px' }}
                            />
                          )}
                          {formData.registrationPeriod && (
                            <Chip
                              label={`$${getSportFee(sport)}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                    />
                  );
                })}
              </Box>
            </Grid>

            {/* Registration Period */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Registration Period</InputLabel>
                <Select
                  value={formData.registrationPeriod}
                  onChange={(e) => handleInputChange('registrationPeriod', e.target.value)}
                  label="Registration Period"
                >
                  {registrationPeriods.map((period) => (
                    <MenuItem key={period} value={period}>
                      {period}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Start Date */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(date) => handleInputChange('startDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>

            {/* End Date (calculated) */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date (Calculated)"
                value={calculateEndDate() ? format(calculateEndDate(), 'MMM dd, yyyy') : ''}
                InputProps={{ readOnly: true }}
                fullWidth
                helperText="Automatically calculated based on start date and period"
              />
            </Grid>

            {/* Total Fee */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TextField
                  label="Total Fee"
                  value={isManualFee ? formData.fee.amount : calculateTotalFee()}
                  onChange={(e) => isManualFee && handleManualFeeChange(e.target.value)}
                  InputProps={{ 
                    readOnly: !isManualFee,
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                  }}
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                />
                <Button
                  variant={isManualFee ? "contained" : "outlined"}
                  size="small"
                  onClick={toggleManualFee}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  {isManualFee ? "Auto" : "Edit"}
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {isManualFee 
                  ? "Manual fee entry - you can override the calculated amount"
                  : "Auto-calculated based on selected sports and period"
                }
              </Typography>
              {isManualFee && selectedSports.length > 0 && formData.registrationPeriod && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Calculated amount: ${calculateTotalFee()} | 
                    Manual amount: ${formData.fee.amount} | 
                    Difference: ${(formData.fee.amount - calculateTotalFee()).toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Payment Information
              </Typography>
            </Grid>

            {/* Payment Method */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={formData.fee.paymentMethod}
                  onChange={(e) => handleInputChange('fee.paymentMethod', e.target.value)}
                  label="Payment Method"
                >
                  {paymentMethods.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Payment Status */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={formData.fee.paymentStatus}
                  onChange={(e) => handleInputChange('fee.paymentStatus', e.target.value)}
                  label="Payment Status"
                >
                  {paymentStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Invoice Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Invoice Number"
                value={formData.fee.invoiceNumber}
                onChange={(e) => handleInputChange('fee.invoiceNumber', e.target.value)}
                fullWidth
                required
              />
            </Grid>

            {/* Receipt Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Receipt Number"
                value={formData.fee.receiptNumber || ''}
                onChange={(e) => handleInputChange('fee.receiptNumber', e.target.value)}
                fullWidth
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="Additional notes about this renewal..."
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={onClose} 
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || selectedSports.length === 0}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Process Renewal'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default RegistrationRenewalForm;
