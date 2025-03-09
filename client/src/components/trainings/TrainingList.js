import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, Typography, Grid, Box, Button, Paper, Chip, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Card, CardContent, CardActions, IconButton,
  Alert
} from '@mui/material';
import { 
  Event as EventIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon, 
  Check as CheckIcon, 
  People as PeopleIcon, 
  Visibility as ViewIcon,
  PeopleAlt as TeamIcon,
  SportsSoccer as SportsIcon,
  Alarm as AlarmIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { formatDistance, format } from 'date-fns';
import { 
  getTrainings, 
  getPlayerTrainings, 
  getCoachTrainings, 
  deleteTraining 
} from '../../services/trainingService';
import { isAdmin, isSupervisor, isCoach, isPlayer, hasCoachingPrivileges } from '../../services/authService';
import AlertMessage from '../common/AlertMessage';

const TrainingList = ({ userView = false, onlyFuture = true }) => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, trainingId: null });
  
  // Only supervisors and admins can manage trainings (create, edit, delete)
  const canManageTrainings = isAdmin() || isSupervisor();
  
  // Coaches get special attendance tracking privileges
  const isCoachUser = isCoach();
  
  // Ability to view trainings (all roles have this)
  const canViewTrainings = true;

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        let data;
        if (userView) {
          // If player, get their specific trainings
          if (isPlayer()) {
            data = await getPlayerTrainings();
          } 
          // If coach, get trainings they're coaching
          else if (isCoach()) {
            data = await getCoachTrainings();
          } 
          // Otherwise get all trainings (admin/supervisor)
          else {
            data = await getTrainings();
          }
        } else {
          // Get all trainings
          data = await getTrainings();
        }
        
        // Filter for future trainings if needed
        if (onlyFuture) {
          const now = new Date();
          data = data.filter(training => new Date(training.startTime) > now);
        }
        
        setTrainings(data);
        setLoading(false);
      } catch (err) {
        setError(err.toString());
        setLoading(false);
      }
    };

    fetchTrainings();
  }, [userView, onlyFuture]);

  const handleDeleteDialogOpen = (trainingId) => {
    setDeleteDialog({ open: true, trainingId });
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialog({ open: false, trainingId: null });
  };

  const handleDeleteTraining = async () => {
    try {
      await deleteTraining(deleteDialog.trainingId);
      
      // Remove from state
      setTrainings(trainings.filter(training => training._id !== deleteDialog.trainingId));
      
      setSuccessMessage('Training deleted successfully');
      setDeleteDialog({ open: false, trainingId: null });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err.toString());
      setDeleteDialog({ open: false, trainingId: null });
    }
  };

  const formatDateTime = (dateString) => {
    return format(new Date(dateString), 'PPP p');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'success';
      case 'Confirmed': return 'primary';
      case 'Pending': return 'warning';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const renderStatusBadge = (status) => (
    <Chip 
      label={status} 
      size="small" 
      color={getStatusColor(status)} 
      sx={{ fontWeight: 500, ml: 1 }}
    />
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Container>
      {successMessage && (
        <AlertMessage 
          severity="success" 
          message={successMessage} 
          onClose={() => setSuccessMessage(null)}
        />
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Training Sessions
        </Typography>
        
        {canManageTrainings && (
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            component={Link} 
            to="/trainings/new"
          >
            New Training
          </Button>
        )}
      </Box>
      
      {trainings.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            No training sessions found.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {trainings.map((training) => (
            <Grid item xs={12} md={6} lg={4} key={training._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SportsIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                      {training.title}
                    </Typography>
                    {renderStatusBadge(training.status)}
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                    <TeamIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {training.team?.name || 'Team not specified'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                    <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {formatDateTime(training.startTime)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                    <AlarmIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      Duration: {formatDistance(
                        new Date(training.startTime),
                        new Date(training.endTime),
                        { includeSeconds: false }
                      )}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1, color: 'text.secondary' }}>
                    <PeopleIcon fontSize="small" sx={{ mr: 1, mt: 0.5 }} />
                    <Typography variant="body2">
                      Coach: {training.coach?.firstName} {training.coach?.lastName}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Type: {training.trainingType}
                  </Typography>
                </CardContent>
                
                <CardActions>
                  <Button 
                    size="small" 
                    component={Link}
                    to={`/trainings/${training._id}`}
                    startIcon={<ViewIcon />}
                  >
                    View
                  </Button>
                  
                  {canManageTrainings && (
                    <>
                      <Button 
                        size="small" 
                        color="primary"
                        component={Link}
                        to={`/trainings/${training._id}/edit`}
                        startIcon={<EditIcon />}
                      >
                        Edit
                      </Button>
                      
                      <Button 
                        size="small" 
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteDialogOpen(training._id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  
                  {isCoachUser && !canManageTrainings && (
                    <Button 
                      size="small" 
                      color="primary"
                      component={Link}
                      to={`/trainings/${training._id}/attendance`}
                      startIcon={<PeopleIcon />}
                    >
                      Attendance
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteDialogClose}
        aria-labelledby="alert-dialog-title"
      >
        <DialogTitle id="alert-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this training session? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteTraining} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TrainingList; 