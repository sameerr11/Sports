import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Grid, 
    Paper, 
    Typography, 
    Avatar, 
    Button, 
    Tabs, 
    Tab, 
    Divider,
    CircularProgress,
    Alert,
    useTheme,
    alpha
} from '@mui/material';
import {
    Person,
    Security,
    Settings,
    History,
    Edit,
    PhotoCamera
} from '@mui/icons-material';
import { 
    getMockUserProfile, 
    getMockUserActivity, 
    getCurrentUserProfile, 
    updateUserProfile,
    uploadProfilePicture
} from '../../services/userService';
import { getStoredUser } from '../../services/authService';
import PersonalInfoForm from './PersonalInfoForm';
import SecurityForm from './SecurityForm';
import PreferencesForm from './PreferencesForm';
import ActivityHistory from './ActivityHistory';
import './Profile.css';

const Profile = () => {
    const theme = useTheme();
    const [tabValue, setTabValue] = useState(0);
    const [profile, setProfile] = useState(null);
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                // In a real app, you would use getCurrentUserProfile()
                // For now, using mock data for demonstration
                const profileData = getMockUserProfile();
                const activityData = getMockUserActivity();
                
                setProfile(profileData);
                setActivity(activityData);
                setLoading(false);
            } catch (err) {
                setError('Failed to load profile data. Please try again.');
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setEditMode(false);
    };

    const handleEditToggle = () => {
        setEditMode(!editMode);
    };

    const handleProfileUpdate = async (updatedData) => {
        try {
            setLoading(true);
            // In a real app, you would use updateUserProfile(updatedData)
            // For now, simulating an API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setProfile({
                ...profile,
                ...updatedData
            });
            
            setSuccess('Profile updated successfully!');
            setEditMode(false);
            setLoading(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        } catch (err) {
            setError('Failed to update profile. Please try again.');
            setLoading(false);
        }
    };

    const handleProfilePictureUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            setUploadLoading(true);
            // In a real app, you would use uploadProfilePicture(formData)
            // For now, simulating an API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Create a temporary URL for the uploaded file
            const imageUrl = URL.createObjectURL(file);
            
            setProfile({
                ...profile,
                profilePicture: imageUrl
            });
            
            setSuccess('Profile picture updated successfully!');
            setUploadLoading(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        } catch (err) {
            setError('Failed to upload profile picture. Please try again.');
            setUploadLoading(false);
        }
    };

    if (loading && !profile) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="profile-container">
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}
            
            {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {success}
                </Alert>
            )}
            
            <Grid container spacing={3}>
                {/* Profile Header */}
                <Grid item xs={12}>
                    <Paper elevation={3} className="profile-header">
                        <Box className="profile-header-content">
                            <Box className="profile-avatar-container">
                                <Avatar 
                                    src={profile?.profilePicture} 
                                    alt={`${profile?.firstName} ${profile?.lastName}`}
                                    className="profile-avatar"
                                >
                                    {profile?.firstName?.charAt(0)}
                                </Avatar>
                                <input
                                    accept="image/*"
                                    className="hidden-input"
                                    id="profile-picture-upload"
                                    type="file"
                                    onChange={handleProfilePictureUpload}
                                />
                                <label htmlFor="profile-picture-upload">
                                    <Button
                                        component="span"
                                        className="upload-button"
                                        disabled={uploadLoading}
                                    >
                                        {uploadLoading ? (
                                            <CircularProgress size={24} />
                                        ) : (
                                            <PhotoCamera />
                                        )}
                                    </Button>
                                </label>
                            </Box>
                            
                            <Box className="profile-info">
                                <Typography variant="h4" component="h1" gutterBottom>
                                    {profile?.firstName} {profile?.lastName}
                                </Typography>
                                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                    {profile?.email}
                                </Typography>
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        display: 'inline-block',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1,
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                        fontWeight: 600,
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {profile?.role}
                                </Typography>
                            </Box>
                            
                            <Box className="profile-actions">
                                {tabValue !== 3 && (
                                    <Button
                                        variant={editMode ? "outlined" : "contained"}
                                        color={editMode ? "secondary" : "primary"}
                                        startIcon={<Edit />}
                                        onClick={handleEditToggle}
                                        disabled={loading}
                                    >
                                        {editMode ? "Cancel" : "Edit Profile"}
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
                
                {/* Profile Content */}
                <Grid item xs={12}>
                    <Paper elevation={3} className="profile-content">
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            className="profile-tabs"
                        >
                            <Tab icon={<Person />} label="Personal Info" />
                            <Tab icon={<Security />} label="Security" />
                            <Tab icon={<Settings />} label="Preferences" />
                            <Tab icon={<History />} label="Activity" />
                        </Tabs>
                        
                        <Divider />
                        
                        <Box className="tab-content">
                            {/* Personal Info Tab */}
                            {tabValue === 0 && (
                                <PersonalInfoForm 
                                    profile={profile} 
                                    editMode={editMode} 
                                    onSave={handleProfileUpdate}
                                    loading={loading}
                                />
                            )}
                            
                            {/* Security Tab */}
                            {tabValue === 1 && (
                                <SecurityForm 
                                    editMode={editMode} 
                                    onSave={handleProfileUpdate}
                                    loading={loading}
                                />
                            )}
                            
                            {/* Preferences Tab */}
                            {tabValue === 2 && (
                                <PreferencesForm 
                                    profile={profile} 
                                    editMode={editMode} 
                                    onSave={handleProfileUpdate}
                                    loading={loading}
                                />
                            )}
                            
                            {/* Activity Tab */}
                            {tabValue === 3 && (
                                <ActivityHistory activity={activity} />
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Profile; 