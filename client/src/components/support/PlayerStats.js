import React, { useState, useEffect } from 'react';
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
  useMediaQuery
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
  DirectionsRun
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../services/api';
import { getStoredUser } from '../../services/authService';

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
    { value: 'Basketball', label: 'Basketball' },
    { value: 'Football', label: 'Football' },
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
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
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
      setError(err.response?.data?.msg || 'Failed to save stats. Please try again.');
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
      stat.player._id === playerId && 
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
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            placeholder="Search players..."
            variant="outlined"
            fullWidth
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
      ) : (
        <Paper sx={{ mb: 4, overflow: 'hidden' }}>
          <TableContainer sx={{ 
            maxHeight: {
              xs: '350px',
              md: '500px'
            },
            overflowX: 'auto' 
          }}>
            <Table stickyHeader sx={{ minWidth: { xs: 650, md: 800 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Player</TableCell>
                  {!isMobile && <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Email</TableCell>}
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Sport Type</TableCell>
                  {!isMobile && <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Last Updated</TableCell>}
                  <TableCell align="center" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Overall Rating</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPlayers.map((player) => (
                  <React.Fragment key={player._id}>
                    <TableRow hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2">
                            {player.firstName} {player.lastName}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      {!isMobile && (
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="body2">{player.email}</Typography>
                        </TableCell>
                      )}
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1 }}>
                          {sportTypes.map((sport) => {
                            const playerStats = stats.find(
                              (stat) => 
                                stat.player === player._id && 
                                stat.sportType === sport.value
                            );
                            
                            return playerStats ? (
                              <Chip
                                key={sport.value}
                                label={sport.label}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ mr: 0.5 }}
                              />
                            ) : (
                              <Chip
                                key={sport.value}
                                label={sport.label}
                                size="small"
                                color="default"
                                variant="outlined"
                                sx={{ 
                                  mr: 0.5, 
                                  opacity: 0.5,
                                  cursor: 'pointer',
                                  display: { xs: playerStats ? 'flex' : 'none', md: 'flex' }
                                }}
                                onClick={() => handleOpenAddDialog(player, sport.value)}
                              />
                            );
                          })}
                        </Box>
                      </TableCell>
                      
                      {!isMobile && (
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {stats.some(stat => stat.player === player._id) ? (
                            <>
                              {formatLastUpdated(
                                stats
                                  .filter(stat => stat.player === player._id)
                                  .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]?.updatedAt
                              )}
                            </>
                          ) : (
                            <Typography variant="body2" color="text.disabled">
                              No stats added
                            </Typography>
                          )}
                        </TableCell>
                      )}
                      
                      <TableCell align="center">
                        {stats.some(stat => stat.player === player._id) ? (
                          <Rating
                            value={Math.max(
                              ...stats
                                .filter(stat => stat.player === player._id)
                                .map(stat => stat.grades.overall)
                            ) / 2}
                            precision={0.5}
                            readOnly
                            size="small"
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            Not rated
                          </Typography>
                        )}
                      </TableCell>
                      
                      <TableCell align="right">
                        <Button
                          startIcon={<Add />}
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenAddDialog(player, 'Football')}
                          sx={{ whiteSpace: 'nowrap', mr: 1, display: { xs: 'none', sm: 'inline-flex' } }}
                        >
                          Add Stats
                        </Button>
                        
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenAddDialog(player, 'Football')}
                          sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                          size="small"
                        >
                          <Add />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    
                    {/* Player stats rows */}
                    {stats
                      .filter(stat => stat.player === player._id)
                      .map(stat => (
                        <TableRow key={stat._id} sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
                          <TableCell 
                            colSpan={isMobile ? 2 : 4} 
                            sx={{ 
                              pl: 7,
                              borderBottom: 0
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Chip 
                                label={stat.sportType} 
                                size="small" 
                                color="primary" 
                                sx={{ mr: 1 }} 
                              />
                              <Typography variant="body2" color="text.secondary">
                                Height: {stat.common.height.value}{stat.common.height.unit} | 
                                Weight: {stat.common.weight.value}{stat.common.weight.unit}
                              </Typography>
                            </Box>
                            
                            {isMobile && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Updated: {formatLastUpdated(stat.updatedAt)}
                              </Typography>
                            )}
                            
                            {stat.common.notes && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.8rem', fontStyle: 'italic' }}>
                                "{stat.common.notes}"
                              </Typography>
                            )}
                          </TableCell>
                          
                          <TableCell 
                            colSpan={isMobile ? 4 : 2} 
                            align="right" 
                            sx={{ 
                              borderBottom: 0,
                              pt: 1, 
                              pb: 1 
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <Button
                                startIcon={<Edit />}
                                variant="outlined"
                                size="small"
                                onClick={() => handleOpenEditDialog(stat._id)}
                                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                              >
                                Edit
                              </Button>
                              
                              <IconButton
                                color="primary"
                                onClick={() => handleOpenEditDialog(stat._id)}
                                sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                                size="small"
                              >
                                <Edit />
                              </IconButton>
                              
                              <Button
                                startIcon={<Delete />}
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleOpenDeleteDialog(stat._id)}
                                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                              >
                                Delete
                              </Button>
                              
                              <IconButton
                                color="error"
                                onClick={() => handleOpenDeleteDialog(stat._id)}
                                sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                                size="small"
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
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
                  name="Improvement"
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