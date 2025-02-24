import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  Grid,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createCategory, updateCategory, deleteCategory, getAllCategories } from '../../../Redux/Customers/BulkOrder/Action';

const BulkCategoryForm = () => {
  const dispatch = useDispatch();
  const [selectedLevel, setSelectedLevel] = useState('1');
  const [categoryName, setCategoryName] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);

  // Get categories from Redux store
  const { categories, loading } = useSelector((state) => state.bulkOrderCategory);

  useEffect(() => {
    dispatch(getAllCategories())
      .catch((error) => {
        toast.error(error.message || 'Error fetching categories');
      });
  }, [dispatch]);

  // Filter categories by level
  const level1Categories = categories?.filter(cat => !cat.parentCategory);
  const level2Categories = categories?.filter(cat => {
    const parent = categories.find(p => p._id === cat.parentCategory);
    return parent && !parent.parentCategory;
  });
  const level3Categories = categories?.filter(cat => {
    const parent = categories.find(p => p._id === cat.parentCategory);
    return parent && parent.parentCategory;
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    const categoryData = {
      name: categoryName,
      level: parseInt(selectedLevel),
      parentCategory: parentCategory || undefined
    };

    if (editingCategory) {
      // Update existing category
      dispatch(updateCategory(editingCategory._id, categoryData))
        .then(() => {
          toast.success('Category updated successfully');
          resetForm();
        })
        .catch((error) => {
          toast.error(error.message || 'Error updating category');
        });
    } else {
      // Create new category
      dispatch(createCategory(categoryData))
        .then(() => {
          toast.success('Category created successfully');
          resetForm();
        })
        .catch((error) => {
          toast.error(error.message || 'Error creating category');
        });
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setSelectedLevel(category.level.toString());
    setParentCategory(category.parentCategory || '');
  };

  const handleDelete = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      dispatch(deleteCategory(categoryId))
        .then(() => {
          toast.success('Category deleted successfully');
        })
        .catch((error) => {
          toast.error(error.message || 'Error deleting category');
        });
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setCategoryName('');
    setSelectedLevel('1');
    setParentCategory('');
  };

  const renderCategoryList = (categories, level) => (
    <List>
      {categories?.map((category) => (
        <ListItem key={category._id}>
          <ListItemText
            primary={category.name}
            secondary={category.parentCategory ? `Parent: ${categories.find(c => c._id === category.parentCategory)?.name}` : 'Top Level'}
          />
          <ListItemSecondaryAction>
            <IconButton onClick={() => handleEdit(category)} color="primary">
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => handleDelete(category._id)} color="error">
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {editingCategory ? 'Edit Category' : 'Create New Category'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <Select
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value);
                    setParentCategory('');
                  }}
                  disabled={loading}
                >
                  <MenuItem value="1">Level 1 (Top Level)</MenuItem>
                  <MenuItem value="2">Level 2</MenuItem>
                  <MenuItem value="3">Level 3</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {selectedLevel !== '1' && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <Select
                    value={parentCategory}
                    onChange={(e) => setParentCategory(e.target.value)}
                    displayEmpty
                    disabled={loading}
                  >
                    <MenuItem value="">Select Parent Category</MenuItem>
                    {selectedLevel === '2' &&
                      level1Categories?.map((cat) => (
                        <MenuItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    {selectedLevel === '3' &&
                      level2Categories?.map((cat) => (
                        <MenuItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Category Name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || (selectedLevel !== '1' && !parentCategory)}
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
              {editingCategory && (
                <Button
                  variant="outlined"
                  onClick={resetForm}
                  sx={{ ml: 2 }}
                >
                  Cancel
                </Button>
              )}
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Level 1 Categories
        </Typography>
        {renderCategoryList(level1Categories, 1)}

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Level 2 Categories
        </Typography>
        {renderCategoryList(level2Categories, 2)}

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Level 3 Categories
        </Typography>
        {renderCategoryList(level3Categories, 3)}
      </Paper>
    </Box>
  );
};

export default BulkCategoryForm; 
