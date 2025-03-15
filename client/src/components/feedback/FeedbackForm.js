import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import { Send, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getStoredUser } from '../../services/authService';

const FeedbackForm = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = getStoredUser();
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter your feedback message');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await api.post('/feedback', { message });
      setSuccess(true);
      setMessage('');
      setLoading(false);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/parent')}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Submit Feedback
        </Typography>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>Your feedback has been submitted successfully. Thank you!</Alert>}
      
      <Paper 
        elevation={3} 
        sx={{
          p: 4,
          borderRadius: 2,
          backgroundImage: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.background.paper, 0.05)})`,
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              We Value Your Feedback
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Please share your thoughts, suggestions, or concerns with us. Your feedback helps us improve our services.
            </Typography>
            <Divider sx={{ my: 2 }} />
          </Grid>
          
          <Grid item xs={12}>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    autoFocus
                    required
                    fullWidth
                    id="email"
                    label="Your Email"
                    value={user?.email || ''}
                    disabled
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="message"
                    label="Your Feedback"
                    multiline
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please share your thoughts, suggestions, or concerns..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    {loading ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Prior submissions section could be added here */}
    </Container>
  );
};

export default FeedbackForm; 