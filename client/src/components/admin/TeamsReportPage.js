import React from 'react';
import { Box, Typography, Paper, alpha, useTheme } from '@mui/material';
import TeamsReport from './TeamsReport';

const TeamsReportPage = () => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 700, 
            color: theme.palette.grey[800],
            mb: 1
          }}
        >
          Teams Report
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View comprehensive team data including members, coaches, activities, and performance metrics across all sports
        </Typography>
      </Box>

      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.grey[300], 0.7)}`,
          boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, 0.06)}`,
        }}
      >
        <TeamsReport />
      </Paper>
    </Box>
  );
};

export default TeamsReportPage;
