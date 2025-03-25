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
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BadgeIcon from '@mui/icons-material/Badge';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import FeedbackIcon from '@mui/icons-material/Feedback';
import CampaignIcon from '@mui/icons-material/Campaign';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import GroupsIcon from '@mui/icons-material/Groups';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HowToRegIcon from '@mui/icons-material/HowToReg';
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
    // Handle notification type-specific icons
    switch (type) {
      case 'new_registration':
        return <PersonAddIcon />;
      case 'role_change':
        return <BadgeIcon />;
      case 'document_upload':
        return <CloudUploadIcon />;
      case 'child_account_linked':
        return <FamilyRestroomIcon />;
      case 'new_training_plan':
        return <SportsIcon />;
      case 'training_scheduled':
      case 'training_updated':
      case 'training_cancelled':
        return <SportsIcon />;
      case 'match_scheduled':
      case 'match_updated':
      case 'match_result':
        return <SportsSoccerIcon />;
      case 'player_performance':
        return <ShowChartIcon />;
      case 'coach_feedback':
        return <FeedbackIcon />;
      case 'team_announcement':
        return <CampaignIcon />;
      case 'payment_reminder':
        return <PaymentIcon />;
      case 'attendance_update':
        return <EventAvailableIcon />;
      default:
        // Fallback to model-based icons
        switch (model) {
          case 'User':
            return <PersonIcon />;
          case 'Team':
            return <GroupsIcon />;
          case 'Match':
            return <SportsSoccerIcon />;
          case 'Training':
          case 'TrainingPlan':
            return <SportsIcon />;
          case 'Payment':
            return <PaymentIcon />;
          case 'PlayerStats':
            return <AssessmentIcon />;
          case 'PlayerRegistration':
            return <HowToRegIcon />;
          default:
            return <NotificationsIcon />;
        }
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
        sx={{
          borderRadius: '8px',
          padding: '8px',
          transition: 'all 0.2s',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '10px',
              height: '18px',
              minWidth: '18px',
              padding: '0 4px',
              fontWeight: 'bold'
            }
          }}
        >
          <NotificationsIcon sx={{ fontSize: 24 }} />
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
          elevation: 3,
          sx: {
            maxHeight: '400px',
            width: 360,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1.5,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>Notifications</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ 
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '2px 6px',
            borderRadius: '12px',
            backgroundColor: unreadCount > 0 ? 'rgba(25, 118, 210, 0.1)' : 'transparent'
          }}>
            {unreadCount} unread
          </Typography>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" sx={{ py: 1, textAlign: 'center', width: '100%' }}>No notifications</Typography>
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
                  py: 0.75,
                  px: 1.5,
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: notification.isRead ? 'grey.200' : 'primary.main',
                    color: notification.isRead ? 'grey.700' : 'white',
                    width: 32,
                    height: 32
                  }}>
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
                      fontWeight={notification.isRead ? 500 : 600}
                      sx={{ fontSize: '0.8rem', mb: 0.25 }}
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
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          fontSize: '0.75rem',
                          opacity: notification.isRead ? 0.7 : 0.9
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="div"
                        sx={{ mt: 0.25, fontSize: '0.7rem' }}
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
            variant="text"
            size="small"
            sx={{ 
              textTransform: 'none', 
              fontWeight: 500,
              borderRadius: '8px',
              py: 0.5
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default NotificationBadge; 