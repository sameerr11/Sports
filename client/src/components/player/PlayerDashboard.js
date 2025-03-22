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
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Button,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link as MuiLink,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Switch
} from '@mui/material';
import { 
  Person, 
  CalendarMonth,
  SportsScore, 
  Assignment, 
  FitnessCenter, 
  LocationOn, 
  AccessTime, 
  ArrowForward,
  Sports,
  FilterAlt,
  Clear
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../services/api';
import { getStoredUser, isPlayerOnly } from '../../services/authService';
import { getSportIcon } from '../../utils/sportIcons';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const PlayerDashboard = () => {
  const theme = useTheme();
  const user = getStoredUser();
  const [activeTab, setActiveTab] = useState(0);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add state for date range filter
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState(null);
  const [dateRangeEnd, setDateRangeEnd] = useState(null);
  const [singleDateFilter, setSingleDateFilter] = useState(null);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [filterMode, setFilterMode] = useState('range'); // 'range' or 'single'
  
  // Check if user is a player
  const playerAccess = isPlayerOnly();
  
  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);
      try {
        // 1. Fetch teams where the user is a player
        const teamsRes = await api.get('/teams/player');
        setTeams(teamsRes.data);
        
        // Get team IDs for further queries
        const teamIds = teamsRes.data.map(team => team._id);
        
        // Fetch data for personal bookings
        const personalBookingsRes = await api.get('/bookings/me');
        const personalBookings = personalBookingsRes.data;
        
        // Fetch all team-related bookings
        let teamBookings = [];
        if (teamIds.length > 0) {
          // Fetch bookings for each team
          const bookingsPromises = teamIds.map(teamId => 
            api.get('/bookings', { 
              params: { team: teamId } 
            })
          );
          
          const bookingsResponses = await Promise.all(bookingsPromises);
          teamBookings = bookingsResponses.flatMap(res => res.data);
        }
        
        // Combine personal and team bookings and remove duplicates
        const allBookings = [...personalBookings, ...teamBookings];
        const uniqueBookings = Array.from(new Map(allBookings.map(booking => [booking._id, booking])).values());
        
        // Filter for training sessions and matches
        const trainingSessions = uniqueBookings.filter(
          booking => 
            booking.purpose === 'Training' && 
            new Date(booking.startTime) >= new Date() && 
            booking.status !== 'Cancelled'
        );
        setTrainingSessions(trainingSessions);
        
        // 3. Filter for upcoming matches
        const matchSessions = uniqueBookings.filter(
          booking => 
            booking.purpose === 'Match' && 
            new Date(booking.startTime) >= new Date() && 
            booking.status !== 'Cancelled'
        );
        setUpcomingMatches(matchSessions);
        
        // 4. Fetch training plans for player's teams
        if (teamIds.length > 0) {
          const trainingPlansPromises = teamIds.map(teamId => 
            api.get(`/training-plans/team/${teamId}`)
          );
          
          const trainingPlansResponses = await Promise.all(trainingPlansPromises);
          
          // Combine all training plans and filter for assigned or in progress
          const allPlans = trainingPlansResponses.flatMap(res => res.data)
            .filter(plan => ['Assigned', 'InProgress'].includes(plan.status));
          
          setTrainingPlans(allPlans);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching player data:', error);
        setError(error.toString());
        setLoading(false);
      }
    };
    
    if (playerAccess) {
      fetchPlayerData();
    }
  }, [playerAccess]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Format court location
  const formatLocation = (court) => {
    if (!court) return 'Location not specified';
    return `${court.name}, ${court.location || 'No specific location'}`;
  };
  
  // Render the teams tab
  const renderTeamsTab = () => (
    <Grid container spacing={3}>
      {teams.length === 0 ? (
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              You are not assigned to any teams yet.
            </Typography>
          </Paper>
        </Grid>
      ) : (
        teams.map(team => (
          <Grid item xs={12} md={6} key={team._id}>
            <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
              <CardHeader 
                title={team.name}
                subheader={`${team.sportType} - ${team.level || 'Not specified'}`}
                action={
                  <Chip 
                    label={team.players.length + ' Players'}
                    color="primary"
                    size="small"
                    icon={<Person />}
                  />
                }
              />
              <Divider />
              <CardContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {team.description || 'No description provided'}
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    component={Link}
                    to={`/teams/${team._id}`}
                    endIcon={<ArrowForward />}
                    size="small"
                    variant="outlined"
                  >
                    View Team Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))
      )}
    </Grid>
  );
  
  // Render the training schedule tab
  const renderTrainingScheduleTab = () => {
    // Get the default sport type from the first training session's team if available
    const defaultSportType = trainingSessions.length > 0 && trainingSessions[0].team 
      ? trainingSessions[0].team.sportType 
      : null;
    
    // Handle date filter related functions
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
              {defaultSportType ? 
                React.cloneElement(getSportIcon(defaultSportType), { sx: { mr: 1 } }) : 
                <Sports sx={{ mr: 1 }} />
              }
              Your Upcoming Training Sessions
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
                  : 'You have no upcoming training sessions scheduled.'}
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
  
  // Render the training plans tab
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
            Your Team Training Plans
          </Typography>
        </Paper>
        
        {trainingPlans.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              No training plans have been assigned to your teams yet.
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
  
  // Render the matches tab
  const renderMatchesTab = () => {
    // Get the default sport type from the first match's team if available
    const defaultSportType = upcomingMatches.length > 0 && upcomingMatches[0].team 
      ? upcomingMatches[0].team.sportType 
      : null;
      
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              mb: 3, 
              borderRadius: 2,
              bgcolor: alpha(theme.palette.secondary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              {defaultSportType ? 
                React.cloneElement(getSportIcon(defaultSportType), { sx: { mr: 1 } }) : 
                <SportsScore sx={{ mr: 1 }} />
              }
              Your Upcoming Matches
            </Typography>
          </Paper>
          
          {upcomingMatches.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                You have no upcoming matches scheduled.
              </Typography>
            </Paper>
          ) : (
            upcomingMatches.map(match => {
              const startTime = new Date(match.startTime);
              const endTime = new Date(match.endTime);
              
              return (
                <Card 
                  key={match._id} 
                  sx={{ 
                    mb: 3, 
                    borderRadius: 2,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[6]
                    }
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}>
                      <Typography variant="h6" component="div" fontWeight="bold">
                        {match.team ? match.team.name : 'No team specified'} Match
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary">
                        {format(startTime, 'EEEE, MMMM d, yyyy')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <AccessTime sx={{ mt: 0.5, mr: 1, color: theme.palette.text.secondary }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Time
                              </Typography>
                              <Typography variant="body1" fontWeight={500}>
                                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={8}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <LocationOn sx={{ mt: 0.5, mr: 1, color: theme.palette.text.secondary }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Location
                              </Typography>
                              <Typography variant="body1" fontWeight={500}>
                                {formatLocation(match.court)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      {match.notes && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Notes:
                          </Typography>
                          <Typography variant="body2">
                            {match.notes}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Grid>
      </Grid>
    );
  };
  
  // If not a player, show access denied
  if (!playerAccess) {
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
          You need player permissions to access the player dashboard.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundImage: `linear-gradient(to right, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.background.paper, 0.1)})`,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Player Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your training schedule, plans and upcoming matches
          </Typography>
        </Box>
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64,
            bgcolor: theme.palette.secondary.main
          }}
        >
          <Person sx={{ fontSize: 40 }} />
        </Avatar>
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
              aria-label="player dashboard tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab 
                label="My Teams" 
                icon={<Person />} 
                iconPosition="start"
              />
              <Tab 
                label="Training Schedule" 
                icon={<Sports />} 
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
            {activeTab === 0 && renderTeamsTab()}
            {activeTab === 1 && renderTrainingScheduleTab()}
            {activeTab === 2 && renderTrainingPlansTab()}
            {activeTab === 3 && renderMatchesTab()}
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

export default PlayerDashboard; 