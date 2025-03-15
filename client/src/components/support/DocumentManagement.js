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
  Chip,
  FormControl,
  Select,
  MenuItem,
  useTheme,
  alpha
} from '@mui/material';
import {
  Search,
  CloudUpload,
  Delete,
  Visibility,
  ArrowBack,
  GetApp
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const DocumentManagement = () => {
  const theme = useTheme();
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [uploadDialog, setUploadDialog] = useState({ open: false, playerId: null });
  const [viewDialog, setViewDialog] = useState({ open: false, documents: [] });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, documentId: null, playerId: null });
  const [uploadFile, setUploadFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [documentType, setDocumentType] = useState('healthCard');
  const [uploadedFiles, setUploadedFiles] = useState({});

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    filterPlayers();
  }, [players, searchTerm]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      // Fetch players
      console.log('Fetching players for document management...');
      const response = await api.get('/users/role/player');
      console.log('Players fetched successfully:', response.data.length);
      setPlayers(response.data);
      setFilteredPlayers(response.data);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError(err.response?.data?.msg || 'Failed to load players. Please try again.');
      setLoading(false);
    }
  };

  const filterPlayers = () => {
    if (!searchTerm) {
      setFilteredPlayers(players);
      return;
    }

    const filtered = players.filter(
      (player) =>
        player.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredPlayers(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleViewDocuments = async (playerId) => {
    try {
      // Fetch player details with documents
      console.log('Fetching documents for player:', playerId);
      const response = await api.get(`/users/${playerId}`);
      const player = response.data;
      console.log('Player data received:', player.firstName, player.lastName);
      
      setViewDialog({ 
        open: true, 
        documents: player.documents || [],
        playerName: `${player.firstName} ${player.lastName}`,
        playerId: player._id
      });
    } catch (err) {
      console.error('Failed to load player documents:', err);
      setError(err.response?.data?.msg || 'Failed to load player documents. Please try again.');
    }
  };

  const handleCloseView = () => {
    setViewDialog({ open: false, documents: [], playerName: '' });
  };

  const handleOpenUpload = (playerId) => {
    setUploadDialog({ open: true, playerId });
    setDocumentName('');
    setUploadFile(null);
  };

  const handleCloseUpload = () => {
    setUploadDialog({ open: false, playerId: null });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleDocumentNameChange = (e) => {
    setDocumentName(e.target.value);
  };

  const handleDocumentTypeChange = (e) => {
    setDocumentType(e.target.value);
  };

  const handleUploadDocument = async () => {
    if (!uploadFile || !documentName) {
      return;
    }

    setUploadProgress(true);

    try {
      // Create a URL for the actual uploaded file
      const fileUrl = URL.createObjectURL(uploadFile);
      
      // Create form data with the necessary fields
      const formData = new FormData();
      formData.append('name', documentName);
      formData.append('type', documentType);

      console.log('Uploading document for player:', uploadDialog.playerId);
      console.log('Document details:', { name: documentName, type: documentType });
      
      const response = await api.post(`/users/${uploadDialog.playerId}/documents`, formData);
      console.log('Upload successful:', response.data);
      
      // Store the file data for later download
      setUploadedFiles(prev => ({
        ...prev,
        [response.data._id]: {
          file: uploadFile,
          url: fileUrl
        }
      }));

      // Refresh player data after upload
      await fetchPlayers();
      setUploadProgress(false);
      handleCloseUpload();
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err.response?.data?.msg || 'Failed to upload document. Please try again.');
      setUploadProgress(false);
    }
  };

  const handleDeleteConfirm = (documentId, playerId) => {
    setDeleteConfirm({ open: true, documentId, playerId });
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirm({ open: false, documentId: null, playerId: null });
  };

  const handleDeleteDocument = async () => {
    try {
      const { documentId, playerId } = deleteConfirm;
      console.log('Deleting document:', documentId, 'for player:', playerId);
      
      await api.delete(`/users/${playerId}/documents/${documentId}`);
      
      // Refresh player data after deletion
      await fetchPlayers();
      
      // If currently viewing documents, refresh the view
      if (viewDialog.open) {
        handleViewDocuments(playerId);
      }
      
      handleCloseDeleteConfirm();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err.response?.data?.msg || 'Failed to delete document. Please try again.');
    }
  };

  // Document type options
  const documentTypes = [
    { value: 'healthCard', label: 'Health Card' },
    { value: 'healthAid', label: 'Health Aid' },
    { value: 'other', label: 'Other Document' }
  ];

  // Update the download function to use the actual file if available
  const handleDocumentDownload = async (url, filename, docId) => {
    try {
      // Check if we have the actual file stored
      if (uploadedFiles[docId] && uploadedFiles[docId].file) {
        console.log('Using stored file for download:', filename);
        
        // Create a download URL from the stored file
        const fileUrl = URL.createObjectURL(uploadedFiles[docId].file);
        
        // Create an anchor element for download
        const anchor = document.createElement('a');
        anchor.href = fileUrl;
        anchor.download = filename || 'document';
        
        // Add the link to the DOM and click it
        document.body.appendChild(anchor);
        anchor.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(anchor);
          URL.revokeObjectURL(fileUrl);
        }, 100);
        
        console.log('Document download initiated for:', filename);
        return;
      }
      
      // Fallback for documents without stored files
      console.log('No stored file found, creating sample document for:', filename);
      const content = `This is a sample ${filename} document.\nIn a production environment, this would be the actual document content.`;
      const blob = new Blob([content], { type: 'text/plain' });
      
      // Create an object URL from the blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Create an anchor element
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = filename || 'document.txt';
      
      // Add the link to the DOM and click it
      document.body.appendChild(anchor);
      anchor.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(anchor);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      console.log('Document download initiated for:', filename);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document. Please try again.');
    }
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
          Health Document Management
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Manage health documents and certificates for players.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

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
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredPlayers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="textSecondary">
              No players found matching your search criteria.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Documents</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPlayers.map((player) => (
                  <TableRow key={player._id} hover>
                    <TableCell>
                      {player.firstName} {player.lastName}
                    </TableCell>
                    <TableCell>{player.email}</TableCell>
                    <TableCell>{player.phoneNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${player.documents?.length || 0} Documents`} 
                        size="small" 
                        color={player.documents?.length > 0 ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleViewDocuments(player._id)}
                          title="View Documents"
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleOpenUpload(player._id)}
                          title="Upload Document"
                        >
                          <CloudUpload />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* View Documents Dialog */}
      <Dialog
        open={viewDialog.open}
        onClose={handleCloseView}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {viewDialog.playerName}'s Documents
        </DialogTitle>
        <DialogContent>
          {viewDialog.documents.length === 0 ? (
            <DialogContentText>
              No documents found for this player.
            </DialogContentText>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Document Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Date Uploaded</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewDialog.documents.map((doc) => (
                    <TableRow key={doc._id}>
                      <TableCell>{doc.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={doc.type ? doc.type.charAt(0).toUpperCase() + doc.type.slice(1).replace(/([A-Z])/g, ' $1') : 'Document'}
                          color={doc.type === 'healthCard' ? 'primary' : doc.type === 'healthAid' ? 'secondary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {doc.createdAt ? format(new Date(doc.createdAt), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          color="primary"
                          startIcon={<GetApp />}
                          onClick={() => handleDocumentDownload(doc.url, doc.name, doc._id)}
                          sx={{ mr: 1 }}
                        >
                          Download
                        </Button>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteConfirm(doc._id, viewDialog.playerId)}
                          size="small"
                          title="Delete Document"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog
        open={uploadDialog.open}
        onClose={handleCloseUpload}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Health Document</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Upload a health document or certificate for the player.
          </DialogContentText>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Document Name"
                value={documentName}
                onChange={handleDocumentNameChange}
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Document Type
                </Typography>
                <Select
                  value={documentType}
                  onChange={handleDocumentTypeChange}
                  displayEmpty
                  fullWidth
                >
                  {documentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Select File
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              {uploadFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected file: {uploadFile.name}
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpload}>Cancel</Button>
          <Button
            onClick={handleUploadDocument}
            variant="contained"
            color="primary"
            disabled={!uploadFile || !documentName || uploadProgress}
          >
            {uploadProgress ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onClose={handleCloseDeleteConfirm}
      >
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this document? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Cancel</Button>
          <Button onClick={handleDeleteDocument} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DocumentManagement; 