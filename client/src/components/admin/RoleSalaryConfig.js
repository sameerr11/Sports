import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  TextField,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { getRoleSalaries, updateRoleSalary, deleteRoleSalary } from '../../services/roleSalaryService';
import { formatCurrency } from '../../utils/format';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor-cafeteria', label: 'Cafeteria Supervisor' },
  { value: 'supervisor-sports', label: 'Sports Supervisor' },
  { value: 'supervisor-general', label: 'General Supervisor' },
  { value: 'supervisor-booking', label: 'Booking Supervisor' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'coach', label: 'Coach' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'support', label: 'Support' }
];

const RoleSalaryConfig = () => {
  const [roleSalaries, setRoleSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentRoleSalary, setCurrentRoleSalary] = useState({
    role: '',
    amount: '',
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchRoleSalaries();
  }, []);

  const fetchRoleSalaries = async () => {
    try {
      setLoading(true);
      const data = await getRoleSalaries();
      setRoleSalaries(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching role salaries:', err);
      setError('Failed to load role salary configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (roleSalary = null) => {
    if (roleSalary) {
      setCurrentRoleSalary(roleSalary);
      setIsEditing(true);
    } else {
      setCurrentRoleSalary({
        role: '',
        amount: '',
        description: ''
      });
      setIsEditing(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleOpenDeleteDialog = (roleSalary) => {
    setCurrentRoleSalary(roleSalary);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentRoleSalary({
      ...currentRoleSalary,
      [name]: name === 'amount' ? (value === '' ? '' : Number(value)) : value
    });
  };

  const handleSubmit = async () => {
    if (!currentRoleSalary.role || !currentRoleSalary.amount) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    try {
      await updateRoleSalary(currentRoleSalary);
      setSnackbar({
        open: true,
        message: `${isEditing ? 'Updated' : 'Added'} salary for ${currentRoleSalary.role} role`,
        severity: 'success'
      });
      handleCloseDialog();
      fetchRoleSalaries();
    } catch (err) {
      console.error('Error saving role salary:', err);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'add'} role salary`,
        severity: 'error'
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRoleSalary(currentRoleSalary.role);
      setSnackbar({
        open: true,
        message: `Deleted salary for ${currentRoleSalary.role} role`,
        severity: 'success'
      });
      handleCloseDeleteDialog();
      fetchRoleSalaries();
    } catch (err) {
      console.error('Error deleting role salary:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete role salary',
        severity: 'error'
      });
    }
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
          Role-Based Salary Configuration
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Configure default salaries for different staff roles. These will be automatically applied when creating salary invoices.
          </Typography>

          {roleSalaries.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">No role salary configurations found</Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Role</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roleSalaries.map((roleSalary) => (
                    <TableRow key={roleSalary.role}>
                      <TableCell>
                        {ROLES.find(r => r.value === roleSalary.role)?.label || roleSalary.role}
                      </TableCell>
                      <TableCell>{formatCurrency(roleSalary.amount)}</TableCell>
                      <TableCell>{roleSalary.description || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenDialog(roleSalary)}
                          title="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleOpenDeleteDialog(roleSalary)}
                          title="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Role Salary' : 'Add New Role Salary'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={isEditing}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={currentRoleSalary.role}
                    onChange={handleChange}
                    label="Role"
                  >
                    {ROLES.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
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
                  value={currentRoleSalary.amount}
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
                  value={currentRoleSalary.description || ''}
                  onChange={handleChange}
                  placeholder="E.g., Monthly base salary"
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
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the salary configuration for{' '}
            <strong>{ROLES.find(r => r.value === currentRoleSalary.role)?.label || currentRoleSalary.role}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>Delete</Button>
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RoleSalaryConfig; 