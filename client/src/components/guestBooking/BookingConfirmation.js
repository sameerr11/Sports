import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, 
  Divider, Button, Alert,
  useMediaQuery, useTheme
} from '@mui/material';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import { Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import BookingReceipt from './BookingReceipt';
import { format } from 'date-fns';
import ultrasLogo from '../../assets/images/ultras_logo.png';

const BookingConfirmation = ({ booking, resetBookingForm }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [receiptOpen, setReceiptOpen] = useState(false);

  if (!booking) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          No booking information available.
        </Typography>
        <Button 
          variant="contained" 
          onClick={resetBookingForm}
          sx={{ 
            mt: 2,
            backgroundColor: '#f7931e',
            color: 'white',
            borderRadius: '25px',
            padding: '10px 24px',
            fontWeight: 'bold',
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 4px 10px rgba(247, 147, 30, 0.3)',
            '&:hover': {
              backgroundColor: '#e08016',
              boxShadow: '0 6px 15px rgba(247, 147, 30, 0.4)',
            }
          }}
        >
          Start New Booking
        </Button>
      </Box>
    );
  }

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateTime) => {
    return new Date(dateTime).toLocaleDateString([], { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleStartNewBooking = () => {
    // Use the reset function provided by the parent component
    resetBookingForm();
  };

  // Function to generate receipt HTML content for download
  const generateReceiptHTML = () => {
    // Format date for printing
    const formatReceiptDate = (dateString) => {
      return format(new Date(dateString), 'MMM d, yyyy');
    };
    
    // Format time for printing
    const formatReceiptTime = (dateString) => {
      return format(new Date(dateString), 'h:mm a');
    };
    
    // Get court type info if basketball
    const isBasketballCourt = booking.court?.sportType === 'Basketball';
    const courtTypeInfo = isBasketballCourt ? `(${booking.courtType || 'Full Court'})` : '';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Booking Receipt</title>
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
            .receipt-title {
              font-weight: bold;
              font-size: 20px;
              margin: 8px 0;
            }
            .receipt-details {
              margin: 4px 0;
              color: #666;
            }
            .flex-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 16px;
            }
            .section-title {
              font-weight: 600;
              margin-bottom: 8px;
            }
            .text-right {
              text-align: right;
            }
            .content-section {
              margin-bottom: 32px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            .table th, .table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .table th {
              background-color: #f2f2f2;
            }
            .amount {
              font-size: 16px;
              font-weight: 600;
            }
            .footer {
              text-align: center;
              margin-top: 32px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-print">
            <div class="invoice-container">
              <div class="text-center mb-3">
                <img src="${ultrasLogo}" alt="Ultras Logo" class="company-logo">
                <h1 class="company-name">SPORTS MANAGEMENT</h1>
                <h2 class="receipt-title">COURT BOOKING RECEIPT</h2>
                <p class="receipt-details">Booking Reference: ${booking.bookingReference}</p>
                <p class="receipt-details">Date: ${formatReceiptDate(booking.createdAt || booking.startTime)}</p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #000; margin: 15px 0;" />
              
              <div class="flex-row">
                <div style="flex: 1;">
                  <h3 class="section-title">Guest Information</h3>
                  <p><strong>Name:</strong> ${booking.guestName}</p>
                  <p><strong>Email:</strong> ${booking.guestEmail}</p>
                  <p><strong>Phone:</strong> ${booking.guestPhone}</p>
                </div>
                
                <div style="flex: 1;">
                  <h3 class="section-title">Court Details</h3>
                  <p><strong>Court:</strong> ${booking.court.name} ${courtTypeInfo}</p>
                  <p><strong>Sport Type:</strong> ${booking.court.sportType}</p>
                  <p><strong>Location:</strong> ${booking.court.location}</p>
                </div>
              </div>
              
              <div class="content-section">
                <h3 class="section-title">Booking Details</h3>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th style="text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${formatReceiptDate(booking.startTime)}</td>
                      <td>${formatReceiptTime(booking.startTime)}</td>
                      <td>${formatReceiptTime(booking.endTime)}</td>
                      <td style="text-align: right;">$${booking.totalPrice.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colspan="3" style="font-weight: bold; text-align: right;">Total</td>
                      <td style="text-align: right; font-weight: bold;">$${booking.totalPrice.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
                
                <p><strong>Payment Method:</strong> ${booking.paymentMethod || 'Card'}</p>
                <p><strong>Payment Status:</strong> ${booking.paymentStatus || 'Unpaid'}</p>
                ${booking.paymentId ? `<p><strong>Payment ID:</strong> ${booking.paymentId}</p>` : ''}
              </div>
              
              <div class="footer">
                <p>Thank you for booking with us!</p>
                <p>For any inquiries, please contact us with your booking reference.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Direct download function
  const handleDirectDownload = () => {
    // Create a Blob with the receipt HTML
    const receiptHTML = generateReceiptHTML();
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    
    // Create a temporary link element to trigger download
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `Booking_Receipt_${booking.bookingReference}.html`;
    
    // Append to document, click, and remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Get the latest booking information
  const displayPaymentMethod = booking.paymentMethod || 'Card';
  const displayPaymentStatus = booking.paymentStatus || 'Unpaid';
  
  // Get court type information
  const isBasketballCourt = booking.court?.sportType === 'Basketball';
  const courtTypeInfo = isBasketballCourt ? `(${booking.courtType || 'Full Court'})` : '';

  return (
    <Box sx={{ textAlign: 'center' }}>
      <CheckCircleOutline 
        sx={{ 
          fontSize: { xs: 50, sm: 60, md: 70 }, 
          mb: 2,
          color: '#4CAF50'
        }} 
      />
      <Typography 
        variant="h5" 
        gutterBottom
        sx={{ 
          color: '#0e0051',
          fontWeight: 'bold',
          fontSize: { xs: '1.4rem', sm: '1.5rem', md: '1.75rem' }
        }}
      >
        Booking Confirmed!
      </Typography>
      <Typography 
        variant="body1" 
        gutterBottom
        sx={{ color: '#0e0051' }}
      >
        Your booking reference is: <strong>{booking.bookingReference}</strong>
      </Typography>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        gutterBottom
        sx={{ mb: 3 }}
      >
        Please save this reference for any future inquiries.
      </Typography>
      
      <Paper 
        sx={{ 
          mt: 4, 
          p: { xs: 2, sm: 3 }, 
          maxWidth: 500, 
          mx: 'auto',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: '12px',
          boxShadow: '0 8px 20px rgba(14, 0, 81, 0.1)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #f7931e, #ff7f00)',
            borderRadius: '12px 12px 0 0'
          }
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          align="left"
          sx={{ 
            color: '#0e0051',
            fontWeight: 600,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}
        >
          Booking Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Court:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography variant="body1">
              {booking.court?.name} {courtTypeInfo}
            </Typography>
          </Grid>
          
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Sport:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography variant="body1">
              {booking.court?.sportType}
            </Typography>
          </Grid>
          
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Date:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography variant="body1">
              {formatDate(booking.startTime)}
            </Typography>
          </Grid>
          
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Time:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography variant="body1">
              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
            </Typography>
          </Grid>
          </Grid>
          
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Name:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography variant="body1">
              {booking.guestName}
            </Typography>
          </Grid>
          
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Email:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography variant="body1">
              {booking.guestEmail}
            </Typography>
          </Grid>
          
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Total Amount:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: "bold",
                color: '#f7931e'
              }}
            >
              ${booking.totalPrice?.toFixed(2)}
            </Typography>
          </Grid>
          
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Payment Method:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography variant="body1">
              {displayPaymentMethod}
            </Typography>
          </Grid>
          
          <Grid item xs={4} align="left">
            <Typography variant="body2" color="text.secondary">
              Payment Status:
            </Typography>
          </Grid>
          <Grid item xs={8} align="left">
            <Typography variant="body1">
              {displayPaymentStatus}
              </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Alert 
        severity="info" 
        sx={{ 
          mt: 3, 
          textAlign: 'left',
          borderRadius: '8px',
          maxWidth: 500,
          mx: 'auto',
          '& .MuiAlert-icon': {
            color: '#f7931e'
          }
        }}
      >
        A confirmation email has been sent to {booking.guestEmail}. Please make sure to check your spam folder if you don't see it in your inbox.
      </Alert>
      
      <Box 
        sx={{ 
          mt: 3, 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          maxWidth: { xs: '100%', sm: 500 },
          mx: 'auto'
        }}
      >
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={<DownloadIcon />}
          onClick={handleDirectDownload}
          sx={{
            borderColor: '#0e0051',
            color: '#0e0051',
            borderRadius: '25px',
            padding: '10px 16px',
            textTransform: 'none',
            fontSize: '0.9rem',
            backgroundColor: 'rgba(14, 0, 81, 0.03)',
            '&:hover': {
              borderColor: '#f7931e',
              color: '#f7931e',
              backgroundColor: 'rgba(247, 147, 30, 0.05)'
            }
          }}
        >
          Download Receipt
        </Button>
        
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={<PrintIcon />}
          onClick={() => setReceiptOpen(true)}
          sx={{
            borderColor: '#0e0051',
            color: '#0e0051',
            borderRadius: '25px',
            padding: '10px 16px',
            textTransform: 'none',
            fontSize: '0.9rem',
            backgroundColor: 'rgba(14, 0, 81, 0.03)',
            '&:hover': {
              borderColor: '#f7931e',
              color: '#f7931e',
              backgroundColor: 'rgba(247, 147, 30, 0.05)'
            }
          }}
        >
          Print Receipt
        </Button>
        
        <Button 
          variant="contained" 
          onClick={handleStartNewBooking}
          sx={{
            backgroundColor: '#f7931e',
            color: 'white',
            borderRadius: '25px',
            padding: '10px 16px',
            fontWeight: 'bold',
            textTransform: 'none',
            fontSize: '0.9rem',
            boxShadow: '0 4px 10px rgba(247, 147, 30, 0.3)',
            '&:hover': {
              backgroundColor: '#e08016',
              boxShadow: '0 6px 15px rgba(247, 147, 30, 0.4)',
            }
          }}
        >
          Book Another Court
        </Button>
      </Box>
      
      {/* Receipt Dialog */}
      <BookingReceipt 
        booking={booking} 
        open={receiptOpen} 
        onClose={() => setReceiptOpen(false)} 
      />
    </Box>
  );
};

export default BookingConfirmation; 