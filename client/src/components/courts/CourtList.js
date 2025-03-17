import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, Typography, Button, Grid, Card, CardContent, 
  CardMedia, CardActions, IconButton, Chip, Box, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions,
  useTheme, alpha, CircularProgress, Avatar, Divider
} from '@mui/material';
import { 
  Edit, Delete, Visibility, Add, SportsTennis, 
  LocationOn, AttachMoney, ArrowForward 
} from '@mui/icons-material';
import { getCourts, deleteCourt } from '../../services/courtService';
import { isSupervisor } from '../../services/authService';
import AlertMessage from '../common/AlertMessage';
import { getSportIcon } from '../../utils/sportIcons';
import './CourtList.css';

const CourtList = () => {
  const theme = useTheme();
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, courtId: null });
  const canManageCourts = isSupervisor();

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const data = await getCourts();
        // If no courts are returned, use sample data for display
        if (data.length === 0 && process.env.NODE_ENV !== 'production') {
          // Sample data for development only
          setCourts([
            {
              _id: 'sample1',
              name: 'Football Field',
              sportType: 'Football',
              description: 'A professional football field with proper markings and goals.',
              hourlyRate: 20,
              location: 'Main Stadium',
              courtNumber: 2,
              image: 'https://source.unsplash.com/random?football'
            },
            {
              _id: 'sample2',
              name: 'Cricket Pitch',
              sportType: 'Cricket',
              description: 'Standard cricket pitch with well-maintained grounds.',
              hourlyRate: 10,
              location: 'East Wing',
              courtNumber: 1,
              image: 'https://source.unsplash.com/random?cricket'
            },
            {
              _id: 'sample3',
              name: 'Basketball Court',
              sportType: 'Basketball',
              description: 'Indoor basketball court with professional flooring and equipment.',
              hourlyRate: 15,
              location: 'Indoor Arena',
              courtNumber: 3,
              image: 'https://source.unsplash.com/random?basketball'
            }
          ]);
        } else {
          setCourts(data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching courts:', err);
        setError(err.toString());
        setLoading(false);
        
        // Add sample data even in case of error for development
        if (process.env.NODE_ENV !== 'production') {
          setCourts([
            {
              _id: 'sample1',
              name: 'Football Field',
              sportType: 'Football',
              description: 'A professional football field with proper markings and goals.',
              hourlyRate: 20,
              location: 'Main Stadium',
              courtNumber: 2,
              image: 'https://source.unsplash.com/random?football'
            },
            {
              _id: 'sample2',
              name: 'Cricket Pitch',
              sportType: 'Cricket',
              description: 'Standard cricket pitch with well-maintained grounds.',
              hourlyRate: 10,
              location: 'East Wing',
              courtNumber: 1,
              image: 'https://source.unsplash.com/random?cricket'
            }
          ]);
        }
      }
    };

    fetchCourts();
  }, []);

  const handleDeleteClick = (courtId) => {
    setDeleteDialog({ open: true, courtId });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCourt(deleteDialog.courtId);
      setCourts(courts.filter(court => court._id !== deleteDialog.courtId));
      setDeleteDialog({ open: false, courtId: null });
    } catch (err) {
      setError(err.toString());
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, courtId: null });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading courts...</Typography>
      </Box>
    );
  }

  return (
    <Box className="courts-container" sx={{ px: { xs: 2, sm: 4 }, py: 4, bgcolor: '#f8f9fa' }}>
      <Box className="courts-header" sx={{ mb: 5 }}>
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
          Courts {courts.length > 0 && `(${courts.length})`}
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
          Explore and book our available sports facilities
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        {canManageCourts && (
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to="/courts/new"
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
            Add Court
          </Button>
        )}
      </Box>

      {error && <AlertMessage severity="error" message={error} />}

      {courts.length === 0 ? (
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
            <SportsTennis sx={{ fontSize: 50, color: theme.palette.grey[500] }} />
          </Avatar>
          <Typography variant="h5" sx={{ color: theme.palette.grey[800], fontWeight: 600, mb: 1 }}>
            No courts available
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center', maxWidth: 500 }}>
            There are no courts or facilities available at the moment. Check back later or contact support.
          </Typography>
          {canManageCourts && (
            <Button 
              component={Link}
              to="/courts/new"
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
              Add Court
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={4} className="courts-grid">
          {courts.map((court, index) => (
            <Grid item xs={12} sm={6} md={4} key={court._id} className="court-item">
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
                className="court-card"
              >
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={court.image || "https://source.unsplash.com/random?court"}
                    alt={court.name}
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
                      icon={<AttachMoney fontSize="small" />}
                      label={`${court.hourlyRate}/hour`} 
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
                    {court.name}
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2,
                    color: theme.palette.text.secondary
                  }}>
                    <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {court.location || 'Location not specified'}
                    </Typography>
                  </Box>
                  
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
                    {court.description || 'No description available.'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip 
                      icon={getSportIcon(court.sportType)}
                      label={court.sportType} 
                      color="primary" 
                      size="small" 
                      sx={{ fontWeight: 500, borderRadius: 2 }}
                    />
                    <Chip 
                      label={`St ${court.courtNumber || 1}`} 
                      variant="outlined" 
                      size="small" 
                      sx={{ fontWeight: 500, borderRadius: 2 }}
                    />
                  </Box>
                </CardContent>
                
                <Divider sx={{ mx: 2 }} />
                
                <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
                  <Box>
                    {canManageCourts && (
                      <>
                        <IconButton 
                          component={Link} 
                          to={`/courts/edit/${court._id}`}
                          aria-label="edit"
                          color="primary"
                          sx={{ mr: 1 }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDeleteClick(court._id)}
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
                    to={`/courts/${court._id}`}
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
                    View Details
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
            Are you sure you want to delete this court? This action cannot be undone.
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

export default CourtList; 