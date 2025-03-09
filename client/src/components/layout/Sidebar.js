import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    Drawer, 
    List, 
    ListItem, 
    ListItemIcon, 
    ListItemText, 
    Divider, 
    IconButton, 
    Box, 
    Typography, 
    Avatar,
    useTheme,
    alpha
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaymentIcon from '@mui/icons-material/Payment';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { isAdmin, isSupervisor, isCashier } from '../../services/authService';
import './Sidebar.css';

const drawerWidth = 280;

const Sidebar = ({ open, toggleSidebar }) => {
    const location = useLocation();
    const admin = isAdmin();
    const supervisor = isSupervisor();
    const cashier = isCashier();
    const theme = useTheme();

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Courts', icon: <LocationOnIcon />, path: '/courts' },
        { text: 'Teams', icon: <SportsSoccerIcon />, path: '/teams' },
        { text: 'My Bookings', icon: <EventIcon />, path: '/bookings/me' },
        { text: 'Tournaments', icon: <EmojiEventsIcon />, path: '/tournaments' },
        { text: 'Payments', icon: <PaymentIcon />, path: '/payments' }
    ];

    const cashierItems = [
        { text: 'Cafeteria POS', icon: <RestaurantIcon />, path: '/cafeteria' }
    ];

    const supervisorItems = [
        { text: 'Manage Cafeteria', icon: <FastfoodIcon />, path: '/cafeteria/manage' }
    ];

    const adminItems = [
        { text: 'All Bookings', icon: <EventIcon />, path: '/bookings' },
        { text: 'User Management', icon: <AdminPanelSettingsIcon />, path: '/users' },
        { text: 'Add User', icon: <PersonAddIcon />, path: '/users/new' },
    ];

    return (
        <Drawer
            variant="persistent"
            className={`sidebar ${open ? 'open' : 'closed'}`}
            open={open}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
                    borderRight: '1px solid rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease-in-out',
                    overflowX: 'hidden'
                },
            }}
        >
            <Box className="sidebar-header">
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    p: 2,
                    width: '100%'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                        <Avatar 
                            sx={{ 
                                bgcolor: theme.palette.primary.main,
                                width: 40,
                                height: 40,
                                flexShrink: 0
                            }}
                        >
                            <SportsSoccerIcon />
                        </Avatar>
                        <Box sx={{ ml: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                Sports App
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Management System
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={toggleSidebar} className="close-sidebar-btn" sx={{ flexShrink: 0 }}>
                        <ChevronLeftIcon />
                    </IconButton>
                </Box>
            </Box>
            <Divider />
            
            {/* Only show regular menu items if not a cashier */}
            {!cashier && (
                <List component="nav" className="sidebar-nav">
                    {menuItems.map((item) => (
                        <ListItem 
                            button 
                            key={item.text} 
                            component={Link} 
                            to={item.path}
                            selected={location.pathname === item.path}
                            className={location.pathname === item.path ? 'active' : ''}
                            sx={{
                                borderRadius: '0 20px 20px 0',
                                mx: 1,
                                mb: 0.5,
                                position: 'relative',
                                overflow: 'hidden',
                                width: 'calc(100% - 16px)',
                                '&.active': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: 4,
                                        backgroundColor: theme.palette.primary.main,
                                        borderRadius: '0 4px 4px 0'
                                    }
                                },
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                }
                            }}
                        >
                            <ListItemIcon sx={{ 
                                color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                                minWidth: 40,
                                flexShrink: 0
                            }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={item.text} 
                                primaryTypographyProps={{ 
                                    fontSize: '0.95rem',
                                    fontWeight: location.pathname === item.path ? 600 : 400,
                                    noWrap: true
                                }}
                                sx={{ overflow: 'hidden' }}
                            />
                        </ListItem>
                    ))}
                </List>
            )}
            
            {cashier && (
                <>
                    <List component="nav" className="sidebar-nav">
                        {cashierItems.map((item) => (
                            <ListItem 
                                button 
                                key={item.text} 
                                component={Link} 
                                to={item.path}
                                selected={location.pathname === item.path}
                                className={location.pathname === item.path ? 'active' : ''}
                                sx={{
                                    borderRadius: '0 20px 20px 0',
                                    mx: 1,
                                    mb: 0.5,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    width: 'calc(100% - 16px)',
                                    '&.active': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: 4,
                                            backgroundColor: theme.palette.primary.main,
                                            borderRadius: '0 4px 4px 0'
                                        }
                                    },
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ 
                                    color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                                    minWidth: 40,
                                    flexShrink: 0
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontSize: '0.95rem',
                                        fontWeight: location.pathname === item.path ? 600 : 400,
                                        noWrap: true
                                    }}
                                    sx={{ overflow: 'hidden' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
            
            {supervisor && (
                <>
                    <Divider sx={{ my: 1 }} />
                    <List component="nav" className="sidebar-nav">
                        <ListItem sx={{ px: 3 }}>
                            <ListItemText 
                                primary="Management" 
                                primaryTypographyProps={{ 
                                    variant: 'overline',
                                    color: 'text.secondary',
                                    fontWeight: 600,
                                    noWrap: true
                                }} 
                            />
                        </ListItem>
                        {supervisorItems.map((item) => (
                            <ListItem 
                                button 
                                key={item.text} 
                                component={Link} 
                                to={item.path}
                                selected={location.pathname === item.path}
                                className={location.pathname === item.path ? 'active' : ''}
                                sx={{
                                    borderRadius: '0 20px 20px 0',
                                    mx: 1,
                                    mb: 0.5,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    width: 'calc(100% - 16px)',
                                    '&.active': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: 4,
                                            backgroundColor: theme.palette.primary.main,
                                            borderRadius: '0 4px 4px 0'
                                        }
                                    },
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ 
                                    color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                                    minWidth: 40,
                                    flexShrink: 0
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontSize: '0.95rem',
                                        fontWeight: location.pathname === item.path ? 600 : 400,
                                        noWrap: true
                                    }}
                                    sx={{ overflow: 'hidden' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
            
            {admin && (
                <>
                    <Divider sx={{ my: 1 }} />
                    <List component="nav" className="sidebar-nav">
                        <ListItem sx={{ px: 3 }}>
                            <ListItemText 
                                primary="Administration" 
                                primaryTypographyProps={{ 
                                    variant: 'overline',
                                    color: 'text.secondary',
                                    fontWeight: 600,
                                    noWrap: true
                                }} 
                            />
                        </ListItem>
                        {adminItems.map((item) => (
                            <ListItem 
                                button 
                                key={item.text} 
                                component={Link} 
                                to={item.path}
                                selected={location.pathname === item.path}
                                className={location.pathname === item.path ? 'active' : ''}
                                sx={{
                                    borderRadius: '0 20px 20px 0',
                                    mx: 1,
                                    mb: 0.5,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    width: 'calc(100% - 16px)',
                                    '&.active': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: 4,
                                            backgroundColor: theme.palette.primary.main,
                                            borderRadius: '0 4px 4px 0'
                                        }
                                    },
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ 
                                    color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                                    minWidth: 40,
                                    flexShrink: 0
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontSize: '0.95rem',
                                        fontWeight: location.pathname === item.path ? 600 : 400,
                                        noWrap: true
                                    }}
                                    sx={{ overflow: 'hidden' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    © 2025 Sports Management
                </Typography>
            </Box>
        </Drawer>
    );
};

export default Sidebar; 