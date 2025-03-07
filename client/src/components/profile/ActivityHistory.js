import React from 'react';
import {
    Box,
    Typography,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    Chip,
    Paper,
    Tab,
    Tabs
} from '@mui/material';
import {
    History,
    Event,
    EmojiEvents,
    Notifications,
    CheckCircle,
    RadioButtonUnchecked
} from '@mui/icons-material';

const ActivityHistory = ({ activity }) => {
    const [tabValue, setTabValue] = React.useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    if (!activity) {
        return (
            <Box>
                <Typography variant="body1" color="text.secondary" align="center">
                    No activity data available.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ mb: 3 }}
            >
                <Tab icon={<Event />} label="Bookings" />
                <Tab icon={<EmojiEvents />} label="Events" />
                <Tab icon={<Notifications />} label="Notifications" />
            </Tabs>

            {/* Bookings Tab */}
            {tabValue === 0 && (
                <Box>
                    <Typography variant="h6" className="form-section-title">
                        <Event /> Recent Bookings
                    </Typography>
                    
                    {activity.recentBookings && activity.recentBookings.length > 0 ? (
                        <List>
                            {activity.recentBookings.map((booking) => (
                                <Paper 
                                    key={booking._id} 
                                    variant="outlined" 
                                    className="activity-item"
                                >
                                    <ListItem>
                                        <ListItemIcon className="activity-icon">
                                            <Event color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={booking.court}
                                            secondary={`${booking.date} at ${booking.time} - ${booking.type}`}
                                        />
                                        <ListItemSecondaryAction className="activity-date">
                                            <Chip 
                                                label={booking.type} 
                                                color={booking.type === 'Match' ? 'primary' : 'default'} 
                                                size="small" 
                                            />
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                </Paper>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body1" color="text.secondary" align="center">
                            No recent bookings found.
                        </Typography>
                    )}
                </Box>
            )}

            {/* Events Tab */}
            {tabValue === 1 && (
                <Box>
                    <Typography variant="h6" className="form-section-title">
                        <EmojiEvents /> Upcoming Events
                    </Typography>
                    
                    {activity.upcomingEvents && activity.upcomingEvents.length > 0 ? (
                        <List>
                            {activity.upcomingEvents.map((event) => (
                                <Paper 
                                    key={event._id} 
                                    variant="outlined" 
                                    className="activity-item"
                                >
                                    <ListItem>
                                        <ListItemIcon className="activity-icon">
                                            <EmojiEvents color="secondary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={event.name}
                                            secondary={`${event.date} at ${event.location}`}
                                        />
                                    </ListItem>
                                </Paper>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body1" color="text.secondary" align="center">
                            No upcoming events found.
                        </Typography>
                    )}
                </Box>
            )}

            {/* Notifications Tab */}
            {tabValue === 2 && (
                <Box>
                    <Typography variant="h6" className="form-section-title">
                        <Notifications /> Recent Notifications
                    </Typography>
                    
                    {activity.notifications && activity.notifications.length > 0 ? (
                        <List>
                            {activity.notifications.map((notification) => (
                                <Paper 
                                    key={notification._id} 
                                    variant="outlined" 
                                    className="activity-item"
                                >
                                    <ListItem>
                                        <ListItemIcon className="activity-icon">
                                            {notification.read ? 
                                                <CheckCircle color="success" /> : 
                                                <RadioButtonUnchecked color="primary" />
                                            }
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={notification.message}
                                            secondary={notification.date}
                                        />
                                    </ListItem>
                                </Paper>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body1" color="text.secondary" align="center">
                            No notifications found.
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default ActivityHistory; 