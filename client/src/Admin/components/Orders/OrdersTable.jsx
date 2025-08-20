import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getAllOrders } from '../../actions/orderActions';
import { TableCell, Typography, Grid, Paper, Box, Chip } from '@mui/material';
import { API_URL } from '../../../config/api';

const OrdersTable = () => {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [shippingAddresses, setShippingAddresses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(getAllOrders())
      .then((response) => {
        setOrders(response.payload);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching orders:', error);
        setLoading(false);
      });
  }, [dispatch]);

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setShippingAddresses(prev => ({
        ...prev,
        [orderId]: data.shippingAddress
      }));
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  useEffect(() => {
    orders.forEach(order => {
      fetchOrderDetails(order._id);
    });
  }, [orders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      // ... rest of the code
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <TableCell>
      {shippingAddresses[order._id] ? (
        <div>
          <Typography variant="body2">{`${shippingAddresses[order._id].firstName} ${shippingAddresses[order._id].lastName}`}</Typography>
          <Typography variant="body2">{shippingAddresses[order._id].streetAddress}</Typography>
          <Typography variant="body2">{`${shippingAddresses[order._id].upazilla}, ${shippingAddresses[order._id].district}`}</Typography>
          <Typography variant="body2">{shippingAddresses[order._id].mobile}</Typography>
        </div>
      ) : (
        'Loading...'
      )}
    </TableCell>
  );
};

export default OrdersTable; 
