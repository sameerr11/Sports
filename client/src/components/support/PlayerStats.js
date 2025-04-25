import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Tabs,
  Tab,
  Slider,
  useTheme,
  alpha,
  Chip,
  Divider,
  useMediaQuery,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Pagination,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  ArrowBack,
  PersonSearch,
  Person,
  Sports,
  DirectionsRun,
  FitnessCenter,
  BarChart,
  DonutLarge,
  Sort,
  FilterList,
  Group,
  GroupWork,
  SportsBasketball,
  SportsSoccer,
  ExpandMore,
  ViewList,
  ViewModule
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../services/api';
import { getStoredUser } from '../../services/authService';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend
} from 'recharts';

// Custom slider with value display
const StatSlider = ({ name, value, onChange, min = 1, max = 10, step = 1 }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {name}
        </Typography>
        <Chip 
          label={value} 
          size="small" 
          color={value >= 7 ? 'success' : value >= 4 ? 'primary' : 'error'} 
          sx={{ ml: 1 }} 
        />
      </Box>
      <Slider
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        marks
        valueLabelDisplay="auto"
      />
    </Box>
  );
};

// Create radar chart data for player skills
const createRadarData = (sport, sportData) => {
  if (!sportData) return [];
  
  return Object.entries(sportData)
    .filter(([key]) => key !== '_id') // Exclude _id field
    .map(([key, value]) => ({
      subject: key.charAt(0).toUpperCase() + key.slice(1),
      A: value,
      fullMark: 10,
    }));
};

// Create bar chart data for grades
const createBarData = (grades) => {
  if (!grades) return [];
  
  return Object.entries(grades)
    .filter(([key]) => key !== '_id') // Exclude _id field
    .map(([key, value]) => ({
      name: key === "improvement" || key === "nprovement" ? "Progress" : key.charAt(0).toUpperCase() + key.slice(1),
      value: value,
    }));
};

// Player card component for better organization
const PlayerCard = ({ player, stats, sportTypes, theme, handleOpenAddDialog, handleOpenEditDialog, handleOpenDeleteDialog, formatLastUpdated, createRadarData, createBarData }) => {
  const playerStats = stats.filter(
    stat => stat.player === player._id || stat.player._id === player._id
  );
  const hasStats = playerStats.length > 0;
  
  return (
    <Paper sx={{ 
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 3
    }}>
      {/* Player Header - Horizontal */}
      <Box sx={{ 
        p: 2, 
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <Person sx={{ mr: 1, flexShrink: 0 }} />
          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <Typography variant="h6" noWrap>
              {player.firstName} {player.lastName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }} noWrap>
              {player.email}
            </Typography>
          </Box>
        </Box>
        
        <Tooltip title="Add Stats" arrow>
          <Button
            variant="contained"
            size="small" 
            color="secondary"
            onClick={() => handleOpenAddDialog(player, 'Football')}
            startIcon={<Add />}
          >
            Add Stats
          </Button>
        </Tooltip>
      </Box>

      {/* Player Content */}
      <Box sx={{ p: 2, flexGrow: 1 }}>
        {!hasStats ? (
          <Box sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            backgroundColor: alpha(theme.palette.background.default, 0.5)
          }}>
            <BarChart sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.3), mb: 2 }} />
            <Typography variant="h6" gutterBottom>No Stats Recorded</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              This player doesn't have any statistics recorded yet.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>
              {sportTypes.slice(0, 5).map(sport => (
                <Chip
                  key={sport.value}
                  label={sport.label}
                  size="small"
                  variant="outlined"
                  onClick={() => handleOpenAddDialog(player, sport.value)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
              {sportTypes.length > 5 && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => handleOpenAddDialog(player, 'Football')}
                >
                  More Sports...
                </Button>
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {playerStats.map((stat) => (
              <Card 
                key={stat._id} 
                sx={{ 
                  mb: 2, 
                  boxShadow: 2,
                  height: '100%'
                }}
              >
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={stat.sportType} 
                        color="primary" 
                        size="small" 
                      />
                      <Typography variant="h6">
                        {stat.sportType} Stats
                      </Typography>
                    </Box>
                  }
                  subheader={`Last Updated: ${formatLastUpdated(stat.updatedAt)}`}
                  action={
                    <Box>
                      <Tooltip title="Edit" arrow>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenEditDialog(stat._id)}
                          aria-label="Edit"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete" arrow>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleOpenDeleteDialog(stat._id)}
                          aria-label="Delete"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                />
                
                <Divider />
                
                <CardContent>
                  {/* Horizontal layout for physical info, radar chart and grades */}
                  <Grid container spacing={2}>
                    {/* Physical Info */}
                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ 
                        fontWeight: 'bold', 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <FitnessCenter fontSize="small" />
                        Physical Info
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: 1, 
                        background: alpha(theme.palette.primary.light, 0.05),
                        p: 1.5,
                        borderRadius: 1
                      }}>
                        <Typography variant="body2">
                          <strong>Height:</strong> {stat.common.height.value} {stat.common.height.unit}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Weight:</strong> {stat.common.weight.value} {stat.common.weight.unit}
                        </Typography>
                        {stat.common.notes && (
                          <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                            "{stat.common.notes}"
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    
                    {/* Performance Metrics - Radar Chart */}
                    <Grid item xs={12} md={5}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ 
                        fontWeight: 'bold',
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <DonutLarge fontSize="small" />
                        Performance Metrics
                      </Typography>
                      <Box sx={{ height: 200, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart 
                            outerRadius="80%" 
                            data={createRadarData(
                              stat.sportType.toLowerCase(), 
                              stat[stat.sportType.toLowerCase().replace(/\s+/g, '')]
                            )}
                          >
                            <PolarGrid strokeDasharray="3 3" />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis domain={[0, 10]} />
                            <Radar 
                              name="Skills" 
                              dataKey="A" 
                              stroke={theme.palette.primary.main} 
                              fill={theme.palette.primary.main} 
                              fillOpacity={0.6} 
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Grid>
                    
                    {/* Grades - Bar Chart */}
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ 
                        fontWeight: 'bold',
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <BarChart fontSize="small" />
                        Overall Grades
                      </Typography>
                      <Box sx={{ height: 200, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ReBarChart data={createBarData(stat.grades)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 10]} />
                            <YAxis dataKey="name" type="category" width={100} />
                            <ReTooltip />
                            <Bar dataKey="value" fill={theme.palette.secondary.main} barSize={20} />
                          </ReBarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>

                <Divider />
                
                <CardActions sx={{ justifyContent: 'flex-end', p: 1.5 }}>
                  <Button 
                    startIcon={<Edit />}
                    variant="outlined"
                    size="small" 
                    onClick={() => handleOpenEditDialog(stat._id)}
                  >
                    Edit
                  </Button>
                  <Button 
                    startIcon={<Delete />}
                    variant="outlined"
                    size="small" 
                    color="error" 
                    onClick={() => handleOpenDeleteDialog(stat._id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

const PlayerStats = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const user = getStoredUser();
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [stats, setStats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [playersPerPage, setPlayersPerPage] = useState(6);
  
  // Sorting and filtering
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterHasStats, setFilterHasStats] = useState('all'); // 'all', 'withStats', 'withoutStats'
  const [filterSport, setFilterSport] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  // Sorting menu state
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  
  // State for player stats form
  const [formDialog, setFormDialog] = useState({
    open: false,
    isEdit: false,
    playerId: null,
    playerName: '',
    statsId: null,
    sportType: 'Football'
  });
  
  // State for delete confirmation
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    statsId: null
  });
  
  // State for the form data
  const [formData, setFormData] = useState({
    player: '',
    sportType: 'Football',
    common: {
      height: {
        value: 175,
        unit: 'cm'
      },
      weight: {
        value: 70,
        unit: 'kg'
      },
      notes: ''
    },
    football: {
      passing: 5,
      shooting: 5,
      dribbling: 5,
      tackling: 5,
      speed: 5,
      stamina: 5,
      positioning: 5
    },
    cricket: {
      batting: 5,
      bowling: 5,
      fielding: 5,
      wicketKeeping: 5
    },
    basketball: {
      shooting: 5,
      passing: 5,
      dribbling: 5,
      defense: 5,
      rebounding: 5,
      athleticism: 5
    },
    tennis: {
      forehand: 5,
      backhand: 5,
      serve: 5,
      volley: 5,
      movement: 5
    },
    grades: {
      overall: 5,
      improvement: 5,
      teamwork: 5,
      attitude: 5
    }
  });
  
  // Tab state for the form dialog
  const [tabValue, setTabValue] = useState(0);
  
  // Sport Types
  const sportTypes = [
    { value: 'Basketball', label: 'Basketball', icon: <SportsBasketball fontSize="small" /> },
    { value: 'Football', label: 'Football', icon: <SportsSoccer fontSize="small" /> },
    { value: 'Volleyball', label: 'Volleyball' },
    { value: 'Self Defense', label: 'Self Defense' },
    { value: 'Karate', label: 'Karate' },
    { value: 'Gymnastics', label: 'Gymnastics' },
    { value: 'Gym', label: 'Gym' },
    { value: 'Zumba', label: 'Zumba' },
    { value: 'Swimming', label: 'Swimming' },
    { value: 'Ping Pong', label: 'Ping Pong' }
  ];
  
  useEffect(() => {
    fetchPlayersAndStats();
  }, []);
  
  useEffect(() => {
    if (searchTerm) {
      const filtered = players.filter(player =>
        `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPlayers(filtered);
      setPage(1); // Reset to first page when searching
    } else {
      setFilteredPlayers(players);
    }
  }, [players, searchTerm]);
  
  const fetchPlayersAndStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both players and stats in parallel
      const [playersRes, statsRes] = await Promise.all([
        api.get('/users/role/player'),
        api.get('/player-stats')
      ]);
      
      setPlayers(playersRes.data);
      setFilteredPlayers(playersRes.data);
      setStats(statsRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.msg || 'Failed to load data. Please try again.');
      setLoading(false);
    }
  };
  
  // Apply sorting and filtering
  const sortedAndFilteredPlayers = useMemo(() => {
    let result = [...filteredPlayers];
    
    // Apply filtering by stats
    if (filterHasStats === 'withStats') {
      result = result.filter(player => 
        stats.some(stat => stat.player === player._id || stat.player._id === player._id)
      );
    } else if (filterHasStats === 'withoutStats') {
      result = result.filter(player => 
        !stats.some(stat => stat.player === player._id || stat.player._id === player._id)
      );
    }
    
    // Apply filtering by sport
    if (filterSport !== 'all') {
      result = result.filter(player => 
        stats.some(stat => 
          (stat.player === player._id || stat.player._id === player._id) && 
          stat.sportType === filterSport
        )
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortBy === 'email') {
        comparison = a.email.localeCompare(b.email);
      } else if (sortBy === 'statCount') {
        const countA = stats.filter(stat => stat.player === a._id || stat.player._id === a._id).length;
        const countB = stats.filter(stat => stat.player === b._id || stat.player._id === b._id).length;
        comparison = countA - countB;
      } else if (sortBy === 'lastUpdated') {
        const playerStatsA = stats.filter(stat => stat.player === a._id || stat.player._id === a._id);
        const playerStatsB = stats.filter(stat => stat.player === b._id || stat.player._id === b._id);
        
        const latestA = playerStatsA.length ? Math.max(...playerStatsA.map(s => new Date(s.updatedAt).getTime())) : 0;
        const latestB = playerStatsB.length ? Math.max(...playerStatsB.map(s => new Date(s.updatedAt).getTime())) : 0;
        
        comparison = latestA - latestB;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [filteredPlayers, stats, sortBy, sortDirection, filterHasStats, filterSport]);
  
  // Get paginated players
  const paginatedPlayers = useMemo(() => {
    const startIndex = (page - 1) * playersPerPage;
    return sortedAndFilteredPlayers.slice(startIndex, startIndex + playersPerPage);
  }, [sortedAndFilteredPlayers, page, playersPerPage]);
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleSortMenuOpen = (event) => {
    setSortMenuAnchor(event.currentTarget);
  };
  
  const handleSortMenuClose = () => {
    setSortMenuAnchor(null);
  };
  
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };
  
  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };
  
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
    handleSortMenuClose();
  };
  
  const handleFilterHasStatsChange = (value) => {
    setFilterHasStats(value);
    setPage(1); // Reset to first page when filtering
  };
  
  const handleFilterSportChange = (value) => {
    setFilterSport(value);
    setPage(1); // Reset to first page when filtering
  };
  
  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };
  
  // Open the dialog to add new stats
  const handleOpenAddDialog = (player, sportType) => {
    setFormData({
      ...formData,
      player: player._id,
      sportType: sportType
    });
    
    setFormDialog({
      open: true,
      isEdit: false,
      playerId: player._id,
      playerName: `${player.firstName} ${player.lastName}`,
      statsId: null,
      sportType: sportType
    });
    
    setTabValue(0);
  };
  
  // Open the dialog to edit existing stats
  const handleOpenEditDialog = async (statsId) => {
    try {
      setLoading(true);
      const res = await api.get(`/player-stats/${statsId}`);
      const statsData = res.data;
      
      // Find player name
      const player = players.find(p => p._id === statsData.player._id);
      
      setFormData(statsData);
      
      setFormDialog({
        open: true,
        isEdit: true,
        playerId: player._id,
        playerName: `${player.firstName} ${player.lastName}`,
        statsId: statsId,
        sportType: statsData.sportType
      });
      
      setTabValue(0);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stats details:', err);
      setError(err.response?.data?.msg || 'Failed to load stats details. Please try again.');
      setLoading(false);
    }
  };
  
  // Close the form dialog
  const handleCloseDialog = () => {
    setFormDialog({
      open: false,
      isEdit: false,
      playerId: null,
      playerName: '',
      statsId: null,
      sportType: 'Football'
    });
  };
  
  // Handle form input changes for simple values
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (e.g., common.notes)
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle changes for height and weight which are nested more deeply
  const handleMeasurementChange = (parent, field, key, value) => {
    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent],
        [field]: {
          ...formData[parent][field],
          [key]: value
        }
      }
    });
  };
  
  // Handle changes for skill sliders
  const handleSkillChange = (sport, skill, event, newValue) => {
    setFormData({
      ...formData,
      [sport]: {
        ...formData[sport],
        [skill]: newValue
      }
    });
  };
  
  // Handle changes for grade sliders
  const handleGradeChange = (grade, event, newValue) => {
    setFormData({
      ...formData,
      grades: {
        ...formData.grades,
        [grade]: newValue
      }
    });
  };
  
  // Handle tab change in form dialog
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Save the form data (create new or update existing)
  const handleSaveStats = async () => {
    setError(null); // Clear any previous errors
    try {
      let response;
      
      if (formDialog.isEdit) {
        // Update existing stats
        response = await api.put(`/player-stats/${formDialog.statsId}`, formData);
        setSuccess('Player stats updated successfully.');
      } else {
        // Create new stats
        response = await api.post('/player-stats', formData);
        setSuccess('Player stats added successfully.');
      }
      
      // Close the dialog and refresh the data
      handleCloseDialog();
      fetchPlayersAndStats();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving stats:', err);
      const errorMessage = err.response?.data?.msg || 'Failed to save stats. Please try again.';
      setError(errorMessage);
      // Keep dialog open when there's an error so user can try again
    }
  };
  
  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (statsId) => {
    setDeleteDialog({
      open: true,
      statsId
    });
  };
  
  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      statsId: null
    });
  };
  
  // Delete the stats
  const handleDeleteStats = async () => {
    try {
      await api.delete(`/player-stats/${deleteDialog.statsId}`);
      
      // Close the dialog and refresh the data
      handleCloseDeleteDialog();
      fetchPlayersAndStats();
      
      setSuccess('Player stats deleted successfully.');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error deleting stats:', err);
      setError(err.response?.data?.msg || 'Failed to delete stats. Please try again.');
    }
  };
  
  // Get player stats by player ID and sport type
  const getPlayerStatsBySport = (playerId, sportType) => {
    return stats.find(stat => 
      (stat.player === playerId || stat.player._id === playerId) && 
      stat.sportType === sportType
    );
  };
  
  // Format last updated date
  const formatLastUpdated = (dateString) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, mb: 4, gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Player Statistics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage performance metrics for players
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2,
          width: { xs: '100%', sm: 'auto' } 
        }}>
          <TextField
            placeholder="Search players..."
            variant="outlined"
            fullWidth
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { sm: '250px' } }}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Controls and Filters */}
      <Paper elevation={2} sx={{ mb: 3, p: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                startIcon={<Sort />}
                onClick={handleSortMenuOpen}
                size="small"
              >
                Sort
              </Button>
              <Menu
                anchorEl={sortMenuAnchor}
                open={Boolean(sortMenuAnchor)}
                onClose={handleSortMenuClose}
              >
                <MenuItem 
                  onClick={() => handleSortChange('name')}
                  selected={sortBy === 'name'}
                >
                  <Typography variant="body2">
                    Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </Typography>
                </MenuItem>
                <MenuItem 
                  onClick={() => handleSortChange('email')}
                  selected={sortBy === 'email'}
                >
                  <Typography variant="body2">
                    Email {sortBy === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </Typography>
                </MenuItem>
                <MenuItem 
                  onClick={() => handleSortChange('statCount')}
                  selected={sortBy === 'statCount'}
                >
                  <Typography variant="body2">
                    Number of Stats {sortBy === 'statCount' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </Typography>
                </MenuItem>
                <MenuItem 
                  onClick={() => handleSortChange('lastUpdated')}
                  selected={sortBy === 'lastUpdated'}
                >
                  <Typography variant="body2">
                    Last Updated {sortBy === 'lastUpdated' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </Typography>
                </MenuItem>
              </Menu>
              
              <Button 
                variant="outlined" 
                startIcon={<FilterList />}
                onClick={handleFilterMenuOpen}
                size="small"
              >
                Filter
              </Button>
              <Menu
                anchorEl={filterMenuAnchor}
                open={Boolean(filterMenuAnchor)}
                onClose={handleFilterMenuClose}
              >
                <Box sx={{ px: 2, pb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Stats
                  </Typography>
                  <ToggleButtonGroup
                    value={filterHasStats}
                    exclusive
                    onChange={(e, value) => value && handleFilterHasStatsChange(value)}
                    size="small"
                    sx={{ mb: 2 }}
                  >
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="withStats">With Stats</ToggleButton>
                    <ToggleButton value="withoutStats">Without Stats</ToggleButton>
                  </ToggleButtonGroup>
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Sport
                  </Typography>
                  <FormControl fullWidth size="small" sx={{ minWidth: 200 }}>
                    <Select
                      value={filterSport}
                      onChange={(e) => handleFilterSportChange(e.target.value)}
                    >
                      <MenuItem value="all">All Sports</MenuItem>
                      {sportTypes.map((sport) => (
                        <MenuItem key={sport.value} value={sport.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {sport.icon}
                            <Typography>{sport.label}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Menu>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton value="grid" aria-label="grid view">
                  <ViewModule />
                </ToggleButton>
                <ToggleButton value="list" aria-label="list view">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Typography variant="body2" color="text.secondary">
                Showing {paginatedPlayers.length} of {sortedAndFilteredPlayers.length} players
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress />
        </Box>
      ) : filteredPlayers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PersonSearch sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6">No players found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm ? 'Try a different search term' : 'No players are available in the system'}
          </Typography>
        </Paper>
      ) : sortedAndFilteredPlayers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <FilterList sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6">No players match your filters</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Try adjusting your filter settings to see more players.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => {
              setFilterHasStats('all');
              setFilterSport('all');
            }}
          >
            Reset Filters
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedPlayers.map((player) => (
              <Grid item xs={12} key={player._id}>
                <PlayerCard 
                  player={player}
                  stats={stats}
                  sportTypes={sportTypes}
                  theme={theme}
                  handleOpenAddDialog={handleOpenAddDialog}
                  handleOpenEditDialog={handleOpenEditDialog}
                  handleOpenDeleteDialog={handleOpenDeleteDialog}
                  formatLastUpdated={formatLastUpdated}
                  createRadarData={createRadarData}
                  createBarData={createBarData}
                />
              </Grid>
            ))}
          </Grid>
          
          {/* Pagination */}
          {sortedAndFilteredPlayers.length > playersPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={Math.ceil(sortedAndFilteredPlayers.length / playersPerPage)} 
                page={page} 
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Player Stats Dialog */}
      <Dialog 
        open={formDialog.open} 
        onClose={handleCloseDialog}
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {formDialog.isEdit ? 'Edit Player Statistics' : 'Add Player Statistics'}
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              {formDialog.playerName} - {formData.sportType}
            </Typography>
          </Box>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Sport Type</InputLabel>
            <Select
              name="sportType"
              value={formData.sportType}
              label="Sport Type"
              onChange={handleInputChange}
            >
              {sportTypes.map((sport) => (
                <MenuItem key={sport.value} value={sport.value}>
                  {sport.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
            >
              <Tab label="Physical Info" />
              <Tab label="Skills" />
              <Tab label="Grades" />
            </Tabs>
          </Box>
          
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 3 }}>
                  <TextField
                    label="Height"
                    type="number"
                    fullWidth
                    value={formData.common.height.value}
                    onChange={(e) => handleMeasurementChange('common', 'height', 'value', e.target.value)}
                  />
                  <FormControl sx={{ width: '100px' }}>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      label="Unit"
                      value={formData.common.height.unit}
                      onChange={(e) => handleMeasurementChange('common', 'height', 'unit', e.target.value)}
                    >
                      <MenuItem value="cm">cm</MenuItem>
                      <MenuItem value="in">in</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 3 }}>
                  <TextField
                    label="Weight"
                    type="number"
                    fullWidth
                    value={formData.common.weight.value}
                    onChange={(e) => handleMeasurementChange('common', 'weight', 'value', e.target.value)}
                  />
                  <FormControl sx={{ width: '100px' }}>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      label="Unit"
                      value={formData.common.weight.unit}
                      onChange={(e) => handleMeasurementChange('common', 'weight', 'unit', e.target.value)}
                    >
                      <MenuItem value="kg">kg</MenuItem>
                      <MenuItem value="lb">lb</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  multiline
                  rows={4}
                  fullWidth
                  value={formData.common.notes}
                  onChange={(e) => handleMeasurementChange('common', 'notes', '', e.target.value)}
                />
              </Grid>
            </Grid>
          )}
          
          {tabValue === 1 && (
            <>
              {formData.sportType === 'Football' && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <StatSlider
                      name="Passing"
                      value={formData.football.passing}
                      onChange={(e, newValue) => handleSkillChange('football', 'passing', e, newValue)}
                    />
                    <StatSlider
                      name="Shooting"
                      value={formData.football.shooting}
                      onChange={(e, newValue) => handleSkillChange('football', 'shooting', e, newValue)}
                    />
                    <StatSlider
                      name="Dribbling"
                      value={formData.football.dribbling}
                      onChange={(e, newValue) => handleSkillChange('football', 'dribbling', e, newValue)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <StatSlider
                      name="Tackling"
                      value={formData.football.tackling}
                      onChange={(e, newValue) => handleSkillChange('football', 'tackling', e, newValue)}
                    />
                    <StatSlider
                      name="Speed"
                      value={formData.football.speed}
                      onChange={(e, newValue) => handleSkillChange('football', 'speed', e, newValue)}
                    />
                    <StatSlider
                      name="Stamina"
                      value={formData.football.stamina}
                      onChange={(e, newValue) => handleSkillChange('football', 'stamina', e, newValue)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <StatSlider
                      name="Positioning"
                      value={formData.football.positioning}
                      onChange={(e, newValue) => handleSkillChange('football', 'positioning', e, newValue)}
                    />
                  </Grid>
                </Grid>
              )}
              
              {formData.sportType === 'Basketball' && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <StatSlider
                      name="Shooting"
                      value={formData.basketball.shooting}
                      onChange={(e, newValue) => handleSkillChange('basketball', 'shooting', e, newValue)}
                    />
                    <StatSlider
                      name="Passing"
                      value={formData.basketball.passing}
                      onChange={(e, newValue) => handleSkillChange('basketball', 'passing', e, newValue)}
                    />
                    <StatSlider
                      name="Dribbling"
                      value={formData.basketball.dribbling}
                      onChange={(e, newValue) => handleSkillChange('basketball', 'dribbling', e, newValue)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <StatSlider
                      name="Defense"
                      value={formData.basketball.defense}
                      onChange={(e, newValue) => handleSkillChange('basketball', 'defense', e, newValue)}
                    />
                    <StatSlider
                      name="Rebounding"
                      value={formData.basketball.rebounding}
                      onChange={(e, newValue) => handleSkillChange('basketball', 'rebounding', e, newValue)}
                    />
                    <StatSlider
                      name="Athleticism"
                      value={formData.basketball.athleticism}
                      onChange={(e, newValue) => handleSkillChange('basketball', 'athleticism', e, newValue)}
                    />
                  </Grid>
                </Grid>
              )}
              
              {/* Add more sport-specific skill sliders as needed */}
            </>
          )}
          
          {tabValue === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <StatSlider
                  name="Overall Rating"
                  value={formData.grades.overall}
                  onChange={(e, newValue) => handleGradeChange('overall', e, newValue)}
                />
                <StatSlider
                  name="Progress"
                  value={formData.grades.improvement}
                  onChange={(e, newValue) => handleGradeChange('improvement', e, newValue)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <StatSlider
                  name="Teamwork"
                  value={formData.grades.teamwork}
                  onChange={(e, newValue) => handleGradeChange('teamwork', e, newValue)}
                />
                <StatSlider
                  name="Attitude"
                  value={formData.grades.attitude}
                  onChange={(e, newValue) => handleGradeChange('attitude', e, newValue)}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveStats} 
            variant="contained" 
            color="primary"
            startIcon={<Sports />}
          >
            {formDialog.isEdit ? 'Update Stats' : 'Save Stats'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete these player statistics? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteStats} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PlayerStats; 