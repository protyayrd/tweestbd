import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import Email from '@mui/icons-material/Email';
import Phone from '@mui/icons-material/Phone';
import WhatsApp from '@mui/icons-material/WhatsApp';
import LocationOn from '@mui/icons-material/LocationOn';
import Facebook from '@mui/icons-material/Facebook';
import Instagram from '@mui/icons-material/Instagram';
import AccessTime from '@mui/icons-material/AccessTime';

const Contact = () => {
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
                Contact Us
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
                We&apos;re here to help! Reach out to us through any of the following channels:
              </Typography>

              <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Phone sx={{ color: '#69af5a', mr: 2 }} />
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#69af5a',
                        mb: 1
                      }}
                    >
                      Phone
                    </Typography>
                    <Typography 
                      component="a"
                      href="tel:+8801611101430"
                      sx={{ 
                        color: 'rgba(255,255,255,0.9)',
                        textDecoration: 'none',
                        '&:hover': { color: '#69af5a' }
                      }}
                    >
                      +88 01611-101430
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <WhatsApp sx={{ color: '#69af5a', mr: 2 }} />
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#69af5a',
                        mb: 1
                      }}
                    >
                      WhatsApp
                    </Typography>
                    <Typography 
                      component="a"
                      href="https://wa.me/8801611101430"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        color: 'rgba(255,255,255,0.9)',
                        textDecoration: 'none',
                        '&:hover': { color: '#69af5a' }
                      }}
                    >
                      +88 01611-101430
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Email sx={{ color: '#69af5a', mr: 2 }} />
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#69af5a',
                        mb: 1
                      }}
                    >
                      Email
                    </Typography>
                    <Typography 
                      component="a"
                      href="mailto:tweestbd@gmail.com"
                      sx={{ 
                        color: 'rgba(255,255,255,0.9)',
                        textDecoration: 'none',
                        '&:hover': { color: '#69af5a' }
                      }}
                    >
                      tweestbd@gmail.com
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <AccessTime sx={{ color: '#69af5a', mr: 2 }} />
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#69af5a',
                        mb: 1
                      }}
                    >
                      Business Hours
                    </Typography>
                    <Typography 
                      sx={{ 
                        color: 'rgba(255,255,255,0.9)'
                      }}
                    >
                      10:00 AM - 10:00 PM (Bangladesh Time)
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 5 }}>
                  <LocationOn sx={{ color: '#69af5a', mr: 2 }} />
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#69af5a',
                        mb: 1
                      }}
                    >
                      Location
                    </Typography>
                    <Typography 
                      sx={{ 
                        color: 'rgba(255,255,255,0.9)'
                      }}
                    >
                      Dhaka, Bangladesh
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 4 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#69af5a',
                      mb: 2,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Social Media
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box
                      component="a"
                      href="https://facebook.com/tweestbd"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: 'rgba(255,255,255,0.9)',
                        '&:hover': { color: '#69af5a' }
                      }}
                    >
                      <Facebook sx={{ fontSize: 28 }} />
                    </Box>
                    <Box
                      component="a"
                      href="https://instagram.com/tweestbd"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: 'rgba(255,255,255,0.9)',
                        '&:hover': { color: '#69af5a' }
                      }}
                    >
                      <Instagram sx={{ fontSize: 28 }} />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default Contact; 