/* eslint-disable react/jsx-no-undef */
/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getImageUrl } from '../../../config/api';
import { getAllOrders, updateOrderStatus } from '../../../Redux/Admin/Order/Action';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Tooltip, 
  Box, 
  IconButton, 
  Button,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead,
  TableRow, 
  Paper, 
  Typography, 
  Grid, 
  Chip, 
  TablePagination,
  CircularProgress
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';

const OrderList = () => {
  const dispatch = useDispatch();
  const { orders = [], loading = false, updateLoading = false } = useSelector((state) => state.adminOrder || {});
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(getAllOrders());
  }, [dispatch]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  const handleViewProduct = (item) => {
    setSelectedProduct(item);
    setProductDialogOpen(true);
  };

  const handleCloseProductDialog = () => {
    setProductDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await dispatch(updateOrderStatus(orderId, status));
      dispatch(getAllOrders()); // Refresh the orders list
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'CONFIRMED': return 'info';
      case 'SHIPPED': return 'primary';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getItemImage = (item) => {
    if (item?.product?.colors && item?.color) {
      const colorData = item.product.colors.find(c => c.name === item.color);
      if (colorData && colorData.images && colorData.images.length > 0) {
        return getImageUrl(colorData.images[0]);
      }
    }
    return item?.product?.imageUrl ? getImageUrl(item.product.imageUrl) : "";
  };

  // Format transaction ID to be more readable
  const formatTransactionId = (transactionId) => {
    if (!transactionId) return 'N/A';
    
    // If it includes a timestamp at the end, truncate it
    if (transactionId.includes('-') && transactionId.split('-').length > 2) {
      return transactionId.split('-').slice(0, 2).join('-');
    }
    
    // Otherwise just return first 15 chars
    return transactionId.length > 15 ? `${transactionId.substring(0, 15)}...` : transactionId;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Order Management</Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Id</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Update</TableCell>
              <TableCell>Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders
              ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((order) => (
                order.orderItems.map((item) => (
                  <TableRow key={`${order._id}-${item._id}`}>
                    <TableCell>
                      <Box sx={{ width: 50, height: 50 }}>
                        <img
                          src={getItemImage(item)}
                          alt={item.product?.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{item.product?.title}</TableCell>
                    <TableCell>{item.sku || item.product?.sku || '-'}</TableCell>
                    <TableCell>Tk. {item.price}</TableCell>
                    <TableCell>{item._id}</TableCell>
                    <TableCell>
                      <Chip 
                        label={order.orderStatus} 
                        color={getStatusColor(order.orderStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleViewProduct(item)}
                        sx={{ 
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.dark'
                          }
                        }}
                      >
                        Update
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        color="error"
                        sx={{ 
                          '&:hover': {
                            bgcolor: 'error.dark'
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={orders?.reduce((acc, order) => acc + order.orderItems.length, 0) || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Order Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Order Details</Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Grid container spacing={3}>
              {/* Order Summary */}
              <Grid item xs={12}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Order ID: {selectedOrder._id}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Date: {format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy hh:mm a')}
                  </Typography>
                </Box>
              </Grid>

              {/* Customer Details */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                  <Typography variant="h6" gutterBottom>Customer Details</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}
                    </Typography>
                    <Typography color="text.secondary">
                      Email: {selectedOrder.user?.email}
                    </Typography>
                    <Typography color="text.secondary">
                      Phone: {selectedOrder.user?.phoneNumber}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Shipping Details */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                  <Typography variant="h6" gutterBottom>Shipping Details</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedOrder.shippingAddress?.firstName} {selectedOrder.shippingAddress?.lastName}
                    </Typography>
                    <Typography color="text.secondary">
                      {selectedOrder.shippingAddress?.streetAddress}
                    </Typography>
                    <Typography color="text.secondary">
                      {selectedOrder.shippingAddress?.upazilla}, {selectedOrder.shippingAddress?.district}
                    </Typography>
                    <Typography color="text.secondary">
                      {selectedOrder.shippingAddress?.division} - {selectedOrder.shippingAddress?.zipCode}
                    </Typography>
                    <Typography color="text.secondary">
                      Phone: {selectedOrder.shippingAddress?.mobile}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Payment Details */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                  <Typography variant="h6" gutterBottom>Payment Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Method:</Typography>
                          <Typography>{selectedOrder.paymentDetails?.paymentMethod}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Transaction ID:</Typography>
                          <Typography>{formatTransactionId(selectedOrder.paymentDetails?.transactionId)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Phone:</Typography>
                          <Typography>{selectedOrder.paymentDetails?.paymentPhoneNumber}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Status:</Typography>
                          <Chip 
                            label={selectedOrder.paymentDetails?.status || 'PENDING'} 
                            color={selectedOrder.paymentDetails?.status === 'COMPLETED' ? 'success' : 'warning'}
                            size="small"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Amount:</Typography>
                          <Typography>Tk. {selectedOrder.totalDiscountedPrice}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Payment Date:</Typography>
                          <Typography>
                            {selectedOrder.paymentDetails?.paymentDate 
                              ? format(new Date(selectedOrder.paymentDetails.paymentDate), 'MMM dd, yyyy')
                              : 'Pending'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Order Items */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                  <Typography variant="h6" gutterBottom>Order Items</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell>Details</TableCell>
                          <TableCell align="center">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Discount</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.orderItems.map((item) => (
                          <TableRow key={item._id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ width: 50, height: 50 }}>
                                  <img
                                    src={getItemImage(item)}
                                    alt={item.product?.title}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      borderRadius: '4px'
                                    }}
                                  />
                                </Box>
                                <Box>
                                  <Typography variant="body2">{item.product?.title}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    SKU: {item.product?.sku || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                Size: {item.size}
                              </Typography>
                              {item.color && (
                                <Typography variant="body2" color="text.secondary">
                                  Color: {item.color}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">{item.quantity}</TableCell>
                            <TableCell align="right">Tk. {item.price}</TableCell>
                            <TableCell align="right">
                              {item.discountedPrice && item.price > item.discountedPrice ? (
                                <Typography color="success.main">
                                  -Tk. {(item.price - item.discountedPrice).toFixed(2)}
                                </Typography>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell align="right">
                              Tk. {(item.price * item.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Tooltip title="View Product Details">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewProduct(item)}
                                    sx={{ 
                                      bgcolor: 'primary.main', 
                                      color: 'white',
                                      '&:hover': {
                                        bgcolor: 'primary.dark'
                                      }
                                    }}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Summary Rows */}
                        <TableRow>
                          <TableCell colSpan={4} />
                          <TableCell align="right">Subtotal:</TableCell>
                          <TableCell align="right">Tk. {selectedOrder.totalPrice}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={4} />
                          <TableCell align="right">Discount:</TableCell>
                          <TableCell align="right">-Tk. {selectedOrder.discounte}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={4} />
                          <TableCell align="right">
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              Total:
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              Tk. {selectedOrder.totalDiscountedPrice}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* Order Status Update */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Order Status</Typography>
                    <Chip 
                      label={selectedOrder.orderStatus}
                      color={getStatusColor(selectedOrder.orderStatus)}
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                      <Button
                        key={status}
                        variant={selectedOrder.orderStatus === status ? "contained" : "outlined"}
                        size="small"
                        color={getStatusColor(status)}
                        onClick={() => handleUpdateStatus(selectedOrder._id, status)}
                        disabled={selectedOrder.orderStatus === status || updateLoading}
                      >
                        {status}
                      </Button>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog
        open={productDialogOpen}
        onClose={handleCloseProductDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Product Details</Typography>
            <IconButton onClick={handleCloseProductDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedProduct && (
            <Grid container spacing={2}>
              {/* Product Image */}
              <Grid item xs={12}>
                <Box sx={{ width: '100%', height: 200, position: 'relative' }}>
                  <img
                    src={getItemImage(selectedProduct)}
                    alt={selectedProduct.product?.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                  />
                </Box>
              </Grid>

              {/* Basic Product Info */}
              <Grid item xs={12}>
                <Typography variant="h6">{selectedProduct.product?.title}</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  SKU: {selectedProduct.product?.sku || 'N/A'}
                </Typography>
              </Grid>

              {/* Product Details */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Brand</Typography>
                      <Typography variant="body1">{selectedProduct.product?.brand || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Category</Typography>
                      <Typography variant="body1">{selectedProduct.product?.category || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Size</Typography>
                      <Typography variant="body1">{selectedProduct.size || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Color</Typography>
                      <Typography variant="body1">{selectedProduct.color || 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Pricing Details */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                  <Typography variant="subtitle1" gutterBottom>Pricing Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Unit Price</Typography>
                      <Typography variant="body1">Tk. {selectedProduct.price}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Quantity</Typography>
                      <Typography variant="body1">{selectedProduct.quantity}</Typography>
                    </Grid>
                    {selectedProduct.discountedPrice && selectedProduct.price > selectedProduct.discountedPrice && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Discount</Typography>
                        <Typography variant="body1" color="success.main">
                          -Tk. {(selectedProduct.price - selectedProduct.discountedPrice).toFixed(2)}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        Tk. {(selectedProduct.price * selectedProduct.quantity).toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Product Specifications */}
              {selectedProduct.product?.specifications && (
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                    <Typography variant="subtitle1" gutterBottom>Specifications</Typography>
                    <Grid container spacing={1}>
                      {Object.entries(selectedProduct.product.specifications).map(([key, value]) => (
                        <Grid item xs={12} key={key}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">{key}:</Typography>
                            <Typography variant="body2">{value}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* Product Description */}
              {selectedProduct.product?.description && (
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                    <Typography variant="subtitle1" gutterBottom>Description</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedProduct.product.description}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderList; 
