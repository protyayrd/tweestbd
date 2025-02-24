import React from 'react';
import { Box, Grid } from '@mui/material';
import LoginUserForm from '../../customer/Components/Auth/Login';

const LoginPage = () => {
  return (
    <Grid container sx={{ minHeight: '100vh' }}>
      {/* Left side - Form */}
      <Grid 
        item 
        xs={12} 
        md={6} 
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          bgcolor: '#ffffff',
          position: 'relative',
          p: { xs: 2, sm: 4, md: 6 }
        }}
      >
        <LoginUserForm />
      </Grid>

      {/* Right side - Image/Banner */}
      <Grid 
        item 
        md={6} 
        sx={{ 
          display: { xs: 'none', md: 'block' },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: '#f5f5f5',
            backgroundImage: 'url(/images/auth-banner.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 1
            }
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 6,
            color: 'white',
            zIndex: 2,
            textAlign: 'left',
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)'
          }}
        >
          <Box 
            component="h2" 
            sx={{ 
              fontSize: { md: '2rem', lg: '2.5rem' },
              fontWeight: 600,
              mb: 2,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            Welcome to Tweest BD
          </Box>
          <Box 
            component="p" 
            sx={{ 
              fontSize: { md: '1rem', lg: '1.25rem' },
              maxWidth: '600px',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            Discover our exclusive collection of fashion and lifestyle products.
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

export default LoginPage; 