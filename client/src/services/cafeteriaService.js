import api from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Item Management
export const getItems = async () => {
  try {
    const response = await api.get('/cafeteria/items');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error.response?.data?.message || 'Failed to fetch items';
  }
};

export const createItem = async (itemData) => {
  try {
    // Check if it contains an image file
    if (itemData.imageFile) {
      // Create FormData and append all other fields
      const formData = new FormData();
      formData.append('name', itemData.name);
      formData.append('description', itemData.description || '');
      formData.append('price', itemData.price);
      formData.append('category', itemData.category);
      formData.append('stock', itemData.stock);
      formData.append('minStockLevel', itemData.minStockLevel || '10');
      formData.append('isAvailable', itemData.isAvailable ? 'true' : 'false');
      
      // Append the image file
      formData.append('image', itemData.imageFile);
      
      const response = await api.post('/cafeteria/items', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.data;
    } else {
      // Standard JSON request
      const response = await api.post('/cafeteria/items', itemData);
      return response.data.data;
    }
  } catch (error) {
    console.error('Error creating item:', error);
    throw error.response?.data?.message || 'Failed to create item';
  }
};

export const updateItem = async (id, itemData) => {
  try {
    // Check if it contains an image file
    if (itemData.imageFile) {
      // Create FormData and append all other fields
      const formData = new FormData();
      formData.append('name', itemData.name);
      formData.append('description', itemData.description || '');
      formData.append('price', itemData.price);
      formData.append('category', itemData.category);
      formData.append('stock', itemData.stock);
      formData.append('minStockLevel', itemData.minStockLevel || '10');
      formData.append('isAvailable', itemData.isAvailable ? 'true' : 'false');
      
      // Append the image file
      formData.append('image', itemData.imageFile);
      
      const response = await api.put(`/cafeteria/items/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.data;
    } else {
      // Standard JSON request
      const response = await api.put(`/cafeteria/items/${id}`, itemData);
      return response.data.data;
    }
  } catch (error) {
    console.error('Error updating item:', error);
    throw error.response?.data?.message || 'Failed to update item';
  }
};

// Inventory Management
export const getInventoryLevels = async () => {
  try {
    // Use the existing items endpoint since it contains stock information
    const response = await api.get('/cafeteria/items');
    return response.data.data.map(item => ({
      ...item,
      minStockLevel: item.minStockLevel || 10, // Default minimum stock level if not set
      status: item.stock <= (item.minStockLevel || 10) ? 'Low Stock' : 'In Stock'
    }));
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error.response?.data?.message || 'Failed to fetch inventory';
  }
};

export const updateStockLevel = async (itemId, quantity) => {
  try {
    // Use the existing update item endpoint
    const response = await api.put(`/cafeteria/items/${itemId}`, { stock: quantity });
    return response.data.data;
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error.response?.data?.message || 'Failed to update stock';
  }
};

export const getLowStockAlerts = async () => {
  try {
    // Get all items and filter for low stock
    const response = await api.get('/cafeteria/items');
    const items = response.data.data;
    return items
      .filter(item => item.stock <= (item.minStockLevel || 10))
      .map(item => ({
        itemId: item._id,
        itemName: item.name,
        currentStock: item.stock,
        minStockLevel: item.minStockLevel || 10
      }));
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error.response?.data?.message || 'Failed to fetch alerts';
  }
};

export const getInventoryReport = async (startDate, endDate) => {
  try {
    // Get all items and calculate report data
    const response = await api.get('/cafeteria/items');
    const items = response.data.data;
    
    const totalItems = items.length;
    const lowStockItems = items.filter(item => item.stock <= (item.minStockLevel || 10)).length;
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.stock), 0);

    return {
      totalItems,
      lowStockItems,
      totalValue,
      items: items.map(item => ({
        name: item.name,
        stock: item.stock,
        value: item.price * item.stock
      }))
    };
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    throw error.response?.data?.message || 'Failed to fetch inventory report';
  }
};

// Order Management
export const createOrder = async (orderData) => {
  try {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('No items in order');
    }

    const response = await api.post('/cafeteria/orders', orderData);
    
    if (!response.data || !response.data.data) {
      throw new Error('Invalid server response');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error creating order:', error.response?.data || error);
    if (error.response?.data?.message?.includes('not found')) {
      throw new Error('One or more items in your order are no longer available');
    }
    throw new Error(error.response?.data?.message || 'Failed to create order. Please try again.');
  }
};

export const getOrderById = async (id) => {
  try {
    const response = await api.get(`/cafeteria/orders/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error.response?.data?.message || 'Failed to fetch order';
  }
};

export const updateOrderStatus = async (id, status) => {
  try {
    const response = await api.put(
      `/cafeteria/orders/${id}/status`,
      { paymentStatus: status }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error.response?.data?.message || 'Failed to update order status';
  }
};

// Receipt Management
export const getReceipts = async (params = {}) => {
  try {
    console.log('Fetching receipts with params:', params);
    const response = await api.get('/cafeteria/receipts', { params });
    console.log('Receipt response data:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching receipts:', error);
    throw error.response?.data?.message || 'Failed to fetch receipts';
  }
};

export const updateReceiptsSession = async (sessionId) => {
  try {
    const response = await api.put(`/cafeteria/receipts/session/${sessionId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error updating receipts session:', error);
    throw error.response?.data?.message || 'Failed to update receipts session';
  }
};

// Reports
export const getSalesReport = async (startDate, endDate, type = 'daily') => {
  try {
    const response = await api.get(
      `/cafeteria/reports/sales`,
      {
        params: { startDate, endDate, type }
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching sales report:', error);
    throw error.response?.data?.message || 'Failed to fetch sales report';
  }
};

// Settings
export const getSetting = async (settingName) => {
  try {
    const response = await api.get(`/cafeteria/settings/${settingName}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching setting ${settingName}:`, error);
    throw error.response?.data?.message || 'Failed to fetch setting';
  }
};

export const updateSetting = async (settingName, value, type = 'string') => {
  try {
    const response = await api.put(`/cafeteria/settings/${settingName}`, { value, type });
    return response.data.data;
  } catch (error) {
    console.error(`Error updating setting ${settingName}:`, error);
    throw error.response?.data?.message || 'Failed to update setting';
  }
};

// Session summaries
export const createSessionSummary = async (sessionData) => {
  try {
    const response = await api.post('/cafeteria/sessions', sessionData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating session summary:', error);
    throw error.response?.data?.message || 'Failed to save session summary';
  }
};

export const getSessionSummaries = async (params = {}) => {
  try {
    const response = await api.get('/cafeteria/sessions', { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching session summaries:', error);
    throw error.response?.data?.message || 'Failed to fetch session summaries';
  }
}; 