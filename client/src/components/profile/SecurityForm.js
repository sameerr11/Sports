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
    Cancel as CancelIcon,
    Info
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
                                disabled={passwordLoading}
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => togglePasswordVisibility('currentPassword')}
                                                edge="end"
                                            >
                                                {showPassword.currentPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
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
                                disabled={passwordLoading}
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => togglePasswordVisibility('newPassword')}
                                                edge="end"
                                            >
                                                {showPassword.newPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
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
                                disabled={passwordLoading}
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => togglePasswordVisibility('confirmPassword')}
                                                edge="end"
                                            >
                                                {showPassword.confirmPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        
                        {/* Password Strength Indicators */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Password must have:
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                                <Chip 
                                    icon={passwordValidation.hasMinLength ? <CheckCircle color="success" /> : <CancelIcon color="error" />}
                                    label="At least 8 characters" 
                                    variant="outlined"
                                    color={passwordValidation.hasMinLength ? "success" : "error"}
                                    size="small"
                                    sx={{ mb: 1 }}
                                />
                                <Chip 
                                    icon={passwordValidation.hasAlphabet ? <CheckCircle color="success" /> : <CancelIcon color="error" />}
                                    label="Letters" 
                                    variant="outlined"
                                    color={passwordValidation.hasAlphabet ? "success" : "error"}
                                    size="small"
                                    sx={{ mb: 1 }}
                                />
                                <Chip 
                                    icon={passwordValidation.hasNumber ? <CheckCircle color="success" /> : <CancelIcon color="error" />}
                                    label="Numbers" 
                                    variant="outlined"
                                    color={passwordValidation.hasNumber ? "success" : "error"}
                                    size="small"
                                    sx={{ mb: 1 }}
                                />
                                <Chip 
                                    icon={passwordValidation.hasSpecial ? <CheckCircle color="success" /> : <CancelIcon color="error" />}
                                    label="Special characters" 
                                    variant="outlined"
                                    color={passwordValidation.hasSpecial ? "success" : "error"}
                                    size="small"
                                    sx={{ mb: 1 }}
                                />
                            </Stack>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={passwordLoading}
                                sx={{ mt: 1 }}
                            >
                                {passwordLoading ? (
                                    <CircularProgress size={24} />
                                ) : (
                                    'Change Password'
                                )}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Box>
            
            {/* Two-Factor Authentication - Can be added in the future */}
            <Box className="form-section" sx={{ mt: 4 }}>
                <Typography variant="h6" className="form-section-title">
                    <Security /> Two-Factor Authentication
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic', my: 2 }}>
                    Two-factor authentication is not enabled for this account. This feature will be available soon.
                </Typography>
            </Box>
        </Box>
    );
};

export default SecurityForm; 