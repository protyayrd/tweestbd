import React, { useEffect, useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  Pagination,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { getDashboardStats } from '../../../Redux/Admin/Dashboard/Action';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentIcon from '@mui/icons-material/Payment';
import DateRangeIcon from '@mui/icons-material/DateRange';

// Status chips color mapping
const statusColors = {
  completed: 'success',
  failed: 'error',
  pending: 'warning',
  canceled: 'error',
  refunded: 'secondary',
  default: 'info'
};

const PaymentsPage = () => {
  const dispatch = useDispatch();
  const { dashboard } = useSelector((store) => store);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [detailDialog, setDetailDialog] = useState({ open: false, payment: null });
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const stats = await dispatch(getDashboardStats());
        
        // Get all payments data from API call in getDashboardStats
        let paymentData = [];
        
        // Check if stats exists and has payments data
        if (stats && stats.payments && Array.isArray(stats.payments)) {
          paymentData = stats.payments;
        } 
        // Check if dashboard.stats has payment data
        else if (dashboard.stats?.payments && Array.isArray(dashboard.stats.payments)) {
          paymentData = dashboard.stats.payments;
        }
        // If we can't get the full payments list, at least use recent payments
        else if (dashboard.stats?.recentPayments && Array.isArray(dashboard.stats.recentPayments)) {
          paymentData = dashboard.stats.recentPayments;
        }
        else {
          console.warn("No payment data found in API response");
        }
        
        setPayments(paymentData);
        setFilteredPayments(paymentData);
      } catch (error) {
        console.error("Error fetching payments data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch, dashboard.stats]);

  // Filter payments based on search term and status
  useEffect(() => {
    if (!payments || payments.length === 0) return;
    
    let result = [...payments];
    
    // Filter by search term
    if (searchTerm) {
      result = result.filter(payment => 
        payment._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(payment => payment.status === statusFilter);
    }
    
    setFilteredPayments(result);
    setPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, payments]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get payment method display info
  const getPaymentMethod = (payment) => {
    if (payment.method === 'card') {
      return `${payment.card?.brand || 'Card'} **** **** **** ${payment.card?.last4 || ''}`;
    } else if (payment.method) {
      return payment.method;
    }
    return 'Unknown';
  };

  // Handle status change
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  // Handle search term change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Open payment details dialog
  const handleOpenDetails = (payment) => {
    setDetailDialog({ open: true, payment });
  };

  // Close payment details dialog
  const handleCloseDetails = () => {
    setDetailDialog({ open: false, payment: null });
  };

  // Get total count by status
  const getStatusCount = (status) => {
    if (!payments || payments.length === 0) return 0;
    if (status === 'all') return payments.length;
    return payments.filter(payment => payment.status === status).length;
  };

  // Get total amount by status
  const getStatusAmount = (status) => {
    if (!payments || payments.length === 0) return 0;
    if (status === 'all') {
      return payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    }
    return payments
      .filter(payment => payment.status === status)
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
  };

  // Calculate pagination
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);

  return (
    <div>
      <Typography variant="h4" gutterBottom component="div" sx={{ mb: 3 }}>
        Payment Management
      </Typography>

      {/* Payment stats cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Payments</Typography>
              </Box>
              <Typography variant="h4">${getStatusAmount('all').toFixed(2)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {getStatusCount('all')} transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'success.light', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CreditCardIcon sx={{ mr: 1, color: 'success.dark' }} />
                <Typography variant="h6" sx={{ color: 'success.dark' }}>Completed</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'success.dark' }}>
                ${getStatusAmount('completed').toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'success.dark' }}>
                {getStatusCount('completed')} transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'warning.light', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PaymentIcon sx={{ mr: 1, color: 'warning.dark' }} />
                <Typography variant="h6" sx={{ color: 'warning.dark' }}>Pending</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'warning.dark' }}>
                ${getStatusAmount('pending').toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'warning.dark' }}>
                {getStatusCount('pending')} transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'error.light', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DateRangeIcon sx={{ mr: 1, color: 'error.dark' }} />
                <Typography variant="h6" sx={{ color: 'error.dark' }}>Failed/Canceled</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'error.dark' }}>
                ${(getStatusAmount('failed') + getStatusAmount('canceled')).toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'error.dark' }}>
                {getStatusCount('failed') + getStatusCount('canceled')} transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          label="Search Payment"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ width: '40%' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          size="small"
          sx={{ width: '20%' }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="failed">Failed</MenuItem>
          <MenuItem value="canceled">Canceled</MenuItem>
          <MenuItem value="refunded">Refunded</MenuItem>
        </TextField>
      </Box>

      {/* Payments Table */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="payments table">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                <TableCell>Payment ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Order ID</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedPayments.length > 0 ? (
                paginatedPayments.map((payment) => (
                  <TableRow key={payment._id} hover>
                    <TableCell>{payment._id ? payment._id.substring(0, 8) + '...' : 'N/A'}</TableCell>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>${payment.amount ? payment.amount.toFixed(2) : '0.00'}</TableCell>
                    <TableCell>{getPaymentMethod(payment)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={payment.status || 'unknown'} 
                        color={statusColors[payment.status] || statusColors.default} 
                        size="small" 
                        sx={{ textTransform: 'capitalize' }} 
                      />
                    </TableCell>
                    <TableCell>
                      {payment.orderId ? payment.orderId.substring(0, 8) + '...' : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDetails(payment)}
                        color="primary"
                      >
                        <InfoIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">No payment data found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handleChangePage} 
            color="primary" 
          />
        </Box>
      </Paper>

      {/* Payment Detail Dialog */}
      <Dialog
        open={detailDialog.open}
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Payment Details
        </DialogTitle>
        <DialogContent dividers>
          {detailDialog.payment && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Payment ID:</Typography>
                <Typography variant="body1">{detailDialog.payment._id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Status:</Typography>
                <Chip 
                  label={detailDialog.payment.status || 'unknown'} 
                  color={statusColors[detailDialog.payment.status] || statusColors.default} 
                  size="small" 
                  sx={{ textTransform: 'capitalize' }} 
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Amount:</Typography>
                <Typography variant="body1">${detailDialog.payment.amount?.toFixed(2) || '0.00'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Date:</Typography>
                <Typography variant="body1">{formatDate(detailDialog.payment.createdAt)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Payment Method:</Typography>
                <Typography variant="body1">{getPaymentMethod(detailDialog.payment)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Order ID:</Typography>
                <Typography variant="body1">{detailDialog.payment.orderId || 'N/A'}</Typography>
              </Grid>
              {detailDialog.payment.customer && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Customer Name:</Typography>
                    <Typography variant="body1">{detailDialog.payment.customer.name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Customer Email:</Typography>
                    <Typography variant="body1">{detailDialog.payment.customer.email || 'N/A'}</Typography>
                  </Grid>
                </>
              )}
              {detailDialog.payment.description && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Description:</Typography>
                  <Typography variant="body1">{detailDialog.payment.description}</Typography>
                </Grid>
              )}
              {detailDialog.payment.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Notes:</Typography>
                  <Typography variant="body1">{detailDialog.payment.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PaymentsPage; 