import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, Typography, Grid, Box, Button, Paper, Card, CardContent, 
  CardActions, Tabs, Tab, Divider, CircularProgress, Alert, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip
} from '@mui/material';
import { 
  SportsSoccer, Event, EmojiEvents, Assessment, Group, Add,
  SupervisorAccount, CalendarToday, Person, School, Edit as EditIcon
} from '@mui/icons-material';
import { getTrainings } from '../../services/trainingService';
import { getGames } from '../../services/gameService';
import { getTeamAssessments } from '../../services/progressService';
import { format } from 'date-fns';

const SupervisorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all training sessions
        const trainingData = await getTrainings();
        setTrainings(trainingData);

        // Fetch all games
        const gameData = await getGames();
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
          if (game.awayTeam && game.awayTeam._id) {
            teamSet.add(JSON.stringify({
              id: game.awayTeam._id,
              name: game.awayTeam.name,
              sportType: game.awayTeam.sportType
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'success';
      case 'Confirmed': 
      case 'Live': return 'primary';
      case 'Pending':
      case 'Scheduled': return 'warning';
      case 'Cancelled':
      case 'Postponed': return 'error';
      default: return 'default';
    }
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

  // Sort upcoming trainings and games by date
  const upcomingTrainings = trainings
    .filter(training => new Date(training.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const upcomingGames = games
    .filter(game => new Date(game.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  // Count trainings and games by team
  const teamStats = teams.map(team => {
    const teamTrainings = trainings.filter(
      t => t.team && t.team._id === team.id
    );
    
    const teamGames = games.filter(
      g => (g.homeTeam && g.homeTeam._id === team.id) || 
           (g.awayTeam && g.awayTeam._id === team.id)
    );
    
    return {
      ...team,
      trainingCount: teamTrainings.length,
      gameCount: teamGames.length
    };
  });

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Supervisor Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Schedule and manage training sessions and matches
        </Typography>
      </Box>

      <Paper sx={{ mb: 4, p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="body1">
          As a supervisor, you have exclusive permissions to create and schedule training sessions 
          and matches. Coaches and players can only view the schedules you create.
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
          <Tab icon={<Event />} label="Training Schedule" />
          <Tab icon={<EmojiEvents />} label="Match Schedule" />
          <Tab icon={<Group />} label="Team Overview" />
        </Tabs>
      </Paper>

      {/* Training Schedule Tab */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Training Schedule Manager
            </Typography>
            <Tooltip title="Only supervisors can schedule training sessions">
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Add />} 
                component={Link} 
                to="/trainings/new"
              >
                Schedule New Training
              </Button>
            </Tooltip>
          </Box>

          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Coach</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {upcomingTrainings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No upcoming training sessions found</TableCell>
                  </TableRow>
                ) : (
                  upcomingTrainings.map((training) => (
                    <TableRow key={training._id}>
                      <TableCell>{formatDateTime(training.startTime)}</TableCell>
                      <TableCell>{training.title}</TableCell>
                      <TableCell>{training.team?.name || 'Not assigned'}</TableCell>
                      <TableCell>
                        {training.coach ? 
                          `${training.coach.firstName} ${training.coach.lastName}` : 
                          'Not assigned'
                        }
                      </TableCell>
                      <TableCell>{training.court?.name || 'Not specified'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={training.status} 
                          color={getStatusColor(training.status)} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          component={Link} 
                          to={`/trainings/${training._id}`}
                        >
                          View
                        </Button>
                        <Button 
                          size="small" 
                          component={Link} 
                          to={`/trainings/${training._id}/edit`}
                          startIcon={<EditIcon />}
                          color="primary"
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

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

      {/* Match Schedule Tab */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Match Schedule Manager
            </Typography>
            <Tooltip title="Only supervisors can schedule matches">
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Add />} 
                component={Link} 
                to="/games/new"
              >
                Schedule New Match
              </Button>
            </Tooltip>
          </Box>

          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Teams</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {upcomingGames.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No upcoming matches found</TableCell>
                  </TableRow>
                ) : (
                  upcomingGames.map((game) => (
                    <TableRow key={game._id}>
                      <TableCell>{formatDateTime(game.startTime)}</TableCell>
                      <TableCell>{game.title}</TableCell>
                      <TableCell>
                        {game.homeTeam?.name || 'TBD'} vs {game.awayTeam?.name || 'TBD'}
                      </TableCell>
                      <TableCell>{game.location}</TableCell>
                      <TableCell>{game.gameType}</TableCell>
                      <TableCell>
                        <Chip 
                          label={game.status} 
                          color={getStatusColor(game.status)} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          component={Link} 
                          to={`/games/${game._id}`}
                        >
                          View
                        </Button>
                        <Button 
                          size="small" 
                          component={Link} 
                          to={`/games/${game._id}/edit`}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              component={Link} 
              to="/games" 
              color="primary"
            >
              View All Matches
            </Button>
          </Box>
        </Box>
      )}

      {/* Team Overview Tab */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Team Overview
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Add />} 
              component={Link} 
              to="/teams/new"
            >
              Add Team
            </Button>
          </Box>

          <Grid container spacing={3}>
            {teamStats.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>No teams found.</Typography>
                </Paper>
              </Grid>
            ) : (
              teamStats.map(team => (
                <Grid item xs={12} md={6} lg={4} key={team.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {team.name}
                      </Typography>
                      <Typography color="text.secondary" gutterBottom>
                        {team.sportType}
                      </Typography>
                      
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" color="primary">{team.trainingCount}</Typography>
                          <Typography variant="body2">Trainings</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" color="primary">{team.gameCount}</Typography>
                          <Typography variant="body2">Games</Typography>
                        </Box>
                      </Box>
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
                      <Button 
                        size="small" 
                        component={Link} 
                        to={`/teams/${team.id}/schedule`}
                      >
                        Schedule
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

export default SupervisorDashboard; 