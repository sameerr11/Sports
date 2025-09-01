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
  EmojiEvents
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
      id={`coaches-tabpanel-${index}`}
      aria-labelledby={`coaches-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CoachReport = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCoaches, setActiveCoaches] = useState([]);
  const [inactiveCoaches, setInactiveCoaches] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const printRef = useRef(null);
  
  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      
      // Get active coaches
      const activeResponse = await api.get('/users/role/coach');
      
      // Get inactive coaches
      const inactiveResponse = await api.get('/users', {
        params: {
          role: 'coach',
          isActive: false
        }
      });
      
      // Get all teams to build coach-team relationships
      const teamsResponse = await api.get('/teams');
      const teamsMap = {};
      
      // Create a map of coach to their teams
      teamsResponse.data.forEach(team => {
        team.coaches.forEach(coachEntry => {
          const coachId = coachEntry.coach._id || coachEntry.coach;
          if (!teamsMap[coachId]) {
            teamsMap[coachId] = [];
          }
          teamsMap[coachId].push({
            ...team,
            coachRole: coachEntry.role,
            assignedAt: coachEntry.assignedAt
          });
        });
      });
      
      // Add team details to active coaches
      const activeCoachesWithTeams = activeResponse.data.map(coach => {
        const coachTeams = teamsMap[coach._id] || [];
        return { 
          ...coach, 
          teams: coachTeams,
          totalTeams: coachTeams.length,
          activeSports: [...new Set(coachTeams.map(team => team.sportType))]
        };
      });
      
      // Add team details to inactive coaches
      const inactiveCoachesWithTeams = inactiveResponse.data.map(coach => {
        const coachTeams = teamsMap[coach._id] || [];
        return { 
          ...coach, 
          teams: coachTeams,
          totalTeams: coachTeams.length,
          activeSports: [...new Set(coachTeams.map(team => team.sportType))]
        };
      });
      
      // Set the state
      setActiveCoaches(activeCoachesWithTeams);
      setInactiveCoaches(inactiveCoachesWithTeams);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching coaches:', err);
      setError('Failed to load coaches data');
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

  const filteredCoaches = (coaches) => {
    if (!searchTerm) return coaches;
    
    return coaches.filter(coach => {
      const searchFields = [
        coach.firstName,
        coach.lastName,
        coach.email,
        coach.phoneNumber,
        ...coach.activeSports,
        coach.teams.map(team => team.name).join(' '),
        coach.teams.map(team => team.coachRole).join(' ')
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchFields.includes(searchTerm.toLowerCase());
    });
  };

  const handlePrintReport = () => {
    const coaches = tabValue === 0 ? activeCoaches : inactiveCoaches;
    const status = tabValue === 0 ? 'Active' : 'Inactive';
    
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Coaches Report - ${status}</title>
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
            <div class="title">Coaches ${status === 'Active' ? 'Active' : 'Inactive'} Report</div>
            <div class="subtitle">Generated on ${format(new Date(), 'PPP p')}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Coach Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Birth Date</th>
                <th>Sports</th>
                <th>Teams</th>
                <th>Total Teams</th>
                <th>Join Date</th>
              </tr>
            </thead>
            <tbody>
              ${coaches.map(coach => `
                <tr>
                  <td>${coach.firstName} ${coach.lastName}</td>
                  <td>${coach.email || 'N/A'}</td>
                  <td>${coach.phoneNumber || 'N/A'}</td>
                  <td>${coach.birthDate ? format(new Date(coach.birthDate), 'PP') : 'N/A'}</td>
                  <td>${coach.activeSports.join(', ') || 'N/A'}</td>
                  <td>${coach.teams.map(team => team.name).join(', ') || 'N/A'}</td>
                  <td>${coach.totalTeams}</td>
                  <td>${coach.createdAt ? format(new Date(coach.createdAt), 'PP') : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Total ${status} Coaches: ${coaches.length}</p>
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
    const coaches = tabValue === 0 ? activeCoaches : inactiveCoaches;
    const status = tabValue === 0 ? 'Active' : 'Inactive';
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add header row
    csvContent += 'Coach Name,Email,Phone,Birth Date,Sports,Teams,Total Teams,Join Date\n';
    
    // Add data rows
    coaches.forEach(coach => {
      const row = [
        `${coach.firstName} ${coach.lastName}`,
        coach.email || '',
        coach.phoneNumber || '',
        coach.birthDate ? format(new Date(coach.birthDate), 'PP') : '',
        coach.activeSports.join(', ') || '',
        coach.teams.map(team => team.name).join(', ') || '',
        coach.totalTeams,
        coach.createdAt ? format(new Date(coach.createdAt), 'PP') : ''
      ];
      csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Coaches_Report_${status}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading coaches data...</Typography>
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
          onClick={fetchCoaches}
        >
          Retry
        </Button>
      </Box>
    );
  }

  const displayedActiveCoaches = filteredCoaches(activeCoaches)
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    
  const displayedInactiveCoaches = filteredCoaches(inactiveCoaches)
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      {/* Tabs to switch between active and inactive coaches */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="coaches tabs"
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
            label={`Active Coaches (${activeCoaches.length})`} 
          />
          <Tab 
            icon={<Close fontSize="small" />} 
            iconPosition="start" 
            label={`Inactive Coaches (${inactiveCoaches.length})`} 
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
          label="Search Coaches"
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
                <TableCell>Coach</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Birth Date</TableCell>
                <TableCell>Sports</TableCell>
                <TableCell>Teams Managed</TableCell>
                <TableCell>Performance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedActiveCoaches.length > 0 ? (
                displayedActiveCoaches.map((coach) => (
                  <TableRow key={coach._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Person sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle2">
                            {coach.firstName} {coach.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {coach.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {coach.phoneNumber && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Phone fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.secondary' }} />
                            {coach.phoneNumber}
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Email fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.secondary' }} />
                          {coach.email}
                        </Box>
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {coach.birthDate ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Cake fontSize="small" sx={{ mr: 0.5, color: 'secondary.main' }} />
                          {format(new Date(coach.birthDate), 'PP')}
                        </Box>
                      ) : 'Not set'}
                    </TableCell>
                    <TableCell>
                      {coach.activeSports.length > 0 ? (
                        <Box>
                          {coach.activeSports.map((sport, index) => (
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
                      {coach.teams.length > 0 ? (
                        <Box>
                          {coach.teams.slice(0, 3).map((team, index) => (
                            <Chip
                              key={index}
                              icon={<Group fontSize="small" />}
                              label={`${team.name} (${team.coachRole})`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                          {coach.teams.length > 3 && (
                            <Chip
                              label={`+${coach.teams.length - 3} more`}
                              size="small"
                              color="default"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Chip 
                          label="No Teams" 
                          size="small" 
                          color="default" 
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <EmojiEvents fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {coach.totalTeams} Teams
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarToday fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.secondary' }} />
                          <Typography variant="body2">
                            Since {coach.createdAt ? format(new Date(coach.createdAt), 'MMM yyyy') : 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No matching active coaches found' : 'No active coaches available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredCoaches(activeCoaches).length}
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
                <TableCell>Coach</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Birth Date</TableCell>
                <TableCell>Sports</TableCell>
                <TableCell>Teams Managed</TableCell>
                <TableCell>Performance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedInactiveCoaches.length > 0 ? (
                displayedInactiveCoaches.map((coach) => (
                  <TableRow key={coach._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Person sx={{ mr: 1, color: 'text.disabled' }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: 'text.disabled' }}>
                            {coach.firstName} {coach.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            {coach.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                        {coach.phoneNumber && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Phone fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.disabled' }} />
                            {coach.phoneNumber}
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Email fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.disabled' }} />
                          {coach.email}
                        </Box>
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.disabled' }}>
                      {coach.birthDate ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Cake fontSize="small" sx={{ mr: 0.5, color: 'text.disabled' }} />
                          {format(new Date(coach.birthDate), 'PP')}
                        </Box>
                      ) : 'Not set'}
                    </TableCell>
                    <TableCell>
                      {coach.activeSports.length > 0 ? (
                        <Box>
                          {coach.activeSports.map((sport, index) => (
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
                    <TableCell>
                      {coach.teams.length > 0 ? (
                        <Box>
                          {coach.teams.slice(0, 3).map((team, index) => (
                            <Chip
                              key={index}
                              icon={<Group fontSize="small" />}
                              label={`${team.name} (${team.coachRole})`}
                              size="small"
                              color="default"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5, color: 'text.disabled', borderColor: 'text.disabled' }}
                            />
                          ))}
                          {coach.teams.length > 3 && (
                            <Chip
                              label={`+${coach.teams.length - 3} more`}
                              size="small"
                              color="default"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5, color: 'text.disabled', borderColor: 'text.disabled' }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Chip 
                          label="No Teams" 
                          size="small" 
                          color="default" 
                          variant="outlined"
                          sx={{ color: 'text.disabled', borderColor: 'text.disabled' }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'text.disabled' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <EmojiEvents fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.disabled' }} />
                          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                            {coach.totalTeams} Teams
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarToday fontSize="small" sx={{ mr: 0.5, fontSize: '16px', color: 'text.disabled' }} />
                          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                            Since {coach.createdAt ? format(new Date(coach.createdAt), 'MMM yyyy') : 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No matching inactive coaches found' : 'No inactive coaches available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredCoaches(inactiveCoaches).length}
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

export default CoachReport;
