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
            <div id="bill-to-print">
              <Card variant="outlined" sx={{ mt: 2, p: 2 }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <img src="/logo192.png" alt="Company Logo" style={{ maxWidth: '80px', maxHeight: '80px', margin: '0 auto 10px', display: 'block' }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold', margin: '5px 0' }}>SPORTS MANAGEMENT</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', margin: '8px 0' }}>{selectedBill.billType} BILL</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ margin: '4px 0' }}>
                      Bill #: {selectedBill.billNumber}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ margin: '4px 0' }}>
                      Date: {formatDate(selectedBill.billDate)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={3}>
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>Vendor:</Typography>
                      <Typography variant="body1">
                        {selectedBill.vendor}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="subtitle1" gutterBottom>Due Date:</Typography>
                      <Typography variant="body1">
                        {formatDate(selectedBill.dueDate)}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <Chip
                          label={selectedBill.paymentStatus}
                          color={getStatusColor(selectedBill.paymentStatus)}
                          size="small"
                        />
                      </Typography>
                    </Box>
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
                  
                  <Box mt={4} textAlign="center">
                    <Typography variant="body2">
                      Thank you for your service.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </div>
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
              const content = document.getElementById('bill-to-print');
              
              if (!content) {
                console.error('Bill content not found');
                return;
              }
              
              // Create a new iframe
              const printFrame = document.createElement('iframe');
              
              // Make it invisible
              printFrame.style.position = 'fixed';
              printFrame.style.right = '0';
              printFrame.style.bottom = '0';
              printFrame.style.width = '0';
              printFrame.style.height = '0';
              printFrame.style.border = '0';
              
              // Add to document
              document.body.appendChild(printFrame);
              
              // Get the iframe document
              const frameDoc = printFrame.contentWindow || printFrame.contentDocument.document || printFrame.contentDocument;
              
              // Write the print content
              frameDoc.document.write(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>${selectedBill.billType} Bill #${selectedBill.billNumber}</title>
                    <style>
                      body {
                        font-family: 'Arial', sans-serif;
                        margin: 0;
                        padding: 20px;
                      }
                      .invoice-container {
                        max-width: 800px;
                        margin: 0 auto;
                        border: 1px solid #e0e0e0;
                        border-radius: 4px;
                        padding: 20px;
                      }
                      .text-center {
                        text-align: center;
                      }
                      .mb-3 {
                        margin-bottom: 24px;
                      }
                      .company-logo {
                        max-width: 80px;
                        max-height: 80px;
                        margin: 0 auto 10px;
                        display: block;
                      }
                      .company-name {
                        font-weight: bold;
                        font-size: 24px;
                        margin: 5px 0;
                      }
                      .invoice-title {
                        font-weight: bold;
                        font-size: 20px;
                        margin: 8px 0;
                      }
                      .invoice-details {
                        margin: 4px 0;
                        color: #666;
                      }
                      .flex-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 16px;
                      }
                      .bill-to {
                        font-weight: 600;
                        margin-bottom: 8px;
                      }
                      .text-right {
                        text-align: right;
                      }
                      .payment-details {
                        margin-bottom: 32px;
                      }
                      .payment-grid {
                        display: flex;
                        justify-content: space-between;
                      }
                      .payment-grid-item {
                        width: 48%;
                      }
                      .payment-info {
                        margin-top: 32px;
                        color: #666;
                      }
                      .amount {
                        font-size: 20px;
                        font-weight: 600;
                      }
                      .status-chip {
                        display: inline-block;
                        padding: 4px 8px;
                        border-radius: 16px;
                        font-size: 12px;
                        color: white;
                        background-color: #ff9800;
                      }
                      .status-chip.success {
                        background-color: #4caf50;
                      }
                      .status-chip.error {
                        background-color: #f44336;
                      }
                      .thank-you {
                        text-align: center;
                        margin-top: 32px;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="invoice-print">
                      <div class="invoice-container">
                        <div class="text-center mb-3">
                          <img src="/logo192.png" alt="Company Logo" class="company-logo" />
                          <h1 class="company-name">SPORTS MANAGEMENT</h1>
                          <h2 class="invoice-title">${selectedBill.billType} BILL</h2>
                          <p class="invoice-details">Bill #: ${selectedBill.billNumber}</p>
                          <p class="invoice-details">Date: ${formatDate(selectedBill.billDate)}</p>
                        </div>
                        
                        <div class="flex-row">
                          <div>
                            <p class="bill-to">Vendor:</p>
                            <p>${selectedBill.vendor}</p>
                          </div>
                          <div class="text-right">
                            <p class="bill-to">Due Date:</p>
                            <p>${formatDate(selectedBill.dueDate)}</p>
                            <div style="margin-top: 8px;">
                              <span class="status-chip ${selectedBill.paymentStatus === 'Paid' 
                                ? 'success' 
                                : selectedBill.paymentStatus === 'Overdue' 
                                  ? 'error' 
                                  : ''}">${selectedBill.paymentStatus}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div class="payment-details">
                          <p class="bill-to">Bill Details:</p>
                          <div class="payment-grid">
                            <div class="payment-grid-item">
                              <p class="invoice-details">Description:</p>
                              <p>${selectedBill.billType} Payment</p>
                            </div>
                            <div class="payment-grid-item text-right">
                              <p class="invoice-details">Amount:</p>
                              <p class="amount">${formatCurrency(selectedBill.amount)}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div class="payment-info">
                          <p class="invoice-details">Payment Method: Cash</p>
                          <p class="invoice-details">Created By: ${selectedBill.createdBy ? 
                            `${selectedBill.createdBy.firstName} ${selectedBill.createdBy.lastName}` : 
                            'Unknown'}</p>
                          ${selectedBill.paidDate ? 
                            `<p class="invoice-details">Paid Date: ${formatDate(selectedBill.paidDate)}</p>` : 
                            ''}
                          ${selectedBill.paidBy ? 
                            `<p class="invoice-details">Paid By: ${selectedBill.paidBy.firstName} ${selectedBill.paidBy.lastName}</p>` : 
                            ''}
                        </div>
                        
                        <div class="thank-you">
                          <p>Thank you for your service.</p>
                        </div>
                      </div>
                    </div>
                  </body>
                </html>
              `);
              
              frameDoc.document.close();
              
              // Print the iframe after it loads
              setTimeout(() => {
                frameDoc.focus();
                frameDoc.print();
                
                // Remove the iframe after printing
                setTimeout(() => {
                  document.body.removeChild(printFrame);
                }, 500);
              }, 500);
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