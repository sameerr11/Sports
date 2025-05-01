import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Avatar,
  Divider,
  CircularProgress,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  PersonOutline,
  PersonAddAlt1,
  PersonOff,
  PeopleAlt,
  TrendingUp
} from '@mui/icons-material';
import { getPlayerStats } from '../../services/userService';

const PlayerStats = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activePlayers: 0,
    inactivePlayers: 0,
    totalPlayers: 0,
    activePercentage: 0,
    inactivePercentage: 0,
    newPlayers: 0
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        setLoading(true);
        const data = await getPlayerStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching player stats:', err);
        setError('Failed to load player statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress size={30} />
        <Typography variant="body2" sx={{ ml: 2 }}>Loading player statistics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 2 }}>
        <Typography variant="body2" color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Card elevation={0} sx={{ borderRadius: 3, height: '100%' }}>
      <CardHeader
        title="Player Statistics"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        avatar={<Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}><PeopleAlt /></Avatar>}
      />
      <Divider sx={{ mx: 3 }} />
      <CardContent>
        <Grid container spacing={3}>
          {/* Total Players */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              elevation={0} 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2), color: theme.palette.primary.main }}>
                  <PeopleAlt />
                </Avatar>
                <Typography variant="h6" sx={{ ml: 2, fontWeight: 600 }}>Total Players</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.primary.dark, mb: 1 }}>
                {stats.totalPlayers}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ color: theme.palette.success.main, fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                  {stats.newPlayers} new this month
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Active Players */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              elevation={0} 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.2)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.2), color: theme.palette.success.main }}>
                  <PersonOutline />
                </Avatar>
                <Typography variant="h6" sx={{ ml: 2, fontWeight: 600 }}>Active Players</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.success.dark, mb: 1 }}>
                {stats.activePlayers}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {stats.activePercentage}% of total
                  </Typography>
                  <Typography variant="body2" color="success.main" fontWeight={600}>
                    {stats.activePercentage}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.activePercentage} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.success.main
                    }
                  }} 
                />
              </Box>
            </Card>
          </Grid>

          {/* Inactive Players */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              elevation={0} 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                background: `linear-gradient(135deg, ${alpha(theme.palette.grey[400], 0.2)} 0%, ${alpha(theme.palette.grey[600], 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.grey[400], 0.1)}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.grey[600], 0.2), color: theme.palette.grey[600] }}>
                  <PersonOff />
                </Avatar>
                <Typography variant="h6" sx={{ ml: 2, fontWeight: 600 }}>Inactive Players</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.grey[700], mb: 1 }}>
                {stats.inactivePlayers}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {stats.inactivePercentage}% of total
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {stats.inactivePercentage}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.inactivePercentage} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.grey[600], 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.grey[600]
                    }
                  }} 
                />
              </Box>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PlayerStats; 