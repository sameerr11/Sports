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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventIcon from '@mui/icons-material/Event';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import { isAdmin, isSupervisor, isCashier, isCoach, isPlayerOnly, isParent } from '../../services/authService';
import './Sidebar.css';

const drawerWidth = 280;

const Sidebar = ({ open, toggleSidebar }) => {
    const location = useLocation();
    const admin = isAdmin();
    const supervisor = isSupervisor();
    const cashier = isCashier();
    const coach = isCoach();
    const player = isPlayerOnly();
    const parent = isParent();
    const theme = useTheme();

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Courts', icon: <LocationOnIcon />, path: '/courts' },
        { text: 'Teams', icon: <SportsSoccerIcon />, path: '/teams' },
        { text: 'My Bookings', icon: <EventIcon />, path: '/bookings/me' }
    ];

    const cashierItems = [
        { text: 'Cafeteria POS', icon: <RestaurantIcon />, path: '/cafeteria' }
    ];

    const supervisorItems = [
        { text: 'All Bookings', icon: <EventIcon />, path: '/bookings' },
        { text: 'Team Scheduling', icon: <SportsSoccerIcon />, path: '/teams/schedule' },
        { text: 'Training Plans', icon: <AssignmentIcon />, path: '/training-plans' },
        { text: 'Manage Cafeteria', icon: <FastfoodIcon />, path: '/cafeteria/manage' }
    ];

    const adminItems = [
        { text: 'User Management', icon: <AdminPanelSettingsIcon />, path: '/users' },
        { text: 'Add User', icon: <PersonAddIcon />, path: '/users/new' },
    ];

    const coachItems = [
        { text: 'Coach Dashboard', icon: <FitnessCenterIcon />, path: '/coach' }
    ];

    const playerItems = [
        { text: 'Player Dashboard', icon: <PersonIcon />, path: '/player' }
    ];
    
    const parentItems = [
        { text: 'Parent Dashboard', icon: <FamilyRestroomIcon />, path: '/parent' }
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
            
            {/* Show regular menu items if user is admin/supervisor OR not a cashier/parent/player/coach */}
            {(admin || supervisor || (!cashier && !parent && !player && !coach)) && (
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
            
            {/* Player Dashboard Link */}
            {player && (
                <List component="nav" className="sidebar-nav">
                    {playerItems.map((item) => (
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
                                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                                    color: theme.palette.secondary.main,
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: 4,
                                        backgroundColor: theme.palette.secondary.main,
                                        borderRadius: '0 4px 4px 0'
                                    }
                                },
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                                }
                            }}
                        >
                            <ListItemIcon sx={{ 
                                color: location.pathname === item.path ? theme.palette.secondary.main : 'inherit',
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
            
            {/* Coach Items */}
            {coach && !supervisor && !admin && (
                <>
                    <Divider sx={{ my: 1 }} />
                    <List component="nav" className="sidebar-nav">
                        <ListItem sx={{ px: 3 }}>
                            <ListItemText 
                                primary="Coach Tools" 
                                primaryTypographyProps={{ 
                                    variant: 'overline',
                                    color: 'text.secondary',
                                    fontWeight: 600,
                                    noWrap: true
                                }} 
                            />
                        </ListItem>
                        {coachItems.map((item) => (
                            <ListItem 
                                button 
                                key={item.text} 
                                component={Link} 
                                to={item.path}
                                selected={location.pathname === item.path || 
                                          (item.path.includes('?tab=') && 
                                           location.pathname === '/coach')}
                                className={location.pathname === item.path ? 'active' : ''}
                                sx={{ 
                                    pl: 3,
                                    py: 1,
                                    '&.active, &.Mui-selected': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        borderRight: `3px solid ${theme.palette.primary.main}`,
                                        '& .MuiListItemIcon-root': {
                                            color: theme.palette.primary.main
                                        },
                                        '& .MuiListItemText-root': {
                                            '& .MuiTypography-root': {
                                                fontWeight: 600,
                                                color: theme.palette.primary.main
                                            }
                                        }
                                    },
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.05)
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
            
            {parent && (
                <>
                    <Divider sx={{ my: 1 }} />
                    <List component="nav" className="sidebar-nav">
                        <ListItem sx={{ px: 3 }}>
                            <ListItemText 
                                primary="Parent Dashboard" 
                                primaryTypographyProps={{ 
                                    variant: 'overline',
                                    color: 'text.secondary',
                                    fontWeight: 600,
                                    noWrap: true
                                }} 
                            />
                        </ListItem>
                        {parentItems.map((item) => (
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