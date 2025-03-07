import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    TextField,
    Typography,
    Button,
    CircularProgress,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { 
    Person, 
    Home, 
    Phone, 
    Cake, 
    Wc, 
    ContactPhone, 
    Save, 
    Cancel 
} from '@mui/icons-material';

const PersonalInfoForm = ({ profile, editMode, onSave, loading }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        bio: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        },
        emergencyContact: {
            name: '',
            relationship: '',
            phone: ''
        }
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                email: profile.email || '',
                phone: profile.phone || '',
                dateOfBirth: profile.dateOfBirth || '',
                gender: profile.gender || '',
                bio: profile.bio || '',
                address: {
                    street: profile.address?.street || '',
                    city: profile.address?.city || '',
                    state: profile.address?.state || '',
                    zipCode: profile.address?.zipCode || '',
                    country: profile.address?.country || ''
                },
                emergencyContact: {
                    name: profile.emergencyContact?.name || '',
                    relationship: profile.emergencyContact?.relationship || '',
                    phone: profile.emergencyContact?.phone || ''
                }
            });
        }
    }, [profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name.includes('.')) {
            const [section, field] = name.split('.');
            setFormData({
                ...formData,
                [section]: {
                    ...formData[section],
                    [field]: value
                }
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            {/* Basic Information */}
            <Box className="form-section">
                <Typography variant="h6" className="form-section-title">
                    <Person /> Basic Information
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="First Name"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            disabled={!editMode}
                            required
                            variant={editMode ? "outlined" : "filled"}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Last Name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            disabled={!editMode}
                            required
                            variant={editMode ? "outlined" : "filled"}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={true} // Email should not be editable
                            variant="filled"
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Phone Number"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={!editMode}
                            variant={editMode ? "outlined" : "filled"}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Date of Birth"
                            name="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            disabled={!editMode}
                            variant={editMode ? "outlined" : "filled"}
                            margin="normal"
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl 
                            fullWidth 
                            variant={editMode ? "outlined" : "filled"} 
                            margin="normal"
                            disabled={!editMode}
                        >
                            <InputLabel>Gender</InputLabel>
                            <Select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                label="Gender"
                            >
                                <MenuItem value="male">Male</MenuItem>
                                <MenuItem value="female">Female</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                                <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            disabled={!editMode}
                            variant={editMode ? "outlined" : "filled"}
                            margin="normal"
                            multiline
                            rows={4}
                        />
                    </Grid>
                </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Address Information */}
            <Box className="form-section">
                <Typography variant="h6" className="form-section-title">
                    <Home /> Address Information
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Street Address"
                            name="address.street"
                            value={formData.address.street}
                            onChange={handleChange}
                            disabled={!editMode}
                            variant={editMode ? "outlined" : "filled"}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="City"
                            name="address.city"
                            value={formData.address.city}
                            onChange={handleChange}
                            disabled={!editMode}
                            variant={editMode ? "outlined" : "filled"}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="State/Province"
                            name="address.state"
                            value={formData.address.state}
                            onChange={handleChange}
                            disabled={!editMode}
                            variant={editMode ? "outlined" : "filled"}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Zip/Postal Code"
                            name="address.zipCode"
                            value={formData.address.zipCode}
                            onChange={handleChange}
                            disabled={!editMode}
                            variant={editMode ? "outlined" : "filled"}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Country"
                            name="address.country"
                            value={formData.address.country}
                            onChange={handleChange}
                            disabled={!editMode}
                            variant={editMode ? "outlined" : "filled"}
                            margin="normal"
                        />
                    </Grid>
                </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Emergency Contact */}
            <Box className="form-section">
                <Typography variant="h6" className="form-section-title">
                    <ContactPhone /> Emergency Contact
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Contact Name"
                            name="emergencyContact.name"
                            value={formData.emergencyContact.name}
                            onChange={handleChange}
                            disabled={!editMode}
                            variant={editMode ? "outlined" : "filled"}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Relationship"
                            name="emergencyContact.relationship"
                            value={formData.emergencyContact.relationship}
                            onChange={handleChange}
                            disabled={!editMode}
                            variant={editMode ? "outlined" : "filled"}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Contact Phone"
                            name="emergencyContact.phone"
                            value={formData.emergencyContact.phone}
                            onChange={handleChange}
                            disabled={!editMode}
                            variant={editMode ? "outlined" : "filled"}
                            margin="normal"
                        />
                    </Grid>
                </Grid>
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
                        Save Changes
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default PersonalInfoForm; 