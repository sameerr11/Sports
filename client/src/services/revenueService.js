import api from './api';

// Get revenue dashboard data
export const getRevenueDashboardData = async (startDate, endDate) => {
  try {
    console.log(`Fetching dashboard data for range: ${startDate} to ${endDate}`);
    
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    console.log('API request params:', params);
    
    const response = await api.get('/revenue/dashboard', { params });
    console.log('API response received:', response.data);
    
    // Add validation to ensure required data structure exists
    const data = response.data.data;
    if (!data) {
      console.error('API response missing data property');
      throw new Error('Invalid API response format');
    }
    
    // Validate and log the chart data
    if (!data.monthlyRevenue || !Array.isArray(data.monthlyRevenue)) {
      console.error('Monthly revenue data missing or invalid:', data.monthlyRevenue);
      data.monthlyRevenue = [];
    } else {
      console.log(`Monthly revenue data has ${data.monthlyRevenue.length} data points`);
    }
    
    if (!data.monthlyExpenses || !Array.isArray(data.monthlyExpenses)) {
      console.error('Monthly expenses data missing or invalid:', data.monthlyExpenses);
      data.monthlyExpenses = [];
    } else {
      console.log(`Monthly expenses data has ${data.monthlyExpenses.length} data points`);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching revenue dashboard data:', error);
    throw error.response?.data?.message || 'Failed to fetch revenue dashboard data';
  }
};

// Get revenue transactions with filters
export const getRevenueTransactions = async (filters = {}) => {
  try {
    const response = await api.get('/revenue/transactions', { params: filters });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching revenue transactions:', error);
    throw error.response?.data?.message || 'Failed to fetch revenue transactions';
  }
};

// Get expense transactions with filters
export const getExpenseTransactions = async (filters = {}) => {
  try {
    const response = await api.get('/revenue/expenses', { params: filters });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching expense transactions:', error);
    throw error.response?.data?.message || 'Failed to fetch expense transactions';
  }
};

// Add a new revenue transaction
export const addRevenueTransaction = async (transactionData) => {
  try {
    const response = await api.post('/revenue/transactions', transactionData);
    return response.data.data;
  } catch (error) {
    console.error('Error adding revenue transaction:', error);
    throw error.response?.data?.message || 'Failed to add revenue transaction';
  }
};

// Add a new expense transaction
export const addExpenseTransaction = async (transactionData) => {
  try {
    const response = await api.post('/revenue/expenses', transactionData);
    return response.data.data;
  } catch (error) {
    console.error('Error adding expense transaction:', error);
    throw error.response?.data?.message || 'Failed to add expense transaction';
  }
};

// Update expense payment status
export const updateExpenseStatus = async (expenseId, paymentStatus) => {
  try {
    const response = await api.put(`/revenue/expenses/${expenseId}/status`, { paymentStatus });
    return response.data.data;
  } catch (error) {
    console.error('Error updating expense status:', error);
    throw error.response?.data?.message || 'Failed to update expense status';
  }
}; 