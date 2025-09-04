import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
  useTheme,
  alpha,
  TextField,
  Button
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  HowToReg as HowToRegIcon,
  Sports as SportsIcon,
  Restaurant as RestaurantIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getDailyAccountingReport } from '../../services/revenueService';
import { useAuth } from '../../contexts/AuthContext';

const DailyAccountingReport = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expandedSections, setExpandedSections] = useState({
    utilityBills: false,
    salaryInvoices: false,
    playerRegistrations: false,
    singleSessionFees: false,
    registrationRenewals: false,
    cafeteriaOrders: false
  });

  // Fetch report data
  const fetchReport = async (date) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDailyAccountingReport(date);
      setReportData(data);
    } catch (err) {
      console.error('Error fetching daily report:', err);
      setError('Failed to load daily report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  // Handle date change
  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  // Get section icon
  const getSectionIcon = (section) => {
    switch (section) {
      case 'utilityBills': return <ReceiptIcon />;
      case 'salaryInvoices': return <PaymentIcon />;
      case 'playerRegistrations': return <HowToRegIcon />;
      case 'singleSessionFees': return <SportsIcon />;
      case 'registrationRenewals': return <HowToRegIcon />;
      case 'cafeteriaOrders': return <RestaurantIcon />;
      default: return <AttachMoneyIcon />;
    }
  };

  // Get section title
  const getSectionTitle = (section) => {
    switch (section) {
      case 'utilityBills': return 'Utility Bills';
      case 'salaryInvoices': return 'Salary Invoices';
      case 'playerRegistrations': return 'Player Registrations';
      case 'singleSessionFees': return 'Single Session Fees';
      case 'registrationRenewals': return 'Registration Renewals';
      case 'cafeteriaOrders': return 'Cafeteria Orders';
      default: return section;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading daily report...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Daily Accounting Report
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Track all financial transactions processed each day by {reportData?.accountant?.name || 'you'}
        </Typography>
        
        {/* Date Selector */}
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <CalendarIcon color="primary" />
          <TextField
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            label="Select Date"
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="outlined"
            onClick={() => fetchReport(selectedDate)}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {reportData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6} lg={2}>
              <Card sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {reportData.summary.utilityBills.count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Utility Bills
                  </Typography>
                  <Typography variant="h5" color="primary" sx={{ mt: 1 }}>
                    {formatCurrency(reportData.summary.utilityBills.total)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={2}>
              <Card sx={{ 
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="secondary" gutterBottom>
                    {reportData.summary.salaryInvoices.count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Salary Invoices
                  </Typography>
                  <Typography variant="h5" color="secondary" sx={{ mt: 1 }}>
                    {formatCurrency(reportData.summary.salaryInvoices.total)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={2}>
              <Card sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.1),
                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    {reportData.summary.playerRegistrations.count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Registrations
                  </Typography>
                  <Typography variant="h5" color="success.main" sx={{ mt: 1 }}>
                    {formatCurrency(reportData.summary.playerRegistrations.total)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={2}>
              <Card sx={{ 
                bgcolor: alpha(theme.palette.info.main, 0.1),
                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="info.main" gutterBottom>
                    {reportData.summary.singleSessionFees.count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Session Fees
                  </Typography>
                  <Typography variant="h5" color="info.main" sx={{ mt: 1 }}>
                    {formatCurrency(reportData.summary.singleSessionFees.total)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={2}>
              <Card sx={{ 
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="warning.main" gutterBottom>
                    {reportData.summary.registrationRenewals?.count || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Renewals
                  </Typography>
                  <Typography variant="h5" color="warning.main" sx={{ mt: 1 }}>
                    {formatCurrency(reportData.summary.registrationRenewals?.total || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={2}>
              <Card sx={{ 
                bgcolor: alpha(theme.palette.error.main, 0.1),
                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="error.main" gutterBottom>
                    Total
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Grand Total
                  </Typography>
                  <Typography variant="h5" color="error.main" sx={{ mt: 1 }}>
                    {formatCurrency(reportData.summary.grandTotal)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Sections */}
          <Grid container spacing={3}>
            {Object.entries(reportData.details).map(([section, items]) => (
              <Grid item xs={12} key={section}>
                <Card>
                  <CardHeader
                    avatar={getSectionIcon(section)}
                    title={getSectionTitle(section)}
                    subheader={`${items.length} items - ${formatCurrency(reportData.summary[section].total)}`}
                    action={
                      <IconButton onClick={() => toggleSection(section)}>
                        {expandedSections[section] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    }
                  />
                  <Collapse in={expandedSections[section]} timeout="auto" unmountOnExit>
                    <CardContent>
                      {items.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                {section === 'utilityBills' && (
                                  <>
                                    <TableCell>User</TableCell>
                                    <TableCell>Bill Type</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Payment Date</TableCell>
                                    <TableCell>Payment Method</TableCell>
                                  </>
                                )}
                                {section === 'salaryInvoices' && (
                                  <>
                                    <TableCell>Employee</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Bonus</TableCell>
                                    <TableCell>Invoice #</TableCell>
                                    <TableCell>Paid Date</TableCell>
                                    <TableCell>Issued By</TableCell>
                                  </>
                                )}
                                {section === 'playerRegistrations' && (
                                  <>
                                    <TableCell>Player</TableCell>
                                    <TableCell>Sports</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Registration Date</TableCell>
                                    <TableCell>Invoice #</TableCell>
                                  </>
                                )}
                                {section === 'singleSessionFees' && (
                                  <>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Notes</TableCell>
                                  </>
                                )}
                                {section === 'registrationRenewals' && (
                                  <>
                                    <TableCell>Player</TableCell>
                                    <TableCell>Sports</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Period</TableCell>
                                    <TableCell>Start Date</TableCell>
                                    <TableCell>End Date</TableCell>
                                    <TableCell>Invoice #</TableCell>
                                    <TableCell>Renewed By</TableCell>
                                  </>
                                )}

                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {items.map((item, index) => (
                                <TableRow key={item._id || index}>
                                  {section === 'utilityBills' && (
                                    <>
                                      <TableCell>
                                        {item.paidBy ? `${item.paidBy.firstName} ${item.paidBy.lastName}` : 'N/A'}
                                      </TableCell>
                                      <TableCell>{item.billType}</TableCell>
                                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                                      <TableCell>{formatDate(item.paidDate)}</TableCell>
                                      <TableCell>{item.paymentMethod}</TableCell>
                                    </>
                                  )}
                                  {section === 'salaryInvoices' && (
                                    <>
                                      <TableCell>
                                        {item.userId ? `${item.userId.firstName} ${item.userId.lastName}` : 'N/A'}
                                      </TableCell>
                                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                                      <TableCell>{formatCurrency(item.bonus || 0)}</TableCell>
                                      <TableCell>{item.invoiceNumber}</TableCell>
                                      <TableCell>{formatDate(item.paidDate)}</TableCell>
                                      <TableCell>
                                        {item.issuedBy ? `${item.issuedBy.firstName} ${item.issuedBy.lastName}` : 'N/A'}
                                      </TableCell>
                                    </>
                                  )}
                                  {section === 'playerRegistrations' && (
                                    <>
                                      <TableCell>
                                        {item.player ? `${item.player.firstName} ${item.player.lastName}` : 'N/A'}
                                      </TableCell>
                                      <TableCell>
                                        {item.sports ? item.sports.join(', ') : 'N/A'}
                                      </TableCell>
                                      <TableCell>{formatCurrency(item.fee?.amount || 0)}</TableCell>
                                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                                      <TableCell>{item.fee?.invoiceNumber || 'N/A'}</TableCell>
                                    </>
                                  )}
                                  {section === 'singleSessionFees' && (
                                    <>
                                      <TableCell>{item.description || 'N/A'}</TableCell>
                                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                                      <TableCell>{formatDate(item.date)}</TableCell>
                                      <TableCell>{item.notes || 'N/A'}</TableCell>
                                    </>
                                  )}
                                  {section === 'registrationRenewals' && (
                                    <>
                                      <TableCell>
                                        {item.player ? `${item.player.firstName} ${item.player.lastName}` : 'N/A'}
                                      </TableCell>
                                      <TableCell>
                                        {item.sports ? item.sports.join(', ') : 'N/A'}
                                      </TableCell>
                                      <TableCell>{formatCurrency(item.fee?.amount || 0)}</TableCell>
                                      <TableCell>{item.registrationPeriod || 'N/A'}</TableCell>
                                      <TableCell>{formatDate(item.startDate)}</TableCell>
                                      <TableCell>{formatDate(item.endDate)}</TableCell>
                                      <TableCell>{item.fee?.invoiceNumber || 'N/A'}</TableCell>
                                      <TableCell>
                                        {item.renewedBy ? `${item.renewedBy.firstName} ${item.renewedBy.lastName}` : 'N/A'}
                                      </TableCell>
                                    </>
                                  )}

                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                          <Typography variant="body1" color="text.secondary">
                            No {getSectionTitle(section).toLowerCase()} found for this date.
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Collapse>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default DailyAccountingReport;
