import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Paper,
  IconButton,
  Divider,
  Badge,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import PaymentIcon from '@mui/icons-material/Payment';
import SportsIcon from '@mui/icons-material/Sports';
import { 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from '../../services/notificationService';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getUserNotifications();
      setNotifications(data);
      setError('');
    } catch (err) {
      setError('Failed to load notifications. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(
        notifications.map(notification => 
          notification._id === id 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
    } catch (err) {
      setError('Failed to mark notification as read.');
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(
        notifications.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (err) {
      setError('Failed to mark all notifications as read.');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(notification => notification._id !== id));
    } catch (err) {
      setError('Failed to delete notification.');
      console.error(err);
    }
  };

  const getNotificationIcon = (type, model) => {
    if (type === 'new_registration') return <PersonIcon />;
    if (type === 'registration_expiry') return <PaymentIcon />;
    
    switch (model) {
      case 'User':
        return <PersonIcon />;
      case 'PlayerRegistration':
        return <PaymentIcon />;
      case 'Team':
      case 'Match':
      case 'Training':
        return <SportsIcon />;
      case 'Payment':
        return <PaymentIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Notifications
        </Typography>
        {notifications.some(n => !n.isRead) && (
          <Button 
            variant="outlined" 
            onClick={handleMarkAllAsRead}
            startIcon={<CheckCircleIcon />}
          >
            Mark All as Read
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">No notifications</Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%' }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification._id}>
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    <Box>
                      {!notification.isRead && (
                        <IconButton 
                          edge="end" 
                          aria-label="mark as read"
                          onClick={() => handleMarkAsRead(notification._id)}
                          sx={{ mr: 1 }}
                        >
                          <CheckCircleIcon color="primary" />
                        </IconButton>
                      )}
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleDelete(notification._id)}
                      >
                        <DeleteIcon color="error" />
                      </IconButton>
                    </Box>
                  }
                  sx={{
                    bgcolor: notification.isRead ? 'inherit' : 'rgba(25, 118, 210, 0.08)',
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      color="primary"
                      variant="dot"
                      invisible={notification.isRead}
                    >
                      <Avatar sx={{ bgcolor: notification.isRead ? 'grey.400' : 'primary.main' }}>
                        {getNotificationIcon(
                          notification.type, 
                          notification.relatedTo?.model
                        )}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle1"
                        color="text.primary"
                        fontWeight={notification.isRead ? 'normal' : 'bold'}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          variant="body2"
                          color="text.primary"
                          component="span"
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="div"
                          sx={{ mt: 1 }}
                        >
                          {formatDate(notification.createdAt)}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default NotificationList; 