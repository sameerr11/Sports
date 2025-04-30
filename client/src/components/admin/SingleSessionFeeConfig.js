import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Grid,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { 
  getSingleSessionFees, 
  createSingleSessionFee, 
  updateSingleSessionFee, 
  deleteSingleSessionFee 
} from '../../services/singleSessionFeeService';
import { isAdmin } from '../../services/authService';

const SingleSessionFeeConfig = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentFee, setCurrentFee] = useState({
    sportType: '',
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sportToDelete, setSportToDelete] = useState(null);

  const sportOptions = ['Basketball', 'Football', 'Volleyball', 'Self Defense', 'Karate', 'Gymnastics', 'Gym', 'Zumba', 'Swimming', 'Ping Pong'];

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const data = await getSingleSessionFees();
      setFees(data);
    } catch (error) {
      showSnackbar('Error fetching single session fees', 'error');
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

  const handleToggleActive = (e) => {
    setCurrentFee(prev => ({
      ...prev,
      isActive: e.target.checked
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
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async () => {
    try {
      if (!currentFee.sportType || !currentFee.amount) {
        showSnackbar('Please fill in all required fields', 'error');
        return;
      }

      if (isEdit) {
        await updateSingleSessionFee(currentFee.sportType, {
          amount: parseFloat(currentFee.amount),
          currency: currentFee.currency,
          isActive: currentFee.isActive
        });
        showSnackbar(`Single session fee for ${currentFee.sportType} updated successfully`);
      } else {
        await createSingleSessionFee({
          sportType: currentFee.sportType,
          amount: parseFloat(currentFee.amount),
          currency: currentFee.currency,
          isActive: currentFee.isActive
        });
        showSnackbar(`Single session fee for ${currentFee.sportType} created successfully`);
      }

      handleCloseDialog();
      fetchFees();
    } catch (error) {
      showSnackbar(error.toString(), 'error');
    }
  };

  const handleDeleteConfirmOpen = (sportType) => {
    setSportToDelete(sportType);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmClose = () => {
    setDeleteConfirmOpen(false);
    setSportToDelete(null);
  };

  const handleDelete = async () => {
    if (!sportToDelete) return;

    try {
      await deleteSingleSessionFee(sportToDelete);
      showSnackbar(`Single session fee for ${sportToDelete} deleted successfully`);
      fetchFees();
    } catch (error) {
      showSnackbar(error.toString(), 'error');
    } finally {
      handleDeleteConfirmClose();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Single Session Fee Configuration
        </Typography>
        {isAdmin() && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add New
          </Button>
        )}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                <TableCell>Sport Type</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell>Status</TableCell>
                {isAdmin() && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {fees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin() ? 5 : 4} align="center">
                    No single session fees configured yet
                  </TableCell>
                </TableRow>
              ) : (
                fees.map(fee => (
                  <TableRow key={fee.sportType} hover>
                    <TableCell>{fee.sportType}</TableCell>
                    <TableCell align="right">{fee.amount.toFixed(2)}</TableCell>
                    <TableCell>{fee.currency}</TableCell>
                    <TableCell>
                      {fee.isActive ? (
                        <Box component="span" sx={{ color: 'success.main' }}>Active</Box>
                      ) : (
                        <Box component="span" sx={{ color: 'text.disabled' }}>Inactive</Box>
                      )}
                    </TableCell>
                    {isAdmin() && (
                      <TableCell align="center">
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenDialog(fee)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteConfirmOpen(fee.sportType)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Fee Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? `Edit Fee for ${currentFee.sportType}` : 'Add New Single Session Fee'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={isEdit}>
                <InputLabel id="sport-type-label">Sport Type</InputLabel>
                <Select
                  labelId="sport-type-label"
                  name="sportType"
                  value={currentFee.sportType}
                  onChange={handleInputChange}
                  label="Sport Type"
                  required
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
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentFee.isActive}
                    onChange={handleToggleActive}
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
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleDeleteConfirmClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the single session fee for {sportToDelete}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteConfirmClose}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
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
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SingleSessionFeeConfig; 