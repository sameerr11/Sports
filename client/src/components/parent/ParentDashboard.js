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
  
  useEffect(() => {
    const fetchParentData = async () => {
      setLoading(true);
      try {
        // 1. Fetch children associated with the parent
        const childrenRes = await api.get('/users/parent/children');
        setChildren(childrenRes.data);
        
        // Set the first child as selected by default if available
        if (childrenRes.data.length > 0) {
          setSelectedChild(childrenRes.data[0]._id);
          
          // 2. Fetch teams where the selected child is a player
          const teamsRes = await api.get(`/teams/player/${childrenRes.data[0]._id}`);
          const teamIds = teamsRes.data.map(team => team._id);
          
          // 3. Fetch bookings related to child's teams
          let teamBookings = [];
          if (teamIds.length > 0) {
            const bookingsPromises = teamIds.map(teamId => 
              api.get('/bookings', { 
                params: { team: teamId } 
              })
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
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching parent data:', error);
        setError(error.toString());
        setLoading(false);
      }
    };
    
    fetchParentData();
  }, []);
  
  // Handle child selection change
  const handleChildChange = async (event) => {
    const childId = event.target.value;
    setSelectedChild(childId);
    setLoading(true);
    
    try {
      // Fetch data for the selected child
      const teamsRes = await api.get(`/teams/player/${childId}`);
      const teamIds = teamsRes.data.map(team => team._id);
      
      // Fetch bookings related to child's teams
      let teamBookings = [];
      if (teamIds.length > 0) {
        const bookingsPromises = teamIds.map(teamId => 
          api.get('/bookings', { 
            params: { team: teamId } 
          })
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
      <Box>
        <Card elevation={2}>
          <CardHeader 
            title="Training Schedule" 
            titleTypographyProps={{ variant: 'h6' }}
            action={
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<FilterAlt />}
                onClick={handleOpenDateFilter}
              >
                {isFilterActive ? 'Change Date Filter' : 'Filter by Date'}
              </Button>
            }
          />
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
          <CardContent>
            {filteredSessions.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                {isFilterActive 
                  ? 'No training sessions found within the selected date range.' 
                  : 'No upcoming training sessions scheduled.'}
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Team</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSessions.map((session) => (
                      <TableRow key={session._id}>
                        <TableCell>
                          {format(new Date(session.startTime), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
                        </TableCell>
                        <TableCell>{formatLocation(session.court)}</TableCell>
                        <TableCell>
                          {session.team ? session.team.name : 'Personal Training'}
                        </TableCell>
                        <TableCell>{session.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
        
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
      </Box>
    );
  };
  
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
                label="Upcoming Matches" 
                icon={<SportsScore />} 
                iconPosition="start"
              />
            </Tabs>
          </Box>
          
          {/* Tab Panels */}
          <Box sx={{ mt: 2 }}>
            {activeTab === 0 && renderTrainingScheduleTab()}
            {activeTab === 1 && renderMatchesTab()}
          </Box>
        </>
      )}
      
      {/* Error message */}
      {error && (
        <Box sx={{ mt: 3 }}>
          <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.1) }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ParentDashboard; 