import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Divider,
  Stack,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StoreIcon from '@mui/icons-material/Store';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatPrice } from '../../../utils/format';


const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const queryOrderId = searchParams.get("order_id");
  const paymentType = searchParams.get("payment_type");
  const redirectUrl = searchParams.get("redirect");
  const orderData = location.state?.orderData || { orderId: queryOrderId, deliveryMethod: paymentType };



  // Handle automatic redirection if redirect parameter is provided
  useEffect(() => {
    if (redirectUrl) {
      // Set a short timeout to allow user to see the confirmation page before redirecting
      const redirectTimer = setTimeout(() => {
        navigate(redirectUrl);
      }, 3000); // 3 second delay before redirecting
      
      return () => clearTimeout(redirectTimer);
    }
  }, [redirectUrl, navigate]);

  // Show redirect message if applicable
  const isRedirecting = !!redirectUrl;
  
  // Handle case where we only have query parameters but no state
  if (!orderData.orderId && !queryOrderId) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">
          No order information found. Please try placing your order again.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/cart')}
          sx={{ mt: 2 }}
        >
          Return to Cart
        </Button>
      </Container>
    );
  }

  const {
    orderId,
    totalAmount,
    deliveryMethod,
    deliveryCharge,
    address,
    paymentMethod
  } = orderData;

  const isOutletPickup = deliveryMethod === 'outlet_pickup';
  const isCOD = deliveryMethod === 'cod';
  const dueAmount = isCOD ? totalAmount + deliveryCharge : 0;

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: 'center',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <CheckCircleIcon
          sx={{
            fontSize: 64,
            color: '#00503a',
            mb: 2
          }}
        />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Order Confirmed!
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Order ID: {orderId}
        </Typography>
        
        {isRedirecting && (
          <Alert severity="info" sx={{ mb: 2 }}>
            You will be redirected to your orders page in a few seconds...
          </Alert>
        )}

        <Divider sx={{ my: 4 }} />

        {/* Delivery/Pickup Information */}
        <Box sx={{ mb: 4 }}>
          {isOutletPickup ? (
            <Stack spacing={2} alignItems="center">
              <StoreIcon sx={{ fontSize: 40, color: '#00503a' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Outlet Pickup
              </Typography>
              <Typography color="text.secondary">
                Please collect your order from our outlet during business hours
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Amount to Pay: {formatPrice(totalAmount)}
              </Typography>
            </Stack>
          ) : isCOD ? (
            <Stack spacing={2} alignItems="center">
              <LocalShippingIcon sx={{ fontSize: 40, color: '#00503a' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Cash on Delivery
              </Typography>
              <Typography color="text.secondary">
                Delivery to: {address?.fullAddress}
              </Typography>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Amount to Pay: {formatPrice(dueAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  (Including delivery charge of {formatPrice(deliveryCharge)})
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Stack spacing={2} alignItems="center">
              <LocalShippingIcon sx={{ fontSize: 40, color: '#00503a' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Payment Successful
              </Typography>
              <Typography color="text.secondary">
                Your order will be delivered to: {address?.fullAddress}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Amount Paid: {formatPrice(totalAmount + deliveryCharge)}
              </Typography>
            </Stack>
          )}
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Action Buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          sx={{ mt: 4 }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate('/orders')}
            sx={{
              borderColor: '#00503a',
              color: '#00503a',
              '&:hover': {
                borderColor: '#00503a',
                bgcolor: '#00503a08'
              }
            }}
          >
            View Orders
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/products')}
            sx={{
              bgcolor: '#00503a',
              '&:hover': {
                bgcolor: '#003a2a'
              }
            }}
          >
            Continue Shopping
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default OrderConfirmation; 