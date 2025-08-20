import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { trackPaymentFailed, trackPaymentCancelled, trackPurchase } from '../../../utils/gtmEvents';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderById } from '../../../Redux/Customers/Order/Action';

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const dispatch = useDispatch();
  const { order } = useSelector(state => state);
  
  // Get order ID from URL params if available
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('order_id');
  const errorMessage = searchParams.get('message');
  
  // Track payment events based on the page
  useEffect(() => {
    // Handle different payment result scenarios
    switch (pathname) {
      case '/payment-success':
        // If we have an order ID, fetch the order data and track purchase
        if (orderId) {
          dispatch(getOrderById(orderId)).then(orderData => {
            if (orderData) {
              trackPurchase(orderData, 'payment-success');
            }
          });
        }
        break;
        
      case '/payment-failed':
        trackPaymentFailed(errorMessage || 'Payment processing error');
        break;
        
      case '/payment-cancelled':
        trackPaymentCancelled();
        break;
        
      default:
        // No tracking for unknown paths
        break;
    }
  }, [pathname, orderId, errorMessage, dispatch]);

  const getContent = () => {
    switch (pathname) {
      case '/payment-success':
        return {
          icon: <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main' }} />,
          title: 'Payment Successful!',
          message: 'Your T-shirt order has been confirmed. We will process it soon.',
          severity: 'success',
          color: 'success.main',
          animation: 'scale-in'
        };
      case '/payment-failed':
        return {
          icon: <ErrorIcon sx={{ fontSize: 80, color: 'error.main' }} />,
          title: 'Payment Failed',
          message: 'Sorry, your payment could not be processed. Please try again.',
          severity: 'error',
          color: 'error.main',
          animation: 'shake'
        };
      case '/payment-cancelled':
        return {
          icon: <CancelIcon sx={{ fontSize: 80, color: 'warning.main' }} />,
          title: 'Payment Cancelled',
          message: 'You cancelled the payment. You can try again anytime.',
          severity: 'warning',
          color: 'warning.main',
          animation: 'slide-in'
        };
      default:
        return {
          icon: <ErrorIcon sx={{ fontSize: 80, color: 'error.main' }} />,
          title: 'Unknown Status',
          message: 'Something went wrong. Please contact support.',
          severity: 'error',
          color: 'error.main',
          animation: 'fade-in'
        };
    }
  };

  const content = getContent();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: 2,
          background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)',
          animation: `${content.animation} 0.5s ease-out`,
          '@keyframes scale-in': {
            '0%': {
              transform: 'scale(0.8)',
              opacity: 0
            },
            '100%': {
              transform: 'scale(1)',
              opacity: 1
            }
          },
          '@keyframes shake': {
            '0%, 100%': {
              transform: 'translateX(0)'
            },
            '10%, 30%, 50%, 70%, 90%': {
              transform: 'translateX(-5px)'
            },
            '20%, 40%, 60%, 80%': {
              transform: 'translateX(5px)'
            }
          },
          '@keyframes slide-in': {
            '0%': {
              transform: 'translateY(-20px)',
              opacity: 0
            },
            '100%': {
              transform: 'translateY(0)',
              opacity: 1
            }
          },
          '@keyframes fade-in': {
            '0%': {
              opacity: 0
            },
            '100%': {
              opacity: 1
            }
          }
        }}
      >
        <Box 
          sx={{ 
            mb: 3,
            animation: content.severity === 'success' ? 'bounce 1s ease infinite' : 'none',
            '@keyframes bounce': {
              '0%, 100%': {
                transform: 'translateY(0)'
              },
              '50%': {
                transform: 'translateY(-10px)'
              }
            }
          }}
        >
          {content.icon}
        </Box>

        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            color: content.color,
            mb: 3
          }}
        >
          {content.title}
        </Typography>

        <Alert 
          severity={content.severity} 
          sx={{ 
            mb: 4,
            fontSize: '1.1rem',
            '& .MuiAlert-icon': {
              fontSize: '2rem'
            }
          }}
        >
          {errorMessage || content.message}
        </Alert>

        {content.severity === 'success' && (
          <Box sx={{ mb: 4, mt: 2 }}>
            <LocalShippingIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom color="primary">
              Delivery Information
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your order will be processed within 24 hours.
              We&apos;ll send you an email with tracking details once shipped.
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/')}
            sx={{
              bgcolor: content.color,
              color: 'white',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': {
                bgcolor: content.color,
                filter: 'brightness(0.9)'
              }
            }}
          >
            Back to Home
          </Button>
          {content.severity !== 'success' && (
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/TGBHSIAN')}
              sx={{
                borderColor: content.color,
                color: content.color,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  borderColor: content.color,
                  bgcolor: `${content.color}10`
                }
              }}
            >
              Try Again
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default PaymentResult; 