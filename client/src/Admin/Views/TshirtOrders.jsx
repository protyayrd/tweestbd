import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getTshirtOrders } from '../../Redux/Customers/TshirtOrder/Action';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  CircularProgress,
  TextField,
  MenuItem,
  DialogContentText
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx';
import api from '../../config/api';
import { API_BASE_URL } from '../../config/api';

const TshirtOrders = () => {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.tshirtOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    console.log('JWT token available:', !!token); // Log if token exists
    dispatch(getTshirtOrders());
  }, [dispatch]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleDeleteClick = (order) => {
    setSelectedOrder(order);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/tshirt-orders/admin/${selectedOrder._id}`);
      dispatch(getTshirtOrders()); // Refresh orders list
      setOpenDeleteDialog(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      setError('Failed to delete order');
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      setUpdatingStatus(true);
      await api.put(`/api/tshirt-orders/admin/${selectedOrder._id}/status`, {
        status: newStatus
      });
      setSelectedOrder({ ...selectedOrder, status: newStatus });
      dispatch(getTshirtOrders()); // Refresh orders list
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
      await api.put(`/api/tshirt-orders/admin/${selectedOrder._id}/payment-status`, {
        paymentStatus: newPaymentStatus
      });
      setSelectedOrder({ ...selectedOrder, paymentStatus: newPaymentStatus });
      dispatch(getTshirtOrders()); // Refresh orders list
      setUpdatingStatus(false);
    } catch (error) {
      console.error('Error updating payment status:', error);
      setError('Failed to update payment status');
      setUpdatingStatus(false);
    }
  };

  const downloadAsExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(orders.map(order => ({
        'Order ID': order._id,
        'Date': new Date(order.createdAt).toLocaleDateString(),
        'Customer Name': order.name,
        'Phone': order.phone,
        'Email': order.email || 'N/A',
        'Address': order.address,
        'District': order.district,
        'Division': order.division,
        'Jersey Size': order.tshirtSize,
        'Jersey Type': order.jerseyCategory,
        'Jersey Name': order.jerseyName || 'N/A',
        'Jersey Number': order.jerseyNumber || 'N/A',
        'SSC Batch': order.sscBatch || 'N/A',
        'Price': `Tk. ${order.price}`,
        'Payment Status': order.paymentStatus,
        'Order Status': order.status,
        'Transaction ID': order.transactionId || 'N/A'
      })));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
      
      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `jersey-orders-${date}.xlsx`);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      setError('Failed to download Excel file');
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Failed':
        return 'error';
      case 'Pending':
      default:
        return 'warning';
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'success';
      case 'Cancelled':
        return 'error';
      case 'Pending':
      default:
        return 'warning';
    }
  };

  return (
    <Box sx={{ 
      bgcolor: '#0F172A',
      minHeight: '100vh',
      color: 'white',
      p: 3 
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center', 
        mb: 4,
        pb: 3,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            bgcolor: 'rgba(139, 92, 246, 0.2)', 
            p: 1.5, 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <SportsSoccerIcon sx={{ fontSize: 32, color: '#8B5CF6' }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
              Jersey Orders
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Manage and track all jersey orders
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<FileDownloadIcon />}
          onClick={downloadAsExcel}
          sx={{ 
            bgcolor: '#8B5CF6',
            borderRadius: '8px',
            py: 1.2,
            px: 2.5,
            fontWeight: 'medium',
            '&:hover': { bgcolor: '#7C3AED' }
          }}
        >
          Export to Excel
        </Button>
      </Box>

      {error && (
        <Box sx={{ 
          mb: 3, 
          p: 2, 
          bgcolor: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <Typography color="#EF4444">{error}</Typography>
        </Box>
      )}

      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          flexDirection: 'column',
          gap: 2,
          mt: 8 
        }}>
          <CircularProgress sx={{ color: '#8B5CF6' }} />
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Loading orders...
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          bgcolor: 'rgba(255, 255, 255, 0.03)', 
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <TableContainer component={Box}>
            <Table>
              <TableHead>
                <TableRow sx={{
                  '& th': {
                    bgcolor: 'rgba(139, 92, 246, 0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                    borderBottom: 'none',
                    py: 2
                  }
                }}>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Jersey Details</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>SSC Batch</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Status</TableCell>
                  <TableCell>Order Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow 
                    key={order._id}
                    sx={{
                      '&:hover': {
                        bgcolor: 'rgba(139, 92, 246, 0.08)'
                      },
                      '& td': {
                        borderColor: 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ 
                        bgcolor: 'rgba(139, 92, 246, 0.1)',
                        color: '#8B5CF6',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '4px',
                        fontWeight: 'medium',
                        display: 'inline-block'
                      }}>
                        #{order._id.slice(-6)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{order.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          {order.phone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {order.jerseyName || 'No Name'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          #{order.jerseyNumber || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        {order.tshirtSize}
                      </Box>
                    </TableCell>
                    <TableCell>{order.jerseyCategory}</TableCell>
                    <TableCell>{order.sscBatch || 'N/A'}</TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>Tk. {order.price}</TableCell>
                    <TableCell>
                      <Chip 
                        label={order.paymentStatus}
                        size="small"
                        sx={{
                          bgcolor: order.paymentStatus === 'Paid' ? 'rgba(5, 150, 105, 0.2)' : 
                                 order.paymentStatus === 'Failed' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(217, 119, 6, 0.2)',
                          color: order.paymentStatus === 'Paid' ? '#10B981' : 
                                order.paymentStatus === 'Failed' ? '#EF4444' : '#F59E0B',
                          fontWeight: 'bold',
                          border: '1px solid',
                          borderColor: order.paymentStatus === 'Paid' ? 'rgba(5, 150, 105, 0.4)' : 
                                      order.paymentStatus === 'Failed' ? 'rgba(220, 38, 38, 0.4)' : 'rgba(217, 119, 6, 0.4)',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={order.status}
                        size="small"
                        sx={{
                          bgcolor: order.status === 'Confirmed' ? 'rgba(5, 150, 105, 0.2)' : 
                                 order.status === 'Cancelled' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(234, 88, 12, 0.2)',
                          color: order.status === 'Confirmed' ? '#10B981' :
                                order.status === 'Cancelled' ? '#EF4444' : '#F97316',
                          fontWeight: 'bold',
                          border: '1px solid',
                          borderColor: order.status === 'Confirmed' ? 'rgba(5, 150, 105, 0.4)' : 
                                      order.status === 'Cancelled' ? 'rgba(220, 38, 38, 0.4)' : 'rgba(234, 88, 12, 0.4)',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          startIcon={<VisibilityIcon sx={{ fontSize: 18 }} />}
                          onClick={() => handleViewDetails(order)}
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(139, 92, 246, 0.2)',
                            color: '#8B5CF6',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            '&:hover': { 
                              bgcolor: 'rgba(139, 92, 246, 0.3)',
                            }
                          }}
                        >
                          View
                        </Button>
                        <IconButton 
                          onClick={() => handleDeleteClick(order)}
                          size="small"
                          sx={{ 
                            color: '#ef4444',
                            bgcolor: 'rgba(239, 68, 68, 0.1)',
                            '&:hover': { 
                              bgcolor: 'rgba(239, 68, 68, 0.2)',
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {orders.length === 0 && (
            <Box sx={{ 
              p: 4, 
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <Typography>No orders found</Typography>
            </Box>
          )}
        </Box>
      )}

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1A1A2E', 
            color: 'white',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ 
              bgcolor: '#8B5CF6',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
              padding: '16px 24px'
            }}>
              <SportsSoccerIcon sx={{ fontSize: 28 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  Order #{selectedOrder._id.slice(-6)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
            </DialogTitle>
            
            <DialogContent 
              dividers 
              sx={{ 
                borderColor: 'rgba(255, 255, 255, 0.08)',
                p: 0
              }}
            >
              <Box sx={{ p: 3 }}>
                {/* Order Status Banner */}
                <Box 
                  sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'rgba(139, 92, 246, 0.1)',
                    borderRadius: '8px',
                    p: 2,
                    mb: 3
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ color: '#8B5CF6', mb: 0.5 }}>ORDER STATUS</Typography>
                    <Chip 
                      label={selectedOrder.status}
                      color={getOrderStatusColor(selectedOrder.status)}
                      size="small"
                      sx={{
                        bgcolor: selectedOrder.status === 'Pending' ? '#EA580C' : 
                               selectedOrder.status === 'Confirmed' ? '#059669' : '#DC2626',
                        color: 'white',
                        fontWeight: 'bold',
                        px: 1
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#8B5CF6', mb: 0.5 }}>PAYMENT STATUS</Typography>
                    <Chip 
                      label={selectedOrder.paymentStatus}
                      color={getPaymentStatusColor(selectedOrder.paymentStatus)}
                      size="small"
                      sx={{
                        bgcolor: selectedOrder.paymentStatus === 'Paid' ? '#059669' : 
                               selectedOrder.paymentStatus === 'Pending' ? '#D97706' : '#DC2626',
                        color: 'white',
                        fontWeight: 'bold',
                        px: 1
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#8B5CF6', mb: 0.5 }}>TOTAL AMOUNT</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
                      Tk. {selectedOrder.price}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={4}>
                  {/* Customer Details */}
                  <Grid item xs={12} md={6}>
                    <Box 
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        p: 2.5,
                        height: '100%'
                      }}
                    >
                      <Typography variant="h6" gutterBottom sx={{ 
                        color: '#8B5CF6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        pb: 1,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        mb: 2
                      }}>
                        <Box component="span" sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: 12,
                          bgcolor: '#8B5CF6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14
                        }}>
                          1
                        </Box>
                        Customer Information
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            Full Name
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 'medium' }}>
                            {selectedOrder.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            Phone
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 'medium' }}>
                            {selectedOrder.phone}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            Email
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 'medium' }}>
                            {selectedOrder.email || 'Not provided'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            Delivery Address
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {selectedOrder.address}
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 1.5 }}>
                            {selectedOrder.district}, {selectedOrder.division}
                          </Typography>
                        </Grid>
                        {selectedOrder.transactionId && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              Transaction ID
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {selectedOrder.transactionId}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Grid>
                  
                  {/* Order Details */}
                  <Grid item xs={12} md={6}>
                    <Box 
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        p: 2.5,
                        height: '100%'
                      }}
                    >
                      <Typography variant="h6" gutterBottom sx={{ 
                        color: '#8B5CF6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        pb: 1,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        mb: 2
                      }}>
                        <Box component="span" sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: 12,
                          bgcolor: '#8B5CF6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14
                        }}>
                          2
                        </Box>
                        Jersey Details
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'rgba(139, 92, 246, 0.15)',
                          borderRadius: '8px',
                          p: 3,
                          mb: 2
                        }}>
                          <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                          }}>
                            <Typography variant="h5" sx={{ 
                              fontWeight: 'bold', 
                              color: '#8B5CF6',
                              mb: 1
                            }}>
                              {selectedOrder.jerseyNumber || 'N/A'}
                            </Typography>
                            <Typography variant="body1" sx={{ textAlign: 'center' }}>
                              {selectedOrder.jerseyName || 'No Name'}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              Jersey Type
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 'medium' }}>
                              {selectedOrder.jerseyCategory}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              Size
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 'medium' }}>
                              {selectedOrder.tshirtSize}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              SSC Batch
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 'medium' }}>
                              {selectedOrder.sscBatch || 'N/A'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                      
                      <Typography variant="h6" gutterBottom sx={{ 
                        color: '#8B5CF6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        pb: 1,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        mb: 2
                      }}>
                        <Box component="span" sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: 12,
                          bgcolor: '#8B5CF6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14
                        }}>
                          3
                        </Box>
                        Update Status
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            select
                            fullWidth
                            label="Order Status"
                            value={selectedOrder.status}
                            onChange={handleStatusChange}
                            disabled={updatingStatus}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                color: 'white',
                                '& fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(139, 92, 246, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#8B5CF6',
                                },
                              },
                              '& .MuiInputLabel-root': {
                                color: 'rgba(255, 255, 255, 0.7)',
                              },
                              '& .MuiMenuItem-root': {
                                color: 'black',
                              }
                            }}
                          >
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Confirmed">Confirmed</MenuItem>
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
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                color: 'white',
                                '& fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.2)',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(139, 92, 246, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#8B5CF6',
                                },
                              },
                              '& .MuiInputLabel-root': {
                                color: 'rgba(255, 255, 255, 0.7)',
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
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions sx={{ 
              bgcolor: '#1A1A2E',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              p: 2.5,
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px'
            }}>
              <Button 
                variant="outlined"
                onClick={() => setOpenDialog(false)}
                sx={{ 
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  '&:hover': { 
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  }
                }}
              >
                Close
              </Button>
              <Button 
                variant="contained"
                startIcon={updatingStatus ? <CircularProgress size={20} color="inherit" /> : null}
                disabled={updatingStatus}
                sx={{ 
                  bgcolor: '#8B5CF6',
                  '&:hover': { bgcolor: '#7C3AED' }
                }}
                onClick={() => setOpenDialog(false)}
              >
                {updatingStatus ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1A1A2E',
            color: 'white',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '100%'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{ 
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            color: '#EF4444',
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <DeleteIcon />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 3 }}>
          <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Are you sure you want to delete order <span style={{ fontWeight: 'bold', color: 'white' }}>#{selectedOrder?._id.slice(-6)}</span>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          pt: 0,
          gap: 1,
          justifyContent: 'flex-end'
        }}>
          <Button 
            variant="outlined" 
            onClick={() => setOpenDeleteDialog(false)} 
            sx={{ 
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                bgcolor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleDeleteConfirm}
            sx={{ 
              bgcolor: '#EF4444',
              color: 'white',
              '&:hover': { bgcolor: '#DC2626' }
            }}
          >
            Delete Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TshirtOrders; 