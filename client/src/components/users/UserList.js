import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getAllUsers, deleteUser, getUsersByRole } from '../../services/userService';
import { isAdmin, isSupport } from '../../services/authService';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null });
  const { role } = useParams();
  const admin = isAdmin();
  const support = isSupport();
  const pageTitle = role ? `${role.charAt(0).toUpperCase() + role.slice(1)}s` : 'User Management';

  useEffect(() => {
    fetchUsers();
  }, [role]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let data;
      
      if (role) {
        data = await getUsersByRole(role);
      } else {
        data = await getAllUsers();
      }
      
      setUsers(data);
      setError('');
    } catch (err) {
      setError('Failed to load users. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (userId) => {
    setDeleteDialog({ open: true, userId });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(deleteDialog.userId);
      setUsers(users.filter(user => user._id !== deleteDialog.userId));
      setDeleteDialog({ open: false, userId: null });
    } catch (err) {
      setError('Failed to delete user. Please try again.');
      console.error(err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, userId: null });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'supervisor':
        return 'warning';
      case 'cashier':
        return 'info';
      case 'coach':
        return 'success';
      case 'player':
        return 'primary';
      case 'parent':
        return 'secondary';
      case 'accounting':
        return 'info';
      case 'support':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h2">
          {pageTitle}
        </Typography>
        {admin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            to="/users/new"
          >
            Add User
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.role === 'supervisor' && user.supervisorType && (
                      <Chip 
                        label={user.supervisorType.charAt(0).toUpperCase() + user.supervisorType.slice(1)} 
                        color="secondary"
                        size="small"
                      />
                    )}
                    {user.role === 'supervisor' && user.supervisorType === 'sports' && user.supervisorSportTypes && user.supervisorSportTypes.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {user.supervisorSportTypes.map((sport, index) => (
                          <Chip
                            key={index}
                            label={sport}
                            variant="outlined"
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.isActive ? 'Active' : 'Inactive'} 
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      component={Link} 
                      to={`/users/edit/${user._id}`} 
                      color="primary"
                      title="Edit user"
                    >
                      <EditIcon />
                    </IconButton>
                    {admin && (
                      <IconButton 
                        onClick={() => handleDeleteClick(user._id)} 
                        color="error"
                        title="Delete user"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserList; 