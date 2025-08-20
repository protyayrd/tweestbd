import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../../config/api';

const initialDescriptionState = {
  name: '',
  content: '',
  type: 'main_description'
};

const descriptionTypes = [
  { value: 'main_description', label: 'Main Description' },
  { value: 'product_features', label: 'Product Features' },
  { value: 'perfect_for', label: 'Perfect For' },
  { value: 'additional_information', label: 'Additional Information' }
];

export default function PredefinedDescriptionManager() {
  const [description, setDescription] = useState(initialDescriptionState);
  const [descriptions, setDescriptions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    fetchDescriptions();
  }, [selectedType]);

  const fetchDescriptions = async () => {
    try {
      const url = selectedType === 'all' 
        ? '/api/predefined-descriptions' 
        : `/api/predefined-descriptions?type=${selectedType}`;
      
      const response = await api.get(url);
      setDescriptions(response.data);
    } catch (error) {
      setError('Failed to fetch predefined descriptions');
    }
  };

  const handleInputChange = (e) => {
    setDescription(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await api.put(`/api/predefined-descriptions/${editingId}`, description);
        setSuccess('Description updated successfully');
      } else {
        await api.post('/api/predefined-descriptions', description);
        setSuccess('Description created successfully');
      }
      
      fetchDescriptions();
      setDescription(initialDescriptionState);
      setEditingId(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save description');
    }
  };

  const handleEdit = (desc) => {
    setDescription(desc);
    setEditingId(desc._id);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/predefined-descriptions/${deleteId}`);
      setSuccess('Description deleted successfully');
      fetchDescriptions();
      setDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      setError('Failed to delete description');
    }
  };

  const handleTypeChange = (e, newValue) => {
    setSelectedType(newValue);
  };

  // Filter out tab options for the filter tabs
  const tabOptions = [
    { value: 'all', label: 'All' },
    ...descriptionTypes
  ];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Predefined Descriptions Management
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Create reusable product descriptions that can be selected when creating or editing products
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description Name"
                name="name"
                value={description.name}
                onChange={handleInputChange}
                required
                helperText="Give your description a descriptive name so you can easily find it later"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Description Type</InputLabel>
                <Select
                  name="type"
                  value={description.type}
                  onChange={handleInputChange}
                >
                  {descriptionTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description Content"
                name="content"
                value={description.content}
                onChange={handleInputChange}
                required
                multiline
                rows={6}
                helperText="Enter the full text of the description that will be used in products"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
              >
                {editingId ? 'Update' : 'Create'} Description
              </Button>
              {editingId && (
                <Button
                  sx={{ ml: 2 }}
                  onClick={() => {
                    setDescription(initialDescriptionState);
                    setEditingId(null);
                  }}
                >
                  Cancel Editing
                </Button>
              )}
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedType}
          onChange={handleTypeChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabOptions.map(option => (
            <Tab key={option.value} value={option.value} label={option.label} />
          ))}
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell width="40%">Content Preview</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {descriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No descriptions found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              descriptions.map((desc) => (
                <TableRow key={desc._id}>
                  <TableCell>{desc.name}</TableCell>
                  <TableCell>
                    {descriptionTypes.find(type => type.value === desc.type)?.label || desc.type}
                  </TableCell>
                  <TableCell>
                    {desc.content.length > 100 
                      ? `${desc.content.substring(0, 100)}...` 
                      : desc.content}
                  </TableCell>
                  <TableCell>
                    {new Date(desc.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(desc)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setDeleteId(desc._id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this description? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 