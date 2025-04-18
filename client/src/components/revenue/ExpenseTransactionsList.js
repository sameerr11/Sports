import React, { useState, useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import { getExpenseTransactions } from '../../services/revenueService';
import { formatDate } from '../../utils/formatters';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';

const ExpenseTransactionsList = ({ dateRange, onSuccess }) => {
  const [transactions, setTransactions] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [filters, setFilters] = useState({
    expenseType: '',
    paymentStatus: '',
    startDate: dateRange?.startDate || '',
    endDate: dateRange?.endDate || ''
  });

  // Fetch expense transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { transactions, pagination: paginationData, totalAmount } = await getExpenseTransactions({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      
      setTransactions(transactions);
      setPagination(paginationData);
      setTotalAmount(totalAmount);
      setError(null);
      
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to load expense transactions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update filters when date range changes from parent
  useEffect(() => {
    if (dateRange) {
      setFilters(prev => ({
        ...prev,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }));
    }
  }, [dateRange]);

  // Fetch transactions when filters or pagination changes
  useEffect(() => {
    fetchTransactions();
  }, [filters, pagination.page, pagination.limit]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filters change
  };

  const handlePageChange = (event, page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const getExpenseTypeChip = (expenseType) => {
    const colors = {
      Salary: 'error',
      Utility: 'warning',
      Maintenance: 'info',
      Equipment: 'primary',
      Other: 'default'
    };

    return (
      <Chip
        label={expenseType}
        color={colors[expenseType] || 'default'}
        size="small"
      />
    );
  };

  const getStatusChip = (status) => {
    return (
      <Chip
        label={status}
        color={status === 'Paid' ? 'success' : 'warning'}
        size="small"
        icon={status === 'Paid' ? <CheckCircleIcon /> : <PendingIcon />}
      />
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Expense Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and filter expense transactions
          </Typography>
        </Box>
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2, minWidth: 200 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total Amount
          </Typography>
          <Typography variant="h5" color="error.main">
            ${totalAmount.toFixed(2)}
          </Typography>
        </Paper>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} md={3} lg={3}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="expense-type-label">Expense Type</InputLabel>
              <Select
                labelId="expense-type-label"
                id="expense-type"
                name="expenseType"
                value={filters.expenseType}
                onChange={handleFilterChange}
                label="Expense Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="Salary">Salary</MenuItem>
                <MenuItem value="Utility">Utility</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
                <MenuItem value="Equipment">Equipment</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3} lg={3}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="payment-status-label">Status</InputLabel>
              <Select
                labelId="payment-status-label"
                id="payment-status"
                name="paymentStatus"
                value={filters.paymentStatus}
                onChange={handleFilterChange}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3} lg={3}>
            <TextField
              fullWidth
              id="start-date"
              label="Start Date"
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              InputLabelProps={{
                shrink: true,
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3} lg={3}>
            <TextField
              fullWidth
              id="end-date"
              label="End Date"
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              InputLabelProps={{
                shrink: true,
              }}
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table sx={{ minWidth: 650 }} aria-label="expense transactions table">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'background.default' }}>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map(transaction => (
                  <TableRow key={transaction._id} hover>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>{getExpenseTypeChip(transaction.expenseType)}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{getStatusChip(transaction.paymentStatus)}</TableCell>
                    <TableCell>
                      {transaction.createdBy ? 
                        `${transaction.createdBy.firstName} ${transaction.createdBy.lastName}` : 
                        'System'
                      }
                    </TableCell>
                    <TableCell align="right">${transaction.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      No expense transactions found for the selected criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {transactions.length} of {pagination.total} transactions
            </Typography>
            {pagination.pages > 1 && (
              <Stack spacing={2}>
                <Pagination 
                  count={pagination.pages} 
                  page={pagination.page} 
                  onChange={handlePageChange}
                  color="primary"
                  shape="rounded"
                />
              </Stack>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default ExpenseTransactionsList; 