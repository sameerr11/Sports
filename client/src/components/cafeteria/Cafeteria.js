import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Edit as EditIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { getItems, createOrder, getSetting, createSessionSummary, updateReceiptsSession } from '../../services/cafeteriaService';
import { isSupervisor } from '../../services/authService';
import { formatCurrency } from '../../utils/format';
import { Link } from 'react-router-dom';
import './Cafeteria.css';
import ReceiptPrint from './ReceiptPrint';

const Cafeteria = () => {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState(() => {
    const savedSession = localStorage.getItem('cafeSession');
    return savedSession ? JSON.parse(savedSession).cart || [] : [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderDialog, setOrderDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [sessionStarted, setSessionStarted] = useState(() => {
    const savedSession = localStorage.getItem('cafeSession');
    return savedSession ? JSON.parse(savedSession).active : false;
  });
  const [startingBalance, setStartingBalance] = useState(() => {
    const savedSession = localStorage.getItem('cafeSession');
    return savedSession ? JSON.parse(savedSession).startingBalance : '';
  });
  const [balanceError, setBalanceError] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [totalSales, setTotalSales] = useState(() => {
    const savedSession = localStorage.getItem('cafeSession');
    return savedSession ? JSON.parse(savedSession).totalSales : 0;
  });
  const [endSessionDialog, setEndSessionDialog] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(() => {
    const savedSession = localStorage.getItem('cafeSession');
    return savedSession ? JSON.parse(savedSession).startTime : null;
  });
  const [endingSession, setEndingSession] = useState(false);
  const [endSessionError, setEndSessionError] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [startingStock, setStartingStock] = useState([]);

  // Save session data to localStorage whenever it changes
  useEffect(() => {
    if (sessionStarted) {
      localStorage.setItem('cafeSession', JSON.stringify({
        active: sessionStarted,
        startingBalance,
        totalSales,
        cart,
        startTime: sessionStartTime
      }));
    } else {
      localStorage.removeItem('cafeSession');
    }
  }, [sessionStarted, startingBalance, totalSales, cart, sessionStartTime]);

  // Fetch items when session is started or component mounts (for page refreshes)
  useEffect(() => {
    if (sessionStarted) {
      fetchItems();
    }
  }, [sessionStarted]);

  // Add a new effect to fetch items whenever the component mounts if session is active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && sessionStarted) {
        fetchItems();
      }
    };

    // Fetch items on initial load if session is active
    if (sessionStarted) {
      fetchItems();
    }

    // Add event listener for visibility change (tab focus)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionStarted]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getItems();
      setItems(data);
      
      // If this is the first fetch (session start), save starting stock
      if (!sessionStarted || startingStock.length === 0) {
        setStartingStock(data.map(item => ({
          _id: item._id,
          name: item.name,
          stock: item.stock
        })));
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to load items. Please refresh the page.');
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    // Validate starting balance
    if (!startingBalance.trim()) {
      setBalanceError('Please enter a starting balance');
      return;
    }
    
    const balance = parseFloat(startingBalance);
    if (isNaN(balance) || balance < 0) {
      setBalanceError('Please enter a valid positive number');
      return;
    }
    
    try {
      // Validate PIN against database
      const result = await getSetting('cashierPIN');
      
      if (!result.exists || !result.value) {
        setPinError('No PIN has been set by supervisor. Please contact your supervisor.');
        return;
      }
      
      if (pinInput !== result.value) {
        setPinError('Invalid PIN. Please try again.');
        return;
      }
      
      setBalanceError('');
      setPinError('');
      // Set session start time
      setSessionStartTime(new Date().toISOString());
      setSessionStarted(true);
    } catch (error) {
      setPinError('Error validating PIN. Please try again later.');
      console.error('PIN validation error:', error);
    }
  };

  const handleAddToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem._id === item._id);
    if (existingItem) {
      if (existingItem.quantity >= item.stock) {
        setSnackbar({
          open: true,
          message: 'Maximum stock limit reached',
          severity: 'warning'
        });
        return;
      }
      setCart(cart.map(cartItem =>
        cartItem._id === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (itemId) => {
    const existingItem = cart.find(item => item._id === itemId);
    if (existingItem.quantity === 1) {
      setCart(cart.filter(item => item._id !== itemId));
    } else {
      setCart(cart.map(item =>
        item._id === itemId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    try {
      setProcessing(true);

      // Validate cart items
      if (cart.length === 0) {
        throw new Error('Cart is empty');
      }

      // Create order data
      const orderData = {
        items: cart.map(item => ({
          item: item._id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity
        })),
        total: getCartTotal(),
        paymentMethod: paymentMethod,
        paymentStatus: 'Completed',
        customer: {
          name: customerName || 'Walk-in Customer'
        }
      };

      // Create the order
      const response = await createOrder(orderData);
      
      // Update total sales
      setTotalSales(prevTotal => prevTotal + getCartTotal());
      
      // Show success message with items
      const itemsList = response.items.map(item => `${item.quantity}x ${item.name}`).join(', ');
      setSnackbar({
        open: true,
        message: `Order #${response.orderNumber} created successfully!\nItems: ${itemsList}\nTotal: ${formatCurrency(response.total)}`,
        severity: 'success'
      });

      // Store receipt data for printing
      if (response.receipt) {
        setReceiptData(response.receipt);
        setReceiptDialog(true);
      }

      // Clear cart and close dialog
      setCart([]);
      setCustomerName('');
      setOrderDialog(false);

      // Refresh items to update stock values
      fetchItems();

    } catch (error) {
      console.error('Checkout error:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to process order. Please try again.',
        severity: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEndSession = () => {
    setEndSessionDialog(true);
  };

  const confirmEndSession = async () => {
    try {
      setEndingSession(true);
      setEndSessionError('');
      
      // Create session data
      const endTime = new Date().toISOString();
      const sessionSummary = {
        startTime: sessionStartTime,
        endTime: endTime,
        startingBalance: parseFloat(startingBalance),
        totalSales: totalSales,
        finalBalance: parseFloat(startingBalance) + totalSales,
        startingStock: startingStock,
        endingStock: items.map(item => ({
          _id: item._id,
          name: item.name,
          stock: item.stock
        }))
      };

      // Save to database
      const savedSession = await createSessionSummary(sessionSummary);
      
      // Update receipts with session id
      if (savedSession && savedSession._id) {
        try {
          await updateReceiptsSession(savedSession._id);
        } catch (error) {
          console.error('Error updating receipts session:', error);
          // Non-critical error, continue with session end
        }
      }
      
      // Clear current session
      localStorage.removeItem('cafeSession');
      
      // Then update state
      setEndSessionDialog(false);
      setSessionStarted(false);
      setCart([]);
      setItems([]);
      setStartingBalance('');
      setTotalSales(0);
      setSessionStartTime(null);
      setPinInput(''); // Clear PIN input for security
    } catch (error) {
      console.error('Error saving session summary:', error);
      setEndSessionError('Failed to save session summary. Please try again.');
    } finally {
      setEndingSession(false);
    }
  };

  if (loading && sessionStarted) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!sessionStarted) {
    return (
      <Box className="cafeteria-container" display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Cafe Cashier
          </Typography>
          <Typography variant="subtitle1" align="center" gutterBottom>
            Please enter the starting balance and PIN to begin
          </Typography>
          <TextField
            autoFocus
            fullWidth
            margin="normal"
            label="Starting Balance"
            variant="outlined"
            type="number"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
            error={!!balanceError}
            helperText={balanceError}
            inputProps={{ min: "0" }}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
            }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="PIN"
            variant="outlined"
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            error={!!pinError}
            helperText={pinError}
            inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            startIcon={<StartIcon />}
            onClick={handleStartSession}
            sx={{ mt: 3 }}
          >
            Start Session
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box className="cafeteria-container">
      <Box className="cafeteria-header">
        <Typography variant="h4" component="h1" gutterBottom>
          Cafeteria
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={fetchItems}
            sx={{ mr: 2 }}
          >
            Refresh Stock
          </Button>
          {isSupervisor() && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              component="a"
              href="/cafeteria/manage"
              sx={{ mr: 2 }}
            >
              Manage Items
            </Button>
          )}
          <Button
            variant="contained"
            color="secondary"
            startIcon={<StopIcon />}
            onClick={handleEndSession}
          >
            End Session
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Items Grid */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {items.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item._id}>
                <Card className="item-card">
                  <CardContent>
                    <Typography variant="h6" component="h2">
                      {item.name}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      {item.category}
                    </Typography>
                    <Typography variant="body2" component="p">
                      {item.description}
                    </Typography>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {formatCurrency(item.price)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Stock: {item.stock}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={!item.isAvailable || item.stock === 0}
                      onClick={() => handleAddToCart(item)}
                    >
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Cart */}
        <Grid item xs={12} md={4}>
          <Card className="cart-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cart
              </Typography>
              
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Starting Balance: {formatCurrency(parseFloat(startingBalance))}
              </Typography>
              
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Sales: {formatCurrency(totalSales)}
              </Typography>

              {cart.length === 0 ? (
                <Typography color="textSecondary">
                  Your cart is empty
                </Typography>
              ) : (
                <>
                  {cart.map((item) => (
                    <Box key={item._id} className="cart-item">
                      <Typography variant="body1">
                        {item.name}
                      </Typography>
                      <Box className="cart-item-controls">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveFromCart(item._id)}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography variant="body2" mx={1}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleAddToCart(item)}
                          disabled={item.quantity >= item.stock}
                        >
                          <AddIcon />
                        </IconButton>
                        <Typography variant="body2" ml={2}>
                          {formatCurrency(item.price * item.quantity)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  <Box mt={2}>
                    <Typography variant="h6">
                      Total: {formatCurrency(getCartTotal())}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<CartIcon />}
                      onClick={() => setOrderDialog(true)}
                      sx={{ mt: 2 }}
                    >
                      Checkout
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Checkout Dialog */}
      <Dialog open={orderDialog} onClose={() => setOrderDialog(false)}>
        <DialogTitle>Complete Order</DialogTitle>
        <DialogContent>
          <TextField
            select
            margin="dense"
            label="Payment Method"
            fullWidth
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            autoFocus
          >
            <MenuItem value="Cash">Cash</MenuItem>

          </TextField>
          <Typography variant="h6" mt={2}>
            Total: {formatCurrency(getCartTotal())}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCheckout}
            variant="contained"
            color="primary"
            disabled={processing}
          >
            {processing ? <CircularProgress size={24} /> : 'Complete Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Receipt Dialog */}
      {receiptData && (
        <ReceiptPrint
          receipt={receiptData}
          open={receiptDialog}
          onClose={() => setReceiptDialog(false)}
        />
      )}

      {/* End Session Dialog */}
      <Dialog 
        open={endSessionDialog} 
        onClose={() => !endingSession && setEndSessionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Session Summary</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Starting Balance:</strong> {formatCurrency(parseFloat(startingBalance))}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Total Sales:</strong> {formatCurrency(totalSales)}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Remaining Balance:</strong> {formatCurrency(parseFloat(startingBalance) + totalSales)}
            </Typography>
          </Box>
          
          {/* Starting Stock Summary */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Inventory Summary
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="center">Starting Stock</TableCell>
                  <TableCell align="center">Current Stock</TableCell>
                  <TableCell align="center">Units Sold</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {startingStock.map(startItem => {
                  // Find current item stock
                  const currentItem = items.find(item => item._id === startItem._id);
                  const currentStock = currentItem ? currentItem.stock : 0;
                  const soldUnits = startItem.stock - currentStock;
                  
                  return (
                    <TableRow key={startItem._id}>
                      <TableCell>{startItem.name}</TableCell>
                      <TableCell align="center">{startItem.stock}</TableCell>
                      <TableCell align="center">{currentStock}</TableCell>
                      <TableCell align="center">{soldUnits > 0 ? soldUnits : 0}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {endSessionError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {endSessionError}
            </Alert>
          )}
          <Typography variant="body2" color="textSecondary">
            Are you sure you want to end this session?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndSessionDialog(false)} disabled={endingSession}>Cancel</Button>
          <Button onClick={confirmEndSession} variant="contained" color="primary" disabled={endingSession}>
            {endingSession ? <CircularProgress size={24} /> : 'End Session'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Cafeteria; 