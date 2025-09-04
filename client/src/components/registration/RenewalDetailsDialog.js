import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close,
  Cancel,
  Print,
  SportsSoccer,
  SportsBasketball,
  SportsVolleyball,
  Pool,
  FitnessCenter,
  DirectionsRun
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getRenewalById, cancelRenewal } from '../../services/registrationRenewalService';

// Sport icons mapping
const getSportIcon = (sport) => {
  const sportLower = sport?.toLowerCase() || '';
  if (sportLower.includes('football') || sportLower.includes('soccer')) {
    return <SportsSoccer />;
  } else if (sportLower.includes('basketball')) {
    return <SportsBasketball />;
  } else if (sportLower.includes('volleyball')) {
    return <SportsVolleyball />;
  } else if (sportLower.includes('swimming')) {
    return <Pool />;
  } else if (sportLower.includes('gym') || sportLower.includes('fitness')) {
    return <FitnessCenter />;
  } else if (sportLower.includes('zumba')) {
    return <DirectionsRun />;
  }
  return <SportsSoccer />;
};

const RenewalDetailsDialog = ({ open, onClose, renewal }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [renewalDetails, setRenewalDetails] = useState(null);

  useEffect(() => {
    if (open && renewal) {
      fetchRenewalDetails();
    }
  }, [open, renewal]);

  const fetchRenewalDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRenewalById(renewal._id);
      setRenewalDetails(response.data);
    } catch (err) {
      setError('Failed to load renewal details');
      console.error('Error fetching renewal details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRenewal = async () => {
    if (!window.confirm('Are you sure you want to cancel this renewal? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await cancelRenewal(renewal._id, 'Cancelled by user');
      setSuccess('Renewal cancelled successfully');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError('Failed to cancel renewal');
      console.error('Error cancelling renewal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('renewal-details-content');
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Registration Renewal Details</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .section h3 { color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 5px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .label { font-weight: bold; }
            .value { color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Registration Renewal Details</h1>
            <p>Generated on ${format(new Date(), 'MMM dd, yyyy h:mm a')}</p>
          </div>
          <div>
            ${printContent.outerHTML}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!renewal) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.2)}`
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Renewal Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Registration Renewal Information
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box id="renewal-details-content">
            {/* Player Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
                Player Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {renewal.player.firstName} {renewal.player.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{renewal.player.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{renewal.player.phoneNumber}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip
                    label={renewal.status}
                    color={getStatusColor(renewal.status)}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Renewal Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
                Renewal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Sports</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {renewal.sports.map((sport) => (
                      <Chip
                        key={sport}
                        icon={getSportIcon(sport)}
                        label={sport}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Registration Period</Typography>
                  <Typography variant="body1">{renewal.registrationPeriod}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Start Date</Typography>
                  <Typography variant="body1">{formatDate(renewal.startDate)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">End Date</Typography>
                  <Typography variant="body1">{formatDate(renewal.endDate)}</Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Payment Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
                Payment Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Amount</Typography>
                  <Typography variant="h6" color="success.main">
                    ${renewal.fee.amount} {renewal.fee.currency}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Payment Method</Typography>
                  <Typography variant="body1">{renewal.fee.paymentMethod}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Payment Status</Typography>
                  <Chip
                    label={renewal.fee.paymentStatus}
                    color={renewal.fee.paymentStatus === 'Paid' ? 'success' : 'warning'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Invoice Number</Typography>
                  <Typography variant="body1">{renewal.fee.invoiceNumber}</Typography>
                </Grid>
                {renewal.fee.receiptNumber && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Receipt Number</Typography>
                    <Typography variant="body1">{renewal.fee.receiptNumber}</Typography>
                  </Grid>
                )}
                {renewal.fee.transactionId && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Transaction ID</Typography>
                    <Typography variant="body1">{renewal.fee.transactionId}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Processing Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
                Processing Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Renewed By</Typography>
                  <Typography variant="body1">
                    {renewal.renewedBy?.firstName} {renewal.renewedBy?.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Renewal Date</Typography>
                  <Typography variant="body1">{formatDateTime(renewal.createdAt)}</Typography>
                </Grid>
                {renewal.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Notes</Typography>
                    <Typography variant="body1">{renewal.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button 
          onClick={handlePrint}
          startIcon={<Print />}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Print
        </Button>
        {renewal?.status === 'Completed' && (
          <Button
            onClick={handleCancelRenewal}
            startIcon={<Cancel />}
            color="error"
            variant="outlined"
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Cancel Renewal
          </Button>
        )}
        <Button 
          onClick={onClose} 
          variant="contained"
          sx={{ borderRadius: 2, px: 3 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenewalDetailsDialog;
