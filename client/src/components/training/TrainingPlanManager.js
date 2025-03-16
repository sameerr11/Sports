import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  Button, 
  Grid, 
  TextField, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Snackbar, 
  Alert, 
  Paper, 
  Divider,
  IconButton,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  Add, 
  Delete, 
  Edit, 
  Assignment, 
  CalendarMonth, 
  Person,
  SportsSoccer,
  FitnessCenter,
  Schedule,
  PlayArrow,
  Done,
  Close,
  Sports
} from '@mui/icons-material';
import { format } from 'date-fns';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getAuthHeader, isSportsSupervisor, getStoredUser } from '../../services/authService';

const TrainingPlanManager = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [teams, setTeams] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: 'Created from scheduling',
    team: '',
    date: new Date(),
    duration: 60,
    activities: [],
    notes: '',
    attachments: []
  });
  
  // Activity Form State
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState({
    title: '',
    description: '',
    duration: 15,
    order: 1
  });
  const [editingActivityIndex, setEditingActivityIndex] = useState(-1);
  
  // Add a new state variable for read-only mode
  const [readOnly, setReadOnly] = useState(false);
  
  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch training plans based on user role
        const plansRes = await api.get('/training-plans');
        
        // For sports supervisors, filter plans to only show those for their assigned sport types
        const user = getStoredUser();
        let filteredPlans = plansRes.data;
        
        if (isSportsSupervisor() && user.supervisorSportTypes && user.supervisorSportTypes.length > 0) {
          // The backend already filters plans for sports supervisors, but we can add a visual indicator
          console.log(`Showing training plans for sport types: ${user.supervisorSportTypes.join(', ')}`);
        }
        
        setTrainingPlans(filteredPlans);
        
        // Fetch teams
        const teamsRes = await api.get('/teams');
        setTeams(teamsRes.data);
        
        // Fetch coaches
        const coachesRes = await api.get('/users/role/coach');
        setCoaches(coachesRes.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setAlert({
          open: true,
          message: 'Error loading data. Please try again.',
          severity: 'error'
        });
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleOpenDialog = (plan = null) => {
    if (plan) {
      // Edit existing plan
      setCurrentPlan(plan);
      
      // Set read-only if the plan is completed
      const isCompleted = plan.status === 'Completed';
      setReadOnly(isCompleted);
      
      setFormData({
        title: plan.title,
        description: plan.description || 'Created from scheduling',
        team: plan.team._id,
        date: new Date(plan.date),
        duration: plan.duration,
        activities: [...plan.activities],
        notes: plan.notes || '',
        attachments: plan.attachments || []
      });
      
      // Show a notification if in read-only mode
      if (isCompleted) {
        setAlert({
          open: true,
          message: 'This plan is completed and cannot be edited. Viewing in read-only mode.',
          severity: 'info'
        });
      }
    } else {
      // Create new plan
      setCurrentPlan(null);
      setReadOnly(false);
      resetForm();
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: 'Created from scheduling',
      team: '',
      date: new Date(),
      duration: 60,
      activities: [],
      notes: '',
      attachments: []
    });
    setCurrentPlan(null);
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveTrainingPlan = async () => {
    try {
      // Validate form
      if (!formData.title || !formData.team) {
        setAlert({
          open: true,
          message: 'Please fill all required fields',
          severity: 'error'
        });
        return;
      }
      
      // Format the data to ensure it's in the correct format
      const formattedData = {
        ...formData,
        // Ensure date is a proper ISO string
        date: formData.date instanceof Date ? formData.date.toISOString() : formData.date,
        // Ensure duration is a number
        duration: Number(formData.duration),
        // Ensure all activity durations are numbers
        activities: formData.activities.map(activity => ({
          ...activity,
          duration: Number(activity.duration),
          order: Number(activity.order)
        }))
      };
      
      console.log('Saving training plan with data:', formattedData);
      
      // Create or update training plan
      let response;
      
      if (currentPlan) {
        // Update existing plan
        console.log(`Updating plan with ID: ${currentPlan._id}`);
        response = await api.put(`/training-plans/${currentPlan._id}`, formattedData);
        console.log('Update response:', response.data);
        
        // Update list with the response data
        setTrainingPlans(plans => 
          plans.map(plan => 
            plan._id === currentPlan._id ? response.data : plan
          )
        );
        
        setAlert({
          open: true,
          message: 'Training plan updated successfully',
          severity: 'success'
        });
      } else {
        // Create new plan
        console.log('Creating new plan');
        response = await api.post('/training-plans', formattedData);
        console.log('Create response:', response.data);
        
        // Add to list
        setTrainingPlans(plans => [...plans, response.data]);
        
        setAlert({
          open: true,
          message: 'Training plan created successfully',
          severity: 'success'
        });
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving training plan:', error);
      console.error('Error details:', error.response?.data || error.message);
      setAlert({
        open: true,
        message: error.response?.data?.msg || 'Error saving training plan',
        severity: 'error'
      });
    }
  };
  
  // Handle training plan activities
  const handleAddActivity = () => {
    setCurrentActivity({
      title: '',
      description: '',
      duration: 15,
      order: formData.activities.length + 1
    });
    setEditingActivityIndex(-1);
    setActivityDialogOpen(true);
  };
  
  const handleEditActivity = (index) => {
    const activity = formData.activities[index];
    setCurrentActivity({ ...activity });
    setEditingActivityIndex(index);
    setActivityDialogOpen(true);
  };
  
  const handleActivityChange = (e) => {
    const { name, value } = e.target;
    setCurrentActivity(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveActivity = () => {
    // Validate
    if (!currentActivity.title || !currentActivity.duration) {
      setAlert({
        open: true,
        message: 'Activity title and duration are required',
        severity: 'error'
      });
      return;
    }
    
    const updatedActivities = [...formData.activities];
    
    if (editingActivityIndex >= 0) {
      // Update existing activity
      updatedActivities[editingActivityIndex] = currentActivity;
    } else {
      // Add new activity
      updatedActivities.push(currentActivity);
    }
    
    // Sort by order
    updatedActivities.sort((a, b) => a.order - b.order);
    
    setFormData(prev => ({
      ...prev,
      activities: updatedActivities
    }));
    
    setActivityDialogOpen(false);
  };
  
  const handleDeleteActivity = (index) => {
    const updatedActivities = [...formData.activities];
    updatedActivities.splice(index, 1);
    
    // Update order
    updatedActivities.forEach((activity, idx) => {
      activity.order = idx + 1;
    });
    
    setFormData(prev => ({
      ...prev,
      activities: updatedActivities
    }));
  };
  
  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this training plan?')) {
      return;
    }
    
    try {
      console.log(`Attempting to delete training plan with ID: ${id}`);
      
      // Set loading state while deleting
      setLoading(true);
      
      const response = await api.delete(`/training-plans/${id}`);
      console.log('Delete response:', response.data);
      
      // Remove from list
      setTrainingPlans(prevPlans => prevPlans.filter(plan => plan._id !== id));
      
      setAlert({
        open: true,
        message: 'Training plan deleted successfully',
        severity: 'success'
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error deleting training plan:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Additional debugging info
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        console.error('Data:', error.response.data);
      }
      
      setAlert({
        open: true,
        message: error.response?.data?.msg || 'Error deleting training plan. Please try again.',
        severity: 'error'
      });
      
      setLoading(false);
    }
  };
  
  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
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
  
  // Group plans by status
  const plansByStatus = (status) => {
    return trainingPlans.filter(plan => plan.status === status);
  };
  
  // Filter plans based on tab
  const getFilteredPlans = () => {
    if (activeTab === 0) {
      // All plans
      return trainingPlans;
    } else if (activeTab === 1) {
      // Draft plans
      return plansByStatus('Draft');
    } else if (activeTab === 2) {
      // Assigned plans
      return plansByStatus('Assigned');
    } else if (activeTab === 3) {
      // In progress plans
      return plansByStatus('InProgress');
    } else {
      // Completed plans
      return plansByStatus('Completed');
    }
  };
  
  const calculateTotalActivityDuration = (activities) => {
    return activities.reduce((total, activity) => total + Number(activity.duration), 0);
  };
  
  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Training Plans
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Create Training Plan
        </Button>
      </Box>
      
      {/* Sport Type Filter Indicator for Sports Supervisors */}
      {isSportsSupervisor() && getStoredUser()?.supervisorSportTypes?.length > 0 && (
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: alpha(theme.palette.info.main, 0.1),
            border: `1px solid ${theme.palette.info.main}` 
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Sports sx={{ mr: 1, color: theme.palette.info.main }} />
            <Typography variant="body1">
              Showing training plans for your assigned sport types: 
              {getStoredUser().supervisorSportTypes.map((sport, idx) => (
                <Chip 
                  key={sport} 
                  label={sport} 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 1, mr: 0.5 }}
                />
              ))}
            </Typography>
          </Box>
        </Paper>
      )}
      
      {/* Tabs */}
      <Box sx={{ width: '100%', bgcolor: 'background.paper', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Plans" />
          <Tab label="Draft" />
          <Tab label="Assigned" />
          <Tab label="In Progress" />
          <Tab label="Completed" />
        </Tabs>
      </Box>
      
      {/* Loading Indicator */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Training Plans List */}
          <Grid container spacing={3}>
            {getFilteredPlans().length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    No training plans found
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    sx={{ mt: 2 }}
                  >
                    Create New Plan
                  </Button>
                </Paper>
              </Grid>
            ) : (
              getFilteredPlans().map(plan => (
                <Grid item xs={12} md={6} lg={4} key={plan._id}>
                  <Card 
                    elevation={2} 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRadius: 2,
                      '&:hover': {
                        boxShadow: 6
                      }
                    }}
                  >
                    <CardHeader
                      title={plan.title}
                      subheader={
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <CalendarMonth sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(plan.date), 'PPP')}
                          </Typography>
                        </Box>
                      }
                      action={
                        <Box>
                          <Chip 
                            label={plan.status}
                            color={getStatusColor(plan.status)}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(plan)}
                            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                            disabled={plan.status === 'Completed'}
                            title={plan.status === 'Completed' ? 'Completed plans cannot be edited' : 'Edit plan'}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                    />
                    <Divider />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {plan.description}
                        </Typography>
                      </Box>
                      
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Team</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {plan.team?.name || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Duration</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {plan.duration} minutes
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Activities</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {plan.activities?.length || 0}
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      {plan.activities && plan.activities.length > 0 && (
                        <Box>
                          <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                            Activities:
                          </Typography>
                          <List dense sx={{ bgcolor: alpha(theme.palette.background.default, 0.5), borderRadius: 1 }}>
                            {plan.activities.slice(0, 3).map((activity, index) => (
                              <ListItem key={index} sx={{ py: 0.5 }}>
                                <ListItemText
                                  primary={activity.title}
                                  secondary={`${activity.duration} min`}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                  secondaryTypographyProps={{ variant: 'caption' }}
                                />
                              </ListItem>
                            ))}
                            {plan.activities.length > 3 && (
                              <ListItem>
                                <ListItemText
                                  primary={`+${plan.activities.length - 3} more activities`}
                                  primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                />
                              </ListItem>
                            )}
                          </List>
                        </Box>
                      )}
                    </CardContent>
                    <Divider />
                    <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleDeletePlan(plan._id)}
                        sx={{ mr: 1 }}
                      >
                        Delete
                      </Button>
                      <Button
                        size="small"
                        color="primary"
                        startIcon={<Edit />}
                        onClick={() => handleOpenDialog(plan)}
                        disabled={plan.status === 'Completed'}
                      >
                        {plan.status === 'Completed' ? 'View' : 'Edit'}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </>
      )}
      
      {/* Create/Edit Training Plan Dialog */}
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
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" component="div" fontWeight="bold">
            {currentPlan ? 'Edit Training Plan' : 'Create New Training Plan'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentPlan ? 'Modify the details of this training plan' : 'Fill in the details to create a new training plan'}
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="title"
                label="Title"
                value={formData.title}
                onChange={handleFormChange}
                fullWidth
                required
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={readOnly}>
                <InputLabel id="team-label">Team</InputLabel>
                <Select
                  labelId="team-label"
                  name="team"
                  value={formData.team}
                  onChange={handleFormChange}
                  label="Team"
                  disabled={readOnly}
                >
                  {teams.map(team => (
                    <MenuItem key={team._id} value={team._id}>
                      {team.name} ({team.sportType})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="duration"
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={handleFormChange}
                fullWidth
                required
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">Activities</Typography>
                {!readOnly && (
                  <Button 
                    startIcon={<Add />} 
                    onClick={handleAddActivity}
                    variant="outlined"
                    size="small"
                  >
                    Add Activity
                  </Button>
                )}
              </Box>
              {formData.activities.length === 0 ? (
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                  <Typography variant="body2" color="text.secondary">
                    No activities added yet
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    onClick={handleAddActivity}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Add First Activity
                  </Button>
                </Paper>
              ) : (
                <>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableRow>
                          <TableCell width={50}>#</TableCell>
                          <TableCell>Activity</TableCell>
                          <TableCell>Duration</TableCell>
                          {!readOnly && <TableCell align="right">Actions</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.activities.map((activity, index) => (
                          <TableRow key={index}>
                            <TableCell>{activity.order}</TableCell>
                            <TableCell>
                              <Typography variant="body2">{activity.title}</Typography>
                              {activity.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {activity.description}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>{activity.duration} min</TableCell>
                            {!readOnly && (
                              <TableCell align="right">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEditActivity(index)}
                                  sx={{ mr: 1 }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteActivity(index)}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={!readOnly ? 2 : 1} align="right" sx={{ fontWeight: 'bold' }}>
                            Total Duration:
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            {calculateTotalActivityDuration(formData.activities)} min
                          </TableCell>
                          {!readOnly && <TableCell></TableCell>}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {Math.abs(calculateTotalActivityDuration(formData.activities) - Number(formData.duration)) > 0.001 && (
                    <Alert 
                      severity="warning" 
                      sx={{ mt: 1 }}
                      icon={<Schedule />}
                    >
                      Total activity duration ({calculateTotalActivityDuration(formData.activities)} min) doesn't match plan duration ({formData.duration} min)
                    </Alert>
                  )}
                </>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} startIcon={<Close />}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button 
              onClick={handleSaveTrainingPlan} 
              variant="contained" 
              color="primary"
              startIcon={<Done />}
            >
              {currentPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Activity Dialog */}
      <Dialog
        open={activityDialogOpen}
        onClose={() => setActivityDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingActivityIndex >= 0 ? 'Edit Activity' : 'Add Activity'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Activity Title"
                value={currentActivity.title}
                onChange={handleActivityChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={currentActivity.description}
                onChange={handleActivityChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="duration"
                label="Duration (minutes)"
                type="number"
                value={currentActivity.duration}
                onChange={handleActivityChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="order"
                label="Order"
                type="number"
                value={currentActivity.order}
                onChange={handleActivityChange}
                fullWidth
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivityDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveActivity} 
            variant="contained" 
            color="primary"
          >
            Save Activity
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alert.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrainingPlanManager; 