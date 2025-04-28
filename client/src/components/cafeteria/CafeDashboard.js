import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Pagination,
  Tabs,
  Tab
} from '@mui/material';
import { formatCurrency } from '../../utils/format';
import { format } from 'date-fns';
import { Visibility, VisibilityOff, Receipt as ReceiptIcon, Search, Print as PrintIcon } from '@mui/icons-material';
import { getSetting, updateSetting, getSessionSummaries, getReceipts } from '../../services/cafeteriaService';
import ReceiptPrint from './ReceiptPrint';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const CafeDashboard = () => {
  const [sessionSummaries, setSessionSummaries] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgSessionRevenue, setAvgSessionRevenue] = useState(0);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [loadingPin, setLoadingPin] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [receiptError, setReceiptError] = useState('');
  const [summaryPage, setSummaryPage] = useState(1);
  const [receiptPage, setReceiptPage] = useState(1);
  const [summaryTotalPages, setSummaryTotalPages] = useState(1);
  const [receiptTotalPages, setReceiptTotalPages] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetailDialog, setSessionDetailDialog] = useState(false);

  useEffect(() => {
    // Load PIN from database
    fetchPin();
    // Load session summaries from database
    fetchSessionSummaries();
    // Load receipts
    fetchReceipts();
  }, []);

  const fetchSessionSummaries = async (pageNumber = 1) => {
    try {
      setLoadingSummaries(true);
      setSummaryError('');
      
      const params = {
        page: pageNumber,
        limit: 10
      };
      
      // Add date filters if set
      if (startDate) {
        params.startDate = format(startDate, 'yyyy-MM-dd');
      }
      
      if (endDate) {
        params.endDate = format(endDate, 'yyyy-MM-dd');
      }
      
      const result = await getSessionSummaries(params);
      
      if (result && result.sessions) {
        setSessionSummaries(result.sessions);
        
        if (result.pagination) {
          setSummaryPage(result.pagination.page);
          setSummaryTotalPages(result.pagination.pages);
        }
        
        // Calculate totals
        if (result.sessions.length > 0) {
          const total = result.sessions.reduce((sum, session) => sum + session.totalSales, 0);
          setTotalRevenue(total);
          setAvgSessionRevenue(total / result.sessions.length);
        } else {
          setTotalRevenue(0);
          setAvgSessionRevenue(0);
        }
      }
    } catch (error) {
      console.error('Error fetching session summaries:', error);
      setSummaryError('Failed to load session summaries. Please try again.');
    } finally {
      setLoadingSummaries(false);
    }
  };

  const fetchReceipts = async (pageNumber = 1) => {
    try {
      setLoadingReceipts(true);
      setReceiptError('');
      
      console.log('Calling getReceipts API...');
      const result = await getReceipts({ page: pageNumber, limit: 10 });
      console.log('Receipt result received:', result);
      
      if (result && result.receipts) {
        setReceipts(result.receipts);
        console.log('Receipts set to state:', result.receipts);
        
        if (result.pagination) {
          setReceiptPage(result.pagination.page);
          setReceiptTotalPages(result.pagination.pages);
        }
      } else {
        // If result exists but not in expected format
        console.error('Unexpected receipt data format:', result);
        setReceiptError('Received invalid receipt data format from server');
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      setReceiptError('Failed to load receipts. Please try again. Error: ' + (error.message || error));
    } finally {
      setLoadingReceipts(false);
    }
  };

  const handleSummaryPageChange = (event, value) => {
    setSummaryPage(value);
    fetchSessionSummaries(value);
  };

  const handleReceiptPageChange = (event, value) => {
    setReceiptPage(value);
    fetchReceipts(value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setReceiptDialog(true);
  };

  const fetchPin = async () => {
    try {
      setLoadingPin(true);
      const result = await getSetting('cashierPIN');
      if (result.exists) {
        setCurrentPin(result.value);
      }
    } catch (error) {
      console.error('Error loading PIN:', error);
    } finally {
      setLoadingPin(false);
    }
  };

  // Format date and time for display
  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return format(new Date(isoString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Format date only
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return format(new Date(isoString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Format time only
  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return format(new Date(isoString), 'h:mm a');
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Calculate session duration in hours and minutes
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end - start;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${diffHrs}h ${diffMins}m`;
    } catch (error) {
      return 'Invalid time';
    }
  };

  const handleSavePin = async () => {
    // Validate PIN
    if (!newPin || newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    
    try {
      setSavingPin(true);
      // Save PIN to database
      await updateSetting('cashierPIN', newPin);
      setCurrentPin(newPin);
      setPinError('');
      setPinSuccess('PIN updated successfully');
      
      // Reset fields
      setNewPin('');
      setConfirmPin('');
      setChangePinOpen(false);
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setPinSuccess('');
      }, 3000);
    } catch (error) {
      setPinError('Failed to update PIN: ' + error.message);
    } finally {
      setSavingPin(false);
    }
  };

  const handleToggleShowPin = () => {
    setShowPin(!showPin);
  };

  const handleSearch = () => {
    setSummaryPage(1); // Reset to first page
    fetchSessionSummaries(1);
  };

  const handlePrintSessionHistory = () => {
    const printContent = document.getElementById('session-history-table');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Session History Report</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h2 { text-align: center; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .date-range { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <h2>Cafeteria Session History</h2>
          <div class="date-range">
            <p><strong>Date Range:</strong> ${startDate ? format(startDate, 'MMM d, yyyy') : 'All'} to ${endDate ? format(endDate, 'MMM d, yyyy') : 'Present'}</p>
          </div>
          <div>
            ${printContent.outerHTML}
          </div>
          <div class="footer">
            <p><strong>Report Generated:</strong> ${format(new Date(), 'MMM d, yyyy h:mm a')}</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Add slight delay to make sure content is fully loaded
    setTimeout(() => {
      printWindow.print();
      // printWindow.close();
    }, 500);
  };

  const handleViewSessionDetail = (session) => {
    setSelectedSession(session);
    setSessionDetailDialog(true);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Cafe Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Sessions
              </Typography>
              <Typography variant="h4">
                {sessionSummaries.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4">
                {formatCurrency(totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg. Revenue per Session
              </Typography>
              <Typography variant="h4">
                {formatCurrency(avgSessionRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Cashier PIN
              </Typography>
              {loadingPin ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6">
                    {currentPin ? '••••' : 'Not Set'}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    size="small"
                    onClick={() => setChangePinOpen(true)}
                  >
                    {currentPin ? 'Change' : 'Set PIN'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {pinSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {pinSuccess}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Session History" />
          <Tab label="Receipt History" />
        </Tabs>
      </Box>

      {/* Session History Tab */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Session History
          </Typography>
          
          {/* Search filters */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={setStartDate}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={setEndDate}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Search />}
                      onClick={handleSearch}
                      sx={{ mt: 1 }}
                    >
                      Search
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<PrintIcon />}
                      onClick={handlePrintSessionHistory}
                      sx={{ mt: 1 }}
                      disabled={sessionSummaries.length === 0}
                    >
                      Print
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </LocalizationProvider>
          
          {loadingSummaries ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : summaryError ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {summaryError}
            </Alert>
          ) : sessionSummaries.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                No session summaries available for the selected period.
              </Typography>
            </Paper>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table id="session-history-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Cashier</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>End Time</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Starting Balance</TableCell>
                      <TableCell>Sales</TableCell>
                      <TableCell>Final Balance</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessionSummaries.map((session) => (
                      <TableRow key={session._id}>
                        <TableCell>{formatDate(session.date)}</TableCell>
                        <TableCell>
                          {session.cashier ? 
                            (session.cashier.firstName && session.cashier.lastName ? 
                              `${session.cashier.firstName} ${session.cashier.lastName}` : 
                              (session.cashier.name || 'Unknown')
                            ) : 'Unknown'
                          }
                        </TableCell>
                        <TableCell>{formatTime(session.startTime)}</TableCell>
                        <TableCell>{formatTime(session.endTime)}</TableCell>
                        <TableCell>{calculateDuration(session.startTime, session.endTime)}</TableCell>
                        <TableCell>{formatCurrency(session.startingBalance)}</TableCell>
                        <TableCell>{formatCurrency(session.totalSales)}</TableCell>
                        <TableCell>{formatCurrency(session.finalBalance)}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => handleViewSessionDetail(session)}
                            color="primary"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {summaryTotalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination 
                    count={summaryTotalPages} 
                    page={summaryPage} 
                    onChange={handleSummaryPageChange} 
                    color="primary" 
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {/* Receipt History Tab */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Receipt History
          </Typography>
          
          {loadingReceipts ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : receiptError ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {receiptError}
            </Alert>
          ) : receipts.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                No receipts available yet.
              </Typography>
              <Box mt={2}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => fetchReceipts(1)}
                >
                  Check Again
                </Button>
              </Box>
            </Paper>
          ) : (
            <>
              <Box mb={2}>
                <Typography variant="body2">
                  Found {receipts.length} receipt(s)
                </Typography>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Receipt #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {receipts.map((receipt) => (
                      <TableRow key={receipt._id}>
                        <TableCell>{receipt.orderNumber}</TableCell>
                        <TableCell>{formatDateTime(receipt.date)}</TableCell>
                        <TableCell>{receipt.customer}</TableCell>
                        <TableCell>{receipt.items.length}</TableCell>
                        <TableCell>{formatCurrency(receipt.total)}</TableCell>
                        <TableCell>{receipt.paymentMethod}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ReceiptIcon />}
                            onClick={() => handleViewReceipt(receipt)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {receiptTotalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination 
                    count={receiptTotalPages} 
                    page={receiptPage} 
                    onChange={handleReceiptPageChange} 
                    color="primary" 
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      <Box sx={{ mt: 3, textAlign: 'right' }}>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={() => {
            if (tabValue === 0) {
              fetchSessionSummaries(1);
            } else {
              fetchReceipts(1);
            }
          }}
          sx={{ mr: 2 }}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Change PIN Dialog */}
      <Dialog open={changePinOpen} onClose={() => setChangePinOpen(false)}>
        <DialogTitle>
          {currentPin ? 'Change Cashier PIN' : 'Set Cashier PIN'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ width: '300px', pt: 1 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              This PIN will be required for cashiers to start a session
            </Typography>
            
            <TextField
              fullWidth
              margin="normal"
              label="New PIN"
              type={showPin ? 'text' : 'password'}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
              error={!!pinError}
              disabled={savingPin}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleToggleShowPin}
                      edge="end"
                      disabled={savingPin}
                    >
                      {showPin ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Confirm PIN"
              type={showPin ? 'text' : 'password'}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
              error={!!pinError}
              helperText={pinError}
              disabled={savingPin}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePinOpen(false)} disabled={savingPin}>Cancel</Button>
          <Button 
            onClick={handleSavePin}
            variant="contained"
            color="primary"
            disabled={savingPin}
          >
            {savingPin ? <CircularProgress size={24} /> : 'Save PIN'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Dialog */}
      {selectedReceipt && (
        <ReceiptPrint
          receipt={selectedReceipt}
          open={receiptDialog}
          onClose={() => setReceiptDialog(false)}
        />
      )}

      {/* Session Detail Dialog */}
      <Dialog
        open={sessionDetailDialog}
        onClose={() => setSessionDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Session Summary
          <Typography variant="subtitle2" color="textSecondary">
            {selectedSession && formatDateTime(selectedSession.startTime)}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedSession && (
            <>
              <Typography variant="h6" gutterBottom>Financial Summary</Typography>
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body1">
                      <strong>Starting Balance:</strong> {formatCurrency(selectedSession.startingBalance)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body1">
                      <strong>Total Sales:</strong> {formatCurrency(selectedSession.totalSales)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body1">
                      <strong>Final Balance:</strong> {formatCurrency(selectedSession.finalBalance)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Typography variant="h6" gutterBottom>Inventory Summary</Typography>
              {selectedSession.startingStock && selectedSession.startingStock.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="center">Starting Stock</TableCell>
                        <TableCell align="center">Ending Stock</TableCell>
                        <TableCell align="center">Units Sold</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedSession.startingStock.map(startItem => {
                        // Find corresponding ending stock
                        const endItem = selectedSession.endingStock.find(
                          item => item._id.toString() === startItem._id.toString()
                        );
                        const endingStock = endItem ? endItem.stock : 0;
                        const soldUnits = startItem.stock - endingStock;
                        
                        return (
                          <TableRow key={startItem._id}>
                            <TableCell>{startItem.name}</TableCell>
                            <TableCell align="center">{startItem.stock}</TableCell>
                            <TableCell align="center">{endingStock}</TableCell>
                            <TableCell align="center">{soldUnits > 0 ? soldUnits : 0}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary">No inventory data available for this session.</Typography>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Typography variant="body2">
                  <strong>Session Duration:</strong> {calculateDuration(selectedSession.startTime, selectedSession.endTime)}
                </Typography>
                <Typography variant="body2">
                  <strong>Cashier:</strong> {selectedSession.cashier ? 
                    (selectedSession.cashier.firstName && selectedSession.cashier.lastName ? 
                      `${selectedSession.cashier.firstName} ${selectedSession.cashier.lastName}` : 
                      (selectedSession.cashier.name || 'Unknown')
                    ) : 'Unknown'
                  }
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionDetailDialog(false)}>Close</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              if (!selectedSession) return;
              
              const printWindow = window.open('', '_blank');
              printWindow.document.write(`
                <html>
                  <head>
                    <title>Session Summary - ${formatDate(selectedSession.date)}</title>
                    <style>
                      body { font-family: Arial, sans-serif; padding: 20px; }
                      table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                      th { background-color: #f2f2f2; }
                      h2, h3 { margin-top: 20px; }
                      .header { text-align: center; margin-bottom: 30px; }
                      .summary-section { margin-bottom: 30px; }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <h2>Cafe Session Summary</h2>
                      <p><strong>Date:</strong> ${formatDate(selectedSession.date)}</p>
                    </div>
                    
                    <div class="summary-section">
                      <h3>Financial Summary</h3>
                      <table>
                        <tr>
                          <th>Starting Balance</th>
                          <th>Total Sales</th>
                          <th>Final Balance</th>
                        </tr>
                        <tr>
                          <td>${formatCurrency(selectedSession.startingBalance)}</td>
                          <td>${formatCurrency(selectedSession.totalSales)}</td>
                          <td>${formatCurrency(selectedSession.finalBalance)}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <div class="summary-section">
                      <h3>Session Details</h3>
                      <table>
                        <tr>
                          <th>Start Time</th>
                          <th>End Time</th>
                          <th>Duration</th>
                          <th>Cashier</th>
                        </tr>
                        <tr>
                          <td>${formatDateTime(selectedSession.startTime)}</td>
                          <td>${formatDateTime(selectedSession.endTime)}</td>
                          <td>${calculateDuration(selectedSession.startTime, selectedSession.endTime)}</td>
                          <td>${selectedSession.cashier ? 
                            (selectedSession.cashier.firstName && selectedSession.cashier.lastName ? 
                              `${selectedSession.cashier.firstName} ${selectedSession.cashier.lastName}` : 
                              (selectedSession.cashier.name || 'Unknown')
                            ) : 'Unknown'
                          }</td>
                        </tr>
                      </table>
                    </div>
                    
                    ${selectedSession.startingStock && selectedSession.startingStock.length > 0 ? `
                      <div class="summary-section">
                        <h3>Inventory Summary</h3>
                        <table>
                          <tr>
                            <th>Item</th>
                            <th>Starting Stock</th>
                            <th>Ending Stock</th>
                            <th>Units Sold</th>
                          </tr>
                          ${selectedSession.startingStock.map(startItem => {
                            const endItem = selectedSession.endingStock.find(
                              item => item._id.toString() === startItem._id.toString()
                            );
                            const endingStock = endItem ? endItem.stock : 0;
                            const soldUnits = startItem.stock - endingStock;
                            
                            return `
                              <tr>
                                <td>${startItem.name}</td>
                                <td>${startItem.stock}</td>
                                <td>${endingStock}</td>
                                <td>${soldUnits > 0 ? soldUnits : 0}</td>
                              </tr>
                            `;
                          }).join('')}
                        </table>
                      </div>
                    ` : '<p>No inventory data available for this session.</p>'}
                    
                    <div style="margin-top: 30px; font-size: 12px; text-align: center;">
                      <p>Report generated on ${formatDateTime(new Date())}</p>
                    </div>
                  </body>
                </html>
              `);
              
              printWindow.document.close();
              setTimeout(() => printWindow.print(), 500);
            }}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CafeDashboard; 