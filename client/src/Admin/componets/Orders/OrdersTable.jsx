import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardHeader,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Menu,
  MenuItem,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Divider,
  useTheme,
  TextField,
  Badge,
  Tooltip,
  Alert,
} from "@mui/material";

import React, { useEffect, useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from "react-router-dom";
import { Select } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { toast } from 'react-toastify';
import {
  confirmOrder,
  deleteOrder,
  deliveredOrder,
  getOrders,
  shipOrder,
  getShippingAddress,
  getUser,
} from "../../../Redux/Admin/Orders/Action";
import MoneyIcon from '@mui/icons-material/Money';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
// Import our custom invoice generators
import generateInvoice from './NewInvoice';
import generateInvoicePDF from './InvoiceImage';
import InvoicePreviewModal from './InvoicePreviewModal';

// Define API_URL
const API_URL = 'https://tweestbd.com';

const OrdersTable = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ status: "", sort: "" });
  const [orderStatus, setOrderStatus] = useState("");
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const { adminsOrder } = useSelector((store) => store);
  const [anchorElArray, setAnchorElArray] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(null);
  const [userData, setUserData] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [openInvoicePreview, setOpenInvoicePreview] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [openOutletOrderForm, setOpenOutletOrderForm] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(20);
  
  // Error handling state
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const theme = useTheme();

  // Calculate pagination values
  const totalOrders = adminsOrder?.orders?.length || 0;
  const totalPages = Math.ceil(totalOrders / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = adminsOrder?.orders?.slice(startIndex, endIndex) || [];

  // Helper function to get payment method label
  const getPaymentMethodLabel = (paymentOption) => {
    switch(paymentOption) {
      case 'cod': return 'Cash on Delivery';
      case 'bkash': return 'bKash';
      case 'sslcommerz': return 'SSLCommerz';
      case 'outlet': return 'Outlet Pickup';
      case 'online': return 'Online'; // fallback for old data
      default: return 'SSLCommerz';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLACED':
        return '#ff9800'; // orange
      case 'CONFIRMED':
        return '#29b6f6'; // light blue
      case 'SHIPPED':
        return '#3f51b5'; // indigo
      case 'DELIVERED':
        return '#4caf50'; // green
      case 'CANCELLED':
        return '#f44336'; // red
      default:
        return '#9e9e9e'; // gray
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'PLACED':
        return 'rgba(255, 152, 0, 0.2)';
      case 'CONFIRMED':
        return 'rgba(41, 182, 246, 0.2)';
      case 'SHIPPED':
        return 'rgba(63, 81, 181, 0.2)';
      case 'DELIVERED':
        return 'rgba(76, 175, 80, 0.2)';
      case 'CANCELLED':
        return 'rgba(244, 67, 54, 0.2)';
      default:
        return 'rgba(158, 158, 158, 0.2)';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'PLACED':
        return '#ff9800'; // orange
      case 'CONFIRMED':
        return '#29b6f6'; // light blue
      case 'SHIPPED':
        return '#3f51b5'; // indigo
      case 'DELIVERED':
        return '#4caf50'; // green
      case 'CANCELLED':
        return '#f44336'; // red
      default:
        return '#9e9e9e'; // gray
    }
  };

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setError(null);
        // Only apply filters if they are set
        if (formData.status || formData.sort) {
          await dispatch(getOrders({ jwt, filters: { 
            orderStatus: formData.status,
            sortBy: formData.sort ? getSortValue(formData.sort) : undefined
          }}));
        } else {
          await dispatch(getOrders({ jwt }));
        }
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        console.error('Error loading orders:', err);
        setError('Failed to load orders. Please check your connection and try again.');
      }
    };

    loadOrders();
  }, [jwt, adminsOrder.delivered, adminsOrder.shipped, adminsOrder.confirmed, formData.status, formData.sort]);

  // Helper function to convert UI sort values to API sort values
  const getSortValue = (uiSortValue) => {
    switch (uiSortValue) {
      case 'Newest': return 'date_desc';
      case 'Older': return 'date_asc';
      case 'PriceHighToLow': return 'price_desc';
      case 'PriceLowToHigh': return 'price_asc';
      default: return 'date_desc';
    }
  };

  const handleUpdateStatusMenuClick = (event, index) => {
    const newAnchorElArray = Array(currentOrders?.length).fill(null);
    newAnchorElArray[index] = event.currentTarget;
    setAnchorElArray(newAnchorElArray);
    const currentStatus = currentOrders[index]?.orderStatus;
    setOrderStatus(currentStatus);
  };

  const handleUpdateStatusMenuClose = (index) => {
    const newAnchorElArray = [...anchorElArray];
    newAnchorElArray[index] = null;
    setAnchorElArray(newAnchorElArray);
    setOrderStatus("");
  };

  const handleChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;

    setFormData({ ...formData, [name]: value });
    setCurrentPage(1); // Reset to first page when filters change
  };

  const applyFilters = () => {
    // Construct filter object based on formData
    const filters = {};
    
    // Add status filter if provided
    if (formData.status) {
      filters.orderStatus = formData.status;
    }
    
    // Add sort parameter if provided
    if (formData.sort) {
      filters.sortBy = getSortValue(formData.sort);
    }
    
    dispatch(getOrders({ jwt, filters }));
    setCurrentPage(1); // Reset to first page when applying filters
  };

  function handlePaginationChange(event, value) {
    setCurrentPage(value);
    // Scroll to top of table when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleConfirmedOrder = (orderId, index) => {
    handleUpdateStatusMenuClose(index);
    dispatch(confirmOrder(orderId));
    if (openDialog) {
      setOpenDialog(false);
    }
  };

  const handleShippedOrder = (orderId, index) => {
    handleUpdateStatusMenuClose(index);
    dispatch(shipOrder(orderId));
    if (openDialog) {
      setOpenDialog(false);
    }
  };

  const handleDeliveredOrder = (orderId, index) => {
    handleUpdateStatusMenuClose(index);
    dispatch(deliveredOrder(orderId));
    if (openDialog) {
      setOpenDialog(false);
    }
  };

  const handleMarkDuePaid = async (orderId) => {
    try {
      // Show confirmation dialog
      if (!window.confirm('Are you sure you want to mark this order as fully paid?')) {
        return;
      }

      // Make API call to update the payment status
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/mark-due-paid`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh orders list
        dispatch(getOrders({ jwt }))
          .then((response) => {
            // No need to set orders separately as it's handled by Redux
            
            // If we have a selected order that matches the orderId, update its status
            if (selectedOrder && selectedOrder._id === orderId) {
              setSelectedOrder({
                ...selectedOrder,
                dueAmount: 0,
                dueStatus: 'PAID',
                paymentDetails: {
                  ...selectedOrder.paymentDetails,
                  status: 'COMPLETED'
                }
              });
            }
            
            // Show success message
            toast.success('Order has been marked as fully paid!');
          });
      } else {
        toast.error(data.message || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('An error occurred while updating payment status');
    }
  };

  const handleDeleteOrder = (orderId) => {
    handleUpdateStatusMenuClose();
    dispatch(deleteOrder(orderId));
  };

  const handleViewOrderDetails = async (order) => {
    try {
      setPaymentLoading(true);
      const response = await fetch(`https://tweestbd.com/api/orders/${order._id}`, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data);
        
        // Fetch payment details if we have an order
        if (data) {
          try {
            // Try to get payment by order ID
            const paymentResponse = await fetch(`https://tweestbd.com/api/payments/by-order/${data._id}`, {
              headers: {
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (paymentResponse.ok) {
              const paymentData = await paymentResponse.json();
              if (paymentData.success && paymentData.payment) {
                setPaymentDetails(paymentData.payment);
              } else {
                setPaymentDetails(null);
              }
            }
          } catch (paymentError) {
            console.error('Error fetching payment details:', paymentError);
          }
        }
        
        setOpenDialog(true);
      } else {
        console.error('Failed to fetch order details:', await response.text());
      }
      setPaymentLoading(false);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setPaymentLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
    setPaymentDetails(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const getAvailableStatusUpdates = (currentStatus) => {
    const statusFlow = {
      'PENDING': [{ label: 'Place Order', action: handleConfirmedOrder }],
      'PLACED': [{ label: 'Confirm Order', action: handleConfirmedOrder }],
      'CONFIRMED': [{ label: 'Ship Order', action: handleShippedOrder }],
      'SHIPPED': [{ label: 'Mark as Delivered', action: handleDeliveredOrder }]
    };
    const updates = statusFlow[currentStatus] || [];
    return updates;
  };

  // Improve the image URL handling with additional fallbacks
  const getImageUrl = (orderItem) => {
    // First try to get image from the selected color
    if (orderItem.color && orderItem.product?.colors) {
      const selectedColor = orderItem.product.colors.find(c => c.name === orderItem.color);
      if (selectedColor?.images && selectedColor.images.length > 0) {
        // Make sure the URL is properly formed
        const image = selectedColor.images[0];
        if (image && typeof image === 'string' && image.trim() !== '') {
          // Check if it's a full URL or relative path
          if (image.startsWith('http://') || image.startsWith('https://')) {
            return image;
          } else {
            // Assume it's a relative path and prepend the API URL
            return `https://tweestbd.com${image.startsWith('/') ? '' : '/'}${image}`;
          }
        }
      }
    }
    
    // Fallback to first color's first image
    if (orderItem.product?.colors && orderItem.product.colors.length > 0) {
      const firstColor = orderItem.product.colors[0];
      if (firstColor.images && firstColor.images.length > 0) {
        const image = firstColor.images[0];
        if (image && typeof image === 'string' && image.trim() !== '') {
          if (image.startsWith('http://') || image.startsWith('https://')) {
            return image;
          } else {
            return `https://tweestbd.com${image.startsWith('/') ? '' : '/'}${image}`;
          }
        }
      }
    }
    
    // Fallback to imageUrl if available
    if (orderItem.product?.imageUrl) {
      const image = orderItem.product.imageUrl;
      if (image && typeof image === 'string' && image.trim() !== '') {
        if (image.startsWith('http://') || image.startsWith('https://')) {
          return image;
        } else {
          return `https://tweestbd.com${image.startsWith('/') ? '' : '/'}${image}`;
        }
      }
    }
    
    // Final fallback to a placeholder
    return 'https://via.placeholder.com/150?text=No+Image';
  };

  // Update order display function
  const formatOrderNumber = (order) => {
    return order.formattedOrderId || `2505${order._id.substring(0, 8)}`.toUpperCase();
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

  // Update where handleInvoiceDownload is called to use the imported function
  const handleDownloadClick = (order) => {
    try {
      setInvoiceOrder(order);
      setOpenInvoicePreview(true);
    } catch (error) {
      console.error('Error in invoice generation handler:', error);
      toast.error(`Error generating invoice: ${error.message || 'Unknown error'}`);
    }
  };

  // Handler for opening the outlet order form
  const handleAddOutletOrder = () => {
    setOpenOutletOrderForm(true);
  };
  
  // Handler for closing the outlet order form
  const handleCloseOutletOrderForm = () => {
    setOpenOutletOrderForm(false);
  };

  // Retry function for error handling
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    dispatch(getOrders({ jwt }));
  };

  return (
    <Box sx={{ bgcolor: '#121212', minHeight: '100vh', p: 2 }}>
      <Card className="p-3" sx={{ 
        mb: 3, 
        borderRadius: 2, 
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        background: 'linear-gradient(145deg, #1e1e1e 0%, #2d2d2d 100%)',
        border: '1px solid',
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }}>
        <Typography variant="h5" sx={{ 
          mb: 2, 
          fontWeight: 600, 
          display: 'flex', 
          alignItems: 'center',
          color: '#bb86fc' // light purple accent
        }}>
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              width: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: '#bb86fc',
              mr: 1.5,
              boxShadow: '0 0 0 4px rgba(187, 134, 252, 0.15)'
            }}
          />
          Filter Orders
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth size="small" sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.33)' },
                '&.Mui-focused fieldset': { borderColor: '#bb86fc' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
              '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' }
            }}>
              <InputLabel id="status-select-label">Order Status</InputLabel>
              <Select
                labelId="status-select-label"
                id="status-select"
                name="status"
                value={formData.status}
                label="Order Status"
                onChange={handleChange}
                MenuProps={{
                  PaperProps: {
                    sx: { bgcolor: '#2d2d2d' }
                  }
                }}
              >
                <MenuItem value="" sx={{ color: '#fff' }}>All Statuses</MenuItem>
                <MenuItem value={"PLACED"} sx={{ color: '#fff' }}>PLACED</MenuItem>
                <MenuItem value={"CONFIRMED"} sx={{ color: '#fff' }}>CONFIRMED</MenuItem>
                <MenuItem value={"SHIPPED"} sx={{ color: '#fff' }}>SHIPPED</MenuItem>
                <MenuItem value={"DELIVERED"} sx={{ color: '#fff' }}>DELIVERED</MenuItem>
                <MenuItem value={"CANCELLED"} sx={{ color: '#fff' }}>CANCELLED</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth size="small" sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.33)' },
                '&.Mui-focused fieldset': { borderColor: '#bb86fc' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
              '& .MuiSvgIcon-root': { color: 'rgba(255, 255, 255, 0.7)' }
            }}>
              <InputLabel id="sort-select-label">Sort By</InputLabel>
              <Select
                labelId="sort-select-label"
                id="sort-select"
                name="sort"
                value={formData.sort}
                label="Sort By"
                onChange={handleChange}
                MenuProps={{
                  PaperProps: {
                    sx: { bgcolor: '#2d2d2d' }
                  }
                }}
              >
                <MenuItem value={"Newest"} sx={{ color: '#fff' }}>Newest First</MenuItem>
                <MenuItem value={"Older"} sx={{ color: '#fff' }}>Oldest First</MenuItem>
                <MenuItem value={"PriceHighToLow"} sx={{ color: '#fff' }}>Price: High to Low</MenuItem>
                <MenuItem value={"PriceLowToHigh"} sx={{ color: '#fff' }}>Price: Low to High</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              fullWidth 
              variant="contained" 
              sx={{ 
                height: '100%',
                bgcolor: '#bb86fc',
                color: '#000',
                '&:hover': {
                  bgcolor: '#9969da'
                }
              }}
              onClick={applyFilters}
              disabled={adminsOrder.loading}
              startIcon={adminsOrder.loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              Apply Filters
            </Button>
          </Grid>
        </Grid>
        
        {/* Active Filters Indicator */}
        {(formData.status || formData.sort) && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mt: 2,
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'rgba(187, 134, 252, 0.08)',
            border: '1px dashed rgba(187, 134, 252, 0.3)'
          }}>
            <Typography variant="body2" sx={{ color: '#bb86fc', display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: '#bb86fc', 
                display: 'inline-block',
                mr: 1
              }}/>
              Active filters:
            </Typography>
            
            {formData.status && (
              <Chip 
                label={`Status: ${formData.status}`} 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(187, 134, 252, 0.1)', 
                  color: '#bb86fc',
                  border: '1px solid rgba(187, 134, 252, 0.2)'
                }}
                onDelete={() => {
                  setFormData({...formData, status: ''});
                  // Apply the filter immediately when removed
                  const updatedFormData = {...formData, status: ''};
                  dispatch(getOrders({ jwt, filters: { ...updatedFormData, orderStatus: '' }}));
                }}
              />
            )}
            
            {formData.sort && (
              <Chip 
                label={`Sort: ${formData.sort}`} 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(187, 134, 252, 0.1)', 
                  color: '#bb86fc',
                  border: '1px solid rgba(187, 134, 252, 0.2)'
                }}
                onDelete={() => {
                  setFormData({...formData, sort: ''});
                  // Apply the filter immediately when removed
                  dispatch(getOrders({ jwt, filters: { ...formData, sort: '', sortBy: '' }}));
                }}
              />
            )}
            
            <Button 
              size="small" 
              variant="text" 
              sx={{ 
                ml: 'auto', 
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { color: '#fff' }
              }}
              onClick={() => {
                setFormData({ status: "", sort: "" });
                dispatch(getOrders({ jwt }));
              }}
            >
              Clear All
            </Button>
          </Box>
        )}
      </Card>

      <Card sx={{ 
        borderRadius: 2, 
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        border: '1px solid',
        borderColor: 'rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
        bgcolor: '#1e1e1e'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 3,
          borderBottom: '1px solid',
          borderColor: 'rgba(255, 255, 255, 0.05)',
          background: 'linear-gradient(145deg, #1e1e1e 0%, #2d2d2d 100%)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#bb86fc',
                color: '#000',
                mr: 2,
                boxShadow: '0 2px 8px rgba(187, 134, 252, 0.3)'
              }}
            >
              <Badge 
                badgeContent={adminsOrder?.orders?.length || 0} 
                color="error" 
                sx={{ '.MuiBadge-badge': { right: -8, top: -8 } }}
              >
                <ReceiptIcon />
              </Badge>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff' }}>
              Orders
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddShoppingCartIcon />}
            onClick={handleAddOutletOrder}
            sx={{ 
              bgcolor: '#bb86fc',
              color: '#000',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: '#9969da'
              }
            }}
          >
            Add Outlet Order
          </Button>
        </Box>

        {error ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            py: 8,
            flexDirection: 'column',
            gap: 2
          }}>
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%', 
                maxWidth: 500,
                bgcolor: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                color: '#ff6b6b',
                mb: 2
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleRetry}
                  sx={{ textTransform: 'none' }}
                >
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Retry attempts: {retryCount}
            </Typography>
          </Box>
        ) : adminsOrder.loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            py: 8,
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress 
              size={60} 
              thickness={4} 
              sx={{ 
                color: '#bb86fc',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }} 
            />
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading orders...</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Please wait while we fetch the latest order data.
            </Typography>
          </Box>
        ) : !adminsOrder?.orders?.length ? (
          <Box sx={{ 
            p: 6, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                mb: 2
              }}
            >
              <ReceiptIcon fontSize="large" sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
            </Box>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>No orders found</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', maxWidth: 400 }}>
              Try changing your filter criteria or check back later when customers place new orders.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 800 }} aria-label="orders table">
              <TableHead sx={{ bgcolor: 'rgba(187, 134, 252, 0.05)' }}>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Order #</TableCell>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Date</TableCell>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Customer</TableCell>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Items</TableCell>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500, textAlign: 'right' }}>Total</TableCell>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Status</TableCell>
                  <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentOrders?.map((item, index) => {
                  return (
                    <TableRow
                      hover
                      key={item._id}
                      sx={{ 
                        '&:last-of-type td, &:last-of-type th': { border: 0 },
                        '& td': { borderColor: 'rgba(255, 255, 255, 0.05)', color: '#fff' },
                        '&:hover': { 
                          bgcolor: 'rgba(187, 134, 252, 0.08)',
                          transition: 'background-color 0.2s ease'
                        },
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" sx={{ color: '#bb86fc', fontWeight: 500 }}>
                            {formatOrderNumber(item)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {item._id.substring(0, 8)}...
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">Date:</Typography>
                            <Typography variant="body2">
                              {formatDate(item.orderDate)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">Total:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                              ৳{item?.totalPrice}
                            </Typography>
                          </Box>
                          {item.dueAmount > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary">Due Amount:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                ৳{item?.dueAmount}
                              </Typography>
                            </Box>
                          )}
                          {item.paymentOption && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary">Payment:</Typography>
                              <Chip
                                label={getPaymentMethodLabel(item.paymentOption)}
                                size="small"
                                color={item.paymentOption === 'cod' ? 'warning' : 
                                       item.paymentOption === 'bkash' ? 'secondary' :
                                       item.paymentOption === 'outlet' ? 'info' : 'success'}
                                sx={{ 
                                  height: '20px',
                                  fontSize: '0.6rem',
                                  fontWeight: 'bold',
                                  '& .MuiChip-label': { px: 0.8 }
                                }}
                              />
                            </Box>
                          )}
                          {item.shippingAddress && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary">Customer:</Typography>
                              <Typography variant="body2">
                                {item.shippingAddress.firstName} {item.shippingAddress.lastName}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={item?.orderStatus}
                          size="small"
                          sx={{
                            backgroundColor: getStatusBgColor(item?.orderStatus),
                            color: getStatusTextColor(item?.orderStatus),
                            fontWeight: 600,
                            borderRadius: '6px',
                            px: 1,
                            py: 2,
                            border: '1px solid',
                            borderColor: `${getStatusTextColor(item?.orderStatus)}40`,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon fontSize="small" />}
                            onClick={() => handleViewOrderDetails(item)}
                            sx={{
                              borderRadius: '8px',
                              textTransform: 'none',
                              fontWeight: 600,
                              px: 2
                            }}
                          >
                            View
                          </Button>

                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ReceiptIcon fontSize="small" />}
                            onClick={() => handleDownloadClick(item)}
                            sx={{
                              borderRadius: '8px',
                              textTransform: 'none',
                              fontWeight: 600,
                              borderColor: 'success.main',
                              color: 'success.main',
                              px: 2,
                              '&:hover': {
                                borderColor: 'success.dark',
                                bgcolor: 'success.light',
                                opacity: 0.1
                              }
                            }}
                          >
                            Invoice
                          </Button>

                          {item.orderStatus !== 'DELIVERED' && item.orderStatus !== 'CANCELLED' && (
                            <>
                              <Button
                                variant="contained"
                                size="small"
                                id={`status-button-${item._id}`}
                                aria-controls={anchorElArray[index] ? `status-menu-${item._id}` : undefined}
                                aria-haspopup="true"
                                aria-expanded={Boolean(anchorElArray[index])}
                                onClick={(event) => handleUpdateStatusMenuClick(event, index)}
                                endIcon={<KeyboardArrowUpIcon fontSize="small" />}
                                sx={{
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  px: 2
                                }}
                              >
                                Update
                              </Button>
                              <Menu
                                id={`status-menu-${item._id}`}
                                anchorEl={anchorElArray[index]}
                                open={Boolean(anchorElArray[index])}
                                onClose={() => handleUpdateStatusMenuClose(index)}
                                MenuListProps={{
                                  'aria-labelledby': `status-button-${item._id}`,
                                }}
                                anchorOrigin={{
                                  vertical: 'bottom',
                                  horizontal: 'right',
                                }}
                                transformOrigin={{
                                  vertical: 'top',
                                  horizontal: 'right',
                                }}
                                PaperProps={{
                                  elevation: 2,
                                  sx: {
                                    borderRadius: 2,
                                    mt: 0.5
                                  }
                                }}
                              >
                                {getAvailableStatusUpdates(item.orderStatus).map((statusUpdate, idx) => (
                                  <MenuItem
                                    key={idx}
                                    onClick={() => {
                                      statusUpdate.action(item._id, index);
                                      handleUpdateStatusMenuClose(index);
                                    }}
                                  >
                                    {statusUpdate.label}
                                  </MenuItem>
                                ))}
                              </Menu>
                            </>
                          )}

                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DeleteIcon fontSize="small" />}
                            onClick={() => handleDeleteOrder(item?._id)}
                            color="error"
                            sx={{
                              borderRadius: '8px',
                              textTransform: 'none',
                              fontWeight: 600,
                              px: 2
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {totalOrders > 0 && (
          <Box sx={{ 
            p: 3, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderTop: '1px solid', 
            borderColor: 'rgba(255, 255, 255, 0.05)',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Showing {startIndex + 1}-{Math.min(endIndex, totalOrders)} of {totalOrders} orders
            </Typography>
            
            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePaginationChange}
                color="primary"
                size="medium"
                showFirstButton
                showLastButton
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(187, 134, 252, 0.1)',
                      borderColor: '#bb86fc'
                    },
                    '&.Mui-selected': {
                      bgcolor: '#bb86fc',
                      color: '#000',
                      fontWeight: 'bold'
                    }
                  }
                }}
              />
            )}
          </Box>
        )}
      </Card>

      {/* Order Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            bgcolor: '#1e1e1e',
            color: '#fff'
          }
        }}
      >
        <DialogTitle sx={{ 
          py: 2.5, 
          px: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, #673ab7 0%, #9c27b0 100%)',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  width: 48, 
                  height: 48, 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}
              >
                <ReceiptIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Order #{selectedOrder?._id?.substring(0, 8)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {selectedOrder?.orderDate && formatDate(selectedOrder.orderDate)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="inherit"
                size="small"
                startIcon={<ReceiptIcon />}
                onClick={() => selectedOrder && handleDownloadClick(selectedOrder)}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.5)',
                  borderRadius: '8px',
                  px: 2.5,
                  py: 1,
                  '&:hover': { 
                    borderColor: 'white', 
                    bgcolor: 'rgba(255,255,255,0.1)' 
                  }
                }}
              >
                Download Invoice
              </Button>
              <IconButton 
                onClick={handleCloseDialog} 
                sx={{ 
                  color: 'white', 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } 
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, bgcolor: '#121212' }}>
          {selectedOrder && (
            <Grid container spacing={3}>
              {/* Order Status Banner */}
              <Grid item xs={12}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2.5, 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: 2,
                    bgcolor: getStatusBgColor(selectedOrder.orderStatus),
                    border: `1px solid ${getStatusTextColor(selectedOrder.orderStatus)}60`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip 
                      label={selectedOrder.orderStatus} 
                      sx={{ 
                        bgcolor: '#2d2d2d', 
                        color: getStatusTextColor(selectedOrder.orderStatus),
                        fontWeight: 'bold',
                        px: 1.5,
                        py: 2.5,
                        border: `1px solid ${getStatusTextColor(selectedOrder.orderStatus)}60`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Typography sx={{ color: getStatusTextColor(selectedOrder.orderStatus), fontWeight: 500 }}>
                      {selectedOrder.orderStatus === 'DELIVERED' ? 'This order has been delivered successfully' :
                       selectedOrder.orderStatus === 'SHIPPED' ? 'This order is on the way' :
                       selectedOrder.orderStatus === 'CONFIRMED' ? 'This order has been confirmed' :
                       selectedOrder.orderStatus === 'PLACED' ? 'This order has been placed' :
                       'This order has been cancelled'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="h6" sx={{ color: getStatusTextColor(selectedOrder.orderStatus), fontWeight: 'bold' }}>
                    ৳{selectedOrder.totalDiscountedPrice}
                  </Typography>
                </Paper>
              </Grid>

              {/* Two Column Layout */}
              <Grid item xs={12} md={8}>
                {/* Order Items */}
                <Paper elevation={0} sx={{ 
                  p: 0, 
                  mb: 3, 
                  border: '1px solid', 
                  borderColor: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  bgcolor: '#1e1e1e'
                }}>
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'rgba(255, 255, 255, 0.05)', bgcolor: '#2d2d2d' }}>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: 600, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      color: '#bb86fc'
                    }}>
                      <Box 
                        component="span" 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          bgcolor: '#bb86fc', 
                          color: '#000', 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14
                        }}
                      >
                        {selectedOrder.orderItems.length}
                      </Box>
                      Order Items
                    </Typography>
                  </Box>
                  
                  <Box>
                    {selectedOrder.orderItems.map((item, idx) => {
                      // Use the improved image URL helper function
                      const imageUrl = getImageUrl(item);
                      
                      return (
                        <React.Fragment key={item._id || idx}>
                          <Box sx={{ 
                            p: 2.5, 
                            display: 'flex', 
                            borderBottom: idx < selectedOrder.orderItems.length - 1 ? '1px solid' : 'none',
                            borderColor: 'rgba(255, 255, 255, 0.05)',
                            '&:hover': {
                              bgcolor: 'rgba(187, 134, 252, 0.05)'
                            }
                          }}>
                            <Box sx={{ 
                              width: 90, 
                              height: 150, 
                              flexShrink: 0, 
                              mr: 2.5,
                              border: '1px solid',
                              borderColor: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: 2,
                              overflow: 'hidden',
                              bgcolor: '#2d2d2d',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              p: 1,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}>
                              <Avatar
                                src={imageUrl}
                                alt={item.product?.title || 'Product image'}
                                variant="square"
                                sx={{ 
                                  width: '100%', 
                                  height: '100%',
                                  objectFit: 'contain'
                                }}
                              />
                            </Box>
                            
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff' }}>
                                  {item.product?.title || 'Product'}
                                </Typography>
                                <Typography variant="subtitle1" sx={{ 
                                  fontWeight: 600, 
                                  color: '#03dac6',
                                  bgcolor: 'rgba(3, 218, 198, 0.1)',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1
                                }}>
                                  ৳{item.discountedPrice}
                                </Typography>
                              </Box>
                              
                              <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                <Grid item xs={12} sm={8}>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                    {item.size && (
                                      <Chip
                                        label={`Size: ${item.size}`}
                                        size="small"
                                        sx={{ 
                                          bgcolor: 'rgba(187, 134, 252, 0.1)', 
                                          color: '#bb86fc',
                                          height: 24,
                                          fontSize: '0.75rem',
                                          border: '1px solid rgba(187, 134, 252, 0.2)'
                                        }}
                                      />
                                    )}
                                    
                                    {item.color && (
                                      <Chip
                                        label={`Color: ${item.color}`}
                                        size="small"
                                        sx={{ 
                                          bgcolor: 'rgba(187, 134, 252, 0.1)', 
                                          color: '#bb86fc',
                                          height: 24,
                                          fontSize: '0.75rem',
                                          border: '1px solid rgba(187, 134, 252, 0.2)'
                                        }}
                                      />
                                    )}
                                    
                                    <Chip
                                      label={`Qty: ${item.quantity}`}
                                      size="small"
                                      sx={{ 
                                        bgcolor: '#bb86fc', 
                                        color: '#000',
                                        height: 24,
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                      }}
                                    />
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                  {item.price !== item.discountedPrice && (
                                    <>
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          textDecoration: 'line-through',
                                          color: 'rgba(255, 255, 255, 0.5)'
                                        }}
                                      >
                                        ৳{item.price}
                                      </Typography>
                                      <Typography variant="body2" sx={{ 
                                        color: '#cf6679',
                                        fontWeight: 600
                                      }}>
                                        Save {item.product?.discountPersent || Math.round((1 - item.discountedPrice / item.price) * 100)}%
                                      </Typography>
                                    </>
                                  )}
                                </Grid>
                              </Grid>
                            </Box>
                          </Box>
                        </React.Fragment>
                      );
                    })}
                  </Box>
                  
                  <Box sx={{ p: 3, bgcolor: '#2d2d2d', borderTop: '1px solid', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <Grid container>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Subtotal:</Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Discount:</Typography>
                        {selectedOrder.deliveryCharge > 0 && (
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Delivery Charge:</Typography>
                        )}
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1, color: '#fff' }}>Total:</Typography>
                        {selectedOrder.dueAmount > 0 && (
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1, color: '#ff9800' }}>Due Amount (COD):</Typography>
                        )}
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ color: '#fff' }}>৳{selectedOrder.totalPrice}</Typography>
                        <Typography variant="body2" sx={{ color: '#cf6679' }}>-৳{selectedOrder.discounte || 0}</Typography>
                        {selectedOrder.deliveryCharge > 0 && (
                          <Typography variant="body2" sx={{ color: '#fff' }}>৳{selectedOrder.deliveryCharge}</Typography>
                        )}
                        <Typography variant="subtitle1" sx={{ 
                          fontWeight: 600, 
                          mt: 1, 
                          color: '#03dac6',
                          bgcolor: 'rgba(3, 218, 198, 0.1)',
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1
                        }}>
                          ৳{selectedOrder.totalDiscountedPrice}
                        </Typography>
                        {selectedOrder.dueAmount > 0 && (
                          <Typography variant="subtitle1" sx={{ 
                            fontWeight: 600, 
                            mt: 1, 
                            color: '#ff9800',
                            bgcolor: 'rgba(255, 152, 0, 0.1)',
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1
                          }}>
                            ৳{selectedOrder.dueAmount}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
                
                {/* Order Timeline (can be expanded later) */}
                {selectedOrder.orderItems.length > 0 && selectedOrder.orderItems[0].product?.description && (
                  <Paper elevation={0} sx={{ 
                    p: 0, 
                    border: '1px solid', 
                    borderColor: 'rgba(255, 255, 255, 0.05)', 
                    borderRadius: 2, 
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    bgcolor: '#1e1e1e'
                  }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'rgba(255, 255, 255, 0.05)', bgcolor: '#2d2d2d' }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        color: '#bb86fc'
                      }}>
                        <Box 
                          component="span" 
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            bgcolor: '#bb86fc', 
                            color: '#000', 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14
                          }}
                        >
                          D
                        </Box>
                        Product Description
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2.5 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', whiteSpace: 'pre-line' }}>
                        {selectedOrder.orderItems[0].product?.description}
                      </Typography>
                    </Box>
                  </Paper>
                )}
              </Grid>
              
              <Grid item xs={12} md={4}>
                {/* User Information */}
                <Paper elevation={0} sx={{ 
                  p: 0, 
                  mb: 3, 
                  border: '1px solid', 
                  borderColor: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  bgcolor: '#1e1e1e'
                }}>
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'rgba(255, 255, 255, 0.05)', bgcolor: '#2d2d2d' }}>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: 600, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      color: '#bb86fc'
                    }}>
                      <Box 
                        component="span" 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          bgcolor: '#bb86fc', 
                          color: '#000', 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14
                        }}
                      >
                        C
                      </Box>
                      Customer Details
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 2.5 }}>
                    {selectedOrder.user ? (
                      <>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: 'rgba(187, 134, 252, 0.2)',
                              color: '#bb86fc',
                              width: 40,
                              height: 40,
                              fontSize: '1rem',
                              mr: 2
                            }}
                          >
                            {selectedOrder.user.firstName?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#fff' }}>
                              {selectedOrder.user.firstName} {selectedOrder.user.lastName}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {selectedOrder.user.email}
                            </Typography>
                            {selectedOrder.user.mobile && (
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5 }}>
                                Phone: {selectedOrder.user.mobile}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        flexDirection: 'column',
                        gap: 1
                      }}>
                        <CircularProgress size={24} sx={{ mb: 1, color: '#bb86fc' }} />
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading user details...</Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
                
                {/* Payment Details */}
                <Paper elevation={0} sx={{ 
                  p: 0, 
                  mb: 3, 
                  border: '1px solid', 
                  borderColor: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  bgcolor: '#1e1e1e'
                }}>
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'rgba(255, 255, 255, 0.05)', bgcolor: '#2d2d2d' }}>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: 600, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      color: '#bb86fc'
                    }}>
                      <Box 
                        component="span" 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          bgcolor: '#bb86fc', 
                          color: '#000', 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14
                        }}
                      >
                        P
                      </Box>
                      Payment Information
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 2.5 }}>
                    {paymentLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={24} sx={{ color: '#bb86fc' }} />
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading payment details...</Typography>
                      </Box>
                    ) : paymentDetails ? (
                      <>
                        <Box sx={{ 
                          mb: 2, 
                          p: 2, 
                          bgcolor: paymentDetails.status === 'COMPLETED' ? 'rgba(3, 218, 198, 0.1)' : 'rgba(255, 152, 0, 0.1)', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: paymentDetails.status === 'COMPLETED' ? 'rgba(3, 218, 198, 0.3)' : 'rgba(255, 152, 0, 0.3)'
                        }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 500, 
                            color: paymentDetails.status === 'COMPLETED' ? '#03dac6' : '#ff9800'
                          }}>
                            Payment {paymentDetails.status.toLowerCase()}
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            mt: 0.5, 
                            fontWeight: 600, 
                            color: paymentDetails.status === 'COMPLETED' ? '#03dac6' : '#ff9800'
                          }}>
                            ৳{paymentDetails.amount}
                          </Typography>
                        </Box>
                        
                        {paymentDetails.dueAmount > 0 && (
                          <Box sx={{ 
                            mb: 2, 
                            p: 2, 
                            bgcolor: 'rgba(255, 152, 0, 0.1)', 
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'rgba(255, 152, 0, 0.3)'
                          }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 500, 
                              color: '#ff9800'
                            }}>
                              Due Amount (COD)
                            </Typography>
                            <Typography variant="h6" sx={{ 
                              mt: 0.5, 
                              fontWeight: 600, 
                              color: '#ff9800'
                            }}>
                              ৳{paymentDetails.dueAmount}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Transaction ID</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {formatTransactionId(paymentDetails.transactionId)}
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                        
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Payment Method</Typography>
                          <Typography variant="body1" sx={{ color: '#fff' }}>{paymentDetails.paymentMethod || 'SSLCommerz'}</Typography>
                        </Box>
                                                
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Payment Date</Typography>
                          <Typography variant="body1" sx={{ color: '#fff' }}>{formatDate(paymentDetails.createdAt)}</Typography>
                        </Box>
                        
                        {paymentDetails.paymentPhoneNumber && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Payment Phone</Typography>
                            <Typography variant="body1" sx={{ color: '#fff' }}>{paymentDetails.paymentPhoneNumber}</Typography>
                          </Box>
                        )}
                      </>
                    ) : (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Payment Status</Typography>
                        <Chip
                          label={selectedOrder.orderStatus === 'DELIVERED' || selectedOrder.orderStatus === 'CONFIRMED' ? 'PAID' : 'PENDING'}
                          sx={{ 
                            mt: 0.5,
                            bgcolor: selectedOrder.orderStatus === 'DELIVERED' || selectedOrder.orderStatus === 'CONFIRMED' ? 'rgba(3, 218, 198, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                            color: selectedOrder.orderStatus === 'DELIVERED' || selectedOrder.orderStatus === 'CONFIRMED' ? '#03dac6' : '#ff9800',
                            border: '1px solid',
                            borderColor: selectedOrder.orderStatus === 'DELIVERED' || selectedOrder.orderStatus === 'CONFIRMED' ? 'rgba(3, 218, 198, 0.3)' : 'rgba(255, 152, 0, 0.3)'
                          }}
                          size="small"
                        />
                        
                        {selectedOrder.dueAmount > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Due Amount (COD)</Typography>
                            <Typography variant="body1" sx={{ 
                              fontWeight: 600, 
                              color: '#ff9800',
                              mt: 0.5
                            }}>
                              ৳{selectedOrder.dueAmount}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Paper>
                
                {/* Shipping Address */}
                <Paper elevation={0} sx={{ 
                  p: 0, 
                  border: '1px solid', 
                  borderColor: 'rgba(255, 255, 255, 0.05)', 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  bgcolor: '#1e1e1e'
                }}>
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'rgba(255, 255, 255, 0.05)', bgcolor: '#2d2d2d' }}>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: 600, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      color: '#bb86fc'
                    }}>
                      <Box 
                        component="span" 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          bgcolor: '#bb86fc', 
                          color: '#000', 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14
                        }}
                      >
                        S
                      </Box>
                      Shipping Address
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 2.5 }}>
                    {selectedOrder.shippingAddress ? (
                      <>
                        <Box 
                          sx={{ 
                            mb: 2, 
                            p: 2, 
                            bgcolor: '#2d2d2d', 
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5, color: '#fff' }}>
                            {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {selectedOrder.shippingAddress.streetAddress}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {selectedOrder.shippingAddress.upazilla}, {selectedOrder.shippingAddress.district}
                          </Typography>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Contact Number</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, color: '#fff' }}>
                            {selectedOrder.shippingAddress.mobile}
                          </Typography>
                          </Box>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ 
                        p: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        flexDirection: 'column',
                        gap: 1
                      }}>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Shipping address not available</Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
              
              {/* Order Action Buttons */}
              {(selectedOrder.orderStatus !== 'DELIVERED' && selectedOrder.orderStatus !== 'CANCELLED') && (
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ 
                    p: 2.5, 
                    border: '1px solid', 
                    borderColor: 'rgba(255, 255, 255, 0.05)', 
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    bgcolor: '#1e1e1e'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        color: '#bb86fc'
                      }}>
                        <Box 
                          component="span" 
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            bgcolor: '#bb86fc', 
                            color: '#000', 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14
                          }}
                        >
                          !
                        </Box>
                        Update Order Status
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        {getAvailableStatusUpdates(selectedOrder.orderStatus).map((statusUpdate, idx) => (
                          <Button
                            key={idx}
                            variant="contained"
                            onClick={() => statusUpdate.action(selectedOrder._id)}
                            sx={{ 
                              textTransform: 'none',
                              px: 3,
                              py: 1,
                              borderRadius: 2,
                              fontWeight: 600,
                              bgcolor: '#bb86fc',
                              '&:hover': {
                                bgcolor: '#9c64db'
                              }
                            }}
                          >
                            {statusUpdate.label}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                    
                    {/* Show Mark Due as Paid button for COD orders with due amount */}
                    {selectedOrder.paymentOption === 'cod' && 
                     selectedOrder.dueAmount > 0 && 
                     selectedOrder.dueStatus !== 'PAID' && (
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          startIcon={<MoneyIcon />}
                          onClick={() => handleMarkDuePaid(selectedOrder._id)}
                          sx={{
                            textTransform: 'none',
                            px: 3,
                            py: 1,
                            borderRadius: 2,
                            fontWeight: 600,
                            bgcolor: '#ff9800',
                            '&:hover': {
                              bgcolor: '#f57c00'
                            }
                          }}
                        >
                          Mark Due Amount as Paid
                        </Button>
                      </Box>
                    )}
                    
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Add the Invoice Preview Modal */}
      <InvoicePreviewModal 
        open={openInvoicePreview} 
        onClose={() => setOpenInvoicePreview(false)} 
        order={invoiceOrder} 
      />

      {/* Outlet Order Form Dialog */}
      <OutletOrderForm 
        open={openOutletOrderForm} 
        handleClose={handleCloseOutletOrderForm} 
        refreshOrders={() => dispatch(getOrders({ jwt }))}
      />
    </Box>
  );
};

// Outlet Order Form Component
const OutletOrderForm = ({ open, handleClose, refreshOrders }) => {
  // State for the form
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    promoCode: '',
    products: [],
    totalPrice: 0,
    totalDiscountedPrice: 0,
    productDiscount: 0,
    promoCodeDiscount: 0,
    discount: 0,
    deliveryCharge: 0, // Fixed at 0 for outlet orders
  });
  
  // State for promo code
  const [promoCodeDetails, setPromoCodeDetails] = useState(null);
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);
  const [promoCodeError, setPromoCodeError] = useState('');
  
  // Outlet address (fixed, non-editable)
  const outletAddress = {
    streetAddress: '147/C, Green Road',
    city: 'Dhaka',
    division: 'Dhaka',
    district: 'Dhaka',
    upazilla: 'Green Road',
    area: 'Green Road',
    zone: 'Dhaka',
    zipCode: '1205',
  };
  
  // State for product search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  const jwt = localStorage.getItem("jwt");
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    
    // If query is at least 3 characters, auto search
    if (e.target.value.length >= 3) {
      searchProducts(e.target.value);
    }
  };
  
  // Search for products with fixed endpoint and better error handling
  const searchProducts = async (query = searchQuery) => {
    if (!query.trim()) return;
    
    setSearchLoading(true);
    setSearchResults([]);
    
    try {
      // Using the correct admin products endpoint
      const response = await fetch(`${API_URL}/api/admin/products?keyword=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.products && Array.isArray(data.products)) {
        setSearchResults(data.products);
        if (data.products.length === 0) {
          toast.info('No products found matching your search criteria');
        }
      } else {
        console.error('Unexpected API response format:', data);
        toast.error('Invalid response from server');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error(`Failed to search products: ${error.message}`);
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Validate promo code
  const validatePromoCode = async () => {
    if (!formData.promoCode.trim()) {
      setPromoCodeError('Please enter a promo code');
      return;
    }
    
    setPromoCodeLoading(true);
    setPromoCodeError('');
    
    try {
      const response = await fetch(`${API_URL}/api/promo-codes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          code: formData.promoCode,
          cartTotal: formData.totalDiscountedPrice
        })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        setPromoCodeDetails(data.promoCode);
        toast.success('Promo code applied successfully!');
        
        // Apply discount
        const promoDiscount = calculatePromoDiscount(data.promoCode, formData.totalDiscountedPrice);
        
        setFormData(prev => ({
          ...prev,
          promoCodeDiscount: promoDiscount,
          discount: prev.productDiscount + promoDiscount
        }));
      } else {
        setPromoCodeError(data.message || 'Invalid promo code');
        setPromoCodeDetails(null);
        
        // Reset promo discount
        setFormData(prev => ({
          ...prev,
          promoCodeDiscount: 0,
          discount: prev.productDiscount
        }));
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoCodeError('Failed to validate promo code');
      setPromoCodeDetails(null);
    } finally {
      setPromoCodeLoading(false);
    }
  };
  
  // Calculate promo code discount
  const calculatePromoDiscount = (promoCode, subtotal) => {
    if (!promoCode) return 0;
    
    let discount = 0;
    
    if (promoCode.discountType === 'PERCENTAGE') {
      discount = (subtotal * promoCode.discountValue) / 100;
      
      // Check if there's a max discount cap
      if (promoCode.maxDiscountAmount && discount > promoCode.maxDiscountAmount) {
        discount = promoCode.maxDiscountAmount;
      }
    } else if (promoCode.discountType === 'FIXED') {
      discount = promoCode.discountValue;
    }
    
    return discount;
  };
  
  // Handle product selection
  const handleAddProduct = (product) => {
    // Check if product with same ID already exists
    if (selectedProducts.some(p => p._id === product._id)) {
      toast.warning('Product already added');
      return;
    }
    
    const newProduct = {
      _id: product._id,
      title: product.title,
      price: product.price,
      discountedPrice: product.discountedPrice,
      image: product.colors[0]?.images[0] || '',
      quantity: 1,
      color: product.colors[0]?.name || '',
      size: product.colors[0]?.sizes[0]?.name || '',
      selectedColorIndex: 0,
      selectedSizeIndex: 0,
    };
    
    setSelectedProducts([...selectedProducts, newProduct]);
    
    // Recalculate totals
    calculateTotals([...selectedProducts, newProduct]);
  };
  
  // Handle product removal
  const handleRemoveProduct = (index) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts.splice(index, 1);
    setSelectedProducts(updatedProducts);
    
    // Recalculate totals
    calculateTotals(updatedProducts);
  };
  
  // Handle quantity change
  const handleQuantityChange = (index, value) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[index].quantity = parseInt(value) || 1;
    setSelectedProducts(updatedProducts);
    
    // Recalculate totals
    calculateTotals(updatedProducts);
  };
  
  // Handle color change
  const handleColorChange = (index, colorIndex) => {
    const updatedProducts = [...selectedProducts];
    const product = updatedProducts[index];
    product.selectedColorIndex = colorIndex;
    product.color = searchResults.find(p => p._id === product._id).colors[colorIndex].name;
    
    // Reset size to first available size for this color
    product.selectedSizeIndex = 0;
    product.size = searchResults.find(p => p._id === product._id).colors[colorIndex].sizes[0]?.name || '';
    
    // Update image
    product.image = searchResults.find(p => p._id === product._id).colors[colorIndex].images[0] || '';
    
    setSelectedProducts(updatedProducts);
  };
  
  // Handle size change
  const handleSizeChange = (index, sizeIndex) => {
    const updatedProducts = [...selectedProducts];
    const product = updatedProducts[index];
    product.selectedSizeIndex = sizeIndex;
    product.size = searchResults.find(p => p._id === product._id).colors[product.selectedColorIndex].sizes[sizeIndex].name;
    setSelectedProducts(updatedProducts);
  };
  
  // Calculate totals
  const calculateTotals = (products) => {
    const totalPrice = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const totalDiscountedPrice = products.reduce((sum, p) => sum + (p.discountedPrice * p.quantity), 0);
    const productDiscount = totalPrice - totalDiscountedPrice;
    
    // If we have a promo code, recalculate that discount
    let promoDiscount = 0;
    if (promoCodeDetails) {
      promoDiscount = calculatePromoDiscount(promoCodeDetails, totalDiscountedPrice);
    }
    
    setFormData({
      ...formData,
      products,
      totalPrice,
      totalDiscountedPrice,
      productDiscount,
      promoCodeDiscount: promoDiscount,
      discount: productDiscount + promoDiscount,
      deliveryCharge: 0 // Always 0 for outlet orders
    });
  };
  
  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.mobile || selectedProducts.length === 0) {
      toast.error('Please fill all required fields (First Name, Last Name, Mobile) and add at least one product');
      return;
    }
    
    // Validate mobile number format (Bangladesh)
    const mobileRegex = /^01[3-9]\d{8}$/;
    if (!mobileRegex.test(formData.mobile)) {
      toast.error('Please enter a valid Bangladesh mobile number (e.g., 01712345678)');
      return;
    }
    
    try {
      // Based on Address model inspection, include ALL required address fields directly in customerInfo
      const orderData = {
        customerInfo: {
          // Server expects a single name field, so combine first and last name
          name: `${formData.firstName} ${formData.lastName}`,
          // Server expects phoneNumber, not mobile
          phoneNumber: formData.mobile,
          email: formData.email || '',
          // Address fields from controller inspection
          address: outletAddress.streetAddress,
          city: outletAddress.city,
          // Additional required fields from Address model
          division: outletAddress.division,
          district: outletAddress.district,
          upazilla: outletAddress.upazilla,
          area: outletAddress.area,
          zone: outletAddress.zone,
          zipCode: outletAddress.zipCode,
          // Force required properties to be explicitly included
          firstName: formData.firstName,
          lastName: formData.lastName,
          mobile: formData.mobile // Required by Address model
        },
        products: selectedProducts.map(p => ({
          productId: p._id,
          quantity: p.quantity,
          color: p.color,
          size: p.size,
          price: p.price,
          discountedPrice: p.discountedPrice
        })),
        totalPrice: formData.totalPrice,
        totalDiscountedPrice: formData.totalDiscountedPrice,
        discount: formData.discount,
        shippingCharges: 0 // Always 0 for outlet orders
      };
      
      // Log the data being sent to the API
      console.log('Sending order data to API:', JSON.stringify(orderData, null, 2));
      console.log('API URL:', `${API_URL}/api/admin/orders/outlet`);
      console.log('JWT token available:', !!jwt);
      
      // Display loading toast
      const loadingToastId = toast.info('Creating outlet order...', { autoClose: false });
      
      // Make API call
      const response = await fetch(`${API_URL}/api/admin/orders/outlet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(orderData)
      });
      
      // Log the raw response
      console.log('API Response status:', response.status);
      console.log('API Response headers:', [...response.headers.entries()]);
      
      // Parse response
      const result = await response.json();
      console.log('API Response data:', result);
      
      // Close loading toast
      toast.dismiss(loadingToastId);
      
      if (response.ok && result.success) {
        toast.success('Outlet order created successfully');
        handleClose();
        refreshOrders();
      } else {
        toast.error(result.message || `Failed to create outlet order (${response.status})`);
        console.error('Error details from API:', result);
      }
    } catch (error) {
      console.error('Error creating outlet order:', error);
      toast.error(`Failed to create outlet order: ${error.message || 'Unknown error'}`);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        py: 2,
        mb: 2
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <ShoppingBagIcon />
            <Typography variant="h6" fontWeight="bold">Create Outlet Order</Typography>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Customer Information */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2 }}>Customer Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>First Name *</InputLabel>
                  <Box>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First Name"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ccc'
                      }}
                    />
                  </Box>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Last Name *</InputLabel>
                  <Box>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last Name"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ccc'
                      }}
                    />
                  </Box>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Mobile Number *</InputLabel>
                  <Box>
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="Mobile Number (e.g., 01712345678)"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ccc'
                      }}
                    />
                  </Box>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Email</InputLabel>
                  <Box>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email (Optional)"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ccc'
                      }}
                    />
                  </Box>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Outlet Address (Fixed)</InputLabel>
                  <TextField
                    value={`${outletAddress.streetAddress}, ${outletAddress.upazilla}, ${outletAddress.district}, ${outletAddress.division} - ${outletAddress.zipCode}`}
                    disabled
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <StorefrontIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Promo Code</InputLabel>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <input
                      type="text"
                      name="promoCode"
                      value={formData.promoCode}
                      onChange={handleChange}
                      placeholder="Enter promo code"
                      style={{
                        width: '70%',
                        padding: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ccc'
                      }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={validatePromoCode}
                      disabled={promoCodeLoading || !formData.promoCode || selectedProducts.length === 0}
                      sx={{ width: '30%' }}
                    >
                      {promoCodeLoading ? <CircularProgress size={24} /> : 'Apply'}
                    </Button>
                  </Box>
                  {promoCodeError && (
                    <Typography color="error" variant="caption">{promoCodeError}</Typography>
                  )}
                  {promoCodeDetails && (
                    <Alert severity="success" sx={{ mt: 1 }}>
                      Promo code applied: {promoCodeDetails.code} - 
                      {promoCodeDetails.discountType === 'PERCENTAGE' ? 
                        `${promoCodeDetails.discountValue}% off` : 
                        `৳${promoCodeDetails.discountValue} off`}
                    </Alert>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
          
          {/* Product Search */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>Add Products</Typography>
            
            <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: '8px' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Search Products"
                  placeholder="Enter product name, SKU, or category"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
                <Button 
                  variant="contained" 
                  onClick={searchProducts}
                  disabled={searchLoading || searchQuery.length < 3}
                  sx={{ 
                    height: '56px', 
                    px: 3,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 'bold'
                  }}
                  startIcon={searchLoading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </Button>
              </Box>
              {searchQuery && searchQuery.length < 3 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Please enter at least 3 characters to search
                </Typography>
              )}
            </Paper>
            
            {/* Search Results */}
            {searchLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>Searching products...</Typography>
              </Box>
            ) : searchResults.length > 0 ? (
              <Paper elevation={3} sx={{ mb: 4, borderRadius: '8px', overflow: 'hidden' }}>
                <Box sx={{ bgcolor: 'grey.100', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    <SearchIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Search Results ({searchResults.length} product{searchResults.length !== 1 ? 's' : ''})
                  </Typography>
                  <Chip 
                    label={`Found ${searchResults.length} item${searchResults.length !== 1 ? 's' : ''}`} 
                    color="primary" 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell align="center" width="80">Image</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Discount</TableCell>
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {searchResults.map((product) => {
                        const discount = product.price - product.discountedPrice;
                        const discountPercent = Math.round((discount / product.price) * 100);
                        
                        return (
                          <TableRow key={product._id} hover>
                            <TableCell align="center">
                              {product.colors[0]?.images[0] ? (
                                <Avatar
                                  src={product.colors[0].images[0]}
                                  alt={product.title}
                                  variant="rounded"
                                  sx={{ width: 60, height: 60, mx: 'auto' }}
                                />
                              ) : (
                                <Avatar variant="rounded" sx={{ width: 60, height: 60, bgcolor: 'grey.300', mx: 'auto' }}>
                                  <ShoppingBagIcon />
                                </Avatar>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight="bold">{product.title}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                SKU: {product.sku || 'N/A'} | Colors: {product.colors.length} | Sizes: {product.colors.reduce((total, color) => total + color.sizes.length, 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ textDecoration: discount > 0 ? 'line-through' : 'none', color: discount > 0 ? 'text.secondary' : 'text.primary' }}>
                                ৳{product.price.toLocaleString()}
                              </Typography>
                              {discount > 0 && (
                                <Typography variant="body2" fontWeight="bold" color="primary">
                                  ৳{product.discountedPrice.toLocaleString()}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {discount > 0 ? (
                                <Chip 
                                  label={`${discountPercent}% OFF`} 
                                  color="error" 
                                  size="small" 
                                  variant="outlined"
                                />
                              ) : (
                                <Typography variant="caption" color="text.secondary">No discount</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Add to order">
                                <Button 
                                  variant="contained" 
                                  color="primary" 
                                  size="small"
                                  onClick={() => handleAddProduct(product)}
                                  startIcon={<AddShoppingCartIcon />}
                                  sx={{ borderRadius: '20px' }}
                                >
                                  Add
                                </Button>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ) : searchQuery.length >= 3 && !searchLoading ? (
              <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: '8px', bgcolor: 'grey.50', textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No products found matching &quot;{searchQuery}&quot;. Try a different search term.
                </Typography>
              </Paper>
            ) : null}
            
            {/* Selected Products */}
            {selectedProducts.length > 0 ? (
              <Paper elevation={3} sx={{ mb: 4, borderRadius: '8px', overflow: 'hidden' }}>
                <Box sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    <ShoppingBagIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Order Items ({selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''})
                  </Typography>
                  <Chip 
                    label={`${selectedProducts.reduce((total, p) => total + p.quantity, 0)} items`} 
                    color="primary" 
                    size="small"
                    sx={{ bgcolor: 'white', fontWeight: 'bold' }}
                  />
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell align="center" width="80">Image</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell align="center">Color</TableCell>
                        <TableCell align="center">Size</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="center">Quantity</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedProducts.map((product, index) => {
                        const productDetails = searchResults.find(p => p._id === product._id);
                        return (
                          <TableRow key={index} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                            <TableCell align="center">
                              {product.image ? (
                                <Avatar 
                                  src={product.image} 
                                  alt={product.title} 
                                  variant="rounded"
                                  sx={{ width: 60, height: 60, mx: 'auto' }}
                                />
                              ) : (
                                <Avatar variant="rounded" sx={{ width: 60, height: 60, bgcolor: 'grey.300', mx: 'auto' }}>
                                  <ShoppingBagIcon />
                                </Avatar>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight="bold">{product.title}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Unit Price: ৳{product.discountedPrice.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Select
                                value={product.selectedColorIndex}
                                onChange={(e) => handleColorChange(index, e.target.value)}
                                size="small"
                                sx={{ minWidth: 100 }}
                                variant="outlined"
                              >
                                {productDetails?.colors.map((color, colorIndex) => (
                                  <MenuItem key={colorIndex} value={colorIndex}>{color.name}</MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                            <TableCell align="center">
                              <Select
                                value={product.selectedSizeIndex}
                                onChange={(e) => handleSizeChange(index, e.target.value)}
                                size="small"
                                sx={{ minWidth: 80 }}
                                variant="outlined"
                              >
                                {productDetails?.colors[product.selectedColorIndex]?.sizes.map((size, sizeIndex) => (
                                  <MenuItem key={sizeIndex} value={sizeIndex}>{size.name}</MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight="medium">৳{product.discountedPrice.toLocaleString()}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                type="number"
                                InputProps={{ inputProps: { min: 1 } }}
                                value={product.quantity}
                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                variant="outlined"
                                size="small"
                                sx={{ width: '80px' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight="bold" color="primary">
                                ৳{(product.discountedPrice * product.quantity).toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Remove item">
                                <IconButton 
                                  color="error" 
                                  onClick={() => handleRemoveProduct(index)}
                                  size="small"
                                  sx={{ 
                                    bgcolor: 'error.lighter', 
                                    '&:hover': { bgcolor: 'error.light' } 
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Order Summary */}
                <Box sx={{ mt: 3, p: 2, border: '1px solid #eee', borderRadius: '4px' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Order Summary</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography>Total Price:</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography>৳{formData.totalPrice.toFixed(2)}</Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography>Product Discount:</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography>৳{formData.productDiscount.toFixed(2)}</Typography>
                    </Grid>
                    
                    {formData.promoCodeDiscount > 0 && (
                      <>
                        <Grid item xs={6}>
                          <Typography>Promo Code Discount:</Typography>
                        </Grid>
                        <Grid item xs={6} textAlign="right">
                          <Typography>৳{formData.promoCodeDiscount.toFixed(2)}</Typography>
                        </Grid>
                      </>
                    )}
                    
                    <Grid item xs={6}>
                      <Typography>Delivery Charge:</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography>৳0.00 (Free for Outlet Orders)</Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="h6">Total Amount:</Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                      <Typography variant="h6">
                        ৳{(formData.totalDiscountedPrice - formData.promoCodeDiscount).toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            ) : null}
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} color="inherit">Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={selectedProducts.length === 0}
        >
          Create Outlet Order
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrdersTable;
