import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Print as PrintIcon,
  Payments as PaymentsIcon,
  Warning as WarningIcon,
  DeleteOutline as DeleteIcon
} from '@mui/icons-material';
import { getUtilityBills, updateUtilityBill, deleteUtilityBill } from '../../services/utilityService';
import { formatCurrency } from '../../utils/format';
import { isAdmin } from '../../services/authService';

const UtilityBillList = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBill, setSelectedBill] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const userIsAdmin = isAdmin();

  useEffect(() => {
    fetchUtilityBills();
  }, []);

  const fetchUtilityBills = async () => {
    try {
      setLoading(true);
      const data = await getUtilityBills();
      setBills(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching utility bills:', err);
      setError('Failed to load utility bills');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (bill) => {
    setSelectedBill(bill);
    setDetailsOpen(true);
  };

  const handleMarkAsPaid = async (billId) => {
    try {
      setUpdating(true);
      await updateUtilityBill(billId, { paymentStatus: 'Paid' });
      
      // Update local state
      setBills(prevBills => 
        prevBills.map(bill => 
          bill._id === billId 
            ? { ...bill, paymentStatus: 'Paid', paidDate: new Date() } 
            : bill
        )
      );
      
      // If currently selected bill is being updated
      if (selectedBill && selectedBill._id === billId) {
        setSelectedBill(prev => ({
          ...prev,
          paymentStatus: 'Paid',
          paidDate: new Date()
        }));
      }
      
      setSnackbar({
        open: true,
        message: 'Bill marked as paid',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating bill:', err);
      setSnackbar({
        open: true,
        message: err.toString() || 'Failed to update bill',
        severity: 'error'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (bill) => {
    setBillToDelete(bill);
    setConfirmDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!billToDelete) return;
    
    try {
      setUpdating(true);
      await deleteUtilityBill(billToDelete._id);
      
      // Remove from state
      setBills(prevBills => prevBills.filter(bill => bill._id !== billToDelete._id));
      
      setSnackbar({
        open: true,
        message: 'Bill deleted successfully',
        severity: 'success'
      });
      
      // Close dialogs
      setConfirmDialogOpen(false);
      if (selectedBill && selectedBill._id === billToDelete._id) {
        setDetailsOpen(false);
      }
    } catch (err) {
      console.error('Error deleting bill:', err);
      setSnackbar({
        open: true,
        message: err.toString() || 'Failed to delete bill',
        severity: 'error'
      });
    } finally {
      setUpdating(false);
      setBillToDelete(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Overdue':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid':
        return <CheckCircleIcon fontSize="small" />;
      case 'Overdue':
        return <WarningIcon fontSize="small" />;
      default:
        return <PaymentsIcon fontSize="small" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Utility Bills
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/utilities/new"
        >
          Add Utility Bill
        </Button>
      </Box>

      {bills.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">No utility bills found</Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bill #</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bills
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((bill) => (
                    <TableRow key={bill._id}>
                      <TableCell>{bill.billNumber}</TableCell>
                      <TableCell>{bill.billType}</TableCell>
                      <TableCell>{bill.vendor}</TableCell>
                      <TableCell>{formatCurrency(bill.amount)}</TableCell>
                      <TableCell>{formatDate(bill.dueDate)}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(bill.paymentStatus)}
                          label={bill.paymentStatus}
                          color={getStatusColor(bill.paymentStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleViewDetails(bill)}
                          title="View Details"
                        >
                          <ViewIcon />
                        </IconButton>
                        
                        {bill.paymentStatus === 'Pending' && (
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handleMarkAsPaid(bill._id)}
                            disabled={updating}
                            title="Mark as Paid"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        )}
                        
                        {userIsAdmin && (
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteClick(bill)}
                            disabled={updating}
                            title="Delete Bill"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={bills.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Utility Bill Details</DialogTitle>
        {selectedBill && (
          <DialogContent>
            <Card variant="outlined" sx={{ mt: 2, p: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" mb={3}>
                  <Box>
                    <Typography variant="h6">{selectedBill.billType} BILL</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Bill #: {selectedBill.billNumber}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Date: {formatDate(selectedBill.billDate)}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="h6">
                      <Chip
                        label={selectedBill.paymentStatus}
                        color={getStatusColor(selectedBill.paymentStatus)}
                      />
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Due Date: {formatDate(selectedBill.dueDate)}
                    </Typography>
                  </Box>
                </Box>
                
                <Box mb={4}>
                  <Typography variant="subtitle1" gutterBottom>Vendor:</Typography>
                  <Typography variant="body1">
                    {selectedBill.vendor}
                  </Typography>
                </Box>
                
                <Box mb={3}>
                  <Typography variant="subtitle1" gutterBottom>Bill Details:</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} textAlign="right">
                      <Typography variant="body2">Amount:</Typography>
                      <Typography variant="h6">
                        {formatCurrency(selectedBill.amount)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                <Box mt={4}>
                  <Typography variant="body2" color="textSecondary">
                    Payment Method: Cash
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Created By: {selectedBill.createdBy ? 
                      `${selectedBill.createdBy.firstName} ${selectedBill.createdBy.lastName}` : 
                      'Unknown'}
                  </Typography>
                  {selectedBill.paidDate && (
                    <Typography variant="body2" color="textSecondary">
                      Paid Date: {formatDate(selectedBill.paidDate)}
                    </Typography>
                  )}
                  {selectedBill.paidBy && (
                    <Typography variant="body2" color="textSecondary">
                      Paid By: {`${selectedBill.paidBy.firstName} ${selectedBill.paidBy.lastName}`}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </DialogContent>
        )}
        <DialogActions>
          {selectedBill && selectedBill.paymentStatus === 'Pending' && (
            <Button 
              onClick={() => handleMarkAsPaid(selectedBill._id)} 
              color="success" 
              variant="contained"
              disabled={updating}
              startIcon={<CheckCircleIcon />}
            >
              Mark as Paid
            </Button>
          )}
          
          {selectedBill && userIsAdmin && (
            <Button 
              onClick={() => handleDeleteClick(selectedBill)} 
              color="error" 
              variant="outlined"
              disabled={updating}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          )}
          
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={() => {
              window.print();
            }}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this bill? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={updating}
          >
            {updating ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UtilityBillList; 