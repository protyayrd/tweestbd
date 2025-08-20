import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Paper,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { getCategories } from '../../../Redux/Admin/Category/Action';
import { selectLevel3Categories, selectCategoryLoading } from '../../../Redux/Admin/Category/Selectors';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

const FeaturedCategories = () => {
  const dispatch = useDispatch();
  const level3Categories = useSelector(selectLevel3Categories);
  const loading = useSelector(selectCategoryLoading);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  const getAuthConfig = () => {
    const token = localStorage.getItem('jwt');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const handleToggleFeatured = async (categoryId, currentValue) => {
    try {
      // Ensure currentValue is a boolean
      const currentBoolValue = Boolean(currentValue);
      const newValue = !currentBoolValue;
      
      console.log('Toggling featured status:', {
        categoryId,
        currentValue: currentBoolValue,
        newValue
      });

      // Create the request data with explicit boolean
      const requestData = {
        featuredInCarousel: newValue
      };

      console.log('Sending update request:', {
        url: `${API_BASE_URL}/api/categories/${categoryId}`,
        data: requestData
      });

      const token = localStorage.getItem('jwt');
      const response = await axios({
        method: 'put',
        url: `${API_BASE_URL}/api/categories/${categoryId}`,
        data: requestData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });


      // Refresh categories after update
      dispatch(getCategories());

      setSnackbar({
        open: true,
        message: `Category ${newValue ? 'added to' : 'removed from'} featured carousel`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating category:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error updating category',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Featured Categories in Carousel
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select which level 3 categories should appear in the homepage carousel
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category Name</TableCell>
                  <TableCell>Parent Category</TableCell>
                  <TableCell align="center">Featured in Carousel</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {level3Categories.map((category) => (
                  <TableRow key={category._id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.parentCategory?.name || '-'}</TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={Boolean(category.featuredInCarousel)}
                        onChange={() => handleToggleFeatured(category._id, category.featuredInCarousel)}
                        color="primary"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {level3Categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography color="text.secondary">
                        No level 3 categories found. Create some level 3 categories first.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FeaturedCategories; 