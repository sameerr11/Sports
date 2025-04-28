import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { 
  getItems, 
  createItem, 
  updateItem, 
  getLowStockAlerts,
  getInventoryReport 
} from '../../services/cafeteriaService';
import { formatCurrency } from '../../utils/format';
import { Link } from 'react-router-dom';

const CATEGORIES = ['Food', 'Beverage', 'Snack', 'Other'];

const CafeteriaManagement = () => {
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [dialog, setDialog] = useState({ open: false, type: 'create', item: null });
  const [reportDialog, setReportDialog] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [report, setReport] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Food',
    stock: '',
    minStockLevel: '10',
    isAvailable: true
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [itemsData, alertsData] = await Promise.all([
        getItems(),
        getLowStockAlerts()
      ]);
      setItems(itemsData);
      setAlerts(alertsData);
    } catch (error) {
      setError(error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type, item = null) => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        category: item.category,
        stock: item.stock.toString(),
        minStockLevel: item.minStockLevel?.toString() || '10',
        isAvailable: item.isAvailable
      });
      
      setImagePreview(item.image || '');
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Food',
        stock: '',
        minStockLevel: '10',
        isAvailable: true
      });
      
      setImagePreview('');
      setImageFile(null);
    }
    
    setDialog({ open: true, type, item });
  };

  const handleCloseDialog = () => {
    setDialog({ open: false, type: 'create', item: null });
    setImageFile(null);
    setImagePreview('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.price || formData.price <= 0) return 'Price must be greater than 0';
    if (!formData.stock || formData.stock < 0) return 'Stock cannot be negative';
    if (!formData.minStockLevel || formData.minStockLevel < 0) return 'Minimum stock level cannot be negative';
    return null;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      const error = validateForm();
      if (error) {
        setSnackbar({
          open: true,
          message: error,
          severity: 'error'
        });
        return;
      }

      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        minStockLevel: parseInt(formData.minStockLevel, 10)
      };
      
      if (imageFile) {
        itemData.imageFile = imageFile;
      }

      if (dialog.type === 'create') {
        await createItem(itemData);
        setSnackbar({
          open: true,
          message: 'Item created successfully',
          severity: 'success'
        });
      } else {
        await updateItem(dialog.item._id, itemData);
        setSnackbar({
          open: true,
          message: 'Item updated successfully',
          severity: 'success'
        });
      }

      handleCloseDialog();
      fetchData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save item',
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
        message: error.message || 'Failed to generate report',
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Cafeteria Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AssessmentIcon />}
            onClick={() => setReportDialog(true)}
            sx={{ mr: 2 }}
          >
            Generate Report
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('create')}
          >
            Add Item
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

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="All Items" />
        <Tab 
          label={
            <Badge badgeContent={alerts.length} color="error" sx={{ pr: 2 }}>
              Low Stock Items
            </Badge>
          } 
        />
      </Tabs>

      {/* Items Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Current Stock</TableCell>
              <TableCell>Min. Stock Level</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items
              .filter(item => activeTab === 0 || item.stock <= (item.minStockLevel || 10))
              .map((item) => (
                <TableRow 
                  key={item._id}
                  sx={{
                    backgroundColor: item.stock <= (item.minStockLevel || 10) ? '#ffebee' : 'inherit'
                  }}
                >
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell>{item.stock}</TableCell>
                  <TableCell>{item.minStockLevel || 10}</TableCell>
                  <TableCell>
                    <Typography
                      color={item.stock <= (item.minStockLevel || 10) ? 'error' : 'success'}
                    >
                      {!item.isAvailable ? 'Unavailable' : 
                        item.stock <= (item.minStockLevel || 10) ? 'Low Stock' : 'In Stock'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Item">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog('edit', item)}
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

      {/* Add/Edit Item Dialog */}
      <Dialog open={dialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialog.type === 'create' ? 'Add New Item' : 'Edit Item'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Price"
            type="number"
            fullWidth
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            inputProps={{ min: 0, step: 0.01 }}
          />
          <TextField
            select
            margin="dense"
            label="Category"
            fullWidth
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Stock"
            type="number"
            fullWidth
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            inputProps={{ min: 0 }}
          />
          <TextField
            margin="dense"
            label="Minimum Stock Level"
            type="number"
            fullWidth
            value={formData.minStockLevel}
            onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
            inputProps={{ min: 0 }}
            helperText="Alert will be shown when stock falls below this level"
          />
          <TextField
            select
            margin="dense"
            label="Status"
            fullWidth
            value={formData.isAvailable}
            onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value })}
          >
            <MenuItem value={true}>Available</MenuItem>
            <MenuItem value={false}>Unavailable</MenuItem>
          </TextField>
          
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Item Image
            </Typography>
            
            {imagePreview && (
              <Box 
                sx={{ 
                  width: '100%',
                  height: 200,
                  mb: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#f5f5f5'
                }}
              >
                <img 
                  src={imagePreview} 
                  alt="Item preview" 
                  style={{ 
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }} 
                />
              </Box>
            )}
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
            >
              {imagePreview ? 'Change Image' : 'Upload Image'}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageChange}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {dialog.type === 'create' ? 'Add Item' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Dialog */}
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

      {/* Snackbar */}
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

export default CafeteriaManagement; 