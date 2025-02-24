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
} from "@mui/material";

import React, { useEffect, useState } from "react";
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useNavigate } from "react-router-dom";
import { Select } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  confirmOrder,
  deleteOrder,
  deliveredOrder,
  getOrders,
  shipOrder,
  getShippingAddress,
  getUser,
} from "../../../Redux/Admin/Orders/Action";

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLACED':
        return 'warning';
      case 'CONFIRMED':
        return 'info';
      case 'SHIPPED':
        return 'primary';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  useEffect(() => {
    dispatch(getOrders({ jwt }));
  }, [jwt, adminsOrder.delivered, adminsOrder.shipped, adminsOrder.confirmed]);

  const handleUpdateStatusMenuClick = (event, index) => {
    const newAnchorElArray = Array(adminsOrder?.orders?.length).fill(null);
    newAnchorElArray[index] = event.currentTarget;
    setAnchorElArray(newAnchorElArray);
    const currentStatus = adminsOrder?.orders[index]?.orderStatus;
    console.log('Current order status:', currentStatus);
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
  };

  function handlePaginationChange(event, value) {
    console.log("Current page:", value);
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

  const handleDeleteOrder = (orderId) => {
    handleUpdateStatusMenuClose();
    dispatch(deleteOrder(orderId));
  };

  const handleViewOrderDetails = async (order) => {
    try {
      const response = await fetch(`http://localhost:5454/api/orders/${order._id}`, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Order details:", data);
        setSelectedOrder(data);
        setOpenDialog(true);
      } else {
        console.error('Failed to fetch order details:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  const getAvailableStatusUpdates = (currentStatus) => {
    console.log('Getting available updates for status:', currentStatus);
    const statusFlow = {
      'PENDING': [{ label: 'Place Order', action: handleConfirmedOrder }],
      'PLACED': [{ label: 'Confirm Order', action: handleConfirmedOrder }],
      'CONFIRMED': [{ label: 'Ship Order', action: handleShippedOrder }],
      'SHIPPED': [{ label: 'Mark as Delivered', action: handleDeliveredOrder }]
    };
    const updates = statusFlow[currentStatus] || [];
    console.log('Available updates:', updates);
    return updates;
  };

  // Add debug logging to track order data
  useEffect(() => {
    console.log('Current orders:', adminsOrder?.orders);
  }, [adminsOrder?.orders]);

  return (
    <Box>
      <Card className="p-3">
        <CardHeader
          title="Sort"
          sx={{
            pt: 0,
            alignItems: "center",
            "& .MuiCardHeader-action": { mt: 0.6 },
          }}
        />
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">Status</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleChange}
              >
                <MenuItem value={"PLACED"}>PLACED</MenuItem>
                <MenuItem value={"CONFIRMED"}>CONFIRMED</MenuItem>
                <MenuItem value={"DELIVERED"}>DELIVERED</MenuItem>
                <MenuItem value={"CANCELED"}>CANCELED</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">Sort By</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                name="sort"
                value={formData.sort}
                label="Sort By"
                onChange={handleChange}
              >
                <MenuItem value={"Newest"}>Newest</MenuItem>
                <MenuItem value={"Older"}>Older</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>
      <Card className="mt-2">
        <CardHeader
          title="All Orders"
          sx={{
            pt: 2,
            alignItems: "center",
            "& .MuiCardHeader-action": { mt: 0.6 },
          }}
        />
        <TableContainer>
          <Table sx={{ minWidth: 800 }} aria-label="table in dashboard">
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Id</TableCell>
                <TableCell sx={{ textAlign: "center" }}>Status</TableCell>
                <TableCell sx={{ textAlign: "center" }}>Update</TableCell>
                <TableCell sx={{ textAlign: "center" }}>Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {adminsOrder?.orders?.map((item, index) => (
                <TableRow
                  hover
                  key={item._id}
                  sx={{ "&:last-of-type td, &:last-of-type th": { border: 0 } }}
                >
                  <TableCell>
                    <AvatarGroup max={4} sx={{justifyContent: 'start'}}>
                      {item.orderItems.map((orderItem) => (
                        <Avatar key={orderItem._id} alt={orderItem.product?.title} src={orderItem.product?.imageUrl} />
                      ))}
                    </AvatarGroup>
                  </TableCell>

                  <TableCell sx={{ py: (theme) => `${theme.spacing(0.5)} !important` }}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography sx={{ fontWeight: 500, fontSize: "0.875rem !important" }}>
                        {item?.orderItems.map((order, i) => (
                          <span key={order._id}>
                            {order.product?.title}{i < item.orderItems.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </Typography>
                      <Typography variant="caption">
                        {item?.orderItems.map((order, i) => (
                          <span key={order._id} className="opacity-60">
                            {order.product?.brand}{i < item.orderItems.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>Tk. {item?.totalPrice}</TableCell>
                  <TableCell>{item?._id}</TableCell>
                  <TableCell className="text-white">
                    <Chip
                      sx={{
                        color: "white !important",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                      label={item?.orderStatus}
                      size="small"
                      color={getStatusColor(item?.orderStatus)}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }} className="text-white">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleViewOrderDetails(item)}
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.dark'
                          }
                        }}
                      >
                        View
                      </Button>
                      {item.orderStatus !== 'DELIVERED' && item.orderStatus !== 'CANCELLED' && (
                        <>
                          <Button
                            id={`status-button-${item._id}`}
                            aria-controls={anchorElArray[index] ? `status-menu-${item._id}` : undefined}
                            aria-haspopup="true"
                            aria-expanded={Boolean(anchorElArray[index])}
                            onClick={(event) => handleUpdateStatusMenuClick(event, index)}
                            variant="outlined"
                            size="small"
                            sx={{ ml: 1 }}
                          >
                            Update Status ({item.orderStatus})
                          </Button>
                          <Menu
                            id={`status-menu-${item._id}`}
                            anchorEl={anchorElArray[index]}
                            open={Boolean(anchorElArray[index])}
                            onClose={() => handleUpdateStatusMenuClose(index)}
                            MenuListProps={{
                              'aria-labelledby': `status-button-${item._id}`,
                            }}
                          >
                            {getAvailableStatusUpdates(item.orderStatus).map((statusUpdate, idx) => (
                              <MenuItem
                                key={idx}
                                onClick={() => {
                                  console.log('Clicking status update:', statusUpdate.label);
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
                    </div>
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Button
                      onClick={() => handleDeleteOrder(item?._id)}
                      variant="text"
                      color="error"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

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
                    Date: {new Date(selectedOrder.orderDate).toLocaleString()}
                  </Typography>
                </Box>
              </Grid>

              {/* User Information */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                  <Typography variant="h6" gutterBottom>User Information</Typography>
                  <Box sx={{ mb: 2 }}>
                    {selectedOrder.user ? (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Name:</Typography>
                          <Typography>{selectedOrder.user.firstName} {selectedOrder.user.lastName}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Email:</Typography>
                          <Typography>{selectedOrder.user.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Role:</Typography>
                          <Typography>{selectedOrder.user.role}</Typography>
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Loading user details...
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Payment Details */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                  <Typography variant="h6" gutterBottom>Payment Details</Typography>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Total Amount:</Typography>
                      <Typography>Tk. {selectedOrder.totalPrice}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Discount:</Typography>
                      <Typography>Tk. {selectedOrder.discounte}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Final Amount:</Typography>
                      <Typography fontWeight="bold">
                        Tk. {selectedOrder.totalDiscountedPrice}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Payment Status:</Typography>
                      <Chip
                        label={selectedOrder.orderStatus === 'DELIVERED' ? 'PAID' : 'PENDING'}
                        color={selectedOrder.orderStatus === 'DELIVERED' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Shipping Address */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                  <Typography variant="h6" gutterBottom>Shipping Address</Typography>
                  <Box sx={{ mb: 2 }}>
                    {selectedOrder.shippingAddress ? (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Name:</Typography>
                          <Typography>
                            {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Street Address:</Typography>
                          <Typography>{selectedOrder.shippingAddress.streetAddress}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Area:</Typography>
                          <Typography>
                            {selectedOrder.shippingAddress.upazilla}, {selectedOrder.shippingAddress.district}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Division:</Typography>
                          <Typography>{selectedOrder.shippingAddress.division}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Phone:</Typography>
                          <Typography>{selectedOrder.shippingAddress.mobile}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">ZIP Code:</Typography>
                          <Typography>{selectedOrder.shippingAddress.zipCode}</Typography>
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No shipping details available
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Order Details */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                  <Typography variant="h6" gutterBottom>Order Summary</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Total Items:</Typography>
                          <Typography>{selectedOrder.orderItems?.length || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Order Status:</Typography>
                          <Chip 
                            label={selectedOrder.orderStatus} 
                            color={getStatusColor(selectedOrder.orderStatus)}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Subtotal:</Typography>
                          <Typography>Tk. {selectedOrder.totalPrice}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary">Discount:</Typography>
                          <Typography>-Tk. {selectedOrder.discounte}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Total Amount:</Typography>
                          <Typography sx={{ fontWeight: 600 }}>Tk. {selectedOrder.totalDiscountedPrice}</Typography>
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
                          <TableCell>Size Guide</TableCell>
                          <TableCell>Color</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Discounted Price</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.orderItems.map((item) => {
                          const selectedColor = item.product?.colors?.find(c => c.name === item.color) || item.product?.colors[0];
                          const sizeGuide = item.product?.sizeGuide?.[item.size];
                          return (
                            <TableRow key={item._id}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar 
                                    src={selectedColor?.images[0]} 
                                    alt={item.product?.title} 
                                    variant="rounded"
                                    sx={{ width: 60, height: 60 }}
                                  />
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {item.product?.title}
                                    </Typography>
                                    {item.product?.isNewArrival && (
                                      <Chip 
                                        label="New Arrival" 
                                        color="success" 
                                        size="small" 
                                        sx={{ mt: 0.5 }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" display="block">
                                  Category ID: {item.product?.category}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Size: {item.size}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Discount: {item.product?.discountPersent}%
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {sizeGuide && (
                                  <>
                                    <Typography variant="caption" display="block">
                                      Chest: {sizeGuide.chest}&quot;
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                      Length: {sizeGuide.bodyLength}&quot;
                                    </Typography>
                                  </>
                                )}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      bgcolor: selectedColor?.name?.toLowerCase(),
                                      border: '1px solid',
                                      borderColor: 'grey.300'
                                    }}
                                  />
                                  <Typography variant="caption">{selectedColor?.name}</Typography>
                                </Box>
                                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                  Stock: {selectedColor?.quantity}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">{item.quantity}</TableCell>
                              <TableCell align="right">Tk. {item.price}</TableCell>
                              <TableCell align="right">Tk. {item.discountedPrice}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* Product Description */}
              {selectedOrder.orderItems.map((item) => (
                <Grid item xs={12} key={item._id}>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                    <Typography variant="h6" gutterBottom>Product Description</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                      {item.product?.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}

              {/* Order Status */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Order Status</Typography>
                    <Chip 
                      label={selectedOrder?.orderStatus}
                      color={getStatusColor(selectedOrder?.orderStatus)}
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Current Status: {selectedOrder?.orderStatus}
                    </Typography>
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
    </Box>
  );
};

export default OrdersTable;
