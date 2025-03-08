import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Assessment as AssessmentIcon,
  Edit as EditIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  getInventoryLevels,
  updateStockLevel,
  getLowStockAlerts,
  getInventoryReport
} from '../../services/cafeteriaService';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState({ open: false, item: null });
  const [quantity, setQuantity] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [reportDialog, setReportDialog] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [inventoryData, alertsData] = await Promise.all([
        getInventoryLevels(),
        getLowStockAlerts()
      ]);
      setInventory(inventoryData);
      setAlerts(alertsData);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    try {
      if (!quantity || quantity < 0) {
        setSnackbar({
          open: true,
          message: 'Please enter a valid quantity',
          severity: 'error'
        });
        return;
      }

      await updateStockLevel(dialog.item._id, parseInt(quantity));
      setSnackbar({
        open: true,
        message: 'Stock updated successfully',
        severity: 'success'
      });
      setDialog({ open: false, item: null });
      setQuantity('');
      fetchInventoryData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update stock',
        severity: 'error'
      });
    }
  };

  const handleGenerateReport = async () => {
    try {
      if (!dateRange.start || !dateRange.end) {
        setSnackbar({
          open: true,
          message: 'Please select both start and end dates',
          severity: 'error'
        });
        return;
      }

      const reportData = await getInventoryReport(
        dateRange.start.toISOString(),
        dateRange.end.toISOString()
      );
      setReport(reportData);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
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
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Inventory Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AssessmentIcon />}
            onClick={() => setReportDialog(true)}
            sx={{ ml: 2 }}
          >
            Generate Report
          </Button>
        </Box>
      </Box>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Low Stock Alerts
          </Typography>
          {alerts.map((alert) => (
            <Typography key={alert.itemId}>
              • {alert.itemName} - Current stock: {alert.currentStock} (Min: {alert.minStockLevel})
            </Typography>
          ))}
        </Alert>
      )}

      {/* Inventory Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Current Stock</TableCell>
              <TableCell>Min. Stock Level</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map((item) => (
              <TableRow 
                key={item._id}
                sx={{
                  backgroundColor: item.stock <= (item.minStockLevel || 10) ? '#ffebee' : 'inherit'
                }}
              >
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell>{item.minStockLevel || 10}</TableCell>
                <TableCell>
                  <Typography
                    color={item.stock <= (item.minStockLevel || 10) ? 'error' : 'success'}
                  >
                    {item.stock <= (item.minStockLevel || 10) ? 'Low Stock' : 'In Stock'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Update Stock">
                    <IconButton
                      color="primary"
                      onClick={() => {
                        setQuantity(item.stock.toString());
                        setDialog({ open: true, item });
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Update Stock Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, item: null })}>
        <DialogTitle>Update Stock Level</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Typography variant="body2" gutterBottom>
              Item: {dialog.item?.name}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Current Stock: {dialog.item?.stock}
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="New Quantity"
              type="number"
              fullWidth
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialog({ open: false, item: null });
            setQuantity('');
          }}>
            Cancel
          </Button>
          <Button onClick={handleUpdateStock} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Report Dialog */}
      <Dialog
        open={reportDialog}
        onClose={() => setReportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Inventory Report</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box display="flex" gap={2} mb={3} mt={2}>
              <DatePicker
                label="Start Date"
                value={dateRange.start}
                onChange={(date) => setDateRange({ ...dateRange, start: date })}
              />
              <DatePicker
                label="End Date"
                value={dateRange.end}
                onChange={(date) => setDateRange({ ...dateRange, end: date })}
              />
            </Box>
          </LocalizationProvider>

          {report && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Report Summary
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Items
                      </Typography>
                      <Typography variant="h4">
                        {report.totalItems}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Low Stock Items
                      </Typography>
                      <Typography variant="h4" color="error">
                        {report.lowStockItems}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Stock Value
                      </Typography>
                      <Typography variant="h4">
                        ${report.totalValue.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {report.items && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    Item Details
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item Name</TableCell>
                          <TableCell align="right">Stock</TableCell>
                          <TableCell align="right">Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {report.items.map((item) => (
                          <TableRow key={item.name}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell align="right">{item.stock}</TableCell>
                            <TableCell align="right">${item.value.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>Close</Button>
          <Button onClick={handleGenerateReport} variant="contained" color="primary">
            Generate Report
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

export default InventoryManagement; 