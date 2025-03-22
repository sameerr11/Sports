import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const RegistrationReceipt = ({ registration, open, onClose }) => {
  const handlePrint = () => {
    const content = document.getElementById('registration-receipt-to-print');
    
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
    frameDoc.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Registration Receipt</title>
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
                <img src="/logo192.png" alt="Company Logo" class="company-logo" />
                <h1 class="company-name">SPORTS MANAGEMENT</h1>
                <h2 class="receipt-title">REGISTRATION RECEIPT</h2>
                <p class="receipt-details">Receipt #: ${fee.invoiceNumber || 'N/A'}</p>
                <p class="receipt-details">Date: ${format(new Date(createdAt), 'MMM d, yyyy')}</p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #000; margin: 15px 0;" />
              
              <div class="flex-row">
                <div style="flex: 1;">
                  <h3 class="section-title">Player Information</h3>
                  <p><strong>Name:</strong> ${player.firstName} ${player.lastName}</p>
                  <p><strong>Email:</strong> ${player.email}</p>
                  <p><strong>Phone:</strong> ${player.phoneNumber}</p>
                  ${player.dateOfBirth ? `<p><strong>Date of Birth:</strong> ${format(new Date(player.dateOfBirth), 'dd/MM/yyyy')}</p>` : ''}
                </div>
                
                <div style="flex: 1;">
                  <h3 class="section-title">Registration Details</h3>
                  <p><strong>Registration Period:</strong> ${registrationPeriod}</p>
                  <p><strong>Start Date:</strong> ${format(new Date(startDate), 'dd/MM/yyyy')}</p>
                  <p><strong>End Date:</strong> ${format(new Date(endDate), 'dd/MM/yyyy')}</p>
                </div>
              </div>
              
              <div class="content-section">
                <h3 class="section-title">Sports Registered</h3>
                <ul>
                  ${sports.map(sport => `<li>${sport}</li>`).join('')}
                </ul>
              </div>
              
              <div class="content-section">
                <h3 class="section-title">Payment Information</h3>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th style="text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Registration Fee</td>
                      <td style="text-align: right;">$${fee.amount}</td>
                    </tr>
                    <tr>
                      <td style="font-weight: bold;">Total</td>
                      <td style="text-align: right; font-weight: bold;">$${fee.amount}</td>
                    </tr>
                  </tbody>
                </table>
                
                <p><strong>Payment Method:</strong> ${fee.paymentMethod}</p>
                <p><strong>Payment Status:</strong> ${fee.paymentStatus}</p>
                ${fee.transactionId ? `<p><strong>Transaction ID:</strong> ${fee.transactionId}</p>` : ''}
              </div>
              
              <div class="footer">
                <p>Thank you for registering with our sports program!</p>
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
  };

  if (!registration) return null;

  const { player, sports, registrationPeriod, startDate, endDate, fee, createdAt } = registration;

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
      <DialogTitle>Registration Receipt</DialogTitle>
      <DialogContent>
        <div id="registration-receipt-to-print" style={{ padding: '16px' }}>
          <div className="header">
            <img src="/logo192.png" alt="Logo" className="logo" style={{ maxWidth: '80px', maxHeight: '80px', margin: '0 auto 10px', display: 'block' }} />
            <h1 style={{ margin: '5px 0', fontSize: '24px' }}>SPORTS MANAGEMENT</h1>
            <h2 style={{ margin: '10px 0', fontSize: '18px' }}>REGISTRATION RECEIPT</h2>
            <p style={{ margin: '4px 0', textAlign: 'center' }}>
              Receipt #: {fee.invoiceNumber || 'N/A'}
            </p>
            <p style={{ margin: '4px 0', textAlign: 'center' }}>
              {format(new Date(createdAt), 'MMM d, yyyy')}
            </p>
          </div>
          
          <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #000' }} />
          
          <div style={{ display: 'flex', marginBottom: '20px' }}>
            <div style={{ flex: 1, padding: '10px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Player Information</h3>
              <p style={{ margin: '5px 0' }}>
                <span style={{ fontWeight: 'bold' }}>Name:</span> {player.firstName} {player.lastName}
              </p>
              <p style={{ margin: '5px 0' }}>
                <span style={{ fontWeight: 'bold' }}>Email:</span> {player.email}
              </p>
              <p style={{ margin: '5px 0' }}>
                <span style={{ fontWeight: 'bold' }}>Phone:</span> {player.phoneNumber}
              </p>
              {player.dateOfBirth && (
                <p style={{ margin: '5px 0' }}>
                  <span style={{ fontWeight: 'bold' }}>Date of Birth:</span> {format(new Date(player.dateOfBirth), 'dd/MM/yyyy')}
                </p>
              )}
            </div>
            
            <div style={{ flex: 1, padding: '10px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Registration Details</h3>
              <p style={{ margin: '5px 0' }}>
                <span style={{ fontWeight: 'bold' }}>Registration Period:</span> {registrationPeriod}
              </p>
              <p style={{ margin: '5px 0' }}>
                <span style={{ fontWeight: 'bold' }}>Start Date:</span> {format(new Date(startDate), 'dd/MM/yyyy')}
              </p>
              <p style={{ margin: '5px 0' }}>
                <span style={{ fontWeight: 'bold' }}>End Date:</span> {format(new Date(endDate), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
          
          <h3 style={{ margin: '15px 0 10px 0' }}>Sports Registered</h3>
          <ul>
            {sports.map((sport, index) => (
              <li key={index}>{sport}</li>
            ))}
          </ul>
          
          <h3 style={{ margin: '15px 0 10px 0' }}>Payment Information</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '15px 0' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Description</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>Registration Fee</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>${fee.amount}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>Total</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>${fee.amount}</td>
              </tr>
            </tbody>
          </table>
          
          <div style={{ marginTop: '15px' }}>
            <p style={{ margin: '5px 0' }}>
              <span style={{ fontWeight: 'bold' }}>Payment Method:</span> {fee.paymentMethod}
            </p>
            <p style={{ margin: '5px 0' }}>
              <span style={{ fontWeight: 'bold' }}>Payment Status:</span> {fee.paymentStatus}
            </p>
            {fee.transactionId && (
              <p style={{ margin: '5px 0' }}>
                <span style={{ fontWeight: 'bold' }}>Transaction ID:</span> {fee.transactionId}
              </p>
            )}
          </div>
          
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <p style={{ margin: '4px 0' }}>Thank you for registering with our sports program!</p>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
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

export default RegistrationReceipt; 