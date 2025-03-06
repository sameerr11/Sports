import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, Typography, Button, Grid, Card, CardContent, 
  CardMedia, CardActions, IconButton, Chip, Box, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { Edit, Delete, Visibility, SportsTennis } from '@mui/icons-material';
import { getCourts, deleteCourt } from '../../services/courtService';
import { isSupervisor } from '../../services/authService';
import AlertMessage from '../common/AlertMessage';

const CourtList = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, courtId: null });
  const canManageCourts = isSupervisor();

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const data = await getCourts();
        setCourts(data);
        setLoading(false);
      } catch (err) {
        setError(err.toString());
        setLoading(false);
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
    return <Typography>Loading courts...</Typography>;
  }

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Courts
        </Typography>
        {canManageCourts && (
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            to="/courts/new"
            startIcon={<SportsTennis />}
          >
            Add New Court
          </Button>
        )}
      </Box>

      {error && <AlertMessage severity="error" message={error} />}

      {courts.length === 0 ? (
        <Typography>No courts available.</Typography>
      ) : (
        <Grid container spacing={3}>
          {courts.map((court) => (
            <Grid item xs={12} sm={6} md={4} key={court._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={court.image || "https://source.unsplash.com/random?court"}
                  alt={court.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {court.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {court.description || 'No description available.'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip label={court.sportType} color="primary" size="small" />
                    <Chip label={`$${court.hourlyRate}/hour`} color="secondary" size="small" />
                    <Chip label={court.location} variant="outlined" size="small" />
                  </Box>
                </CardContent>
                <CardActions>
                  <IconButton 
                    component={Link} 
                    to={`/courts/${court._id}`}
                    aria-label="view"
                  >
                    <Visibility />
                  </IconButton>
                  {canManageCourts && (
                    <>
                      <IconButton 
                        component={Link} 
                        to={`/courts/edit/${court._id}`}
                        aria-label="edit"
                        color="primary"
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
            Are you sure you want to delete this court? This action cannot be undone.
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

export default CourtList; 