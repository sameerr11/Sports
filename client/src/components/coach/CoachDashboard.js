import React, { useState, useEffect, useRef } from 'react';
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
  Avatar,
  Divider,
  Chip,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Switch,
  Popper,
  Fade,
  ClickAwayListener,
  MenuItem,
  Select,
  InputLabel
} from '@mui/material';
import { 
  People, 
  Person, 
  CalendarMonth, 
  SportsHandball, 
  Visibility, 
  Check, 
  Assignment,
  SportsSoccer,
  FitnessCenter,
  Schedule,
  PlayArrow,
  Done,
  LocationOn,
  Sports,
  DirectionsRun,
  AccessTime,
  PeopleAlt,
  FilterAlt,
  Clear,
  Event,
  BarChart,
  DonutLarge
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Link, useLocation } from 'react-router-dom';
import { 
  getCoachTeams, 
  getCoachTrainingPlans, 
  updateTrainingPlanStatus,
  getCoachTrainingSchedules,
  getCoachTrainingSessions,
  getTeamPlayerStats
} from '../../services/trainingService';
import { getStoredUser, isCoach } from '../../services/authService';
import { getSportIcon } from '../../utils/sportIcons';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

// Import FullCalendar components
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Import charts components
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

// Update calendarStyles with more customizations
const calendarStyles = {
  '.fc': {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  '.fc .fc-timegrid-slot-label': {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: alpha('#000', 0.75),
    padding: '2px 8px',
  },
  '.fc .fc-col-header-cell-cushion': {
    fontWeight: 600,
    padding: '8px 4px',
    color: alpha('#000', 0.85),
  },
  '.fc-theme-standard .fc-scrollgrid': {
    border: `1px solid ${alpha('#000', 0.1)}`,
    borderRadius: '4px',
    overflow: 'hidden',
  },
  '.fc .fc-timegrid-slot': {
    height: '50px',
    borderColor: alpha('#000', 0.07),
  },
  '.fc .fc-toolbar-title': {
    fontSize: '1.3rem',
    fontWeight: 600,
    color: alpha('#000', 0.85),
  },
  '.fc .fc-button': {
    padding: '6px 12px',
    textTransform: 'capitalize',
    fontWeight: 500,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderRadius: '4px',
    margin: '0 3px',
  },
  '.fc .fc-button-primary': {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  '.fc .fc-button-primary:not(:disabled):hover': {
    backgroundColor: '#1565c0',
    borderColor: '#1565c0',
  },
  '.fc .fc-today-button': {
    textTransform: 'capitalize',
  },
  '.fc .fc-col-header': {
    backgroundColor: alpha('#f5f5f5', 0.5),
  },
  '.fc-day-today': {
    backgroundColor: alpha('#bbdefb', 0.3) + ' !important',
  },
  '.fc-theme-standard td, .fc-theme-standard th': {
    borderColor: alpha('#000', 0.08),
  },
  '.fc-timegrid-now-indicator-line': {
    borderColor: '#f44336',
    borderWidth: '2px',
  },
  '.fc-timegrid-now-indicator-arrow': {
    borderColor: '#f44336',
  },
  '.fc-event': {
    borderRadius: '4px',
    margin: '1px 2px',
    border: 'none',
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  },
  '.fc-h-event': {
    backgroundColor: 'transparent',
  },
  '.fc-v-event': {
    borderLeft: '4px solid',
    backgroundColor: 'transparent',
  },
  '.fc-daygrid-event': {
    borderRadius: '4px',
    padding: '1px 3px',
  },
  '.fc-daygrid-day-number': {
    fontSize: '0.9rem',
    padding: '5px 10px',
    fontWeight: 500,
  },
  '.fc-daygrid-day.fc-day-today': {
    backgroundColor: alpha('#bbdefb', 0.3) + ' !important',
  },
  '.fc .fc-non-business': {
    backgroundColor: alpha('#f5f5f5', 0.4),
  },
  '.fc-timegrid-axis': {
    padding: '8px',
    fontWeight: 500,
  },
  '.fc-day-header': {
    padding: '8px 0',
    fontWeight: 600,
  },
  '.fc-direction-ltr .fc-daygrid-event.fc-event-end': {
    marginRight: '2px',
  },
  '.fc-direction-ltr .fc-daygrid-event.fc-event-start': {
    marginLeft: '2px',
  },
  '.fc-timegrid-slot-lane:hover': {
    backgroundColor: alpha('#f5f5f5', 0.5),
  },
  '.fc .fc-more-link': {
    fontWeight: 500,
    color: '#1976d2',
  },
};

// Add this component to show a legend for different event types
const CalendarLegend = () => {
  const theme = useTheme();
  
  const legendItems = [
    { label: 'Confirmed Session', color: '#2e7d32' },
    { label: 'Pending Session', color: '#ed6c02' },
    { label: 'Cancelled Session', color: '#d32f2f' },
    { label: 'Draft Plan', color: '#616161' },
    { label: 'Assigned Plan', color: '#1976d2' },
    { label: 'In Progress Plan', color: '#ed6c02' },
    { label: 'Completed Plan', color: '#2e7d32' },
  ];
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 1.5, 
        borderRadius: 2, 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: 1.5,
        bgcolor: alpha(theme.palette.grey[100], 0.7),
        border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
        mb: 2
      }}
    >
      {legendItems.map((item) => (
        <Box 
          key={item.label} 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            mr: 1 
          }}
        >
          <Box 
            sx={{ 
              width: 12, 
              height: 12, 
              borderRadius: '50%', 
              bgcolor: item.color, 
              mr: 0.75,
              border: `1px solid ${alpha(item.color, 0.5)}`
            }} 
          />
          <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
};

// Update the tooltip styles
const styles = {
  tooltip: {
    position: 'absolute',
    zIndex: 9999,
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    padding: '12px',
    maxWidth: '300px',
    transition: 'opacity 0.2s, visibility 0.2s',
    pointerEvents: 'none', // So it doesn't interfere with clicks
  },
  hidden: {
    opacity: 0,
    visibility: 'hidden',
  },
  visible: {
    opacity: 1,
    visibility: 'visible',
  }
};

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

const CoachDashboard = () => {
  const theme = useTheme();
  const user = getStoredUser();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam ? parseInt(tabParam, 10) : 0);
  const [coachTeams, setCoachTeams] = useState([]);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [trainingSchedules, setTrainingSchedules] = useState([]);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [teamPlayerStats, setTeamPlayerStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plansTab, setPlansTab] = useState(0);
  
  // Add state for tooltip functionality
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Add state for date range filter
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState(null);
  const [dateRangeEnd, setDateRangeEnd] = useState(null);
  const [singleDateFilter, setSingleDateFilter] = useState(null);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [filterMode, setFilterMode] = useState('range'); // 'range' or 'single'
  
  // Check if user is a coach
  const coach = isCoach();
  
  useEffect(() => {
    const fetchCoachData = async () => {
      setIsLoading(true);
      try {
        // Fetch teams where the user is a coach
        const teamsData = await getCoachTeams();
        console.log('Coach teams:', teamsData);
        setCoachTeams(teamsData);
        
        // Set the first team as selected by default if available
        if (teamsData.length > 0) {
          setSelectedTeam(teamsData[0]._id);
        }
        
        // Fetch training plans assigned to the coach
        const plansData = await getCoachTrainingPlans();
        console.log('Coach training plans:', plansData);
        setTrainingPlans(plansData);
        
        // Fetch all training schedules for the coach (assigned plans + team plans)
        const schedulesData = await getCoachTrainingSchedules();
        console.log('Coach training schedules (plans):', schedulesData);
        setTrainingSchedules(schedulesData);
        
        // Fetch training sessions from bookings
        const sessionsData = await getCoachTrainingSessions();
        console.log('Coach training sessions (bookings):', sessionsData);
        setTrainingSessions(sessionsData);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching coach data:', error);
        setError(error.toString());
        setIsLoading(false);
      }
    };
    
    if (coach) {
      fetchCoachData();
    }
  }, [coach]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // If team stats tab is selected and no team stats have been loaded yet, load them
    if (newValue === 3 && selectedTeam && !teamPlayerStats) {
      fetchTeamPlayerStats(selectedTeam);
    }
  };
  
  const handleTeamChange = (event) => {
    const teamId = event.target.value;
    setSelectedTeam(teamId);
    
    // Fetch stats for the selected team if we're on the team stats tab
    if (activeTab === 3) {
      fetchTeamPlayerStats(teamId);
    }
  };
  
  const fetchTeamPlayerStats = async (teamId) => {
    if (!teamId) return;
    
    setStatsLoading(true);
    try {
      const response = await getTeamPlayerStats(teamId);
      setTeamPlayerStats(response);
      setStatsLoading(false);
    } catch (error) {
      console.error('Error fetching team player stats:', error);
      setError('Failed to load player statistics. Please try again.');
      setStatsLoading(false);
    }
  };

  // Handle updating training plan status
  const handleUpdateStatus = async (planId, newStatus) => {
    try {
      await updateTrainingPlanStatus(planId, newStatus);
      
      // Update local state to reflect the change
      const updatedPlans = trainingPlans.map(plan => 
        plan._id === planId ? { ...plan, status: newStatus } : plan
      );
      
      setTrainingPlans(updatedPlans);
    } catch (error) {
      console.error('Error updating plan status:', error);
      setError('Failed to update plan status. Please try again.');
    }
  };

  // Format last updated date
  const formatLastUpdated = (dateString) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
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
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'Draft':
        return <Assignment />;
      case 'Assigned':
        return <Schedule />;
      case 'InProgress':
        return <PlayArrow />;
      case 'Completed':
        return <Done />;
      default:
        return <Assignment />;
    }
  };
  
  // Filter sessions based on selected date if filter is active
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
  
  // Render teams and players tab
  const renderTeamsTab = () => (
    <Grid container spacing={3}>
      {isLoading ? (
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Grid>
      ) : coachTeams.length > 0 ? (
        coachTeams.map(team => (
          <Grid item xs={12} md={6} key={team._id}>
            <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
              <CardHeader 
                title={team.name}
                subheader={`${team.sportType} - ${team.level || 'Not specified'}`}
                avatar={
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    {getSportIcon(team?.sportType || 'Sports')}
                  </Avatar>
                }
              />
              <Divider />
              <CardContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {team.description || 'No description provided'}
                </Typography>
                
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Team Players
                </Typography>
                
                <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                  {team.players && team.players.length > 0 ? (
                    team.players.map((playerObj, index) => {
                      // Add null check for player object
                      const playerData = playerObj && playerObj.player ? playerObj.player : {};
                      const playerId = playerData._id || `player-${index}`;
                      const firstName = playerData.firstName || 'Unknown';
                      const lastName = playerData.lastName || 'Player';
                      
                      return (
                        <React.Fragment key={playerId}>
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar>
                                <Person />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary={`${firstName} ${lastName}`}
                              secondary={playerObj.position || 'No position specified'}
                            />
                          </ListItem>
                          {index < team.players.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <ListItem>
                      <ListItemText primary="No players assigned to this team yet" />
                    </ListItem>
                  )}
                </List>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    component={Link}
                    to={`/teams/${team._id}`}
                    variant="outlined"
                    size="small"
                    startIcon={<Visibility />}
                  >
                    View Team Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))
      ) : (
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              You are not assigned as a coach to any teams yet.
            </Typography>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
  
  // Get upcoming training plans
  const getUpcomingPlans = () => {
    const today = new Date();
    return trainingPlans
      .filter(plan => new Date(plan.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };
  
  // Get training plans by status
  const getPlansByStatus = (status) => {
    return trainingPlans.filter(plan => plan.status === status);
  };
  
  // Get filtered plans based on selected tab
  const getFilteredPlans = () => {
    switch(plansTab) {
      case 0: // Upcoming
        return trainingPlans.filter(plan => 
          plan.status === 'Draft' || plan.status === 'Assigned'
        ).sort((a, b) => new Date(a.date) - new Date(b.date));
      case 1: // In Progress
        return trainingPlans.filter(plan => plan.status === 'InProgress');
      case 2: // Completed
        return trainingPlans.filter(plan => plan.status === 'Completed');
      default:
        return trainingPlans;
    }
  };
  
  // Render training schedules tab
  const renderSchedulesTab = () => {
    // Filter sessions if date filter is active
    const filteredSessions = filterSessionsByDate([...trainingSessions]);
    const filteredSchedules = [...trainingSchedules];
    
    return (
      <Box sx={{ mt: 2 }}>
        {/* Calendar view for schedules and sessions */}
        <Paper sx={{ mb: 3, p: 2, borderRadius: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: 2,
            gap: 1
          }}>
            <Typography variant="h6" component="h2">
              Training Schedule Calendar
            </Typography>
            
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<FilterAlt />}
              onClick={() => setDateFilterOpen(!dateFilterOpen)}
              color={isFilterActive ? "primary" : "inherit"}
            >
              {isFilterActive ? "Filter Active" : "Filter by Date"}
            </Button>
          </Box>
          
          {dateFilterOpen && (
            <Paper sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.background.paper, 0.6) }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl component="fieldset">
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={filterMode === 'range'} 
                          onChange={(e) => setFilterMode(e.target.checked ? 'range' : 'single')}
                        />
                      }
                      label="Date Range Filter"
                    />
                    <FormHelperText>Toggle between single date and date range</FormHelperText>
                  </FormControl>
                  
                  {filterMode === 'single' ? (
                    <DatePicker
                      label="Filter by date"
                      value={singleDateFilter}
                      onChange={(newDate) => setSingleDateFilter(newDate)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <DatePicker
                        label="Start date"
                        value={dateRangeStart}
                        onChange={(newDate) => setDateRangeStart(newDate)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                      <DatePicker
                        label="End date"
                        value={dateRangeEnd}
                        onChange={(newDate) => setDateRangeEnd(newDate)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<Clear />}
                      onClick={() => {
                        setDateRangeStart(null);
                        setDateRangeEnd(null);
                        setSingleDateFilter(null);
                        setIsFilterActive(false);
                      }}
                    >
                      Clear
                    </Button>
                    <Button 
                      variant="contained" 
                      startIcon={<Event />}
                      onClick={() => {
                        setIsFilterActive(true);
                        setDateFilterOpen(false);
                      }}
                      disabled={(filterMode === 'single' && !singleDateFilter) || 
                               (filterMode === 'range' && !dateRangeStart && !dateRangeEnd)}
                    >
                      Apply Filter
                    </Button>
                  </Box>
                </Box>
              </LocalizationProvider>
            </Paper>
          )}
          
          <CalendarLegend />
          
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={calendarStyles}>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                height="auto"
                eventTimeFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  meridiem: 'short'
                }}
                events={[
                  // Training sessions events
                  ...filteredSessions.map(session => ({
                    id: `session-${session._id}`,
                    title: `Training: ${session.purpose}`,
                    start: session.startTime,
                    end: session.endTime,
                    extendedProps: {
                      type: 'session',
                      court: session.court?.name || 'No court specified',
                      location: session.court?.location || 'No location',
                      teams: session.teams?.map(t => t.name || 'Unnamed team').join(', '),
                      status: session.status
                    },
                    backgroundColor: session.status === 'confirmed' ? '#2e7d32' : 
                                    session.status === 'pending' ? '#ed6c02' : 
                                    session.status === 'cancelled' ? '#d32f2f' : '#1976d2',
                    borderColor: 'transparent',
                  })),
                  
                  // Training plans/schedules events
                  ...filteredSchedules.map(plan => ({
                    id: `plan-${plan._id}`,
                    title: `Plan: ${plan.title}`,
                    start: plan.scheduleId?.startTime || plan.date,
                    end: plan.scheduleId?.endTime || null,
                    extendedProps: {
                      type: 'plan',
                      status: plan.status,
                      court: plan.court?.name || 'No court specified',
                      location: plan.court?.location || 'No location',
                      team: plan.team?.name || 'No team specified'
                    },
                    backgroundColor: plan.status === 'Draft' ? '#616161' : 
                                    plan.status === 'Assigned' ? '#1976d2' : 
                                    plan.status === 'InProgress' ? '#ed6c02' : 
                                    plan.status === 'Completed' ? '#2e7d32' : '#1976d2',
                    borderColor: 'transparent',
                  }))
                ]}
                eventClick={(info) => {
                  // Set hovered event when clicked
                  setHoveredEvent(info.event);
                  
                  // Redirect to appropriate page when event is clicked
                  if (info.event.extendedProps.type === 'plan') {
                    const planId = info.event.id.replace('plan-', '');
                    window.location.href = `/training-plans/${planId}`;
                  }
                }}
                eventMouseEnter={(info) => {
                  setHoveredEvent(info.event);
                  const rect = info.el.getBoundingClientRect();
                  setTooltipPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX
                  });
                  setShowTooltip(true);
                }}
                eventMouseLeave={(info) => {
                  setShowTooltip(false);
                }}
              />
            </Box>
          )}
          
          {/* Tooltip for event details */}
          <Box 
            sx={{ 
              ...styles.tooltip, 
              ...(showTooltip ? styles.visible : styles.hidden),
              top: tooltipPosition.top + 'px',
              left: tooltipPosition.left + 'px'
            }}
          >
            {hoveredEvent && (
              <>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {hoveredEvent.title}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <AccessTime sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {format(new Date(hoveredEvent.start), 'h:mm a')}
                    {hoveredEvent.end && ` - ${format(new Date(hoveredEvent.end), 'h:mm a')}`}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {hoveredEvent.extendedProps.court} ({hoveredEvent.extendedProps.location})
                  </Typography>
                </Box>
                
                {hoveredEvent.extendedProps.type === 'plan' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <People sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {hoveredEvent.extendedProps.team}
                    </Typography>
                  </Box>
                )}
                
                {hoveredEvent.extendedProps.type === 'session' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <People sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {hoveredEvent.extendedProps.teams || 'No teams specified'}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Chip 
                    label={hoveredEvent.extendedProps.status}
                    size="small"
                    color={
                      hoveredEvent.extendedProps.status === 'Draft' ? 'default' :
                      hoveredEvent.extendedProps.status === 'Assigned' || 
                      hoveredEvent.extendedProps.status === 'confirmed' ? 'primary' :
                      hoveredEvent.extendedProps.status === 'InProgress' || 
                      hoveredEvent.extendedProps.status === 'pending' ? 'warning' :
                      hoveredEvent.extendedProps.status === 'Completed' ? 'success' :
                      hoveredEvent.extendedProps.status === 'cancelled' ? 'error' : 'default'
                    }
                  />
                </Box>
              </>
            )}
          </Box>
        </Paper>
      </Box>
    );
  };
  
  // Render training plans tab
  const renderPlansTab = () => (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        Training Plans
      </Typography>
      
      {/* Plan status tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={plansTab} 
          onChange={(e, v) => setPlansTab(v)} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2, pt: 1 }}
        >
          <Tab label="Upcoming" />
          <Tab label="In Progress" />
          <Tab label="Completed" />
        </Tabs>
      </Paper>
      
      {/* Plans list */}
      {getFilteredPlans().length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No {plansTab === 0 ? 'upcoming' : plansTab === 1 ? 'in progress' : 'completed'} training plans.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {getFilteredPlans().map(plan => (
            <Grid item xs={12} md={6} lg={4} key={plan._id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title={
                    <Typography variant="h6" component="h3">
                      {plan.title}
                    </Typography>
                  }
                  subheader={
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <CalendarMonth sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(plan.date), 'PPP')}
                      </Typography>
                    </Box>
                  }
                  action={
                    <Chip 
                      label={plan.status}
                      color={getStatusColor(plan.status)}
                      size="small"
                      sx={{ mt: 1, mr: 1 }}
                    />
                  }
                />
                <Divider />
                <CardContent sx={{ pt: 1, pb: 1, flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {plan.description?.substring(0, 100)}
                    {plan.description?.length > 100 ? '...' : ''}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      <DirectionsRun sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      {plan.activities?.length || 0} activities
                    </Typography>
                    
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTime sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      {plan.duration} min
                    </Typography>
                  </Box>
                </CardContent>
                <Divider />
                <Box sx={{ display: 'flex', p: 1, bgcolor: 'background.default' }}>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    component={Link}
                    to={`/training-plans/${plan._id}`}
                    sx={{ flexGrow: 1 }}
                  >
                    Details
                  </Button>
                  
                  {plan.status === 'InProgress' && (
                    <Button
                      size="small"
                      startIcon={<PeopleAlt />}
                      component={Link}
                      to={`/training-plans/${plan._id}?tab=2`}
                      sx={{ flexGrow: 1 }}
                      color="primary"
                    >
                      Attendance
                    </Button>
                  )}
                  
                  {plan.status === 'Assigned' && (
                    <Button
                      size="small"
                      startIcon={<PlayArrow />}
                      color="primary"
                      onClick={() => handleUpdateStatus(plan._id, 'InProgress')}
                      sx={{ flexGrow: 1 }}
                    >
                      Start
                    </Button>
                  )}
                  
                  {plan.status === 'InProgress' && (
                    <Button
                      size="small"
                      startIcon={<Done />}
                      color="success"
                      onClick={() => handleUpdateStatus(plan._id, 'Completed')}
                      sx={{ flexGrow: 1 }}
                    >
                      Complete
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
  
  // New function to render the Team Player Stats tab
  const renderTeamStatsTab = () => {
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
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 2
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold', 
                display: 'flex', 
                alignItems: 'center', 
                color: theme.palette.primary.dark
              }}>
                <BarChart sx={{ mr: 1.5, fontSize: '1.8rem', color: theme.palette.primary.main }} />
                Team Player Performance Statistics
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8, ml: 0.5 }}>
                View performance metrics for players in your teams
              </Typography>
            </Box>
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Select Team</InputLabel>
              <Select
                value={selectedTeam}
                label="Select Team"
                onChange={handleTeamChange}
                disabled={coachTeams.length === 0}
              >
                {coachTeams.map(team => (
                  <MenuItem value={team._id} key={team._id}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
          
          {statsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : !selectedTeam ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                Please select a team to view player statistics.
              </Typography>
            </Paper>
          ) : !teamPlayerStats ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                No data available. Please select a team to view player statistics.
              </Typography>
            </Paper>
          ) : teamPlayerStats.playersWithStats.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                No players found in this team.
              </Typography>
            </Paper>
          ) : teamPlayerStats.playersWithStats.every(player => !player.stats || player.stats.length === 0) ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                No statistics have been recorded for any players in this team.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                component={Link}
                to="/player-stats"
                sx={{ mt: 2 }}
              >
                Add Player Statistics
              </Button>
            </Paper>
          ) : (
            teamPlayerStats.playersWithStats.map(player => {
              // Only render players that have stats
              if (!player.stats || player.stats.length === 0) return null;
              
              return (
                <Card 
                  key={player._id} 
                  sx={{ 
                    mb: 3, 
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 1.5, bgcolor: theme.palette.primary.main }}>
                          <Person />
                        </Avatar>
                        <Typography variant="h6">
                          {player.firstName} {player.lastName}
                        </Typography>
                      </Box>
                    }
                    subheader={player.email}
                  />
                  <Divider />
                  
                  {player.stats.map(stat => (
                    <Box key={stat._id} sx={{ p: 2 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2, 
                        pb: 1, 
                        borderBottom: `1px dashed ${alpha(theme.palette.divider, 0.5)}`
                      }}>
                        <Chip 
                          label={stat.sportType} 
                          color="primary" 
                          size="small" 
                          sx={{ mr: 1.5 }}
                        />
                        <Typography variant="subtitle1" fontWeight="medium">
                          {stat.sportType} Statistics
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ ml: 'auto' }}
                        >
                          Last Updated: {formatLastUpdated(stat.updatedAt)}
                        </Typography>
                      </Box>
                      
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
                      
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          component={Link}
                          to={`/player-stats`}
                          variant="outlined"
                          size="small"
                          startIcon={<BarChart />}
                          sx={{ mr: 1 }}
                        >
                          Manage Stats
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Card>
              );
            })
          )}
        </Grid>
      </Grid>
    );
  };
  
  // If not a coach, show access denied
  if (!coach) {
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
          You need coach permissions to access the coach dashboard.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Coach Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your teams, schedules, training plans and player statistics
        </Typography>
      </Box>
      
      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="coach dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="Teams & Players" 
            icon={<People />} 
            iconPosition="start"
          />
          <Tab 
            label="Training Schedules" 
            icon={<CalendarMonth />} 
            iconPosition="start"
          />
          <Tab 
            label="Training Plans" 
            icon={<Assignment />} 
            iconPosition="start"
          />
          <Tab 
            label="Team Player Stats" 
            icon={<BarChart />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      {/* Tab Panels */}
      <Box sx={{ mt: 2 }}>
        {activeTab === 0 && (() => {
          try {
            return renderTeamsTab();
          } catch (err) {
            console.error('Error rendering Teams tab:', err);
            return (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">There was an error loading the Teams & Players tab. Please try again later.</Typography>
              </Paper>
            );
          }
        })()}
        
        {activeTab === 1 && (() => {
          try {
            return renderSchedulesTab();
          } catch (err) {
            console.error('Error rendering Schedules tab:', err);
            return (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">There was an error loading the Training Schedules tab. Please try again later.</Typography>
              </Paper>
            );
          }
        })()}
        
        {activeTab === 2 && (() => {
          try {
            return renderPlansTab();
          } catch (err) {
            console.error('Error rendering Plans tab:', err);
            return (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">There was an error loading the Training Plans tab. Please try again later.</Typography>
              </Paper>
            );
          }
        })()}
        
        {activeTab === 3 && (() => {
          try {
            return renderTeamStatsTab();
          } catch (err) {
            console.error('Error rendering Team Player Stats tab:', err);
            return (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">There was an error loading the Team Player Stats tab. Please try again later.</Typography>
              </Paper>
            );
          }
        })()}
      </Box>
      
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

export default CoachDashboard; 