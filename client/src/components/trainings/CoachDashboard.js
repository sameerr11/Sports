import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, Typography, Grid, Box, Button, Paper, Card, CardContent, 
  CardActions, Tabs, Tab, Divider, CircularProgress, Alert
} from '@mui/material';
import { 
  SportsSoccer, Event, EmojiEvents, Assessment, Group, Add
} from '@mui/icons-material';
import { getCoachTrainings } from '../../services/trainingService';
import { getCoachGames } from '../../services/gameService';
import { getTeamAssessments } from '../../services/progressService';
import { formatDistanceToNow, format } from 'date-fns';

const CoachDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch coach's training sessions
        const trainingData = await getCoachTrainings();
        setTrainings(trainingData);

        // Fetch coach's games
        const gameData = await getCoachGames();
        setGames(gameData);

        // Extract unique teams from trainings and games 
        const teamSet = new Set();
        
        trainingData.forEach(training => {
          if (training.team && training.team._id) {
            teamSet.add(JSON.stringify({
              id: training.team._id,
              name: training.team.name,
              sportType: training.team.sportType
            }));
          }
        });
        
        gameData.forEach(game => {
          if (game.homeTeam && game.homeTeam._id) {
            teamSet.add(JSON.stringify({
              id: game.homeTeam._id,
              name: game.homeTeam.name,
              sportType: game.homeTeam.sportType
            }));
          }
        });
        
        const uniqueTeams = Array.from(teamSet).map(teamString => JSON.parse(teamString));
        setTeams(uniqueTeams);
        
        setLoading(false);
      } catch (err) {
        setError(err.toString());
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatDateTime = (dateString) => {
    return format(new Date(dateString), 'PPP p');
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
    .slice(0, 5);

  const upcomingGames = games
    .filter(game => new Date(game.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 5);

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Coach Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          View training sessions and matches for your teams
        </Typography>
      </Box>

      <Paper sx={{ mb: 4, p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="body1">
          As a coach, you can view training sessions and matches scheduled by supervisors. 
          You can take attendance during training sessions and manage team lineups for matches.
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
          <Tab icon={<Event />} label="Trainings" />
          <Tab icon={<EmojiEvents />} label="Games" />
          <Tab icon={<Group />} label="Teams" />
        </Tabs>
      </Paper>

      {/* Trainings Tab */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Upcoming Training Sessions
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Only supervisors can schedule new training sessions
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {upcomingTrainings.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>No upcoming training sessions found.</Typography>
                </Paper>
              </Grid>
            ) : (
              upcomingTrainings.map(training => (
                <Grid item xs={12} md={6} key={training._id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {training.title}
                      </Typography>
                      <Typography color="text.secondary" gutterBottom>
                        {training.team?.name || 'Team not assigned'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Date:</strong> {formatDateTime(training.startTime)}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Type:</strong> {training.trainingType}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong> {training.status}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        component={Link} 
                        to={`/trainings/${training._id}`}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="small" 
                        component={Link} 
                        to={`/trainings/${training._id}/attendance`}
                      >
                        Take Attendance
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
              to="/trainings" 
              color="primary"
            >
              View All Trainings
            </Button>
          </Box>
        </Box>
      )}

      {/* Games Tab */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Upcoming Games
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Only supervisors can schedule new matches
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {upcomingGames.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>No upcoming games found.</Typography>
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
                      <Typography variant="body2" gutterBottom>
                        <strong>Date:</strong> {formatDateTime(game.startTime)}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Location:</strong> {game.location}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong> {game.status}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        component={Link} 
                        to={`/games/${game._id}`}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="small" 
                        component={Link} 
                        to={`/games/${game._id}/lineups`}
                      >
                        Manage Lineups
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
              to="/games" 
              color="primary"
            >
              View All Games
            </Button>
          </Box>
        </Box>
      )}

      {/* Teams Tab */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Your Teams
          </Typography>

          <Grid container spacing={3}>
            {teams.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>You are not coaching any teams.</Typography>
                </Paper>
              </Grid>
            ) : (
              teams.map(team => (
                <Grid item xs={12} md={6} lg={4} key={team.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {team.name}
                      </Typography>
                      <Typography color="text.secondary" gutterBottom>
                        {team.sportType}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        component={Link} 
                        to={`/teams/${team.id}`}
                      >
                        Team Details
                      </Button>
                      <Button 
                        size="small" 
                        component={Link} 
                        to={`/progress/team/${team.id}`}
                      >
                        Player Progress
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default CoachDashboard; 