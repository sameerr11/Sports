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
  Clear,
  BarChart,
  DonutLarge
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../services/api';
import { getStoredUser, isParent } from '../../services/authService';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend
} from 'recharts';

// Create radar chart data for player skills
const createRadarData = (sport, sportData) => {
  if (!sportData) return [];
  
  return Object.entries(sportData)
    .filter(([key]) => key !== '_id') // Exclude _id field
    .map(([key, value]) => ({
      subject: key.charAt(0).toUpperCase() + key.slice(1),
      A: value,
      fullMark: 10,
    }));
};

// Create bar chart data for grades
const createBarData = (grades) => {
  if (!grades) return [];
  
  return Object.entries(grades)
    .filter(([key]) => key !== '_id') // Exclude _id field
    .map(([key, value]) => ({
      name: key === "improvement" || key === "nprovement" ? "Progress" : key.charAt(0).toUpperCase() + key.slice(1),
      value: value,
    }));
};

const ParentDashboard = () => {
  const theme = useTheme();
  const user = getStoredUser();
  const [activeTab, setActiveTab] = useState(0);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [childStats, setChildStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
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
        
        // 5. Fetch child stats
        fetchChildStats(childrenRes.data[0]._id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchParentData:', error);
      setError(error.toString());
      setLoading(false);
    }
  };
  
  // Fetch stats for the selected child
  const fetchChildStats = async (childId) => {
    if (!childId) return;
    
    setStatsLoading(true);
    try {
      const response = await retryApiCall(() => api.get(`/player-stats/player/${childId}`));
      setChildStats(response.data);
      setStatsLoading(false);
    } catch (error) {
      console.error('Error fetching child stats:', error);
      setStatsLoading(false);
    }
  };
  
  useEffect(() => {
    if (parentAccess) {
      fetchParentData();
    }
  }, [parentAccess]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
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
      
      // Fetch stats for the newly selected child
      fetchChildStats(childId);
      
      setLoading(false);
    } catch (error) {
      console.error('Error changing child:', error);
      setError(error.toString());
      setLoading(false);
    }
  };
  
  // Format location
  const formatLocation = (court) => {
    if (!court) return 'Location not specified';
    return `${court.name}, ${court.location || 'No specific location'}`;
  };
  
  // Format last updated date
  const formatLastUpdated = (dateString) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  
  // Handle date filter functions
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
  
  // Filter sessions based on selected date range
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
  
  const renderTrainingScheduleTab = () => {
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
  
  // Render the child stats tab
  const renderStatsTab = () => {
    const selectedChildName = children.find(child => child._id === selectedChild)?.firstName || 'Child';
    
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
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <BarChart sx={{ mr: 1 }} />
              {`${selectedChildName}'s Performance Statistics`}
            </Typography>
          </Paper>
          
          {statsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : childStats.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                Your child doesn't have any statistics recorded yet.
              </Typography>
            </Paper>
          ) : (
            childStats.map((stat) => (
              <Card 
                key={stat._id} 
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
                    bgcolor: theme.palette.primary.main
                  }
                }}
              >
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={stat.sportType} 
                        color="primary" 
                        size="small" 
                      />
                      <Typography variant="h6">
                        {stat.sportType} Statistics
                      </Typography>
                    </Box>
                  }
                  subheader={`Last Updated: ${formatLastUpdated(stat.updatedAt)}`}
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    {/* Physical Info */}
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ 
                        fontWeight: 'bold', 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <FitnessCenter fontSize="small" />
                        Physical Info
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: 1, 
                        background: alpha(theme.palette.primary.light, 0.05),
                        p: 1.5,
                        borderRadius: 1
                      }}>
                        <Typography variant="body2">
                          <strong>Height:</strong> {stat.common.height.value} {stat.common.height.unit}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Weight:</strong> {stat.common.weight.value} {stat.common.weight.unit}
                        </Typography>
                        {stat.common.notes && (
                          <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                            "{stat.common.notes}"
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    
                    {/* Performance Metrics - Radar Chart */}
                    <Grid item xs={12} md={5}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ 
                        fontWeight: 'bold',
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <DonutLarge fontSize="small" />
                        Performance Metrics
                      </Typography>
                      <Box sx={{ height: 220, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart 
                            outerRadius="80%" 
                            data={createRadarData(
                              stat.sportType.toLowerCase(), 
                              stat[stat.sportType.toLowerCase().replace(/\s+/g, '')]
                            )}
                          >
                            <PolarGrid strokeDasharray="3 3" />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis domain={[0, 10]} />
                            <Radar 
                              name="Skills" 
                              dataKey="A" 
                              stroke={theme.palette.primary.main} 
                              fill={theme.palette.primary.main} 
                              fillOpacity={0.6} 
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Grid>
                    
                    {/* Grades - Bar Chart */}
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ 
                        fontWeight: 'bold',
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <BarChart fontSize="small" />
                        Overall Grades
                      </Typography>
                      <Box sx={{ height: 220, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ReBarChart data={createBarData(stat.grades)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 10]} />
                            <YAxis dataKey="name" type="category" width={100} />
                            <ReTooltip />
                            <Bar dataKey="value" fill={theme.palette.secondary.main} barSize={20} />
                          </ReBarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))
          )}
        </Grid>
      </Grid>
    );
  };
  
  // If not a parent, show access denied
  if (!parentAccess) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center',
        p: 3
      }}>
        <Typography variant="h5" color="error" gutterBottom>
          Access Restricted
        </Typography>
        <Typography variant="body1">
          You need parent permissions to access the parent dashboard.
        </Typography>
      </Box>
    );
  }
  
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
            Track your child's training schedule, matches and performance
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
              <Tab 
                label="Child Stats" 
                icon={<BarChart />} 
                iconPosition="start"
              />
            </Tabs>
          </Box>
          
          {/* Tab Panels */}
          <Box sx={{ mt: 2 }}>
            {activeTab === 0 && renderTrainingScheduleTab()}
            {activeTab === 1 && renderTrainingPlansTab()}
            {activeTab === 2 && renderMatchesTab()}
            {activeTab === 3 && renderStatsTab()}
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