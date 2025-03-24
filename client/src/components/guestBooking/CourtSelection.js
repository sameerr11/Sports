import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, CardMedia, 
  CardActionArea, Button, CircularProgress, FormControl,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { getAvailableCourts } from '../../services/guestBookingService';

const CourtSelection = ({ selectedDate, setSelectedDate, selectedCourt, setSelectedCourt, onNext }) => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchCourts = async () => {
      setLoading(true);
      setError('');
      try {
        const formattedDate = formatDate(selectedDate);
        const response = await getAvailableCourts(formattedDate);
        setCourts(response.courts || []);
      } catch (err) {
        setError(err.toString());
        setCourts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourts();
  }, [selectedDate]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setSelectedCourt(null);
  };

  const handleCourtSelect = (court) => {
    setSelectedCourt(court);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Date and Court
      </Typography>

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ mb: 4 }}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={handleDateChange}
            minDate={new Date()}
            renderInput={(params) => 
              <TextField 
                {...params} 
                fullWidth 
                sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.23)'
                    }
                  }
                }} 
              />
            }
          />
        </Box>
      </LocalizationProvider>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : courts.length === 0 ? (
        <Typography>No courts available on this date. Please select another date.</Typography>
      ) : (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Available Courts
          </Typography>

          <Grid container spacing={3}>
            {courts.map((court) => (
              <Grid item xs={12} sm={6} md={4} key={court.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: selectedCourt?.id === court.id ? '2px solid #1976d2' : 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(5px)'
                  }}
                >
                  <CardActionArea onClick={() => handleCourtSelect(court)}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={court.image || "https://via.placeholder.com/300x140?text=Court"}
                      alt={court.name}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div">
                        {court.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sport: {court.sportType}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Location: {court.location}
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ mt: 1, fontWeight: 'bold' }}>
                        ${court.hourlyRate} / hour
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!selectedCourt}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default CourtSelection;