import React, { useState, useEffect } from "react";
import { 
  Box, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Alert, 
  CircularProgress,
  Paper,
  Typography,
  Grid,
  Divider
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createPayment } from "../../../Redux/Customers/Payment/Action";

const commonTextFieldStyles = {
  '& .MuiOutlinedInput-root': { 
    '&.Mui-focused fieldset': { 
      borderColor: 'black' 
    },
    '&:hover fieldset': {
      borderColor: 'grey.400'
    }
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'black'
  }
};

const PaymentForm = ({ handleNext }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get("order_id");
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const { order } = useSelector(state => state);
  const { payment } = useSelector(state => state);

  // Payment form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    // Check if we have an order ID
    if (!order.order?._id) {
      navigate('/cart');
    }
  }, [order.order, navigate]);

  useEffect(() => {
    if (payment?.success || payment?.id) {
      setIsSubmitting(false);
      navigate('/account/order');
    } else if (payment?.error) {
      setIsSubmitting(false);
      setFormError(payment.error);
    }
  }, [payment, navigate]);

  const handleSSLCommerzPayment = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    if (!order.order?._id) {
      setFormError("No order ID available");
      setIsSubmitting(false);
      return;
    }
    
    // Get customer information from the order if available
    const customerInfo = order.order?.user || {};
    const shippingAddress = order.order?.shippingAddress || {};
    
    const data = {
      orderId: order.order._id,
      jwt,
      amount: order.order.totalDiscountedPrice,
      // Add customer information for SSLCommerz
      customerName: customerInfo.fullName || shippingAddress.firstName + ' ' + shippingAddress.lastName || '',
      customerEmail: customerInfo.email || '',
      paymentPhoneNumber: shippingAddress.mobile || customerInfo.mobile || '',
      // Add a unique transaction ID (will be generated on server)
      transactionId: `ORDER-${order.order._id}-${Date.now()}`
    };
    
    console.log('Sending payment data:', data);
    
    try {
      const result = await dispatch(createPayment(data));
      console.log('Payment result:', result);

      // The redirect to SSLCommerz payment gateway is handled in the Action.js
      // If we reach here, it means there was an issue with the redirect
      if (result?.error) {
        setFormError(result.error);
        setIsSubmitting(false);
      } else if (!result?.payment_link_url) {
        setFormError("Unable to initialize payment gateway. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setFormError("Payment initialization failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={8}>
        <Paper elevation={0} className="border p-5" sx={{
          borderColor: '#000000',
          bgcolor: '#ffffff',
          borderRadius: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#000000' }}>
            Payment Details
          </Typography>

          <form onSubmit={handleSSLCommerzPayment}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 3, 
                  border: '1px solid', 
                  borderColor: '#000000', 
                  borderRadius: 2,
                  textAlign: 'center',
                  bgcolor: '#f5f5f5'
                }}>
                  <img 
                    src="https://securepay.sslcommerz.com/public/image/SSLCommerz-Pay-With-logo-All-Size-01.png" 
                    alt="SSLCommerz" 
                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '80px' }}
                  />
                  <Typography variant="body1" sx={{ mt: 2, color: '#000000' }}>
                    Pay securely using SSLCommerz payment gateway
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: '#000000' }}>
                    You will be redirected to SSLCommerz secure payment page
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Alert 
                  severity="info" 
                  sx={{ 
                    mb: 2,
                    '& .MuiAlert-icon': {
                      color: '#000000'
                    },
                    '& .MuiAlert-message': {
                      color: '#000000'
                    },
                    bgcolor: '#f5f5f5',
                    border: '1px solid #000000'
                  }}
                >
                  <Typography variant="body2" color="#000000">
                    <strong>This is a sandbox/test environment.</strong> Use the following test credentials:
                  </Typography>
                  <Box component="ul" sx={{ mt: 1, pl: 2, color: '#000000' }}>
                    <li>Card Number: 4111 1111 1111 1111</li>
                    <li>Expiry: Any future date</li>
                    <li>CVC: Any 3 digits</li>
                    <li>Name: Any name</li>
                  </Box>
                </Alert>
              </Grid>

              {formError && (
                <Grid item xs={12}>
                  <Alert 
                    severity="error"
                    sx={{
                      '& .MuiAlert-icon': {
                        color: '#000000'
                      },
                      '& .MuiAlert-message': {
                        color: '#000000'
                      },
                      bgcolor: '#f5f5f5',
                      border: '1px solid #000000'
                    }}
                  >
                    {formError}
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isSubmitting}
                  sx={{
                    py: 1.5,
                    bgcolor: '#000000',
                    color: '#ffffff',
                    '&:hover': { bgcolor: '#333333' },
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&.Mui-disabled': {
                      bgcolor: '#cccccc',
                      color: '#666666'
                    }
                  }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Pay Now with SSLCommerz"
                  )}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper elevation={0} className="border p-5" sx={{
          borderColor: '#000000',
          bgcolor: '#ffffff',
          borderRadius: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#000000' }}>
            Order Summary
          </Typography>
          <Divider sx={{ mb: 2, bgcolor: '#000000' }} />

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography color="#000000">
                Total Items
              </Typography>
              <Typography color="#000000">{order.order?.totalItem}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography color="#000000">Total Amount</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#000000' }}>
                Tk. {order.order?.totalDiscountedPrice}
              </Typography>
            </Box>
          </Box>

          <Alert 
            severity="info" 
            sx={{ 
              mt: 2,
              '& .MuiAlert-icon': {
                color: '#000000'
              },
              '& .MuiAlert-message': {
                color: '#000000'
              },
              bgcolor: '#f5f5f5',
              border: '1px solid #000000'
            }}
          >
            You will be redirected to SSLCommerz secure payment gateway to complete your payment.
          </Alert>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default PaymentForm; 
