import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper, Divider, CircularProgress, Grid, Stack, Alert, Snackbar } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderById } from '../../../Redux/Customers/Order/Action';
import { trackPurchase } from '../../../utils/gtmEvents';
import { sendSMSToShippingAddress } from '../../../services/smsService';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { order } = useSelector(state => state);
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('order_id');
  const paymentType = searchParams.get('payment_type') || 'cod'; // 'cod' or 'outlet'
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  
  // SMS states
  const [smsSent, setSmsSent] = useState(false);
  const [smsError, setSmsError] = useState('');
  
  // Colors
  const colors = {
    primary: '#00503a',
    secondary: '#69af5a',
    light: '#ffffff',
    text: '#00503a',
    lightText: '#555555',
    border: '#c0e6c0',
    white: '#ffffff'
  };

  useEffect(() => {
    // Check if this is a guest checkout
    const isGuest = window.location.search.includes('guest=true');
    console.log(`[OrderConfirmation] Is guest checkout: ${isGuest}`);
    setIsGuestCheckout(isGuest);

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        if (orderId) {
          console.log(`[OrderConfirmation] Fetching order details for order: ${orderId}`);
          const orderData = await dispatch(getOrderById(orderId));
          console.log(`[OrderConfirmation] Order data received:`, orderData);
          
          if (orderData) {
            // Order data was successfully fetched
            console.log('[OrderConfirmation] Order details fetched successfully');
            
            // Track Purchase event for Meta Pixel
            try {
              trackPurchase(orderData);
              console.log('[OrderConfirmation] Purchase event tracked');
            } catch (trackError) {
              console.error('[OrderConfirmation] Error tracking purchase:', trackError);
            }
          } else {
            console.error('[OrderConfirmation] No order data returned');
            setError("Could not find your order. Please check your order history.");
          }
        } else {
          console.error('[OrderConfirmation] No order ID provided');
          setError("Order ID not found. Please check your order history.");
        }
      } catch (error) {
        console.error("[OrderConfirmation] Error fetching order details:", error);
        
        // Check if this is an authentication error for guest checkout
        if ((error.message?.includes('Authentication required') || 
             error.response?.status === 401 ||
             error.response?.data?.isGuestCheckout === true ||
             error.response?.data?.isGuestOrderDetails === true) && 
            isGuest) {
          console.log('[OrderConfirmation] Authentication error in guest checkout, showing fallback view');
          setIsGuestCheckout(true);
          setError(null);
        } else {
          console.error('[OrderConfirmation] Error fetching order details:', error);
          setError("Error fetching order details. Please check your order history.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [dispatch, orderId]);

  useEffect(() => {
    let timer;
    if (!loading && !error && !isGuestCheckout) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setRedirecting(true);
            navigate('/account/order');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading, error, navigate, isGuestCheckout]);

  // Auto-send SMS when order is confirmed
  useEffect(() => {
    if (!loading && !error && order.order && orderId && !smsSent) {
      // Send SMS automatically when order is loaded
      sendOrderConfirmationSMS();
    }
  }, [loading, error, order.order, orderId, smsSent]);

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleViewOrder = () => {
    if (isGuestCheckout) {
      navigate('/');
    } else {
      navigate('/account/order');
    }
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  const sendOrderConfirmationSMS = async () => {
    if (smsSent || !order.order || !orderId) return;
    
    try {
      // Create order confirmation message with formatted order ID
      const formattedOrderId = order.order?.formattedOrderId || order.order?._id || orderId;
      const customerName = order.order?.shippingAddress?.firstName || 'Valued Customer';
      
      const confirmationMessage = `Your order #${formattedOrderId} has been confirmed! ${paymentType === 'cod' ? 'Cash on Delivery - Pay when delivered.' : 'Payment recieved online'} We'll notify you with shipping updates. Thank you for shopping with TWEEST!`;
      
      console.log('Sending SMS to shipping address...');
      await sendSMSToShippingAddress(orderId, confirmationMessage);
      setSmsSent(true);
      console.log('SMS sent successfully');
    } catch (error) {
      console.error('Error sending SMS:', error);
      setSmsError(error.response?.data?.message || 'Failed to send SMS');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress sx={{ color: colors.primary }} />
        <Typography variant="h6" sx={{ mt: 2, color: colors.primary }}>
          Processing your order...
        </Typography>
      </Container>
    );
  }

  // Guest checkout fallback view when we can't fetch order details
  if (isGuestCheckout && (!order.order || error)) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 3, md: 5 }, 
            borderRadius: 2,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <CheckCircleIcon 
              sx={{ 
                fontSize: 80, 
                color: colors.secondary,
                mb: 2
              }} 
            />
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                color: colors.primary
              }}
            >
              Order Confirmed!
            </Typography>
            <Typography 
              variant="subtitle1"
              sx={{ 
                color: colors.lightText,
                mb: 2
              }}
            >
              Your order has been successfully placed
            </Typography>
            
            <Box 
              sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                bgcolor: 'rgba(105, 175, 90, 0.1)',
                borderRadius: 2,
                px: 3,
                py: 1,
                mt: 1
              }}
            >
              {paymentType === 'cod' ? (
                <LocalShippingIcon sx={{ mr: 1, color: colors.primary }} />
              ) : (
                <StorefrontIcon sx={{ mr: 1, color: colors.primary }} />
              )}
              <Typography 
                variant="body1"
                sx={{ 
                  fontWeight: 600,
                  color: colors.primary
                }}
              >
                {paymentType === 'cod' 
                  ? 'Cash on Delivery' 
                  : 'Outlet Pickup'}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Thank you for your order! Your order ID is: <strong>{orderId}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              We&apos;ve received your order and will process it shortly.
              {paymentType === 'cod' ? ' You will pay when your order is delivered.' : ' Please visit our outlet to collect and pay for your order.'}
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mt: 4 }}
          >
            <Button 
              variant="contained" 
              onClick={handleContinueShopping}
              sx={{ 
                bgcolor: colors.primary,
                '&:hover': { bgcolor: colors.secondary }
              }}
            >
              Continue Shopping
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleViewOrder}
            sx={{ 
              mt: 3, 
              bgcolor: colors.primary,
              '&:hover': { bgcolor: colors.secondary }
            }}
          >
            View My Orders
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleContinueShopping}
            sx={{ 
              mt: 3, 
              ml: 2,
              color: colors.primary,
              borderColor: colors.primary,
              '&:hover': { 
                borderColor: colors.secondary,
                color: colors.secondary 
              }
            }}
          >
            Continue Shopping
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 3, md: 5 }, 
          borderRadius: 2,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CheckCircleIcon 
            sx={{ 
              fontSize: 80, 
              color: colors.secondary,
              mb: 2
            }} 
          />
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              color: colors.primary
            }}
          >
            Order Confirmed!
          </Typography>
          <Typography 
            variant="subtitle1"
            sx={{ 
              color: colors.lightText,
              mb: 2
            }}
          >
            Your order has been successfully placed
          </Typography>
          
          <Box 
            sx={{ 
              display: 'inline-flex',
              alignItems: 'center',
              bgcolor: 'rgba(105, 175, 90, 0.1)',
              borderRadius: 2,
              px: 3,
              py: 1,
              mt: 1
            }}
          >
            {paymentType === 'cod' ? (
              <LocalShippingIcon sx={{ mr: 1, color: colors.primary }} />
            ) : (
              <StorefrontIcon sx={{ mr: 1, color: colors.primary }} />
            )}
            <Typography 
              variant="body1"
              sx={{ 
                fontWeight: 600,
                color: colors.primary
              }}
            >
              {paymentType === 'cod' 
                ? 'Cash on Delivery' 
                : 'Outlet Pickup'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                color: colors.primary,
                mb: 2
              }}
            >
              Order Details
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Order ID
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {order.order?.formattedId || `Order #${orderId?.substring(0, 8)}`}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Order Date
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {order.order?.createdAt ? formatDate(order.order.createdAt) : 'Processing'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Payment Method
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {paymentType === 'cod' ? 'Cash on Delivery' : 'Pay at Outlet'}
              </Typography>
            </Box>
            
            {!isGuestCheckout && order.order?.status && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Order Status
                </Typography>
                <Typography 
                  variant="body1" 
                  fontWeight={500}
                  sx={{
                    textTransform: 'capitalize',
                    color: order.order.status === 'CONFIRMED' ? colors.secondary : 
                           order.order.status === 'PLACED' ? colors.primary :
                           order.order.status === 'DELIVERED' ? colors.secondary :
                           order.order.status === 'CANCELLED' ? 'error.main' : 'inherit'
                  }}
                >
                  {order.order.status.toLowerCase()}
                </Typography>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                color: colors.primary,
                mb: 2
              }}
            >
              {paymentType === 'cod' ? 'Delivery Information' : 'Pickup Information'}
            </Typography>
            
            {paymentType === 'cod' && order.order?.shippingAddress && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Delivery Address
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {order.order.shippingAddress.firstName} {order.order.shippingAddress.lastName}
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {order.order.shippingAddress.streetAddress || order.order.shippingAddress.street}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.order.shippingAddress.area ? `${order.order.shippingAddress.area}, ` : ''}
                    {order.order.shippingAddress.zone ? `${order.order.shippingAddress.zone}, ` : ''}
                    {order.order.shippingAddress.city}
                    {order.order.shippingAddress.zipCode ? `, ${order.order.shippingAddress.zipCode}` : ''}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Contact
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {order.order.shippingAddress.phoneNumber || order.order.shippingAddress.phone || order.order.shippingAddress.mobile || 'Not provided'}
                  </Typography>
                  {order.order.shippingAddress.email && (
                    <Typography variant="body2" color="text.secondary">
                      {order.order.shippingAddress.email}
                    </Typography>
                  )}
                </Box>
              </>
            )}
            
            {paymentType !== 'cod' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Pickup Location
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  Tweest Outlet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please bring your order ID when collecting your order
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Estimated {paymentType === 'cod' ? 'Delivery' : 'Ready for Pickup'}
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                Within 3-5 business days
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Box>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              color: colors.primary,
              mb: 2
            }}
          >
            Order Summary
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <Typography variant="body2" color="text.secondary">
                Subtotal
              </Typography>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'right' }}>
              <Typography variant="body1" fontWeight={500}>
                ৳{order.order?.totalPrice || 0}
              </Typography>
            </Grid>
            
            {order.order?.discount > 0 && (
              <>
                <Grid item xs={8}>
                  <Typography variant="body2" color="text.secondary">
                    Discount
                  </Typography>
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'right' }}>
                  <Typography variant="body1" fontWeight={500} color="error">
                    -৳{order.order.discount}
                  </Typography>
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            
            <Grid item xs={8}>
              <Typography variant="body1" fontWeight={600}>
                Total
              </Typography>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'right' }}>
              <Typography variant="body1" fontWeight={600}>
                ৳{order.order?.totalDiscountedPrice || 0}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ textAlign: 'center' }}>
          {!isGuestCheckout && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              You will be redirected to your orders in {countdown} seconds...
            </Typography>
          )}
          
          <Button 
            variant="contained" 
            onClick={handleViewOrder}
            sx={{ 
              mr: 2,
              bgcolor: colors.primary,
              '&:hover': { bgcolor: colors.secondary }
            }}
          >
            {isGuestCheckout ? 'Continue Shopping' : 'View My Orders'}
          </Button>
          
          {!isGuestCheckout && (
            <Button 
              variant="outlined" 
              onClick={handleContinueShopping}
              sx={{ 
                color: colors.primary,
                borderColor: colors.primary,
                '&:hover': { 
                  borderColor: colors.secondary,
                  color: colors.secondary 
                }
              }}
            >
              Continue Shopping
            </Button>
          )}
        </Box>
      </Paper>

      {/* SMS Error Notification */}
      {smsError && (
        <Snackbar
          open={!!smsError}
          autoHideDuration={6000}
          onClose={() => setSmsError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSmsError('')} 
            severity="error"
            sx={{ width: '100%' }}
          >
            SMS sending failed: {smsError}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
};

export default OrderConfirmation; 