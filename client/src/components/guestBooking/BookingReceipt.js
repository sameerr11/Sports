import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Divider
} from '@mui/material';
import { Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import ultrasLogo from '../../assets/images/ultras_logo.png';

const BookingReceipt = ({ booking, open, onClose }) => {
  // Function to generate receipt HTML content
  const generateReceiptHTML = () => {
    // Format date for receipt
    const formatReceiptDate = (dateString) => {
      return format(new Date(dateString), 'MMM d, yyyy');
    };
    
    // Format time for receipt
    const formatReceiptTime = (dateString) => {
      return format(new Date(dateString), 'h:mm a');
    };
    
    // Calculate duration in half-hour increments
    const calculateDuration = (startTime, endTime) => {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const durationHours = (end - start) / (1000 * 60 * 60);
      const halfHours = Math.ceil(durationHours * 2);
      return `${halfHours / 2} hour${halfHours !== 2 ? 's' : ''} (${halfHours} x 30 min)`;
    };

    // Detect if it's a basketball court and half court booking
    const isBasketballCourt = booking.court?.sportType === 'Basketball';
    const courtTypeInfo = booking.courtType && isBasketballCourt 
      ? `(${booking.courtType})`
      : '';
    
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
                <p class="receipt-details">Date: ${formatReceiptDate(booking.createdAt)}</p>
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
                      <th>Duration</th>
                      <th style="text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${formatReceiptDate(booking.startTime)}</td>
                      <td>${formatReceiptTime(booking.startTime)}</td>
                      <td>${formatReceiptTime(booking.endTime)}</td>
                      <td>${calculateDuration(booking.startTime, booking.endTime)}</td>
                      <td style="text-align: right;">$${booking.totalPrice.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colspan="4" style="font-weight: bold; text-align: right;">Total</td>
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

  const handlePrint = () => {
    const content = document.getElementById('booking-receipt-to-print');
    
    if (!content) {
      console.error('Receipt content not found');
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
    frameDoc.document.write(generateReceiptHTML());
    
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

  const handleDownload = () => {
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

  if (!booking) return null;

  // Format time for display
  const formatTime = (dateString) => {
    return format(new Date(dateString), 'h:mm a');
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };
  
  // Calculate duration for display in the React component
  const calculateComponentDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end - start) / (1000 * 60 * 60);
    const halfHours = Math.ceil(durationHours * 2);
    return `${halfHours / 2} hour${halfHours !== 2 ? 's' : ''} (${halfHours} x 30 min)`;
  };
  
  // Get court type info if basketball
  const isBasketballCourt = booking.court?.sportType === 'Basketball';
  const courtTypeInfo = isBasketballCourt ? `(${booking.courtType || 'Full Court'})` : '';

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{ 
        sx: { 
          width: '600px',
          maxWidth: '95vw'
        } 
      }}
    >
      <DialogTitle>Booking Receipt</DialogTitle>
      <DialogContent>
        <div id="booking-receipt-to-print" style={{ padding: '16px' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <img 
              src={ultrasLogo} 
              alt="Ultras Logo" 
              style={{ 
                maxWidth: '80px', 
                maxHeight: '80px', 
                margin: '0 auto 10px', 
                display: 'block' 
              }} 
            />
            <Typography variant="h5" sx={{ fontWeight: 'bold', margin: '5px 0' }}>
              SPORTS MANAGEMENT
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', margin: '8px 0' }}>
              COURT BOOKING RECEIPT
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ margin: '4px 0' }}>
              Booking Reference: {booking.bookingReference}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ margin: '4px 0' }}>
              Date: {formatDate(booking.createdAt || booking.startTime)}
            </Typography>
          </Box>
          
          <Divider />
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Guest Information
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Name:</strong> {booking.guestName}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Email:</strong> {booking.guestEmail}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Phone:</strong> {booking.guestPhone}
              </Typography>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Court Details
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Court:</strong> {booking.court.name} {courtTypeInfo}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Sport Type:</strong> {booking.court.sportType}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Location:</strong> {booking.court.location}
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Booking Details
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">Date</Typography>
                  <Typography variant="body1">{formatDate(booking.startTime)}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">Time</Typography>
                  <Typography variant="body1">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">Duration</Typography>
                  <Typography variant="body1">{calculateComponentDuration(booking.startTime, booking.endTime)}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">Amount</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>${booking.totalPrice.toFixed(2)}</Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Payment Method:</strong> {booking.paymentMethod || 'Card'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Payment Status:</strong> {booking.paymentStatus || 'Unpaid'}
              </Typography>
              {booking.paymentId && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Payment ID:</strong> {booking.paymentId}
                </Typography>
              )}
            </Box>
          </Box>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2">
              Thank you for booking with us!
            </Typography>
            <Typography variant="body2" color="textSecondary">
              For any inquiries, please contact us with your booking reference.
            </Typography>
          </Box>
        </div>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Download
        </Button>
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
  );
};

export default BookingReceipt; 