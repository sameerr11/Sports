import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Grid, 
  Button, 
  Divider, 
  Box, 
  Chip, 
  Card, 
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Stack
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  getRegistrationById, 
  approveRegistration, 
  createUserAccount 
} from '../../services/registrationService';
import { useAuth } from '../../contexts/AuthContext';
import { Print as PrintIcon, CheckCircle, Cancel as CancelIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import RegistrationReceipt from './RegistrationReceipt';

const RegistrationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalStatus, setApprovalStatus] = useState(true);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  
  const isAdmin = user && user.role === 'admin';
  const isSupport = user && user.role === 'support';
  const hasAccessRights = isAdmin || isSupport;
  
  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasAlphabet: false,
    hasNumber: false,
    hasSpecial: false
  });
  
  useEffect(() => {
    console.log('Current user role:', user?.role);
    console.log('Is admin?', isAdmin);
    console.log('Is support?', isSupport);
    console.log('Has access rights?', hasAccessRights);
  }, [user, isAdmin, isSupport, hasAccessRights]);
  
  useEffect(() => {
    const fetchRegistration = async () => {
      try {
        const data = await getRegistrationById(id);
        setRegistration(data);
        console.log('Registration data loaded:', data);
      } catch (err) {
        console.error('Error fetching registration:', err);
        setError('Failed to load registration details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRegistration();
  }, [id]);
  
  useEffect(() => {
    // Validate password when it changes
    if (password) {
      validatePasswordStrength(password);
    } else {
      setPasswordValidation({
        hasMinLength: false,
        hasAlphabet: false,
        hasNumber: false,
        hasSpecial: false
      });
    }
  }, [password]);
  
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
    // If password is empty, it's valid (random password will be generated)
    if (!password) {
      return true;
    }
    
    // If password is provided, it must meet all criteria
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
  
  const handleApproval = async () => {
    setActionLoading(true);
    setActionError(null);
    
    try {
      console.log('Approval request data:', { 
        id,
        approved: approvalStatus, 
        notes: approvalNotes
      });
      
      const updatedRegistration = await approveRegistration(id, {
        approved: approvalStatus,
        notes: approvalNotes
      });
      
      console.log('Approval response:', updatedRegistration);
      
      setRegistration(updatedRegistration);
      setActionSuccess(`Registration ${approvalStatus ? 'approved' : 'rejected'} successfully`);
      setApprovalDialogOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Error approving registration:', err);
      
      // Enhanced error logging
      if (err.response) {
        console.error('Response error data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
      } else if (err.request) {
        console.error('Request error (no response):', err.request);
      } else {
        console.error('Error message:', err.message);
      }
      
      setActionError(err.response?.data?.msg || 'Failed to process approval');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleCreateAccount = async () => {
    // Check password validity if one is provided
    if (password && !isPasswordValid()) {
      setError('Password must be at least 8 characters and include letters, numbers, and special characters');
      return;
    }
    
    setActionLoading(true);
    try {
      const result = await createUserAccount(id, { password });
      setRegistration(result.registration);
      setActionSuccess('User account created successfully');
      setAccountDialogOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error('Error creating user account:', err);
      setActionError(err.response?.data?.msg || 'Failed to create user account');
    } finally {
      setActionLoading(false);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'error';
      case 'Completed':
        return 'info';
      default:
        return 'warning';
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error || !registration) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Registration not found'}</Alert>
        <Box mt={2}>
          <Button variant="contained" onClick={() => navigate('/registrations')}>
            Back to Registrations
          </Button>
        </Box>
      </Container>
    );
  }
  
  const {
    player,
    sports,
    registrationPeriod,
    startDate,
    endDate,
    fee,
    status,
    adminApproval,
    accountCreated,
    notes,
    createdAt,
    registeredBy
  } = registration;
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {actionSuccess}
        </Alert>
      )}
      
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Registration Details
          </Typography>
          
          <Chip 
            label={status} 
            color={getStatusColor(status)}
            sx={{ fontSize: '1rem', py: 1, px: 2 }}
          />
        </Box>
        
        <Box mb={2}>
          <Button variant="outlined" onClick={() => navigate('/registrations')}>
            Back to Registrations
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Player Information
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Name:</strong> {player.firstName} {player.lastName}
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Email:</strong> {player.email}
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Phone:</strong> {player.phoneNumber}
                </Typography>
                
                {player.dateOfBirth && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Date of Birth:</strong> {format(new Date(player.dateOfBirth), 'dd/MM/yyyy')}
                  </Typography>
                )}
                
                {player.address && player.address.street && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Address:</strong> {player.address.street}, {player.address.city}, {player.address.state}, {player.address.zipCode}, {player.address.country}
                  </Typography>
                )}
                
                {player.emergencyContact && player.emergencyContact.name && (
                  <>
                    <Typography variant="body1" gutterBottom>
                      <strong>Emergency Contact:</strong> {player.emergencyContact.name} ({player.emergencyContact.relation})
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Emergency Phone:</strong> {player.emergencyContact.phoneNumber}
                    </Typography>
                  </>
                )}
                
                {player.healthNotes && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Health Notes:</strong> {player.healthNotes}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Registration Information
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Sports:</strong> {sports.join(', ')}
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Period:</strong> {registrationPeriod}
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Start Date:</strong> {format(new Date(startDate), 'dd/MM/yyyy')}
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>End Date:</strong> {format(new Date(endDate), 'dd/MM/yyyy')}
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Fee Amount:</strong> ${fee.amount}
                </Typography>
                
                {fee.invoiceNumber && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Invoice Number:</strong> {fee.invoiceNumber}
                  </Typography>
                )}
                
                <Typography variant="body1" gutterBottom>
                  <strong>Payment Method:</strong> {fee.paymentMethod}
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  <strong>Payment Status:</strong> {fee.paymentStatus}
                </Typography>
                
                {fee.receiptNumber && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Receipt Number:</strong> {fee.receiptNumber}
                  </Typography>
                )}
                
                {fee.transactionId && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Transaction ID:</strong> {fee.transactionId}
                  </Typography>
                )}
                
                <Typography variant="body1" gutterBottom>
                  <strong>Registered On:</strong> {format(new Date(createdAt), 'dd/MM/yyyy')}
                </Typography>
                
                {registeredBy && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Registered By:</strong> {registeredBy.firstName} {registeredBy.lastName}
                  </Typography>
                )}
                
                {notes && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Notes:</strong> {notes}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {adminApproval && adminApproval.approvedBy && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Admin Approval
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>Status:</strong>{' '}
                    <Chip 
                      label={adminApproval.approved ? 'Approved' : 'Rejected'} 
                      color={adminApproval.approved ? 'success' : 'error'} 
                      size="small"
                    />
                  </Typography>
                  
                  {adminApproval.approvedAt && (
                    <Typography variant="body1" gutterBottom>
                      <strong>Date:</strong> {format(new Date(adminApproval.approvedAt), 'dd/MM/yyyy HH:mm')}
                    </Typography>
                  )}
                  
                  {adminApproval.approvedBy && (
                    <Typography variant="body1" gutterBottom>
                      <strong>By:</strong> {adminApproval.approvedBy.firstName} {adminApproval.approvedBy.lastName}
                    </Typography>
                  )}
                  
                  {adminApproval.notes && (
                    <Typography variant="body1" gutterBottom>
                      <strong>Notes:</strong> {adminApproval.notes}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
        
        {/* Show receipt button if payment status is Paid */}
        {fee.paymentStatus === 'Paid' && (
          <Box mt={3} display="flex" justifyContent="center">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={() => setReceiptOpen(true)}
            >
              Print Receipt
            </Button>
          </Box>
        )}
        
        {hasAccessRights && (
          <Box mt={3} display="flex" gap={2} justifyContent="flex-end">
            {status === 'Pending' && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    console.log('Opening approval dialog with status: Approved');
                    setApprovalStatus(true);
                    setApprovalDialogOpen(true);
                  }}
                >
                  Approve
                </Button>
                
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    console.log('Opening approval dialog with status: Rejected');
                    setApprovalStatus(false);
                    setApprovalDialogOpen(true);
                  }}
                >
                  Reject
                </Button>
              </>
            )}
            
            {status === 'Approved' && !accountCreated && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setAccountDialogOpen(true)}
              >
                Create User Account
              </Button>
            )}
          </Box>
        )}
      </Paper>
      
      {/* Approval Dialog */}
      <Dialog 
        open={approvalDialogOpen} 
        onClose={() => {
          console.log('Closing approval dialog');
          setApprovalDialogOpen(false);
        }}
      >
        <DialogTitle>
          {approvalStatus ? 'Approve Registration' : 'Reject Registration'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Notes"
            fullWidth
            multiline
            rows={4}
            value={approvalNotes}
            onChange={(e) => {
              console.log('Updating approval notes:', e.target.value);
              setApprovalNotes(e.target.value);
            }}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setApprovalDialogOpen(false)} 
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              console.log('Submitting approval with status:', approvalStatus);
              handleApproval();
            }} 
            color={approvalStatus ? 'success' : 'error'} 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? 'Processing...' : approvalStatus ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Create Account Dialog */}
      <Dialog open={accountDialogOpen} onClose={() => setAccountDialogOpen(false)}>
        <DialogTitle>Create User Account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
            Create a player account for {player.firstName} {player.lastName}
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            label="Password (Optional)"
            type={showPassword ? "text" : "password"}
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            helperText={
              password.length > 0 && !isPasswordValid()
                ? "Password must meet all requirements below"
                : "Leave blank to generate a random password, or enter a secure password"
            }
            error={password.length > 0 && !isPasswordValid()}
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
          {password.length > 0 && (
            <Box sx={{ mt: 2, mb: 1 }}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateAccount} 
            color="primary" 
            variant="contained"
            disabled={actionLoading || (password.length > 0 && !isPasswordValid())}
          >
            {actionLoading ? 'Creating...' : 'Create Account'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Registration Receipt Dialog */}
      <RegistrationReceipt 
        registration={registration} 
        open={receiptOpen} 
        onClose={() => setReceiptOpen(false)} 
      />
    </Container>
  );
};

export default RegistrationDetail; 