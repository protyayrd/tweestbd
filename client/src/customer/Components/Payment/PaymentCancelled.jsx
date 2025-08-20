import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper, Divider } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect');
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  
  // Payment details
  const [paymentDetails] = useState({
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

  // Format transaction ID to be more readable
  const formatTransactionId = (transactionId) => {
    if (!transactionId) return 'N/A';
    
    // If it includes a timestamp at the end, truncate it
    if (transactionId.includes('-') && transactionId.split('-').length > 2) {
      return transactionId.split('-').slice(0, 2).join('-');
    }
    
    // Otherwise just return first 15 chars
    return transactionId.length > 15 ? `${transactionId.substring(0, 15)}...` : transactionId;
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CancelIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Payment Cancelled
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Your payment process was cancelled.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: 'center' }}>
          {/* Payment Details Section */}
          <Box sx={{ my: 3, p: 2, bgcolor: 'rgba(255, 152, 0, 0.08)', borderRadius: 1, border: '1px solid rgba(255, 152, 0, 0.2)' }}>
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
                <Typography variant="body2" fontWeight="medium">{formatTransactionId(paymentDetails.transactionId)}</Typography>
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
            You&apos;ve chosen to cancel the payment process. No payment has been taken from your account.
          </Typography>
          
          <Typography variant="body1" paragraph>
            Your order is still saved, and you can complete the payment whenever you&apos;re ready.
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

export default PaymentCancelled; 