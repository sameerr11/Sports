import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { getSalaryInvoices, updateSalaryInvoiceStatus } from '../../services/registrationService';
import { formatCurrency } from '../../utils/format';
import ultrasLogo from '../../assets/images/ultras_logo.png';

const SalaryInvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchSalaryInvoices();
  }, []);

  const fetchSalaryInvoices = async () => {
    try {
      setLoading(true);
      const data = await getSalaryInvoices();
      setInvoices(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching salary invoices:', err);
      setError('Failed to load salary invoices');
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

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setDetailsOpen(true);
  };

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      setUpdating(true);
      await updateSalaryInvoiceStatus(invoiceId, 'Paid');
      
      // Update the local state
      setInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice._id === invoiceId 
            ? { ...invoice, paymentStatus: 'Paid', paidDate: new Date() } 
            : invoice
        )
      );
      
      // If the currently selected invoice is the one being updated, update it too
      if (selectedInvoice && selectedInvoice._id === invoiceId) {
        setSelectedInvoice(prev => ({
          ...prev,
          paymentStatus: 'Paid',
          paidDate: new Date()
        }));
      }
      
      setSnackbar({
        open: true,
        message: 'Payment status updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating payment status:', err);
      setSnackbar({
        open: true,
        message: err.toString() || 'Failed to update payment status',
        severity: 'error'
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    return status === 'Paid' ? 'success' : 'warning';
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
          Staff Salary Invoices
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/registrations/salary"
        >
          Create Salary Invoice
        </Button>
      </Box>

      {invoices.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">No salary invoices found</Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Staff Member</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        {invoice.userId ? 
                          `${invoice.userId.firstName} ${invoice.userId.lastName}` : 
                          'Unknown'}
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{formatDate(invoice.issuedDate)}</TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.paymentStatus}
                          color={getStatusColor(invoice.paymentStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleViewDetails(invoice)}
                        >
                          <ViewIcon />
                        </IconButton>
                        {invoice.paymentStatus === 'Pending' && (
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handleMarkAsPaid(invoice._id)}
                            disabled={updating}
                            title="Mark as Paid"
                          >
                            <CheckCircleIcon />
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
            count={invoices.length}
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
        <DialogTitle>Salary Invoice Details</DialogTitle>
        {selectedInvoice && (
          <DialogContent>
            <div id="invoice-to-print">
              <Card variant="outlined" sx={{ mt: 2, p: 2 }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <img src={ultrasLogo} alt="Ultras Logo" style={{ maxWidth: '80px', maxHeight: '80px', margin: '0 auto 10px', display: 'block' }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold', margin: '5px 0' }}>SPORTS MANAGEMENT</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', margin: '8px 0' }}>SALARY INVOICE</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ margin: '4px 0' }}>
                      Invoice #: {selectedInvoice.invoiceNumber}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ margin: '4px 0' }}>
                      Date: {formatDate(selectedInvoice.issuedDate)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>Bill To:</Typography>
                      <Typography variant="body1">
                        {selectedInvoice.userId ? 
                          `${selectedInvoice.userId.firstName} ${selectedInvoice.userId.lastName}` : 
                          'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Position: {selectedInvoice.userId?.role}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="subtitle1" gutterBottom>Company Address:</Typography>
                      <Typography variant="body2" color="textSecondary">
                        123 Sports Avenue
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        City, State, ZIP
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box mb={4}>
                    <Typography variant="subtitle1" gutterBottom>Payment Details:</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">Description:</Typography>
                        <Typography variant="body1">
                          {selectedInvoice.description || 'Salary Payment'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} textAlign="right">
                        <Typography variant="body2">Amount:</Typography>
                        <Typography variant="h6">
                          {formatCurrency(selectedInvoice.amount)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Box mt={4}>
                    <Typography variant="body2" color="textSecondary">
                      Payment Method: {selectedInvoice.paymentMethod}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Payment Status: {selectedInvoice.paymentStatus}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Issued By: {selectedInvoice.issuedBy ? 
                        `${selectedInvoice.issuedBy.firstName} ${selectedInvoice.issuedBy.lastName}` : 
                        'Unknown'}
                    </Typography>
                    {selectedInvoice.paidDate && (
                      <Typography variant="body2" color="textSecondary">
                        Paid Date: {formatDate(selectedInvoice.paidDate)}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        )}
        <DialogActions>
          {selectedInvoice && selectedInvoice.paymentStatus === 'Pending' && (
            <Button 
              onClick={() => handleMarkAsPaid(selectedInvoice._id)} 
              color="success" 
              variant="contained"
              disabled={updating}
              startIcon={<CheckCircleIcon />}
            >
              Mark as Paid
            </Button>
          )}
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={() => {
              const content = document.getElementById('invoice-to-print');
              
              if (!content) {
                console.error('Invoice content not found');
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
                    <title>Salary Invoice #${selectedInvoice.invoiceNumber}</title>
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
                    </style>
                  </head>
                  <body>
                    <div class="invoice-print">
                      <div class="invoice-container">
                        <div class="text-center mb-3">
                          <img src="${ultrasLogo}" alt="Ultras Logo" class="company-logo" />
                          <h1 class="company-name">SPORTS MANAGEMENT</h1>
                          <h2 class="invoice-title">SALARY INVOICE</h2>
                          <p class="invoice-details">Invoice #: ${selectedInvoice.invoiceNumber}</p>
                          <p class="invoice-details">Date: ${formatDate(selectedInvoice.issuedDate)}</p>
                        </div>
                        
                        <div class="flex-row">
                          <div>
                            <p class="bill-to">Bill To:</p>
                            <p>${selectedInvoice.userId ? 
                              `${selectedInvoice.userId.firstName} ${selectedInvoice.userId.lastName}` : 
                              'Unknown'}</p>
                            <p class="invoice-details">Position: ${selectedInvoice.userId?.role || 'Unknown'}</p>
                          </div>
                          <div class="text-right">
                            <p class="bill-to">Company Address:</p>
                            <p class="invoice-details">123 Sports Avenue</p>
                            <p class="invoice-details">City, State, ZIP</p>
                          </div>
                        </div>
                        
                        <div class="payment-details">
                          <p class="bill-to">Payment Details:</p>
                          <div class="payment-grid">
                            <div class="payment-grid-item">
                              <p class="invoice-details">Description:</p>
                              <p>${selectedInvoice.description || 'Salary Payment'}</p>
                            </div>
                            <div class="payment-grid-item text-right">
                              <p class="invoice-details">Amount:</p>
                              <p class="amount">${formatCurrency(selectedInvoice.amount)}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div class="payment-info">
                          <p class="invoice-details">Payment Method: ${selectedInvoice.paymentMethod}</p>
                          <p class="invoice-details">Payment Status: ${selectedInvoice.paymentStatus}</p>
                          <p class="invoice-details">Issued By: ${selectedInvoice.issuedBy ? 
                            `${selectedInvoice.issuedBy.firstName} ${selectedInvoice.issuedBy.lastName}` : 
                            'accounts test'}</p>
                          ${selectedInvoice.paidDate ? 
                            `<p class="invoice-details">Paid Date: ${formatDate(selectedInvoice.paidDate)}</p>` : 
                            ''}
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

export default SalaryInvoiceList; 