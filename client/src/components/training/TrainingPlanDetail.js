import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  Grid, 
  Paper, 
  Divider, 
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Avatar,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  CalendarMonth, 
  FitnessCenter, 
  AccessTime, 
  Person, 
  Close, 
  PlayArrow, 
  Done,
  ArrowBack,
  Timer,
  DirectionsRun,
  Sports
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../services/api';
import { getTrainingPlanById, updateTrainingPlanStatus } from '../../services/trainingService';
import { getStoredUser, isCoach } from '../../services/authService';

const TrainingPlanDetail = () => {
  const { id } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const [trainingPlan, setTrainingPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // Verify coach access
  const isCoachUser = isCoach();
  
  useEffect(() => {
    const fetchTrainingPlan = async () => {
      try {
        setLoading(true);
        const data = await getTrainingPlanById(id);
        setTrainingPlan(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching training plan:', err);
        setError(err.toString());
        setLoading(false);
      }
    };
    
    if (id) {
      fetchTrainingPlan();
    }
  }, [id]);
  
  const handleStatusUpdate = async (newStatus) => {
    try {
      setStatusUpdateLoading(true);
      await updateTrainingPlanStatus(id, newStatus);
      
      // Update local state
      setTrainingPlan(prev => ({
        ...prev,
        status: newStatus
      }));
      
      setStatusUpdateLoading(false);
    } catch (err) {
      console.error('Error updating training plan status:', err);
      setError(err.toString());
      setStatusUpdateLoading(false);
    }
  };
  
  const handleOpenActivityDetail = (activity) => {
    setSelectedActivity(activity);
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedActivity(null);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft':
        return 'default';
      case 'Assigned':
        return 'info';
      case 'InProgress':
        return 'warning';
      case 'Completed':
        return 'success';
      default:
        return 'default';
    }
  };
  
  const calculateTotalDuration = (activities) => {
    if (!activities || !activities.length) return 0;
    return activities.reduce((total, activity) => total + Number(activity.duration), 0);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.error.main, 0.1) }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => navigate(-1)}
            startIcon={<ArrowBack />}
            sx={{ mt: 2 }}
          >
            Go Back
          </Button>
        </Paper>
      </Box>
    );
  }
  
  if (!trainingPlan) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography>Training plan not found.</Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => navigate(-1)}
            startIcon={<ArrowBack />}
            sx={{ mt: 2 }}
          >
            Go Back
          </Button>
        </Paper>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header with back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => navigate(-1)} 
          startIcon={<ArrowBack />}
        >
          Back to Dashboard
        </Button>
        
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Training Plan Details
          </Typography>
        </Box>
        
        <Box>
          <Chip 
            label={trainingPlan.status}
            color={getStatusColor(trainingPlan.status)}
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
      </Box>
      
      {/* Main content */}
      <Grid container spacing={3}>
        {/* Training Plan Overview */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardHeader 
              title={trainingPlan.title}
              subheader={
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <CalendarMonth sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(trainingPlan.date), 'PPP')}
                  </Typography>
                </Box>
              }
              action={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {trainingPlan.status === 'Assigned' && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PlayArrow />}
                      onClick={() => handleStatusUpdate('InProgress')}
                      disabled={statusUpdateLoading}
                      sx={{ mr: 1 }}
                    >
                      Start
                    </Button>
                  )}
                  
                  {trainingPlan.status === 'InProgress' && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Done />}
                      onClick={() => handleStatusUpdate('Completed')}
                      disabled={statusUpdateLoading}
                      sx={{ mr: 1 }}
                    >
                      Complete
                    </Button>
                  )}
                </Box>
              }
            />
            <Divider />
            <CardContent>
              <Typography variant="body1" paragraph>
                {trainingPlan.description}
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      borderRadius: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.2), 
                          color: theme.palette.primary.main,
                          mr: 1
                        }}
                      >
                        <Sports />
                      </Avatar>
                      <Typography variant="h6">Team</Typography>
                    </Box>
                    <Typography variant="body1">
                      {trainingPlan.team?.name || 'No team assigned'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: alpha(theme.palette.info.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                      borderRadius: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: alpha(theme.palette.info.main, 0.2), 
                          color: theme.palette.info.main,
                          mr: 1
                        }}
                      >
                        <Timer />
                      </Avatar>
                      <Typography variant="h6">Duration</Typography>
                    </Box>
                    <Typography variant="body1">
                      {trainingPlan.duration || calculateTotalDuration(trainingPlan.activities)} minutes
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: alpha(theme.palette.success.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                      borderRadius: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: alpha(theme.palette.success.main, 0.2), 
                          color: theme.palette.success.main,
                          mr: 1
                        }}
                      >
                        <DirectionsRun />
                      </Avatar>
                      <Typography variant="h6">Activities</Typography>
                    </Box>
                    <Typography variant="body1">
                      {trainingPlan.activities?.length || 0} activities
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: alpha(theme.palette.warning.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                      borderRadius: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: alpha(theme.palette.warning.main, 0.2), 
                          color: theme.palette.warning.main,
                          mr: 1
                        }}
                      >
                        <Person />
                      </Avatar>
                      <Typography variant="h6">Assigned To</Typography>
                    </Box>
                    <Typography variant="body1">
                      {trainingPlan.assignedTo ? 
                        `${trainingPlan.assignedTo.firstName} ${trainingPlan.assignedTo.lastName}` : 
                        'Not assigned'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Activities Table */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardHeader 
              title="Training Activities"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <Divider />
            <CardContent>
              {!trainingPlan.activities || trainingPlan.activities.length === 0 ? (
                <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                  No activities defined for this training plan.
                </Typography>
              ) : (
                <TableContainer>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell width={80}>Order</TableCell>
                        <TableCell>Activity</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell width={100}>Duration</TableCell>
                        <TableCell width={100}>Type</TableCell>
                        <TableCell width={80}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trainingPlan.activities.map((activity, index) => (
                        <TableRow 
                          key={index}
                          hover
                          sx={{ 
                            '&:hover': { 
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                              cursor: 'pointer' 
                            } 
                          }}
                        >
                          <TableCell>{activity.order || index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">{activity.title}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}>
                              {activity.description || 'No description'}
                            </Typography>
                          </TableCell>
                          <TableCell>{activity.duration} min</TableCell>
                          <TableCell>
                            <Chip 
                              label={activity.type || 'General'} 
                              size="small"
                              color={activity.type === 'Warm-up' ? 'warning' : 
                                    activity.type === 'Cool-down' ? 'info' : 
                                    activity.type === 'Core' ? 'error' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenActivityDetail(activity)}
                            >
                              <FitnessCenter fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Activity Detail Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 24
          }
        }}
      >
        {selectedActivity && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{selectedActivity.title}</Typography>
                <IconButton onClick={handleCloseDialog} size="small">
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
                  <Typography variant="body1">{selectedActivity.duration} minutes</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                  <Typography variant="body1">{selectedActivity.type || 'General'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Order</Typography>
                  <Typography variant="body1">{selectedActivity.order || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body1" paragraph>
                    {selectedActivity.description || 'No description provided.'}
                  </Typography>
                </Grid>
                {selectedActivity.instructions && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Instructions</Typography>
                    <Typography variant="body1">
                      {selectedActivity.instructions}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} color="primary">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TrainingPlanDetail; 