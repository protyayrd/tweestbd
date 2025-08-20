import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import Gavel from '@mui/icons-material/Gavel';
import Security from '@mui/icons-material/Security';
import Payment from '@mui/icons-material/Payment';
import LocalShipping from '@mui/icons-material/LocalShipping';

const TermsConditions = () => {
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
                Terms & Conditions
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
                Welcome to TWEEST. By accessing and using our website, you agree to comply with and be bound by the following terms and conditions.
              </Typography>

              <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Gavel sx={{ color: '#69af5a', mr: 2 }} />
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 600,
                      color: '#69af5a',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    General Terms
                  </Typography>
                </Box>
                <Box component="ul" sx={{ pl: 2, color: 'rgba(255,255,255,0.9)', mb: 3 }}>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    You must be at least 18 years old to use this website
                  </Typography>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    You are responsible for maintaining your account security
                  </Typography>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    We reserve the right to modify these terms at any time
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Payment sx={{ color: '#69af5a', mr: 2 }} />
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 600,
                      color: '#69af5a',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Payment & Pricing
                  </Typography>
                </Box>
                <Box component="ul" sx={{ pl: 2, color: 'rgba(255,255,255,0.9)', mb: 3 }}>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    All prices are in Bangladeshi Taka (BDT)
                  </Typography>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    Prices may change without prior notice
                  </Typography>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    Payment is processed securely through SSLCommerz
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocalShipping sx={{ color: '#69af5a', mr: 2 }} />
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 600,
                      color: '#69af5a',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Shipping & Delivery
                  </Typography>
                </Box>
                <Box component="ul" sx={{ pl: 2, color: 'rgba(255,255,255,0.9)', mb: 3 }}>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    Delivery times are estimates and not guaranteed
                  </Typography>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    Risk of loss passes to you upon delivery
                  </Typography>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    We are not responsible for delays beyond our control
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Security sx={{ color: '#69af5a', mr: 2 }} />
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 600,
                      color: '#69af5a',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Privacy & Security
                  </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    lineHeight: 2,
                    color: 'rgba(255,255,255,0.9)'
                  }}
                >
                  Your use of our website is also governed by our{' '}
                  <Box 
                    component="a" 
                    href="/privacy-policy" 
                    sx={{ 
                      color: '#69af5a',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Privacy Policy
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

export default TermsConditions; 