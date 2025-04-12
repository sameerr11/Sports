import React, { useState, useEffect } from 'react';
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
    InputAdornment,
    Stack,
    Chip
} from '@mui/material';
import {
    Security,
    Lock,
    Visibility,
    VisibilityOff,
    Save,
    Cancel,
    Edit,
    CheckCircle,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { changePassword } from '../../services/userService';

const SecurityForm = ({ editMode, onSave, loading, userId }) => {
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
    
    // Password validation state
    const [passwordValidation, setPasswordValidation] = useState({
        hasMinLength: false,
        hasAlphabet: false,
        hasNumber: false,
        hasSpecial: false
    });

    useEffect(() => {
        // Validate password on change
        if (passwordData.newPassword) {
            validatePasswordStrength(passwordData.newPassword);
        } else {
            setPasswordValidation({
                hasMinLength: false,
                hasAlphabet: false,
                hasNumber: false,
                hasSpecial: false
            });
        }
    }, [passwordData.newPassword]);

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
        
        if (!isPasswordValid()) {
            setError('Password must be at least 8 characters and include letters, numbers, and special characters');
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
            
            // Use the actual changePassword service with userId
            await changePassword({
                userId,
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            
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
            setError(err.message || 'Failed to change password. Please try again.');
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
                                error={passwordData.newPassword.length > 0 && !isPasswordValid()}
                                helperText={
                                    passwordData.newPassword.length > 0 && !isPasswordValid()
                                    ? "Password must meet all requirements below"
                                    : "Password must be at least 8 characters with letters, numbers, and special characters"
                                }
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
                            
                            {/* Password requirement indicators */}
                            {passwordData.newPassword.length > 0 && (
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
                                error={passwordData.confirmPassword.length > 0 && passwordData.newPassword !== passwordData.confirmPassword}
                                helperText={
                                    passwordData.confirmPassword.length > 0 && 
                                    passwordData.newPassword !== passwordData.confirmPassword 
                                    ? "Passwords don't match" 
                                    : ""
                                }
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
                                disabled={passwordLoading || !isPasswordValid() || passwordData.newPassword !== passwordData.confirmPassword}
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