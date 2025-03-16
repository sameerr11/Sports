import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Grid, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination, 
  Chip, 
  IconButton, 
  Box,
  Tooltip,
  Divider
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getRegistrations } from '../../services/registrationService';
import { useAuth } from '../../contexts/AuthContext';

const RegistrationList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const isAdmin = user && user.role === 'admin';
  const isAccounting = user && user.role === 'accounting';
  
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const data = await getRegistrations();
        setRegistrations(data);
      } catch (err) {
        console.error('Error fetching registrations:', err);
        setError('Failed to load registrations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRegistrations();
  }, []);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'error';
      case 'Completed':
        return 'info';
      default:
        return 'warning';
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Player Registrations
          </Typography>
          
          {isAccounting && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/registrations/new')}
            >
              New Registration
            </Button>
          )}
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {loading ? (
          <Typography>Loading registrations...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Sports</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>Fee</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registrations
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((registration) => (
                      <TableRow key={registration._id}>
                        <TableCell>
                          {registration.player.firstName} {registration.player.lastName}
                        </TableCell>
                        <TableCell>
                          {registration.sports.join(', ')}
                        </TableCell>
                        <TableCell>
                          {registration.registrationPeriod}
                        </TableCell>
                        <TableCell>
                          {format(new Date(registration.startDate), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          ${registration.fee.amount}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={registration.status} 
                            color={getStatusColor(registration.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Registration">
                            <IconButton
                              color="primary"
                              onClick={() => navigate(`/registrations/${registration._id}`)}
                              size="small"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  
                  {registrations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body1" py={2}>
                          No registrations found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={registrations.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Container>
  );
};

export default RegistrationList; 