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
    Description,
    Typography, 
    Avatar,
    useTheme,
    alpha
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Event as EventIcon,
    People as PeopleIcon,
    PersonAdd as PersonAddIcon,
    Assignment as AssignmentIcon,
    Feedback as FeedbackIcon,
    HowToReg as HowToRegIcon,
    Settings as SettingsIcon,
    Sports,
    Person as PersonIcon,
    FamilyRestroom as FamilyRestroomIcon,
    Menu as MenuIcon,
    Close as CloseIcon,
    ChevronLeft as ChevronLeftIcon,
    Home as HomeIcon,
    LibraryBooks as LibraryBooksIcon,
    SportsSoccer as SportsSoccerIcon,
    SportsBasketball,
    FitnessCenter as FitnessCenterIcon,
    Fastfood as FastfoodIcon,
    Description as DescriptionIcon,
    HealthAndSafety as HealthAndSafetyIcon,
    Payment as PaymentIcon,
    LocationOn as LocationOnIcon,
    AdminPanelSettings as AdminPanelSettingsIcon,
    Restaurant as RestaurantIcon,
    Support as SupportIcon,
    Receipt as ReceiptIcon,
    Add,
    AttachMoney as AttachMoneyIcon,
    BarChart as BarChartIcon,
    MonetizationOn as MonetizationOnIcon,
    Notifications as NotificationsIcon
} from '@mui/icons-material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { 
    isAdmin, 
    isSupervisor, 
    isCashier, 
    isCoach, 
    isPlayerOnly, 
    isParent,
    isCafeteriaSupervisor,
    isSportsSupervisor,
    isGeneralSupervisor,
    isSupport,
    isAdminOrSupport,
    isAccounting,
    isBookingSupervisor,
    isRevenueManager,
    getStoredUser
} from '../../services/authService';
import './Sidebar.css';

const drawerWidth = 280;

const Sidebar = ({ open, toggleSidebar }) => {
    const location = useLocation();
    const admin = isAdmin();
    const supervisor = isSupervisor();
    const cafeteriaSupervisor = isCafeteriaSupervisor();
    const sportsSupervisor = isSportsSupervisor();
    const bookingSupervisor = isBookingSupervisor();
    const generalSupervisor = isGeneralSupervisor();
    const cashier = isCashier();
    const coach = isCoach();
    const player = isPlayerOnly();
    const parent = isParent();
    const support = isSupport();
    const accounting = isAccounting() && !admin;
    const revenueManager = isRevenueManager() && !admin;
    const theme = useTheme();
    const user = getStoredUser();

    // Regular menu items - not shown to cafeteria supervisors or revenue managers
    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        ...(sportsSupervisor ? [] : [{ text: 'Courts', icon: <LocationOnIcon />, path: '/courts' }]),
        ...(!bookingSupervisor ? [{ text: 'Teams', icon: <Sports />, path: '/teams' }] : []),
        ...(!bookingSupervisor ? [{ text: 'My Bookings', icon: <EventIcon />, path: '/bookings/me' }] : [])
    ];

    const cashierItems = [
        { text: 'Cafeteria POS', icon: <RestaurantIcon />, path: '/cafeteria' }
    ];

    // Cafeteria supervisor only sees cafeteria management
    const cafeteriaSupervisorItems = [
        { text: 'Manage Cafeteria', icon: <FastfoodIcon />, path: '/cafeteria/manage' },
        { text: 'Cafe Dashboard', icon: <DashboardIcon />, path: '/cafeteria/dashboard' }
    ];

    // Sports supervisor items - they handle courts, teams, schedules, and training plans
    const sportsSupervisorItems = [
        { text: 'All Bookings', icon: <EventIcon />, path: '/bookings' },
        { text: 'Team Scheduling', icon: <Sports />, path: '/teams/schedule' },
        { text: 'Training Plans', icon: <AssignmentIcon />, path: '/training-plans' }
    ];

    // General supervisor sees everything
    const generalSupervisorItems = [
        { text: 'All Bookings', icon: <EventIcon />, path: '/bookings' },
        { text: 'Team Scheduling', icon: <Sports />, path: '/teams/schedule' },
        { text: 'Training Plans', icon: <AssignmentIcon />, path: '/training-plans' },
        { text: 'Manage Cafeteria', icon: <FastfoodIcon />, path: '/cafeteria/manage' }
    ];

    // Booking supervisor items - they handle courts and bookings management
    const bookingSupervisorItems = [
        { text: 'Courts', icon: <LocationOnIcon />, path: '/courts' },
        { text: 'All Bookings', icon: <EventIcon />, path: '/bookings' },
        { text: 'Add Court', icon: <Add />, path: '/courts/new' },
    ];

    const adminItems = [
        { text: 'Users', icon: <PeopleIcon />, path: '/users' },
        { text: 'Add User', icon: <PersonAddIcon />, path: '/users/new' },
        { text: 'Feedback', icon: <FeedbackIcon />, path: '/admin/feedback' },
        { text: 'Player Registration', icon: <HowToRegIcon />, path: '/registrations' },
        { text: 'Registration Fees', icon: <ReceiptIcon />, path: '/admin/registration-fees' },
        { text: 'Single Session Fees', icon: <ReceiptIcon />, path: '/admin/single-session-fees' },
        { text: 'Salary Invoices', icon: <PaymentIcon />, path: '/registrations/salary/list' },
        { text: 'User Salary Config', icon: <SettingsIcon />, path: '/admin/user-salary-config' },
        { text: 'Utility Bills', icon: <ReceiptIcon />, path: '/utilities' },
        { text: 'Broadcast', icon: <NotificationsIcon />, path: '/admin/send-notification' },
        { text: 'Player Report', icon: <FamilyRestroomIcon />, path: '/players-with-parents' }
    ];

    const adminRevenueItems = [
        { text: 'Revenue Dashboard', icon: <BarChartIcon />, path: '/revenue/dashboard' },
    ];

    const coachItems = [
        { text: 'Coach Dashboard', icon: <Sports />, path: '/coach' }
    ];

    const playerItems = [
        { text: 'Player Dashboard', icon: <Sports />, path: '/player' }
    ];
    
    const parentItems = [
        { text: 'Parent Dashboard', icon: <FamilyRestroomIcon />, path: '/parent' },
        { text: 'Feedback', icon: <FeedbackIcon />, path: '/parent/feedback' }
    ];

    const supportItems = [
        {
            text: 'Dashboard',
            path: '/support/dashboard',
            icon: <DashboardIcon />
        },
        {
            text: 'Players',
            path: '/users/role/player',
            icon: <PeopleIcon />
        },
        {
            text: 'Attendance Report',
            path: '/support/attendance-report',
            icon: <CalendarMonthIcon />
        },
        {
            text: 'Feedback Management',
            path: '/support/feedback',
            icon: <FeedbackIcon />
        },
        {
            text: 'Documents',
            path: '/support/documents',
            icon: <DescriptionIcon />
        }
    ];

    // New registration items for accounting
    const accountingItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/registrations' },
        { text: 'New Registration', icon: <HowToRegIcon />, path: '/registrations/new' },
        { text: 'Single Session Payment', icon: <PaymentIcon />, path: '/revenue/single-session' },
        { text: 'Salary Invoices', icon: <PaymentIcon />, path: '/registrations/salary/list' },
        { text: 'New Salary Invoice', icon: <PaymentIcon />, path: '/registrations/salary' },
        { text: 'Utility Bills', icon: <ReceiptIcon />, path: '/utilities' },
        { text: 'New Utility Bill', icon: <ReceiptIcon />, path: '/utilities/new' }
    ];

    // Revenue Manager items
    const revenueManagerItems = [
        { text: 'Revenue Dashboard', icon: <BarChartIcon />, path: '/revenue/dashboard' },
        { text: 'Single Session Payment', icon: <PaymentIcon />, path: '/revenue/single-session' },
    ];

    // Function to determine which supervisor items to show
    const getSupervisorItems = () => {
        if (generalSupervisor) return generalSupervisorItems;
        if (cafeteriaSupervisor) return cafeteriaSupervisorItems;
        if (sportsSupervisor) return sportsSupervisorItems;
        if (bookingSupervisor) return bookingSupervisorItems;
        return generalSupervisorItems; // Fallback to general items for backward compatibility
    };

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
                    backgroundColor: '#0c0056',
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
                                bgcolor: alpha(theme.palette.common.white, 0.2),
                                width: 40,
                                height: 40,
                                flexShrink: 0
                            }}
                        >
                            <Sports sx={{ color: '#ec8c14' }} />
                        </Avatar>
                        <Box sx={{ ml: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'white' }}>
                                Sports App
                            </Typography>
                            <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.7) }}>
                                Management System
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={toggleSidebar} className="close-sidebar-btn" sx={{ flexShrink: 0, color: '#ec8c14' }}>
                        <ChevronLeftIcon />
                    </IconButton>
                </Box>
            </Box>
            <Divider sx={{ borderColor: alpha(theme.palette.common.white, 0.1) }} />
            
            {/* Show regular menu items if user is admin/supervisor OR not a cashier/parent/player/coach/support/accounting/revenue_manager */}
            {(admin || (supervisor && !cafeteriaSupervisor && !bookingSupervisor) || (!cashier && !parent && !player && !coach && !cafeteriaSupervisor && !support && !accounting && !revenueManager)) && (
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
                                color: 'white',
                                '&.active': {
                                    backgroundColor: alpha(theme.palette.common.white, 0.15),
                                    color: 'white',
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
                                    backgroundColor: alpha(theme.palette.common.white, 0.1),
                                }
                            }}
                        >
                            <ListItemIcon sx={{ 
                                color: '#ec8c14 !important',
                                minWidth: 40,
                                flexShrink: 0
                            }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={item.text} 
                                primaryTypographyProps={{ 
                                    fontSize: '0.95rem',
                                    fontWeight: location.pathname === item.path ? 700 : 600,
                                    noWrap: true,
                                    color: '#ec8c14'
                                }}
                                sx={{ overflow: 'hidden' }}
                            />
                        </ListItem>
                    ))}
                </List>
            )}

            {/* For cafeteria supervisors, show their specific items directly without the Management header */}
            {cafeteriaSupervisor && (
                <List component="nav" className="sidebar-nav">
                    {cafeteriaSupervisorItems.map((item) => (
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
                                color: 'white',
                                '&.active': {
                                    backgroundColor: alpha(theme.palette.common.white, 0.15),
                                    color: 'white',
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
                                    backgroundColor: alpha(theme.palette.common.white, 0.1),
                                }
                            }}
                        >
                            <ListItemIcon sx={{ 
                                color: '#ec8c14 !important',
                                minWidth: 40,
                                flexShrink: 0
                            }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={item.text} 
                                primaryTypographyProps={{ 
                                    fontSize: '0.95rem',
                                    fontWeight: location.pathname === item.path ? 700 : 600,
                                    noWrap: true,
                                    color: '#ec8c14'
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
                                color: 'white',
                                '&.active': {
                                    backgroundColor: alpha(theme.palette.common.white, 0.15),
                                    color: 'white',
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
                                    backgroundColor: alpha(theme.palette.common.white, 0.1),
                                }
                            }}
                        >
                            <ListItemIcon sx={{ 
                                color: '#ec8c14 !important',
                                minWidth: 40,
                                flexShrink: 0
                            }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={item.text} 
                                primaryTypographyProps={{ 
                                    fontSize: '0.95rem',
                                    fontWeight: location.pathname === item.path ? 700 : 600,
                                    noWrap: true,
                                    color: '#ec8c14'
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
                                    color: 'white',
                                    '&.active': {
                                        backgroundColor: alpha(theme.palette.common.white, 0.15),
                                        color: 'white',
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
                                        backgroundColor: alpha(theme.palette.common.white, 0.1),
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ 
                                    color: '#ec8c14 !important',
                                    minWidth: 40,
                                    flexShrink: 0
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontSize: '0.95rem',
                                        fontWeight: location.pathname === item.path ? 700 : 600,
                                        noWrap: true,
                                        color: '#ec8c14'
                                    }}
                                    sx={{ overflow: 'hidden' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
            
            {/* Only show this section for non-cafeteria supervisors */}
            {supervisor && !cafeteriaSupervisor && (
                <>
                    <Divider sx={{ my: 1 }} />
                    <List component="nav" className="sidebar-nav">
                        <ListItem sx={{ px: 3, pointerEvents: 'none', '&:hover': { backgroundColor: 'transparent' } }}>
                            <ListItemText 
                                primary="Management" 
                                primaryTypographyProps={{ 
                                    variant: 'overline',
                                    color: '#ec8c14',
                                    fontWeight: 700,
                                    noWrap: true
                                }} 
                            />
                        </ListItem>
                        {getSupervisorItems().map((item) => (
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
                                    color: 'white',
                                    '&.active': {
                                        backgroundColor: alpha(theme.palette.common.white, 0.15),
                                        color: 'white',
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
                                        backgroundColor: alpha(theme.palette.common.white, 0.1),
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ 
                                    color: '#ec8c14 !important',
                                    minWidth: 40,
                                    flexShrink: 0
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontSize: '0.95rem',
                                        fontWeight: location.pathname === item.path ? 700 : 600,
                                        noWrap: true,
                                        color: '#ec8c14'
                                    }}
                                    sx={{ overflow: 'hidden' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
            
            {/* Accounting Dashboard Link */}
            {accounting && (
                <>
                    <Divider sx={{ my: 1 }} />
                    <List component="nav" className="sidebar-nav">
                        <ListItem sx={{ px: 3, pointerEvents: 'none', '&:hover': { backgroundColor: 'transparent' } }}>
                            <ListItemText 
                                primary="Registration" 
                                primaryTypographyProps={{ 
                                    variant: 'overline',
                                    color: '#ec8c14',
                                    fontWeight: 700,
                                    noWrap: true
                                }} 
                            />
                        </ListItem>
                        {accountingItems.map((item) => (
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
                                    color: 'white',
                                    '&.active': {
                                        backgroundColor: alpha(theme.palette.common.white, 0.15),
                                        color: 'white',
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
                                        backgroundColor: alpha(theme.palette.common.white, 0.1),
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ 
                                    color: '#ec8c14 !important',
                                    minWidth: 40,
                                    flexShrink: 0
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontSize: '0.95rem',
                                        fontWeight: location.pathname === item.path ? 700 : 600,
                                        noWrap: true,
                                        color: '#ec8c14'
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
                        <ListItem sx={{ px: 3, pointerEvents: 'none', '&:hover': { backgroundColor: 'transparent' } }}>
                            <ListItemText 
                                primary="Administration" 
                                primaryTypographyProps={{ 
                                    variant: 'overline',
                                    color: '#ec8c14',
                                    fontWeight: 700,
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
                                    color: 'white',
                                    '&.active': {
                                        backgroundColor: alpha(theme.palette.common.white, 0.15),
                                        color: 'white',
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
                                        backgroundColor: alpha(theme.palette.common.white, 0.1),
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ 
                                    color: '#ec8c14 !important',
                                    minWidth: 40,
                                    flexShrink: 0
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontSize: '0.95rem',
                                        fontWeight: location.pathname === item.path ? 700 : 600,
                                        noWrap: true,
                                        color: '#ec8c14'
                                    }}
                                    sx={{ overflow: 'hidden' }}
                                />
                            </ListItem>
                        ))}
                    </List>

                    <List component="nav" className="sidebar-nav">
                        <ListItem sx={{ px: 3, pointerEvents: 'none', '&:hover': { backgroundColor: 'transparent' } }}>
                            <ListItemText 
                                primary="Revenue Management" 
                                primaryTypographyProps={{ 
                                    variant: 'overline',
                                    color: '#ec8c14',
                                    fontWeight: 700,
                                    noWrap: true
                                }} 
                            />
                        </ListItem>
                        {adminRevenueItems.map((item) => (
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
                                    color: 'white',
                                    '&.active': {
                                        backgroundColor: alpha(theme.palette.common.white, 0.15),
                                        color: 'white',
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
                                        backgroundColor: alpha(theme.palette.common.white, 0.1),
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ 
                                    color: '#ec8c14 !important',
                                    minWidth: 40,
                                    flexShrink: 0
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontSize: '0.95rem',
                                        fontWeight: location.pathname === item.path ? 700 : 600,
                                        noWrap: true,
                                        color: '#ec8c14'
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
                        <ListItem sx={{ px: 3, pointerEvents: 'none', '&:hover': { backgroundColor: 'transparent' } }}>
                            <ListItemText 
                                primary="Coach Tools" 
                                primaryTypographyProps={{ 
                                    variant: 'overline',
                                    color: '#ec8c14',
                                    fontWeight: 700,
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
                                    borderRadius: '0 20px 20px 0',
                                    mx: 1,
                                    mb: 0.5,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    width: 'calc(100% - 16px)',
                                    color: 'white',
                                    '&.active': {
                                        backgroundColor: alpha(theme.palette.common.white, 0.15),
                                        color: 'white',
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
                                        backgroundColor: alpha(theme.palette.common.white, 0.1),
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ 
                                    color: '#ec8c14 !important',
                                    minWidth: 40,
                                    flexShrink: 0
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontSize: '0.95rem',
                                        fontWeight: location.pathname === item.path ? 700 : 600,
                                        noWrap: true,
                                        color: '#ec8c14'
                                    }}
                                    sx={{ overflow: 'hidden' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
            
            {parent && (
                <>
                    <Divider sx={{ my: 1 }} />
                    <List component="nav" className="sidebar-nav">
                        <ListItem sx={{ px: 3, pointerEvents: 'none', '&:hover': { backgroundColor: 'transparent' } }}>
                            <ListItemText 
                                primary="Parent Dashboard" 
                                primaryTypographyProps={{ 
                                    variant: 'overline',
                                    color: '#ec8c14',
                                    fontWeight: 700,
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
                                    color: 'white',
                                    '&.active': {
                                        backgroundColor: alpha(theme.palette.common.white, 0.15),
                                        color: 'white',
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
                                        backgroundColor: alpha(theme.palette.common.white, 0.1),
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ 
                                    color: '#ec8c14 !important',
                                    minWidth: 40,
                                    flexShrink: 0
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontSize: '0.95rem',
                                        fontWeight: location.pathname === item.path ? 700 : 600,
                                        noWrap: true,
                                        color: '#ec8c14'
                                    }}
                                    sx={{ overflow: 'hidden' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
            
            {/* Support Items */}
            {support && (
                <>
                    <Divider sx={{ my: 1 }} />
                    <List component="nav" className="sidebar-nav">
                        <ListItem sx={{ px: 3, pointerEvents: 'none', '&:hover': { backgroundColor: 'transparent' } }}>
                            <ListItemText 
                                primary="Support Tools" 
                                primaryTypographyProps={{ 
                                    variant: 'overline',
                                    color: '#ec8c14',
                                    fontWeight: 700,
                                    noWrap: true
                                }} 
                            />
                        </ListItem>
                        {supportItems.map((item) => (
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
                                    color: 'white',
                                    '&.active': {
                                        backgroundColor: alpha(theme.palette.common.white, 0.15),
                                        color: 'white',
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
                                        backgroundColor: alpha(theme.palette.common.white, 0.1),
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ 
                                    color: '#ec8c14 !important',
                                    minWidth: 40,
                                    flexShrink: 0
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontSize: '0.95rem',
                                        fontWeight: location.pathname === item.path ? 700 : 600,
                                        noWrap: true,
                                        color: '#ec8c14'
                                    }}
                                    sx={{ overflow: 'hidden' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
            
            {/* Revenue Manager Items */}
            {revenueManager && (
                <>
                    <Divider sx={{ my: 1 }} />
                    <List component="nav" className="sidebar-nav">
                        <ListItem sx={{ px: 3, pointerEvents: 'none', '&:hover': { backgroundColor: 'transparent' } }}>
                            <ListItemText 
                                primary="Revenue Management" 
                                primaryTypographyProps={{ 
                                    variant: 'overline',
                                    color: '#ec8c14',
                                    fontWeight: 700,
                                    noWrap: true
                                }} 
                            />
                        </ListItem>
                        {revenueManagerItems.map((item) => (
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
                                    color: 'white',
                                    '&.active': {
                                        backgroundColor: alpha(theme.palette.common.white, 0.15),
                                        color: 'white',
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
                                        backgroundColor: alpha(theme.palette.common.white, 0.1),
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ 
                                    color: '#ec8c14 !important',
                                    minWidth: 40,
                                    flexShrink: 0
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.text} 
                                    primaryTypographyProps={{ 
                                        fontSize: '0.95rem',
                                        fontWeight: location.pathname === item.path ? 700 : 600,
                                        noWrap: true,
                                        color: '#ec8c14'
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
                <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.5) }}>
                    © 2025 Sports Management
                </Typography>
            </Box>
        </Drawer>
    );
};

export default Sidebar; 