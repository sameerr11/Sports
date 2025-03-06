import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, Typography, Box, Button, Paper, Chip, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { 
  Event, Cancel, CheckCircle, Visibility, 
  SportsTennis, AccessTime
} from '@mui/icons-material';
import { getBookings, getUserBookings, cancelBooking, updateBookingStatus } from '../../services/bookingService';
import { isSupervisor } from '../../services/authService';
import AlertMessage from '../common/AlertMessage';

const BookingList = ({ userOnly = false }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [statusDialog, setStatusDialog] = useState({ open: false, bookingId: null, status: '' });
  const [cancelDialog, setCancelDialog] = useState({ open: false, bookingId: null });
  
  const canManageBookings = isSupervisor();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        let data;
        if (userOnly) {
          data = await getUserBookings();
        } else {
          data = await getBookings();
        }
        setBookings(data);
        setLoading(false);
      } catch (err) {
        setError(err.toString());
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userOnly]);

  const handleStatusDialogOpen = (bookingId, currentStatus) => {
    setStatusDialog({ open: true, bookingId, status: currentStatus });
  };

  const handleStatusDialogClose = () => {
    setStatusDialog({ open: false, bookingId: null, status: '' });
  };

  const handleCancelDialogOpen = (bookingId) => {
    setCancelDialog({ open: true, bookingId });
  };

  const handleCancelDialogClose = () => {
    setCancelDialog({ open: false, bookingId: null });
  };

  const handleStatusChange = (e) => {
    setStatusDialog(prev => ({
      ...prev,
      status: e.target.value
    }));
  };

  const handleStatusUpdate = async () => {
    try {
      const { bookingId, status } = statusDialog;
      await updateBookingStatus(bookingId, status);
      
      // Update booking in state
      setBookings(bookings.map(booking => 
        booking._id === bookingId ? { ...booking, status } : booking
      ));
      
      setSuccessMessage(`Booking status updated to ${status}`);
      handleStatusDialogClose();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err.toString());
    }
  };

  const handleCancelBooking = async () => {
    try {
      const { bookingId } = cancelDialog;
      await cancelBooking(bookingId);
      
      // Update booking in state
      setBookings(bookings.map(booking => 
        booking._id === bookingId ? { ...booking, status: 'Cancelled' } : booking
      ));
      
      setSuccessMessage('Booking cancelled successfully');
      handleCancelDialogClose();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err.toString());
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Cancelled':
        return 'error';
      case 'Completed':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <Typography>Loading bookings...</Typography>;
  }

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {userOnly ? 'My Bookings' : 'All Bookings'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <AlertMessage severity="success" message={successMessage} />}

      {bookings.length === 0 ? (
        <Alert severity="info">No bookings found.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Court</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => {
                const startTime = new Date(booking.startTime);
                const endTime = new Date(booking.endTime);
                const durationHours = ((endTime - startTime) / (1000 * 60 * 60)).toFixed(1);
                
                return (
                  <TableRow key={booking._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SportsTennis sx={{ mr: 1 }} />
                        {booking.court.name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Event sx={{ mr: 1 }} />
                        {formatDateTime(booking.startTime)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTime sx={{ mr: 1 }} />
                        {durationHours} hours
                      </Box>
                    </TableCell>
                    <TableCell>{booking.purpose}</TableCell>
                    <TableCell>
                      <Chip 
                        label={booking.status} 
                        color={getStatusColor(booking.status)} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>${booking.totalPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {canManageBookings && booking.status !== 'Cancelled' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<CheckCircle />}
                            onClick={() => handleStatusDialogOpen(booking._id, booking.status)}
                          >
                            Status
                          </Button>
                        )}
                        
                        {booking.status !== 'Cancelled' && booking.status !== 'Completed' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleCancelDialogOpen(booking._id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Status Update Dialog */}
      <Dialog open={statusDialog.open} onClose={handleStatusDialogClose}>
        <DialogTitle>Update Booking Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusDialog.status}
                onChange={handleStatusChange}
                label="Status"
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Confirmed">Confirmed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose}>Cancel</Button>
          <Button onClick={handleStatusUpdate} color="primary" variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <Dialog open={cancelDialog.open} onClose={handleCancelDialogClose}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialogClose}>No, Keep Booking</Button>
          <Button onClick={handleCancelBooking} color="error" variant="contained">
            Yes, Cancel Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookingList; 