import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
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
  CircularProgress,
  TextField
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { getUserSalaries, updateUserSalary, deleteUserSalary } from '../../services/userSalaryService';
import { getAllUsers } from '../../services/userService';
import { formatCurrency } from '../../utils/format';

const UserSalaryConfig = () => {
  const [userSalaries, setUserSalaries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentUserSalary, setCurrentUserSalary] = useState({
    userId: '',
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
    fetchUserSalaries();
    fetchUsers();
  }, []);

  const fetchUserSalaries = async () => {
    try {
      setLoading(true);
      const data = await getUserSalaries();
      setUserSalaries(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching user salaries:', err);
      setError('Failed to load user salary configurations');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      // Filter only staff users (not players or parents)
      const staffUsers = data.filter(user => 
        ['admin', 'supervisor', 'coach', 'cashier', 'support', 'accounting'].includes(user.role)
      );
      setUsers(staffUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    }
  };

  const handleOpenDialog = (userSalary = null) => {
    if (userSalary) {
      setCurrentUserSalary({
        userId: userSalary.userId._id,
        amount: userSalary.amount,
        description: userSalary.description || ''
      });
      setIsEditing(true);
    } else {
      setCurrentUserSalary({
        userId: '',
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

  const handleOpenDeleteDialog = (userSalary) => {
    setCurrentUserSalary({
      userId: userSalary.userId._id,
      amount: userSalary.amount,
      description: userSalary.description
    });
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentUserSalary({
      ...currentUserSalary,
      [name]: name === 'amount' ? (value === '' ? '' : Number(value)) : value
    });
  };

  const handleSubmit = async () => {
    if (!currentUserSalary.userId || !currentUserSalary.amount) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    try {
      await updateUserSalary(currentUserSalary);
      
      // Get the user name for the success message
      const user = users.find(u => u._id === currentUserSalary.userId);
      const userName = user ? `${user.firstName} ${user.lastName}` : 'user';
      
      setSnackbar({
        open: true,
        message: `${isEditing ? 'Updated' : 'Added'} salary for ${userName}`,
        severity: 'success'
      });
      handleCloseDialog();
      fetchUserSalaries();
    } catch (err) {
      console.error('Error saving user salary:', err);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'add'} user salary`,
        severity: 'error'
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUserSalary(currentUserSalary.userId);
      
      // Get the user name for the success message
      const user = users.find(u => u._id === currentUserSalary.userId);
      const userName = user ? `${user.firstName} ${user.lastName}` : 'user';
      
      setSnackbar({
        open: true,
        message: `Deleted salary for ${userName}`,
        severity: 'success'
      });
      handleCloseDeleteDialog();
      fetchUserSalaries();
    } catch (err) {
      console.error('Error deleting user salary:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete user salary',
        severity: 'error'
      });
    }
  };

  const getUserFullName = (userId) => {
    const user = users.find(u => u._id === userId._id);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };

  const getFormattedRoleName = (user) => {
    if (!user) return '';
    
    let roleName = user.role;
    if (user.role === 'supervisor' && user.supervisorType) {
      roleName = `${roleName} (${user.supervisorType})`;
    }
    
    // Format the role name to be more readable
    const roleMap = {
      'admin': 'Admin',
      'supervisor': 'Supervisor',
      'supervisor (cafeteria)': 'Cafeteria Supervisor',
      'supervisor (sports)': 'Sports Supervisor',
      'supervisor (general)': 'General Supervisor',
      'supervisor (booking)': 'Booking Supervisor',
      'cashier': 'Cashier',
      'coach': 'Coach',
      'accounting': 'Accounting',
      'support': 'Support'
    };
    
    return roleMap[roleName] || roleName;
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
          User-Based Salary Configuration
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
            Configure individual salaries for each staff member. These will be automatically applied when creating salary invoices.
          </Typography>

          {userSalaries.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">No user salary configurations found</Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userSalaries.map((userSalary) => (
                    <TableRow key={userSalary._id}>
                      <TableCell>
                        {`${userSalary.userId.firstName} ${userSalary.userId.lastName}`}
                      </TableCell>
                      <TableCell>
                        {getFormattedRoleName(userSalary.userId)}
                      </TableCell>
                      <TableCell>{formatCurrency(userSalary.amount)}</TableCell>
                      <TableCell>{userSalary.description || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenDialog(userSalary)}
                          title="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleOpenDeleteDialog(userSalary)}
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
          {isEditing ? 'Edit Salary' : 'Add New Salary'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="user-select-label">Staff Member</InputLabel>
              <Select
                labelId="user-select-label"
                id="user-select"
                name="userId"
                value={currentUserSalary.userId}
                onChange={handleChange}
                label="Staff Member"
              >
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {`${user.firstName} ${user.lastName} (${getFormattedRoleName(user)})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              sx={{ mb: 2 }}
              label="Amount"
              name="amount"
              type="number"
              value={currentUserSalary.amount}
              onChange={handleChange}
              InputProps={{
                startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
              }}
            />

            <TextField
              fullWidth
              label="Description (Optional)"
              name="description"
              value={currentUserSalary.description}
              onChange={handleChange}
              multiline
              rows={2}
              placeholder="E.g., Monthly base salary"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this salary configuration?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserSalaryConfig; 