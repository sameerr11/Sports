import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon 
} from '@mui/icons-material';
import { getRegistrationFees, createRegistrationFee, updateRegistrationFee } from '../../services/registrationService';
import { formatCurrency } from '../../utils/format';

const sportOptions = [
  'Basketball', 'Football', 'Volleyball', 'Self Defense', 
  'Karate', 'Gymnastics', 'Gym', 'Zumba', 'Swimming', 'Ping Pong'
];

const periodOptions = ['1 Month', '3 Months', '6 Months', '1 Year'];

const RegistrationFeeConfig = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    sportType: '',
    period: '',
    amount: '',
    isActive: true
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const data = await getRegistrationFees();
      // Group fees by sport type
      const groupedFees = data.reduce((acc, fee) => {
        if (!acc[fee.sportType]) {
          acc[fee.sportType] = [];
        }
        acc[fee.sportType].push(fee);
        return acc;
      }, {});
      
      setFees(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching registration fees:', err);
      setError('Failed to load registration fees');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (fee = null) => {
    if (fee) {
      setFormData({
        id: fee._id,
        sportType: fee.sportType,
        period: fee.period,
        amount: fee.amount,
        isActive: fee.isActive
      });
    } else {
      setFormData({
        id: null,
        sportType: '',
        period: '',
        amount: '',
        isActive: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'amount' ? (value ? Number(value) : '') : value
    });
  };

  const handleSubmit = async () => {
    if (!formData.sportType || !formData.period || !formData.amount) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    try {
      setSubmitting(true);
      
      if (formData.id) {
        // Update existing fee
        await updateRegistrationFee(formData.id, {
          amount: formData.amount,
          isActive: formData.isActive
        });
        setSnackbar({
          open: true,
          message: `Updated fee for ${formData.sportType} - ${formData.period}`,
          severity: 'success'
        });
      } else {
        // Create new fee
        await createRegistrationFee({
          sportType: formData.sportType,
          period: formData.period,
          amount: formData.amount
        });
        setSnackbar({
          open: true,
          message: `Added new fee for ${formData.sportType} - ${formData.period}`,
          severity: 'success'
        });
      }
      
      handleCloseDialog();
      fetchFees();
    } catch (err) {
      console.error('Error saving registration fee:', err);
      setSnackbar({
        open: true,
        message: 'Failed to save registration fee',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderFeesBySport = () => {
    const groupedFees = {};
    
    fees.forEach(fee => {
      if (!groupedFees[fee.sportType]) {
        groupedFees[fee.sportType] = [];
      }
      groupedFees[fee.sportType].push(fee);
    });
    
    return Object.entries(groupedFees).map(([sport, sportFees]) => (
      <Box key={sport} sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {sport}
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sportFees.map(fee => (
                <TableRow key={fee._id}>
                  <TableCell>{fee.period}</TableCell>
                  <TableCell>{formatCurrency(fee.amount)}</TableCell>
                  <TableCell>{fee.isActive ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(fee)}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    ));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Registration Fee Configuration
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Fee
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Configure registration fees for each sport and period. These will be automatically applied when creating player registrations.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {fees.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No registration fees configured yet</Typography>
        </Paper>
      ) : (
        renderFeesBySport()
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {formData.id ? 'Edit Registration Fee' : 'Add New Registration Fee'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled={!!formData.id}>
                  <InputLabel>Sport</InputLabel>
                  <Select
                    name="sportType"
                    value={formData.sportType}
                    onChange={handleChange}
                    label="Sport"
                  >
                    {sportOptions.map(sport => (
                      <MenuItem key={sport} value={sport}>
                        {sport}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled={!!formData.id}>
                  <InputLabel>Period</InputLabel>
                  <Select
                    name="period"
                    value={formData.period}
                    onChange={handleChange}
                    label="Period"
                  >
                    {periodOptions.map(period => (
                      <MenuItem key={period} value={period}>
                        {period}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
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
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default RegistrationFeeConfig; 