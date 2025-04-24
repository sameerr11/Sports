import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, Typography, Box, Button, Paper, Chip, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Alert, useTheme, alpha,
  TextField, Grid, IconButton, Tooltip
} from '@mui/material';
import { 
  Event, Cancel, CheckCircle, Visibility, 
  SportsTennis, AccessTime, CalendarMonth, FilterAlt, Clear,
  Payment as PaymentIcon, CheckCircleOutline
} from '@mui/icons-material';
import { getBookings, getUserBookings, cancelBooking, updateBookingStatus, updateBookingPaymentStatus } from '../../services/bookingService';
import { isAdmin, isBookingSupervisor, isAccounting } from '../../services/authService';
import AlertMessage from '../common/AlertMessage';
import { getSportIcon } from '../../utils/sportIcons';

const BookingList = ({ userOnly = false }) => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [statusDialog, setStatusDialog] = useState({ open: false, bookingId: null, status: '' });
  const [cancelDialog, setCancelDialog] = useState({ open: false, bookingId: null });
  const [paymentDialog, setPaymentDialog] = useState({ open: false, bookingId: null, isGuestBooking: false });
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(!userOnly);
  
  const canManageBookings = isAdmin() || isBookingSupervisor();
  const canManagePayments = isAdmin() || isBookingSupervisor() || isAccounting();
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
        setFilteredBookings(data);
        setLoading(false);
      } catch (err) {
        setError(err.toString());
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userOnly]);
  
  // Apply filters whenever filters change or bookings change
  useEffect(() => {
    if (bookings.length === 0) return;
    
    let result = [...bookings];
    
    // Apply date filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      result = result.filter(booking => new Date(booking.startTime) >= startDate);
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(booking => new Date(booking.startTime) <= endDate);
    }
    
    // Apply status filter
    if (filters.status) {
      result = result.filter(booking => booking.status === filters.status);
    }
    
    setFilteredBookings(result);
  }, [filters, bookings]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: ''
    });
  };

  const handleStatusDialogOpen = (bookingId, currentStatus, isGuestBooking) => {
    const id = isGuestBooking ? `guest-${bookingId}` : bookingId;
    setStatusDialog({ open: true, bookingId: id, status: currentStatus });
  };

  const handleStatusDialogClose = () => {
    setStatusDialog({ open: false, bookingId: null, status: '' });
  };

  const handleCancelDialogOpen = (bookingId, isGuestBooking) => {
    const id = isGuestBooking ? `guest-${bookingId}` : bookingId;
    setCancelDialog({ open: true, bookingId: id });
  };

  const handleCancelDialogClose = () => {
    setCancelDialog({ open: false, bookingId: null });
  };

  const handlePaymentDialogOpen = (bookingId, isGuestBooking) => {
    const id = isGuestBooking ? `guest-${bookingId}` : bookingId;
    setPaymentDialog({ open: true, bookingId: id, isGuestBooking });
  };

  const handlePaymentDialogClose = () => {
    setPaymentDialog({ open: false, bookingId: null, isGuestBooking: false });
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

  const handleMarkAsPaid = async () => {
    try {
      const { bookingId } = paymentDialog;
      await updateBookingPaymentStatus(bookingId, 'Paid');
      
      // Update booking in state
      setBookings(bookings.map(booking => {
        if ((booking._id === bookingId) || 
            (paymentDialog.isGuestBooking && `guest-${booking._id}` === bookingId)) {
          return { ...booking, paymentStatus: 'Paid' };
        }
        return booking;
      }));
      
      setSuccessMessage('Booking has been marked as paid');
      handlePaymentDialogClose();
      
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

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Unpaid':
        return 'warning';
      case 'Refunded':
        return 'error';
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

      {!userOnly && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Filters
            </Typography>
            <Box>
              <Tooltip title="Clear filters">
                <IconButton onClick={handleClearFilters} size="small">
                  <Clear />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="From Date"
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="To Date"
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Confirmed">Confirmed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

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
      ) : filteredBookings.length === 0 ? (
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
            <FilterAlt sx={{ fontSize: 50, color: theme.palette.grey[500] }} />
          </Box>
          <Typography variant="h5" sx={{ color: theme.palette.grey[800], fontWeight: 600, mb: 1 }}>
            No matching bookings
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center', maxWidth: 500 }}>
            No bookings match your current filter settings. Try adjusting your filters.
          </Typography>
          <Button variant="outlined" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ 
          borderRadius: 2,
          overflow: 'auto',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        }}>
          <Table sx={{ minWidth: 850, tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell width="15%">Court</TableCell>
                <TableCell width="18%">Date & Time</TableCell>
                <TableCell width="10%">Duration</TableCell>
                <TableCell width="10%">Purpose</TableCell>
                <TableCell width="10%">Status</TableCell>
                <TableCell width="10%">Payment</TableCell>
                <TableCell width="10%">Price</TableCell>
                <TableCell width="17%">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBookings.map((booking) => {
                const startTime = new Date(booking.startTime);
                const endTime = new Date(booking.endTime);
                const durationHours = ((endTime - startTime) / (1000 * 60 * 60)).toFixed(1);
                const isRental = booking.purpose === 'Rental';
                
                return (
                  <TableRow key={booking._id}>
                    <TableCell width="15%">
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {booking.court ? 
                          React.cloneElement(getSportIcon(booking.court.sportType), { sx: { mr: 1 } }) : 
                          getSportIcon(null, { sx: { mr: 1 } })}
                        <Typography variant="body2" noWrap>
                          {booking.court ? booking.court.name : 'Court not available'}
                        </Typography>
                      </Box>
                      {booking.isGuestBooking ? (
                        <Chip
                          size="small"
                          label="Guest Booking"
                          color="secondary"
                          sx={{ mt: 0.5, mr: 1 }}
                        />
                      ) : booking.team ? (
                        <Chip
                          size="small"
                          label={`Team: ${booking.team.name}`}
                          color="primary"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      ) : null}
                    </TableCell>
                    <TableCell width="18%">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Event sx={{ mr: 1, flexShrink: 0 }} />
                        <Typography variant="body2" noWrap>
                          {formatDateTime(booking.startTime)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" display="block" color="textSecondary" noWrap>
                        to {formatDateTime(booking.endTime)}
                      </Typography>
                      
                      {booking.isGuestBooking && (
                        <Chip
                          size="small"
                          label={`Guest: ${booking.user.firstName}`}
                          color="info"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </TableCell>
                    <TableCell width="10%">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTime sx={{ mr: 1, flexShrink: 0 }} />
                        <Typography noWrap>{durationHours} hours</Typography>
                      </Box>
                    </TableCell>
                    <TableCell width="10%">{booking.purpose}</TableCell>
                    <TableCell width="10%">
                      <Chip 
                        label={booking.status} 
                        color={getStatusColor(booking.status)} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell width="10%">
                      {isRental ? (
                        <Chip 
                          label={booking.paymentStatus || 'Unpaid'} 
                          color={getPaymentStatusColor(booking.paymentStatus || 'Unpaid')} 
                          size="small"
                          icon={<PaymentIcon fontSize="small" />}
                        />
                      ) : (
                        <Chip 
                          label="N/A" 
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell width="10%">
                      {isRental ? 
                        `$${booking.totalPrice.toFixed(2)}` : 
                        <Chip label="Free" color="success" size="small" />
                      }
                    </TableCell>
                    <TableCell width="17%">
                      <Box>
                        {booking.isGuestBooking && (
                          <Typography variant="caption" display="block" color="textSecondary" sx={{ mb: 1 }} noWrap>
                            Reference: {booking.bookingReference}
                          </Typography>
                        )}
                        
                        {canManageBookings && booking.status !== 'Cancelled' && booking.status !== 'Completed' && (
                          <Button
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => handleStatusDialogOpen(booking._id, booking.status, booking.isGuestBooking)}
                            sx={{ mr: 1, mb: 1 }}
                          >
                            Update Status
                          </Button>
                        )}
                        
                        {canManagePayments && isRental && (booking.paymentStatus === 'Unpaid' || !booking.paymentStatus) && 
                         booking.status !== 'Cancelled' && booking.totalPrice > 0 && (
                          <Button
                            size="small"
                            color="success"
                            startIcon={<CheckCircleOutline />}
                            onClick={() => handlePaymentDialogOpen(booking._id, booking.isGuestBooking)}
                            sx={{ mr: 1, mb: 1 }}
                          >
                            Mark as Paid
                          </Button>
                        )}
                        
                        {booking.status !== 'Cancelled' && booking.status !== 'Completed' && (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleCancelDialogOpen(booking._id, booking.isGuestBooking)}
                            sx={{ mb: 1 }}
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

      {/* Mark as Paid Dialog */}
      <Dialog open={paymentDialog.open} onClose={handlePaymentDialogClose}>
        <DialogTitle>Mark Booking as Paid</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to mark this booking as paid? This will record the payment in the system and add it to revenue.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePaymentDialogClose}>Cancel</Button>
          <Button onClick={handleMarkAsPaid} color="success" variant="contained" startIcon={<CheckCircleOutline />}>
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingList; 