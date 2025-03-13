import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Grid, Paper, Chip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, Alert, Tab, Tabs
} from '@mui/material';
import { 
  ArrowBack, Edit, EventAvailable, AccessTime, LocationOn, Group
} from '@mui/icons-material';
import { getCourtById, getCourtAvailability } from '../../services/courtService';
import { isSupervisor } from '../../services/authService';
import BookingForm from '../bookings/BookingForm';
import { getSportIcon } from '../../utils/sportIcons';

const CourtDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [court, setCourt] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tabValue, setTabValue] = useState(0);
  const canManageCourts = isSupervisor();

  useEffect(() => {
    const fetchCourtData = async () => {
      try {
        const courtData = await getCourtById(id);
        setCourt(courtData);
        
        // Format date for API
        const formattedDate = selectedDate.toISOString().split('T')[0];
        const availabilityData = await getCourtAvailability(id, formattedDate);
        setAvailability(availabilityData);
        
        setLoading(false);
      } catch (err) {
        setError(err.toString());
        setLoading(false);
      }
    };

    fetchCourtData();
  }, [id, selectedDate]);

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const availabilityData = await getCourtAvailability(id, formattedDate);
      setAvailability(availabilityData);
    } catch (err) {
      setError(err.toString());
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return <Typography>Loading court details...</Typography>;
  }

  if (!court) {
    return <Alert severity="error">Court not found</Alert>;
  }

  // Format the day of week for display
  const formatDayOfWeek = (day) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // Get next 7 days for date selection
  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/courts')}
          sx={{ mb: 2 }}
        >
          Back to Courts
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {court.name}
          </Typography>
          {canManageCourts && (
            <Button
              variant="outlined"
              color="primary"
              component={Link}
              to={`/courts/edit/${id}`}
              startIcon={<Edit />}
            >
              Edit Court
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <img
                src={court.image || "https://source.unsplash.com/random?court"}
                alt={court.name}
                style={{ width: '100%', height: '250px', objectFit: 'cover' }}
              />
              <Chip 
                label={court.sportType} 
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
                <LocationOn color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">{court.location}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Group color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">Capacity: {court.capacity} {court.capacity > 1 ? 'people' : 'person'}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime color="action" sx={{ mr: 1 }} />
                <Typography variant="body1">Hourly Rate: ${court.hourlyRate}</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Description</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {court.description || 'No description available.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{ mb: 3 }}
            >
              <Tab label="Availability" icon={<EventAvailable />} iconPosition="start" />
              <Tab label="Book Court" icon={getSportIcon(court.sportType)} iconPosition="start" />
            </Tabs>

            {tabValue === 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Court Availability
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 3, overflowX: 'auto', pb: 1 }}>
                  {getNextDays().map((date, index) => (
                    <Button
                      key={index}
                      variant={date.toDateString() === selectedDate.toDateString() ? 'contained' : 'outlined'}
                      onClick={() => handleDateChange(date)}
                      sx={{ minWidth: '100px' }}
                    >
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Button>
                  ))}
                </Box>

                {availability && (
                  <>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      {formatDayOfWeek(availability.dayOfWeek)} Schedule
                    </Typography>

                    {availability.courtAvailability.length === 0 ? (
                      <Alert severity="info">
                        No regular availability set for {formatDayOfWeek(availability.dayOfWeek)}
                      </Alert>
                    ) : (
                      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Start Time</TableCell>
                              <TableCell>End Time</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {availability.courtAvailability.map((slot, index) => {
                              // Check if slot is booked
                              const isBooked = availability.bookings.some(booking => {
                                const bookingStart = new Date(booking.startTime);
                                const bookingEnd = new Date(booking.endTime);
                                const slotStart = new Date(`${selectedDate.toDateString()} ${slot.start}`);
                                const slotEnd = new Date(`${selectedDate.toDateString()} ${slot.end}`);
                                
                                return (
                                  (bookingStart <= slotStart && bookingEnd > slotStart) ||
                                  (bookingStart < slotEnd && bookingEnd >= slotEnd) ||
                                  (bookingStart >= slotStart && bookingEnd <= slotEnd)
                                );
                              });
                              
                              return (
                                <TableRow key={index}>
                                  <TableCell>{slot.start}</TableCell>
                                  <TableCell>{slot.end}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={isBooked ? 'Booked' : 'Available'} 
                                      color={isBooked ? 'error' : 'success'} 
                                      size="small"
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}

                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Bookings for {selectedDate.toLocaleDateString()}
                    </Typography>

                    {availability.bookings.length === 0 ? (
                      <Alert severity="info">
                        No bookings for this date
                      </Alert>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Start Time</TableCell>
                              <TableCell>End Time</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {availability.bookings.map((booking) => (
                              <TableRow key={booking.id}>
                                <TableCell>
                                  {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </TableCell>
                                <TableCell>
                                  {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={booking.status} 
                                    color={
                                      booking.status === 'Confirmed' ? 'success' :
                                      booking.status === 'Pending' ? 'warning' :
                                      booking.status === 'Cancelled' ? 'error' : 'default'
                                    } 
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </>
                )}
              </>
            )}

            {tabValue === 1 && (
              <BookingForm courtId={id} court={court} />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CourtDetail; 