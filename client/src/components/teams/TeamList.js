import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, Typography, Button, Grid, Card, CardContent, 
  CardMedia, CardActions, IconButton, Chip, Box, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions,
  Avatar, AvatarGroup, Tooltip
} from '@mui/material';
import { 
  Edit, Delete, Visibility, SportsSoccer, 
  Person, EmojiEvents
} from '@mui/icons-material';
import { getTeams, deleteTeam } from '../../services/teamService';
import { isSupervisor } from '../../services/authService';
import AlertMessage from '../common/AlertMessage';

const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, teamId: null });
  const canManageTeams = isSupervisor();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await getTeams();
        setTeams(data);
        setLoading(false);
      } catch (err) {
        setError(err.toString());
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleDeleteClick = (teamId) => {
    setDeleteDialog({ open: true, teamId });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteTeam(deleteDialog.teamId);
      setTeams(teams.filter(team => team._id !== deleteDialog.teamId));
      setDeleteDialog({ open: false, teamId: null });
      setSuccess('Team deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error deleting team:', err);
      // Show a more user-friendly error message
      setError('Failed to delete team. Please try again later.');
      setDeleteDialog({ open: false, teamId: null });
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, teamId: null });
  };

  if (loading) {
    return <Typography>Loading teams...</Typography>;
  }

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Teams
        </Typography>
        {canManageTeams && (
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to="/teams/new"
            startIcon={<SportsSoccer />}
          >
            Create New Team
          </Button>
        )}
      </Box>

      {error && <AlertMessage severity="error" message={error} />}
      {success && <AlertMessage severity="success" message={success} />}

      {teams.length === 0 ? (
        <Typography>No teams available.</Typography>
      ) : (
        <Grid container spacing={3}>
          {teams.map((team) => (
            <Grid item xs={12} sm={6} md={4} key={team._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={team.logo || `https://source.unsplash.com/random?${team.sportType}`}
                  alt={team.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {team.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {team.description || 'No description available.'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip label={team.sportType} color="primary" size="small" />
                    {team.ageGroup && (
                      <Chip label={team.ageGroup} color="secondary" size="small" />
                    )}
                    <Chip label={team.level} variant="outlined" size="small" />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Person sx={{ mr: 1, fontSize: 20 }} color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {team.players?.length || 0} Players
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmojiEvents sx={{ mr: 1, fontSize: 20 }} color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {team.coaches?.length || 0} Coaches
                      </Typography>
                    </Box>
                  </Box>
                  
                  {team.coaches && team.coaches.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Coaches:
                      </Typography>
                      <AvatarGroup max={3}>
                        {team.coaches.map((coachItem) => {
                          // Handle different possible data structures safely
                          const coachData = coachItem.coach || coachItem;
                          const coachId = coachData._id || (typeof coachData === 'string' ? coachData : 'unknown');
                          const firstName = coachData.firstName || '';
                          const lastName = coachData.lastName || '';
                          const profilePicture = coachData.profilePicture || '';
                          
                          return (
                            <Tooltip key={coachId} title={`${firstName} ${lastName}`}>
                              <Avatar 
                                alt={`${firstName} ${lastName}`} 
                                src={profilePicture} 
                              />
                            </Tooltip>
                          );
                        })}
                      </AvatarGroup>
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <IconButton 
                    component={Link} 
                    to={`/teams/${team._id}`}
                    aria-label="view"
                  >
                    <Visibility />
                  </IconButton>
                  {canManageTeams && (
                    <>
                      <IconButton 
                        component={Link} 
                        to={`/teams/edit/${team._id}`}
                        aria-label="edit"
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDeleteClick(team._id)}
                        aria-label="delete"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this team? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeamList; 