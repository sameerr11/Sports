import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Grid, Paper, Chip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, Alert, Tab, Tabs, Avatar, List, ListItem,
  ListItemAvatar, ListItemText, ListItemSecondaryAction, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material';
import { 
  ArrowBack, Edit, Delete, Add, Person, EmojiEvents, 
  SportsSoccer, Group
} from '@mui/icons-material';
import { 
  getTeamById, addPlayerToTeam, removePlayerFromTeam,
  addCoachToTeam, removeCoachFromTeam, deleteTeam
} from '../../services/teamService';
import { getUsersByRole } from '../../services/userService';
import { isSupervisor, isCoach, isPlayer, isParent } from '../../services/authService';
import AlertMessage from '../common/AlertMessage';
import { getSportIcon } from '../../utils/sportIcons';

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [playerDialog, setPlayerDialog] = useState({ open: false });
  const [coachDialog, setCoachDialog] = useState({ open: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false });
  const [playerFormData, setPlayerFormData] = useState({ playerId: '', position: '' });
  const [coachFormData, setCoachFormData] = useState({ coachId: '', role: 'Assistant Coach' });
  const [users, setUsers] = useState({ players: [], coaches: [] });
  const [successMessage, setSuccessMessage] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
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

  // Fetch available players and coaches from the API
  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch players and coaches in parallel
      const [playersResponse, coachesResponse] = await Promise.all([
        getUsersByRole('player'),
        getUsersByRole('coach')
      ]);
      
      // Filter out players already in the team
      const availablePlayers = team && team.players 
        ? playersResponse.filter(player => 
            !team.players.some(teamPlayer => 
              teamPlayer.player && teamPlayer.player._id === player._id
            )
          )
        : playersResponse;
      
      // Filter out coaches already in the team
      const availableCoaches = team && team.coaches
        ? coachesResponse.filter(coach => 
            !team.coaches.some(teamCoach => 
              teamCoach.coach && teamCoach.coach._id === coach._id
            )
          )
        : coachesResponse;
      
      setUsers({
        players: availablePlayers,
        coaches: availableCoaches
      });
    } catch (err) {
      console.error('Error fetching available users:', err);
      setError('Failed to load available players and coaches.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenPlayerDialog = () => {
    fetchAvailableUsers();
    setPlayerDialog({ open: true });
  };

  const handleClosePlayerDialog = () => {
    setPlayerDialog({ open: false });
    setPlayerFormData({ playerId: '', position: '' });
  };

  const handleOpenCoachDialog = () => {
    fetchAvailableUsers();
    setCoachDialog({ open: true });
  };

  const handleCloseCoachDialog = () => {
    setCoachDialog({ open: false });
    setCoachFormData({ coachId: '', role: 'Assistant Coach' });
  };

  const handleOpenDeleteDialog = () => {
    setDeleteDialog({ open: true });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({ open: false });
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
      
      // Add player to team
      await addPlayerToTeam(id, playerId, position);
      
      // Refresh team data to get updated players list
      const updatedTeam = await getTeamById(id);
      setTeam(updatedTeam);
      
      setSuccessMessage('Player added successfully');
      handleClosePlayerDialog();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error adding player:', err);
      // Show a more user-friendly error message
      setError('Failed to add player. Please try again later.');
    }
  };

  const handleRemovePlayer = async (playerId) => {
    try {
      // Remove player from team
      await removePlayerFromTeam(id, playerId);
      
      // Refresh team data to get updated players list
      const updatedTeam = await getTeamById(id);
      setTeam(updatedTeam);
      
      setSuccessMessage('Player removed successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error removing player:', err);
      // Show a more user-friendly error message
      setError('Failed to remove player. Please try again later.');
    }
  };

  const handleAddCoach = async () => {
    try {
      const { coachId, role } = coachFormData;
      if (!coachId) {
        setError('Please select a coach');
        return;
      }
      
      // Add coach to team
      await addCoachToTeam(id, coachId, role);
      
      // Refresh team data to get updated coaches list
      const updatedTeam = await getTeamById(id);
      setTeam(updatedTeam);
      
      setSuccessMessage('Coach added successfully');
      handleCloseCoachDialog();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error adding coach:', err);
      // Show a more user-friendly error message
      setError('Failed to add coach. Please try again later.');
    }
  };

  const handleRemoveCoach = async (coachId) => {
    try {
      // Remove coach from team
      await removeCoachFromTeam(id, coachId);
      
      // Refresh team data to get updated coaches list
      const updatedTeam = await getTeamById(id);
      setTeam(updatedTeam);
      
      setSuccessMessage('Coach removed successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error removing coach:', err);
      // Show a more user-friendly error message
      setError('Failed to remove coach. Please try again later.');
    }
  };

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam(id);
      setSuccessMessage('Team deleted successfully');
      handleCloseDeleteDialog();
      
      // Navigate after a short delay to show the success message
      setTimeout(() => {
        navigate('/teams');
      }, 1500);
    } catch (err) {
      console.error('Error deleting team:', err);
      // Show a more user-friendly error message
      setError('Failed to delete team. Please try again later.');
      handleCloseDeleteDialog();
    }
  };

  // Function to handle back navigation based on user role
  const handleBackNavigation = () => {
    if (isCoach()) {
      navigate('/coach'); // Navigate back to coach dashboard
    } else if (isPlayer()) {
      navigate('/player'); // Navigate back to player dashboard
    } else {
      navigate('/teams'); // Default navigation to teams page
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
          onClick={handleBackNavigation}
          sx={{ mb: 2 }}
        >
          {isCoach() ? 'Back to Dashboard' : isPlayer() ? 'Back to Dashboard' : 'Back to Teams'}
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
                {React.cloneElement(getSportIcon(team?.sportType || 'Sports'), { color: "action", sx: { mr: 1 } })}
                <Typography variant="body1">Sport: {team?.sportType || 'Not specified'}</Typography>
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
                    {team.players.map((playerItem) => {
                      // Handle different possible data structures safely
                      const playerData = playerItem.player || playerItem;
                      const playerId = playerData._id || (typeof playerData === 'string' ? playerData : 'unknown');
                      const firstName = playerData.firstName || '';
                      const lastName = playerData.lastName || '';
                      const profilePicture = playerData.profilePicture || '';
                      const position = playerItem.position || '';
                      
                      return (
                        <ListItem key={playerId} divider>
                          <ListItemAvatar>
                            <Avatar 
                              alt={`${firstName} ${lastName}`}
                              src={profilePicture}
                            />
                          </ListItemAvatar>
                          <ListItemText 
                            primary={`${firstName} ${lastName}`}
                            secondary={position ? `Position: ${position}` : 'No position specified'}
                          />
                          {canManageTeams && (
                            <ListItemSecondaryAction>
                              <IconButton 
                                edge="end" 
                                aria-label="delete"
                                onClick={() => handleRemovePlayer(playerId)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </ListItemSecondaryAction>
                          )}
                        </ListItem>
                      );
                    })}
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
                    {team.coaches.map((coachItem) => {
                      // Handle different possible data structures safely
                      const coachData = coachItem.coach || coachItem;
                      const coachId = coachData._id || (typeof coachData === 'string' ? coachData : 'unknown');
                      const firstName = coachData.firstName || '';
                      const lastName = coachData.lastName || '';
                      const profilePicture = coachData.profilePicture || '';
                      const role = coachItem.role || 'Assistant Coach';
                      
                      return (
                        <ListItem key={coachId} divider>
                          <ListItemAvatar>
                            <Avatar 
                              alt={`${firstName} ${lastName}`}
                              src={profilePicture}
                            />
                          </ListItemAvatar>
                          <ListItemText 
                            primary={`${firstName} ${lastName}`}
                            secondary={`Role: ${role}`}
                          />
                          {canManageTeams && (
                            <ListItemSecondaryAction>
                              <IconButton 
                                edge="end" 
                                aria-label="delete"
                                onClick={() => handleRemoveCoach(coachId)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </ListItemSecondaryAction>
                          )}
                        </ListItem>
                      );
                    })}
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
          {loadingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              {users.players.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No available players found. All players are already assigned to this team or no players exist in the system.
                </Alert>
              ) : (
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
              )}
              <TextField
                fullWidth
                label="Position (Optional)"
                name="position"
                value={playerFormData.position}
                onChange={handlePlayerFormChange}
                placeholder="e.g. Forward, Goalkeeper, etc."
                disabled={users.players.length === 0}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePlayerDialog}>Cancel</Button>
          <Button 
            onClick={handleAddPlayer} 
            color="primary" 
            variant="contained"
            disabled={loadingUsers || users.players.length === 0 || !playerFormData.playerId}
          >
            Add Player
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Coach Dialog */}
      <Dialog open={coachDialog.open} onClose={handleCloseCoachDialog}>
        <DialogTitle>Add Coach to Team</DialogTitle>
        <DialogContent>
          {loadingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              {users.coaches.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No available coaches found. All coaches are already assigned to this team or no coaches exist in the system.
                </Alert>
              ) : (
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
              )}
              <FormControl fullWidth disabled={users.coaches.length === 0}>
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCoachDialog}>Cancel</Button>
          <Button 
            onClick={handleAddCoach} 
            color="primary" 
            variant="contained"
            disabled={loadingUsers || users.coaches.length === 0 || !coachFormData.coachId}
          >
            Add Coach
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Team</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body1">
              Are you sure you want to delete this team? This action cannot be undone.
            </Typography>
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              All players and coaches will be removed from this team.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button 
            onClick={handleDeleteTeam} 
            color="error" 
            variant="contained"
          >
            Delete Team
          </Button>
        </DialogActions>
      </Dialog>

      {canManageTeams && (
        <Button
          variant="outlined"
          color="error"
          onClick={handleOpenDeleteDialog}
          sx={{ mt: 2, ml: 2 }}
        >
          Delete Team
        </Button>
      )}
    </Container>
  );
};

export default TeamDetail; 