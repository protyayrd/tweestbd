import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper, Divider } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect');
  const errorMessage = searchParams.get('error');
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  
  // Payment details
  const [paymentDetails, setPaymentDetails] = useState({
    paymentMethod: searchParams.get('payment_method') || 'SSLCommerz',
    transactionId: searchParams.get('tran_id') || 'N/A',
    paymentPhoneNumber: searchParams.get('cus_phone') || 'N/A'
  });

  // Handle automatic redirect if redirectTo parameter is present
  useEffect(() => {
    if (redirectTo === 'cart') {
      setRedirecting(true);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/cart');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [redirectTo, navigate]);

  const handleRetry = () => {
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  const getErrorText = () => {
    switch(errorMessage) {
      case 'payment_reference_missing':
        return "We couldn't find the payment reference. Please try again.";
      case 'payment_not_found':
        return "We couldn't find your payment record. Please try again.";
      case 'server_error':
        return "There was a server error processing your payment. Please try again.";
      default:
        return "Your payment could not be processed at this time.";
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Payment Failed
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {getErrorText()}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: 'center' }}>
          {/* Payment Details Section */}
          <Box sx={{ my: 3, p: 2, bgcolor: 'rgba(244, 67, 54, 0.08)', borderRadius: 1, border: '1px solid rgba(244, 67, 54, 0.2)' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Payment Details
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Payment Method:</Typography>
              <Typography variant="body2" fontWeight="medium">{paymentDetails.paymentMethod}</Typography>
            </Box>
            {paymentDetails.transactionId !== 'N/A' && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Transaction ID:</Typography>
                <Typography variant="body2" fontWeight="medium">{paymentDetails.transactionId}</Typography>
              </Box>
            )}
            {paymentDetails.paymentPhoneNumber !== 'N/A' && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Payment Phone:</Typography>
                <Typography variant="body2" fontWeight="medium">{paymentDetails.paymentPhoneNumber}</Typography>
              </Box>
            )}
          </Box>

          <Typography variant="body1" paragraph>
            This could be due to one of the following reasons:
          </Typography>
          
          <Box component="ul" sx={{ 
            textAlign: 'left', 
            display: 'inline-block', 
            mb: 3,
            '& li': { mb: 1 } 
          }}>
            <li>Insufficient funds in your account</li>
            <li>Incorrect payment details</li>
            <li>Your bank declined the transaction</li>
            <li>Network or connectivity issues</li>
            <li>The payment gateway is experiencing technical difficulties</li>
          </Box>

          <Typography variant="body1" paragraph>
            Don&apos;t worry, no payment has been taken from your account.
            You can try again or choose a different payment method.
          </Typography>

          {/* Redirect message */}
          {redirecting && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', color: 'info.contrastText', borderRadius: 1 }}>
              <Typography variant="body2">
                Redirecting to your cart in {countdown} seconds...
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRetry}
              sx={{
                bgcolor: 'black',
                '&:hover': { bgcolor: 'grey.900' },
                px: 3,
                py: 1
              }}
            >
              Try Again
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

export default PaymentFailed; 