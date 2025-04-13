import api from './api';

// Get all users
export const getAllUsers = async () => {
    try {
        const response = await api.get('/users');
        return response.data;
    } catch (error) {
        throw error.response?.data?.msg || 'Failed to fetch users';
    }
};

// Get user by ID
export const getUserById = async (id) => {
    try {
        const response = await api.get(`/users/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.msg || 'Failed to fetch user';
    }
};

// Create new user
export const createUser = async (userData) => {
    try {
        const response = await api.post('/users', userData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.msg || 'Failed to create user';
    }
};

// Update user
export const updateUser = async (id, userData) => {
    try {
        const response = await api.put(`/users/${id}`, userData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.msg || 'Failed to update user';
    }
};

// Delete user
export const deleteUser = async (id) => {
    try {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.msg || 'Failed to delete user';
    }
};

// Get current user profile
export const getCurrentUserProfile = async () => {
    try {
        const response = await api.get('/users/profile');
        return response.data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error.response?.data?.msg || 'Failed to fetch profile';
    }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
    try {
        const response = await api.put('/users/profile', profileData);
        return response.data;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error.response?.data?.msg || 'Failed to update profile';
    }
};

// Change password
export const changePassword = async (passwordData) => {
    try {
        const response = await api.put(`/users/${passwordData.userId}/password`, {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
        });
        return response.data;
    } catch (error) {
        console.error('Error changing password:', error);
        throw error.response?.data?.msg || 'Failed to change password';
    }
};

// Admin reset password (no current password required)
export const adminResetPassword = async (userId, newPassword) => {
    try {
        const response = await api.put(`/users/${userId}/reset-password`, {
            newPassword
        });
        return response.data;
    } catch (error) {
        console.error('Error resetting password:', error);
        throw error.response?.data?.msg || 'Failed to reset password';
    }
};

// Upload profile picture
export const uploadProfilePicture = async (formData, userId = null) => {
    try {
        // If userId is provided, we're uploading for a specific user (admin function)
        const endpoint = userId 
            ? `/users/${userId}/picture` 
            : '/users/profile/picture';
            
        const response = await api.post(endpoint, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw error.response?.data?.msg || 'Failed to upload profile picture';
    }
};

// Get user activity
export const getUserActivity = async () => {
    try {
        const response = await api.get('/users/activity');
        return response.data;
    } catch (error) {
        console.error('Error fetching user activity:', error);
        throw error.response?.data?.msg || 'Failed to fetch user activity';
    }
};

// Mock data for development
export const getMockUserProfile = () => {
    return {
        _id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-123-4567',
        role: 'player',
        address: {
            street: '123 Main St',
            city: 'Sportsville',
            state: 'CA',
            zipCode: '12345',
            country: 'USA'
        },
        dateOfBirth: '1990-01-15',
        gender: 'male',
        emergencyContact: {
            name: 'Jane Doe',
            relationship: 'Spouse',
            phone: '555-987-6543'
        },
        profilePicture: 'https://via.placeholder.com/150',
        bio: 'Passionate basketball player with 10 years of experience.',
        preferences: {
            notifications: true,
            newsletter: true,
            publicProfile: true
        },
        teams: [
            { _id: '1', name: 'Eagles', sport: 'Basketball' },
            { _id: '2', name: 'Tigers', sport: 'Soccer' }
        ],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-06-15T00:00:00.000Z'
    };
};

// Mock user activity data
export const getMockUserActivity = () => {
    return {
        recentBookings: [
            { _id: '1', court: 'Tennis Court 1', date: '2025-03-08', time: '10:00 AM', type: 'Practice' },
            { _id: '2', court: 'Basketball Court 3', date: '2025-03-09', time: '2:30 PM', type: 'Match' }
        ],
        upcomingEvents: [
            { _id: '1', name: 'Summer Tournament', date: '2025-04-15', location: 'Main Stadium' },
            { _id: '2', name: 'Team Practice', date: '2025-03-12', location: 'Training Center' }
        ],
        notifications: [
            { _id: '1', message: 'Your booking has been confirmed', date: '2025-03-05', read: true },
            { _id: '2', message: 'New team event scheduled', date: '2025-03-04', read: false },
            { _id: '3', message: 'Payment received', date: '2025-03-03', read: true }
        ]
    };
};

// Get users by role
export const getUsersByRole = async (role) => {
    try {
        const response = await api.get(`/users/role/${role}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${role}s:`, error);
        throw error.response?.data?.msg || `Failed to fetch ${role}s`;
    }
};