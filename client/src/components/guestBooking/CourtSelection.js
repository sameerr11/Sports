import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, CardMedia, 
  CardActionArea, Button, CircularProgress, FormControl,
  TextField, useMediaQuery, useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { getAvailableCourts } from '../../services/guestBookingService';

const CourtSelection = ({ selectedDate, setSelectedDate, selectedCourt, setSelectedCourt, onNext }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          color: '#0e0051', 
          fontWeight: 600,
          mb: 2
        }}
      >
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
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: 'rgba(14, 0, 81, 0.2)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(14, 0, 81, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#f7931e',
                    }
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#f7931e',
                  },
                }} 
              />
            }
          />
        </Box>
      </LocalizationProvider>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress sx={{ color: '#f7931e' }} />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : courts.length === 0 ? (
        <Typography
          sx={{
            textAlign: 'center',
            color: '#0e0051',
            padding: 3,
            backgroundColor: 'rgba(14, 0, 81, 0.05)',
            borderRadius: '8px',
            marginTop: 2
          }}
        >
          No courts available on this date. Please select another date.
        </Typography>
      ) : (
        <>
          <Typography 
            variant="subtitle1" 
            gutterBottom
            sx={{ 
              fontWeight: 600, 
              color: '#0e0051',
              mb: 2
            }}
          >
            Available Courts
          </Typography>

          <Grid container spacing={2}>
            {courts.map((court) => (
              <Grid item xs={12} sm={6} md={4} key={court.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: selectedCourt?.id === court.id ? '2px solid #f7931e' : '1px solid rgba(14, 0, 81, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(5px)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: selectedCourt?.id === court.id 
                      ? '0 8px 16px rgba(247, 147, 30, 0.2)'
                      : '0 4px 8px rgba(0, 0, 0, 0.05)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 6px 20px rgba(14, 0, 81, 0.15)',
                    }
                  }}
                >
                  <CardActionArea 
                    onClick={() => handleCourtSelect(court)}
                    sx={{ 
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      height: '100%',
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={court.image || "https://via.placeholder.com/300x140?text=Court"}
                      alt={court.name}
                      sx={{
                        objectFit: 'cover',
                      }}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Typography 
                        gutterBottom 
                        variant="h6" 
                        component="div"
                        sx={{
                          color: '#0e0051',
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          mb: 1
                        }}
                      >
                        {court.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        Sport: {court.sportType}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Location: {court.location}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mt: 1.5, 
                          color: '#f7931e',
                          fontWeight: 'bold',
                          fontSize: '1rem'
                        }}
                      >
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
          sx={{
            backgroundColor: '#f7931e',
            color: 'white',
            borderRadius: '25px',
            padding: '10px 24px',
            fontWeight: 'bold',
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 4px 10px rgba(247, 147, 30, 0.3)',
            '&:hover': {
              backgroundColor: '#e08016',
              boxShadow: '0 6px 15px rgba(247, 147, 30, 0.4)',
            },
            '&.Mui-disabled': {
              backgroundColor: 'rgba(0, 0, 0, 0.12)',
              color: 'rgba(0, 0, 0, 0.26)'
            }
          }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default CourtSelection;