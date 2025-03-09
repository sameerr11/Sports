import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, Typography, Grid, Box, Paper, Card, CardContent, 
  CardActions, Tabs, Tab, Divider, CircularProgress, Alert, Button,
  List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import { 
  SportsSoccer, Event, EmojiEvents, Assessment, DirectionsRun,
  Alarm, CalendarToday, LocationOn, Person, Timeline,
  Check
} from '@mui/icons-material';
import { getPlayerTrainings } from '../../services/trainingService';
import { getPlayerGames } from '../../services/gameService';
import { getLatestAssessment } from '../../services/progressService';
import { getStoredUser } from '../../services/authService';
import { formatDistanceToNow, format } from 'date-fns';

const PlayerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [games, setGames] = useState([]);
  const [progress, setProgress] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const user = getStoredUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch player's training sessions
        const trainingData = await getPlayerTrainings();
        setTrainings(trainingData);

        // Fetch player's games
        const gameData = await getPlayerGames();
        setGames(gameData);

        // Fetch player's latest progress assessment
        try {
          const progressData = await getLatestAssessment(user.id);
          setProgress(progressData);
        } catch (progressError) {
          // No assessments yet, that's okay
          console.log('No assessments found for player');
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.toString());
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatDateTime = (dateString) => {
    return format(new Date(dateString), 'PPP p');
  };

  const getProgressColorAndLabel = (score) => {
    if (!score) return { color: 'default', label: 'Not assessed' };
    
    if (score >= 8) return { color: 'success.main', label: 'Excellent' };
    if (score >= 6) return { color: 'primary.main', label: 'Good' };
    if (score >= 4) return { color: 'warning.main', label: 'Average' };
    return { color: 'error.main', label: 'Needs improvement' };
  };

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

  const upcomingTrainings = trainings
    .filter(training => new Date(training.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 3);

  const upcomingGames = games
    .filter(game => new Date(game.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 3);

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Player Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          View your training and match schedules
        </Typography>
      </Box>

      <Paper sx={{ mb: 4, p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="body1">
          Your training sessions and matches are scheduled by your team supervisors. 
          You can view your schedule and track your progress here.
        </Typography>
      </Paper>

      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<DirectionsRun />} label="Training Plan" />
          <Tab icon={<EmojiEvents />} label="Matches" />
          <Tab icon={<Timeline />} label="My Progress" />
        </Tabs>
      </Paper>

      {/* Training Plan Tab */}
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
                        <Alarm fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          Duration: {formatDistanceToNow(
                            new Date(training.endTime),
                            { start: new Date(training.startTime) }
                          )}
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
              to="/trainings/player" 
              color="primary"
            >
              View All Trainings
            </Button>
          </Box>
        </Box>
      )}

      {/* Matches Tab */}
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
              to="/games/player" 
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
            My Progress
          </Typography>

          {!progress ? (
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
                      {format(new Date(progress.assessmentDate), 'PPP')} by Coach {progress.coach?.firstName} {progress.coach?.lastName}
                    </Typography>
                    
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                      Technical Skills
                    </Typography>
                    <Grid container spacing={1}>
                      {progress.skills?.technical && Object.entries(progress.skills.technical).map(([skill, score]) => (
                        <Grid item xs={6} key={skill}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{skill.charAt(0).toUpperCase() + skill.slice(1)}:</Typography>
                            <Typography variant="body2" sx={{ color: getProgressColorAndLabel(score).color }}>
                              {score}/10
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                      Tactical Skills
                    </Typography>
                    <Grid container spacing={1}>
                      {progress.skills?.tactical && Object.entries(progress.skills.tactical).map(([skill, score]) => (
                        <Grid item xs={6} key={skill}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{skill.charAt(0).toUpperCase() + skill.slice(1)}:</Typography>
                            <Typography variant="body2" sx={{ color: getProgressColorAndLabel(score).color }}>
                              {score}/10
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                      Physical Skills
                    </Typography>
                    <Grid container spacing={1}>
                      {progress.skills?.physical && Object.entries(progress.skills.physical).map(([skill, score]) => (
                        <Grid item xs={6} key={skill}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">{skill.charAt(0).toUpperCase() + skill.slice(1)}:</Typography>
                            <Typography variant="body2" sx={{ color: getProgressColorAndLabel(score).color }}>
                              {score}/10
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
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
                          <Typography variant="h5" color="primary">{progress.performanceStats?.gamesPlayed || 0}</Typography>
                          <Typography variant="body2">Games Played</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h5" color="primary">{progress.performanceStats?.goalsScored || 0}</Typography>
                          <Typography variant="body2">Goals Scored</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h5" color="primary">{progress.performanceStats?.assists || 0}</Typography>
                          <Typography variant="body2">Assists</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h5" color="primary">{progress.trainingAttendance?.percentage || 0}%</Typography>
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
                    
                    {progress.developmentGoals && progress.developmentGoals.length > 0 ? (
                      <List>
                        {progress.developmentGoals.map((goal, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              {goal.status === 'Completed' ? (
                                <Check color="success" />
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
              to="/progress/player" 
              color="primary"
            >
              View Progress History
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default PlayerDashboard; 