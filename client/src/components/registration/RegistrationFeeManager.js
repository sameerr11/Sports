import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Grid, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Divider, 
  Alert, 
  Switch, 
  FormControlLabel, 
  Box
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { getRegistrationFees, createRegistrationFee, updateRegistrationFee } from '../../services/registrationService';
import { useAuth } from '../../contexts/AuthContext';

const RegistrationFeeManager = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const isAdmin = user && user.role === 'admin';
  
  const [formData, setFormData] = useState({
    sportType: '',
    period: '',
    amount: '',
    currency: 'USD',
    isActive: true
  });
  
  const sportOptions = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Others'];
  const periodOptions = ['1 Month', '3 Months', '6 Months', '1 Year'];
  
  useEffect(() => {
    fetchFees();
  }, []);
  
  const fetchFees = async () => {
    try {
      setLoading(true);
      const data = await getRegistrationFees();
      setFees(data);
    } catch (err) {
      console.error('Error fetching fees:', err);
      setError('Failed to load registration fees');
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
  
  const handleSwitchChange = (e) => {
    setFormData({
      ...formData,
      isActive: e.target.checked
    });
  };
  
  const handleOpenDialog = (fee = null) => {
    if (fee) {
      setSelectedFee(fee);
      setFormData({
        sportType: fee.sportType,
        period: fee.period,
        amount: fee.amount,
        currency: fee.currency,
        isActive: fee.isActive
      });
    } else {
      setSelectedFee(null);
      setFormData({
        sportType: '',
        period: '',
        amount: '',
        currency: 'USD',
        isActive: true
      });
    }
    
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedFee(null);
  };
  
  const handleSubmit = async () => {
    try {
      if (selectedFee) {
        // Update existing fee
        await updateRegistrationFee(selectedFee._id, formData);
        setSuccess('Registration fee updated successfully');
      } else {
        // Create new fee
        await createRegistrationFee(formData);
        setSuccess('Registration fee created successfully');
      }
      
      // Refresh fees list
      fetchFees();
      handleCloseDialog();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving fee:', err);
      setError(err.response?.data?.msg || 'Failed to save registration fee');
    }
  };
  
  // Group fees by sport type
  const groupedFees = fees.reduce((acc, fee) => {
    if (!acc[fee.sportType]) {
      acc[fee.sportType] = [];
    }
    acc[fee.sportType].push(fee);
    return acc;
  }, {});
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Registration Fees
          </Typography>
          
          {isAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add New Fee
            </Button>
          )}
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {loading ? (
          <Typography>Loading fees...</Typography>
        ) : fees.length === 0 ? (
          <Typography>No registration fees found. Add some fees to get started.</Typography>
        ) : (
          Object.keys(groupedFees).map(sportType => (
            <Box key={sportType} mb={4}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                {sportType}
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Period</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Currency</TableCell>
                      <TableCell>Status</TableCell>
                      {isAdmin && <TableCell align="center">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groupedFees[sportType].map((fee) => (
                      <TableRow key={fee._id}>
                        <TableCell>{fee.period}</TableCell>
                        <TableCell>{fee.amount}</TableCell>
                        <TableCell>{fee.currency}</TableCell>
                        <TableCell>
                          {fee.isActive ? (
                            <Typography color="success.main">Active</Typography>
                          ) : (
                            <Typography color="text.disabled">Inactive</Typography>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell align="center">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenDialog(fee)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))
        )}
      </Paper>
      
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedFee ? 'Edit Registration Fee' : 'Add New Registration Fee'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!!selectedFee}>
                <InputLabel id="sport-type-label">Sport</InputLabel>
                <Select
                  labelId="sport-type-label"
                  name="sportType"
                  value={formData.sportType}
                  onChange={handleChange}
                  label="Sport"
                  required
                >
                  {sportOptions.map((sport) => (
                    <MenuItem key={sport} value={sport}>
                      {sport}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!!selectedFee}>
                <InputLabel id="period-label">Period</InputLabel>
                <Select
                  labelId="period-label"
                  name="period"
                  value={formData.period}
                  onChange={handleChange}
                  label="Period"
                  required
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
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleSwitchChange}
                    color="primary"
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.sportType || !formData.period || !formData.amount}
          >
            {selectedFee ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RegistrationFeeManager; 