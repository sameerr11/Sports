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
    const response = await api.post('/cafeteria/items', itemData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error.response?.data?.message || 'Failed to create item';
  }
};

export const updateItem = async (id, itemData) => {
  try {
    const response = await api.put(`/cafeteria/items/${id}`, itemData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error.response?.data?.message || 'Failed to update item';
  }
};

// Order Management
export const createOrder = async (orderData) => {
  try {
    const response = await api.post('/cafeteria/orders', orderData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error.response?.data?.message || 'Failed to create order';
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