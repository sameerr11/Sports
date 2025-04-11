import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Paper, Typography, Container, Box, Alert, Divider, Grid } from '@mui/material';
import { login } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import ultrasLogo from '../../assets/images/ultras_logo.png';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login: authLogin } = useAuth();

  const { email, password } = formData;

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      authLogin(userData); // Update auth context with user data
      
      // Redirect to appropriate page based on user role
      if (userData.role === 'supervisor' && userData.supervisorType === 'booking') {
        navigate('/bookings');
      } else if (userData.role === 'revenue_manager') {
        navigate('/revenue/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleGuestBooking = () => {
    navigate('/guest-booking');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        backgroundColor: '#0e0051',
        overflow: 'hidden',
      }}
    >
      {/* Logo for Mobile View */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem 1rem',
          backgroundColor: '#0e0051',
        }}
      >
        <img 
          src={ultrasLogo} 
          alt="Ultras North Lebanon" 
          style={{ 
            width: '60%', 
            maxWidth: '250px', 
            height: 'auto' 
          }} 
        />
      </Box>

      {/* Form Section */}
      <Box
        sx={{
          width: { xs: '100%', md: '40%' },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(145deg,rgba(248, 249, 255, 0.6) 0%,rgba(9, 50, 234, 0.46) 100%)',
          borderRadius: { xs: '20px 20px 0 0', md: '0 20px 20px 0' },
          boxShadow: '0px 0px 25px rgba(0, 0, 0, 0.1)',
          padding: { xs: 2, sm: 3 },
          zIndex: 1,
          flexGrow: 1,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            padding: { xs: 3, sm: 4 },
            width: '100%',
            maxWidth: '400px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(14, 0, 81, 0.15)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '5px',
              background: 'linear-gradient(90deg, #f7931e, #ff7f00)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '15%',
              right: '-15%',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(247, 147, 30, 0.05) 0%, rgba(14, 0, 81, 0.03) 70%)',
              zIndex: -1,
            }
          }}
        >
          <Typography component="h1" variant="h5" align="center" gutterBottom sx={{ color: '#0e0051', fontWeight: 'bold' }}>
            Sports Management System
          </Typography>
          <Typography component="h2" variant="h6" align="center" gutterBottom sx={{ color: '#0e0051' }}>
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={onSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={onChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&.Mui-focused fieldset': {
                    borderColor: '#f7931e',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(14, 0, 81, 0.5)',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#f7931e',
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={onChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&.Mui-focused fieldset': {
                    borderColor: '#f7931e',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(14, 0, 81, 0.5)',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#f7931e',
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                backgroundColor: '#f7931e',
                borderRadius: '25px',
                padding: '10px 0',
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '1rem',
                boxShadow: '0 4px 10px rgba(247, 147, 30, 0.3)',
                '&:hover': {
                  backgroundColor: '#e08016',
                  boxShadow: '0 6px 15px rgba(247, 147, 30, 0.4)',
                }
              }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 2, '&::before, &::after': { borderColor: 'rgba(14, 0, 81, 0.1)' } }}>OR</Divider>

          <Box sx={{ mt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              sx={{
                borderColor: '#0e0051',
                color: '#0e0051',
                borderRadius: '25px',
                padding: '10px 0',
                textTransform: 'none',
                fontSize: '1rem',
                backgroundColor: 'rgba(14, 0, 81, 0.03)',
                '&:hover': {
                  borderColor: '#f7931e',
                  color: '#f7931e',
                  backgroundColor: 'rgba(247, 147, 30, 0.05)'
                }
              }}
              onClick={handleGuestBooking}
            >
              Book a Court as Guest
            </Button>
          </Box>
          
          {/* Decorative elements */}
          <Box
            sx={{
              position: 'absolute',
              bottom: '-20px',
              left: '-20px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(14, 0, 81, 0.03) 0%, rgba(14, 0, 81, 0.01) 70%)',
              zIndex: -1,
            }}
          />
        </Paper>
      </Box>

      {/* Logo Section for Desktop */}
      <Box
        sx={{
          width: { xs: '0%', md: '60%' },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0e0051',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            width: '95%',
            maxWidth: '750px',
            animation: 'float 3s ease-in-out infinite',
            '@keyframes float': {
              '0%': {
                transform: 'translateY(0px)',
              },
              '50%': {
                transform: 'translateY(-10px)',
              },
              '100%': {
                transform: 'translateY(0px)',
              },
            },
          }}
        >
          <img src={ultrasLogo} alt="Ultras North Lebanon" style={{ width: '100%', height: 'auto' }} />
        </Box>
      </Box>
    </Box>
  );
};

export default Login; 