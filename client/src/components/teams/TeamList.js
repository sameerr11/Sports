import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Typography, Button, Grid, Card, CardContent, 
  CardMedia, CardActions, IconButton, Chip, Box, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions,
  Avatar, AvatarGroup, Tooltip, useTheme, alpha, CircularProgress,
  Divider, TextField, InputAdornment, Paper
} from '@mui/material';
import { 
  Edit, Delete, Visibility, SportsSoccer, 
  Person, EmojiEvents, Add, People, ArrowForward,
  SportsTennis, SportsBasketball, SportsVolleyball,
  Pool, FitnessCenter, SportsMartialArts, SportsGymnastics,
  DirectionsRun, Sports, Search
} from '@mui/icons-material';
import { getTeams, deleteTeam } from '../../services/teamService';
import { isSupervisor } from '../../services/authService';
import AlertMessage from '../common/AlertMessage';
import './TeamList.css';

const TeamList = () => {
  const theme = useTheme();
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
        
        // If no teams returned in development, use sample data
        if (data.length === 0 && process.env.NODE_ENV !== 'production') {
          setTeams([
            {
              _id: 'sample1',
              name: 'Eagles Football Club',
              sportType: 'Football',
              description: 'A competitive football team with focus on technical skills and teamwork.',
              ageGroup: 'adults',
              level: 'Intermediate',
              players: Array(8).fill().map((_, i) => ({ _id: `player${i}` })),
              coaches: Array(2).fill().map((_, i) => ({ _id: `coach${i}`, firstName: 'Coach', lastName: `${i+1}` })),
              logo: 'https://source.unsplash.com/random?football'
            },
            {
              _id: 'sample2',
              name: 'Sameer Cricket Club',
              sportType: 'Cricket',
              description: 'Premier cricket club focused on developing batting and bowling skills.',
              ageGroup: 'Adult',
              level: 'Intermediate',
              players: Array(11).fill().map((_, i) => ({ _id: `player${i}` })),
              coaches: Array(2).fill().map((_, i) => ({ _id: `coach${i}`, firstName: 'Coach', lastName: `${i+1}` })),
              logo: 'https://source.unsplash.com/random?cricket'
            },
            {
              _id: 'sample3',
              name: 'Rockets Basketball',
              sportType: 'Basketball',
              description: 'Youth basketball program focused on fundamental skills and teamwork.',
              ageGroup: 'Youth',
              level: 'Beginner',
              players: Array(5).fill().map((_, i) => ({ _id: `player${i}` })),
              coaches: Array(1).fill().map((_, i) => ({ _id: `coach${i}`, firstName: 'Coach', lastName: `${i+1}` })),
              logo: 'https://source.unsplash.com/random?basketball'
            }
          ]);
        } else {
          setTeams(data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Failed to load teams. Please try again later.');
        setLoading(false);
        
        // Add sample data even in case of error for development
        if (process.env.NODE_ENV !== 'production') {
          setTeams([
            {
              _id: 'sample1',
              name: 'Eagles Football Club',
              sportType: 'Football',
              description: 'A competitive football team with focus on technical skills and teamwork.',
              ageGroup: 'adults',
              level: 'Intermediate',
              players: Array(8).fill().map((_, i) => ({ _id: `player${i}` })),
              coaches: Array(2).fill().map((_, i) => ({ _id: `coach${i}`, firstName: 'Coach', lastName: `${i+1}` })),
              logo: 'https://source.unsplash.com/random?football'
            },
            {
              _id: 'sample2',
              name: 'Sameer Cricket Club',
              sportType: 'Cricket',
              description: 'Premier cricket club focused on developing batting and bowling skills.',
              ageGroup: 'Adult',
              level: 'Intermediate',
              players: Array(11).fill().map((_, i) => ({ _id: `player${i}` })),
              coaches: Array(2).fill().map((_, i) => ({ _id: `coach${i}`, firstName: 'Coach', lastName: `${i+1}` })),
              logo: 'https://source.unsplash.com/random?cricket'
            }
          ]);
        }
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
  
  // Function to render sport icon based on sportType
  const getSportIcon = (sportType) => {
    const sportTypeLC = sportType?.toLowerCase() || '';
    
    if (sportTypeLC.includes('football') || sportTypeLC.includes('soccer')) {
      return <SportsSoccer className="sport-icon" />;
    } else if (sportTypeLC.includes('basketball')) {
      return <SportsBasketball className="sport-icon" />;
    } else if (sportTypeLC.includes('volleyball')) {
      return <SportsVolleyball className="sport-icon" />;
    } else if (sportTypeLC.includes('swimming')) {
      return <Pool className="sport-icon" />;
    } else if (sportTypeLC.includes('ping pong')) {
      return <SportsTennis className="sport-icon" />;
    } else if (sportTypeLC.includes('karate') || sportTypeLC.includes('self defense')) {
      return <SportsMartialArts className="sport-icon" />;
    } else if (sportTypeLC.includes('gymnastics')) {
      return <SportsGymnastics className="sport-icon" />;
    } else if (sportTypeLC.includes('gym')) {
      return <FitnessCenter className="sport-icon" />;
    } else if (sportTypeLC.includes('zumba')) {
      return <DirectionsRun className="sport-icon" />;
    }
    
    // Default icon if no match
    return <Sports className="sport-icon" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading teams...</Typography>
      </Box>
    );
  }

  return (
    <Box className="teams-container" sx={{ px: { xs: 2, sm: 4 }, py: 4, bgcolor: '#f8f9fa' }}>
      <Box className="teams-header" sx={{ mb: 5 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            fontWeight: 800, 
            color: theme.palette.primary.dark,
            mb: 1,
            position: 'relative',
            display: 'inline-block',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 80,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.palette.primary.main
            }
          }}
        >
          Teams {teams.length > 0 && `(${teams.length})`}
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary" 
          sx={{ 
            fontSize: '1.1rem', 
            maxWidth: '800px',
            mt: 2 
          }}
        >
          View and manage sports teams in your organization
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        {canManageTeams && (
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to="/teams/new"
            startIcon={<Add />}
            sx={{ 
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 600,
              boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.3)}`
              }
            }}
          >
            Create New Team
          </Button>
        )}
      </Box>

      {error && <AlertMessage severity="error" message={error} />}
      {success && <AlertMessage severity="success" message={success} />}

      {teams.length === 0 ? (
        <Box className="empty-state" sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          py: 8,
          animation: 'fadeInUp 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)' 
        }}>
          <Avatar sx={{ 
            width: 100, 
            height: 100, 
            mb: 3, 
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            animation: 'pulse 2s infinite ease-in-out'
          }}>
            <People sx={{ fontSize: 50, color: theme.palette.grey[500] }} />
          </Avatar>
          <Typography variant="h5" sx={{ color: theme.palette.grey[800], fontWeight: 600, mb: 1 }}>
            No teams available
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center', maxWidth: 500 }}>
            Create a new team to get started with team management and scheduling
          </Typography>
          {canManageTeams && (
            <Button 
              component={Link}
              to="/teams/new"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Add />}
              sx={{ 
                borderRadius: 2,
                px: 4,
                py: 1,
                fontWeight: 600
              }}
            >
              Create New Team
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={4} className="teams-grid">
          {teams.map((team, index) => (
            <Grid item xs={12} sm={6} md={4} key={team._id} className="team-item">
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)',
                  opacity: 1,
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
                  }
                }}
                className="team-card"
              >
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={team.logo || `https://source.unsplash.com/random?${team.sportType || 'sports'}`}
                    alt={team.name}
                    sx={{ 
                      transition: 'transform 0.8s ease',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    right: 16, 
                    bgcolor: alpha(theme.palette.background.default, 0.8),
                    borderRadius: 5,
                    px: 1.5,
                    py: 0.5,
                    backdropFilter: 'blur(4px)'
                  }}>
                    <Chip 
                      icon={getSportIcon(team.sportType)}
                      label={team.sportType} 
                      sx={{ 
                        fontWeight: 'bold',
                        bgcolor: 'transparent',
                        border: 'none'
                      }} 
                    />
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography 
                    gutterBottom 
                    variant="h5" 
                    component="h2" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: '1.5rem',
                      mb: 1.5
                    }}
                  >
                    {team.name}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2.5,
                      height: 60,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {team.description || 'No description available.'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {team.ageGroup && (
                      <Chip 
                        label={team.ageGroup} 
                        color="secondary" 
                        size="small" 
                        sx={{ fontWeight: 500, borderRadius: 2 }}
                      />
                    )}
                    <Chip 
                      label={team.level} 
                      variant="outlined" 
                      size="small" 
                      sx={{ fontWeight: 500, borderRadius: 2 }}
                    />
                  </Box>
                  
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mb: 2,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    }}
                    className="team-stats"
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Person sx={{ mr: 1, fontSize: 20, color: theme.palette.primary.main }} />
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {team.players?.length || 0} <Typography component="span" variant="body2" color="text.secondary">Players</Typography>
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmojiEvents sx={{ mr: 1, fontSize: 20, color: theme.palette.secondary.main }} className="trophy-icon" />
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {team.coaches?.length || 0} <Typography component="span" variant="body2" color="text.secondary">Coaches</Typography>
                      </Typography>
                    </Box>
                  </Box>
                  
                  {team.coaches && team.coaches.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                        Coaches:
                      </Typography>
                      <AvatarGroup max={3} sx={{ justifyContent: 'flex-start' }}>
                        {team.coaches.map((coachItem, idx) => {
                          // Handle different possible data structures safely
                          const coachData = coachItem.coach || coachItem;
                          const coachId = coachData._id || (typeof coachData === 'string' ? coachData : `unknown-${idx}`);
                          const firstName = coachData.firstName || '';
                          const lastName = coachData.lastName || '';
                          const profilePicture = coachData.profilePicture || '';
                          
                          return (
                            <Tooltip key={coachId} title={`${firstName} ${lastName}`}>
                              <Avatar 
                                alt={`${firstName} ${lastName}`} 
                                src={profilePicture}
                                sx={{ 
                                  width: 36, 
                                  height: 36,
                                  border: '2px solid white'
                                }}
                              />
                            </Tooltip>
                          );
                        })}
                      </AvatarGroup>
                    </Box>
                  )}
                </CardContent>
                
                <Divider sx={{ mx: 2 }} />
                
                <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
                  <Box>
                    {canManageTeams && (
                      <>
                        <IconButton 
                          component={Link} 
                          to={`/teams/edit/${team._id}`}
                          aria-label="edit"
                          color="primary"
                          sx={{ mr: 1 }}
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
                  </Box>
                  <Button 
                    component={Link} 
                    to={`/teams/${team._id}`}
                    variant="contained" 
                    color="primary"
                    endIcon={<ArrowForward />}
                    sx={{ 
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                      px: 2,
                      '&:hover': {
                        transform: 'translateX(4px)'
                      },
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    View Team
                  </Button>
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
        PaperProps={{
          sx: {
            borderRadius: 3,
            padding: 1,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this team? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 3 }}>
          <Button 
            onClick={handleDeleteCancel} 
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              px: 3,
              ml: 2
            }}
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamList; 