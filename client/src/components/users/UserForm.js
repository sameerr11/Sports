import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { createUser, getUserById, updateUser, getUsersByRole } from '../../services/userService';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'coach', label: 'Coach' },
  { value: 'player', label: 'Player' },
  { value: 'parent', label: 'Parent' },
  { value: 'support', label: 'Support' }
];

const SUPERVISOR_TYPES = [
  { value: 'cafeteria', label: 'Cafeteria Supervisor' },
  { value: 'sports', label: 'Sports Supervisor' },
  { value: 'general', label: 'General Supervisor' }
];

const SPORT_TYPES = [
  { value: 'Football', label: 'Football' },
  { value: 'Cricket', label: 'Cricket' },
  { value: 'Basketball', label: 'Basketball' },
  { value: 'Tennis', label: 'Tennis' },
  { value: 'Others', label: 'Others' }
];

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: '',
  supervisorType: 'general',
  supervisorSportTypes: [],
  parentId: '',
  phoneNumber: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  },
  isActive: true
};

const UserForm = () => {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const [parents, setParents] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      fetchUser(id);
    }
    
    // Fetch parent users for the dropdown
    fetchParents();
  }, [id]);

  useEffect(() => {
    if (!formData.address) {
      setFormData(prevData => ({
        ...prevData,
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      }));
    }
  }, []);
  
  const fetchParents = async () => {
    try {
      const parentUsers = await getUsersByRole('parent');
      setParents(parentUsers);
    } catch (err) {
      console.error('Failed to fetch parents:', err);
    }
  };

  const fetchUser = async (userId) => {
    setFetchLoading(true);
    try {
      const userData = await getUserById(userId);
      setFormData({
        ...userData,
        password: '', // Don't populate password field
        // Ensure address is always initialized
        address: userData.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      });
    } catch (err) {
      setError('Failed to load user data. Please try again.');
      console.error(err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      // Ensure the parent object exists
      if (!formData[parent]) {
        setFormData({
          ...formData,
          [parent]: { [child]: value }
        });
      } else {
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent],
            [child]: value
          }
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSwitchChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.checked
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Log what we're submitting
    console.log('Submitting form data:', formData);

    try {
      if (isEdit) {
        // If editing and password is empty, remove it from the request
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        const result = await updateUser(id, updateData);
        console.log('Update response:', result);
      } else {
        const result = await createUser(formData);
        console.log('Create response:', result);
      }
      navigate('/users');
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {isEdit ? 'Edit User' : 'Add New User'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required={!isEdit}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Role"
                >
                  {ROLES.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select the user's role in the system</FormHelperText>
              </FormControl>
            </Grid>
            
            {/* Supervisor Type Selection (only visible when role is 'supervisor') */}
            {formData.role === 'supervisor' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Supervisor Type</InputLabel>
                  <Select
                    name="supervisorType"
                    value={formData.supervisorType || 'general'}
                    onChange={handleChange}
                    label="Supervisor Type"
                  >
                    {SUPERVISOR_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Specify the supervisor's area of responsibility</FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            {/* Sport Types Multiple Selection (only visible when supervisor type is 'sports') */}
            {formData.role === 'supervisor' && formData.supervisorType === 'sports' && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Sport Types</InputLabel>
                  <Select
                    name="supervisorSportTypes"
                    multiple
                    value={formData.supervisorSportTypes || []}
                    onChange={handleChange}
                    label="Sport Types"
                    renderValue={(selected) => selected.join(', ')}
                  >
                    {SPORT_TYPES.map((sport) => (
                      <MenuItem key={sport.value} value={sport.value}>
                        {sport.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Select the sport types this supervisor will manage</FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            {/* Parent Selection Dropdown (only visible when role is 'player') */}
            {formData.role === 'player' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Parent</InputLabel>
                  <Select
                    name="parentId"
                    value={formData.parentId || ''}
                    onChange={handleChange}
                    label="Parent"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {parents.map((parent) => (
                      <MenuItem key={parent._id} value={parent._id}>
                        {`${parent.firstName} ${parent.lastName} (${parent.email})`}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Associate this player with a parent</FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Address Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                name="address.street"
                value={formData.address?.street || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="address.city"
                value={formData.address?.city || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State/Province"
                name="address.state"
                value={formData.address?.state || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Zip/Postal Code"
                name="address.zipCode"
                value={formData.address?.zipCode || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                name="address.country"
                value={formData.address?.country || ''}
                onChange={handleChange}
              />
            </Grid>

            {isEdit && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={handleSwitchChange}
                      name="isActive"
                      color="primary"
                    />
                  }
                  label="Active Account"
                />
                <FormHelperText>Inactive accounts cannot log in</FormHelperText>
              </Grid>
            )}

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/users')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default UserForm; 