import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, FormControl, InputLabel, 
  Select, MenuItem, TextField, CircularProgress, Chip, 
  IconButton, Card, CardContent, Grid, Divider, Alert, Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { getTeams } from '../../services/teamService';
import { getAttendanceReport } from '../../services/trainingService';
import DownloadIcon from '@mui/icons-material/Download';
import PersonIcon from '@mui/icons-material/Person';
import FilterListIcon from '@mui/icons-material/FilterList';
import PieChartIcon from '@mui/icons-material/PieChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const SupportAttendanceReport = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewType, setViewType] = useState('summary'); // 'summary' or 'detailed'
  const [teamsLoading, setTeamsLoading] = useState(true);
  
  const COLORS = ['#4CAF50', '#F44336', '#FFC107', '#2196F3'];
  
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setTeamsLoading(true);
        // Get all teams in the system instead of just coach teams
        const teamData = await getTeams();
        setTeams(teamData);
        
        // Select first team by default if available
        if (teamData.length > 0) {
          setSelectedTeam(teamData[0]._id);
        }
        setTeamsLoading(false);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Failed to load teams');
        setTeamsLoading(false);
      }
    };
    
    fetchTeams();
  }, []);
  
  const handleGenerateReport = async () => {
    if (!selectedTeam) {
      setError('Please select a team');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
      const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;
      
      const response = await getAttendanceReport(
        selectedTeam,
        formattedStartDate,
        formattedEndDate,
        selectedPlayer || undefined
      );
      
      if (response.success) {
        setReportData(response.data);
      } else {
        setError(response.error);
        setReportData(null);
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate attendance report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleExportCsv = () => {
    if (!reportData) return;
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add header row
    csvContent += 'Player Name,Email,Total Sessions,Present,Absent,Late,Excused,Attendance Rate (%)\n';
    
    // Add data rows
    reportData.playerReports.forEach(player => {
      const row = [
        player.player.name,
        player.player.email,
        player.totalSessions,
        player.present,
        player.absent,
        player.late,
        player.excused,
        player.attendanceRate
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${reportData.team.name}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const renderSummaryCharts = () => {
    if (!reportData) return null;
    
    // Prepare data for attendance status distribution chart
    const statusData = [
      { name: 'Present', value: reportData.playerReports.reduce((sum, p) => sum + p.present, 0) },
      { name: 'Absent', value: reportData.playerReports.reduce((sum, p) => sum + p.absent, 0) },
      { name: 'Late', value: reportData.playerReports.reduce((sum, p) => sum + p.late, 0) },
      { name: 'Excused', value: reportData.playerReports.reduce((sum, p) => sum + p.excused, 0) }
    ];
    
    // Prepare data for attendance rate by player chart
    const playerRateData = reportData.playerReports.map(player => ({
      name: player.player.name.split(' ')[0], // First name only for brevity
      rate: parseFloat(player.attendanceRate)
    }));
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Attendance Status Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Attendance Rate by Player</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={playerRateData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    label={{ value: 'Attendance Rate (%)', angle: -90, position: 'insideLeft' }}
                    domain={[0, 100]}
                  />
                  <RechartsTooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="rate" fill="#8884d8" name="Attendance Rate" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  const renderDetailedTable = () => {
    if (!reportData) return null;
    
    return (
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Player</TableCell>
              <TableCell align="center">Total Sessions</TableCell>
              <TableCell align="center">Present</TableCell>
              <TableCell align="center">Absent</TableCell>
              <TableCell align="center">Late</TableCell>
              <TableCell align="center">Excused</TableCell>
              <TableCell align="center">Attendance Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.playerReports.map((player) => (
              <TableRow key={player.player._id}>
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {player.player.profilePicture ? (
                      <img 
                        src={player.player.profilePicture} 
                        alt={player.player.name}
                        style={{ width: 30, height: 30, borderRadius: '50%', marginRight: 8 }}
                      />
                    ) : (
                      <PersonIcon sx={{ marginRight: 1 }} />
                    )}
                    {player.player.name}
                  </Box>
                </TableCell>
                <TableCell align="center">{player.totalSessions}</TableCell>
                <TableCell align="center">{player.present}</TableCell>
                <TableCell align="center">{player.absent}</TableCell>
                <TableCell align="center">{player.late}</TableCell>
                <TableCell align="center">{player.excused}</TableCell>
                <TableCell align="center">
                  <Chip 
                    label={`${player.attendanceRate}%`}
                    color={
                      parseFloat(player.attendanceRate) >= 90 ? 'success' :
                      parseFloat(player.attendanceRate) >= 75 ? 'primary' :
                      parseFloat(player.attendanceRate) >= 60 ? 'warning' : 'error'
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Player Attendance Report
          </Typography>
          <Box>
            <Tooltip title="Toggle view">
              <IconButton onClick={() => setViewType(viewType === 'summary' ? 'detailed' : 'summary')}>
                {viewType === 'summary' ? <FilterListIcon /> : <PieChartIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle filters">
              <IconButton onClick={() => setShowFilters(!showFilters)}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            {reportData && (
              <Tooltip title="Export as CSV">
                <IconButton onClick={handleExportCsv}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="team-select-label">Team</InputLabel>
                <Select
                  labelId="team-select-label"
                  value={selectedTeam}
                  label="Team"
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  disabled={teamsLoading}
                >
                  {teamsLoading ? (
                    <MenuItem value="">
                      <CircularProgress size={20} sx={{ mr: 1 }} /> Loading teams...
                    </MenuItem>
                  ) : (
                    teams.map((team) => (
                      <MenuItem key={team._id} value={team._id}>
                        {team.name} - {team.sportType}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            
            {showFilters && (
              <>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={setStartDate}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={setEndDate}
                  />
                </Grid>
                {/* Individual player filter could be added here if needed */}
              </>
            )}
            
            <Grid item xs={12} md={showFilters ? 3 : 3}>
              <Button
                variant="contained"
                onClick={handleGenerateReport}
                disabled={loading || !selectedTeam || teamsLoading}
                fullWidth
                startIcon={loading ? <CircularProgress size={20} /> : <CalendarMonthIcon />}
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {teams.length === 0 && !teamsLoading && (
          <Alert severity="info" sx={{ mb: 3 }}>
            No teams found in the system. You need to create teams before you can generate attendance reports.
          </Alert>
        )}
        
        {reportData && (
          <Box>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2">Team</Typography>
                    <Typography variant="body1">{reportData.team.name}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2">Date Range</Typography>
                    <Typography variant="body1">
                      {format(new Date(reportData.dateRange.start), 'MMM d, yyyy')} - {format(new Date(reportData.dateRange.end), 'MMM d, yyyy')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2">Training Sessions</Typography>
                    <Typography variant="body1">{reportData.totalTrainingPlans}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            {viewType === 'summary' ? renderSummaryCharts() : renderDetailedTable()}
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default SupportAttendanceReport; 