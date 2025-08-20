import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import LocalShipping from '@mui/icons-material/LocalShipping';
import AccessTime from '@mui/icons-material/AccessTime';
import LocationOn from '@mui/icons-material/LocationOn';
import Warning from '@mui/icons-material/Warning';

const ShippingPolicy = () => {
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
                Shipping Policy
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
                At TWEEST, we strive to deliver your orders as quickly and efficiently as possible. Our shipping policies are designed to ensure you receive your items in perfect condition.
              </Typography>

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
                    Delivery Areas
                  </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ 
                    lineHeight: 2,
                    color: 'rgba(255,255,255,0.9)',
                    mb: 2
                  }}
                >
                  We currently deliver to all major cities in Bangladesh. Delivery times may vary based on your location:
                </Typography>
                <Box component="ul" sx={{ pl: 2, color: 'rgba(255,255,255,0.9)', mb: 3 }}>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    Dhaka City: 1-2 business days
                  </Typography>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    Other Major Cities: 2-3 business days
                  </Typography>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    Remote Areas: 3-5 business days
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccessTime sx={{ color: '#69af5a', mr: 2 }} />
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
                    Shipping Costs
                  </Typography>
                </Box>
                <Box component="ul" sx={{ pl: 2, color: 'rgba(255,255,255,0.9)', mb: 3 }}>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    Inside Dhaka: ৳60
                  </Typography>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    Outside Dhaka: ৳110
                  </Typography>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    Free shipping on orders above ৳2200
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOn sx={{ color: '#69af5a', mr: 2 }} />
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
                    Order Tracking
                  </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  paragraph 
                  sx={{ 
                    lineHeight: 2,
                    color: 'rgba(255,255,255,0.9)'
                  }}
                >
                  Once your order is shipped, you will receive a tracking number via email and SMS. You can track your order status through our website or by contacting our customer service.
                </Typography>
              </Box>

              <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Warning sx={{ color: '#69af5a', mr: 2 }} />
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
                    Delays & Issues
                  </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    lineHeight: 2,
                    color: 'rgba(255,255,255,0.9)'
                  }}
                >
                  While we strive to deliver on time, delays may occur due to unforeseen circumstances. For any shipping issues, please contact us at{' '}
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
                  {' '}or call us at{' '}
                  <Box 
                    component="a" 
                    href="tel:+8801611101430" 
                    sx={{ 
                      color: '#69af5a',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    +88 01611-101430
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

export default ShippingPolicy; 