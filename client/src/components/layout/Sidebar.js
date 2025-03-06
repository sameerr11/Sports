import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaymentIcon from '@mui/icons-material/Payment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { isAdmin } from '../../services/authService';
import './Sidebar.css';

const drawerWidth = 240;

const Sidebar = () => {
    const location = useLocation();
    const admin = isAdmin();

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Players', icon: <PeopleIcon />, path: '/players' },
        { text: 'Teams', icon: <SportsSoccerIcon />, path: '/teams' },
        { text: 'Tournaments', icon: <EmojiEventsIcon />, path: '/tournaments' },
        { text: 'Venues', icon: <LocationOnIcon />, path: '/venues' },
        { text: 'Payments', icon: <PaymentIcon />, path: '/payments' },
        { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
    ];

    const adminItems = [
        { text: 'User Management', icon: <AdminPanelSettingsIcon />, path: '/users' },
        { text: 'Add User', icon: <PersonAddIcon />, path: '/users/new' },
    ];

    return (
        <Drawer
            variant="permanent"
            className="sidebar"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    backgroundColor: '#f5f5f5',
                },
            }}
        >
            <div className="sidebar-header" />
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem 
                        button 
                        key={item.text} 
                        component={Link} 
                        to={item.path}
                        selected={location.pathname === item.path}
                    >
                        <ListItemIcon>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
            
            {admin && (
                <>
                    <Divider />
                    <List>
                        <ListItem>
                            <ListItemText 
                                primary="Administration" 
                                primaryTypographyProps={{ 
                                    variant: 'overline',
                                    color: 'text.secondary'
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
                            >
                                <ListItemIcon>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
        </Drawer>
    );
};

export default Sidebar; 