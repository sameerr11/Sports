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
  DialogActions,
  Tabs,
  Tab,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tooltip,
  Badge,
  Alert
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
  Sports,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Save,
  PeopleAlt,
  InfoOutlined
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../services/api';
import { getTrainingPlanById, updateTrainingPlanStatus, getTrainingPlanAttendance, updateTrainingPlanAttendance } from '../../services/trainingService';
import { getStoredUser, isCoach } from '../../services/authService';

const TrainingPlanDetail = () => {
  const { id } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  
  // Verify coach access
  const isCoachUser = isCoach();
  
  // Get tab from URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam) {
      const tabIndex = parseInt(tabParam);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 2) {
        setCurrentTab(tabIndex);
      }
    }
  }, [location.search]);
  
  useEffect(() => {
    const fetchTrainingPlan = async () => {
      try {
        const response = await getTrainingPlanById(id);
        setPlan(response);
        
        // If we have a team, load its players for attendance tab
        if (response.team && response.team._id) {
          fetchTeamPlayers(response.team._id);
        }
        
        // Fetch attendance if exists
        fetchAttendance();
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching training plan:', err);
        setError('Failed to load training plan');
        setLoading(false);
      }
    };
    
    fetchTrainingPlan();
  }, [id]);
  
  const fetchTeamPlayers = async (teamId) => {
    try {
      const response = await api.get(`/teams/${teamId}`);
      const team = response.data;
      if (team.players && team.players.length > 0) {
        setTeamPlayers(team.players);
        
        // Initialize attendance array if none exists
        if (attendance.length === 0) {
          const initialAttendance = team.players.map(playerData => ({
            player: playerData.player._id,
            playerName: `${playerData.player.firstName} ${playerData.player.lastName}`,
            position: playerData.position,
            status: 'Absent',
            notes: ''
          }));
          setAttendance(initialAttendance);
        }
      }
    } catch (err) {
      console.error('Error fetching team players:', err);
    }
  };
  
  const fetchAttendance = async () => {
    try {
      const response = await getTrainingPlanAttendance(id);
      if (response.success && response.attendance.length > 0) {
        const mappedAttendance = response.attendance.map(item => ({
          player: item.player._id,
          playerName: `${item.player.firstName} ${item.player.lastName}`,
          status: item.status,
          notes: item.notes || '',
          markedBy: item.markedBy?._id || '',
          markedByName: item.markedBy ? `${item.markedBy.firstName} ${item.markedBy.lastName}` : '',
          markedAt: item.markedAt
        }));
        
        setAttendance(mappedAttendance);
        setAttendanceSaved(true);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };
  
  const handleStatusUpdate = async (newStatus) => {
    try {
      setIsUpdating(true);
      await updateTrainingPlanStatus(id, newStatus);
      
      // Update local state
      setPlan(prev => ({
        ...prev,
        status: newStatus
      }));
      
      setIsUpdating(false);
    } catch (err) {
      console.error('Error updating training plan status:', err);
      setError(err.toString());
      setIsUpdating(false);
    }
  };
  
  const handleOpenActivityDetail = (activity) => {
    setCurrentActivity(activity);
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentActivity(null);
  };
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  const handleAttendanceChange = (playerId, field, value) => {
    setAttendance(prev => 
      prev.map(item => 
        item.player === playerId 
          ? { ...item, [field]: value } 
          : item
      )
    );
    
    // Attendance was modified
    if (attendanceSaved) {
      setAttendanceSaved(false);
    }
  };
  
  const handleSaveAttendance = async () => {
    setIsSavingAttendance(true);
    
    try {
      // Format attendance data for API
      const attendanceData = attendance.map(item => ({
        player: item.player,
        status: item.status,
        notes: item.notes || ''
      }));
      
      const response = await updateTrainingPlanAttendance(id, attendanceData);
      
      if (response.success) {
        setAttendanceSaved(true);
      } else {
        setError(response.error || 'Failed to save attendance');
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      setError('Failed to save attendance');
    }
    
    setIsSavingAttendance(false);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'success';
      case 'Absent':
        return 'error';
      case 'Late':
        return 'warning';
      case 'Excused':
        return 'info';
      default:
        return 'default';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present':
        return <CheckCircle />;
      case 'Absent':
        return <Cancel />;
      case 'Late':
        return <HourglassEmpty />;
      case 'Excused':
        return <InfoOutlined />;
      default:
        return null;
    }
  };
  
  // Render the details content tab
  const renderDetailsContent = () => {
    return (
      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Description</Typography>
          <Typography variant="body1">{plan.description || 'No description provided.'}</Typography>
        </Paper>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Team</Typography>
              <Typography variant="body1">{plan.team?.name || 'Not assigned'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {plan.team?.sportType || ''}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Duration</Typography>
              <Typography variant="body1">{plan.duration} minutes</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Coach</Typography>
              <Typography variant="body1">
                {plan.assignedTo ? 
                  `${plan.assignedTo.firstName} ${plan.assignedTo.lastName}` : 
                  'Not assigned'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render the activities content tab
  const renderActivitiesContent = () => {
    return (
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Training Activities</Typography>
        </Box>
        
        {!plan.activities || plan.activities.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No activities have been added to this training plan.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <TableRow>
                  <TableCell width={70}>Order</TableCell>
                  <TableCell>Activity</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell width={100}>Duration</TableCell>
                  <TableCell width={100}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plan.activities.map((activity, index) => (
                  <TableRow key={index} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) } }}>
                    <TableCell>{activity.order || index + 1}</TableCell>
                    <TableCell>{activity.title}</TableCell>
                    <TableCell>{activity.description || 'No description'}</TableCell>
                    <TableCell>{activity.duration} min</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => setCurrentActivity(activity) || setDialogOpen(true)}
                      >
                        <AccessTime fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  };
  
  // Render content based on the active tab
  const renderTabContent = () => {
    switch (currentTab) {
      case 0:
        return renderDetailsContent();
      case 1:
        return renderActivitiesContent();
      case 2:
        return renderAttendanceContent();
      default:
        return renderDetailsContent();
    }
  };
  
  const renderAttendanceContent = () => {
    const canEditAttendance = isCoachUser && 
      (plan?.status === 'InProgress' || plan?.status === 'Assigned' || plan?.status === 'Completed');
    
    return (
      <Box sx={{ mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {attendanceSaved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Attendance saved successfully
          </Alert>
        )}
        
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Player Attendance
          </Typography>
          
          {canEditAttendance && !attendanceSaved && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={handleSaveAttendance}
              disabled={isSavingAttendance}
            >
              {isSavingAttendance ? 'Saving...' : 'Save Attendance'}
            </Button>
          )}
        </Box>
        
        {teamPlayers.length === 0 ? (
          <Alert severity="info">
            No players found for this team.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <TableRow>
                  <TableCell>Player</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Status</TableCell>
                  {canEditAttendance && <TableCell>Notes</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance.map((item) => (
                  <TableRow key={item.player}>
                    <TableCell>{item.playerName}</TableCell>
                    <TableCell>{item.position || 'N/A'}</TableCell>
                    <TableCell>
                      {canEditAttendance ? (
                        <FormControl fullWidth size="small">
                          <Select
                            value={item.status}
                            onChange={(e) => handleAttendanceChange(item.player, 'status', e.target.value)}
                          >
                            <MenuItem value="Present">Present</MenuItem>
                            <MenuItem value="Absent">Absent</MenuItem>
                            <MenuItem value="Late">Late</MenuItem>
                            <MenuItem value="Excused">Excused</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip 
                          icon={getStatusIcon(item.status)} 
                          label={item.status} 
                          color={getStatusColor(item.status)}
                          size="small"
                        />
                      )}
                    </TableCell>
                    {canEditAttendance && (
                      <TableCell>
                        <TextField
                          value={item.notes || ''}
                          onChange={(e) => handleAttendanceChange(item.player, 'notes', e.target.value)}
                          placeholder="Add notes"
                          variant="outlined"
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {plan?.status === 'Draft' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Attendance can only be marked once the training plan has been assigned and is in progress.
          </Alert>
        )}
      </Box>
    );
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }
  
  if (!plan) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Training plan not found</Alert>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{ mb: 1 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            {plan.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Chip 
              label={plan.status} 
              color={getStatusColor(plan.status)} 
              size="small"
              sx={{ mr: 2 }}
            />
            <CalendarMonth sx={{ fontSize: 18, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {format(new Date(plan.date), 'PPP')} at {format(new Date(plan.date), 'p')}
            </Typography>
          </Box>
        </Box>
        
        {/* Status update buttons for coaches */}
        {isCoach() && plan.status !== 'Completed' && plan.status !== 'Draft' && (
          <Box>
            {plan.status === 'Assigned' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={() => handleStatusUpdate('InProgress')}
                disabled={isUpdating}
              >
                Start Training
              </Button>
            )}
            
            {plan.status === 'InProgress' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<Done />}
                onClick={() => handleStatusUpdate('Completed')}
                disabled={isUpdating}
              >
                Complete Training
              </Button>
            )}
          </Box>
        )}
      </Box>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="training plan tabs">
          <Tab label="Details" />
          <Tab label="Activities" />
          <Tab 
            label={
              <Badge 
                color="secondary" 
                badgeContent={attendanceSaved ? null : "!"} 
                invisible={attendanceSaved || teamPlayers.length === 0}
              >
                Attendance
              </Badge>
            } 
            icon={<PeopleAlt />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      {/* Tab content */}
      {renderTabContent()}
      
      {/* Activity Detail Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Activity Details
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {currentActivity && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {currentActivity.title}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Duration: {currentActivity.duration} minutes
                </Typography>
              </Box>
              
              {currentActivity.description && (
                <Typography variant="body1" paragraph>
                  {currentActivity.description}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TrainingPlanDetail; 