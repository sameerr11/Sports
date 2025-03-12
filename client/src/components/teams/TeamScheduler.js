import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  Button, 
  Grid, 
  TextField, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Snackbar, 
  Alert, 
  Paper, 
  Divider,
  IconButton,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  useTheme,
  alpha,
  FormControlLabel,
  Switch,
  FormHelperText
} from '@mui/material';
import { 
  Add, 
  Delete, 
  Edit, 
  Event, 
  SportsScore,
  SportsSoccer,
  FitnessCenter,
  CalendarMonth
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import axios from 'axios';
import api from '../../services/api';
import { getAuthHeader, isSupervisor } from '../../services/authService';

// Add function to make a direct test call
async function testApiCall() {
  try {
    console.log('Making direct API test call...');
    const testRes = await axios.get('http://localhost:5000/api/teams');
    console.log('Direct API test result:', testRes.data);
    return testRes.data;
  } catch (error) {
    console.error('Direct API test error:', error);
    console.error('Error details:', error.response?.data || error.message);
    return null;
  }
}

const TeamScheduler = () => {
  const theme = useTheme();
  const [teams, setTeams] = useState([]);
  const [courts, setCourts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [scheduleType, setScheduleType] = useState('Training');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('');
  
  // Replace the separate date time pickers with individual date and time selections
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  
  const [notes, setNotes] = useState('');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [tabValue, setTabValue] = useState(0);
  const [isSupervisorUser, setIsSupervisorUser] = useState(isSupervisor());
  
  // Add new state for recurring schedule
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  // Fetch teams, courts, and schedules
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching teams using api instance...');
        // Try using the API instance first
        try {
          const teamsRes = await api.get('/teams');
          console.log('Teams response (api instance):', teamsRes.data);
          setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
        } catch (apiError) {
          console.error('Error with api instance:', apiError);
          
          // Fallback to direct axios call
          console.log('Trying direct axios call...');
          const teamsRes = await axios.get('http://localhost:5000/api/teams');
          console.log('Teams response (direct axios):', teamsRes.data);
          setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
        }
        
        console.log('Fetching courts...');
        try {
          const courtsRes = await api.get('/courts');
          console.log('Courts response (api instance):', courtsRes.data);
          setCourts(Array.isArray(courtsRes.data) ? courtsRes.data : []);
        } catch (apiError) {
          console.error('Error with api instance:', apiError);
          
          // Fallback to direct axios call
          console.log('Trying direct axios call...');
          const courtsRes = await axios.get('http://localhost:5000/api/courts');
          console.log('Courts response (direct axios):', courtsRes.data);
          setCourts(Array.isArray(courtsRes.data) ? courtsRes.data : []);
        }
        
        console.log('Fetching bookings...');
        try {
          const bookingsRes = await api.get('/bookings');
          console.log('Bookings response (api instance):', bookingsRes.data);
          
          // Filter bookings for training sessions and matches
          const bookingsData = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
          const relevantBookings = bookingsData.filter(
            booking => booking.purpose === 'Training' || booking.purpose === 'Match'
          );
          
          setSchedules(relevantBookings);
        } catch (apiError) {
          console.error('Error with api instance:', apiError);
          
          // Don't try fallback for bookings if user is not supervisor
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Error details:', error.response?.data || error.message);
        
        // If we get an error, set empty arrays to prevent null errors
        setTeams([]);
        setCourts([]);
        setSchedules([]);
        
        setAlert({
          open: true,
          message: `Error loading data: ${error.response?.data?.msg || error.message}`,
          severity: 'error'
        });
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Add a test call when component mounts
  useEffect(() => {
    testApiCall();
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleOpenDialog = (type) => {
    setScheduleType(type);
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };
  
  const resetForm = () => {
    setSelectedTeam('');
    setSelectedCourt('');
    setSelectedDate(new Date());
    setStartTime('09:00');
    setEndTime('11:00');
    setNotes('');
    setIsRecurring(false);
    setSelectedDays([]);
  };
  
  const handleDayToggle = (day) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };
  
  const handleCreateSchedule = async () => {
    try {
      // Validate form
      if (!selectedTeam || !selectedCourt || !selectedDate || !startTime || !endTime) {
        setAlert({
          open: true,
          message: 'Please fill all required fields',
          severity: 'error'
        });
        return;
      }
      
      // Create date objects by combining the selected date with time strings
      const startDateTime = combineDateTime(selectedDate, startTime);
      const endDateTime = combineDateTime(selectedDate, endTime);
      
      if (startDateTime >= endDateTime) {
        setAlert({
          open: true,
          message: 'End time must be after start time',
          severity: 'error'
        });
        return;
      }
      
      if (isRecurring && selectedDays.length === 0) {
        setAlert({
          open: true,
          message: 'Please select at least one day for recurring schedule',
          severity: 'error'
        });
        return;
      }

      if (isRecurring) {
        // Create bookings for each selected day
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        
        const bookingPromises = selectedDays.map(async (day) => {
          // Get the next occurrence of this day
          const nextDate = getNextDayOfWeek(day);
          
          const bookingStartTime = new Date(nextDate);
          bookingStartTime.setHours(startHours, startMinutes);
          
          const bookingEndTime = new Date(nextDate);
          bookingEndTime.setHours(endHours, endMinutes);

          const newBooking = {
            court: selectedCourt,
            team: selectedTeam,
            startTime: bookingStartTime.toISOString(),
            endTime: bookingEndTime.toISOString(),
            purpose: scheduleType,
            notes: notes,
            isRecurring: true,
            recurringDay: day
          };

          return api.post('/bookings', newBooking);
        });

        const responses = await Promise.all(bookingPromises);
        const newSchedules = responses.map(response => response.data);
        
        setSchedules(prev => [...prev, ...newSchedules]);
      } else {
        // Create single booking
      const newBooking = {
        court: selectedCourt,
        team: selectedTeam,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        purpose: scheduleType,
        notes: notes
      };
      
      const response = await api.post('/bookings', newBooking);
        setSchedules(prev => [...prev, response.data]);
      }
      
      // Show success message
      setAlert({
        open: true,
        message: `${scheduleType} scheduled successfully!`,
        severity: 'success'
      });
      
      // Close dialog and reset form
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating schedule:', error);
      setAlert({
        open: true,
        message: error.response?.data?.msg || 'Error creating schedule',
        severity: 'error'
      });
    }
  };
  
  // Helper function to combine date and time
  const combineDateTime = (date, timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  };
  
  // Helper function to get the next occurrence of a day
  const getNextDayOfWeek = (dayName) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date();
    const targetDay = days.indexOf(dayName.toLowerCase());
    const todayDay = today.getDay();
    
    let daysUntilTarget = targetDay - todayDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }
    
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + daysUntilTarget);
    return nextDate;
  };
  
  const handleDeleteSchedule = async (id) => {
    try {
      // Cancel the booking using api instance
      await api.put(`/bookings/${id}/cancel`, {});
      
      // Update schedules list
      setSchedules(schedules.filter(schedule => schedule._id !== id));
      
      setAlert({
        open: true,
        message: 'Schedule cancelled successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      setAlert({
        open: true,
        message: error.response?.data?.msg || 'Error cancelling schedule',
        severity: 'error'
      });
    }
  };
  
  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };
  
  // Filter schedules based on tab (upcoming or past)
  const filteredSchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.startTime);
    const now = new Date();
    return tabValue === 0 ? scheduleDate >= now : scheduleDate < now;
  });
  
  // Group schedules by date
  const groupedSchedules = filteredSchedules.reduce((groups, schedule) => {
    const date = format(new Date(schedule.startTime), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(schedule);
    return groups;
  }, {});
  
  // Sort dates in ascending order
  const sortedDates = Object.keys(groupedSchedules).sort((a, b) => {
    return new Date(a) - new Date(b);
  });
  
  const getScheduleTypeIcon = (type) => {
    switch(type) {
      case 'Training':
        return <FitnessCenter />;
      case 'Match':
        return <SportsScore />;
      default:
        return <Event />;
    }
  };
  
  // Add a message for non-supervisors
  const renderNoAccessMessage = () => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '50vh',
      textAlign: 'center',
      p: 3
    }}>
      <Typography variant="h5" color="error" gutterBottom>
        Access Restricted
      </Typography>
      <Typography variant="body1">
        You need supervisor permissions to access team scheduling features.
      </Typography>
    </Box>
  );
  
  return (
    <Box sx={{ py: 3 }}>
      {!isSupervisorUser ? (
        renderNoAccessMessage()
      ) : (
        <>
          {/* Improved loading indicator */}
          {isLoading && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              mb: 4, 
              mt: 2,
              py: 4
            }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Loading scheduler data...
              </Typography>
            </Box>
          )}
          
          {/* Improved page header */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              mb: 4, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              backgroundImage: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.background.paper, 0.1)})`,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                Team Scheduling
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage training sessions and matches for your teams
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<FitnessCenter />}
                onClick={() => handleOpenDialog('Training')}
                sx={{ px: 2, py: 1 }}
              >
                Schedule Training
              </Button>
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<SportsScore />}
                onClick={() => handleOpenDialog('Match')}
                sx={{ px: 2, py: 1 }}
              >
                Schedule Match
              </Button>
            </Stack>
          </Paper>
          
          {/* Improved schedule card */}
          <Card sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }} elevation={2}>
            <CardHeader 
              title="Team Schedules" 
              sx={{ 
                bgcolor: alpha(theme.palette.background.default, 0.6), 
                borderBottom: `1px solid ${theme.palette.divider}`,
                py: 2
              }}
            />
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{ 
                  px: 2,
                  '& .MuiTab-root': {
                    py: 2,
                    minHeight: 48,
                    fontWeight: 500
                  }
                }}
              >
                <Tab 
                  label="Upcoming Schedules" 
                  icon={<CalendarMonth />} 
                  iconPosition="start"
                />
                <Tab 
                  label="Past Schedules" 
                  icon={<Event />} 
                  iconPosition="start"
                />
              </Tabs>
            </Box>
            <CardContent sx={{ p: 3 }}>
              {sortedDates.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No {tabValue === 0 ? 'upcoming' : 'past'} schedules found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use the buttons above to schedule new training sessions or matches
                  </Typography>
                </Box>
              ) : (
                sortedDates.map(date => (
                  <Box key={date} sx={{ mb: 4 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 2, 
                        fontWeight: 'bold',
                        display: 'inline-block',
                        px: 2,
                        py: 0.75,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        borderRadius: 1.5
                      }}
                    >
                      {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                    </Typography>
                    
                    <TableContainer 
                      component={Paper} 
                      variant="outlined" 
                      sx={{ 
                        boxShadow: `0 2px 10px ${alpha(theme.palette.common.black, 0.05)}`,
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        border: `1px solid ${alpha(theme.palette.divider, 0.8)}`
                      }}
                    >
                      <Table>
                        <TableHead sx={{ bgcolor: alpha(theme.palette.background.default, 0.8) }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Team</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Court</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {groupedSchedules[date].map(schedule => (
                            <TableRow key={schedule._id} hover>
                              <TableCell>
                                <Chip 
                                  icon={getScheduleTypeIcon(schedule.purpose)} 
                                  label={schedule.purpose}
                                  color={schedule.purpose === 'Training' ? 'primary' : 'secondary'}
                                  variant="outlined"
                                  sx={{ fontWeight: 500 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {schedule.team?.name || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {schedule.court?.name || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {format(new Date(schedule.startTime), 'h:mm a')} - {format(new Date(schedule.endTime), 'h:mm a')}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={schedule.status}
                                  color={
                                    schedule.status === 'Confirmed' ? 'success' :
                                    schedule.status === 'Pending' ? 'warning' :
                                    schedule.status === 'Cancelled' ? 'error' : 'default'
                                  }
                                  size="small"
                                  sx={{ fontWeight: 500 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    maxWidth: 200,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {schedule.notes || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                {new Date(schedule.startTime) > new Date() && (
                                  <IconButton 
                                    color="error" 
                                    onClick={() => handleDeleteSchedule(schedule._id)}
                                    size="small"
                                    sx={{ 
                                      bgcolor: alpha(theme.palette.error.main, 0.1),
                                      '&:hover': {
                                        bgcolor: alpha(theme.palette.error.main, 0.2)
                                      }
                                    }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
          
          {/* Improved schedule dialog */}
          <Dialog 
            open={openDialog} 
            onClose={handleCloseDialog} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
              }
            }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              <Typography variant="h5" component="div" fontWeight="bold">
                {scheduleType === 'Training' ? 'Schedule Team Training' : 'Schedule Team Match'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Fill in the details to schedule a {scheduleType.toLowerCase()} session
              </Typography>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="team-select-label">Team</InputLabel>
                    <Select
                      labelId="team-select-label"
                      value={selectedTeam}
                      label="Team"
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      required
                      sx={{ '& .MuiSelect-select': { py: 1.5 } }}
                    >
                      {teams.length === 0 ? (
                        <MenuItem disabled>No teams available</MenuItem>
                      ) : (
                        teams.map(team => (
                          <MenuItem key={team._id} value={team._id}>
                            {team.name} ({team.sportType})
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="court-select-label">Court</InputLabel>
                    <Select
                      labelId="court-select-label"
                      value={selectedCourt}
                      label="Court"
                      onChange={(e) => setSelectedCourt(e.target.value)}
                      required
                      sx={{ '& .MuiSelect-select': { py: 1.5 } }}
                    >
                      {courts.length === 0 ? (
                        <MenuItem disabled>No courts available</MenuItem>
                      ) : (
                        courts.map(court => (
                          <MenuItem key={court._id} value={court._id}>
                            {court.name} ({court.sportType})
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="Date"
                      value={selectedDate}
                      onChange={(newValue) => setSelectedDate(newValue)}
                      slotProps={{ 
                        textField: { 
                          fullWidth: true, 
                          required: true,
                          sx: { '& .MuiInputBase-root': { py: 0.5 } }
                        } 
                      }}
                      minDate={new Date()}
                      views={['year', 'month', 'day']}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start Time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                      label="End Time"
                    type="time"
                      value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                      />
                    }
                    label="Recurring Weekly Schedule"
                  />
                </Grid>

                {isRecurring && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Select Days for Weekly Recurrence
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {days.map((day) => (
                        <Chip
                          key={day}
                          label={day.charAt(0).toUpperCase() + day.slice(1)}
                          onClick={() => handleDayToggle(day)}
                          color={selectedDays.includes(day) ? 'primary' : 'default'}
                          variant={selectedDays.includes(day) ? 'filled' : 'outlined'}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      ))}
                    </Box>
                    <FormHelperText>
                      The schedule will repeat on selected days every week
                    </FormHelperText>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder={`Add notes about this ${scheduleType.toLowerCase()}`}
                    sx={{ '& .MuiInputBase-root': { p: 1.5 } }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, bgcolor: alpha(theme.palette.background.default, 0.6) }}>
              <Button 
                onClick={handleCloseDialog}
                sx={{ px: 3 }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateSchedule} 
                variant="contained" 
                color="primary"
                sx={{ px: 3 }}
              >
                Schedule {scheduleType}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
      
      {/* Enhanced alert snackbar */}
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alert.severity}
          variant="filled"
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeamScheduler; 