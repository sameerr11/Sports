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
  ClickAwayListener
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
  Event
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Link, useLocation } from 'react-router-dom';
import { 
  getCoachTeams, 
  getCoachTrainingPlans, 
  updateTrainingPlanStatus,
  getCoachTrainingSchedules,
  getCoachTrainingSessions
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
  const [isLoading, setIsLoading] = useState(true);
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
  
  // Custom event rendering for FullCalendar
  const renderEventContent = (eventInfo) => {
    return (
      <Box sx={{ 
        overflow: 'hidden', 
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 0.7,
        borderLeft: '4px solid',
        borderLeftColor: eventInfo.event.backgroundColor,
        bgcolor: alpha(eventInfo.event.backgroundColor, 0.1),
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
      }}>
        <Typography variant="body2" noWrap sx={{ 
          fontWeight: 600, 
          color: alpha(theme.palette.text.primary, 0.9),
          fontSize: eventInfo.view.type === 'dayGridMonth' ? '0.75rem' : '0.85rem'
        }}>
          {eventInfo.event.title}
        </Typography>
        {eventInfo.view.type !== 'dayGridMonth' && (
          <>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mt: 0.5,
              p: 0.7,
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              borderRadius: '4px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}>
              <LocationOn fontSize="small" sx={{ 
                fontSize: '0.8rem', 
                mr: 0.7, 
                color: theme.palette.primary.main,
                minWidth: 18
              }} />
              <Typography variant="caption" noWrap sx={{ 
                color: theme.palette.text.primary,
                fontWeight: 600,
                fontSize: '0.75rem'
              }}>
                {eventInfo.event.extendedProps.location}
              </Typography>
            </Box>
            <Box sx={{ mt: 0.7, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Chip 
                size="small"
                label={eventInfo.event.extendedProps.status}
                sx={{ 
                  fontSize: '0.65rem', 
                  height: 20, 
                  maxWidth: '100%',
                  bgcolor: eventInfo.event.backgroundColor,
                  color: '#fff',
                  fontWeight: 600
                }}
              />
            </Box>
          </>
        )}
      </Box>
    );
  };
  
  useEffect(() => {
    const fetchCoachData = async () => {
      setIsLoading(true);
      try {
        // Fetch teams where the user is a coach
        const teamsData = await getCoachTeams();
        console.log('Coach teams:', teamsData);
        setCoachTeams(teamsData);
        
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
  };
  
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateTrainingPlanStatus(id, newStatus);
      
      // Update both trainingPlans and trainingSchedules states
      setTrainingPlans(prevPlans => 
        prevPlans.map(plan => 
          plan._id === id ? { ...plan, status: newStatus } : plan
        )
      );
      
      // Also update training schedules
      setTrainingSchedules(prevSchedules => 
        prevSchedules.map(schedule => 
          schedule._id === id ? { ...schedule, status: newStatus } : schedule
        )
      );
    } catch (error) {
      console.error('Error updating training plan status:', error);
    }
  };
  
  // Get team players count
  const getTeamPlayersCount = (team) => {
    return team.players ? team.players.length : 0;
  };
  
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
  
  // Format location for training sessions
  const formatLocation = (court) => {
    if (!court) return 'Location not specified';
    
    // If court is an ID string
    if (typeof court === 'string') {
      return 'Court: ' + court; // Just show the ID if we only have the string
    }
    
    // If court is an object with _id only
    if (court._id && !court.name) {
      return 'Court ID: ' + court._id;
    }
    
    // If court has name and location
    if (court.name) {
      return `${court.name}${court.location ? `, ${court.location}` : ''}`;
    }
    
    // Handle more deeply nested court object
    if (court.court && court.court.name) {
      return `${court.court.name}${court.court.location ? `, ${court.court.location}` : ''}`;
    }
    
    return 'Location details unavailable';
  };
  
  // Convert training sessions to calendar events
  const convertToCalendarEvents = () => {
    const events = [];
    
    // Add booking-based training sessions
    trainingSessions
      .filter(session => session.startTime && session.endTime)
      .forEach(session => {
        try {
          const teamName = session.team && session.team.name ? session.team.name : 'Personal Training';
          const location = formatLocation(session.court);
          
          // Define colors with better contrast and visibility
          const statusColors = {
            Confirmed: {
              bg: '#2e7d32', // darker green
              border: '#1b5e20'
            },
            Pending: {
              bg: '#ed6c02', // darker orange
              border: '#c24e00'
            },
            Cancelled: {
              bg: '#d32f2f', // darker red
              border: '#b71c1c'
            },
            Default: {
              bg: '#757575',
              border: '#616161'
            }
          };
          
          const color = session.status === 'Confirmed' ? statusColors.Confirmed.bg : 
                        session.status === 'Pending' ? statusColors.Pending.bg : 
                        session.status === 'Cancelled' ? statusColors.Cancelled.bg : 
                        statusColors.Default.bg;
          
          events.push({
            id: `session-${session._id}`,
            title: `${teamName} - Training Session`,
            start: new Date(session.startTime),
            end: new Date(session.endTime),
            location: location,
            status: session.status,
            type: 'session',
            color: color,
            textColor: '#fff',
            borderColor: color,
            extendedProps: {
              location: location,
              status: session.status,
              teamName: teamName,
              durationHours: ((new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60 * 60)).toFixed(1),
              paymentStatus: session.paymentStatus || 'Not specified',
              purpose: session.purpose || 'Training',
              notes: session.notes || 'No additional notes'
            }
          });
        } catch (err) {
          console.error('Error converting session to event:', err, session);
        }
      });
    
    // Add training plans
    trainingSchedules
      .filter(schedule => schedule.date)
      .forEach(schedule => {
        try {
          // Make sure we have a team name
          let teamName = 'Basketball Team';
          if (schedule.team) {
            if (typeof schedule.team === 'object' && schedule.team.name) {
              teamName = schedule.team.name;
            } else if (typeof schedule.team === 'string') {
              // Try to find the team in coachTeams
              const team = coachTeams.find(t => t._id === schedule.team);
              if (team) {
                teamName = team.name;
              }
            }
          }
          
          const scheduleDate = new Date(schedule.date);
          const endDate = new Date(scheduleDate);
          
          // Check if schedule has a title, use a default if not
          const title = schedule.title || 'Training Session';
          
          // Assume duration is in minutes and add to end date
          endDate.setMinutes(scheduleDate.getMinutes() + (schedule.duration || 60));
          
          // Debug logging for court information
          console.log('Schedule data for location:', {
            id: schedule._id,
            title: schedule.title,
            scheduleId: schedule.scheduleId,
            court: schedule.court
          });
          
          // Get location from schedule if it exists
          let location = 'Basketball Court'; // Default to a fixed court name for now
          
          // Check if there's a populated scheduleId (booking reference)
          if (schedule.scheduleId && typeof schedule.scheduleId === 'object') {
            console.log('Schedule has populated scheduleId object:', schedule.scheduleId);
            if (schedule.scheduleId.court) {
              // If the court object is populated directly
              location = formatLocation(schedule.scheduleId.court);
              console.log('Using court from scheduleId:', schedule.scheduleId.court);
            }
          } 
          // Check if we have a court directly on the plan
          else if (schedule.court) {
            location = formatLocation(schedule.court);
            console.log('Using court directly from schedule:', schedule.court);
          }
          
          console.log('Final location for event:', location);
          
          // Set color based on status with better contrast
          let color;
          switch(schedule.status) {
            case 'Draft': color = '#616161'; break; // darker gray
            case 'Assigned': color = '#1976d2'; break; // darker blue
            case 'InProgress': color = '#ed6c02'; break; // darker orange
            case 'Completed': color = '#2e7d32'; break; // darker green
            default: color = '#616161'; // darker gray
          }
          
          events.push({
            id: `plan-${schedule._id}`,
            title: `${teamName} - ${title}`,
            start: scheduleDate,
            end: endDate,
            location: location,
            status: schedule.status,
            type: 'plan',
            color: color,
            textColor: '#fff',
            borderColor: color,
            extendedProps: {
              location: location,
              status: schedule.status,
              teamName: teamName,
              durationHours: (schedule.duration / 60).toFixed(1),
              description: schedule.description || 'No description provided',
              activitiesCount: schedule.activities ? schedule.activities.length : 0,
              createdBy: schedule.createdBy ? 
                (typeof schedule.createdBy === 'object' ? 
                  `${schedule.createdBy.firstName} ${schedule.createdBy.lastName}` : 
                  'Coach') : 
                'Coach',
              notes: schedule.notes || 'No additional notes',
              courtDetails: schedule.court || schedule.scheduleId?.court || { name: 'Basketball Court' }
            }
          });
        } catch (err) {
          console.error('Error converting schedule to event:', err, schedule);
        }
      });
    
    return events;
  };
  
  // Remove the mouse movement useEffect and update handleEventMouseEnter
  useEffect(() => {
    // We no longer need a mousemove handler since tooltip will be positioned above the event
    return () => {};
  }, [showTooltip]);
  
  // Update the handleEventMouseEnter function
  const handleEventMouseEnter = (info) => {
    setHoveredEvent(info.event);
    
    // Calculate position based on the event element
    const rect = info.el.getBoundingClientRect();
    
    if (tooltipRef.current) {
      const tooltipWidth = 300; // Our max-width from styles
      
      // Initial positioning - center above the event
      let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
      let top = rect.top - 10;
      
      // Check if tooltip would go off screen to the left
      if (left < 10) {
        left = 10;
      }
      
      // Check if tooltip would go off screen to the right
      const windowWidth = window.innerWidth;
      if (left + tooltipWidth > windowWidth - 10) {
        left = windowWidth - tooltipWidth - 10;
      }
      
      // Apply the positioning
      tooltipRef.current.style.left = `${left}px`;
      tooltipRef.current.style.top = `${top}px`;
      tooltipRef.current.style.transform = 'translateY(-100%)';
    }
    
    setShowTooltip(true);
  };
  
  // Add the missing handleEventClick function
  const handleEventClick = (clickInfo) => {
    // Navigate to appropriate detail page based on event type
    const eventId = clickInfo.event.id;
    
    if (eventId.startsWith('plan-')) {
      // Extract the plan ID (remove 'plan-' prefix)
      const planId = eventId.substring(5);
      // Navigate to training plan details
      window.location.href = `/training-plans/${planId}`;
    } else if (eventId.startsWith('session-')) {
      // For training sessions, we could navigate to a session details page
      // or handle in another appropriate way
      console.log('Session clicked:', clickInfo.event);
    }
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
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {team.description || 'No description provided'}
                  </Typography>
                  <Chip 
                    icon={<People />} 
                    label={`${getTeamPlayersCount(team)} Players`}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
                
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Team Players
                </Typography>
                
                <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
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
            <Typography>You are not assigned to any teams yet.</Typography>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
  
  // Add this inside the CoachDashboard component, right after state declarations
  const tooltipRef = useRef(null);
  
  // Update the renderSchedulesTab function to remove the useEffect hook
  const renderSchedulesTab = () => {
    const refreshSchedules = async () => {
      try {
        setIsLoading(true);
        
        // Refresh both training plans and booking-based sessions
        const [schedulesData, sessionsData] = await Promise.all([
          getCoachTrainingSchedules(),
          getCoachTrainingSessions()
        ]);
        
        console.log('Refreshed training schedules:', schedulesData);
        console.log('Refreshed training sessions:', sessionsData);
        
        setTrainingSchedules(schedulesData);
        setTrainingSessions(sessionsData);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error refreshing training data:', error);
        setError('Failed to refresh training data. Please try again.');
        setIsLoading(false);
      }
    };
    
    return (
      <Grid container spacing={3}>
        {isLoading ? (
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Grid>
        ) : (
          <>
            <Grid item xs={12}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2.5, 
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.light, 0.1),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold', 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: theme.palette.primary.dark
                  }}>
                    {coachTeams.length > 0 ?
                      React.cloneElement(getSportIcon(coachTeams[0]?.sportType || 'Sports'), { 
                        sx: { mr: 1.5, fontSize: '1.8rem', color: theme.palette.primary.main } 
                      }) :
                      <FitnessCenter sx={{ mr: 1.5, fontSize: '1.8rem', color: theme.palette.primary.main }} />
                    }
                    Training Schedule Calendar
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8, ml: 0.5 }}>
                    View all your training sessions and plans in a calendar view
                  </Typography>
                </Box>
                <Button 
                  variant="contained" 
                  size="medium"
                  color="primary"
                  onClick={refreshSchedules}
                  disabled={isLoading}
                  startIcon={<CalendarMonth />}
                  sx={{ 
                    px: 2.5, 
                    py: 1, 
                    borderRadius: 1.5,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    fontWeight: 500
                  }}
                >
                  Refresh Calendar
                </Button>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <CalendarLegend />
            </Grid>

            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ 
                p: 2, 
                borderRadius: 2, 
                height: '650px',
                ...calendarStyles,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  events={convertToCalendarEvents()}
                  eventClick={handleEventClick}
                  eventMouseEnter={handleEventMouseEnter}
                  eventMouseLeave={() => setShowTooltip(false)}
                  height="600px"
                  eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    meridiem: 'short'
                  }}
                  eventContent={renderEventContent}
                  slotLabelFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }}
                  dayHeaderFormat={{
                    weekday: 'short',
                    month: 'numeric',
                    day: 'numeric',
                    omitCommas: true
                  }}
                  allDaySlot={true}
                  allDayText="All Day"
                  slotMinTime="06:00:00"
                  slotMaxTime="22:00:00"
                  nowIndicator={true}
                  stickyHeaderDates={true}
                  dayMaxEvents={3}
                  eventMaxStack={3}
                  expandRows={true}
                  contentHeight="auto"
                  handleWindowResize={true}
                  views={{
                    timeGridWeek: {
                      dayHeaderFormat: { weekday: 'short', month: 'numeric', day: 'numeric', omitCommas: true },
                      slotDuration: '01:00:00',
                      slotLabelInterval: '01:00:00'
                    },
                    dayGridMonth: {
                      dayMaxEvents: 3,
                      fixedWeekCount: false
                    },
                    timeGridDay: {
                      dayHeaderFormat: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
                    }
                  }}
                  businessHours={{
                    daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
                    startTime: '08:00',
                    endTime: '20:00',
                  }}
                  themeSystem="standard"
                  firstDay={1} // Start calendar from Monday
                  buttonText={{
                    today: 'Today',
                    month: 'Month',
                    week: 'Week',
                    day: 'Day'
                  }}
                  slotLabelClassNames="slot-label"
                  dayHeaderClassNames="day-header"
                  dayMaxEventRows={true}
                  slotEventOverlap={false}
                  eventDisplay="block"
                  slotDuration="01:00:00"
                  slotLabelInterval="01:00:00"
                  scrollTimeReset={false}
                  scrollTime="08:00:00"
                  weekNumbers={false}
                  weekText="W"
                  weekNumberFormat={{ week: 'numeric' }}
                  fixedWeekCount={false}
                  showNonCurrentDates={false}
                />
                <div 
                  ref={tooltipRef}
                  style={{
                    ...styles.tooltip,
                    ...(showTooltip && hoveredEvent ? styles.visible : styles.hidden),
                    borderLeft: hoveredEvent ? `4px solid ${hoveredEvent.backgroundColor}` : 'none'
                  }}
                >
                  {hoveredEvent && (
                    <>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {hoveredEvent.title}
                      </Typography>
                      
                      <Chip 
                        label={hoveredEvent.extendedProps.status}
                        size="small"
                        sx={{ 
                          mb: 1.5, 
                          bgcolor: hoveredEvent.backgroundColor,
                          color: 'white', 
                          fontWeight: 'bold',
                          fontSize: '0.7rem'
                        }}
                      />
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <CalendarMonth sx={{ fontSize: '0.9rem', mr: 0.5, color: 'text.secondary' }} />
                          {format(hoveredEvent.start, 'EEE, MMM d')} • {format(hoveredEvent.start, 'h:mm a')} - {format(hoveredEvent.end, 'h:mm a')}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <LocationOn sx={{ fontSize: '0.9rem', mr: 0.5, color: 'text.secondary' }} />
                          {hoveredEvent.extendedProps.location}
                        </Typography>
                        
                        {hoveredEvent.extendedProps.description && (
                          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', fontSize: '0.8rem' }}>
                            {hoveredEvent.extendedProps.description.length > 100 ? 
                              hoveredEvent.extendedProps.description.substring(0, 100) + '...' : 
                              hoveredEvent.extendedProps.description}
                          </Typography>
                        )}
                      </Box>
                    </>
                  )}
                </div>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
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
          Manage your teams, schedules, and training plans
        </Typography>
      </Box>
      
      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="coach dashboard tabs"
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