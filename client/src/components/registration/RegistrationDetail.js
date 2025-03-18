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
  CircularProgress
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  getRegistrationById, 
  approveRegistration, 
  createUserAccount 
} from '../../services/registrationService';
import { useAuth } from '../../contexts/AuthContext';

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
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  
  const isAdmin = user && user.role === 'admin';
  
  useEffect(() => {
    console.log('Current user role:', user?.role);
    console.log('Is admin?', isAdmin);
  }, [user, isAdmin]);
  
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
    setActionLoading(true);
    setActionError(null);
    
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
        
        {isAdmin && (
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
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            helperText="Leave blank to generate a random password"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateAccount} 
            color="primary" 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? 'Creating...' : 'Create Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RegistrationDetail; 