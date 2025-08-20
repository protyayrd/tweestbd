import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Autocomplete,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Delete,
  Edit,
  Add,
  FilterList,
  Search,
  Refresh,
  VerifiedUser,
} from '@mui/icons-material';
import api from '../../../config/api';

const ReviewsManagement = () => {
  
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalReviews, setTotalReviews] = useState(0);
  
  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  
  // Form states
  const [formProduct, setFormProduct] = useState(null);
  const [formRating, setFormRating] = useState(5);
  const [formReview, setFormReview] = useState('');
  const [formUserName, setFormUserName] = useState('');
  const [formUserEmail, setFormUserEmail] = useState('');
  const [formVerifiedPurchase, setFormVerifiedPurchase] = useState(true);
  
  // Notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchProducts();
        await fetchReviews();
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load data. Please try again.',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch reviews with pagination and filters
  const fetchReviews = async () => {
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };
      
      if (selectedProduct) {
        params.productId = selectedProduct._id;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await api.get('/api/reviews', { params });
      setReviews(response.data.reviews || []);
      setTotalReviews(response.data.totalReviews || 0);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  // Fetch products for filtering and form selection
  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products', {
        params: { pageSize: 100 } // Get a large number of products for selection
      });
      setProducts(response.data.content || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Effect to reload reviews when filters change
  useEffect(() => {
    if (!loading) {
      fetchReviews();
    }
  }, [page, rowsPerPage, selectedProduct, searchTerm]);

  // Handlers for pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter handlers
  const handleProductFilterChange = (event, newValue) => {
    setSelectedProduct(newValue);
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(0);
    fetchReviews();
  };

  const handleClearFilters = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setPage(0);
  };

  // Dialog handlers
  const handleOpenAddDialog = () => {
    setFormProduct(null);
    setFormRating(5);
    setFormReview('');
    setFormUserName('');
    setFormUserEmail('');
    setFormVerifiedPurchase(true);
    setOpenAddDialog(true);
  };

  const handleOpenEditDialog = (review) => {
    setCurrentReview(review);
    setFormProduct(products.find(p => p._id === review.product?._id) || null);
    setFormRating(review.rating || 5);
    setFormReview(review.review || '');
    setFormUserName(`${review.user?.firstName || ''} ${review.user?.lastName || ''}`.trim());
    setFormUserEmail(review.user?.email || '');
    setFormVerifiedPurchase(review.verifiedPurchase || false);
    setOpenEditDialog(true);
  };

  const handleOpenDeleteDialog = (review) => {
    setCurrentReview(review);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialogs = () => {
    setOpenAddDialog(false);
    setOpenEditDialog(false);
    setOpenDeleteDialog(false);
    setCurrentReview(null);
  };

  // CRUD operations
  const handleAddReview = async () => {
    if (!formProduct || !formReview) {
      setSnackbar({
        open: true,
        message: 'Please select a product and enter a review',
        severity: 'error',
      });
      return;
    }

    try {
      const reviewData = {
        productId: formProduct._id,
        rating: formRating,
        review: formReview,
        verifiedPurchase: formVerifiedPurchase,
      };

      // Add user info if provided
      if (formUserName || formUserEmail) {
        const [firstName, ...lastName] = formUserName.split(' ');
        reviewData.user = {
          firstName: firstName || 'Anonymous',
          lastName: lastName.join(' '),
          email: formUserEmail || `anonymous-${Date.now()}@example.com`,
        };
      }

      await api.post('/api/reviews', reviewData);
      
      handleCloseDialogs();
      setSnackbar({
        open: true, 
        message: 'Review added successfully', 
        severity: 'success'
      });
      fetchReviews();
    } catch (error) {
      console.error('Error adding review:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to add review',
        severity: 'error',
      });
    }
  };

  const handleEditReview = async () => {
    if (!currentReview || !formProduct || !formReview) {
      setSnackbar({
        open: true,
        message: 'Invalid review data',
        severity: 'error',
      });
      return;
    }

    try {
      const reviewData = {
        productId: formProduct._id,
        rating: formRating,
        review: formReview,
        verifiedPurchase: formVerifiedPurchase,
      };

      await api.put(`/api/reviews/${currentReview._id}`, reviewData);
      
      handleCloseDialogs();
      setSnackbar({
        open: true, 
        message: 'Review updated successfully', 
        severity: 'success'
      });
      fetchReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update review',
        severity: 'error',
      });
    }
  };

  const handleDeleteReview = async () => {
    if (!currentReview) return;

    try {
      await api.delete(`/api/reviews/${currentReview._id}`);
      
      setSnackbar({
        open: true,
        message: 'Review deleted successfully',
        severity: 'success',
      });
      
      handleCloseDialogs();
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      
      // Extract detailed error message
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to delete review';
      
      setSnackbar({
        open: true,
        message: `Error deleting review: ${errorMessage}`,
        severity: 'error',
      });
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Reviews Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleOpenAddDialog}
        >
          Add Review
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterList sx={{ mr: 1 }} /> Filters
          </Typography>
          
          <FormControl sx={{ minWidth: 250 }}>
            <Autocomplete
              options={products}
              getOptionLabel={(option) => option.title || ''}
              renderInput={(params) => (
                <TextField {...params} label="Filter by Product" variant="outlined" size="small" />
              )}
              value={selectedProduct}
              onChange={handleProductFilterChange}
              isOptionEqualToValue={(option, value) => option._id === value?._id}
            />
          </FormControl>
          
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <TextField
              label="Search Reviews"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Button type="submit" variant="outlined" startIcon={<Search />}>
              Search
            </Button>
          </form>
          
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Reviews Table */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Review</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Verified</TableCell>
                <TableCell>Date</TableCell>
                <TableCell width="120">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography>Loading reviews...</Typography>
                  </TableCell>
                </TableRow>
              ) : reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography>No reviews found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((review) => (
                  <TableRow key={review._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {review.product?.images?.[0] && (
                          <Box 
                            component="img" 
                            src={`${api.defaults.baseURL}/api/images/${review.product.images[0]}`}
                            alt={review.product?.title}
                            sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }}
                          />
                        )}
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {review.product?.title || 'Unknown Product'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Rating value={review.rating} precision={0.5} readOnly size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          maxWidth: 300
                        }}
                      >
                        {review.review}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {review.user?.firstName 
                          ? `${review.user.firstName} ${review.user.lastName || ''}`
                          : 'Anonymous'
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {review.user?.email || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {review.verifiedPurchase ? (
                        <Chip
                          icon={<VerifiedUser style={{ color: '#4CAF50', fontSize: '0.75rem' }} />}
                          label="Verified"
                          size="small"
                          variant="outlined"
                          sx={{
                            height: '24px',
                            fontWeight: 'bold',
                            borderColor: '#4CAF50',
                            color: '#4CAF50',
                          }}
                        />
                      ) : (
                        <Chip
                          label="Unverified"
                          size="small"
                          variant="outlined"
                          sx={{
                            height: '24px',
                            fontWeight: 'bold',
                            borderColor: '#757575',
                            color: '#757575',
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(review.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => handleOpenEditDialog(review)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleOpenDeleteDialog(review)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalReviews}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add Review Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
        <DialogTitle>Add New Review</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={products}
                getOptionLabel={(option) => option.title || ''}
                renderInput={(params) => (
                  <TextField {...params} label="Select Product" required fullWidth />
                )}
                value={formProduct}
                onChange={(event, newValue) => setFormProduct(newValue)}
                isOptionEqualToValue={(option, value) => option._id === value?._id}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography component="legend" sx={{ mr: 2 }}>Rating:</Typography>
                <Rating
                  name="rating"
                  value={formRating}
                  onChange={(event, newValue) => setFormRating(newValue)}
                  precision={0.5}
                  size="large"
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Review Text"
                multiline
                rows={4}
                fullWidth
                required
                value={formReview}
                onChange={(e) => setFormReview(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Customer Name"
                fullWidth
                value={formUserName}
                onChange={(e) => setFormUserName(e.target.value)}
                placeholder="Admin User"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Customer Email"
                fullWidth
                value={formUserEmail}
                onChange={(e) => setFormUserEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formVerifiedPurchase}
                    onChange={(e) => setFormVerifiedPurchase(e.target.checked)}
                    name="verifiedPurchase"
                  />
                }
                label="Mark as Verified Purchase"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleAddReview} variant="contained" color="primary">
            Add Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Review Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
        <DialogTitle>Edit Review</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={products}
                getOptionLabel={(option) => option.title || ''}
                renderInput={(params) => (
                  <TextField {...params} label="Select Product" required fullWidth />
                )}
                value={formProduct}
                onChange={(event, newValue) => setFormProduct(newValue)}
                isOptionEqualToValue={(option, value) => option._id === value?._id}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography component="legend" sx={{ mr: 2 }}>Rating:</Typography>
                <Rating
                  name="rating"
                  value={formRating}
                  onChange={(event, newValue) => setFormRating(newValue)}
                  precision={0.5}
                  size="large"
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Review Text"
                multiline
                rows={4}
                fullWidth
                required
                value={formReview}
                onChange={(e) => setFormReview(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Customer Name"
                fullWidth
                value={formUserName}
                onChange={(e) => setFormUserName(e.target.value)}
                disabled
                helperText="Cannot modify customer information"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Customer Email"
                fullWidth
                value={formUserEmail}
                onChange={(e) => setFormUserEmail(e.target.value)}
                disabled
                helperText="Cannot modify customer information"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formVerifiedPurchase}
                    onChange={(e) => setFormVerifiedPurchase(e.target.checked)}
                    name="verifiedPurchase"
                  />
                }
                label="Mark as Verified Purchase"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleEditReview} variant="contained" color="primary">
            Update Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDialogs}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this review? This action cannot be undone.
          </Typography>
          {currentReview && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {currentReview.product?.title || 'Unknown Product'}
              </Typography>
              <Rating value={currentReview.rating} readOnly size="small" sx={{ my: 1 }} />
              <Typography variant="body2">{currentReview.review}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleDeleteReview} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReviewsManagement; 