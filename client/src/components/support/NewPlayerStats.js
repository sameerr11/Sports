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
    basketball: {
      shooting: 5,
      passing: 5,
      dribbling: 5,
      defense: 5,
      rebounding: 5,
      athleticism: 5
    },
    volleyball: {
      serving: 5,
      passing: 5,
      setting: 5,
      attacking: 5,
      blocking: 5,
      digging: 5
    },
    selfDefense: {
      technique: 5,
      awareness: 5,
      reaction: 5,
      discipline: 5
    },
    karate: {
      kata: 5,
      kumite: 5,
      technique: 5,
      discipline: 5,
      speed: 5
    },
    gymnastics: {
      flexibility: 5,
      balance: 5,
      strength: 5,
      coordination: 5,
      execution: 5
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
      
      setFormData({
        player: statsData.player._id,
        sportType: statsData.sportType,
        common: statsData.common || formData.common,
        basketball: statsData.basketball || formData.basketball,
        football: statsData.football || formData.football,
        volleyball: statsData.volleyball || formData.volleyball,
        selfDefense: statsData.selfDefense || formData.selfDefense,
        karate: statsData.karate || formData.karate,
        gymnastics: statsData.gymnastics || formData.gymnastics,
        gym: statsData.gym || formData.gym,
        zumba: statsData.zumba || formData.zumba,
        swimming: statsData.swimming || formData.swimming,
        pingPong: statsData.pingPong || formData.pingPong,
        grades: statsData.grades || formData.grades
      });
      
      setFormDialog({
        open: true,
        isEdit: true,
        playerId: statsData.player._id,
        playerName: player ? `${player.firstName} ${player.lastName}` : 'Unknown Player',
        statsId: statsData._id,
        sportType: statsData.sportType
      });
      
      setTabValue(0);
      setLoading(false);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load player stats. Please try again.');
      setLoading(false);
    }
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setFormDialog({
      ...formDialog,
      open: false
    });
    
    // Reset form data
    setFormData({
      ...formData,
      player: '',
      sportType: 'Football'
    });
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'sportType') {
      setFormDialog({
        ...formDialog,
        sportType: value
      });
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle measurement changes (height, weight)
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
  
  // Handle skill rating changes
  const handleSkillChange = (sport, skill, event, newValue) => {
    setFormData({
      ...formData,
      [sport]: {
        ...formData[sport],
        [skill]: newValue
      }
    });
  };
  
  // Handle grade changes
  const handleGradeChange = (grade, event, newValue) => {
    setFormData({
      ...formData,
      grades: {
        ...formData.grades,
        [grade]: newValue
      }
    });
  };
  
  // Handle tab change
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
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {sportTypes.map((sport) => {
                            // Find if player has stats for this sport
                            const playerStats = getPlayerStatsBySport(player._id, sport.value);
                            
                            return (
                              <Chip
                                key={sport.value}
                                label={sport.label}
                                size="small"
                                color={playerStats ? "primary" : "default"}
                                variant={playerStats ? "filled" : "outlined"}
                                onClick={() => {
                                  if (playerStats) {
                                    handleOpenEditDialog(playerStats._id);
                                  } else {
                                    handleOpenAddDialog(player, sport.value);
                                  }
                                }}
                                sx={{ cursor: 'pointer' }}
                              />
                            );
                          })}
                        </Box>
                      </TableCell>
                      
                      {!isMobile && (
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" color="text.secondary">
                            {formatLastUpdated(player.updatedAt)}
                          </Typography>
                        </TableCell>
                      )}
                      
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Rating
                            value={stats.find(s => s.player._id === player._id)?.grades?.overall || 0}
                            precision={0.5}
                            readOnly
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell align="right">
                        <Box>
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            onClick={() => handleOpenAddDialog(player, 'Football')}
                            startIcon={<Add />}
                            sx={{ ml: 1 }}
                          >
                            {isMobile ? '' : 'Add Stats'}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      {/* Player Stats Form Dialog */}
      <Dialog 
        open={formDialog.open} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Sports sx={{ mr: 1, color: 'primary.main' }} />
            {formDialog.isEdit ? 'Edit Player Stats' : 'Add Player Stats'}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Player: {formDialog.playerName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sport: {formDialog.sportType}
            </Typography>
          </Box>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="stats tabs">
              <Tab label="Common" />
              <Tab label="Sport Skills" />
              <Tab label="Grades" />
            </Tabs>
          </Box>
          
          {/* Tab 1: Common Stats */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Height</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    type="number"
                    label="Value"
                    value={formData.common.height.value}
                    onChange={(e) => handleMeasurementChange('common', 'height', 'value', parseFloat(e.target.value))}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 2, width: '120px' }}
                  />
                  <FormControl size="small" sx={{ width: '100px' }}>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={formData.common.height.unit}
                      onChange={(e) => handleMeasurementChange('common', 'height', 'unit', e.target.value)}
                      label="Unit"
                    >
                      <MenuItem value="cm">cm</MenuItem>
                      <MenuItem value="ft">ft</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Weight</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    type="number"
                    label="Value"
                    value={formData.common.weight.value}
                    onChange={(e) => handleMeasurementChange('common', 'weight', 'value', parseFloat(e.target.value))}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 2, width: '120px' }}
                  />
                  <FormControl size="small" sx={{ width: '100px' }}>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={formData.common.weight.unit}
                      onChange={(e) => handleMeasurementChange('common', 'weight', 'unit', e.target.value)}
                      label="Unit"
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
                  value={formData.common.notes || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    common: {
                      ...formData.common,
                      notes: e.target.value
                    }
                  })}
                  fullWidth
                  variant="outlined"
                  placeholder="Add any additional notes about the player..."
                />
              </Grid>
            </Grid>
          )}
          
          {/* Tab 2: Sport Skills */}
          {tabValue === 1 && (
            <Grid container spacing={3}>
              {formDialog.sportType === 'Football' && (
                <>
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
                  <StatSlider
                    name="Positioning"
                    value={formData.football.positioning}
                    onChange={(e, newValue) => handleSkillChange('football', 'positioning', e, newValue)}
                  />
                </>
              )}
              
              {formDialog.sportType === 'Basketball' && (
                <>
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
                </>
              )}

              {formDialog.sportType === 'Volleyball' && (
                <>
                  <StatSlider
                    name="Serving"
                    value={formData.volleyball.serving}
                    onChange={(e, newValue) => handleSkillChange('volleyball', 'serving', e, newValue)}
                  />
                  <StatSlider
                    name="Passing"
                    value={formData.volleyball.passing}
                    onChange={(e, newValue) => handleSkillChange('volleyball', 'passing', e, newValue)}
                  />
                  <StatSlider
                    name="Setting"
                    value={formData.volleyball.setting}
                    onChange={(e, newValue) => handleSkillChange('volleyball', 'setting', e, newValue)}
                  />
                  <StatSlider
                    name="Attacking"
                    value={formData.volleyball.attacking}
                    onChange={(e, newValue) => handleSkillChange('volleyball', 'attacking', e, newValue)}
                  />
                  <StatSlider
                    name="Blocking"
                    value={formData.volleyball.blocking}
                    onChange={(e, newValue) => handleSkillChange('volleyball', 'blocking', e, newValue)}
                  />
                  <StatSlider
                    name="Digging"
                    value={formData.volleyball.digging}
                    onChange={(e, newValue) => handleSkillChange('volleyball', 'digging', e, newValue)}
                  />
                </>
              )}

              {formDialog.sportType === 'Self Defense' && (
                <>
                  <StatSlider
                    name="Technique"
                    value={formData.selfDefense.technique}
                    onChange={(e, newValue) => handleSkillChange('selfDefense', 'technique', e, newValue)}
                  />
                  <StatSlider
                    name="Awareness"
                    value={formData.selfDefense.awareness}
                    onChange={(e, newValue) => handleSkillChange('selfDefense', 'awareness', e, newValue)}
                  />
                  <StatSlider
                    name="Reaction"
                    value={formData.selfDefense.reaction}
                    onChange={(e, newValue) => handleSkillChange('selfDefense', 'reaction', e, newValue)}
                  />
                  <StatSlider
                    name="Discipline"
                    value={formData.selfDefense.discipline}
                    onChange={(e, newValue) => handleSkillChange('selfDefense', 'discipline', e, newValue)}
                  />
                </>
              )}

              {formDialog.sportType === 'Karate' && (
                <>
                  <StatSlider
                    name="Kata"
                    value={formData.karate.kata}
                    onChange={(e, newValue) => handleSkillChange('karate', 'kata', e, newValue)}
                  />
                  <StatSlider
                    name="Kumite"
                    value={formData.karate.kumite}
                    onChange={(e, newValue) => handleSkillChange('karate', 'kumite', e, newValue)}
                  />
                  <StatSlider
                    name="Technique"
                    value={formData.karate.technique}
                    onChange={(e, newValue) => handleSkillChange('karate', 'technique', e, newValue)}
                  />
                  <StatSlider
                    name="Discipline"
                    value={formData.karate.discipline}
                    onChange={(e, newValue) => handleSkillChange('karate', 'discipline', e, newValue)}
                  />
                  <StatSlider
                    name="Speed"
                    value={formData.karate.speed}
                    onChange={(e, newValue) => handleSkillChange('karate', 'speed', e, newValue)}
                  />
                </>
              )}

              {formDialog.sportType === 'Gymnastics' && (
                <>
                  <StatSlider
                    name="Flexibility"
                    value={formData.gymnastics.flexibility}
                    onChange={(e, newValue) => handleSkillChange('gymnastics', 'flexibility', e, newValue)}
                  />
                  <StatSlider
                    name="Balance"
                    value={formData.gymnastics.balance}
                    onChange={(e, newValue) => handleSkillChange('gymnastics', 'balance', e, newValue)}
                  />
                  <StatSlider
                    name="Strength"
                    value={formData.gymnastics.strength}
                    onChange={(e, newValue) => handleSkillChange('gymnastics', 'strength', e, newValue)}
                  />
                  <StatSlider
                    name="Coordination"
                    value={formData.gymnastics.coordination}
                    onChange={(e, newValue) => handleSkillChange('gymnastics', 'coordination', e, newValue)}
                  />
                  <StatSlider
                    name="Execution"
                    value={formData.gymnastics.execution}
                    onChange={(e, newValue) => handleSkillChange('gymnastics', 'execution', e, newValue)}
                  />
                </>
              )}
            </Grid>
          )}
          
          {/* Tab 3: Grades */}
          {tabValue === 2 && (
            <Grid container spacing={3}>
              <StatSlider
                name="Overall Performance"
                value={formData.grades.overall}
                onChange={(e, newValue) => handleGradeChange('overall', e, newValue)}
              />
              <StatSlider
                name="Improvement"
                value={formData.grades.improvement}
                onChange={(e, newValue) => handleGradeChange('improvement', e, newValue)}
              />
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
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveStats} 
            variant="contained" 
            color="primary"
            startIcon={formDialog.isEdit ? <Edit /> : <Add />}
          >
            {formDialog.isEdit ? 'Update Stats' : 'Save Stats'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete these player stats? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary" variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleDeleteStats} color="error" variant="contained" startIcon={<Delete />}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PlayerStats; 