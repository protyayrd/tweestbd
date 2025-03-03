import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper, Divider, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderById } from '../../../Redux/Customers/Order/Action';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { order } = useSelector(state => state);
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('order_id');
  const redirectTo = searchParams.get('redirect');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  
  // Payment details
  const [paymentDetails, setPaymentDetails] = useState({
    paymentMethod: 'SSLCommerz',
    transactionId: searchParams.get('tran_id') || 'N/A',
    paymentPhoneNumber: searchParams.get('cus_phone') || 'N/A'
  });

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (orderId) {
        try {
          setLoading(true);
          const orderData = await dispatch(getOrderById(orderId));
          
          // If order has payment details, update the payment information
          if (orderData?.paymentDetails) {
            setPaymentDetails(prev => ({
              ...prev,
              paymentMethod: orderData.paymentDetails.method || 'SSLCommerz',
              transactionId: orderData.paymentDetails.transactionId || prev.transactionId,
              paymentPhoneNumber: orderData.paymentDetails.paymentPhoneNumber || prev.paymentPhoneNumber
            }));
          }
          
          setLoading(false);
        } catch (error) {
          console.error("Error fetching order details:", error);
          setError("Unable to fetch order details. Please check your order history.");
          setLoading(false);
        }
      } else {
        setError("Order ID not found. Please check your order history.");
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, dispatch]);

  // Handle automatic redirect if redirectTo parameter is present
  useEffect(() => {
    if (redirectTo === 'orders' && !loading && !error) {
      setRedirecting(true);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/account/order');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [redirectTo, loading, error, navigate]);

  const handleViewOrder = () => {
    navigate(`/account/order/${orderId}`);
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} sx={{ color: 'black', mb: 3 }} />
        <Typography variant="h6">Loading order details...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Payment Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Thank you for your purchase. Your payment has been processed successfully.
          </Typography>
          {orderId && (
            <Typography variant="body2" color="text.secondary">
              Order ID: {orderId}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: 'center' }}>
          {error ? (
            <Typography variant="body1" color="error" paragraph>
              {error}
            </Typography>
          ) : (
            <>
              <Typography variant="body1" paragraph>
                We&apos;ve sent a confirmation email with your order details.
                Your order will be processed shortly.
              </Typography>
              
              {/* Payment Details Section */}
              <Box sx={{ my: 3, p: 2, bgcolor: 'rgba(76, 175, 80, 0.08)', borderRadius: 1, border: '1px solid rgba(76, 175, 80, 0.2)' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Payment Details
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Payment Method:</Typography>
                  <Typography variant="body2" fontWeight="medium">{paymentDetails.paymentMethod}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Transaction ID:</Typography>
                  <Typography variant="body2" fontWeight="medium">{paymentDetails.transactionId}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Payment Phone:</Typography>
                  <Typography variant="body2" fontWeight="medium">{paymentDetails.paymentPhoneNumber}</Typography>
                </Box>
              </Box>
              
              {/* Order Summary Section */}
              {order.order && (
                <Box sx={{ my: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Order Summary
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Total Items:</Typography>
                    <Typography variant="body2">{order.order.totalItem}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Order Total:</Typography>
                    <Typography variant="body2">Tk. {order.order.totalDiscountedPrice}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Payment Status:</Typography>
                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>PAID</Typography>
                  </Box>
                </Box>
              )}
              
              {/* Redirect message */}
              {redirecting && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', color: 'info.contrastText', borderRadius: 1 }}>
                  <Typography variant="body2">
                    Redirecting to your orders in {countdown} seconds...
                  </Typography>
                </Box>
              )}
            </>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleViewOrder}
              sx={{
                bgcolor: 'black',
                '&:hover': { bgcolor: 'grey.900' },
                px: 3,
                py: 1
              }}
            >
              View Order
            </Button>
            <Button
              variant="outlined"
              onClick={handleContinueShopping}
              sx={{
                color: 'black',
                borderColor: 'black',
                '&:hover': { borderColor: 'grey.900', bgcolor: 'grey.100' },
                px: 3,
                py: 1
              }}
            >
              Continue Shopping
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default PaymentSuccess; 