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
  Avatar 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationBadge from '../notifications/NotificationBadge';
import { logout, getStoredUser } from '../../services/authService';
import './Navbar.css';

const Navbar = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();
    const user = getStoredUser();
    
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
        <AppBar position="static" className="navbar">
            <Toolbar>
                <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Sports Management System
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationBadge />
                    
                    <IconButton
                        size="large"
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        color="inherit"
                    >
                        <AccountCircle />
                    </IconButton>
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
                    >
                        {user && (
                            <Box sx={{ px: 2, py: 1 }}>
                                <Typography variant="subtitle1">
                                    {user.firstName} {user.lastName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {user.email}
                                </Typography>
                                <Typography variant="caption" color="primary">
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Typography>
                            </Box>
                        )}
                        <Divider />
                        <MenuItem onClick={handleProfile}>
                            <ListItemIcon>
                                <PersonIcon fontSize="small" />
                            </ListItemIcon>
                            Profile
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            Logout
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar; 