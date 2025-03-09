import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, Typography, Grid, Box, Paper, Card, CardContent, 
  CardActions, Tabs, Tab, Divider, CircularProgress, Alert, Button,
  List, ListItem, ListItemText, ListItemIcon,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { 
  SportsSoccer, Event, EmojiEvents, Assessment, DirectionsRun,
  Alarm, CalendarToday, LocationOn, Person, Timeline, ChildCare,
  Check as CheckIcon
} from '@mui/icons-material';
import { getChildTrainings } from '../../services/trainingService';
import { getChildGames } from '../../services/gameService';
import { getChildProgress } from '../../services/progressService';
import { format } from 'date-fns';

// In a real app, you would fetch this from an API
const mockChildren = [
  { id: 'child1', name: 'Alex Smith', age: 12, team: 'Junior Eagles' },
  { id: 'child2', name: 'Jamie Smith', age: 14, team: 'Teen Tigers' }
];

const ParentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [games, setGames] = useState([]);
  const [progress, setProgress] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedChild, setSelectedChild] = useState('');

  useEffect(() => {
    // If we have a selected child and either no data or stale data for a different child, fetch data
    if (selectedChild) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        
        try {
          // Fetch child's training sessions
          const trainingData = await getChildTrainings(selectedChild);
          setTrainings(trainingData);

          // Fetch child's games
          const gameData = await getChildGames(selectedChild);
          setGames(gameData);

          // Fetch child's progress assessments
          try {
            const progressData = await getChildProgress(selectedChild);
            setProgress(progressData);
          } catch (progressError) {
            // No progress assessments yet, that's okay
            console.log('No progress assessments found for child');
            setProgress([]);
          }
          
          setLoading(false);
        } catch (err) {
          setError(err.toString());
          setLoading(false);
        }
      };

      fetchData();
    } else if (mockChildren.length > 0) {
      // Auto-select the first child if none is selected
      setSelectedChild(mockChildren[0].id);
    } else {
      setLoading(false);
    }
  }, [selectedChild]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleChildChange = (event) => {
    setSelectedChild(event.target.value);
  };

  const formatDateTime = (dateString) => {
    return format(new Date(dateString), 'PPP p');
  };

  const getSelectedChildName = () => {
    const child = mockChildren.find(c => c.id === selectedChild);
    return child ? child.name : '';
  };

  // Only show loading spinner during initial load or when changing child
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    if (!selectedChild) {
      return (
        <Alert severity="info">
          Please select a child to view their progress and schedules.
        </Alert>
      );
    }

    // Sort upcoming trainings and games by date
    const upcomingTrainings = trainings
      .filter(training => new Date(training.startTime) > new Date())
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 3);

    const upcomingGames = games
      .filter(game => new Date(game.startTime) > new Date())
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 3);

    const latestProgress = progress && progress.length > 0 
      ? progress[0] 
      : null;

    return (
      <>
        {/* Training Schedule Tab */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Upcoming Training Sessions
            </Typography>

            <Grid container spacing={3}>
              {upcomingTrainings.length === 0 ? (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>No upcoming training sessions scheduled.</Typography>
                  </Paper>
                </Grid>
              ) : (
                upcomingTrainings.map(training => (
                  <Grid item xs={12} md={6} lg={4} key={training._id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {training.title}
                        </Typography>
                        <Typography color="text.secondary" gutterBottom>
                          {training.team?.name || 'Team not assigned'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <CalendarToday fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {formatDateTime(training.startTime)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Person fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            Coach: {training.coach?.firstName} {training.coach?.lastName}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <LocationOn fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {training.court?.name || 'Location not specified'}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          component={Link} 
                          to={`/trainings/${training._id}`}
                        >
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                component={Link} 
                to={`/trainings/child/${selectedChild}`}
                color="primary"
              >
                View All Trainings
              </Button>
            </Box>
          </Box>
        )}

        {/* Match Schedule Tab */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Upcoming Matches
            </Typography>

            <Grid container spacing={3}>
              {upcomingGames.length === 0 ? (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>No upcoming matches scheduled.</Typography>
                  </Paper>
                </Grid>
              ) : (
                upcomingGames.map(game => (
                  <Grid item xs={12} md={6} key={game._id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {game.title}
                        </Typography>
                        <Typography color="text.secondary" gutterBottom>
                          {game.homeTeam?.name} vs {game.awayTeam?.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <CalendarToday fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {formatDateTime(game.startTime)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <LocationOn fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {game.location}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <EmojiEvents fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {game.gameType} match
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          component={Link} 
                          to={`/games/${game._id}`}
                        >
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                component={Link} 
                to={`/games/child/${selectedChild}`}
                color="primary"
              >
                View All Matches
              </Button>
            </Box>
          </Box>
        )}

        {/* Progress Tab */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Development Progress
            </Typography>

            {!latestProgress ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography>No progress assessments available yet.</Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Latest Assessment
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {format(new Date(latestProgress.assessmentDate), 'PPP')} by Coach {latestProgress.coach?.firstName} {latestProgress.coach?.lastName}
                      </Typography>
                      
                      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                        Technical Skills
                      </Typography>
                      <Grid container spacing={1}>
                        {latestProgress.skills?.technical && Object.entries(latestProgress.skills.technical).map(([skill, score]) => (
                          <Grid item xs={6} key={skill}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">{skill.charAt(0).toUpperCase() + skill.slice(1)}:</Typography>
                              <Typography variant="body2">
                                {score}/10
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                      
                      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                        Coach Notes
                      </Typography>
                      <Typography variant="body2">
                        {latestProgress.notes || 'No notes provided'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Performance Stats
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h5" color="primary">{latestProgress.performanceStats?.gamesPlayed || 0}</Typography>
                            <Typography variant="body2">Games Played</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h5" color="primary">{latestProgress.performanceStats?.goalsScored || 0}</Typography>
                            <Typography variant="body2">Goals Scored</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h5" color="primary">{latestProgress.performanceStats?.assists || 0}</Typography>
                            <Typography variant="body2">Assists</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h5" color="primary">{latestProgress.trainingAttendance?.percentage || 0}%</Typography>
                            <Typography variant="body2">Attendance</Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Development Goals
                      </Typography>
                      
                      {latestProgress.developmentGoals && latestProgress.developmentGoals.length > 0 ? (
                        <List>
                          {latestProgress.developmentGoals.map((goal, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                {goal.status === 'Completed' ? (
                                  <CheckIcon color="success" />
                                ) : (
                                  <DirectionsRun color="primary" />
                                )}
                              </ListItemIcon>
                              <ListItemText 
                                primary={goal.description}
                                secondary={`Status: ${goal.status}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography>No development goals set yet.</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                component={Link} 
                to={`/progress/child/${selectedChild}`}
                color="primary"
              >
                View Full Progress Report
              </Button>
            </Box>
          </Box>
        )}
      </>
    );
  };

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Parent Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Monitor your child's sports activities and development
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth variant="outlined">
          <InputLabel id="child-select-label">Select Child</InputLabel>
          <Select
            labelId="child-select-label"
            id="child-select"
            value={selectedChild}
            label="Select Child"
            onChange={handleChildChange}
            startAdornment={<ChildCare sx={{ mr: 1 }} />}
          >
            {mockChildren.map(child => (
              <MenuItem key={child.id} value={child.id}>
                {child.name} ({child.age}) - {child.team}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selectedChild && (
        <Paper sx={{ mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab icon={<Event />} label="Training" />
            <Tab icon={<EmojiEvents />} label="Matches" />
            <Tab icon={<Assessment />} label="Progress" />
          </Tabs>
        </Paper>
      )}

      {renderContent()}
    </Container>
  );
};

export default ParentDashboard; 