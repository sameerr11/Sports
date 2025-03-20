import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { createUtilityBill } from '../../services/utilityService';
import { formatCurrency } from '../../utils/format';

const UtilityBillForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState({
    billNumber: generateBillNumber(),
    billType: '',
    amount: '',
    vendor: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    paymentStatus: 'Pending'
  });

  // Generate a random bill number
  function generateBillNumber() {
    const prefix = 'UTIL';
    // Use current date in YYMMDD format
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    // Add a small random number (1-100)
    const random = Math.floor(Math.random() * 100) + 1;
    return `${prefix}-${year}${month}${day}-${random}`;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.billType || !formData.amount || !formData.vendor || !formData.dueDate) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      await createUtilityBill(formData);
      setSnackbar({
        open: true,
        message: 'Utility bill created successfully',
        severity: 'success'
      });

      // Wait a bit then navigate to the list
      setTimeout(() => {
        navigate('/utilities');
      }, 1500);
    } catch (err) {
      console.error('Error creating utility bill:', err);
      setSnackbar({
        open: true,
        message: err.toString() || 'Failed to create utility bill',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Add Utility Bill
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                disabled
                label="Bill Number"
                name="billNumber"
                value={formData.billNumber}
              />
              <FormHelperText>Auto-generated</FormHelperText>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Bill Type</InputLabel>
                <Select
                  name="billType"
                  value={formData.billType}
                  onChange={handleChange}
                  label="Bill Type"
                >
                  <MenuItem value="Electricity">Electricity</MenuItem>
                  <MenuItem value="Water">Water</MenuItem>
                  <MenuItem value="Gas">Gas</MenuItem>
                  <MenuItem value="Internet">Internet</MenuItem>
                  <MenuItem value="Phone">Phone</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Equipment">Equipment</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Amount"
                name="amount"
                type="number"
                InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                value={formData.amount}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Vendor"
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                placeholder="e.g., City Power Company"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Bill Date"
                name="billDate"
                type="date"
                value={formData.billDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Due Date"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                disabled
                label="Payment Method"
                name="paymentMethod"
                value="Cash"
                InputProps={{ readOnly: true }}
              />
              <FormHelperText>Cash payments only</FormHelperText>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                  label="Payment Status"
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate('/utilities')}
                  sx={{ mr: 2 }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Bill'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UtilityBillForm; 