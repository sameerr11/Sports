import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider, 
  Chip,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Cake, 
  Today,
  Person,
  HourglassEmpty
} from '@mui/icons-material';
import { getUpcomingBirthdays } from '../../services/userService';

const UpcomingBirthdays = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [birthdays, setBirthdays] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        setLoading(true);
        const data = await getUpcomingBirthdays();
        setBirthdays(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching birthdays:', err);
        setError('Failed to load birthday data');
      } finally {
        setLoading(false);
      }
    };

    fetchBirthdays();
  }, []);

  // Helper function to get color based on days remaining
  const getDaysRemainingColor = (days) => {
    if (days === 0) return theme.palette.error.main; // Today
    if (days <= 3) return theme.palette.warning.main; // Soon
    if (days <= 7) return theme.palette.info.main; // This week
    return theme.palette.success.main; // Later
  };

  // Helper to get label based on days remaining
  const getDaysRemainingLabel = (days) => {
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress size={30} />
        <Typography variant="body2" sx={{ ml: 2 }}>Loading birthdays...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Typography variant="body2" color="error">{error}</Typography>
      </Box>
    );
  }

  if (birthdays.length === 0) {
    return (
      <Card elevation={0} sx={{ borderRadius: 3, height: '100%' }}>
        <CardHeader 
          title="Upcoming Birthdays" 
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          avatar={<Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}><Cake /></Avatar>}
        />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <HourglassEmpty color="disabled" sx={{ fontSize: 40, mb: 2, opacity: 0.4 }} />
            <Typography variant="body2" color="text.secondary">No upcoming birthdays in the next 30 days</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={0} sx={{ borderRadius: 3, height: '100%' }}>
      <CardHeader 
        title="Upcoming Birthdays" 
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        avatar={<Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}><Cake /></Avatar>}
      />
      <CardContent sx={{ pt: 0, pb: 2 }}>
        <List sx={{ width: '100%' }}>
          {birthdays.map((user, index) => (
            <React.Fragment key={user._id}>
              <ListItem 
                alignItems="flex-start" 
                sx={{ 
                  py: 1.5,
                  px: 1, 
                  borderRadius: 2,
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Typography variant="body1" fontWeight={600}>
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Chip 
                        size="small"
                        label={getDaysRemainingLabel(user.daysRemaining)}
                        sx={{ 
                          fontWeight: 600,
                          bgcolor: alpha(getDaysRemainingColor(user.daysRemaining), 0.1),
                          color: getDaysRemainingColor(user.daysRemaining),
                          borderRadius: 1
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Today fontSize="small" sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                        <Typography variant="body2" color="text.secondary">
                          Born: {user.birthDate}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <Cake fontSize="small" sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                        <Typography variant="body2" color="text.secondary">
                          Upcoming: {user.upcomingBirthDate}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              {index < birthdays.length - 1 && <Divider component="li" variant="inset" />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default UpcomingBirthdays; 