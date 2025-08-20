import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getUser } from '../../../Redux/Auth/Action';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';
import PhoneVerification from './PhoneVerification';
import { getCart } from '../../../Redux/Customers/Cart/Action';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { auth } = useSelector((store) => store);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // This component is no longer responsible for token extraction from URL
  // It now simply checks for an existing token and handles post-auth navigation
  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check if we already have a token from direct server injection
        const token = localStorage.getItem('jwt');
        
        if (!token) {
          setError('No authentication token found');
          setIsProcessing(false);
          // Redirect to login after a short delay
          setTimeout(() => navigate('/login', { replace: true }), 1500);
          return;
        }
        
        // Token exists, fetch user data
        await dispatch(getUser(token));
        setIsAuthenticated(true);
        setIsProcessing(false);
      } catch (err) {
        console.error('Error in GoogleCallback:', err);
        setError(err.message || 'Authentication error');
        setIsProcessing(false);
        localStorage.removeItem('jwt'); // Clean up on error
        // Redirect to login after a short delay
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      }
    };

    handleAuth();
  }, [dispatch, navigate]);

  // Handle navigation after auth state is updated and check for pending cart items
  useEffect(() => {
    if (!isProcessing && isAuthenticated && auth.user) {
      
      // Handle pending cart items if any
      const handlePendingCartItems = async () => {
        const pendingCartItem = sessionStorage.getItem('pendingCartItem');
        
        if (pendingCartItem) {
          try {
            console.log('Processing pending cart item in GoogleCallback');
            // Dynamically import to prevent circular dependencies
            await dispatch(getCart()); // First get the current cart
            
            // Use the cart actions directly
            const cartModule = await import('../../../Redux/Customers/Cart/Action');
            await dispatch(cartModule.addItemToCart(JSON.parse(pendingCartItem)));
            
            // Clear the pending item from session storage
              sessionStorage.removeItem('pendingCartItem');
            console.log('Successfully added pending item to cart');
          } catch (error) {
            console.error('Error adding pending cart item:', error);
            // Keep the pending item in sessionStorage to try again later
          }
        }
      };

      // Redirect based on phone verification status
      if (!auth.user.phone) {
        // Don't navigate - render PhoneVerification component
      } else {
        // Handle any pending cart items and then redirect
        handlePendingCartItems().finally(() => {
          // Refresh cart before navigation
          dispatch(getCart()).finally(() => {
          navigate('/cart', { replace: true });
          });
        });
      }
    }
  }, [auth.user, isProcessing, isAuthenticated, navigate, dispatch]);

  // Show phone verification if user exists but doesn't have a phone number
  if (!isProcessing && auth.user && !auth.user.phone) {
    return <PhoneVerification />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        bgcolor: '#f5f7fa',
        p: 3
      }}
    >
      {error ? (
        <Alert severity="error" sx={{ mb: 3, width: '100%', maxWidth: 500 }}>
          {error}
        </Alert>
      ) : null}
      
      <CircularProgress size={40} sx={{ color: '#18181b', mb: 3 }} />
      <Typography variant="h6" sx={{ color: '#18181b', fontWeight: 500, textAlign: 'center' }}>
        {isProcessing ? 'Processing your sign in...' : 'Redirecting you...'}
      </Typography>
      <Typography variant="body2" sx={{ color: '#666', mt: 2, textAlign: 'center', maxWidth: 400 }}>
        If you&apos;re not redirected within a few seconds, please <span style={{ cursor: 'pointer', textDecoration: 'underline', color: '#4285F4' }} onClick={() => navigate('/login', { replace: true })}>click here</span> to go to the login page.
      </Typography>
    </Box>
  );
};

export default GoogleCallback; 