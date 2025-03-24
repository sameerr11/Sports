import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    IconButton, 
    Box, 
    Menu, 
    MenuItem, 
    Divider, 
    ListItemIcon, 
    Avatar,
    Badge,
    useTheme,
    alpha,
    Container
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import NotificationBadge from '../notifications/NotificationBadge';
import { logout, getStoredUser, isCashier } from '../../services/authService';
import ultrasLogo from '../../assets/images/ultras_logo.png';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();
    const user = getStoredUser();
    const theme = useTheme();
    const cashier = isCashier();
    
    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
    };

    const handleProfile = () => {
        navigate('/profile');
        handleClose();
    };

    return (
        <AppBar 
            position="fixed" 
            className="navbar"
            elevation={0}
            sx={{
                backgroundColor: '#0c0056 !important',
                background: '#0c0056 !important',
                borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`
            }}
        >
            <Toolbar>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    width: '100%', 
                    justifyContent: 'space-between' 
                }}>
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1 
                    }}>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            sx={{ 
                                borderRadius: '8px',
                                transition: 'all 0.2s ease'
                            }}
                            onClick={toggleSidebar}
                            className="menu-button"
                        >
                            <MenuIcon />
                        </IconButton>
                        
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            pl: 0.5 
                        }}>
                            {cashier ? (
                                <>
                                    <RestaurantIcon sx={{ mr: 1.5, fontSize: 30 }} />
                                    <Typography 
                                        variant="h6" 
                                        component="div" 
                                        sx={{ 
                                            fontWeight: 700,
                                            letterSpacing: '0.5px'
                                        }}
                                    >
                                        Cafeteria POS
                                    </Typography>
                                </>
                            ) : (
                                <>
                                    <Box 
                                        component="img"
                                        src={ultrasLogo}
                                        alt="Ultras North Lebanon"
                                        sx={{
                                            height: 55,
                                            mr: 1.5,
                                            objectFit: 'contain'
                                        }}
                                    />
                                    <Typography 
                                        variant="h6" 
                                        component="div" 
                                        sx={{ 
                                            fontWeight: 700,
                                            letterSpacing: '0.5px',
                                            display: { xs: 'none', sm: 'block' },
                                            color: alpha(theme.palette.common.white, 0.95)
                                        }}
                                    >
                                        Sports Management
                                    </Typography>
                                </>
                            )}
                        </Box>
                    </Box>
                    
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 2
                    }}>
                        {!cashier && <NotificationBadge />}
                        
                        <Box 
                            sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                cursor: 'pointer',
                                borderRadius: 2,
                                padding: '6px 12px',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.common.white, 0.1)
                                }
                            }}
                            onClick={handleMenu}
                        >
                            <Avatar 
                                sx={{ 
                                    width: 36, 
                                    height: 36,
                                    bgcolor: theme.palette.secondary.main,
                                    fontSize: '1rem',
                                    fontWeight: 600
                                }}
                            >
                                {user?.firstName?.charAt(0) || 'U'}
                            </Avatar>
                            
                            <Box 
                                sx={{ 
                                    ml: 1.5,
                                    display: { xs: 'none', md: 'block' },
                                    maxWidth: { md: 130, lg: 220 },
                                    overflow: 'hidden'
                                }}
                            >
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        fontWeight: 600, 
                                        lineHeight: 1.2,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        color: alpha(theme.palette.common.white, 0.95)
                                    }}
                                >
                                    {user?.firstName} {user?.lastName}
                                </Typography>
                                <Typography 
                                    variant="caption" 
                                    sx={{ 
                                        opacity: 0.8, 
                                        lineHeight: 1,
                                        display: 'block',
                                        whiteSpace: 'nowrap',
                                        color: alpha(theme.palette.common.white, 0.8)
                                    }}
                                >
                                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Toolbar>

            <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        mt: 1,
                        width: 220,
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
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
                    },
                }}
            >
                <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {user?.firstName} {user?.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {user?.email}
                    </Typography>
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            display: 'inline-block',
                            mt: 0.5,
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.primary.main, 0.1)
                        }}
                    >
                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </Typography>
                </Box>
                <Divider />
                {!cashier && (
                    <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
                        <ListItemIcon>
                            <PersonIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <Typography variant="body2">Profile</Typography>
                    </MenuItem>
                )}
                <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <Typography variant="body2" color="error">Logout</Typography>
                </MenuItem>
            </Menu>
        </AppBar>
    );
};

export default Navbar; 