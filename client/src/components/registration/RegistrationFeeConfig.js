import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Box,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Save as SaveIcon 
} from '@mui/icons-material';
import { 
  getRegistrationFees, 
  createRegistrationFee, 
  updateRegistrationFee 
} from '../../services/registrationService';

const RegistrationFeeConfig = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentFee, setCurrentFee] = useState({
    sportType: '',
    period: '',
    amount: '',
    currency: 'USD',
    isActive: true
  });
  const [isEdit, setIsEdit] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const sportOptions = ['Basketball', 'Football', 'Volleyball', 'Self Defense', 'Karate', 'Gymnastics', 'Gym', 'Zumba', 'Swimming', 'Ping Pong'];
  const periodOptions = ['1 Month', '3 Months', '6 Months', '1 Year'];
  
  useEffect(() => {
    fetchFees();
  }, []);
  
  const fetchFees = async () => {
    setLoading(true);
    try {
      const data = await getRegistrationFees();
      // Group fees by sport type
      const groupedData = data.reduce((acc, fee) => {
        if (!acc[fee.sportType]) {
          acc[fee.sportType] = [];
        }
        acc[fee.sportType].push(fee);
        return acc;
      }, {});
      
      setFees(groupedData);
    } catch (error) {
      showSnackbar('Error fetching registration fees', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenDialog = (fee = null) => {
    if (fee) {
      setCurrentFee(fee);
      setIsEdit(true);
    } else {
      setCurrentFee({
        sportType: '',
        period: '',
        amount: '',
        currency: 'USD',
        isActive: true
      });
      setIsEdit(false);
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentFee(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value
    }));
  };
  
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  const handleSubmit = async () => {
    try {
      if (isEdit) {
        await updateRegistrationFee(currentFee._id, currentFee);
        showSnackbar('Registration fee updated successfully');
      } else {
        await createRegistrationFee(currentFee);
        showSnackbar('Registration fee created successfully');
      }
      handleCloseDialog();
      fetchFees();
    } catch (error) {
      showSnackbar(error.response?.data?.msg || 'Error saving registration fee', 'error');
      console.error(error);
    }
  };
  
  const renderFeeTable = (sportType, sportFees) => {
    return (
      <Paper sx={{ mb: 3, overflow: 'hidden' }} key={sportType}>
        <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
          <Typography variant="h6">{sportType}</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sportFees.map(fee => (
                <TableRow key={fee._id}>
                  <TableCell>{fee.period}</TableCell>
                  <TableCell>{fee.amount.toFixed(2)}</TableCell>
                  <TableCell>{fee.currency}</TableCell>
                  <TableCell>{fee.isActive ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell>
                    {new Date(fee.updatedAt).toLocaleDateString()} by{' '}
                    {fee.updatedBy ? `${fee.updatedBy.firstName} ${fee.updatedBy.lastName}` : 'System'}
                  </TableCell>
                  <TableCell>
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(fee)}
                      size="small"
                      variant="outlined"
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
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
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : Object.keys(fees).length > 0 ? (
        Object.entries(fees).map(([sport, sportFees]) => 
          renderFeeTable(sport, sportFees)
        )
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No registration fees configured yet
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Click the "Add New Fee" button to start configuring fees for different sports and periods.
          </Typography>
        </Paper>
      )}
      
      {/* Add/Edit Registration Fee Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEdit ? 'Edit Registration Fee' : 'Add New Registration Fee'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="sport-type-label">Sport Type</InputLabel>
                <Select
                  labelId="sport-type-label"
                  name="sportType"
                  value={currentFee.sportType}
                  onChange={handleInputChange}
                  label="Sport Type"
                  disabled={isEdit}
                  required
                >
                  {sportOptions.map(sport => (
                    <MenuItem key={sport} value={sport}>{sport}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="period-label">Period</InputLabel>
                <Select
                  labelId="period-label"
                  name="period"
                  value={currentFee.period}
                  onChange={handleInputChange}
                  label="Period"
                  disabled={isEdit}
                  required
                >
                  {periodOptions.map(period => (
                    <MenuItem key={period} value={period}>{period}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={currentFee.amount}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="currency-label">Currency</InputLabel>
                <Select
                  labelId="currency-label"
                  name="currency"
                  value={currentFee.currency}
                  onChange={handleInputChange}
                  label="Currency"
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="isActive"
                  value={currentFee.isActive}
                  onChange={(e) => setCurrentFee(prev => ({
                    ...prev,
                    isActive: e.target.value
                  }))}
                  label="Status"
                >
                  <MenuItem value={true}>Active</MenuItem>
                  <MenuItem value={false}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RegistrationFeeConfig; 