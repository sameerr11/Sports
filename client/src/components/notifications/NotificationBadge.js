import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import SportsIcon from '@mui/icons-material/Sports';
import PaymentIcon from '@mui/icons-material/Payment';
import { 
  getUserNotifications, 
  getUnreadCount, 
  markAsRead 
} from '../../services/notificationService';

const NotificationBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Fetch notifications on mount
    fetchNotifications();
    fetchUnreadCount();

    // Set up polling for new notifications
    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 60000); // Check every minute

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await getUserNotifications();
      // Only show the 5 most recent notifications
      setNotifications(data.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const handleClick = async (event) => {
    setAnchorEl(event.currentTarget);
    await fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(
        notifications.map(notification => 
          notification._id === id 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getNotificationIcon = (type, model) => {
    if (type === 'new_registration') return <PersonIcon />;
    
    switch (model) {
      case 'User':
        return <PersonIcon />;
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
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-controls={open ? 'notification-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'notification-button',
        }}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 360,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            {unreadCount} unread
          </Typography>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2">No notifications</Typography>
          </MenuItem>
        ) : (
          <List sx={{ width: '100%', p: 0 }}>
            {notifications.map((notification) => (
              <MenuItem 
                key={notification._id} 
                onClick={() => handleNotificationClick(notification._id)}
                sx={{
                  bgcolor: notification.isRead ? 'inherit' : 'rgba(25, 118, 210, 0.08)',
                  whiteSpace: 'normal',
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: notification.isRead ? 'grey.400' : 'primary.main' }}>
                    {getNotificationIcon(
                      notification.type, 
                      notification.relatedTo?.model
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle2"
                      color="text.primary"
                      fontWeight={notification.isRead ? 'normal' : 'bold'}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        component="span"
                        sx={{
                          display: 'inline',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="div"
                        sx={{ mt: 0.5 }}
                      >
                        {formatDate(notification.createdAt)}
                      </Typography>
                    </>
                  }
                />
              </MenuItem>
            ))}
          </List>
        )}
        <Divider />
        <Box sx={{ p: 1 }}>
          <Button
            component={Link}
            to="/notifications"
            fullWidth
            onClick={handleClose}
          >
            View All Notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationBadge; 