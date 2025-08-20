import React from 'react';
import { Grid, Typography, Link, Box, Container, IconButton, Stack } from '@mui/material';
import Facebook from '@mui/icons-material/Facebook';
import Instagram from '@mui/icons-material/Instagram';
import Email from '@mui/icons-material/Email';
import Phone from '@mui/icons-material/Phone';
import LocationOn from '@mui/icons-material/LocationOn';
import { SvgIcon } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LOGO_CONFIG, getLogoStyles } from '../../../config/logo';

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
                  <Box
                    component="img"
                    src={LOGO_CONFIG.MAIN_LOGO}
                    srcSet={LOGO_CONFIG.LOGO_SRCSET}
                    sizes={LOGO_CONFIG.LOGO_SIZES}
                    alt={LOGO_CONFIG.ALT_TEXT}
                    sx={getLogoStyles('default')}
                    loading="lazy"
                    decoding="async"
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#666666',
                      mt: 3,
                      mb: 3,
                      lineHeight: 1.8,
                      fontSize: '0.95rem'
                    }}
                  >
                    Tweest is your premier destination for fashion and lifestyle products.
                    We offer a curated collection of high-quality clothing and accessories
                    that blend style, comfort, and affordability.
                  </Typography>
                  <Stack direction="row" spacing={1.5}>
                    <IconButton
                      href="https://www.facebook.com/tweestbd"
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
                      href="https://instagram.com/tweestbd"
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
                      href="https://tiktok.com/@tweestbd"
                      target="_blank"
                      sx={{
                        color: '#666666',
                        transition: 'all 0.2s',
                        '&:hover': {
                          color: '#000000',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <SvgIcon viewBox="0 0 24 24">
                        <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.59-1.16-2.59-2.5 0-1.34 1.16-2.5 2.59-2.5.27 0 .54.04.79.13v-3.13c-.25-.02-.5-.04-.79-.04-3.14 0-5.68 2.55-5.68 5.68 0 3.14 2.55 5.68 5.68 5.68 3.14 0 5.68-2.55 5.68-5.68V10.1a7.01 7.01 0 0 0 4.32 1.49v-3.01a4.128 4.128 0 0 1-3.28-2.76z" />
                      </SvgIcon>
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
                  {[
                    { label: 'About Us', path: '/about' },
                    { label: 'Contact', path: '/contact' },
                    { label: 'FAQ', path: '/faq' }
                  ].map((item) => (
                    <Link
                      key={item.label}
                      component="button"
                      onClick={() => navigate(item.path)}
                      underline="none"
                      sx={{
                        color: '#666666',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        '&:hover': {
                          color: '#000',
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      {item.label}
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
                    { label: 'Shipping Policy', path: '/shipping-policy' },
                    { label: 'Return & Exchange', path: '/return-exchange-policy' },
                    { label: 'Terms & Conditions', path: '/terms-conditions' },
                    { label: 'Privacy Policy', path: '/privacy-policy' }
                  ].map((item) => (
                    <Link
                      key={item.label}
                      component="button"
                      onClick={() => navigate(item.path)}
                      underline="none"
                      sx={{
                        color: '#666666',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        '&:hover': {
                          color: '#000',
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      {item.label}
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
                      href="mailto:tweestbd@gmail.com"
                      underline="none"
                      sx={{
                        color: '#666666',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                        '&:hover': { color: '#000' }
                      }}
                    >
                      tweestbd@gmail.com
                    </Link>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Phone sx={{ color: '#666666', fontSize: 22 }} />
                    <Link
                      href="tel:+8801611101430"
                      underline="none"
                      sx={{
                        color: '#666666',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                        '&:hover': { color: '#000' }
                      }}
                    >
                      +88 01611-101430
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
                      147/C, Green Road,
                      <br />
                      Dhaka-1205, Bangladesh
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          {/* SSL Commerz Section */}
          <Box sx={{ py: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <picture>
              <source 
                media="(max-width: 768px)" 
                srcSet="/images/sslcommerz-380w.webp"
                type="image/webp"
              />
              <source 
                media="(max-width: 1200px)" 
                srcSet="/images/sslcommerz-760w.webp"
                type="image/webp"
              />
              <source 
                srcSet="/images/sslcommerz-1140w.webp"
                type="image/webp"
              />
              <Box
                component="img"
                src="/images/sslcommerz-380w.webp"
                alt="SSL Commerz Payment Methods"
                loading="lazy"
                decoding="async"
                width="380"
                height="43"
                sx={{
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: 'auto',
                  display: 'block',
                  margin: '0 auto'
                }}
              />
            </picture>
          </Box>

          {/* Copyright */}
          <Box sx={{ py: 3, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#666666' }}>
              © {new Date().getFullYear()} TWEEST. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;