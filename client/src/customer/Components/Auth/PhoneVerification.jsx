import React, { useState } from 'react';
import { Box, Container, Paper, TextField, Button, Typography, Alert, Stack, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserPhone } from '../../../Redux/Auth/Action';
import { useNavigate } from 'react-router-dom';

export default function PhoneVerification() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { isLoading, error: reduxError } = useSelector((store) => store.auth);

  const validatePhone = (phoneNumber) => {
    const phoneRegex = /^01[3-9]\d{8}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleSubmitPhone = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validatePhone(phone)) {
      setError('Please enter a valid Bangladeshi phone number (e.g., 017XXXXXXXX)');
      return;
    }

    try {
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        setError('Please login again to continue');
        navigate('/login');
        return;
      }

      const result = await dispatch(updateUserPhone(phone));
      if (result.error) {
        throw new Error(result.error);
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/cart');
      }, 2000);
    } catch (err) {
      console.error('Phone update error:', err);
      if (err.response?.status === 401) {
        setError('Please login again to continue');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to update phone number');
      }
    }
  };

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f7fa',
        py: { xs: 4, sm: 6, md: 8 }
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4, md: 5 },
            borderRadius: 3,
            bgcolor: 'white',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontSize: { xs: '1.5rem', sm: '2rem' },
                fontWeight: 700,
                color: '#1a1a1a',
                mb: 2
              }}
            >
              One last step!
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#64748b',
                mb: 2
              }}
            >
              Please add your phone number to complete your registration
            </Typography>
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Phone number saved successfully! Redirecting to cart...
            </Alert>
          )}

          {(error || reduxError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || reduxError}
            </Alert>
          )}

          <Stack spacing={2}>
            <TextField
              required
              fullWidth
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              label="Phone number"
              placeholder="017XXXXXXXX"
              error={!!error}
              helperText={error}
              disabled={isLoading}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: '#f8fafc',
                  transition: 'all 0.2s ease-in-out',
                  "&:hover": {
                    backgroundColor: '#f1f5f9',
                  },
                  "&.Mui-focused": {
                    backgroundColor: '#ffffff',
                    "& fieldset": {
                      borderColor: '#000000',
                      borderWidth: 2,
                    },
                  },
                },
                "& .MuiInputLabel-root": {
                  color: '#64748b',
                  "&.Mui-focused": {
                    color: '#000000',
                  },
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmitPhone}
              disabled={isLoading}
              sx={{
                py: 1.5,
                mt: 2,
                backgroundColor: "#18181b",
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "#27272a",
                },
                "&.Mui-disabled": {
                  backgroundColor: "#d1d5db",
                  color: "#ffffff",
                }
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: '#ffffff' }} />
              ) : (
                'Save Phone Number'
              )}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
} 