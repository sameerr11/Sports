import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  Divider,
  Button
} from '@mui/material';
import { formatCurrency } from '../../utils/format';
import { format } from 'date-fns';

const CafeDashboard = () => {
  const [sessionSummaries, setSessionSummaries] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgSessionRevenue, setAvgSessionRevenue] = useState(0);

  useEffect(() => {
    // Load session summaries from localStorage
    const summaries = JSON.parse(localStorage.getItem('cafeSessionSummaries') || '[]');
    setSessionSummaries(summaries);

    // Calculate totals and averages
    if (summaries.length > 0) {
      const total = summaries.reduce((sum, session) => sum + session.totalSales, 0);
      setTotalRevenue(total);
      setAvgSessionRevenue(total / summaries.length);
    }
  }, []);

  // Format date and time for display
  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return format(new Date(isoString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Calculate session duration in hours and minutes
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end - start;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${diffHrs}h ${diffMins}m`;
    } catch (error) {
      return 'Invalid time';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Cafe Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Sessions
              </Typography>
              <Typography variant="h4">
                {sessionSummaries.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4">
                {formatCurrency(totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg. Revenue per Session
              </Typography>
              <Typography variant="h4">
                {formatCurrency(avgSessionRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom>
        Session History
      </Typography>
      
      {sessionSummaries.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No session summaries available yet.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Starting Balance</TableCell>
                <TableCell>Sales</TableCell>
                <TableCell>Final Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessionSummaries.map((session, index) => (
                <TableRow key={index}>
                  <TableCell>{session.date}</TableCell>
                  <TableCell>{formatDateTime(session.startTime)}</TableCell>
                  <TableCell>{formatDateTime(session.endTime)}</TableCell>
                  <TableCell>{calculateDuration(session.startTime, session.endTime)}</TableCell>
                  <TableCell>{formatCurrency(session.startingBalance)}</TableCell>
                  <TableCell>{formatCurrency(session.totalSales)}</TableCell>
                  <TableCell>{formatCurrency(session.finalBalance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 3, textAlign: 'right' }}>
        <Button 
          variant="outlined" 
          color="secondary"
          onClick={() => {
            if (window.confirm('Are you sure you want to clear all session history?')) {
              localStorage.removeItem('cafeSessionSummaries');
              setSessionSummaries([]);
              setTotalRevenue(0);
              setAvgSessionRevenue(0);
            }
          }}
        >
          Clear History
        </Button>
      </Box>
    </Box>
  );
};

export default CafeDashboard; 