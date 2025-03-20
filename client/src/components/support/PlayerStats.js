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
  Divider
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
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          to="/"
          startIcon={<ArrowBack />}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Player Stats Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Add, update, and track player statistics and performance metrics.
        </Typography>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Search Players"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Player</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Basketball Stats</TableCell>
                  <TableCell>Football Stats</TableCell>
                  <TableCell>Volleyball Stats</TableCell>
                  <TableCell>Swimming Stats</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPlayers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No players found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlayers.map((player) => {
                    const basketballStats = getPlayerStatsBySport(player._id, 'Basketball');
                    const footballStats = getPlayerStatsBySport(player._id, 'Football');
                    const volleyballStats = getPlayerStatsBySport(player._id, 'Volleyball');
                    const swimmingStats = getPlayerStatsBySport(player._id, 'Swimming');
                    
                    return (
                      <TableRow key={player._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Person sx={{ mr: 1, color: 'primary.main' }} />
                            {player.firstName} {player.lastName}
                          </Box>
                        </TableCell>
                        <TableCell>{player.email}</TableCell>
                        
                        {/* Basketball Stats */}
                        <TableCell>
                          {basketballStats ? (
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Rating 
                                  value={basketballStats.grades.overall} 
                                  readOnly 
                                  max={10}
                                  size="small"
                                />
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  ({basketballStats.grades.overall}/10)
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  onClick={() => handleOpenEditDialog(basketballStats._id)}
                                  startIcon={<Edit />}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="error"
                                  onClick={() => handleOpenDeleteDialog(basketballStats._id)}
                                  startIcon={<Delete />}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Button 
                              variant="contained" 
                              size="small"
                              onClick={() => handleOpenAddDialog(player, 'Basketball')}
                              startIcon={<Add />}
                            >
                              Add Stats
                            </Button>
                          )}
                        </TableCell>
                        
                        {/* Football Stats */}
                        <TableCell>
                          {footballStats ? (
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Rating 
                                  value={footballStats.grades.overall} 
                                  readOnly 
                                  max={10}
                                  size="small"
                                />
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  ({footballStats.grades.overall}/10)
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  onClick={() => handleOpenEditDialog(footballStats._id)}
                                  startIcon={<Edit />}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="error"
                                  onClick={() => handleOpenDeleteDialog(footballStats._id)}
                                  startIcon={<Delete />}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Button 
                              variant="contained" 
                              size="small"
                              onClick={() => handleOpenAddDialog(player, 'Football')}
                              startIcon={<Add />}
                            >
                              Add Stats
                            </Button>
                          )}
                        </TableCell>
                        
                        {/* Volleyball Stats */}
                        <TableCell>
                          {volleyballStats ? (
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Rating 
                                  value={volleyballStats.grades.overall} 
                                  readOnly 
                                  max={10}
                                  size="small"
                                />
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  ({volleyballStats.grades.overall}/10)
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  onClick={() => handleOpenEditDialog(volleyballStats._id)}
                                  startIcon={<Edit />}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="error"
                                  onClick={() => handleOpenDeleteDialog(volleyballStats._id)}
                                  startIcon={<Delete />}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Button 
                              variant="contained" 
                              size="small"
                              onClick={() => handleOpenAddDialog(player, 'Volleyball')}
                              startIcon={<Add />}
                            >
                              Add Stats
                            </Button>
                          )}
                        </TableCell>
                        
                        {/* Swimming Stats */}
                        <TableCell>
                          {swimmingStats ? (
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Rating 
                                  value={swimmingStats.grades.overall} 
                                  readOnly 
                                  max={10}
                                  size="small"
                                />
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  ({swimmingStats.grades.overall}/10)
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  onClick={() => handleOpenEditDialog(swimmingStats._id)}
                                  startIcon={<Edit />}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="error"
                                  onClick={() => handleOpenDeleteDialog(swimmingStats._id)}
                                  startIcon={<Delete />}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Button 
                              variant="contained" 
                              size="small"
                              onClick={() => handleOpenAddDialog(player, 'Swimming')}
                              startIcon={<Add />}
                            >
                              Add Stats
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* Player Stats Form Dialog */}
      <Dialog 
        open={formDialog.open} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {formDialog.isEdit ? 'Edit' : 'Add'} Stats for {formDialog.playerName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="stats tabs">
              <Tab label="Basic Info" />
              <Tab label="Sport Specific" />
              <Tab label="General Grades" />
            </Tabs>
          </Box>
          
          {/* Basic Info Tab */}
          {tabValue === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Sport Type: <strong>{formDialog.sportType}</strong>
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>Height</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={8}>
                    <TextField
                      label="Value"
                      type="number"
                      fullWidth
                      value={formData.common.height.value}
                      onChange={(e) => handleMeasurementChange(
                        'common', 'height', 'value', Number(e.target.value)
                      )}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth>
                      <InputLabel>Unit</InputLabel>
                      <Select
                        value={formData.common.height.unit}
                        onChange={(e) => handleMeasurementChange(
                          'common', 'height', 'unit', e.target.value
                        )}
                        label="Unit"
                      >
                        <MenuItem value="cm">cm</MenuItem>
                        <MenuItem value="ft">ft</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom>Weight</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={8}>
                    <TextField
                      label="Value"
                      type="number"
                      fullWidth
                      value={formData.common.weight.value}
                      onChange={(e) => handleMeasurementChange(
                        'common', 'weight', 'value', Number(e.target.value)
                      )}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth>
                      <InputLabel>Unit</InputLabel>
                      <Select
                        value={formData.common.weight.unit}
                        onChange={(e) => handleMeasurementChange(
                          'common', 'weight', 'unit', e.target.value
                        )}
                        label="Unit"
                      >
                        <MenuItem value="kg">kg</MenuItem>
                        <MenuItem value="lb">lb</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  multiline
                  rows={4}
                  fullWidth
                  name="common.notes"
                  value={formData.common.notes}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
            </Grid>
          )}
          
          {/* Sport Specific Tab */}
          {tabValue === 1 && (
            <Box sx={{ py: 1 }}>
              {formData.sportType === 'Football' && (
                <>
                  <Typography variant="h6" gutterBottom>Football Skills</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <StatSlider 
                        name="Passing" 
                        value={formData.football.passing} 
                        onChange={(e, v) => handleSkillChange('football', 'passing', e, v)} 
                      />
                      <StatSlider 
                        name="Shooting" 
                        value={formData.football.shooting} 
                        onChange={(e, v) => handleSkillChange('football', 'shooting', e, v)} 
                      />
                      <StatSlider 
                        name="Dribbling" 
                        value={formData.football.dribbling} 
                        onChange={(e, v) => handleSkillChange('football', 'dribbling', e, v)} 
                      />
                      <StatSlider 
                        name="Tackling" 
                        value={formData.football.tackling} 
                        onChange={(e, v) => handleSkillChange('football', 'tackling', e, v)} 
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StatSlider 
                        name="Speed" 
                        value={formData.football.speed} 
                        onChange={(e, v) => handleSkillChange('football', 'speed', e, v)} 
                      />
                      <StatSlider 
                        name="Stamina" 
                        value={formData.football.stamina} 
                        onChange={(e, v) => handleSkillChange('football', 'stamina', e, v)} 
                      />
                      <StatSlider 
                        name="Positioning" 
                        value={formData.football.positioning} 
                        onChange={(e, v) => handleSkillChange('football', 'positioning', e, v)} 
                      />
                    </Grid>
                  </Grid>
                </>
              )}
              
              {formData.sportType === 'Volleyball' && (
                <>
                  <Typography variant="h6" gutterBottom>Volleyball Skills</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <StatSlider 
                        name="Serving" 
                        value={formData.volleyball?.serving || 5} 
                        onChange={(e, v) => handleSkillChange('volleyball', 'serving', e, v)} 
                      />
                      <StatSlider 
                        name="Passing" 
                        value={formData.volleyball?.passing || 5} 
                        onChange={(e, v) => handleSkillChange('volleyball', 'passing', e, v)} 
                      />
                      <StatSlider 
                        name="Setting" 
                        value={formData.volleyball?.setting || 5} 
                        onChange={(e, v) => handleSkillChange('volleyball', 'setting', e, v)} 
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StatSlider 
                        name="Attacking" 
                        value={formData.volleyball?.attacking || 5} 
                        onChange={(e, v) => handleSkillChange('volleyball', 'attacking', e, v)} 
                      />
                      <StatSlider 
                        name="Blocking" 
                        value={formData.volleyball?.blocking || 5} 
                        onChange={(e, v) => handleSkillChange('volleyball', 'blocking', e, v)} 
                      />
                      <StatSlider 
                        name="Digging" 
                        value={formData.volleyball?.digging || 5} 
                        onChange={(e, v) => handleSkillChange('volleyball', 'digging', e, v)} 
                      />
                    </Grid>
                  </Grid>
                </>
              )}
              
              {formData.sportType === 'Basketball' && (
                <>
                  <Typography variant="h6" gutterBottom>Basketball Skills</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <StatSlider 
                        name="Shooting" 
                        value={formData.basketball.shooting} 
                        onChange={(e, v) => handleSkillChange('basketball', 'shooting', e, v)} 
                      />
                      <StatSlider 
                        name="Passing" 
                        value={formData.basketball.passing} 
                        onChange={(e, v) => handleSkillChange('basketball', 'passing', e, v)} 
                      />
                      <StatSlider 
                        name="Dribbling" 
                        value={formData.basketball.dribbling} 
                        onChange={(e, v) => handleSkillChange('basketball', 'dribbling', e, v)} 
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StatSlider 
                        name="Defense" 
                        value={formData.basketball.defense} 
                        onChange={(e, v) => handleSkillChange('basketball', 'defense', e, v)} 
                      />
                      <StatSlider 
                        name="Rebounding" 
                        value={formData.basketball.rebounding} 
                        onChange={(e, v) => handleSkillChange('basketball', 'rebounding', e, v)} 
                      />
                      <StatSlider 
                        name="Athleticism" 
                        value={formData.basketball.athleticism} 
                        onChange={(e, v) => handleSkillChange('basketball', 'athleticism', e, v)} 
                      />
                    </Grid>
                  </Grid>
                </>
              )}
              
              {formData.sportType === 'Swimming' && (
                <>
                  <Typography variant="h6" gutterBottom>Swimming Skills</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <StatSlider 
                        name="Freestyle" 
                        value={formData.swimming?.freestyle || 5} 
                        onChange={(e, v) => handleSkillChange('swimming', 'freestyle', e, v)} 
                      />
                      <StatSlider 
                        name="Backstroke" 
                        value={formData.swimming?.backstroke || 5} 
                        onChange={(e, v) => handleSkillChange('swimming', 'backstroke', e, v)} 
                      />
                      <StatSlider 
                        name="Breaststroke" 
                        value={formData.swimming?.breaststroke || 5} 
                        onChange={(e, v) => handleSkillChange('swimming', 'breaststroke', e, v)} 
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StatSlider 
                        name="Butterfly" 
                        value={formData.swimming?.butterfly || 5} 
                        onChange={(e, v) => handleSkillChange('swimming', 'butterfly', e, v)} 
                      />
                      <StatSlider 
                        name="Endurance" 
                        value={formData.swimming?.endurance || 5} 
                        onChange={(e, v) => handleSkillChange('swimming', 'endurance', e, v)} 
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          )}
          
          {/* General Grades Tab */}
          {tabValue === 2 && (
            <Box sx={{ py: 1 }}>
              <Typography variant="h6" gutterBottom>General Assessment</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <StatSlider 
                    name="Overall Performance" 
                    value={formData.grades.overall} 
                    onChange={(e, v) => handleGradeChange('overall', e, v)} 
                  />
                  <StatSlider 
                    name="Improvement" 
                    value={formData.grades.improvement} 
                    onChange={(e, v) => handleGradeChange('improvement', e, v)} 
                  />
                  <StatSlider 
                    name="Teamwork" 
                    value={formData.grades.teamwork} 
                    onChange={(e, v) => handleGradeChange('teamwork', e, v)} 
                  />
                  <StatSlider 
                    name="Attitude" 
                    value={formData.grades.attitude} 
                    onChange={(e, v) => handleGradeChange('attitude', e, v)} 
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveStats} 
            variant="contained" 
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Delete Player Stats</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete these player stats? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteStats} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PlayerStats; 