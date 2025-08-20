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
  DialogActions
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories } from '../../../Redux/Admin/Category/Action';
import api from '../../../config/api';

const initialSizeGuideState = {
  name: '',
  category: '',
  measurements: {
    S: { chest: '', length: '', shoulder: '' },
    M: { chest: '', length: '', shoulder: '' },
    L: { chest: '', length: '', shoulder: '' },
    XL: { chest: '', length: '', shoulder: '' },
    XXL: { chest: '', length: '', shoulder: '' }
  }
};

const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
const measurements = ['chest', 'length', 'shoulder'];

export default function SizeGuideManager() {
  const dispatch = useDispatch();
  const [sizeGuide, setSizeGuide] = useState(initialSizeGuideState);
  const [sizeGuides, setSizeGuides] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const { categories } = useSelector((store) => store.category);
  const level3Categories = categories?.filter(cat => cat.level === 3) || [];

  useEffect(() => {
    dispatch(getCategories());
    fetchSizeGuides();
  }, [dispatch]);

  const fetchSizeGuides = async () => {
    try {
      const response = await api.get('/api/size-guides');
      setSizeGuides(response.data);
    } catch (error) {
      setError('Failed to fetch size guides');
    }
  };

  const handleInputChange = (size, measurement, value) => {
    setSizeGuide(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [size]: {
          ...prev.measurements[size],
          [measurement]: value
        }
      }
    }));
  };

  const handleBasicInfoChange = (e) => {
    setSizeGuide(prev => ({
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
        await api.put(`/api/size-guides/${editingId}`, sizeGuide);
        setSuccess('Size guide updated successfully');
      } else {
        await api.post('/api/size-guides', sizeGuide);
        setSuccess('Size guide created successfully');
      }
      
      fetchSizeGuides();
      setSizeGuide(initialSizeGuideState);
      setEditingId(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save size guide');
    }
  };

  const handleEdit = (guide) => {
    setSizeGuide(guide);
    setEditingId(guide._id);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/size-guides/${deleteId}`);
      setSuccess('Size guide deleted successfully');
      fetchSizeGuides();
      setDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      setError('Failed to delete size guide');
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Size Guide Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Size Guide Name"
                name="name"
                value={sizeGuide.name}
                onChange={handleBasicInfoChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={sizeGuide.category}
                  onChange={handleBasicInfoChange}
                >
                  {level3Categories.map((cat) => (
                    <MenuItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {sizes.map((size) => (
              <Grid item xs={12} key={size}>
                <Typography variant="h6" gutterBottom>
                  Size {size}
                </Typography>
                <Grid container spacing={2}>
                  {measurements.map((measurement) => (
                    <Grid item xs={12} sm={4} key={measurement}>
                      <TextField
                        fullWidth
                        label={measurement.charAt(0).toUpperCase() + measurement.slice(1)}
                        value={sizeGuide.measurements[size][measurement]}
                        onChange={(e) => handleInputChange(size, measurement, e.target.value)}
                        required
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
              >
                {editingId ? 'Update' : 'Create'} Size Guide
              </Button>
              {editingId && (
                <Button
                  sx={{ ml: 2 }}
                  onClick={() => {
                    setSizeGuide(initialSizeGuideState);
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sizeGuides.map((guide) => (
              <TableRow key={guide._id}>
                <TableCell>{guide.name}</TableCell>
                <TableCell>{guide.category.name}</TableCell>
                <TableCell>
                  {new Date(guide.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(guide)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setDeleteId(guide._id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this size guide?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 