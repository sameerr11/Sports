import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Box, 
  Typography, 
  InputAdornment, 
  IconButton,
  Alert,
  Stack,
  Chip,
  CircularProgress
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  CheckCircle, 
  Cancel as CancelIcon 
} from '@mui/icons-material';
import { adminResetPassword } from '../../services/userService';

const ResetPasswordDialog = ({ open, onClose, userId, userName }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasAlphabet: false,
    hasNumber: false,
    hasSpecial: false
  });

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    validatePasswordStrength(password);
  };

  const validatePasswordStrength = (password) => {
    const hasMinLength = password.length >= 8;
    const hasAlphabet = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    setPasswordValidation({
      hasMinLength,
      hasAlphabet,
      hasNumber,
      hasSpecial
    });
  };

  const isPasswordValid = () => {
    return (
      passwordValidation.hasMinLength &&
      passwordValidation.hasAlphabet &&
      passwordValidation.hasNumber &&
      passwordValidation.hasSpecial
    );
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async () => {
    // Reset error
    setError('');
    
    // Validate passwords
    if (!newPassword) {
      setError('New password is required');
      return;
    }
    
    if (!isPasswordValid()) {
      setError('Password must be at least 8 characters and include letters, numbers, and special characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      await adminResetPassword(userId, newPassword);
      
      // Clear form and close dialog
      setNewPassword('');
      setConfirmPassword('');
      onClose(true); // Pass true to indicate successful reset
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Clear state when dialog closes
  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reset Password for {userName}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will reset the user's password without requiring their current password.
            They will need to use this new password for their next login.
          </Typography>
          
          <TextField
            fullWidth
            margin="normal"
            label="New Password"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={handlePasswordChange}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          {/* Password requirement indicators */}
          {newPassword.length > 0 && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                <Chip 
                  size="small"
                  color={passwordValidation.hasMinLength ? "success" : "default"}
                  label="At least 8 characters" 
                  icon={passwordValidation.hasMinLength ? <CheckCircle fontSize="small" /> : <CancelIcon fontSize="small" />}
                />
                <Chip 
                  size="small"
                  color={passwordValidation.hasAlphabet ? "success" : "default"}
                  label="Contains letters" 
                  icon={passwordValidation.hasAlphabet ? <CheckCircle fontSize="small" /> : <CancelIcon fontSize="small" />}
                />
                <Chip 
                  size="small"
                  color={passwordValidation.hasNumber ? "success" : "default"}
                  label="Contains numbers" 
                  icon={passwordValidation.hasNumber ? <CheckCircle fontSize="small" /> : <CancelIcon fontSize="small" />}
                />
                <Chip 
                  size="small"
                  color={passwordValidation.hasSpecial ? "success" : "default"}
                  label="Contains special characters" 
                  icon={passwordValidation.hasSpecial ? <CheckCircle fontSize="small" /> : <CancelIcon fontSize="small" />}
                />
              </Stack>
            </Box>
          )}
          
          <TextField
            fullWidth
            margin="normal"
            label="Confirm Password"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            error={confirmPassword && newPassword !== confirmPassword}
            helperText={confirmPassword && newPassword !== confirmPassword && "Passwords do not match"}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading || !isPasswordValid() || !confirmPassword || newPassword !== confirmPassword}
        >
          {loading ? <CircularProgress size={24} /> : 'Reset Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResetPasswordDialog; 