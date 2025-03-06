import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaymentIcon from '@mui/icons-material/Payment';
import './Sidebar.css';

const drawerWidth = 240;

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Players', icon: <PeopleIcon />, path: '/players' },
    { text: 'Teams', icon: <SportsSoccerIcon />, path: '/teams' },
    { text: 'Tournaments', icon: <EmojiEventsIcon />, path: '/tournaments' },
    { text: 'Venues', icon: <LocationOnIcon />, path: '/venues' },
    { text: 'Payments', icon: <PaymentIcon />, path: '/payments' },
];

const Sidebar = () => {
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
                    <ListItem button key={item.text}>
                        <ListItemIcon>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};

export default Sidebar; 