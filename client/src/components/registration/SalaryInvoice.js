import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  FormHelperText,
  Divider,
  Link
} from '@mui/material';
import { Send as SendIcon, Print as PrintIcon, Info as InfoIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { getAllUsers } from '../../services/userService';
import { createSalaryInvoice } from '../../services/registrationService';
import { getRoleSalaryByRole } from '../../services/roleSalaryService';
import { formatCurrency } from '../../utils/format';
import { isAdmin } from '../../services/authService';
import ultrasLogo from '../../assets/images/ultras_logo.png';

const SalaryInvoice = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState({
    userId: '',
    amount: '',
    description: '',
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Pending',
    invoiceNumber: generateInvoiceNumber()
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // Generate random invoice number
  function generateInvoiceNumber() {
    const prefix = 'SAL';
    // Use current date in YYMMDD format
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    // Add a small random number (1-100)
    const random = Math.floor(Math.random() * 100) + 1;
    return `${prefix}-${year}${month}${day}-${random}`;
  }

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      // Filter only staff (not players)
      const staffUsers = data.filter(user => 
        ['admin', 'supervisor', 'coach', 'cashier', 'support', 'accounting'].includes(user.role)
      );
      setUsers(staffUsers);
    } catch (err) {
      console.error('Error fetching staff users:', err);
      setError('Failed to load staff users');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // If the user ID has changed, try to get the salary for that user's role
    if (name === 'userId' && value) {
      try {
        setUserLoading(true);
        // Find the selected user
        const selectedUser = users.find(user => user._id === value);
        if (selectedUser) {
          let roleKey = selectedUser.role;
          
          // For supervisors, check their specific supervisor type
          if (selectedUser.role === 'supervisor' && selectedUser.supervisorType) {
            roleKey = `supervisor-${selectedUser.supervisorType}`;
          }
          
          // Get the predefined salary for this role
          let roleSalary = await getRoleSalaryByRole(roleKey);
          
          // If no specific supervisor type salary is found, fall back to generic supervisor
          if (!roleSalary && selectedUser.role === 'supervisor') {
            roleSalary = await getRoleSalaryByRole('supervisor');
          }
          
          if (roleSalary) {
            // Update the form with the predefined salary amount and description
            setFormData(prevData => ({
              ...prevData,
              amount: roleSalary.amount,
              description: roleSalary.description || prevData.description || `Monthly salary for ${selectedUser.firstName} ${selectedUser.lastName}`
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching role salary:', err);
      } finally {
        setUserLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.amount) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    try {
      setSubmitting(true);
      await createSalaryInvoice(formData);
      setSuccess(true);
      setSnackbar({
        open: true,
        message: 'Salary invoice created successfully',
        severity: 'success'
      });
      
      // Reset form after successful submission
      setFormData({
        userId: '',
        amount: '',
        description: '',
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Pending',
        invoiceNumber: generateInvoiceNumber()
      });
    } catch (err) {
      console.error('Error creating salary invoice:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.msg || 'Failed to create salary invoice',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = () => {
    if (!formData.userId || !formData.amount) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }
    setPreviewOpen(true);
  };

  const handlePrint = () => {
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
          <title>Salary Invoice #${formData.invoiceNumber}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 1cm;
              font-size: 12px;
            }
            .invoice {
              width: 21cm;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .logo {
              max-width: 80px;
              max-height: 80px;
              margin: 0 auto 10px;
              display: block;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              margin: 5px 0;
            }
            .invoice-title {
              font-size: 18px;
              font-weight: bold;
              margin: 8px 0;
            }
            .invoice-details {
              margin: 5px 0;
            }
            .divider {
              border-top: 1px solid #000;
              margin: 15px 0;
            }
            .flex-container {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .flex-item {
              flex: 1;
            }
            .text-right {
              text-align: right;
            }
            .bold {
              font-weight: bold;
            }
            .mb-10 {
              margin-bottom: 10px;
            }
            .mt-20 {
              margin-top: 20px;
            }
            .text-center {
              text-align: center;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <img src="${ultrasLogo}" alt="Ultras Logo" class="logo">
              <div class="company-name">SPORTS MANAGEMENT</div>
              <div class="invoice-title">SALARY INVOICE</div>
              <div class="invoice-details">Invoice #: ${formData.invoiceNumber}</div>
              <div class="invoice-details">Date: ${new Date().toLocaleDateString()}</div>
            </div>
            ${content.innerHTML}
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
  };

  const getUserName = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? `${user.firstName} ${user.lastName}` : '';
  };

  const getUserRole = (userId) => {
    const user = users.find(u => u._id === userId);
    return user ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Issue Salary Invoice
      </Typography>
      
      {isAdmin() && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          icon={<InfoIcon />}
        >
          You can configure default salaries for each role in the{' '}
          <Link component={RouterLink} to="/admin/salary-config">
            Salary Configuration
          </Link>{' '}
          page.
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="staff-select-label">Staff Member</InputLabel>
                <Select
                  labelId="staff-select-label"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  label="Staff Member"
                >
                  {users.map(user => (
                    <MenuItem key={user._id} value={user._id}>
                      {`${user.firstName} ${user.lastName} (${user.role === 'supervisor' && user.supervisorType ? 
                        `${user.supervisorType} Supervisor` : 
                        user.role})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Amount"
                name="amount"
                type="number"
                InputProps={{ 
                  inputProps: { min: 0, step: "0.01" },
                  endAdornment: userLoading && <CircularProgress size={20} />,
                  readOnly: !isAdmin()
                }}
                value={formData.amount}
                onChange={isAdmin() ? handleChange : undefined}
                disabled={!isAdmin()}
                helperText={isAdmin() 
                  ? "Amount will auto-populate based on staff role if configured" 
                  : "Amount is automatically set based on staff role configured by admin"}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={2}
                value={formData.description}
                onChange={handleChange}
                placeholder="E.g., Monthly salary for October 2023"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  label="Payment Method"
                >
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                  <MenuItem value="Check">Check</MenuItem>
                  <MenuItem value="Cash">Cash</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                  label="Payment Status"
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Invoice Number"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                disabled
                helperText="Auto-generated"
              />
            </Grid>
            
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setPreviewOpen(true)}
                disabled={!formData.userId || !formData.amount}
                startIcon={<PrintIcon />}
              >
                Preview Invoice
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submitting || !formData.userId || !formData.amount}
                startIcon={submitting ? <CircularProgress size={24} /> : <SendIcon />}
              >
                {submitting ? 'Creating...' : 'Issue Invoice'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Salary Invoice Preview</DialogTitle>
        <DialogContent>
          <div id="invoice-to-print">
            <div style={{ padding: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <img src={ultrasLogo} alt="Ultras Logo" style={{ maxWidth: '80px', maxHeight: '80px', margin: '0 auto 10px', display: 'block' }} />
                <h1 style={{ margin: '5px 0', fontSize: '24px', fontWeight: 'bold' }}>SPORTS MANAGEMENT</h1>
                <h2 style={{ margin: '8px 0', fontSize: '18px', fontWeight: 'bold' }}>SALARY INVOICE</h2>
                <p style={{ margin: '4px 0' }}>Invoice #: {formData.invoiceNumber}</p>
                <p style={{ margin: '4px 0' }}>Date: {new Date().toLocaleDateString()}</p>
              </div>
              
              <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #000' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0' }}>Bill To:</h3>
                  <p style={{ margin: '5px 0' }}>{getUserName(formData.userId)}</p>
                  <p style={{ margin: '5px 0', color: '#666' }}>Position: {getUserRole(formData.userId)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>Company Address:</h3>
                  <p style={{ margin: '5px 0', color: '#666' }}>123 Sports Avenue</p>
                  <p style={{ margin: '5px 0', color: '#666' }}>City, State, ZIP</p>
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Payment Details:</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: '5px 0', color: '#666' }}>Description:</p>
                    <p style={{ margin: '5px 0' }}>{formData.description || 'Salary Payment'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '5px 0', color: '#666' }}>Amount:</p>
                    <p style={{ margin: '5px 0', fontSize: '18px', fontWeight: 'bold' }}>{formatCurrency(formData.amount || 0)}</p>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: '30px' }}>
                <p style={{ margin: '5px 0', color: '#666' }}>Payment Method: {formData.paymentMethod}</p>
                <p style={{ margin: '5px 0', color: '#666' }}>Payment Status: {formData.paymentStatus}</p>
              </div>
              
              <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <p style={{ margin: '5px 0' }}>Thank you for your service!</p>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default SalaryInvoice; 