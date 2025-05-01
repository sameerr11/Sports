import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Divider,
  IconButton,
  Tooltip,
  TablePagination,
  Link,
  alpha,
  useTheme
} from '@mui/material';
import {
  Search,
  Print,
  Download,
  FilterList,
  Check,
  Close,
  Phone,
  Email,
  Person,
  PersonOutline,
  Cake,
  Sports,
  CalendarToday,
  Schedule
} from '@mui/icons-material';
import api from '../../services/api';
import { format } from 'date-fns';

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`players-tabpanel-${index}`}
      aria-labelledby={`players-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const PlayersWithParents = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePlayers, setActivePlayers] = useState([]);
  const [inactivePlayers, setInactivePlayers] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const printRef = useRef(null);
  
  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      
      // Get active players
      const activeResponse = await api.get('/users/role/player');
      
      // Get inactive players using the modified endpoint
      const inactiveResponse = await api.get('/users', {
        params: {
          role: 'player',
          isActive: false
        }
      });
      
      // Get all parents to build a lookup map
      const parentsResponse = await api.get('/users/role/parent');
      const parentsMap = {};
      
      parentsResponse.data.forEach(parent => {
        parentsMap[parent._id] = parent;
      });
      
      // Get all player registrations
      const registrationsResponse = await api.get('/registrations');
      const registrationsMap = {};
      
      // Create a map of userId to their registration data
      registrationsResponse.data.forEach(registration => {
        if (registration.userId) {
          // If a player has multiple registrations, we'll show the most recent one
          if (!registrationsMap[registration.userId] || 
              new Date(registration.createdAt) > new Date(registrationsMap[registration.userId].createdAt)) {
            registrationsMap[registration.userId] = registration;
          }
        }
      });
      
      // Add parent details and registration data to active players
      const activePlayersWithParents = activeResponse.data.map(player => {
        let parentDetails = null;
        if (player.parentId && parentsMap[player.parentId]) {
          parentDetails = parentsMap[player.parentId];
        }
        
        // Add registration details
        const registrationDetails = registrationsMap[player._id] || null;
        
        return { 
          ...player, 
          parentDetails,
          registrationDetails 
        };
      });
      
      // Add parent details and registration data to inactive players
      const inactivePlayersWithParents = inactiveResponse.data.map(player => {
        let parentDetails = null;
        if (player.parentId && parentsMap[player.parentId]) {
          parentDetails = parentsMap[player.parentId];
        }
        
        // Add registration details
        const registrationDetails = registrationsMap[player._id] || null;
        
        return { 
          ...player, 
          parentDetails,
          registrationDetails 
        };
      });
      
      // Set the state
      setActivePlayers(activePlayersWithParents);
      setInactivePlayers(inactivePlayersWithParents);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to load players data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const filteredPlayers = (players) => {
    if (!searchTerm) return players;
    
    return players.filter(player => {
      const searchFields = [
        player.firstName,
        player.lastName,
        player.email,
        player.phoneNumber,
        player.parentDetails?.firstName,
        player.parentDetails?.lastName,
        player.parentDetails?.email,
        player.parentDetails?.phoneNumber,
        player.registrationDetails?.sports?.join(' '),
        player.registrationDetails?.registrationPeriod
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchFields.includes(searchTerm.toLowerCase());
    });
  };

  const handlePrintReport = () => {
    const players = tabValue === 0 ? activePlayers : inactivePlayers;
    const status = tabValue === 0 ? 'Active' : 'Inactive';
    
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Players Report - ${status}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin: 10px 0;
            }
            .subtitle {
              font-size: 16px;
              color: #666;
              margin: 5px 0 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px 12px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .status-chip {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 16px;
              font-size: 12px;
              font-weight: bold;
              color: white;
              background-color: ${status === 'Active' ? '#4caf50' : '#f44336'};
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Players ${status === 'Active' ? 'Active' : 'Inactive'} Report</div>
            <div class="subtitle">Generated on ${format(new Date(), 'PPP p')}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Birth Date</th>
                <th>Sports</th>
                <th>Registration Date</th>
                <th>Registration Period</th>
                <th>Parent Name</th>
                <th>Parent Contact</th>
              </tr>
            </thead>
            <tbody>
              ${players.map(player => `
                <tr>
                  <td>${player.firstName} ${player.lastName}</td>
                  <td>${player.email || 'N/A'}</td>
                  <td>${player.phoneNumber || 'N/A'}</td>
                  <td>${player.birthDate ? format(new Date(player.birthDate), 'PP') : 'N/A'}</td>
                  <td>${player.registrationDetails?.sports?.join(', ') || 'N/A'}</td>
                  <td>${player.registrationDetails?.startDate ? format(new Date(player.registrationDetails.startDate), 'PP') : 'N/A'}</td>
                  <td>${player.registrationDetails?.registrationPeriod || 'N/A'}</td>
                  <td>${player.parentDetails ? 
                    `${player.parentDetails.firstName} ${player.parentDetails.lastName}` : 
                    'Not Assigned'}</td>
                  <td>${player.parentDetails ? 
                    `${player.parentDetails.email || 'N/A'}<br>${player.parentDetails.phoneNumber || 'N/A'}` : 
                    'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Total ${status} Players: ${players.length}</p>
            <p>Sports Management System</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleExportCsv = () => {
    const players = tabValue === 0 ? activePlayers : inactivePlayers;
    const status = tabValue === 0 ? 'Active' : 'Inactive';
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add header row
    csvContent += 'Player Name,Email,Phone,Birth Date,Sports,Registration Date,Registration Period,Parent Name,Parent Email,Parent Phone\n';
    
    // Add data rows
    players.forEach(player => {
      const row = [
        `${player.firstName} ${player.lastName}`,
        player.email || '',
        player.phoneNumber || '',
        player.birthDate ? format(new Date(player.birthDate), 'PP') : '',
        player.registrationDetails?.sports?.join(', ') || '',
        player.registrationDetails?.startDate ? format(new Date(player.registrationDetails.startDate), 'PP') : '',
        player.registrationDetails?.registrationPeriod || '',
        player.parentDetails ? `${player.parentDetails.firstName} ${player.parentDetails.lastName}` : '',
        player.parentDetails ? (player.parentDetails.email || '') : '',
        player.parentDetails ? (player.parentDetails.phoneNumber || '') : ''
      ];
      csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Players_Report_${status}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading players data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="body1" color="error">{error}</Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          sx={{ mt: 2 }} 
          onClick={fetchPlayers}
        >
          Retry
        </Button>
      </Box>
    );
  }

  const displayedActivePlayers = filteredPlayers(activePlayers)
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    
  const displayedInactivePlayers = filteredPlayers(inactivePlayers)
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      {/* Tabs to switch between active and inactive players */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="players tabs"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minWidth: '120px'
            }
          }}
        >
          <Tab 
            icon={<Check fontSize="small" />} 
            iconPosition="start" 
            label={`Active Players (${activePlayers.length})`} 
          />
          <Tab 
            icon={<Close fontSize="small" />} 
            iconPosition="start" 
            label={`Inactive Players (${inactivePlayers.length})`} 
          />
        </Tabs>
      </Box>

      {/* Search and action buttons */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2
      }}>
        <TextField
          label="Search Players"
          variant="outlined"
          size="small"
          fullWidth
          sx={{ maxWidth: { md: '40%' } }}
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Print />}
            onClick={handlePrintReport}
          >
            Print Report
          </Button>
          
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Download />}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table ref={printRef}>
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Birth Date</TableCell>
                <TableCell>Sports</TableCell>
                <TableCell>Registration Details</TableCell>
                <TableCell>Parent</TableCell>
                <TableCell>Parent Contact</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedActivePlayers.length > 0 ? (
                displayedActivePlayers.map((player) => (
                  <TableRow key={player._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Person sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle2">
                            {player.firstName} {player.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {player.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {player.phoneNumber && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Phone fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.secondary' }} />
                            {player.phoneNumber}
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Email fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.secondary' }} />
                          {player.email}
                        </Box>
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {player.birthDate ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Cake fontSize="small" sx={{ mr: 0.5, color: 'secondary.main' }} />
                          {format(new Date(player.birthDate), 'PP')}
                        </Box>
                      ) : 'Not set'}
                    </TableCell>
                    <TableCell>
                      {player.registrationDetails?.sports ? (
                        <Box>
                          {player.registrationDetails.sports.map((sport, index) => (
                            <Chip
                              key={index}
                              icon={<Sports fontSize="small" />}
                              label={sport}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Chip 
                          label="No Sports" 
                          size="small" 
                          color="default" 
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {player.registrationDetails ? (
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <CalendarToday fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {format(new Date(player.registrationDetails.startDate), 'PP')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Schedule fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {player.registrationDetails.registrationPeriod}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Chip 
                          label="No Registration Data" 
                          size="small" 
                          color="default" 
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {player.parentDetails ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonOutline sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="subtitle2">
                            {player.parentDetails.firstName} {player.parentDetails.lastName}
                          </Typography>
                        </Box>
                      ) : (
                        <Chip 
                          label="No Parent Assigned" 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {player.parentDetails ? (
                        <>
                          {player.parentDetails.phoneNumber && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Phone fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.secondary' }} />
                              {player.parentDetails.phoneNumber}
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Email fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.secondary' }} />
                            {player.parentDetails.email}
                          </Box>
                        </>
                      ) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No matching active players found' : 'No active players available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredPlayers(activePlayers).length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Birth Date</TableCell>
                <TableCell>Sports</TableCell>
                <TableCell>Registration Details</TableCell>
                <TableCell>Parent</TableCell>
                <TableCell>Parent Contact</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedInactivePlayers.length > 0 ? (
                displayedInactivePlayers.map((player) => (
                  <TableRow key={player._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Person sx={{ mr: 1, color: 'text.disabled' }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: 'text.disabled' }}>
                            {player.firstName} {player.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            {player.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                        {player.phoneNumber && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Phone fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.disabled' }} />
                            {player.phoneNumber}
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Email fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.disabled' }} />
                          {player.email}
                        </Box>
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.disabled' }}>
                      {player.birthDate ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Cake fontSize="small" sx={{ mr: 0.5, color: 'text.disabled' }} />
                          {format(new Date(player.birthDate), 'PP')}
                        </Box>
                      ) : 'Not set'}
                    </TableCell>
                    <TableCell>
                      {player.registrationDetails?.sports ? (
                        <Box>
                          {player.registrationDetails.sports.map((sport, index) => (
                            <Chip
                              key={index}
                              icon={<Sports fontSize="small" />}
                              label={sport}
                              size="small"
                              color="default"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5, color: 'text.disabled', borderColor: 'text.disabled' }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Chip 
                          label="No Sports" 
                          size="small" 
                          color="default" 
                          variant="outlined"
                          sx={{ color: 'text.disabled', borderColor: 'text.disabled' }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'text.disabled' }}>
                      {player.registrationDetails ? (
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <CalendarToday fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.disabled' }} />
                            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                              {format(new Date(player.registrationDetails.startDate), 'PP')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Schedule fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.disabled' }} />
                            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                              {player.registrationDetails.registrationPeriod}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Chip 
                          label="No Registration Data" 
                          size="small" 
                          color="default" 
                          variant="outlined"
                          sx={{ color: 'text.disabled', borderColor: 'text.disabled' }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {player.parentDetails ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonOutline sx={{ mr: 1, color: 'text.disabled' }} />
                          <Typography variant="subtitle2" sx={{ color: 'text.disabled' }}>
                            {player.parentDetails.firstName} {player.parentDetails.lastName}
                          </Typography>
                        </Box>
                      ) : (
                        <Chip 
                          label="No Parent Assigned" 
                          size="small" 
                          color="default" 
                          variant="outlined"
                          sx={{ color: 'text.disabled', borderColor: 'text.disabled' }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'text.disabled' }}>
                      {player.parentDetails ? (
                        <>
                          {player.parentDetails.phoneNumber && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Phone fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.disabled' }} />
                              {player.parentDetails.phoneNumber}
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Email fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.disabled' }} />
                            {player.parentDetails.email}
                          </Box>
                        </>
                      ) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No matching inactive players found' : 'No inactive players available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredPlayers(inactivePlayers).length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </TabPanel>
    </Box>
  );
};

export default PlayersWithParents; 