import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import * as XLSX from 'xlsx';
import { PDFDocument, rgb } from '@react-pdf/renderer';
import axios from 'axios';

// Static fallback data based on what we know is in the database
const FALLBACK_DATA = [
  {
    _id: "67f29ed140ccb55b8052103e",
    name: "protyay",
    email: "protyayrd@gmail.com",
    phone: "01316156085",
    address: "ddd",
    district: "ddd",
    division: "Mymensingh",
    zipCode: "2200",
    tshirtSize: "M",
    tshirtCategory: "Regular Fit",
    price: 499,
    paymentStatus: "Paid",
    status: "Pending",
    createdAt: "2025-04-06T15:33:37.693Z",
    transactionId: "TSHIRT-a077d6db-6900-41ea-9c5e-7320fa7c0bb6",
    paymentDetails: {}
  }
];

const TshirtOrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [directData, setDirectData] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  useEffect(() => {
    fetchOrders();
    // Also try a direct database fetch
    fetchDirectFromDatabase();
  }, []);

  const useFallbackData = () => {
    const normalizedOrders = FALLBACK_DATA.map(order => ({
      ...order,
      jerseyCategory: order.jerseyCategory || order.tshirtCategory || 'Unknown'
    }));
    setOrders(normalizedOrders);
    setLoading(false);
    setUsingFallback(true);
  };

  const fetchDirectFromDatabase = async () => {
    try {
      const response = await axios.get('https://tweestbd.com/api/tshirt-orders/admin', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setDirectData(response.data);
      
      if (response.data && response.data.data) {
        // Update orders with this data
        const normalizedOrders = response.data.data.map(order => ({
          ...order,
          jerseyCategory: order.jerseyCategory || order.tshirtCategory || 'Unknown'
        }));
        setOrders(normalizedOrders);
        setLoading(false);
      }
    } catch (error) {
      console.error('Direct API call error:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      // If direct API call fails, use fallback data
      useFallbackData();
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get('/api/tshirt-orders/admin');
      setApiResponse(response.data);
      
      if (response.data && response.data.data) {
        
        // Normalize the data to handle both tshirtCategory and jerseyCategory
        const normalizedOrders = response.data.data.map(order => ({
          ...order,
          // Ensure consistent property naming for rendering
          jerseyCategory: order.jerseyCategory || order.tshirtCategory || 'Unknown'
        }));
        
        setOrders(normalizedOrders);
      } else {
        console.warn('Response data structure unexpected:', response.data);
        setError('Unexpected response format from server');
        // If response format is unexpected, use fallback data
        useFallbackData();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jersey orders:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(`Failed to fetch jersey orders: ${error.message || 'Unknown error'}`);
      // If API call fails, use fallback data
      useFallbackData();
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      setUpdatingStatus(true);
      await axios.put(`/api/tshirt-orders/admin/${selectedOrder._id}/status`, {
        status: newStatus
      });
      setSelectedOrder({ ...selectedOrder, status: newStatus });
      fetchOrders(); // Refresh orders list
      setUpdatingStatus(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
      setUpdatingStatus(false);
    }
  };

  const handlePaymentStatusChange = async (e) => {
    const newPaymentStatus = e.target.value;
    try {
      setUpdatingStatus(true);
      await axios.put(`/api/tshirt-orders/admin/${selectedOrder._id}/payment-status`, {
        paymentStatus: newPaymentStatus
      });
      setSelectedOrder({ ...selectedOrder, paymentStatus: newPaymentStatus });
      fetchOrders(); // Refresh orders list
      setUpdatingStatus(false);
    } catch (error) {
      console.error('Error updating payment status:', error);
      setError('Failed to update payment status');
      setUpdatingStatus(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setUpdatingStatus(true);
      // Both status updates will be handled by their respective handlers
      await handleStatusChange({ target: { value: selectedOrder.status } });
      await handlePaymentStatusChange({ target: { value: selectedOrder.paymentStatus } });
      setOpenDialog(false);
      setSelectedOrder(null);
      setUpdatingStatus(false);
      fetchOrders(); // Refresh the orders list
    } catch (error) {
      console.error('Error saving changes:', error);
      setError('Failed to save changes');
      setUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async () => {
    try {
      await axios.delete(`/api/tshirt-orders/admin/${orderToDelete._id}`);
      setOrders(orders.filter(order => order._id !== orderToDelete._id));
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);
      setError(''); // Clear any existing errors
    } catch (error) {
      console.error('Error deleting order:', error);
      setError('Failed to delete order');
    }
  };

  const downloadAsExcel = () => {
    try {
      // Format the data for Excel
      const excelData = orders.map(order => ({
        'Order ID': order._id,
        'Date': formatDate(order.createdAt),
        'Customer Name': order.name,
        'Phone': order.phone,
        'Email': order.email || 'N/A',
        'Address': order.address,
        'District': order.district,
        'Division': order.division,
        'Jersey Size': order.tshirtSize,
        'Jersey Type': order.jerseyCategory || order.tshirtCategory,
        'Jersey Name': order.jerseyName || 'N/A',
        'Jersey Number': order.jerseyNumber || 'N/A',
        'SSC Batch': order.sscBatch || 'N/A',
        'Price': `৳${order.price}`,
        'Payment Status': order.paymentStatus,
        'Order Status': order.status,
        'Transaction ID': formatTransactionId(order.transactionId) || 'N/A'
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const columnWidths = [
        { wch: 25 }, // Order ID
        { wch: 20 }, // Date
        { wch: 20 }, // Customer Name
        { wch: 15 }, // Phone
        { wch: 25 }, // Email
        { wch: 30 }, // Address
        { wch: 15 }, // District
        { wch: 15 }, // Division
        { wch: 10 }, // Jersey Size
        { wch: 15 }, // Jersey Type
        { wch: 15 }, // Jersey Name
        { wch: 12 }, // Jersey Number
        { wch: 10 }, // SSC Batch
        { wch: 10 }, // Price
        { wch: 12 }, // Payment Status
        { wch: 12 }, // Order Status
        { wch: 25 }, // Transaction ID
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `tshirt-orders-${date}.xlsx`;

      // Write file
      XLSX.writeFile(workbook, filename);

      // Clear any existing errors
      setError('');
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      setError('Failed to download Excel file');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Processing':
        return 'info';
      case 'Shipped':
      case 'Delivered':
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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

  // Format Order ID to display nicely
  const formatOrderId = (order) => {
    return order.formattedOrderId || `#${order._id.slice(-6)}`;
  };

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
        <Typography variant="h6" mt={2}>Loading orders...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: '#0A0A1B', 
      minHeight: '100vh',
      color: 'white',
      p: 3 
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 4 
      }}>
        <Typography variant="h4" sx={{ 
          color: '#8B5CF6',
          fontWeight: 'bold' 
        }}>
          Jersey Orders
      </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">T-shirt Orders</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={downloadAsExcel}
            sx={{ mr: 1 }}
          >
            Download Excel
          </Button>
        </Box>
      </Box>

      <Box mt={2} mb={2} display="flex" alignItems="center" gap={2}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={fetchOrders} 
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Refresh Orders'}
        </Button>
        
        <Button 
          variant="outlined" 
          color="secondary" 
          onClick={fetchDirectFromDatabase} 
          disabled={loading}
        >
          Direct API Call
        </Button>
        
        <Button 
          variant="contained" 
          color="warning" 
          onClick={useFallbackData} 
          disabled={loading}
        >
          Use Fallback Data
        </Button>
        
        {apiResponse && (
          <Alert severity="info" sx={{ flex: 1 }}>
            API Response Status: {apiResponse.success ? 'Success' : 'Failed'} | 
            Count: {apiResponse.count || 'N/A'}
          </Alert>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {usingFallback && (
        <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
          Using fallback data due to API connectivity issues
        </Alert>
      )}

      {directData && (
        <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
          Direct API call: Found {directData.count || 0} orders
        </Alert>
      )}

      {orders.length === 0 ? (
        <Alert severity="info">No jersey orders found</Alert>
      ) : (
        <TableContainer sx={{ 
          bgcolor: 'transparent',
          '& .MuiTableCell-root': {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            color: 'white'
          }
        }}>
          <Table>
            <TableHead>
              <TableRow sx={{
                '& th': {
                  bgcolor: '#8B5CF6',
                  color: 'white',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }
              }}>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Jersey Details</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell>Order Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow 
                  key={order._id}
                  sx={{
                    '&:hover': {
                      bgcolor: 'rgba(139, 92, 246, 0.1)'
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 500 }}>
                        {formatOrderId(order)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {order._id.substring(0, 8)}...
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{order.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'gray' }}>
                      {order.phone}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">Name: {order.jerseyName || 'N/A'}</Typography>
                    <Typography variant="caption" sx={{ color: 'gray' }}>
                      Number: {order.jerseyNumber || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>{order.tshirtSize}</TableCell>
                  <TableCell>{order.jerseyCategory || order.tshirtCategory}</TableCell>
                  <TableCell>Tk. {order.price}</TableCell>
                  <TableCell>
                    <Chip 
                      label={order.paymentStatus}
                      color={order.paymentStatus === 'Paid' ? 'success' : 'warning'}
                      size="small"
                      sx={{
                        bgcolor: order.paymentStatus === 'Paid' ? '#059669' : '#D97706',
                        color: 'white',
                        '& .MuiChip-label': {
                          px: 2
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                      sx={{
                        bgcolor: order.status === 'Pending' ? '#EA580C' : '#059669',
                        color: 'white',
                        '& .MuiChip-label': {
                          px: 2
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton 
                        onClick={() => {
                          setSelectedOrder(order);
                          setOpenDialog(true);
                        }}
                        sx={{ color: '#8B5CF6' }}
                    >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1F2937',
            color: 'white'
          }
        }}
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ 
              bgcolor: '#8B5CF6',
              color: 'white'
            }}>
              Order Details - #{selectedOrder._id.slice(-6)}
            </DialogTitle>
            <DialogContent dividers sx={{ 
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom color="#8B5CF6">
                    Customer Information
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography><strong>Name:</strong> {selectedOrder.name}</Typography>
                    <Typography><strong>Phone:</strong> {selectedOrder.phone}</Typography>
                    <Typography><strong>Email:</strong> {selectedOrder.email || 'Not provided'}</Typography>
                    <Typography><strong>Address:</strong> {selectedOrder.address}</Typography>
                    <Typography><strong>Location:</strong> {selectedOrder.district}, {selectedOrder.division}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom color="#8B5CF6">
                    Order Information
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography>
                      <strong>Jersey Type:</strong> {selectedOrder.jerseyCategory || selectedOrder.tshirtCategory}
                    </Typography>
                    <Typography><strong>Jersey Size:</strong> {selectedOrder.tshirtSize}</Typography>
                    <Typography><strong>Price:</strong> Tk. {selectedOrder.price}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Order Status"
                    value={selectedOrder.status}
                    onChange={handleStatusChange}
                    disabled={updatingStatus}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'white',
                      },
                      '& .MuiMenuItem-root': {
                        color: 'black',
                      }
                    }}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Processing">Processing</MenuItem>
                    <MenuItem value="Shipped">Shipped</MenuItem>
                    <MenuItem value="Delivered">Delivered</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Payment Status"
                    value={selectedOrder.paymentStatus}
                    onChange={handlePaymentStatusChange}
                    disabled={updatingStatus}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'white',
                      },
                      '& .MuiMenuItem-root': {
                        color: 'black',
                      }
                    }}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Paid">Paid</MenuItem>
                    <MenuItem value="Failed">Failed</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ 
              bgcolor: '#1F2937',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Button 
                onClick={() => setOpenDialog(false)}
                sx={{ color: 'white' }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSaveChanges}
                disabled={updatingStatus}
                sx={{ 
                  bgcolor: '#8B5CF6',
                  '&:hover': {
                    bgcolor: '#7C3AED'
                  }
                }}
              >
                {updatingStatus ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1F2937',
            color: 'white'
          }
        }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this order? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{ color: 'white' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteOrder} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TshirtOrdersTable; 