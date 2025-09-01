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
  Schedule,
  Group,
  EmojiEvents,
  SportsScore,
  People,
  Star,
  TrendingUp
} from '@mui/icons-material';
import api from '../../services/api';
import { format } from 'date-fns';
import { getSportIcon } from '../../utils/sportIcons';

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`teams-tabpanel-${index}`}
      aria-labelledby={`teams-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const TeamsReport = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTeams, setActiveTeams] = useState([]);
  const [inactiveTeams, setInactiveTeams] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const printRef = useRef(null);
  
  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all teams first (this is the main requirement)
      // For admin reports, we want all teams including inactive ones
      const teamsResponse = await api.get('/teams?includeInactive=true');
      console.log('Teams fetched:', teamsResponse.data.length);
      
      // Try to get training plans (optional - fail silently if no access)
      let trainingPlansData = [];
      try {
        const trainingPlansResponse = await api.get('/training-plans');
        trainingPlansData = trainingPlansResponse.data;
        console.log('Training plans fetched:', trainingPlansData.length);
      } catch (trainingError) {
        console.warn('Could not fetch training plans:', trainingError.response?.data?.msg || trainingError.message);
      }
      
      // Try to get bookings (optional - fail silently if no access)
      let bookingsData = [];
      try {
        const bookingsResponse = await api.get('/bookings');
        bookingsData = bookingsResponse.data;
        console.log('Bookings fetched:', bookingsData.length);
      } catch (bookingError) {
        console.warn('Could not fetch bookings:', bookingError.response?.data?.msg || bookingError.message);
      }
      
      // Create maps for training plans and bookings
      const trainingPlansMap = {};
      const bookingsMap = {};
      
      // Count training plans per team
      trainingPlansData.forEach(plan => {
        const teamId = plan.team?._id || plan.team;
        if (teamId) {
          if (!trainingPlansMap[teamId]) {
            trainingPlansMap[teamId] = [];
          }
          trainingPlansMap[teamId].push(plan);
        }
      });
      
      // Count bookings per team
      bookingsData.forEach(booking => {
        if (booking.team) {
          const teamId = booking.team._id || booking.team;
          if (!bookingsMap[teamId]) {
            bookingsMap[teamId] = [];
          }
          bookingsMap[teamId].push(booking);
        }
      });
      
      // Process teams with additional data
      const enrichedTeams = teamsResponse.data.map(team => {
        const trainingPlans = trainingPlansMap[team._id] || [];
        const bookings = bookingsMap[team._id] || [];
        
        return {
          ...team,
          totalPlayers: team.players?.length || 0,
          totalCoaches: team.coaches?.length || 0,
          totalTrainingPlans: trainingPlans.length,
          totalBookings: bookings.length,
          headCoach: team.coaches?.find(coach => 
            coach.role === 'Head Coach' || coach.role === 'Coach'
          ),
          recentActivity: Math.max(
            team.updatedAt ? new Date(team.updatedAt).getTime() : 0,
            trainingPlans.length > 0 ? Math.max(...trainingPlans.map(p => new Date(p.createdAt || p.updatedAt).getTime())) : 0,
            bookings.length > 0 ? Math.max(...bookings.map(b => new Date(b.createdAt || b.updatedAt).getTime())) : 0
          )
        };
      });
      
      // Separate active and inactive teams
      const activeTeamsList = enrichedTeams.filter(team => team.isActive !== false);
      const inactiveTeamsList = enrichedTeams.filter(team => team.isActive === false);
      
      setActiveTeams(activeTeamsList);
      setInactiveTeams(inactiveTeamsList);
      
      console.log('Teams processed:', { active: activeTeamsList.length, inactive: inactiveTeamsList.length });
      
    } catch (err) {
      console.error('Error fetching teams:', err);
      const errorMessage = err.response?.data?.msg || err.message || 'Failed to load teams data';
      setError(`Failed to load teams data: ${errorMessage}`);
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

  const filteredTeams = (teams) => {
    if (!searchTerm) return teams;
    
    return teams.filter(team => {
      const searchFields = [
        team.name,
        team.sportType,
        team.ageGroup,
        team.level,
        team.description,
        team.coaches?.map(coach => coach.coach ? `${coach.coach.firstName} ${coach.coach.lastName}` : '').join(' '),
        team.players?.map(player => player.player ? `${player.player.firstName} ${player.player.lastName}` : '').join(' ')
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchFields.includes(searchTerm.toLowerCase());
    });
  };

  const handlePrintReport = () => {
    const teams = tabValue === 0 ? activeTeams : inactiveTeams;
    const status = tabValue === 0 ? 'Active' : 'Inactive';
    
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Teams Report - ${status}</title>
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
            <div class="title">Teams ${status === 'Active' ? 'Active' : 'Inactive'} Report</div>
            <div class="subtitle">Generated on ${format(new Date(), 'PPP p')}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Sport</th>
                <th>Level</th>
                <th>Age Group</th>
                <th>Players</th>
                <th>Coaches</th>
                <th>Head Coach</th>
                <th>Training Plans</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${teams.map(team => `
                <tr>
                  <td>${team.name}</td>
                  <td>${team.sportType}</td>
                  <td>${team.level || 'N/A'}</td>
                  <td>${team.ageGroup || 'N/A'}</td>
                  <td>${team.totalPlayers}</td>
                  <td>${team.totalCoaches}</td>
                  <td>${team.headCoach && team.headCoach.coach ? `${team.headCoach.coach.firstName} ${team.headCoach.coach.lastName}` : 'N/A'}</td>
                  <td>${team.totalTrainingPlans}</td>
                  <td>${team.createdAt ? format(new Date(team.createdAt), 'PP') : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Total ${status} Teams: ${teams.length}</p>
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
    const teams = tabValue === 0 ? activeTeams : inactiveTeams;
    const status = tabValue === 0 ? 'Active' : 'Inactive';
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add header row
    csvContent += 'Team Name,Sport,Level,Age Group,Players,Coaches,Head Coach,Training Plans,Bookings,Created Date\n';
    
    // Add data rows
    teams.forEach(team => {
      const row = [
        team.name,
        team.sportType,
        team.level || '',
        team.ageGroup || '',
        team.totalPlayers,
        team.totalCoaches,
        team.headCoach && team.headCoach.coach ? `${team.headCoach.coach.firstName} ${team.headCoach.coach.lastName}` : '',
        team.totalTrainingPlans,
        team.totalBookings,
        team.createdAt ? format(new Date(team.createdAt), 'PP') : ''
      ];
      csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Teams_Report_${status}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading teams data...</Typography>
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
          onClick={fetchTeams}
        >
          Retry
        </Button>
      </Box>
    );
  }

  const displayedActiveTeams = filteredTeams(activeTeams)
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    
  const displayedInactiveTeams = filteredTeams(inactiveTeams)
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      {/* Tabs to switch between active and inactive teams */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="teams tabs"
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
            label={`Active Teams (${activeTeams.length})`} 
          />
          <Tab 
            icon={<Close fontSize="small" />} 
            iconPosition="start" 
            label={`Inactive Teams (${inactiveTeams.length})`} 
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
          label="Search Teams"
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
                <TableCell>Team</TableCell>
                <TableCell>Sport & Level</TableCell>
                <TableCell>Members</TableCell>
                <TableCell>Head Coach</TableCell>
                <TableCell>Activities</TableCell>
                <TableCell>Performance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedActiveTeams.length > 0 ? (
                displayedActiveTeams.map((team) => (
                  <TableRow key={team._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getSportIcon(team.sportType)}
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {team.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {team.ageGroup && `${team.ageGroup} • `}
                            Created {team.createdAt ? format(new Date(team.createdAt), 'MMM yyyy') : 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Chip
                          icon={<Sports fontSize="small" />}
                          label={team.sportType}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mb: 0.5 }}
                        />
                        <br />
                        <Chip
                          icon={<Star fontSize="small" />}
                          label={team.level || 'No Level'}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <People fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {team.totalPlayers} Players
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {team.totalCoaches} Coaches
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {team.headCoach && team.headCoach.coach ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonOutline sx={{ mr: 1, color: 'primary.main' }} />
                          <Box>
                            <Typography variant="subtitle2">
                              {team.headCoach.coach.firstName} {team.headCoach.coach.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {team.headCoach.role}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Chip 
                          label="No Head Coach" 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Schedule fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {team.totalTrainingPlans} Training Plans
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarToday fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {team.totalBookings} Bookings
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <TrendingUp fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'success.main' }} />
                          <Typography variant="body2" color="success.main">
                            Active Team
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {team.description ? team.description.substring(0, 30) + '...' : 'No description'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No matching active teams found' : 'No active teams available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredTeams(activeTeams).length}
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
                <TableCell>Team</TableCell>
                <TableCell>Sport & Level</TableCell>
                <TableCell>Members</TableCell>
                <TableCell>Head Coach</TableCell>
                <TableCell>Activities</TableCell>
                <TableCell>Performance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedInactiveTeams.length > 0 ? (
                displayedInactiveTeams.map((team) => (
                  <TableRow key={team._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getSportIcon(team.sportType)}
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.disabled' }}>
                            {team.name}
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            {team.ageGroup && `${team.ageGroup} • `}
                            Created {team.createdAt ? format(new Date(team.createdAt), 'MMM yyyy') : 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Chip
                          icon={<Sports fontSize="small" />}
                          label={team.sportType}
                          size="small"
                          color="default"
                          variant="outlined"
                          sx={{ mb: 0.5, color: 'text.disabled', borderColor: 'text.disabled' }}
                        />
                        <br />
                        <Chip
                          icon={<Star fontSize="small" />}
                          label={team.level || 'No Level'}
                          size="small"
                          color="default"
                          variant="outlined"
                          sx={{ color: 'text.disabled', borderColor: 'text.disabled' }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <People fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.disabled' }} />
                          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                            {team.totalPlayers} Players
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.disabled' }} />
                          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                            {team.totalCoaches} Coaches
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {team.headCoach && team.headCoach.coach ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonOutline sx={{ mr: 1, color: 'text.disabled' }} />
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: 'text.disabled' }}>
                              {team.headCoach.coach.firstName} {team.headCoach.coach.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.disabled">
                              {team.headCoach.role}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Chip 
                          label="No Head Coach" 
                          size="small" 
                          color="default" 
                          variant="outlined"
                          sx={{ color: 'text.disabled', borderColor: 'text.disabled' }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Schedule fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.disabled' }} />
                          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                            {team.totalTrainingPlans} Training Plans
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarToday fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.disabled' }} />
                          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                            {team.totalBookings} Bookings
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Close fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.disabled' }} />
                          <Typography variant="body2" color="text.disabled">
                            Inactive Team
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.disabled">
                          {team.description ? team.description.substring(0, 30) + '...' : 'No description'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No matching inactive teams found' : 'No inactive teams available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredTeams(inactiveTeams).length}
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

export default TeamsReport;
