import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import api from '../../../config/api';

const JerseyFormSettings = () => {
  const [settings, setSettings] = useState({
    jerseyCategories: [],
    jerseySizes: [],
    sscBatchYears: [],
    defaultLocation: {
      zipCode: '',
      division: '',
      district: ''
    },
    isFormActive: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editType, setEditType] = useState(''); // 'category' or 'size' or 'year'

  useEffect(() => {
    // Check for token on mount
    const token = localStorage.getItem('jwt');
    if (!token) {
      setError('Authentication required. Please login again or use the "Get Auth Token" button below.');
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/jersey-form-settings');
      setSettings(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jersey form settings:', error);
      setError(`Failed to fetch settings: ${error.response?.data?.message || error.message}`);
      // Create default settings if none exist to prevent UI errors
      setSettings({
        jerseyCategories: [
          { 
            name: 'Half Sleeve', 
            price: 10, 
            image: '/images/half-sleeve.jpg',
            isActive: true
          },
          { 
            name: 'Full Sleeve', 
            price: 15, 
            image: '/images/full-sleeve.jpg',
            isActive: true
          }
        ],
        jerseySizes: [
          { size: 'S', chest: '36-38"', length: '26"', shoulder: '17"', isActive: true },
          { size: 'M', chest: '38-40"', length: '27"', shoulder: '18"', isActive: true },
          { size: 'L', chest: '40-42"', length: '28"', shoulder: '19"', isActive: true },
          { size: 'XL', chest: '42-44"', length: '29"', shoulder: '20"', isActive: true },
          { size: 'XXL', chest: '44-46"', length: '30"', shoulder: '21"', isActive: true },
          { size: '3XL', chest: '46-48"', length: '31"', shoulder: '22"', isActive: true }
        ],
        sscBatchYears: [
          { year: '2015', isActive: true },
          { year: '2016', isActive: true },
          { year: '2017', isActive: true },
          { year: '2018', isActive: true },
          { year: '2019', isActive: true },
          { year: '2020', isActive: true },
          { year: '2021', isActive: true },
          { year: '2022', isActive: true },
          { year: '2023', isActive: true }
        ],
        defaultLocation: {
          zipCode: '5100',
          division: 'Rangpur',
          district: 'Thakurgaon'
        },
        isFormActive: true
      });
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setLoading(true);
      
      // Make sure we have a valid token
      const token = localStorage.getItem('jwt');
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }
      
      const response = await api.put('/api/jersey-form-settings', settings);
      setSuccess('Settings updated successfully');
      setLoading(false);
    } catch (error) {
      console.error('Failed to update settings:', error);
      setError(`Failed to update settings: ${error.response?.data?.message || error.message}`);
      setLoading(false);
    }
  };

  const handleToggleFormStatus = async () => {
    try {
      setLoading(true);
      
      // Make sure we have a valid token
      const token = localStorage.getItem('jwt');
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }
      
      const response = await api.put('/api/jersey-form-settings/toggle-status');
      setSettings(response.data.data);
      setSuccess('Form status updated successfully');
      setLoading(false);
    } catch (error) {
      console.error('Failed to toggle form status:', error);
      setError(`Failed to toggle form status: ${error.response?.data?.message || error.message}`);
      setLoading(false);
    }
  };

  const handleAddItem = (type) => {
    setEditType(type);
    setEditingItem(type === 'category' ? {
      name: '',
      price: 0,
      image: '',
      isActive: true
    } : type === 'size' ? {
      size: '',
      chest: '',
      length: '',
      shoulder: '',
      isActive: true
    } : {
      year: '',
      isActive: true
    });
    setOpenDialog(true);
  };

  const handleEditItem = (type, item) => {
    setEditType(type);
    setEditingItem({ ...item });
    setOpenDialog(true);
  };

  const handleDeleteItem = (type, index) => {
    const newSettings = { ...settings };
    if (type === 'category') {
      newSettings.jerseyCategories.splice(index, 1);
    } else if (type === 'size') {
      newSettings.jerseySizes.splice(index, 1);
    } else {
      newSettings.sscBatchYears.splice(index, 1);
    }
    setSettings(newSettings);
  };

  const handleSaveItem = () => {
    const newSettings = { ...settings };
    if (editType === 'category') {
      if (editingItem._id) {
        const index = newSettings.jerseyCategories.findIndex(c => c._id === editingItem._id);
        newSettings.jerseyCategories[index] = editingItem;
      } else {
        newSettings.jerseyCategories.push(editingItem);
      }
    } else if (editType === 'size') {
      if (editingItem._id) {
        const index = newSettings.jerseySizes.findIndex(s => s._id === editingItem._id);
        newSettings.jerseySizes[index] = editingItem;
      } else {
        newSettings.jerseySizes.push(editingItem);
      }
    } else {
      if (editingItem._id) {
        const index = newSettings.sscBatchYears.findIndex(y => y._id === editingItem._id);
        newSettings.sscBatchYears[index] = editingItem;
      } else {
        newSettings.sscBatchYears.push(editingItem);
      }
    }
    setSettings(newSettings);
    setOpenDialog(false);
  };

  // Function to check authentication and show it to the user
  const checkAuthentication = () => {
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        // Show just the first part of the token for security
        const tokenStart = token.substring(0, 15);
        setSuccess(`Token found: ${tokenStart}...`);
      } catch (e) {
        setError(`Token parsing error: ${e.message}`);
      }
    } else {
      setError('No authentication token found. Please login again.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h1">
            Jersey Form Settings
          </Typography>
          <Box>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={checkAuthentication} 
              sx={{ mr: 2 }}
            >
              Check Auth
            </Button>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.isFormActive}
                  onChange={handleToggleFormStatus}
                  color="primary"
                />
              }
              label="Form Active"
            />
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={3}>
          {/* Jersey Categories */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Jersey Categories</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={() => handleAddItem('category')}
                  >
                    Add Category
                  </Button>
                </Box>
                {settings.jerseyCategories.map((category, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1">{category.name}</Typography>
                          <Typography variant="body2">Price: ${category.price}</Typography>
                          <Typography variant="body2">Image: {category.image}</Typography>
                        </Box>
                        <Box>
                          <IconButton onClick={() => handleEditItem('category', category)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteItem('category', index)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Jersey Sizes */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Jersey Sizes</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={() => handleAddItem('size')}
                  >
                    Add Size
                  </Button>
                </Box>
                {settings.jerseySizes.map((size, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1">Size: {size.size}</Typography>
                          <Typography variant="body2">Chest: {size.chest}</Typography>
                          <Typography variant="body2">Length: {size.length}</Typography>
                          <Typography variant="body2">Shoulder: {size.shoulder}</Typography>
                        </Box>
                        <Box>
                          <IconButton onClick={() => handleEditItem('size', size)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteItem('size', index)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* SSC Batch Years */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">SSC Batch Years</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={() => handleAddItem('year')}
                  >
                    Add Year
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  {settings.sscBatchYears.map((yearItem, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1">{yearItem.year}</Typography>
                            <Box>
                              <IconButton onClick={() => handleEditItem('year', yearItem)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton onClick={() => handleDeleteItem('year', index)}>
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Default Location */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>Default Location</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Zip Code"
                      value={settings.defaultLocation.zipCode}
                      onChange={(e) => setSettings({
                        ...settings,
                        defaultLocation: {
                          ...settings.defaultLocation,
                          zipCode: e.target.value
                        }
                      })}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Division"
                      value={settings.defaultLocation.division}
                      onChange={(e) => setSettings({
                        ...settings,
                        defaultLocation: {
                          ...settings.defaultLocation,
                          division: e.target.value
                        }
                      })}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="District"
                      value={settings.defaultLocation.district}
                      onChange={(e) => setSettings({
                        ...settings,
                        defaultLocation: {
                          ...settings.defaultLocation,
                          district: e.target.value
                        }
                      })}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdateSettings}
            disabled={loading}
          >
            Save Changes
          </Button>
        </Box>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editType === 'category' ? 'Edit Jersey Category' : 
           editType === 'size' ? 'Edit Jersey Size' : 'Edit SSC Batch Year'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {editingItem && editType === 'category' ? (
              <>
                <TextField
                  fullWidth
                  label="Name"
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={editingItem.price || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Image URL"
                  value={editingItem.image || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingItem.isActive || false}
                      onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </>
            ) : editingItem && editType === 'size' ? (
              <>
                <TextField
                  fullWidth
                  label="Size"
                  value={editingItem.size || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, size: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Chest"
                  value={editingItem.chest || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, chest: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Length"
                  value={editingItem.length || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, length: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Shoulder"
                  value={editingItem.shoulder || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, shoulder: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingItem.isActive || false}
                      onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </>
            ) : editingItem && editType === 'year' ? (
              <>
                <TextField
                  fullWidth
                  label="Year"
                  value={editingItem.year || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, year: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingItem.isActive || false}
                      onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </>
            ) : null}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveItem} variant="contained" disabled={!editingItem}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JerseyFormSettings; 