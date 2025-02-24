import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Grid,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { getAllBulkOrders, updateBulkOrderStatus, deleteBulkOrder } from '../../../Redux/Admin/Order/Action';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';

const BulkOrderList = () => {
  const dispatch = useDispatch();
  const { bulkOrders, loading } = useSelector((state) => state.order);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    dispatch(getAllBulkOrders(filters));
  }, [dispatch, filters]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await dispatch(updateBulkOrderStatus(orderId, newStatus));
      toast.success('Order status updated successfully');
      dispatch(getAllBulkOrders(filters));
    } catch (error) {
      toast.error(error.message || 'Error updating order status');
    }
  };

  const handleDelete = async (orderId) => {
    try {
      await dispatch(deleteBulkOrder(orderId));
      toast.success('Order deleted successfully');
      dispatch(getAllBulkOrders(filters));
    } catch (error) {
      toast.error(error.message || 'Error deleting order');
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const OrderDetailsModal = ({ order }) => (
    <Box component={Paper} p={3} mb={3}>
      <Typography variant="h6" gutterBottom>
        Order Details
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Order ID: {order._id}</Typography>
          <Typography>
            Order Date: {format(new Date(order.orderDate), 'PPP')}
          </Typography>
          <Typography>Status: {order.orderStatus}</Typography>
          <Typography>Total Items: {order.totalItems}</Typography>
          <Typography>Total Price: ₹{order.totalPrice}</Typography>
          <Typography>
            Discounted Price: ₹{order.totalDiscountedPrice}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1">Shipping Address:</Typography>
          <Typography>
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          </Typography>
          <Typography>{order.shippingAddress.streetAddress}</Typography>
          <Typography>
            {order.shippingAddress.upazilla}, {order.shippingAddress.district}
          </Typography>
          <Typography>
            {order.shippingAddress.division} - {order.shippingAddress.zipCode}
          </Typography>
          <Typography>Mobile: {order.shippingAddress.mobile}</Typography>
        </Grid>
      </Grid>

      <Typography variant="h6" mt={3} mb={2}>
        Order Items
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.orderItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.product.title}</TableCell>
                <TableCell>{item.size}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>₹{item.price}</TableCell>
                <TableCell>₹{item.price * item.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        variant="contained"
        onClick={() => setShowDetails(false)}
        sx={{ mt: 3 }}
      >
        Close
      </Button>
    </Box>
  );

  return (
    <Box>
      {showDetails && selectedOrder ? (
        <OrderDetailsModal order={selectedOrder} />
      ) : (
        <>
          <Box mb={3}>
            <Typography variant="h5" gutterBottom>
              Bulk Orders
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <Select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    displayEmpty
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="PLACED">Placed</MenuItem>
                    <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                    <MenuItem value="PROCESSING">Processing</MenuItem>
                    <MenuItem value="SHIPPED">Shipped</MenuItem>
                    <MenuItem value="DELIVERED">Delivered</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  type="date"
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  type="date"
                  label="End Date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Total Items</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Loading...</TableCell>
                  </TableRow>
                ) : bulkOrders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No orders found</TableCell>
                  </TableRow>
                ) : (
                  bulkOrders?.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>{order._id}</TableCell>
                      <TableCell>
                        {format(new Date(order.orderDate), 'PP')}
                      </TableCell>
                      <TableCell>
                        {order.user.firstName} {order.user.lastName}
                      </TableCell>
                      <TableCell>{order.totalItems}</TableCell>
                      <TableCell>₹{order.totalDiscountedPrice}</TableCell>
                      <TableCell>
                        <FormControl>
                          <Select
                            value={order.orderStatus}
                            onChange={(e) =>
                              handleStatusChange(order._id, e.target.value)
                            }
                          >
                            <MenuItem value="PLACED">Placed</MenuItem>
                            <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                            <MenuItem value="PROCESSING">Processing</MenuItem>
                            <MenuItem value="SHIPPED">Shipped</MenuItem>
                            <MenuItem value="DELIVERED">Delivered</MenuItem>
                            <MenuItem value="CANCELLED">Cancelled</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleViewDetails(order)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(order._id)}
                          color="error"
                          disabled={
                            order.orderStatus !== 'PLACED' &&
                            order.orderStatus !== 'CANCELLED'
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default BulkOrderList; 