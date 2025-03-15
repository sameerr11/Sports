import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  alpha
} from '@mui/material';
import {
  Search,
  FilterList,
  Check,
  Visibility,
  ArrowBack,
  Refresh
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const AdminFeedbackList = () => {
  const theme = useTheme();
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [detailsDialog, setDetailsDialog] = useState({ open: false, feedback: null });
  const [statusDialog, setStatusDialog] = useState({ open: false, feedback: null, newStatus: '' });

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    filterFeedbacks();
  }, [feedbacks, searchTerm, statusFilter, roleFilter]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/feedback');
      setFeedbacks(response.data);
      setFilteredFeedbacks(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load feedback data. Please try again.');
      setLoading(false);
    }
  };

  const filterFeedbacks = () => {
    let filtered = [...feedbacks];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (feedback) =>
          feedback.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((feedback) => feedback.status === statusFilter);
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter((feedback) => feedback.role === roleFilter);
    }

    setFilteredFeedbacks(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
  };

  const handleViewDetails = (feedback) => {
    setDetailsDialog({ open: true, feedback });
  };

  const handleCloseDetails = () => {
    setDetailsDialog({ open: false, feedback: null });
  };

  const openStatusDialog = (feedback) => {
    setStatusDialog({ open: true, feedback, newStatus: feedback.status });
  };

  const closeStatusDialog = () => {
    setStatusDialog({ open: false, feedback: null, newStatus: '' });
  };

  const updateFeedbackStatus = async () => {
    try {
      const { feedback, newStatus } = statusDialog;
      
      await api.put(`/feedback/${feedback._id}`, { status: newStatus });
      
      // Update local state
      const updatedFeedbacks = feedbacks.map((item) => 
        item._id === feedback._id ? { ...item, status: newStatus } : item
      );
      
      setFeedbacks(updatedFeedbacks);
      closeStatusDialog();
    } catch (err) {
      setError('Failed to update feedback status. Please try again.');
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'reviewed':
        return 'info';
      case 'pending':
      default:
        return 'default';
    }
  };

  const getRoleChipColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'supervisor':
        return 'warning';
      case 'coach':
        return 'info';
      case 'parent':
        return 'primary';
      case 'player':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          to="/admin"
          startIcon={<ArrowBack />}
          sx={{ mb: 2 }}
        >
          Back to Admin Dashboard
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Feedback Management
          </Typography>
          <Button 
            startIcon={<Refresh />} 
            onClick={fetchFeedbacks}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              displayEmpty
              startAdornment={<FilterList sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="reviewed">Reviewed</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <Select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              displayEmpty
              startAdornment={<FilterList sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="supervisor">Supervisor</MenuItem>
              <MenuItem value="coach">Coach</MenuItem>
              <MenuItem value="parent">Parent</MenuItem>
              <MenuItem value="player">Player</MenuItem>
              <MenuItem value="cashier">Cashier</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredFeedbacks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="textSecondary">
              No feedback found matching your filters.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFeedbacks.map((feedback) => (
                  <TableRow key={feedback._id} hover>
                    <TableCell>
                      {format(new Date(feedback.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{feedback.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={feedback.role} 
                        size="small" 
                        color={getRoleChipColor(feedback.role)}
                      />
                    </TableCell>
                    <TableCell>
                      {feedback.message.length > 50
                        ? `${feedback.message.substring(0, 50)}...`
                        : feedback.message}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={feedback.status} 
                        size="small" 
                        color={getStatusChipColor(feedback.status)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleViewDetails(feedback)}
                          title="View Details"
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => openStatusDialog(feedback)}
                          title="Update Status"
                        >
                          <Check />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Feedback Details Dialog */}
      <Dialog
        open={detailsDialog.open}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        {detailsDialog.feedback && (
          <>
            <DialogTitle>
              Feedback Details
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Submitted by
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">
                    {detailsDialog.feedback.email}
                  </Typography>
                  <Chip 
                    label={detailsDialog.feedback.role} 
                    size="small" 
                    color={getRoleChipColor(detailsDialog.feedback.role)}
                  />
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Date
                </Typography>
                <Typography variant="body1">
                  {format(new Date(detailsDialog.feedback.createdAt), 'MMMM dd, yyyy h:mm a')}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Chip 
                  label={detailsDialog.feedback.status} 
                  color={getStatusChipColor(detailsDialog.feedback.status)}
                />
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Message
                </Typography>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                    mt: 1,
                    maxHeight: '250px',
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {detailsDialog.feedback.message}
                  </Typography>
                </Paper>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>Close</Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  handleCloseDetails();
                  openStatusDialog(detailsDialog.feedback);
                }}
              >
                Update Status
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={closeStatusDialog}
      >
        <DialogTitle>Update Feedback Status</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Choose a new status for this feedback:
          </DialogContentText>
          <FormControl fullWidth>
            <Select
              value={statusDialog.newStatus || ''}
              onChange={(e) => setStatusDialog({...statusDialog, newStatus: e.target.value})}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="reviewed">Reviewed</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeStatusDialog}>Cancel</Button>
          <Button onClick={updateFeedbackStatus} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminFeedbackList; 