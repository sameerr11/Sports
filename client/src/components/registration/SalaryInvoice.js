import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  FormHelperText
} from '@mui/material';
import { Send as SendIcon, Print as PrintIcon } from '@mui/icons-material';
import { getAllUsers } from '../../services/userService';
import { createSalaryInvoice } from '../../services/registrationService';
import { formatCurrency } from '../../utils/format';

const SalaryInvoice = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState({
    userId: '',
    amount: '',
    description: '',
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Pending',
    invoiceNumber: generateInvoiceNumber()
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // Generate random invoice number
  function generateInvoiceNumber() {
    const prefix = 'SAL';
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      // Filter only staff (not players)
      const staffUsers = data.filter(user => 
        ['admin', 'supervisor', 'coach', 'cashier', 'support', 'accounting'].includes(user.role)
      );
      setUsers(staffUsers);
    } catch (err) {
      console.error('Error fetching staff users:', err);
      setError('Failed to load staff users');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.amount) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    try {
      setSubmitting(true);
      await createSalaryInvoice(formData);
      setSuccess(true);
      setSnackbar({
        open: true,
        message: 'Salary invoice created successfully',
        severity: 'success'
      });
      
      // Reset form after successful submission
      setFormData({
        userId: '',
        amount: '',
        description: '',
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Pending',
        invoiceNumber: generateInvoiceNumber()
      });
    } catch (err) {
      console.error('Error creating salary invoice:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Failed to create salary invoice',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = () => {
    if (!formData.userId || !formData.amount) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }
    setPreviewOpen(true);
  };

  const getUserName = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? `${user.firstName} ${user.lastName}` : '';
  };

  const getUserRole = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Issue Salary Invoice
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="staff-select-label">Staff Member</InputLabel>
                <Select
                  labelId="staff-select-label"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  label="Staff Member"
                >
                  {users.map(user => (
                    <MenuItem key={user._id} value={user._id}>
                      {`${user.firstName} ${user.lastName} (${user.role})`}
                    </MenuItem>
                  ))}
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
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={2}
                value={formData.description}
                onChange={handleChange}
                placeholder="E.g., Monthly salary for October 2023"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  label="Payment Method"
                >
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                  <MenuItem value="Check">Check</MenuItem>
                  <MenuItem value="Cash">Cash</MenuItem>
                </Select>
              </FormControl>
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
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                disabled
                label="Invoice Number"
                name="invoiceNumber"
                value={formData.invoiceNumber}
              />
              <FormHelperText>Auto-generated</FormHelperText>
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" mt={2}>
                <Button
                  variant="outlined"
                  onClick={handlePreview}
                  startIcon={<PrintIcon />}
                  disabled={submitting}
                >
                  Preview Invoice
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  startIcon={<SendIcon />}
                  disabled={submitting}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Issue Invoice'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Salary Invoice Preview</DialogTitle>
        <DialogContent>
          <Card variant="outlined" sx={{ mt: 2, p: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" mb={3}>
                <Box>
                  <Typography variant="h6">SALARY INVOICE</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Invoice #: {formData.invoiceNumber}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Date: {new Date().toLocaleDateString()}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="body1">SPORTS MANAGEMENT</Typography>
                  <Typography variant="body2" color="textSecondary">
                    123 Sports Avenue
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    City, State, ZIP
                  </Typography>
                </Box>
              </Box>
              
              <Box mb={4}>
                <Typography variant="subtitle1" gutterBottom>Bill To:</Typography>
                <Typography variant="body1">
                  {getUserName(formData.userId)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Position: {getUserRole(formData.userId)}
                </Typography>
              </Box>
              
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom>Payment Details:</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">Description:</Typography>
                    <Typography variant="body1">
                      {formData.description || 'Salary Payment'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} textAlign="right">
                    <Typography variant="body2">Amount:</Typography>
                    <Typography variant="h6">
                      {formatCurrency(formData.amount || 0)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Box mt={4}>
                <Typography variant="body2" color="textSecondary">
                  Payment Method: {formData.paymentMethod}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Payment Status: {formData.paymentStatus}
                </Typography>
              </Box>
              
              <Box mt={4} textAlign="center">
                <Typography variant="body2">
                  Thank you for your service!
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<PrintIcon />}
            onClick={() => {
              setPreviewOpen(false);
              window.print();
            }}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default SalaryInvoice; 