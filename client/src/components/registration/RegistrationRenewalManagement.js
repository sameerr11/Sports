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
  const [expiredRegistrations, setExpiredRegistrations] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [renewalsCount, setRenewalsCount] = useState(0);
  
  // Pagination states
  const [expiredPage, setExpiredPage] = useState(1);
  const [renewalsPage, setRenewalsPage] = useState(1);
  const [expiredTotalPages, setExpiredTotalPages] = useState(1);
  const [renewalsTotalPages, setRenewalsTotalPages] = useState(1);
  
  // Dialog states
  const [renewalFormOpen, setRenewalFormOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [renewalDetailsOpen, setRenewalDetailsOpen] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState(null);

  // Fetch expired registrations
  const fetchExpiredRegistrations = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getExpiredRegistrations({ page, limit: 10 });
      setExpiredRegistrations(response.data.registrations);
      setExpiredTotalPages(response.data.pagination.pages);
      setExpiredPage(page);
    } catch (err) {
      setError('Failed to load expired registrations');
      console.error('Error fetching expired registrations:', err);
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
      fetchExpiredRegistrations();
    } else {
      fetchRenewals();
    }
  }, [activeTab]);

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
    fetchExpiredRegistrations(expiredPage);
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
          Manage expired player registrations, process renewals, and add new sports to existing registrations
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
              label={`Expired Registrations (${expiredRegistrations.length})`} 
              icon={<Cancel />}
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
          {/* Expired Registrations Tab */}
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Expired Registrations
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => fetchExpiredRegistrations(expiredPage)}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : expiredRegistrations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No expired registrations found
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
                          <TableCell>Expired Date</TableCell>
                          <TableCell>Original Period</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {expiredRegistrations.map((registration) => (
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
                                color="error.main"
                                fontWeight={600}
                              >
                                {formatDate(registration.endDate)}
                              </Typography>
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

                  {expiredTotalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination
                        count={expiredTotalPages}
                        page={expiredPage}
                        onChange={(event, value) => fetchExpiredRegistrations(value)}
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
