import { Box, Button, Grid, Typography, Paper, Divider, Chip, Card, CardContent } from "@mui/material";
import React, { useEffect, useState } from "react";
import OrderTraker from "./OrderTraker";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AddressCard from "../adreess/AdreessCard";
import { useDispatch, useSelector } from "react-redux";
import { getOrderById, getGuestOrderById } from "../../../Redux/Customers/Order/Action";
import BackdropComponent from "../BackDrop/Backdrop";
import OrderItem from "./OrderItem";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const OrderDetails = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const jwt = localStorage.getItem("jwt");
  const { orderId } = useParams();
  const { order } = useSelector((store) => store);
  const navigate = useNavigate();
  const [orderNotFound, setOrderNotFound] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState(null);

  const primaryColor = "#00503a";

  // Check if this is a guest order tracking URL
  const isGuestOrderTrackingURL = location.pathname.includes('/order/guest/track/');
  const shouldUseGuestTracking = isGuestOrderTrackingURL || !jwt;

  console.log('[OrderDetails] Component mounted/updated:', {
    orderId,
    jwt: !!jwt,
    isGuestOrderTrackingURL,
    shouldUseGuestTracking,
    pathname: location.pathname,
    retryCount,
    orderState: {
      loading: order.loading,
      hasOrder: !!order.order,
      error: order.error
    }
  });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        console.log('[OrderDetails] Starting to fetch order:', {
          orderId,
          shouldUseGuestTracking,
          jwt: !!jwt,
          retryAttempt: retryCount
        });
        
        setOrderNotFound(false);
        setLastError(null);
        
        if (shouldUseGuestTracking) {
          console.log('[OrderDetails] Using guest order tracking');
          await dispatch(getGuestOrderById(orderId));
        } else {
          console.log('[OrderDetails] Using authenticated order tracking');
          await dispatch(getOrderById(orderId));
        }
        
        console.log('[OrderDetails] Order fetch completed successfully');
      } catch (error) {
        console.error("[OrderDetails] Error fetching order:", error);
        setLastError(error);
        
        // Enhanced error checking
        const isNotFound = error?.response?.status === 404 || 
                          error?.message?.includes('not found') ||
                          error?.message?.includes('Order not found') ||
                          error?.response?.status === 500;
        
        // If it's a network error and we haven't retried too many times, try again
        if (!isNotFound && retryCount < 2 && (
          error?.response?.status === 0 || 
          error?.message?.includes('Network') ||
          error?.code === 'NETWORK_ERROR'
        )) {
          console.log('[OrderDetails] Network error, will retry in 2 seconds...');
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
          return;
        }
        
        console.log('[OrderDetails] Setting orderNotFound to:', isNotFound);
        setOrderNotFound(isNotFound);
      }
    };

    if (orderId) {
      fetchOrder();
    } else {
      console.error('[OrderDetails] No order ID provided');
      setOrderNotFound(true);
    }
  }, [dispatch, orderId, shouldUseGuestTracking, retryCount]);

  // Also check if order state indicates an error
  useEffect(() => {
    console.log('[OrderDetails] Order state changed:', {
      loading: order.loading,
      error: order.error,
      hasOrder: !!order.order
    });
    
    if (order.error && !order.loading) {
      const isNotFound = order.error.includes('not found') || 
                        order.error.includes('Order not found');
      console.log('[OrderDetails] Setting orderNotFound from state error:', isNotFound);
      setOrderNotFound(isNotFound);
    }
  }, [order.error, order.loading, order.order]);

  // Add a safety check - if we have no loading, no error, but also no order after 3 seconds, show not found
  useEffect(() => {
    if (!order.loading && !order.error && !order.order && !orderNotFound) {
      const timeout = setTimeout(() => {
        console.log('[OrderDetails] Timeout - no order data received, showing not found');
        setOrderNotFound(true);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [order.loading, order.error, order.order, orderNotFound]);

  const getActiveStep = (status) => {
    switch (status) {
      case "PLACED":
        return 1;
      case "CONFIRMED":
        return 2;
      case "SHIPPED":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return 0;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return '#00503a';
      case 'PLACED': return '#00503a';
      case 'SHIPPED': return '#00503a';
      case 'DELIVERED': return '#4caf50';
      case 'CANCELLED': return '#f44336';
      default: return '#757575';
    }
  };

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

  // Enhanced rendering conditions with debugging
  const shouldShowLoading = order.loading;
  const shouldShowNotFound = orderNotFound && !order.loading;
  const shouldShowOrder = !order.loading && !orderNotFound && (order.order || false);
  
  console.log('[OrderDetails] Render conditions:', {
    shouldShowLoading,
    shouldShowNotFound,
    shouldShowOrder,
    orderData: order.order ? 'present' : 'missing'
  });

  // Debug component for development
  const DebugInfo = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <Card sx={{ mb: 2, bgcolor: '#f5f5f5', border: '1px solid #ccc' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Debug Information</Typography>
          <Typography variant="body2">Order ID: {orderId}</Typography>
          <Typography variant="body2">JWT: {jwt ? 'Present' : 'Not Present'}</Typography>
          <Typography variant="body2">Is Guest URL: {isGuestOrderTrackingURL ? 'Yes' : 'No'}</Typography>
          <Typography variant="body2">Should Use Guest Tracking: {shouldUseGuestTracking ? 'Yes' : 'No'}</Typography>
          <Typography variant="body2">Loading: {order.loading ? 'Yes' : 'No'}</Typography>
          <Typography variant="body2">Has Order Data: {order.order ? 'Yes' : 'No'}</Typography>
          <Typography variant="body2">Order Error: {order.error || 'None'}</Typography>
          <Typography variant="body2">Order Not Found: {orderNotFound ? 'Yes' : 'No'}</Typography>
          <Typography variant="body2">Retry Count: {retryCount}</Typography>
          <Typography variant="body2">Last Error: {lastError?.message || 'None'}</Typography>
          <Typography variant="body2">Current Path: {location.pathname}</Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {shouldShowLoading && (
        <BackdropComponent open={true} />
      )}
      
      <DebugInfo />
      
      {shouldShowNotFound && (
        <Box sx={{ 
          p: { xs: 2, md: 4 }, 
          maxWidth: 800, 
          mx: 'auto', 
          textAlign: 'center',
          bgcolor: '#f9fafb',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            sx={{ 
              mb: 3, 
              color: primaryColor, 
              '&:hover': { bgcolor: '#00503a10' },
              alignSelf: 'flex-start'
            }}
            onClick={() => jwt ? navigate('/account/order') : navigate('/')}
          >
            {jwt ? 'Back to orders' : 'Back to home'}
          </Button>
          
          <Card sx={{ p: 4, maxWidth: 500, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom color="error">
              Order Not Found
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We couldn&apos;t find an order with ID: <strong>{orderId}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This could be because:
            </Typography>
            <Box component="ul" sx={{ textAlign: 'left', color: 'text.secondary', mt: 2 }}>
              <li>The order ID is incorrect</li>
              <li>The order was placed with a different account</li>
              <li>The order is still being processed</li>
            </Box>
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/')}
                sx={{
                  bgcolor: primaryColor,
                  '&:hover': { bgcolor: '#003d2d' }
                }}
              >
                Continue Shopping
              </Button>
              {jwt && (
                <Button
                  variant="outlined"
                  onClick={() => navigate('/account/order')}
                  sx={{
                    borderColor: primaryColor,
                    color: primaryColor,
                    '&:hover': { bgcolor: '#00503a10' }
                  }}
                >
                  View All Orders
                </Button>
              )}
            </Box>
          </Card>
        </Box>
      )}

      {shouldShowOrder && (
        <Box sx={{ 
          p: { xs: 2, md: 4 }, 
          maxWidth: 1200, 
          mx: 'auto', 
          bgcolor: '#f9fafb'
        }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            sx={{ 
              mb: 3, 
              color: primaryColor, 
              '&:hover': { bgcolor: '#00503a10' } 
            }}
            onClick={() => jwt ? navigate('/account/order') : navigate('/')}
          >
            {jwt ? 'Back to orders' : 'Back to home'}
          </Button>
          
          <Card sx={{ mb: 4, overflow: 'visible', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <Box sx={{ 
              bgcolor: primaryColor, 
              py: 2, 
              px: 3, 
              color: 'white',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" fontWeight={600}>
                Order #{orderId.substring(orderId.length - 8).toUpperCase()}
              </Typography>
              <Chip 
                label={order.order?.orderStatus} 
                size="small"
                sx={{ 
                  bgcolor: 'white', 
                  color: getStatusColor(order.order?.orderStatus),
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
            </Box>
            
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography 
                    variant="subtitle2" 
                    color="text.secondary"
                    sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                  >
                    <ReceiptIcon sx={{ mr: 1, fontSize: '1rem', color: primaryColor }} />
                    ORDER PLACED
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatDate(order.order?.createdAt)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography 
                    variant="subtitle2" 
                    color="text.secondary"
                    sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                  >
                    <PaymentIcon sx={{ mr: 1, fontSize: '1rem', color: primaryColor }} />
                    PAYMENT METHOD
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {getPaymentMethodLabel(order.order?.paymentOption)}
                  </Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 4 }}>
                <OrderTraker activeStep={getActiveStep(order.order?.orderStatus)} />
              </Box>
              
              {order.order?.orderStatus === "DELIVERED" && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    sx={{ 
                      textTransform: "none", 
                      fontWeight: 600,
                      borderRadius: '8px',
                      px: 3
                    }}
                  >
                    Return
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Card sx={{ mb: 4, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: primaryColor, 
                      fontWeight: 600,
                      pb: 2,
                      borderBottom: '1px solid #e0e0e0',
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <ReceiptIcon sx={{ mr: 1 }} />
                    Items in Your Order
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    {order.order?.orderItems.map((item, index) => (
                      <React.Fragment key={item._id}>
                        <OrderItem item={item} />
                        {index < order.order.orderItems.length - 1 && (
                          <Divider sx={{ my: 1 }} />
                        )}
                      </React.Fragment>
                    ))}
                  </Box>
                </CardContent>
              </Card>
              
              {/* Transaction Info */}
              {order.paymentDetails?.transactionId && (
                <Card sx={{ mb: 4, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: primaryColor, 
                        fontWeight: 600,
                        pb: 2,
                        borderBottom: '1px solid #e0e0e0',
                        mb: 3,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <PaymentIcon sx={{ mr: 1 }} />
                      Payment Details
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Transaction ID
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                          {order.paymentDetails.transactionId.includes("-")
                            ? order.paymentDetails.transactionId
                            : `${order.paymentDetails.transactionId.substring(0, 12)}...`}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Payment Status
                        </Typography>
                        <Chip 
                          label={order.paymentDetails.status || 'COMPLETED'} 
                          size="small"
                          sx={{ 
                            mt: 1,
                            bgcolor: '#4caf5020', 
                            color: '#4caf50',
                            fontWeight: 600
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 4, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', position: 'sticky', top: 20 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: primaryColor, 
                      fontWeight: 600,
                      pb: 2,
                      borderBottom: '1px solid #e0e0e0',
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <LocationOnIcon sx={{ mr: 1 }} />
                    Delivery Address
                  </Typography>
                  
                  <AddressCard address={order.order?.shippingAddress} />
                  
                  {order.order?.orderStatus === 'SHIPPED' && (
                    <Box sx={{ 
                      mt: 3, 
                      p: 2, 
                      bgcolor: '#00503a10', 
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <LocalShippingIcon sx={{ color: primaryColor, mr: 1 }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: primaryColor, fontWeight: 600 }}>
                          Estimated Delivery
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(new Date(new Date(order.order.createdAt).getTime() + (5 * 24 * 60 * 60 * 1000)))}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
              
              <Card sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: primaryColor, 
                      fontWeight: 600,
                      pb: 2,
                      borderBottom: '1px solid #e0e0e0',
                      mb: 3
                    }}
                  >
                    Order Summary
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Items Total:</Typography>
                    <Typography variant="body2">Tk. {order.order?.totalPrice || 0}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Discount:</Typography>
                    <Typography variant="body2" color="#4caf50">
                      - Tk. {(order.order?.totalPrice || 0) - (order.order?.totalDiscountedPrice || 0)}
                    </Typography>
                  </Box>
                  
                  {order.order?.promoCodeDiscount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Promo Discount:</Typography>
                      <Typography variant="body2" color="#4caf50">
                        - Tk. {order.order?.promoCodeDiscount}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Delivery:</Typography>
                    <Typography variant="body2">
                      {order.order?.deliveryOption === 'free' ? 'Free' : `Tk. ${order.order?.shippingCharges || 0}`}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight={600}>Total:</Typography>
                    <Typography variant="subtitle1" fontWeight={600} color={primaryColor}>
                      Tk. {order.order?.totalDiscountedPrice || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </>
  );
};

export default OrderDetails;
