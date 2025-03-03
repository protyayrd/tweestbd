import { Box, Grid, Typography, CircularProgress } from "@mui/material";
import React, { useEffect, useState } from "react";
import OrderCard from "./OrderCard";
import { useDispatch, useSelector } from "react-redux";
import { getOrderHistory } from "../../../Redux/Customers/Order/Action";
import BackdropComponent from "../BackDrop/Backdrop";

// Update order status values to match the server-side values
const orderStatus = [
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const Order = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const { order } = useSelector(store => store);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  useEffect(() => {
    if (jwt) {
      dispatch(getOrderHistory({ jwt }));
    }
  }, [jwt, dispatch]);

  useEffect(() => {
    if (order.orders && order.orders.length > 0) {
      if (selectedStatuses.length === 0) {
        setFilteredOrders(order.orders);
      } else {
        const filtered = order.orders.filter(order => 
          selectedStatuses.includes(order.orderStatus)
        );
        setFilteredOrders(filtered);
      }
    } else {
      setFilteredOrders([]);
    }
  }, [order.orders, selectedStatuses]);

  const handleStatusChange = (status) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  console.log("users orders ", order.orders);

  return (
    <Box className="px-10 py-4">
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        My Orders
      </Typography>
      
      <Grid container spacing={3} sx={{ justifyContent: "space-between" }}>
        <Grid item xs={12} md={2.5} className="">
          <div className="h-auto shadow-lg bg-white border p-5 sticky top-5">
            <h1 className="font-bold text-lg">Filters</h1>
            <div className="space-y-4 mt-10">
              <h1 className="font-semibold">ORDER STATUS</h1>
              {orderStatus.map((option) => (
                <div key={option.value} className="flex items-center">
                  <input
                    id={option.value}
                    value={option.value}
                    type="checkbox"
                    checked={selectedStatuses.includes(option.value)}
                    onChange={() => handleStatusChange(option.value)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor={option.value}
                    className="ml-3 text-sm text-gray-600"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </Grid>
        
        <Grid item xs={12} md={9}>
          {order.loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <CircularProgress />
            </Box>
          ) : order.error ? (
            <Box p={3} bgcolor="error.light" borderRadius={1}>
              <Typography color="error">{order.error}</Typography>
            </Box>
          ) : filteredOrders && filteredOrders.length > 0 ? (
            <Box className="space-y-5">
              {filteredOrders.map((order) => (
                <Box key={order._id}>
                  {order.orderItems && order.orderItems.length > 0 ? (
                    order.orderItems.map((item) => (
                      <OrderCard key={`${order._id}-${item._id}`} item={item} order={order} />
                    ))
                  ) : (
                    <Box p={3} bgcolor="info.light" borderRadius={1}>
                      <Typography>No items in this order</Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Box p={5} textAlign="center" bgcolor="background.paper" borderRadius={2} boxShadow={1}>
              <Typography variant="h6" gutterBottom>No Orders Found</Typography>
              <Typography color="textSecondary">
                You haven&apos;t placed any orders yet. Start shopping to see your orders here.
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      <BackdropComponent open={order.loading} />
    </Box>
  );
};

export default Order;
