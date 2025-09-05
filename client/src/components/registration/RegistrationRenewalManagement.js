import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Pagination,
  Tabs,
  Tab,
  useTheme,
  alpha
} from '@mui/material';
import {
  Refresh,
  Add,
  Edit,
  Cancel,
  Visibility,
  SportsSoccer,
  SportsBasketball,
  SportsVolleyball,
  Pool,
  FitnessCenter,
  DirectionsRun
} from '@mui/icons-material';
import { format } from 'date-fns';
import { 
  getExpiredRegistrations, 
  getRegistrationFees, 
  createRenewal, 
  getRenewals 
} from '../../services/registrationRenewalService';
import RegistrationRenewalForm from './RegistrationRenewalForm';
import RenewalDetailsDialog from './RenewalDetailsDialog';

// Sport icons mapping
const getSportIcon = (sport) => {
  const sportLower = sport?.toLowerCase() || '';
  if (sportLower.includes('football') || sportLower.includes('soccer')) {
    return <SportsSoccer />;
  } else if (sportLower.includes('basketball')) {
    return <SportsBasketball />;
  } else if (sportLower.includes('volleyball')) {
    return <SportsVolleyball />;
  } else if (sportLower.includes('swimming')) {
    return <Pool />;
  } else if (sportLower.includes('gym') || sportLower.includes('fitness')) {
    return <FitnessCenter />;
  } else if (sportLower.includes('zumba')) {
    return <DirectionsRun />;
  }
  return <SportsSoccer />;
};

const RegistrationRenewalManagement = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [registrations, setRegistrations] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [renewalsCount, setRenewalsCount] = useState(0);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'expired', 'active'
  const [sportFilter, setSportFilter] = useState('');
  
  // Pagination states
  const [registrationsPage, setRegistrationsPage] = useState(1);
  const [renewalsPage, setRenewalsPage] = useState(1);
  const [registrationsTotalPages, setRegistrationsTotalPages] = useState(1);
  const [renewalsTotalPages, setRenewalsTotalPages] = useState(1);
  
  // Dialog states
  const [renewalFormOpen, setRenewalFormOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [renewalDetailsOpen, setRenewalDetailsOpen] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState(null);

  // Fetch registrations with search and filters
  const fetchRegistrations = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = { 
        page, 
        limit: 10,
        status: statusFilter,
        sport: sportFilter || undefined,
        search: searchTerm || undefined
      };
      const response = await getExpiredRegistrations(params);
      setRegistrations(response.data.registrations);
      setRegistrationsTotalPages(response.data.pagination.pages);
      setRegistrationsPage(page);
    } catch (err) {
      setError('Failed to load registrations');
      console.error('Error fetching registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch renewals
  const fetchRenewals = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRenewals({ page, limit: 10 });
      setRenewals(response.data.renewals);
      setRenewalsTotalPages(response.data.pagination.pages);
      setRenewalsCount(response.data.pagination.total);
      setRenewalsPage(page);
    } catch (err) {
      setError('Failed to load renewals');
      console.error('Error fetching renewals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 0) {
      fetchRegistrations();
    } else {
      fetchRenewals();
    }
  }, [activeTab, statusFilter, sportFilter, searchTerm]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === 0) {
        fetchRegistrations(1); // Reset to first page when searching
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch renewals count on page load to show in tab header
  useEffect(() => {
    const fetchRenewalsCount = async () => {
      try {
        // Fetch with minimal data to get just the count
        const response = await getRenewals({ page: 1, limit: 1 });
        // Update the renewals count in the tab header
        setRenewalsCount(response.data.pagination.total);
      } catch (err) {
        console.error('Error fetching renewals count:', err);
        // Set count to 0 if there's an error
        setRenewalsCount(0);
      }
    };

    fetchRenewalsCount();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRenewRegistration = (registration) => {
    setSelectedRegistration(registration);
    setRenewalFormOpen(true);
  };

  const handleRenewalSuccess = () => {
    setRenewalFormOpen(false);
    setSelectedRegistration(null);
    setSuccess('Registration renewed successfully!');
    setTimeout(() => setSuccess(null), 5000);
    
    // Refresh both tabs
    fetchRegistrations(registrationsPage);
    fetchRenewals(renewalsPage);
    
    // Also refresh the renewals count for the tab header
    const refreshRenewalsCount = async () => {
      try {
        const response = await getRenewals({ page: 1, limit: 1 });
        setRenewalsCount(response.data.pagination.total);
      } catch (err) {
        console.error('Error refreshing renewals count:', err);
      }
    };
    refreshRenewalsCount();
  };

  const handleViewRenewal = (renewal) => {
    setSelectedRenewal(renewal);
    setRenewalDetailsOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 700, 
            color: theme.palette.primary.dark,
            mb: 1
          }}
        >
          Registration Renewal & Extension Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all player registrations, process renewals, extensions, and add new sports. Support for advance renewals before expiry.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab 
              label={`All Registrations (${registrations.length})`} 
              icon={<Add />}
              iconPosition="start"
            />
            <Tab 
              label={`Renewals (${renewalsCount})`} 
              icon={<Refresh />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 0 }}>
          {/* All Registrations Tab */}
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  All Registrations
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => fetchRegistrations(registrationsPage)}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Box>

              {/* Search and Filter Controls */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                  label="Search by name or email"
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ minWidth: 250 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="expired">Expired</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Sport</InputLabel>
                  <Select
                    value={sportFilter}
                    label="Sport"
                    onChange={(e) => setSportFilter(e.target.value)}
                  >
                    <MenuItem value="">All Sports</MenuItem>
                    <MenuItem value="Basketball">Basketball</MenuItem>
                    <MenuItem value="Football">Football</MenuItem>
                    <MenuItem value="Volleyball">Volleyball</MenuItem>
                    <MenuItem value="Self Defense">Self Defense</MenuItem>
                    <MenuItem value="Karate">Karate</MenuItem>
                    <MenuItem value="Gymnastics">Gymnastics</MenuItem>
                    <MenuItem value="Gym">Gym</MenuItem>
                    <MenuItem value="Zumba">Zumba</MenuItem>
                    <MenuItem value="Swimming">Swimming</MenuItem>
                    <MenuItem value="Ping Pong">Ping Pong</MenuItem>
                    <MenuItem value="Fitness">Fitness</MenuItem>
                    <MenuItem value="Crossfit">Crossfit</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : registrations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No registrations found
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Player</TableCell>
                          <TableCell>Sports</TableCell>
                          <TableCell>End Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Original Period</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {registrations.map((registration) => (
                          <TableRow key={registration._id}>
                            <TableCell>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {registration.userId?.firstName} {registration.userId?.lastName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {registration.userId?.email}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {registration.sports.map((sport) => (
                                  <Chip
                                    key={sport}
                                    icon={getSportIcon(sport)}
                                    label={sport}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                color={registration.isExpired ? "error.main" : "text.primary"}
                                fontWeight={600}
                              >
                                {formatDate(registration.endDate)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={registration.statusText}
                                color={
                                  registration.isExpired 
                                    ? "error" 
                                    : registration.daysUntilExpiry <= 7 
                                      ? "warning" 
                                      : "success"
                                }
                                size="small"
                                variant="filled"
                              />
                              {!registration.isExpired && registration.daysUntilExpiry <= 7 && (
                                <Typography variant="caption" color="warning.main" display="block">
                                  {registration.daysUntilExpiry} days left
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {registration.registrationPeriod}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<Add />}
                                onClick={() => handleRenewRegistration(registration)}
                              >
                                Renew/Extend
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {registrationsTotalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination
                        count={registrationsTotalPages}
                        page={registrationsPage}
                        onChange={(event, value) => fetchRegistrations(value)}
                        color="primary"
                      />
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}

          {/* Renewals Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Registration Renewals
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => fetchRenewals(renewalsPage)}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : renewals.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No renewals found
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Player</TableCell>
                          <TableCell>Sports</TableCell>
                          <TableCell>Renewal Period</TableCell>
                          <TableCell>End Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Renewed By</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {renewals.map((renewal) => (
                          <TableRow key={renewal._id}>
                            <TableCell>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {renewal.player.firstName} {renewal.player.lastName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {renewal.player.email}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {renewal.sports.map((sport) => (
                                  <Chip
                                    key={sport}
                                    icon={getSportIcon(sport)}
                                    label={sport}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {renewal.registrationPeriod}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(renewal.endDate)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={renewal.status}
                                color={getStatusColor(renewal.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {renewal.renewedBy?.firstName} {renewal.renewedBy?.lastName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleViewRenewal(renewal)}
                                color="primary"
                              >
                                <Visibility />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {renewalsTotalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination
                        count={renewalsTotalPages}
                        page={renewalsPage}
                        onChange={(event, value) => fetchRenewals(value)}
                        color="primary"
                      />
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Renewal Form Dialog */}
      <RegistrationRenewalForm
        open={renewalFormOpen}
        onClose={() => {
          setRenewalFormOpen(false);
          setSelectedRegistration(null);
        }}
        onSuccess={handleRenewalSuccess}
        originalRegistration={selectedRegistration}
      />

      {/* Renewal Details Dialog */}
      <RenewalDetailsDialog
        open={renewalDetailsOpen}
        onClose={() => {
          setRenewalDetailsOpen(false);
          setSelectedRenewal(null);
        }}
        renewal={selectedRenewal}
      />
    </Box>
  );
};

export default RegistrationRenewalManagement;
