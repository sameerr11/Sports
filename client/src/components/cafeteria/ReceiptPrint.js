import React, { useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { formatCurrency } from '../../utils/format';
import { format } from 'date-fns';

const ReceiptPrint = ({ receipt, open, onClose }) => {
  const handlePrint = () => {
    const content = document.getElementById('receipt-to-print');
    
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
          <title>Receipt #${receipt.orderNumber}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 1cm;
              font-size: 12px;
            }
            .receipt {
              width: 80mm;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
            }
            .logo {
              max-width: 60px;
              max-height: 60px;
              margin: 0 auto 8px;
              display: block;
            }
            .company-name {
              font-size: 18px;
              font-weight: bold;
              margin: 5px 0;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .item-name {
              width: 60%;
              text-align: left;
            }
            .item-qty {
              width: 10%;
              text-align: center;
            }
            .item-price {
              width: 30%;
              text-align: right;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              text-align: left;
              padding: 3px;
            }
            th:nth-child(2), td:nth-child(2) {
              text-align: center;
            }
            th:nth-child(3), td:nth-child(3) {
              text-align: right;
            }
            .text-right {
              text-align: right;
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
          <div class="receipt">
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

  if (!receipt) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{ 
        sx: { 
          width: '320px',
          maxWidth: '90vw'
        } 
      }}
    >
      <DialogTitle>Receipt</DialogTitle>
      <DialogContent>
        <div id="receipt-to-print" style={{ padding: '16px' }}>
          <div className="header">
            <img src="/logo192.png" alt="Logo" className="logo" style={{ maxWidth: '60px', maxHeight: '60px', margin: '0 auto 8px', display: 'block' }} />
            <h2 style={{ margin: '5px 0', fontSize: '18px' }}>SPORTS MANAGEMENT</h2>
            <p style={{ margin: '4px 0', textAlign: 'center' }}>Receipt #{receipt.orderNumber}</p>
            <p style={{ margin: '4px 0', textAlign: 'center' }}>
              {format(new Date(receipt.date), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
          
          <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px dashed #000' }} />
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px dashed #000' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontWeight: 'bold' }}>
            <span>Total</span>
            <span>{formatCurrency(receipt.total)}</span>
          </div>
          
          <div style={{ marginTop: '8px' }}>
            <p style={{ margin: '4px 0' }}>Payment Method: {receipt.paymentMethod}</p>
            <p style={{ margin: '4px 0' }}>Cashier: {receipt.cashier}</p>
            <p style={{ margin: '4px 0' }}>Customer: {receipt.customer}</p>
          </div>
          
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <p style={{ margin: '4px 0' }}>Thank you for your purchase!</p>
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

export default ReceiptPrint; 