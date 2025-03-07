import React, { useState } from 'react';
import {
    Box,
    Grid,
    TextField,
    Typography,
    Button,
    CircularProgress,
    Divider,
    Alert,
    IconButton,
    InputAdornment
} from '@mui/material';
import {
    Security,
    Lock,
    Visibility,
    VisibilityOff,
    Save,
    Cancel
} from '@mui/icons-material';
import { changePassword } from '../../services/userService';

const SecurityForm = ({ editMode, onSave, loading }) => {
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [showPassword, setShowPassword] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
    });
    
    const [error, setError] = useState(null);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({
            ...passwordData,
            [name]: value
        });
        
        // Clear error when user types
        if (error) {
            setError(null);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword({
            ...showPassword,
            [field]: !showPassword[field]
        });
    };

    const validatePasswords = () => {
        if (!passwordData.currentPassword) {
            setError('Current password is required');
            return false;
        }
        
        if (!passwordData.newPassword) {
            setError('New password is required');
            return false;
        }
        
        if (passwordData.newPassword.length < 8) {
            setError('New password must be at least 8 characters long');
            return false;
        }
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return false;
        }
        
        return true;
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (!validatePasswords()) {
            return;
        }
        
        try {
            setPasswordLoading(true);
            
            // In a real app, you would use changePassword(passwordData)
            // For now, simulating an API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setPasswordSuccess(true);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setPasswordSuccess(false);
            }, 3000);
            
            setPasswordLoading(false);
        } catch (err) {
            setError('Failed to change password. Please try again.');
            setPasswordLoading(false);
        }
    };

    return (
        <Box>
            {/* Password Change */}
            <Box className="form-section">
                <Typography variant="h6" className="form-section-title">
                    <Lock /> Change Password
                </Typography>
                
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                {passwordSuccess && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Password changed successfully!
                    </Alert>
                )}
                
                <form onSubmit={handlePasswordChange}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Current Password"
                                name="currentPassword"
                                type={showPassword.currentPassword ? 'text' : 'password'}
                                value={passwordData.currentPassword}
                                onChange={handleChange}
                                disabled={!editMode || passwordLoading}
                                required
                                variant={editMode ? "outlined" : "filled"}
                                margin="normal"
                                InputProps={{
                                    endAdornment: editMode && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => togglePasswordVisibility('currentPassword')}
                                                edge="end"
                                            >
                                                {showPassword.currentPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="New Password"
                                name="newPassword"
                                type={showPassword.newPassword ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={handleChange}
                                disabled={!editMode || passwordLoading}
                                required
                                variant={editMode ? "outlined" : "filled"}
                                margin="normal"
                                helperText="Password must be at least 8 characters long"
                                InputProps={{
                                    endAdornment: editMode && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => togglePasswordVisibility('newPassword')}
                                                edge="end"
                                            >
                                                {showPassword.newPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Confirm New Password"
                                name="confirmPassword"
                                type={showPassword.confirmPassword ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={handleChange}
                                disabled={!editMode || passwordLoading}
                                required
                                variant={editMode ? "outlined" : "filled"}
                                margin="normal"
                                InputProps={{
                                    endAdornment: editMode && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => togglePasswordVisibility('confirmPassword')}
                                                edge="end"
                                            >
                                                {showPassword.confirmPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                    </Grid>
                    
                    {editMode && (
                        <Box className="form-actions">
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                startIcon={passwordLoading ? <CircularProgress size={24} /> : <Save />}
                                disabled={passwordLoading}
                            >
                                Change Password
                            </Button>
                        </Box>
                    )}
                </form>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Security Settings */}
            <Box className="form-section">
                <Typography variant="h6" className="form-section-title">
                    <Security /> Security Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Additional security settings will be available in future updates.
                </Typography>
            </Box>
        </Box>
    );
};

export default SecurityForm; 