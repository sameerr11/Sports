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
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { getItems, createItem, updateItem } from '../../services/cafeteriaService';
import { formatCurrency } from '../../utils/format';

const CATEGORIES = ['Food', 'Beverage', 'Snack', 'Other'];

const ManageItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState({ open: false, type: 'create', item: null });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Food',
    stock: '',
    minStockLevel: '',
    isAvailable: true
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

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

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.price || formData.price <= 0) return 'Price must be greater than 0';
    if (!formData.stock || formData.stock < 0) return 'Stock cannot be negative';
    if (!formData.minStockLevel || formData.minStockLevel < 0) return 'Minimum stock level cannot be negative';
    return null;
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
      fetchItems();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save item',
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
        <Typography variant="h4">Manage Cafeteria Items</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Add Item
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Min. Stock</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>
                  {item.image ? (
                    <Box sx={{ width: 50, height: 50 }}>
                      <img 
                        src={item.image} 
                        alt={item.name}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                      <Typography variant="caption" color="text.secondary">
                        No Image
                      </Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{formatCurrency(item.price)}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell>{item.minStockLevel || 10}</TableCell>
                <TableCell>{item.isAvailable ? 'Available' : 'Unavailable'}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog('edit', item)}
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
          />
          <TextField
            select
            margin="dense"
            label="Availability"
            fullWidth
            value={formData.isAvailable}
            onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === 'true' })}
          >
            <MenuItem value="true">Available</MenuItem>
            <MenuItem value="false">Unavailable</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
      
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

export default ManageItems; 