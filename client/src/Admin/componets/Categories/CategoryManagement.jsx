import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  Grid,
  TextField,
  Button,
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
  Paper,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { createCategory, getCategories, updateCategory, deleteCategory } from '../../../Redux/Admin/Category/Action';
import { selectCategories } from '../../../Redux/Admin/Category/Selectors';

const CategoryManagement = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);
  const jwt = localStorage.getItem("jwt");

  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    parentCategory: '',
    level: 1,
    description: '',
    image: null
  });

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  // Add debug logs for categories
  useEffect(() => {
    if (categories?.length > 0) {
      console.log('First category image URL:', 
        `${process.env.REACT_APP_API_URL}${categories[0].imageUrl.startsWith('/') ? '' : '/'}${categories[0].imageUrl}` 
        || '/placeholder.png'
      );
    }
  }, [categories]);

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditMode(true);
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        parentCategory: category.parentCategory?._id || '',
        level: category.level,
        description: category.description || '',
        image: null
      });
      setImagePreview(category?.imageUrl ? `${process.env.REACT_APP_API_URL}${category.imageUrl}` : '');
    } else {
      setEditMode(false);
      setSelectedCategory(null);
      setFormData({
        name: '',
        parentCategory: '',
        level: 1,
        description: '',
        image: null
      });
      setImagePreview('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      parentCategory: '',
      level: 1,
      description: '',
      image: null
    });
    setImagePreview('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('level', formData.level);
    data.append('description', formData.description);
    if (formData.parentCategory) {
      data.append('parentCategory', formData.parentCategory);
    }
    if (formData.image) {
      data.append('image', formData.image);
    }

    if (editMode) {
      await dispatch(updateCategory({ categoryId: selectedCategory._id, data, jwt }));
    } else {
      await dispatch(createCategory({ data, jwt }));
    }

    handleCloseDialog();
    dispatch(getCategories());
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      await dispatch(deleteCategory({ categoryId, jwt }));
      dispatch(getCategories());
    }
  };

  const getParentOptions = (level) => {
    return categories?.filter(cat => cat.level < level) || [];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Category Management"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ backgroundColor: '#084848' }}
            >
              Add Category
            </Button>
          }
        />
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Parent Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories?.map((category) => (
              <TableRow key={category._id}>
                <TableCell>
                  <img
                    src={category.imageUrl ? `${process.env.REACT_APP_API_URL}${category.imageUrl}` : '/placeholder.png'}
                    alt={category.name}
                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                </TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.level}</TableCell>
                <TableCell>{category.parentCategory?.name || '-'}</TableCell>
                <TableCell>{category.description || '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(category)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteCategory(category._id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Category' : 'Add New Category'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Category Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Level</InputLabel>
                  <Select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    required
                  >
                    <MenuItem value={1}>Level 1</MenuItem>
                    <MenuItem value={2}>Level 2</MenuItem>
                    <MenuItem value={3}>Level 3</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {formData.level > 1 && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Parent Category</InputLabel>
                    <Select
                      name="parentCategory"
                      value={formData.parentCategory}
                      onChange={handleChange}
                      required
                    >
                      {getParentOptions(formData.level).map((cat) => (
                        <MenuItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <input
                  accept="image/*"
                  type="file"
                  id="image-upload"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
                <label htmlFor="image-upload">
                  <Button variant="outlined" component="span" fullWidth>
                    {editMode ? 'Change Image' : 'Upload Image'}
                  </Button>
                </label>
                {imagePreview && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }}
                    />
                  </Box>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              sx={{ backgroundColor: '#084848' }}
            >
              {editMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CategoryManagement; 