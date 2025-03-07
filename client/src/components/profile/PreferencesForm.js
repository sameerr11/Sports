import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    FormControlLabel,
    Switch,
    Button,
    CircularProgress,
    Divider,
    Grid,
    Paper
} from '@mui/material';
import {
    Settings,
    Notifications,
    Email,
    Public,
    Save,
    Cancel
} from '@mui/icons-material';

const PreferencesForm = ({ profile, editMode, onSave, loading }) => {
    const [preferences, setPreferences] = useState({
        notifications: true,
        newsletter: true,
        publicProfile: true
    });

    useEffect(() => {
        if (profile && profile.preferences) {
            setPreferences({
                notifications: profile.preferences.notifications ?? true,
                newsletter: profile.preferences.newsletter ?? true,
                publicProfile: profile.preferences.publicProfile ?? true
            });
        }
    }, [profile]);

    const handleChange = (event) => {
        const { name, checked } = event.target;
        setPreferences({
            ...preferences,
            [name]: checked
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            preferences
        });
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            {/* Notification Preferences */}
            <Box className="form-section">
                <Typography variant="h6" className="form-section-title">
                    <Notifications /> Notification Preferences
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={preferences.notifications}
                                onChange={handleChange}
                                name="notifications"
                                color="primary"
                                disabled={!editMode}
                            />
                        }
                        label="Receive push notifications"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                        Get notified about bookings, team updates, and important events
                    </Typography>
                </Paper>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Email Preferences */}
            <Box className="form-section">
                <Typography variant="h6" className="form-section-title">
                    <Email /> Email Preferences
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={preferences.newsletter}
                                onChange={handleChange}
                                name="newsletter"
                                color="primary"
                                disabled={!editMode}
                            />
                        }
                        label="Subscribe to newsletter"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                        Receive monthly updates about new features, tournaments, and sports events
                    </Typography>
                </Paper>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Privacy Preferences */}
            <Box className="form-section">
                <Typography variant="h6" className="form-section-title">
                    <Public /> Privacy Preferences
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={preferences.publicProfile}
                                onChange={handleChange}
                                name="publicProfile"
                                color="primary"
                                disabled={!editMode}
                            />
                        }
                        label="Public profile"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                        Allow other users to see your profile information and team memberships
                    </Typography>
                </Paper>
            </Box>

            {editMode && (
                <Box className="form-actions">
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<Cancel />}
                        onClick={() => onSave(profile)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={loading ? <CircularProgress size={24} /> : <Save />}
                        disabled={loading}
                    >
                        Save Preferences
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default PreferencesForm; 