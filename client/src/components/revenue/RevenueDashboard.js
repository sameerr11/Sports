import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getRevenueDashboardData } from '../../services/revenueService';
import RevenueTransactionsList from './RevenueTransactionsList';
import ExpenseTransactionsList from './ExpenseTransactionsList';
import { Box, Paper, Typography, TextField, IconButton, Stack, Tab, Tabs, styled, useTheme } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format, isValid, parseISO } from 'date-fns';
import { getStoredUser } from '../../services/authService';

// Register Chart.js components - ensure Filler is included
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler // Important for the area fill under the line
);

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: '1px solid #e8e8e8',
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
  },
}));

const StyledTab = styled((props) => <Tab disableRipple {...props} />)(
  ({ theme }) => ({
    textTransform: 'none',
    minWidth: 0,
    [theme.breakpoints.up('sm')]: {
      minWidth: 0,
    },
    fontWeight: theme.typography.fontWeightRegular,
    marginRight: theme.spacing(1),
    color: 'rgba(0, 0, 0, 0.85)',
    '&.Mui-selected': {
      color: theme.palette.primary.main,
      fontWeight: theme.typography.fontWeightMedium,
    },
    '&.Mui-focusVisible': {
      backgroundColor: '#d1eaff',
    },
  }),
);

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`revenue-tabpanel-${index}`}
      aria-labelledby={`revenue-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const RevenueDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [activeTab, setActiveTab] = useState(0);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure dates are valid
      console.log(`Fetching dashboard data with date range: ${dateRange.startDate} to ${dateRange.endDate}`);
      
      // If we're in development, add more data points to simulate a wave
      const data = await getRevenueDashboardData(dateRange.startDate, dateRange.endDate);
      console.log('Dashboard data received:', data);
      
      // Specifically log the chart data parts
      if (data) {
        console.log('Monthly revenue data:', data.monthlyRevenue);
        console.log('Monthly expenses data:', data.monthlyExpenses);
        
        // Check if we have the date property in each item
        if (data.monthlyRevenue && data.monthlyRevenue.length > 0) {
          if (!data.monthlyRevenue[0].date) {
            console.warn('Missing date property in monthlyRevenue data - checking for month property instead');
            
            // If we don't have date property but have month property, map to the expected format
            if (data.monthlyRevenue[0].month) {
              data.monthlyRevenue = data.monthlyRevenue.map(item => ({
                ...item,
                date: item.month
              }));
              console.log('Mapped month property to date:', data.monthlyRevenue);
            }
          }
        }
        
        // Do the same for expenses
        if (data.monthlyExpenses && data.monthlyExpenses.length > 0) {
          if (!data.monthlyExpenses[0].date) {
            console.warn('Missing date property in monthlyExpenses data - checking for month property instead');
            
            // If we don't have date property but have month property, map to the expected format
            if (data.monthlyExpenses[0].month) {
              data.monthlyExpenses = data.monthlyExpenses.map(item => ({
                ...item,
                date: item.month
              }));
              console.log('Mapped month property to date:', data.monthlyExpenses);
            }
          }
        }
      }
      
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch dashboard data on initial component mount
    fetchDashboardData();
    // Empty dependency array so this effect runs only once on mount
  }, []);

  const handleDateChange = (e) => {
    const newDateRange = {
      ...dateRange,
      [e.target.name]: e.target.value
    };
    setDateRange(newDateRange);
    
    // Immediately fetch data with the new date range
    // instead of waiting for the useEffect
    fetchDashboardData();
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Prepare chart data
  const getChartData = () => {
    // Safety check for data availability
    if (!dashboardData || !dashboardData.monthlyRevenue || !dashboardData.monthlyExpenses) {
      console.log("Missing dashboard data for chart:", dashboardData);
      return {
        labels: ['No Data'],
        datasets: [
          {
            label: 'Revenue',
            data: [0],
            borderColor: 'rgb(0, 145, 174)',
            backgroundColor: 'rgba(0, 145, 174, 0.4)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Expenses',
            data: [0],
            borderColor: 'rgb(220, 53, 69)',
            backgroundColor: 'rgba(220, 53, 69, 0.4)',
            fill: true,
            tension: 0.4
          },
        ],
      };
    }

    try {
      console.log("Preparing chart data with:", dashboardData.monthlyRevenue);
      
      // Create arrays of the original data
      let revenueData = [...dashboardData.monthlyRevenue];
      let expenseData = [...dashboardData.monthlyExpenses];
      
      // Ensure expense data has matching dates with revenue data
      if (revenueData.length > 0 && expenseData.length === 0) {
        // Create expense data points with 0 values if none exist
        expenseData = revenueData.map(item => ({
          date: item.date,
          total: 0
        }));
      }
      
      // Sort data by date
      revenueData.sort((a, b) => {
        return (a.date || '').localeCompare(b.date || '');
      });
      
      expenseData.sort((a, b) => {
        return (a.date || '').localeCompare(b.date || '');
      });
      
      // Generate formatted labels for months using the date property
      const labels = revenueData.map(item => {
        try {
          // Backend returns date as "YYYY-MM"
          const dateStr = item.date;
          if (!dateStr) return 'Unknown';
          
          // Convert to date object (adding day as 01 since we only have year-month)
          const date = new Date(`${dateStr}-01`);
          return isValid(date) ? format(date, 'MMM yyyy') : dateStr;
        } catch (error) {
          console.error("Error formatting date:", error, item);
          return item.date || 'Unknown'; // Use the raw value if formatting fails
        }
      });

      // If we have no labels, return empty chart data
      if (labels.length === 0) {
        return {
          labels: ['No Data'],
          datasets: [
            {
              label: 'Revenue',
              data: [0],
              borderColor: 'rgb(0, 145, 174)',
              backgroundColor: 'rgba(0, 145, 174, 0.4)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Expenses',
              data: [0],
              borderColor: 'rgb(220, 53, 69)',
              backgroundColor: 'rgba(220, 53, 69, 0.4)',
              fill: true,
              tension: 0.4
            },
          ],
        };
      }

      // If we only have one or two data points, create a smoother curve
      // by adding interpolated points before and after
      if (labels.length <= 2) {
        console.log("Limited data points, creating wave visualization");
        
        const newLabels = [];
        const newRevenueData = [];
        const newExpenseData = [];
        
        // For each actual data point, create surrounding points to create a wave
        revenueData.forEach((item, index) => {
          const revenueAmount = item.total;
          const expenseAmount = expenseData[index]?.total || 0;
          
          // Add a point before (slightly lower)
          if (index === 0) {
            newLabels.push('');
            newRevenueData.push(revenueAmount * 0.85);
            newExpenseData.push(expenseAmount * 0.85);
          }
          
          // Add the actual data point
          newLabels.push(labels[index]);
          newRevenueData.push(revenueAmount);
          newExpenseData.push(expenseAmount);
          
          // Add a point after (slightly lower)
          if (index === revenueData.length - 1) {
            newLabels.push('');
            newRevenueData.push(revenueAmount * 0.85);
            newExpenseData.push(expenseAmount * 0.85);
          }
          
          // If there's another real data point, add an intermediate point
          if (index < revenueData.length - 1) {
            const nextRevenueAmount = revenueData[index + 1].total;
            const nextExpenseAmount = expenseData[index + 1]?.total || 0;
            
            newLabels.push('');
            newRevenueData.push((revenueAmount + nextRevenueAmount) * 0.5 * 0.9);
            newExpenseData.push((expenseAmount + nextExpenseAmount) * 0.5 * 0.9);
          }
        });
        
        return {
          labels: newLabels,
          datasets: [
            {
              label: 'Revenue',
              data: newRevenueData,
              borderColor: 'rgb(0, 145, 174)',
              backgroundColor: 'rgba(0, 145, 174, 0.4)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              // Only show points for actual data, not interpolated points
              pointRadius: newLabels.map(label => label === '' ? 0 : 4)
            },
            {
              label: 'Expenses',
              data: newExpenseData,
              borderColor: 'rgb(220, 53, 69)',
              backgroundColor: 'rgba(220, 53, 69, 0.4)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              // Only show points for actual data, not interpolated points
              pointRadius: newLabels.map(label => label === '' ? 0 : 4)
            },
          ],
        };
      }

      // For 3 or more points, we can use the actual data
      const chartData = {
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: revenueData.map(item => item.total),
            borderColor: 'rgb(0, 145, 174)',
            backgroundColor: 'rgba(0, 145, 174, 0.4)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Expenses',
            data: expenseData.map(item => item.total),
            borderColor: 'rgb(220, 53, 69)',
            backgroundColor: 'rgba(220, 53, 69, 0.4)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          },
        ],
      };

      console.log("Final chart data prepared:", chartData);
      return chartData;
    } catch (error) {
      console.error("Error preparing chart data:", error);
      // Return default data structure if there's an error
      return {
        labels: ['Error'],
        datasets: [
          {
            label: 'Revenue',
            data: [0],
            borderColor: 'rgb(0, 145, 174)',
            backgroundColor: 'rgba(0, 145, 174, 0.4)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Expenses',
            data: [0],
            borderColor: 'rgb(220, 53, 69)',
            backgroundColor: 'rgba(220, 53, 69, 0.4)',
            fill: true,
            tension: 0.4
          },
        ],
      };
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            return '$' + value;
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        backgroundColor: 'white',
        borderWidth: 2
      }
    }
  };

  if (loading && !dashboardData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            fontWeight: 800, 
            color: 'primary.dark',
            mb: 1,
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 80,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'primary.main'
            }
          }}
        >
          Welcome, {getStoredUser()?.firstName || 'User'}!
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary" 
          sx={{ 
            fontSize: '1.1rem', 
            maxWidth: '800px',
            mt: 2 
          }}
        >
          Monitor and manage all revenue and expenses in one place
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Revenue Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage financial transactions
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
          <StyledTabs value={activeTab} onChange={handleTabChange} aria-label="revenue tabs">
            <StyledTab label="Dashboard" id="revenue-tab-0" />
            <StyledTab label="Revenue Transactions" id="revenue-tab-1" />
            <StyledTab label="Expense Transactions" id="revenue-tab-2" />
          </StyledTabs>
          
          <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1 }}>
            <TextField
              type="date"
              size="small"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <Typography variant="body2">to</Typography>
            <TextField
              type="date"
              size="small"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Stack>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {error && (
            <Box sx={{ mb: 3 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
          
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </Box>
          )}

          <TabPanel value={activeTab} index={0}>
            {!loading && dashboardData && (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
                  <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4" component="div" color="success.main" gutterBottom>
                      ${dashboardData.totalRevenue.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      for the selected period
                    </Typography>
                  </Paper>
                  
                  <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Total Expenses
                    </Typography>
                    <Typography variant="h4" component="div" color="error.main" gutterBottom>
                      ${dashboardData.totalExpenses.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      for the selected period
                    </Typography>
                  </Paper>
                  
                  <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Net Revenue
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="div" 
                      color={dashboardData.netRevenue >= 0 ? 'success.main' : 'error.main'}
                      gutterBottom
                    >
                      ${dashboardData.netRevenue.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      for the selected period
                    </Typography>
                  </Paper>
                </Box>

                <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    Revenue vs Expenses
                  </Typography>
                  <Box sx={{ height: 350, mt: 2, position: 'relative' }}>
                    {!dashboardData.monthlyRevenue || dashboardData.monthlyRevenue.length === 0 ? (
                      <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
                        <Typography color="text.secondary">No data available for the selected period</Typography>
                      </Box>
                    ) : (
                      <Line 
                        data={getChartData()} 
                        options={chartOptions} 
                      />
                    )}
                  </Box>
                </Paper>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                  <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      Revenue by Source
                    </Typography>
                    <Box sx={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                            <th style={{ textAlign: 'left', padding: '12px 8px' }}>Source</th>
                            <th style={{ textAlign: 'right', padding: '12px 8px' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.revenueBySource.map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '12px 8px' }}>{item.sourceType}</td>
                              <td style={{ textAlign: 'right', padding: '12px 8px' }}>${item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                          {dashboardData.revenueBySource.length === 0 && (
                            <tr>
                              <td colSpan="2" style={{ textAlign: 'center', padding: '12px 8px' }}>No data available</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </Box>
                  </Paper>
                  
                  <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      Expenses by Type
                    </Typography>
                    <Box sx={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                            <th style={{ textAlign: 'left', padding: '12px 8px' }}>Type</th>
                            <th style={{ textAlign: 'right', padding: '12px 8px' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.expensesByType.map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '12px 8px' }}>{item.expenseType}</td>
                              <td style={{ textAlign: 'right', padding: '12px 8px' }}>${item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                          {dashboardData.expensesByType.length === 0 && (
                            <tr>
                              <td colSpan="2" style={{ textAlign: 'center', padding: '12px 8px' }}>No data available</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </Box>
                  </Paper>
                </Box>
              </>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <RevenueTransactionsList 
              dateRange={dateRange} 
              onSuccess={handleRefresh} 
            />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <ExpenseTransactionsList 
              dateRange={dateRange} 
              onSuccess={handleRefresh} 
            />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default RevenueDashboard; 