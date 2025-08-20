import React, { useEffect } from 'react';
import { Box, Container, Paper, Typography, Alert, CircularProgress } from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PhoneVerification from './PhoneVerification';

export default function OTPVerification() {
  const navigate = useNavigate();
  const { auth } = useSelector((store) => store);

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!auth.user && !localStorage.getItem('jwt')) {
      navigate('/login');
      return;
    }

    // If user is verified, redirect to home
    if (auth.user?.isOTPVerified) {
      navigate('/');
    }
  }, [auth.user, navigate]);

  // Show loading while checking auth state
  if (!auth.user) {
    return (
      <Box 
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f5f7fa'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <PhoneVerification />;
} 