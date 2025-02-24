import React from 'react';
import { Grid, Typography, Link, Box, Container, IconButton, Stack } from '@mui/material';
import { Facebook, Instagram, Twitter, YouTube, WhatsApp, Email, Phone, LocationOn } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <Box component="footer">
      {/* Main Footer */}
      <Box sx={{ bgcolor: '#f8f8f8', borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="xl">
          <Box sx={{ py: { xs: 6, md: 8 } }}>
            <Grid container spacing={{ xs: 4, md: 6 }}>
              {/* Brand Section */}
              <Grid item xs={12} md={4} lg={5}>
                <Box sx={{ pr: { md: 8 } }}>
                  <img 
                    src="/images/logo.png" 
                    alt="Tweest BD" 
                    style={{ height: '36px', marginBottom: '24px' }} 
                  />
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: '#666666',
                      mb: 3,
                      lineHeight: 1.8,
                      fontSize: '0.95rem'
                    }}
                  >
                    Tweest BD is your premier destination for fashion and lifestyle products. 
                    We offer a curated collection of high-quality clothing and accessories 
                    that blend style, comfort, and affordability.
                  </Typography>
                  <Stack direction="row" spacing={1.5}>
                    <IconButton 
                      href="https://facebook.com" 
                      target="_blank"
                      sx={{ 
                        color: '#666666',
                        transition: 'all 0.2s',
                        '&:hover': { 
                          color: '#1877f2',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Facebook />
                    </IconButton>
                    <IconButton 
                      href="https://instagram.com" 
                      target="_blank"
                      sx={{ 
                        color: '#666666',
                        transition: 'all 0.2s',
                        '&:hover': { 
                          color: '#e4405f',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Instagram />
                    </IconButton>
                    <IconButton 
                      href="https://twitter.com" 
                      target="_blank"
                      sx={{ 
                        color: '#666666',
                        transition: 'all 0.2s',
                        '&:hover': { 
                          color: '#1da1f2',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Twitter />
                    </IconButton>
                    <IconButton 
                      href="https://youtube.com" 
                      target="_blank"
                      sx={{ 
                        color: '#666666',
                        transition: 'all 0.2s',
                        '&:hover': { 
                          color: '#ff0000',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <YouTube />
                    </IconButton>
                  </Stack>
                </Box>
              </Grid>

              {/* Quick Links */}
              <Grid item xs={12} sm={6} md={2} lg={2}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 3,
                    color: '#1a1a1a'
                  }}
                >
                  Quick Links
                </Typography>
                <Stack spacing={2}>
                  {['About Us', 'Contact', 'FAQ', 'Size Guide'].map((item) => (
                    <Link
                      key={item}
                      href="#"
                      underline="none"
                      sx={{
                        color: '#666666',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                        '&:hover': {
                          color: '#000',
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      {item}
                    </Link>
                  ))}
                </Stack>
              </Grid>

              {/* Customer Service */}
              <Grid item xs={12} sm={6} md={3} lg={2}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 3,
                    color: '#1a1a1a'
                  }}
                >
                  Customer Service
                </Typography>
                <Stack spacing={2}>
                  {[
                    'Shipping Policy',
                    'Return & Exchange',
                    'Terms & Conditions',
                    'Privacy Policy'
                  ].map((item) => (
                    <Link
                      key={item}
                      href="#"
                      underline="none"
                      sx={{
                        color: '#666666',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                        '&:hover': {
                          color: '#000',
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      {item}
                    </Link>
                  ))}
                </Stack>
              </Grid>

              {/* Contact Info */}
              <Grid item xs={12} sm={6} md={3} lg={3}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 3,
                    color: '#1a1a1a'
                  }}
                >
                  Get in Touch
                </Typography>
                <Stack spacing={2.5}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Email sx={{ color: '#666666', fontSize: 22 }} />
                    <Link
                      href="mailto:customerservice.ecstasybd@gmail.com"
                      underline="none"
                      sx={{
                        color: '#666666',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                        '&:hover': { color: '#000' }
                      }}
                    >
                      customerservice.ecstasybd@gmail.com
                    </Link>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Phone sx={{ color: '#666666', fontSize: 22 }} />
                    <Link
                      href="tel:+8801958237701"
                      underline="none"
                      sx={{
                        color: '#666666',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                        '&:hover': { color: '#000' }
                      }}
                    >
                      +88 01958-237701
                    </Link>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <WhatsApp sx={{ color: '#666666', fontSize: 22 }} />
                    <Link
                      href="https://wa.me/8801841582399"
                      underline="none"
                      sx={{
                        color: '#666666',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                        '&:hover': { color: '#000' }
                      }}
                    >
                      +88 01841582399
                    </Link>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <LocationOn sx={{ color: '#666666', fontSize: 22 }} />
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666666',
                        fontSize: '0.95rem',
                        lineHeight: 1.6
                      }}
                    >
                      123 Fashion Street, Dhaka,
                      <br />
                      Bangladesh
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Bottom Bar */}
      <Box 
        sx={{ 
          bgcolor: '#000', 
          color: 'white', 
          py: 2.5,
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Container maxWidth="xl">
          <Grid 
            container 
            spacing={2} 
            alignItems="center"
            justifyContent="space-between"
          >
            <Grid item xs={12} md="auto">
              <Typography 
                variant="body2" 
                sx={{ 
                  textAlign: { xs: 'center', md: 'left' },
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.875rem'
                }}
              >
                © {new Date().getFullYear()} Tweest BD. All rights reserved.
              </Typography>
            </Grid>
            <Grid item xs={12} md="auto">
              <Stack 
                direction="row" 
                spacing={4}
                justifyContent={{ xs: 'center', md: 'flex-end' }}
              >
                {['Privacy Policy', 'Terms of Service', 'Sitemap'].map((item) => (
                  <Link
                    key={item}
                    href="#"
                    underline="none"
                    sx={{
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '0.875rem',
                      transition: 'color 0.2s',
                      '&:hover': {
                        color: 'white'
                      }
                    }}
                  >
                    {item}
                  </Link>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;