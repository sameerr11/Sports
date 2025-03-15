import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { format } from 'date-fns';
import api from '../../services/api';

const FeedbackHistory = () => {
  const theme = useTheme();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await api.get('/feedback/user');
        setFeedbacks(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load feedback history');
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'reviewed':
        return 'info';
      case 'pending':
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ my: 2 }}>
        {error}
      </Typography>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <Paper 
        sx={{ 
          p: 3, 
          mt: 3,
          textAlign: 'center',
          backgroundColor: alpha(theme.palette.grey[100], 0.5)
        }}
      >
        <Typography variant="body1" color="textSecondary">
          You haven't submitted any feedback yet.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Your Previous Feedback
      </Typography>
      <Paper elevation={1}>
        <List>
          {feedbacks.map((feedback, index) => (
            <React.Fragment key={feedback._id}>
              {index > 0 && <Divider />}
              <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" component="span">
                          {format(new Date(feedback.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                        <Chip 
                          label={feedback.role || 'parent'}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>
                      <Chip 
                        label={feedback.status} 
                        size="small"
                        color={getStatusChipColor(feedback.status)}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography
                      component="span"
                      variant="body2"
                      color="textPrimary"
                      sx={{
                        display: 'inline',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {feedback.message}
                    </Typography>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default FeedbackHistory; 