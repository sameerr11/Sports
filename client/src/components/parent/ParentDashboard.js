import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  Grid, 
  Tabs, 
  Tab, 
  Paper, 
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Button,
  IconButton,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link as MuiLink,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  FormHelperText
} from '@mui/material';
import { 
  Person, 
  CalendarMonth, 
  SportsScore, 
  Assignment, 
  FitnessCenter, 
  Event, 
  LocationOn, 
  AccessTime, 
  ArrowForward, 
  StarOutline,
  Star,
  KeyboardArrowRight,
  People,
  FilterAlt,
  Clear
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../services/api';
import { getStoredUser, isParent } from '../../services/authService';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const ParentDashboard = () => {
  const theme = useTheme();
  const user = getStoredUser();
  const [activeTab, setActiveTab] = useState(0);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add state for date range filter
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState(null);
  const [dateRangeEnd, setDateRangeEnd] = useState(null);
  const [singleDateFilter, setSingleDateFilter] = useState(null);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [filterMode, setFilterMode] = useState('range'); // 'range' or 'single'
  
  // Check if user is a parent
  const parentAccess = isParent();
  
  // Add a function to retry API calls
  const retryApiCall = async (apiCall, maxRetries = 3) => {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        return await apiCall();
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
        console.log(`Retry attempt ${retries}/${maxRetries} after failure`);
        // Wait for a short time before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  };

  // Declare fetchParentData outside of useEffect
  const fetchParentData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test API connection first
      const connectionTest = await api.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Cannot connect to the server: ${connectionTest.error}`);
      }
      
      // 1. Fetch children associated with the parent
      const childrenRes = await retryApiCall(() => api.get('/users/parent/children'));
      setChildren(childrenRes.data);
      
      // Set the first child as selected by default if available
      if (childrenRes.data.length > 0) {
        setSelectedChild(childrenRes.data[0]._id);
        
        // 2. Fetch teams where the selected child is a player
        const teamsRes = await retryApiCall(() => 
          api.get(`/teams/player/${childrenRes.data[0]._id}`)
        );
        const teamIds = teamsRes.data.map(team => team._id);
        
        // 3. Fetch bookings related to child's teams
        let teamBookings = [];
        if (teamIds.length > 0) {
          const bookingsPromises = teamIds.map(teamId => 
            retryApiCall(() => api.get('/bookings', { params: { team: teamId } }))
          );
          
          const bookingsResponses = await Promise.all(bookingsPromises);
          teamBookings = bookingsResponses.flatMap(res => res.data);
        }
        
        // 4. Filter bookings for training sessions and matches
        const trainingSessions = teamBookings.filter(
          booking => booking.purpose === 'Training' && new Date(booking.startTime) >= new Date()
        );
        setTrainingSessions(trainingSessions);
        
        const matchSessions = teamBookings.filter(
          booking => booking.purpose === 'Match' && new Date(booking.startTime) >= new Date()
        );
        setUpcomingMatches(matchSessions);
        
        // 5. Fetch training plans for the child's teams
        if (teamIds.length > 0) {
          try {
            const trainingPlansPromises = teamIds.map(teamId => 
              retryApiCall(() => api.get(`/training-plans/team/${teamId}`))
            );
            
            const trainingPlansResponses = await Promise.all(trainingPlansPromises);
            
            // Combine all training plans and filter for assigned or in progress
            const allPlans = trainingPlansResponses.flatMap(res => res.data)
              .filter(plan => ['Assigned', 'InProgress'].includes(plan.status));
            
            setTrainingPlans(allPlans);
          } catch (trainingPlanError) {
            console.error('Error fetching training plans:', trainingPlanError);
            setError('Could not load training plans. Please try again later.');
            // Still set empty training plans to avoid undefined errors
            setTrainingPlans([]);
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching parent data:', error);
      setError(error.toString());
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, []);
  
  // Handle child selection change
  const handleChildChange = async (event) => {
    const childId = event.target.value;
    setSelectedChild(childId);
    setLoading(true);
    setError(null);
    
    try {
      // Fetch data for the selected child
      const teamsRes = await retryApiCall(() => api.get(`/teams/player/${childId}`));
      const teamIds = teamsRes.data.map(team => team._id);
      
      // Fetch bookings related to child's teams
      let teamBookings = [];
      if (teamIds.length > 0) {
        const bookingsPromises = teamIds.map(teamId => 
          retryApiCall(() => api.get('/bookings', { params: { team: teamId } }))
        );
        
        const bookingsResponses = await Promise.all(bookingsPromises);
        teamBookings = bookingsResponses.flatMap(res => res.data);
      }
      
      // Filter bookings for training sessions and matches
      const trainingSessions = teamBookings.filter(
        booking => booking.purpose === 'Training' && new Date(booking.startTime) >= new Date()
      );
      setTrainingSessions(trainingSessions);
      
      const matchSessions = teamBookings.filter(
        booking => booking.purpose === 'Match' && new Date(booking.startTime) >= new Date()
      );
      setUpcomingMatches(matchSessions);
      
      // Fetch training plans for the selected child's teams
      if (teamIds.length > 0) {
        try {
          const trainingPlansPromises = teamIds.map(teamId => 
            retryApiCall(() => api.get(`/training-plans/team/${teamId}`))
          );
          
          const trainingPlansResponses = await Promise.all(trainingPlansPromises);
          
          // Combine all training plans and filter for assigned or in progress
          const allPlans = trainingPlansResponses.flatMap(res => res.data)
            .filter(plan => ['Assigned', 'InProgress'].includes(plan.status));
          
          setTrainingPlans(allPlans);
        } catch (trainingPlanError) {
          console.error('Error fetching training plans:', trainingPlanError);
          setError('Could not load training plans. Please try again later.');
          setTrainingPlans([]);
        }
      } else {
        setTrainingPlans([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching child data:', error);
      setError(error.toString());
      setLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const formatLocation = (court) => {
    if (!court) return 'TBD';
    return `${court.name}, ${court.location}`;
  };
  
  const renderTrainingScheduleTab = () => {
    // Date filter handlers
    const handleOpenDateFilter = () => {
      setDateFilterOpen(true);
    };

    const handleCloseDateFilter = () => {
      setDateFilterOpen(false);
    };

    const applyDateFilter = () => {
      setIsFilterActive(true);
      setDateFilterOpen(false);
    };

    const clearDateFilter = () => {
      setDateRangeStart(null);
      setDateRangeEnd(null);
      setSingleDateFilter(null);
      setIsFilterActive(false);
      setDateFilterOpen(false);
    };

    // Filter sessions based on selected date range if filter is active
    const filterSessionsByDate = (sessions) => {
      if (!isFilterActive) return sessions;
      
      return sessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        
        if (filterMode === 'single' && singleDateFilter) {
          // When single date filter is active
          const filterDate = new Date(singleDateFilter);
          return sessionDate.getFullYear() === filterDate.getFullYear() &&
                 sessionDate.getMonth() === filterDate.getMonth() &&
                 sessionDate.getDate() === filterDate.getDate();
        } else if (filterMode === 'range') {
          // When range filter is active
          if (dateRangeStart && dateRangeEnd) {
            // When both start and end dates are set
            return sessionDate >= new Date(dateRangeStart) && 
                   sessionDate <= new Date(dateRangeEnd);
          } else if (dateRangeStart) {
            // When only start date is set
            return sessionDate >= new Date(dateRangeStart);
          } else if (dateRangeEnd) {
            // When only end date is set
            return sessionDate <= new Date(dateRangeEnd);
          }
        }
        
        // If no date criteria matches or if filter is not properly set
        return true;
      });
    };

    // Filter the sessions based on the date range
    const filteredSessions = filterSessionsByDate(trainingSessions);
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              mb: 3, 
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <FitnessCenter sx={{ mr: 1 }} />
              {selectedChild && children.find(child => child._id === selectedChild) ? 
                `${children.find(child => child._id === selectedChild).firstName}'s Training Schedule` : 
                'Your Child\'s Training Schedule'}
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<FilterAlt />}
              onClick={handleOpenDateFilter}
            >
              {isFilterActive ? 'Change Date Filter' : 'Filter by Date'}
            </Button>
          </Paper>
          
          {isFilterActive && (
            <Chip 
              icon={<FilterAlt />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2">
                    <b>Date Filter:</b> {
                      filterMode === 'single' 
                        ? singleDateFilter ? format(new Date(singleDateFilter), 'MMM dd, yyyy') : 'Not set'
                        : (dateRangeStart ? format(new Date(dateRangeStart), 'MMM dd, yyyy') : 'Any') + 
                          ' to ' + 
                          (dateRangeEnd ? format(new Date(dateRangeEnd), 'MMM dd, yyyy') : 'Any')
                    }
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={clearDateFilter}
                    sx={{ ml: 1 }}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </Box>
              }
              sx={{
                height: 'auto',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          )}
          
          {filteredSessions.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                {isFilterActive 
                  ? 'No training sessions found within the selected date range.' 
                  : 'No upcoming training sessions scheduled for your child.'}
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.background.default, 0.8) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Team</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSessions.map((session) => {
                    const startTime = new Date(session.startTime);
                    const endTime = new Date(session.endTime);
                    const durationHours = (endTime - startTime) / (1000 * 60 * 60);
                    
                    return (
                      <TableRow key={session._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" fontWeight={500}>
                              {format(startTime, 'EEEE, MMMM d, yyyy')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {session.team ? session.team.name : 'No team specified'}
                        </TableCell>
                        <TableCell>
                          {formatLocation(session.court)}
                        </TableCell>
                        <TableCell>
                          {Math.round(durationHours * 10) / 10} hours
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={session.status}
                            color={
                              session.status === 'Confirmed' ? 'success' :
                              session.status === 'Pending' ? 'warning' :
                              session.status === 'Cancelled' ? 'error' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>

        {/* Date Range Filter Dialog */}
        <Dialog open={dateFilterOpen} onClose={handleCloseDateFilter}>
          <DialogTitle>Filter Sessions by Date</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <Box sx={{ mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={filterMode === 'single'}
                          onChange={() => setFilterMode(filterMode === 'single' ? 'range' : 'single')}
                          color="primary"
                        />
                      }
                      label="Single day filter"
                    />
                    <FormHelperText>
                      {filterMode === 'single' 
                        ? 'Show sessions for a specific day only' 
                        : 'Show sessions within a date range'}
                    </FormHelperText>
                  </Box>
                </FormControl>
              </Grid>

              {filterMode === 'single' ? (
                <Grid item xs={12}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Select Date"
                      value={singleDateFilter}
                      onChange={(newDate) => setSingleDateFilter(newDate)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
              ) : (
                <>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Start Date"
                        value={dateRangeStart}
                        onChange={(newDate) => setDateRangeStart(newDate)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                        maxDate={dateRangeEnd}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="End Date"
                        value={dateRangeEnd}
                        onChange={(newDate) => setDateRangeEnd(newDate)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                        minDate={dateRangeStart}
                      />
                    </LocalizationProvider>
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={clearDateFilter} color="inherit">
              Clear Filter
            </Button>
            <Button onClick={handleCloseDateFilter} color="inherit">
              Cancel
            </Button>
            <Button onClick={applyDateFilter} color="primary" variant="contained">
              Apply Filter
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    );
  };
  
  const renderTrainingPlansTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: 2,
            bgcolor: alpha(theme.palette.info.main, 0.05),
            border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <Assignment sx={{ mr: 1 }} />
            {selectedChild && children.find(child => child._id === selectedChild) ? 
              `${children.find(child => child._id === selectedChild).firstName}'s Training Plans` : 
              'Your Child\'s Training Plans'}
          </Typography>
        </Paper>
        
        {trainingPlans.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              No training plans have been assigned to your child's teams yet.
            </Typography>
          </Paper>
        ) : (
          trainingPlans.map(plan => (
            <Card 
              key={plan._id} 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 5,
                  bgcolor: 
                    plan.status === 'InProgress' ? theme.palette.warning.main : 
                    theme.palette.info.main
                }
              }}
            >
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">
                      {plan.title}
                    </Typography>
                    <Chip 
                      label={plan.status}
                      color={plan.status === 'InProgress' ? 'warning' : 'info'}
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </Box>
                }
                subheader={
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <CalendarMonth sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(plan.date), 'EEEE, MMMM d, yyyy')}
                    </Typography>
                  </Box>
                }
              />
              <Divider />
              <CardContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {plan.description}
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Team</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {plan.team?.name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Duration</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {plan.duration} minutes
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Activities</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {plan.activities?.length || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Coach</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {plan.assignedTo ? `${plan.assignedTo.firstName} ${plan.assignedTo.lastName}` : 'Unassigned'}
                    </Typography>
                  </Grid>
                </Grid>
                
                {plan.activities && plan.activities.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Activities:
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: alpha(theme.palette.background.default, 0.8) }}>
                          <TableRow>
                            <TableCell width={50}>#</TableCell>
                            <TableCell>Activity</TableCell>
                            <TableCell align="right">Duration</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {plan.activities.map((activity, index) => (
                            <TableRow key={index} hover>
                              <TableCell>{activity.order}</TableCell>
                              <TableCell>
                                <Typography variant="body2">{activity.title}</Typography>
                                {activity.description && (
                                  <Typography variant="caption" color="text.secondary">
                                    {activity.description}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">{activity.duration} min</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </Grid>
    </Grid>
  );
  
  const renderMatchesTab = () => (
    <Box>
      <Card elevation={2}>
        <CardHeader 
          title="Upcoming Matches" 
          titleTypographyProps={{ variant: 'h6' }}
        />
        <Divider />
        <CardContent>
          {upcomingMatches.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
              No upcoming matches scheduled.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {upcomingMatches.map((match) => (
                <Grid item xs={12} sm={6} md={4} key={match._id}>
                  <Paper 
                    elevation={3}
                    sx={{ 
                      p: 2, 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      '&:hover': {
                        boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
                      }
                    }}
                  >
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip 
                        label={match.team ? match.team.name : 'No Team'} 
                        color="primary" 
                        size="small" 
                        icon={<People />}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(match.startTime), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                    
                    <Typography variant="h6" gutterBottom>
                      {match.purpose === 'Match' ? 'Match' : match.purpose}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTime sx={{ fontSize: 20, mr: 1, color: theme.palette.text.secondary }} />
                        <Typography variant="body2">
                          {format(new Date(match.startTime), 'h:mm a')} - {format(new Date(match.endTime), 'h:mm a')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOn sx={{ fontSize: 20, mr: 1, color: theme.palette.text.secondary }} />
                        <Typography variant="body2">
                          {formatLocation(match.court)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {match.notes && (
                      <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                        "{match.notes}"
                      </Typography>
                    )}
                    
                    <Box sx={{ mt: 'auto', pt: 2 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        fullWidth
                        component={Link}
                        to={`/parent/match/${match._id}`}
                      >
                        View Details
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
  
  // Add a retry button component to refresh data
  const RetryButton = () => (
    <Button 
      variant="contained" 
      color="primary" 
      onClick={() => {
        setError(null);
        fetchParentData();
      }}
      sx={{ mt: 2 }}
    >
      Retry Connection
    </Button>
  );
  
  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4, 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          backgroundImage: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.background.paper, 0.1)})`,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Parent Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your child's training schedule and match details
          </Typography>
        </Box>
        <Box sx={{ mt: { xs: 2, sm: 0 }, minWidth: 200 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="child-select-label">Select Child</InputLabel>
            <Select
              labelId="child-select-label"
              id="child-select"
              value={selectedChild}
              label="Select Child"
              onChange={handleChildChange}
              sx={{ bgcolor: 'background.paper' }}
            >
              {children.map((child) => (
                <MenuItem key={child._id} value={child._id}>
                  {`${child.firstName} ${child.lastName}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>
      
      {/* Loading Indicator */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Tab Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="parent dashboard tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab 
                label="Training Schedule" 
                icon={<FitnessCenter />} 
                iconPosition="start"
              />
              <Tab 
                label="Training Plans" 
                icon={<Assignment />} 
                iconPosition="start"
              />
              <Tab 
                label="Upcoming Matches" 
                icon={<SportsScore />} 
                iconPosition="start"
              />
            </Tabs>
          </Box>
          
          {/* Tab Panels */}
          <Box sx={{ mt: 2 }}>
            {activeTab === 0 && renderTrainingScheduleTab()}
            {activeTab === 1 && renderTrainingPlansTab()}
            {activeTab === 2 && renderMatchesTab()}
          </Box>
        </>
      )}
      
      {/* Error message */}
      {error && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Error Loading Data
          </Typography>
          <Typography paragraph>
            {error}
          </Typography>
          <RetryButton />
        </Box>
      )}
    </Box>
  );
};

export default ParentDashboard; 