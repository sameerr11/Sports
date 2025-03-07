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
  alpha
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import NotificationBadge from '../notifications/NotificationBadge';
import { logout, getStoredUser } from '../../services/authService';
import './Navbar.css';

const Navbar = ({ toggleSidebar }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();
    const user = getStoredUser();
    const theme = useTheme();
    
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
            position="static" 
            className="navbar"
            elevation={0}
            sx={{
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`
            }}
        >
            <Toolbar>
                <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{ mr: 2 }}
                    onClick={toggleSidebar}
                    className="menu-button"
                >
                    <MenuIcon />
                </IconButton>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SportsSoccerIcon sx={{ mr: 1, fontSize: 28 }} />
                    <Typography 
                        variant="h6" 
                        component="div" 
                        sx={{ 
                            flexGrow: 1, 
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            display: { xs: 'none', sm: 'block' }
                        }}
                    >
                        Sports Management
                    </Typography>
                </Box>
                
                <Box sx={{ flexGrow: 1 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationBadge />
                    
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            ml: 2,
                            cursor: 'pointer',
                            borderRadius: 1,
                            padding: '4px 8px',
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.common.white, 0.1)
                            }
                        }}
                        onClick={handleMenu}
                    >
                        <Avatar 
                            sx={{ 
                                width: 32, 
                                height: 32,
                                bgcolor: theme.palette.secondary.main,
                                border: `2px solid ${alpha(theme.palette.common.white, 0.8)}`
                            }}
                        >
                            {user?.firstName?.charAt(0) || 'U'}
                        </Avatar>
                        <Box 
                            sx={{ 
                                ml: 1,
                                display: { xs: 'none', md: 'block' }
                            }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                {user?.firstName} {user?.lastName}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8, lineHeight: 1 }}>
                                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                            </Typography>
                        </Box>
                    </Box>
                    
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
                        {user && (
                            <Box sx={{ px: 2, py: 1.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {user.firstName} {user.lastName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {user.email}
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
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Typography>
                            </Box>
                        )}
                        <Divider />
                        <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
                            <ListItemIcon>
                                <PersonIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <Typography variant="body2">Profile</Typography>
                        </MenuItem>
                        <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" color="error" />
                            </ListItemIcon>
                            <Typography variant="body2">Logout</Typography>
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar; 