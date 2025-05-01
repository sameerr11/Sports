import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Paper,
    Grid,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import { getUsersByRole, getAllUsers } from '../../services/userService';
import { sendNotification } from '../../services/notificationService';

const SendNotification = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [recipientType, setRecipientType] = useState('all');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const allUsers = await getAllUsers();
                setUsers(allUsers);
                
                // Extract unique roles from users
                const uniqueRoles = [...new Set(allUsers.map(user => user.role))];
                setRoles(uniqueRoles);
            } catch (error) {
                console.error('Error fetching users:', error);
                setSnackbar({
                    open: true,
                    message: 'Failed to fetch users. Please try again.',
                    severity: 'error'
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        // Update filtered users when role changes
        if (selectedRole) {
            const filtered = users.filter(user => user.role === selectedRole);
            setFilteredUsers(filtered);
        }
    }, [selectedRole, users]);

    const handleRecipientTypeChange = (event) => {
        setRecipientType(event.target.value);
        setSelectedRole('');
        setSelectedUsers([]);
    };

    const handleRoleChange = (event) => {
        setSelectedRole(event.target.value);
        setSelectedUsers([]);
    };

    const handleUserSelection = (event) => {
        setSelectedUsers(event.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate title is provided
        if (!title.trim()) {
            setSnackbar({
                open: true,
                message: 'Notification title is required',
                severity: 'error'
            });
            return;
        }
        
        setLoading(true);

        try {
            let recipients = [];

            if (recipientType === 'all') {
                recipients = users.map(user => user._id);
            } else if (recipientType === 'role') {
                recipients = users
                    .filter(user => user.role === selectedRole)
                    .map(user => user._id);
            } else if (recipientType === 'specific') {
                recipients = selectedUsers;
            }

            if (recipients.length === 0) {
                throw new Error('No recipients selected');
            }

            await sendNotification({
                title,
                message,
                recipients,
                type: recipientType,
                role: recipientType === 'role' ? selectedRole : undefined
            });

            setSnackbar({
                open: true,
                message: 'Notification sent successfully!',
                severity: 'success'
            });

            // Reset form
            setTitle('');
            setMessage('');
            setRecipientType('all');
            setSelectedRole('');
            setSelectedUsers([]);

        } catch (error) {
            console.error('Error sending notification:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Failed to send notification. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    if (loading && users.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Send Notification
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notification Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Message"
                                multiline
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth disabled={loading}>
                                <InputLabel>Recipient Type</InputLabel>
                                <Select
                                    value={recipientType}
                                    onChange={handleRecipientTypeChange}
                                    label="Recipient Type"
                                >
                                    <MenuItem value="all">All Users</MenuItem>
                                    <MenuItem value="role">All Users in a Role</MenuItem>
                                    <MenuItem value="specific">Specific Users</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        {recipientType === 'role' && (
                            <Grid item xs={12}>
                                <FormControl fullWidth disabled={loading}>
                                    <InputLabel>Select Role</InputLabel>
                                    <Select
                                        value={selectedRole}
                                        onChange={handleRoleChange}
                                        label="Select Role"
                                    >
                                        {roles.map((role) => (
                                            <MenuItem key={role} value={role}>
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}
                        {recipientType === 'specific' && (
                            <>
                                <Grid item xs={12}>
                                    <FormControl fullWidth disabled={loading}>
                                        <InputLabel>Select Role</InputLabel>
                                        <Select
                                            value={selectedRole}
                                            onChange={handleRoleChange}
                                            label="Select Role"
                                        >
                                            {roles.map((role) => (
                                                <MenuItem key={role} value={role}>
                                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {selectedRole && (
                                    <Grid item xs={12}>
                                        <FormControl fullWidth disabled={loading}>
                                            <InputLabel>Select Users</InputLabel>
                                            <Select
                                                multiple
                                                value={selectedUsers}
                                                onChange={handleUserSelection}
                                                label="Select Users"
                                            >
                                                {filteredUsers.map((user) => (
                                                    <MenuItem key={user._id} value={user._id}>
                                                        {user.firstName} {user.lastName}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                )}
                            </>
                        )}
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Send Notification'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SendNotification; 