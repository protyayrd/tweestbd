import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';

const PrivacyPolicy = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, md: 6 }, 
            backgroundColor: '#1a1a1a',
            color: 'white',
            borderRadius: 2
          }}
        >
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  mb: 4,
                  color: '#69af5a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Privacy Policy
              </Typography>

              <Typography 
                variant="body1" 
                paragraph 
                sx={{ 
                  mb: 4, 
                  lineHeight: 2,
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '1.1rem'
                }}
              >
                At TWEEST, we respect your privacy and are committed to protecting your personal information.
              </Typography>

              <Box sx={{ mb: 5 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600,
                    color: '#69af5a',
                    mb: 2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Information We Collect
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ 
                    lineHeight: 2,
                    color: 'rgba(255,255,255,0.9)',
                    mb: 2
                  }}
                >
                  <strong style={{ color: '#69af5a' }}>Personal Details:</strong> Name, email, phone, address, payment details for order processing.
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ 
                    lineHeight: 2,
                    color: 'rgba(255,255,255,0.9)'
                  }}
                >
                  <strong style={{ color: '#69af5a' }}>Non-Personal Information:</strong> Browser type and IP address for analytics.
                </Typography>
              </Box>

              <Box sx={{ mb: 5 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600,
                    color: '#69af5a',
                    mb: 2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  How We Use Your Information
                </Typography>
                <Box component="ul" sx={{ pl: 2, color: 'rgba(255,255,255,0.9)' }}>
                  <Typography 
                    component="li" 
                    sx={{ 
                      mb: 1,
                      lineHeight: 2
                    }}
                  >
                    To process and ship orders.
                  </Typography>
                  <Typography 
                    component="li" 
                    sx={{ 
                      mb: 1,
                      lineHeight: 2
                    }}
                  >
                    To improve our website experience.
                  </Typography>
                  <Typography 
                    component="li" 
                    sx={{ 
                      mb: 1,
                      lineHeight: 2
                    }}
                  >
                    To communicate with you regarding promotions and updates (only if you opt-in).
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 5 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600,
                    color: '#69af5a',
                    mb: 2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Data Security
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ 
                    lineHeight: 2,
                    color: 'rgba(255,255,255,0.9)'
                  }}
                >
                  We use secure encryption and trusted third-party payment gateways to protect your data.
                </Typography>
              </Box>

              <Box sx={{ mb: 5 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600,
                    color: '#69af5a',
                    mb: 2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Your Rights
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    lineHeight: 2,
                    color: 'rgba(255,255,255,0.9)'
                  }}
                >
                  You can request access, modification, or deletion of your data by contacting us at{' '}
                  <Box 
                    component="a" 
                    href="mailto:tweestbd@gmail.com" 
                    sx={{ 
                      color: '#69af5a',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    tweestbd@gmail.com
                  </Box>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default PrivacyPolicy; 