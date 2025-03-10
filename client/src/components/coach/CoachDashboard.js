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
  Done
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Link, useLocation } from 'react-router-dom';
import { getCoachTeams, getCoachTrainingPlans, updateTrainingPlanStatus } from '../../services/trainingService';
import { getStoredUser, isCoach } from '../../services/authService';

const CoachDashboard = () => {
  const theme = useTheme();
  const user = getStoredUser();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam ? parseInt(tabParam, 10) : 0);
  const [coachTeams, setCoachTeams] = useState([]);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if user is a coach
  const coach = isCoach();
  
  useEffect(() => {
    const fetchCoachData = async () => {
      setIsLoading(true);
      try {
        // Fetch teams where the user is a coach
        const teamsData = await getCoachTeams();
        setCoachTeams(teamsData);
        
        // Fetch training plans assigned to the coach
        const plansData = await getCoachTrainingPlans();
        setTrainingPlans(plansData);
        
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
      
      // Update local state
      setTrainingPlans(prevPlans => 
        prevPlans.map(plan => 
          plan._id === id ? { ...plan, status: newStatus } : plan
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
                    <SportsSoccer />
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
                    team.players.map((playerObj, index) => (
                      <React.Fragment key={playerObj.player._id || index}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar>
                              <Person />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={`${playerObj.player.firstName} ${playerObj.player.lastName}`}
                            secondary={playerObj.position || 'No position specified'}
                          />
                        </ListItem>
                        {index < team.players.length - 1 && <Divider variant="inset" component="li" />}
                      </React.Fragment>
                    ))
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
  const renderSchedulesTab = () => (
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
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <CalendarMonth sx={{ mr: 1 }} />
                Upcoming Training Sessions
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.background.default, 0.8) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Team</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getUpcomingPlans().length > 0 ? (
                    getUpcomingPlans().map(plan => (
                      <TableRow key={plan._id} hover>
                        <TableCell>
                          {format(new Date(plan.date), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>{plan.team.name}</TableCell>
                        <TableCell>{plan.title}</TableCell>
                        <TableCell>{plan.duration} minutes</TableCell>
                        <TableCell>
                          <Chip 
                            icon={getStatusIcon(plan.status)}
                            label={plan.status}
                            color={getStatusColor(plan.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {plan.status === 'Assigned' && (
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleUpdateStatus(plan._id, 'InProgress')}
                              title="Mark as In Progress"
                            >
                              <PlayArrow />
                            </IconButton>
                          )}
                          {plan.status === 'InProgress' && (
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleUpdateStatus(plan._id, 'Completed')}
                              title="Mark as Completed"
                            >
                              <Check />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
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
  
  // Render training plans tab
  const renderPlansTab = () => (
    <Grid container spacing={3}>
      {isLoading ? (
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Grid>
      ) : (
        <>
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
              <CardHeader 
                title="Assigned Plans"
                avatar={
                  <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                    <Assignment />
                  </Avatar>
                }
              />
              <CardContent>
                <List dense>
                  {getPlansByStatus('Assigned').length > 0 ? (
                    getPlansByStatus('Assigned').map(plan => (
                      <React.Fragment key={plan._id}>
                        <ListItem
                          secondaryAction={
                            <Box>
                              <IconButton 
                                edge="end" 
                                size="small"
                                onClick={() => handleUpdateStatus(plan._id, 'InProgress')}
                                sx={{ mr: 1 }}
                              >
                                <PlayArrow />
                              </IconButton>
                              <IconButton 
                                edge="end" 
                                size="small"
                                component={Link}
                                to={`/training-plans/${plan._id}`}
                              >
                                <Visibility />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                              <SportsHandball />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={plan.title}
                            secondary={
                              <React.Fragment>
                                <Typography variant="body2" component="span" color="text.primary">
                                  {plan.team.name}
                                </Typography>
                                {` - ${format(new Date(plan.date), 'MMM d, yyyy')}`}
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No assigned training plans" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
              <CardHeader 
                title="In Progress Plans"
                avatar={
                  <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                    <FitnessCenter />
                  </Avatar>
                }
              />
              <CardContent>
                <List dense>
                  {getPlansByStatus('InProgress').length > 0 ? (
                    getPlansByStatus('InProgress').map(plan => (
                      <React.Fragment key={plan._id}>
                        <ListItem
                          secondaryAction={
                            <Box>
                              <IconButton 
                                edge="end" 
                                size="small"
                                onClick={() => handleUpdateStatus(plan._id, 'Completed')}
                                sx={{ mr: 1 }}
                              >
                                <Check />
                              </IconButton>
                              <IconButton 
                                edge="end" 
                                size="small"
                                component={Link}
                                to={`/training-plans/${plan._id}`}
                              >
                                <Visibility />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: theme.palette.warning.light }}>
                              <SportsHandball />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={plan.title}
                            secondary={
                              <React.Fragment>
                                <Typography variant="body2" component="span" color="text.primary">
                                  {plan.team.name}
                                </Typography>
                                {` - ${format(new Date(plan.date), 'MMM d, yyyy')}`}
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No in-progress training plans" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} mt={3}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardHeader 
                title="Completed Plans"
                avatar={
                  <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                    <Done />
                  </Avatar>
                }
              />
              <CardContent>
                {getPlansByStatus('Completed').length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Title</TableCell>
                          <TableCell>Team</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getPlansByStatus('Completed').map(plan => (
                          <TableRow key={plan._id}>
                            <TableCell>{plan.title}</TableCell>
                            <TableCell>{plan.team.name}</TableCell>
                            <TableCell>{format(new Date(plan.date), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              <IconButton 
                                size="small"
                                component={Link}
                                to={`/training-plans/${plan._id}`}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
                    No completed training plans
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
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
        {activeTab === 0 && renderTeamsTab()}
        {activeTab === 1 && renderSchedulesTab()}
        {activeTab === 2 && renderPlansTab()}
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