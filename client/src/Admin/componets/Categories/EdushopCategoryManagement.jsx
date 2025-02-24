import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  createEdushopCategory,
  getEdushopCategories,
  updateEdushopCategory,
  deleteEdushopCategory,
} from '../../../Redux/Admin/Edushop/Action';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const EdushopCategoryManagement = () => {
  const dispatch = useDispatch();
  const { auth } = useSelector((state) => state);
  const { categories, loading, error, success } = useSelector((state) => state.edushop);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 1,
    displayOrder: 0,
    parentCategory: '',
    logo: null,
    image: null,
  });

  useEffect(() => {
    dispatch(getEdushopCategories());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
    if (success) {
      setSnackbarMessage(selectedCategory ? 'Category updated successfully' : 'Category created successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      handleCloseDialog();
    }
  }, [error, success]);

  const handleOpenDialog = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        level: category.level,
        displayOrder: category.displayOrder || 0,
        parentCategory: category.parentCategory || '',
        logo: null,
        image: null,
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: '',
        description: '',
        level: 1,
        displayOrder: 0,
        parentCategory: '',
        logo: null,
        image: null,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      description: '',
      level: 1,
      displayOrder: 0,
      parentCategory: '',
      logo: null,
      image: null,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      // Check file size (5MB limit)
      if (files[0].size > 5 * 1024 * 1024) {
        setSnackbarMessage('File size should be less than 5MB');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      // Check file type
      if (!files[0].type.startsWith('image/')) {
        setSnackbarMessage('Please upload an image file');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  const getLevel1Categories = () => {
    return categories.filter(cat => cat.level === 1);
  };

  const getLevel2Categories = (parentId) => {
    return categories.filter(cat => cat.level === 2 && cat.parentCategory === parentId);
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.name || !formData.level) {
      setSnackbarMessage('Name and Level are required');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    // Validate parent category for level 2
    if (formData.level === 2 && !formData.parentCategory) {
      setSnackbarMessage('Parent category is required for Level 2 categories');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const data = new FormData();
    
    // Add text fields
    data.append('name', formData.name.trim());
    data.append('level', String(formData.level));
    if (formData.description) data.append('description', formData.description.trim());
    if (formData.displayOrder !== undefined) data.append('displayOrder', String(formData.displayOrder));
    if (formData.parentCategory) data.append('parentCategory', formData.parentCategory);

    // Add files only if they exist
    if (formData.logo instanceof File) {
      data.append('logo', formData.logo);
    }
    if (formData.image instanceof File) {
      data.append('image', formData.image);
    }

    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      setSnackbarMessage('Authentication token not found. Please login again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    if (selectedCategory) {
      dispatch(updateEdushopCategory(selectedCategory._id, data, jwt));
    } else {
      dispatch(createEdushopCategory(data, jwt));
    }
  };

  const handleDelete = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        setSnackbarMessage('Authentication token not found. Please login again.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }
      dispatch(deleteEdushopCategory(categoryId, jwt));
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Edushop Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Add Category
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {categories.some(cat => cat.level === 1) && (
                <TableCell>Logo</TableCell>
              )}
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Parent Category</TableCell>
              <TableCell>Display Order</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow 
                key={category._id}
                sx={{
                  backgroundColor: category.level === 2 ? 'rgba(0, 0, 0, 0.02)' : 'inherit',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                }}
              >
                {categories.some(cat => cat.level === 1) && (
                  <TableCell>
                    {category.level === 1 && category.logoUrl && (
                      <img
                        src={`${process.env.REACT_APP_API_URL}${category.logoUrl}`}
                        alt={`${category.name} logo`}
                        style={{ width: 50, height: 50, objectFit: 'contain' }}
                      />
                    )}
                  </TableCell>
                )}
                <TableCell>
                  {category.imageUrl && (
                    <img
                      src={`${process.env.REACT_APP_API_URL}${category.imageUrl}`}
                      alt={category.name}
                      style={{ width: 50, height: 50, objectFit: 'cover' }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {category.level === 2 && <span style={{ marginRight: '8px' }}>└─</span>}
                    {category.name}
                  </Box>
                </TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>Level {category.level}</TableCell>
                <TableCell>
                  {category.level === 2 && category.parentCategory ? (
                    categories.find(c => c._id === category.parentCategory)?.name
                  ) : ''}
                </TableCell>
                <TableCell>{category.displayOrder}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(category)} disabled={loading}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(category._id)} disabled={loading}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Name"
                fullWidth
                required
                value={formData.name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Level</InputLabel>
                <Select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  label="Level"
                >
                  <MenuItem value={1}>Level 1</MenuItem>
                  <MenuItem value={2}>Level 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="displayOrder"
                label="Display Order"
                type="number"
                fullWidth
                value={formData.displayOrder}
                onChange={handleInputChange}
              />
            </Grid>
            {formData.level === 2 && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Parent Category</InputLabel>
                  <Select
                    name="parentCategory"
                    value={formData.parentCategory}
                    onChange={handleInputChange}
                    label="Parent Category"
                  >
                    {getLevel1Categories().map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {formData.level === 1 && (
              <Grid item xs={6}>
                <Button 
                  variant="outlined" 
                  component="label" 
                  fullWidth
                  sx={{
                    height: '100%',
                    borderColor: formData.logo ? 'success.main' : 'primary.main',
                    color: formData.logo ? 'success.main' : 'primary.main'
                  }}
                >
                  {formData.logo ? 'Logo Selected ✓' : `Upload Logo ${!selectedCategory ? '*' : ''}`}
                  <input
                    type="file"
                    name="logo"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>
                {formData.logo && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Selected: {formData.logo.name}
                  </Typography>
                )}
              </Grid>
            )}
            <Grid item xs={formData.level === 1 ? 6 : 12}>
              <Button 
                variant="outlined" 
                component="label" 
                fullWidth
                sx={{
                  height: '100%',
                  borderColor: formData.image ? 'success.main' : 'primary.main',
                  color: formData.image ? 'success.main' : 'primary.main'
                }}
              >
                {formData.image ? 'Image Selected ✓' : `Upload Category Image ${!selectedCategory ? '*' : ''}`}
                <input
                  type="file"
                  name="image"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
              {formData.image && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Selected: {formData.image.name}
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            {loading ? 'Processing...' : selectedCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ 
            width: '100%',
            backgroundColor: snackbarSeverity === 'success' ? '#f6ffed' : '#fff2f0',
            color: snackbarSeverity === 'success' ? '#52c41a' : '#ff4d4f'
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EdushopCategoryManagement; 