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
  alpha
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
  PeopleAlt
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
  
  // Render training schedules tab
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
    
    // Format location for training sessions
    const formatLocation = (court) => {
      if (!court) return 'Location not specified';
      return `${court.name}${court.location ? `, ${court.location}` : ''}`;
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
                p: 2, 
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.light, 0.1),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                {coachTeams.length > 0 ?
                  React.cloneElement(getSportIcon(coachTeams[0]?.sportType || 'Sports'), { sx: { mr: 1 } }) :
                  <FitnessCenter sx={{ mr: 1 }} />
                }
                Upcoming Training Sessions
              </Typography>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  {coachTeams.length > 0 ?
                    React.cloneElement(getSportIcon(coachTeams[0]?.sportType || 'Sports'), { sx: { mr: 1 } }) :
                    <FitnessCenter sx={{ mr: 1 }} />
                  }
                  Upcoming Training Sessions (From Bookings)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  This section shows only direct training bookings not assigned to any training plan
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                size="small"
                onClick={refreshSchedules}
                disabled={isLoading}
              >
                Refresh Schedules
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Team</TableCell>
                    <TableCell>Title/Purpose</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {console.log('Rendering sessions:', trainingSessions)}
                  {console.log('Rendering schedules:', trainingSchedules)}
                  
                  {(trainingSessions.length > 0 || (trainingSchedules && trainingSchedules.length > 0)) ? (
                    <>
                      {/* Display booking-based training sessions */}
                      {trainingSessions.filter(session => new Date(session.startTime) >= new Date())
                        .map(session => {
                          try {
                            const startTime = new Date(session.startTime);
                            const endTime = new Date(session.endTime);
                            const durationHours = (endTime - startTime) / (1000 * 60 * 60);
                            const teamName = session.team && session.team.name ? session.team.name : 'Personal Training';
                            
                            return (
                              <TableRow key={`session-${session._id}`} hover>
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
                                <TableCell>{teamName}</TableCell>
                                <TableCell>Training Session</TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LocationOn fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                    {formatLocation(session.court)}
                                  </Box>
                                </TableCell>
                                <TableCell>{Math.round(durationHours * 10) / 10} hours</TableCell>
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
                          } catch (err) {
                            console.error('Error rendering session row:', err, session);
                            return null;
                          }
                        })}
                      
                      {/* Display training plans */}
                      {trainingSchedules && trainingSchedules.filter(schedule => {
                        try {
                          const scheduleDate = new Date(schedule.date);
                          return scheduleDate >= new Date();
                        } catch (err) {
                          console.error('Error filtering schedule:', err, schedule);
                          return false;
                        }
                      })
                      .map(schedule => {
                        try {
                          const teamName = schedule.team && schedule.team.name ? schedule.team.name : 'Unknown Team';
                          // Calculate duration in hours for consistency with sessions
                          const durationHours = schedule.duration / 60;
                          
                          return (
                            <TableRow key={`plan-${schedule._id}`} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <Typography variant="body2" fontWeight={500}>
                                    {format(new Date(schedule.date), 'EEEE, MMMM d, yyyy')}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {format(new Date(schedule.date), 'h:mm a')}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>{teamName}</TableCell>
                              <TableCell>{schedule.title}</TableCell>
                              <TableCell>Not specified</TableCell>
                              <TableCell>{Math.round(durationHours * 10) / 10} hours</TableCell>
                              <TableCell>
                                <Chip 
                                  icon={getStatusIcon(schedule.status)}
                                  label={schedule.status}
                                  color={getStatusColor(schedule.status)}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        } catch (err) {
                          console.error('Error rendering schedule row:', err, schedule);
                          return null;
                        }
                      })}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No upcoming training sessions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
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