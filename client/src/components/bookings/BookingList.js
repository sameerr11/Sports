import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, Typography, Box, Button, Paper, Chip, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Alert, useTheme, alpha
} from '@mui/material';
import { 
  Event, Cancel, CheckCircle, Visibility, 
  SportsTennis, AccessTime, CalendarMonth
} from '@mui/icons-material';
import { getBookings, getUserBookings, cancelBooking, updateBookingStatus } from '../../services/bookingService';
import { isAdmin } from '../../services/authService';
import AlertMessage from '../common/AlertMessage';
import { getSportIcon } from '../../utils/sportIcons';

const BookingList = ({ userOnly = false }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [statusDialog, setStatusDialog] = useState({ open: false, bookingId: null, status: '' });
  const [cancelDialog, setCancelDialog] = useState({ open: false, bookingId: null });
  
  const canManageBookings = isAdmin();
  const theme = useTheme();

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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography variant="h6" sx={{ ml: 2 }}>Loading bookings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 4 }, py: 4, bgcolor: '#f8f9fa' }}>
      <Box className="bookings-header" sx={{ mb: 5 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            fontWeight: 800, 
            color: theme.palette.primary.dark,
            mb: 1,
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 80,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.palette.primary.main
            }
          }}
        >
          {userOnly ? 'My Bookings' : 'All Bookings'}
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary" 
          sx={{ 
            fontSize: '1.1rem', 
            maxWidth: '800px',
            mt: 2 
          }}
        >
          {userOnly 
            ? 'Manage your court reservations and view your booking history' 
            : 'Overview of all court bookings and reservations in the system'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <AlertMessage severity="success" message={successMessage} />}

      {bookings.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          py: 8,
          animation: 'fadeInUp 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)' 
        }}>
          <Box sx={{ 
            width: 100, 
            height: 100, 
            mb: 3, 
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CalendarMonth sx={{ fontSize: 50, color: theme.palette.grey[500] }} />
          </Box>
          <Typography variant="h5" sx={{ color: theme.palette.grey[800], fontWeight: 600, mb: 1 }}>
            No bookings found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center', maxWidth: 500 }}>
            {userOnly 
              ? 'You have no court bookings. Make a reservation to get started.' 
              : 'No bookings found in the system.'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        }}>
          <Table sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow>
                <TableCell width="15%">Court</TableCell>
                <TableCell width="18%">Date & Time</TableCell>
                <TableCell width="12%">Duration</TableCell>
                <TableCell width="12%">Purpose</TableCell>
                <TableCell width="12%">Status</TableCell>
                <TableCell width="12%">Price</TableCell>
                <TableCell width="19%">Actions</TableCell>
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
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {booking.court ? 
                          React.cloneElement(getSportIcon(booking.court.sportType), { sx: { mr: 1 } }) : 
                          getSportIcon(null, { sx: { mr: 1 } })}
                        <Typography variant="body2">
                          {booking.court ? booking.court.name : 'Court not available'}
                        </Typography>
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
                    <TableCell>
                      {booking.purpose === 'Rental' ? 
                        `$${booking.totalPrice.toFixed(2)}` : 
                        <Chip label="Free" color="success" size="small" />
                      }
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', minWidth: '150px' }}>
                        {canManageBookings && booking.status !== 'Cancelled' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<CheckCircle />}
                            onClick={() => handleStatusDialogOpen(booking._id, booking.status)}
                            sx={{ mb: 1, minWidth: '90px' }}
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
                            sx={{ minWidth: '90px' }}
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
    </Box>
  );
};

export default BookingList; 