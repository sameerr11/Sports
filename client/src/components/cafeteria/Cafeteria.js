import React, { useState, useEffect } from 'react';
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
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { getItems, createOrder } from '../../services/cafeteriaService';
import { isSupervisor } from '../../services/authService';
import { formatCurrency } from '../../utils/format';
import './Cafeteria.css';

const Cafeteria = () => {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderDialog, setOrderDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getItems();
      setItems(data);
    } catch (error) {
      setError(error.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
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
      
      // Show success message with items
      const itemsList = response.items.map(item => `${item.quantity}x ${item.name}`).join(', ');
      setSnackbar({
        open: true,
        message: `Order #${response.orderNumber} created successfully!\nItems: ${itemsList}\nTotal: ${formatCurrency(response.total)}`,
        severity: 'success'
      });

      // Clear cart and close dialog
      setCart([]);
      setCustomerName('');
      setOrderDialog(false);

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

  if (loading) {
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

  return (
    <Box className="cafeteria-container">
      <Box className="cafeteria-header">
        <Typography variant="h4" component="h1" gutterBottom>
          Cafeteria
        </Typography>
        {isSupervisor() && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            component="a"
            href="/cafeteria/manage"
          >
            Manage Items
          </Button>
        )}
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
            autoFocus
            margin="dense"
            label="Customer Name"
            fullWidth
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <TextField
            select
            margin="dense"
            label="Payment Method"
            fullWidth
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
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
    </Box>
  );
};

export default Cafeteria; 