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
  Divider,
  Avatar,
  InputAdornment,
  IconButton,
  Stack,
  Chip
} from '@mui/material';
import { 
  PhotoCamera, 
  Visibility, 
  VisibilityOff, 
  CheckCircle, 
  Cancel as CancelIcon 
} from '@mui/icons-material';
import { createUser, getUserById, updateUser, getUsersByRole, uploadProfilePicture } from '../../services/userService';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'coach', label: 'Coach' },
  { value: 'player', label: 'Player' },
  { value: 'parent', label: 'Parent' },
  { value: 'support', label: 'Support' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'revenue_manager', label: 'Revenue Manager' }
];

const SUPERVISOR_TYPES = [
  { value: 'cafeteria', label: 'Cafeteria Supervisor' },
  { value: 'sports', label: 'Sports Supervisor' },
  { value: 'general', label: 'General Supervisor' },
  { value: 'booking', label: 'Booking Supervisor' }
];

const SPORT_TYPES = [
  { value: 'Basketball', label: 'Basketball' },
  { value: 'Football', label: 'Football' },
  { value: 'Volleyball', label: 'Volleyball' },
  { value: 'Self Defense', label: 'Self Defense' },
  { value: 'Karate', label: 'Karate' },
  { value: 'Gymnastics', label: 'Gymnastics' },
  { value: 'Gym', label: 'Gym' },
  { value: 'Zumba', label: 'Zumba' },
  { value: 'Swimming', label: 'Swimming' },
  { value: 'Ping Pong', label: 'Ping Pong' }
];

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  birthDate: '',
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
  isActive: true,
  profilePicture: ''
};

const UserForm = () => {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const [parents, setParents] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasAlphabet: false,
    hasNumber: false,
    hasSpecial: false
  });

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

  useEffect(() => {
    // Validate password when it changes
    if (formData.password) {
      validatePasswordStrength(formData.password);
    } else {
      setPasswordValidation({
        hasMinLength: false,
        hasAlphabet: false,
        hasNumber: false,
        hasSpecial: false
      });
    }
  }, [formData.password]);
  
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

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formDataObj = new FormData();
    formDataObj.append('profilePicture', file);
    
    // If we're editing an existing user, pass the ID to directly associate the image
    const userId = isEdit ? id : null;

    try {
      setUploadLoading(true);
      
      // Try to upload via API
      let imageUrl;
      try {
        const response = await uploadProfilePicture(formDataObj, userId);
        imageUrl = response.imageUrl; // Assuming the API returns the image URL
        
        // For new users, the image URL will be included when the user is created
        // For existing users, the server has already updated the user record with the new image
        console.log('Image uploaded successfully with URL:', imageUrl);
      } catch (apiError) {
        console.warn('Could not upload via API, using local file URL as fallback', apiError);
        // Create a temporary URL for the uploaded file
        imageUrl = URL.createObjectURL(file);
      }
      
      // Update form data with new image URL
      setFormData({
        ...formData,
        profilePicture: imageUrl
      });
      
      setUploadLoading(false);
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError('Failed to upload profile picture. Please try again.');
      setUploadLoading(false);
    }
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
    // If editing and password field is empty, consider it valid (not changing password)
    if (isEdit && !formData.password) {
      return true;
    }
    
    // New users or password changes must meet all criteria
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate password for new users
    if (!isEdit && !isPasswordValid()) {
      setError('Password must be at least 8 characters and include letters, numbers, and special characters');
      setLoading(false);
      return;
    }

    // Log what we're submitting
    console.log('Submitting form data:', formData);
    // Explicitly log the profile picture to confirm it's included
    console.log('Profile picture URL being submitted:', formData.profilePicture);

    try {
      if (isEdit) {
        // When editing, never include password in the update
        const updateData = { ...formData };
        delete updateData.password;
        
        // Ensure profilePicture is included in the update data
        console.log('Sending profile picture in update:', updateData.profilePicture);
        const result = await updateUser(id, updateData);
        console.log('Update response:', result);
      } else {
        // Ensure profilePicture is included in the create data
        console.log('Sending profile picture in create:', formData.profilePicture);
        const result = await createUser(formData);
        console.log('Create response:', result);
      }
      
      // Redirect back to users list
      navigate('/users');
    } catch (err) {
      // Set error message from response or a default
      setError(err.response?.data?.msg || 'Failed to save user. Please try again.');
      console.error('Error saving user:', err);
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Birth Date"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            {!isEdit && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  error={formData.password.length > 0 && !isPasswordValid()}
                  helperText={
                    formData.password.length > 0 && !isPasswordValid()
                      ? "Password must meet all requirements below"
                      : "Password must be at least 8 characters with letters, numbers, and special characters"
                  }
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
                {formData.password.length > 0 && (
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
            )}
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
                Profile Picture
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
                <Avatar 
                  src={formData.profilePicture} 
                  alt={`${formData.firstName} ${formData.lastName}`}
                  sx={{ width: 100, height: 100 }}
                >
                  {formData.firstName?.charAt(0)}
                </Avatar>
                <Box>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-picture-upload"
                    type="file"
                    onChange={handleProfilePictureUpload}
                  />
                  <label htmlFor="profile-picture-upload">
                    <Button
                      component="span"
                      variant="contained"
                      startIcon={uploadLoading ? <CircularProgress size={20} /> : <PhotoCamera />}
                      disabled={uploadLoading}
                    >
                      {uploadLoading ? 'Uploading...' : 'Upload Picture'}
                    </Button>
                  </label>
                  {formData.profilePicture && (
                    <Button 
                      color="error" 
                      sx={{ ml: 2 }}
                      onClick={() => setFormData({...formData, profilePicture: ''})}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              </Box>
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
                  disabled={loading || (!isEdit && !isPasswordValid())}
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