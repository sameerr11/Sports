import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Grid, Paper, Chip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, Alert, Tab, Tabs, Avatar, List, ListItem,
  ListItemAvatar, ListItemText, ListItemSecondaryAction, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { 
  ArrowBack, Edit, Delete, Add, Person, EmojiEvents, 
  SportsSoccer, Group
} from '@mui/icons-material';
import { 
  getTeamById, addPlayerToTeam, removePlayerFromTeam,
  addCoachToTeam, removeCoachFromTeam 
} from '../../services/teamService';
import { isSupervisor, isCoach, isPlayer, isParent } from '../../services/authService';
import AlertMessage from '../common/AlertMessage';

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [playerDialog, setPlayerDialog] = useState({ open: false });
  const [coachDialog, setCoachDialog] = useState({ open: false });
  const [playerFormData, setPlayerFormData] = useState({ playerId: '', position: '' });
  const [coachFormData, setCoachFormData] = useState({ coachId: '', role: 'Assistant Coach' });
  const [users, setUsers] = useState({ players: [], coaches: [] });
  const [successMessage, setSuccessMessage] = useState(null);
  
  const canManageTeams = isSupervisor();
  const canViewTeam = isSupervisor() || isCoach() || isPlayer() || isParent();

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const teamData = await getTeamById(id);
        setTeam(teamData);
        setLoading(false);
      } catch (err) {
        setError(err.toString());
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [id]);

  // Mock function to fetch available players and coaches
  // In a real app, you would fetch this from your API
  useEffect(() => {
    // This is just a placeholder - in a real app you would fetch from your API
    setUsers({
      players: [
        { _id: 'player1', firstName: 'John', lastName: 'Doe' },
        { _id: 'player2', firstName: 'Jane', lastName: 'Smith' },
        { _id: 'player3', firstName: 'Mike', lastName: 'Johnson' }
      ],
      coaches: [
        { _id: 'coach1', firstName: 'Sarah', lastName: 'Williams' },
        { _id: 'coach2', firstName: 'Robert', lastName: 'Brown' }
      ]
    });
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenPlayerDialog = () => {
    setPlayerDialog({ open: true });
  };

  const handleClosePlayerDialog = () => {
    setPlayerDialog({ open: false });
    setPlayerFormData({ playerId: '', position: '' });
  };

  const handleOpenCoachDialog = () => {
    setCoachDialog({ open: true });
  };

  const handleCloseCoachDialog = () => {
    setCoachDialog({ open: false });
    setCoachFormData({ coachId: '', role: 'Assistant Coach' });
  };

  const handlePlayerFormChange = (e) => {
    const { name, value } = e.target;
    setPlayerFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCoachFormChange = (e) => {
    const { name, value } = e.target;
    setCoachFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPlayer = async () => {
    try {
      const { playerId, position } = playerFormData;
      if (!playerId) {
        setError('Please select a player');
        return;
      }
      
      const updatedPlayers = await addPlayerToTeam(id, playerId, position);
      setTeam(prev => ({
        ...prev,
        players: updatedPlayers
      }));
      
      setSuccessMessage('Player added successfully');
      handleClosePlayerDialog();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err.toString());
    }
  };

  const handleRemovePlayer = async (playerId) => {
    try {
      const updatedPlayers = await removePlayerFromTeam(id, playerId);
      setTeam(prev => ({
        ...prev,
        players: updatedPlayers
      }));
      
      setSuccessMessage('Player removed successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err.toString());
    }
  };

  const handleAddCoach = async () => {
    try {
      const { coachId, role } = coachFormData;
      if (!coachId) {
        setError('Please select a coach');
        return;
      }
      
      const updatedCoaches = await addCoachToTeam(id, coachId, role);
      setTeam(prev => ({
        ...prev,
        coaches: updatedCoaches
      }));
      
      setSuccessMessage('Coach added successfully');
      handleCloseCoachDialog();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err.toString());
    }
  };

  const handleRemoveCoach = async (coachId) => {
    try {
      const updatedCoaches = await removeCoachFromTeam(id, coachId);
      setTeam(prev => ({
        ...prev,
        coaches: updatedCoaches
      }));
      
      setSuccessMessage('Coach removed successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err.toString());
    }
  };

  if (loading) {
    return <Typography>Loading team details...</Typography>;
  }

  if (!team) {
    return <Alert severity="error">Team not found</Alert>;
  }

  if (!canViewTeam) {
    return <Alert severity="error">You don't have permission to view this team</Alert>;
  }

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/teams')}
          sx={{ mb: 2 }}
        >
          Back to Teams
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {team.name}
          </Typography>
          {canManageTeams && (
            <Button
              variant="outlined"
              color="primary"
              component={Link}
              to={`/teams/edit/${id}`}
              startIcon={<Edit />}
            >
              Edit Team
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <AlertMessage severity="success" message={successMessage} />}

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <img
                src={team.logo || `https://source.unsplash.com/random?${team.sportType}`}
                alt={team.name}
                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
              />
              <Chip 
                label={team.sportType} 
                color="primary" 
                sx={{ 
                  position: 'absolute', 
                  top: 16, 
                  right: 16,
                  fontWeight: 'bold'
                }} 
              />
            </Box>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SportsSoccer color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">Sport: {team.sportType}</Typography>
              </Box>
              
              {team.ageGroup && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Group color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1">Age Group: {team.ageGroup}</Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmojiEvents color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">Level: {team.level}</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Description</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {team.description || 'No description available.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{ mb: 3 }}
            >
              <Tab label="Players" icon={<Person />} iconPosition="start" />
              <Tab label="Coaches" icon={<EmojiEvents />} iconPosition="start" />
            </Tabs>

            {tabValue === 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Team Players
                  </Typography>
                  {canManageTeams && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Add />}
                      onClick={handleOpenPlayerDialog}
                    >
                      Add Player
                    </Button>
                  )}
                </Box>

                {team.players && team.players.length > 0 ? (
                  <List>
                    {team.players.map((playerItem) => (
                      <ListItem key={playerItem.player._id} divider>
                        <ListItemAvatar>
                          <Avatar 
                            alt={`${playerItem.player.firstName} ${playerItem.player.lastName}`}
                            src={playerItem.player.profilePicture}
                          />
                        </ListItemAvatar>
                        <ListItemText 
                          primary={`${playerItem.player.firstName} ${playerItem.player.lastName}`}
                          secondary={playerItem.position ? `Position: ${playerItem.position}` : 'No position specified'}
                        />
                        {canManageTeams && (
                          <ListItemSecondaryAction>
                            <IconButton 
                              edge="end" 
                              aria-label="delete"
                              onClick={() => handleRemovePlayer(playerItem.player._id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">No players assigned to this team yet.</Alert>
                )}
              </>
            )}

            {tabValue === 1 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Team Coaches
                  </Typography>
                  {canManageTeams && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Add />}
                      onClick={handleOpenCoachDialog}
                    >
                      Add Coach
                    </Button>
                  )}
                </Box>

                {team.coaches && team.coaches.length > 0 ? (
                  <List>
                    {team.coaches.map((coachItem) => (
                      <ListItem key={coachItem.coach._id} divider>
                        <ListItemAvatar>
                          <Avatar 
                            alt={`${coachItem.coach.firstName} ${coachItem.coach.lastName}`}
                            src={coachItem.coach.profilePicture}
                          />
                        </ListItemAvatar>
                        <ListItemText 
                          primary={`${coachItem.coach.firstName} ${coachItem.coach.lastName}`}
                          secondary={`Role: ${coachItem.role || 'Assistant Coach'}`}
                        />
                        {canManageTeams && (
                          <ListItemSecondaryAction>
                            <IconButton 
                              edge="end" 
                              aria-label="delete"
                              onClick={() => handleRemoveCoach(coachItem.coach._id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">No coaches assigned to this team yet.</Alert>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add Player Dialog */}
      <Dialog open={playerDialog.open} onClose={handleClosePlayerDialog}>
        <DialogTitle>Add Player to Team</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Player</InputLabel>
              <Select
                name="playerId"
                value={playerFormData.playerId}
                onChange={handlePlayerFormChange}
                label="Select Player"
              >
                {users.players.map(player => (
                  <MenuItem key={player._id} value={player._id}>
                    {player.firstName} {player.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Position (Optional)"
              name="position"
              value={playerFormData.position}
              onChange={handlePlayerFormChange}
              placeholder="e.g. Forward, Goalkeeper, etc."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePlayerDialog}>Cancel</Button>
          <Button onClick={handleAddPlayer} color="primary" variant="contained">
            Add Player
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Coach Dialog */}
      <Dialog open={coachDialog.open} onClose={handleCloseCoachDialog}>
        <DialogTitle>Add Coach to Team</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Coach</InputLabel>
              <Select
                name="coachId"
                value={coachFormData.coachId}
                onChange={handleCoachFormChange}
                label="Select Coach"
              >
                {users.coaches.map(coach => (
                  <MenuItem key={coach._id} value={coach._id}>
                    {coach.firstName} {coach.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={coachFormData.role}
                onChange={handleCoachFormChange}
                label="Role"
              >
                <MenuItem value="Head Coach">Head Coach</MenuItem>
                <MenuItem value="Assistant Coach">Assistant Coach</MenuItem>
                <MenuItem value="Fitness Coach">Fitness Coach</MenuItem>
                <MenuItem value="Goalkeeper Coach">Goalkeeper Coach</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCoachDialog}>Cancel</Button>
          <Button onClick={handleAddCoach} color="primary" variant="contained">
            Add Coach
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeamDetail; 