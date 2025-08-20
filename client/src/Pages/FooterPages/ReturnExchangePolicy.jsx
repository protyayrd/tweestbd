import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import LocalShipping from '@mui/icons-material/LocalShipping';
import Refresh from '@mui/icons-material/Refresh';
import Warning from '@mui/icons-material/Warning';

const ReturnExchangePolicy = () => {
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
                Return & Exchange Policy
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
                At TWEEST, we want you to be completely satisfied with your purchase. We offer hassle-free returns and exchanges to ensure your shopping experience is perfect.
              </Typography>

              <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Refresh sx={{ color: '#69af5a', mr: 2 }} />
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
                    Return Policy
                  </Typography>
                </Box>
                <Box component="ul" sx={{ pl: 2, color: 'rgba(255,255,255,0.9)', mb: 3 }}>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    7-day return window from the date of delivery
                  </Typography>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    Items must be unused and in original packaging
                  </Typography>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    Tags and labels must be intact
                  </Typography>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    Full refund including shipping costs for defective items
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
                    Exchange Process
                  </Typography>
                </Box>
                <Box component="ul" sx={{ pl: 2, color: 'rgba(255,255,255,0.9)', mb: 3 }}>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    Free size exchanges within 7 days
                  </Typography>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    Subject to size availability
                  </Typography>
                  <Typography component="li" sx={{ mb: 1, lineHeight: 2 }}>
                    We cover shipping costs for exchanges
                  </Typography>
                </Box>
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
                    How to Request
                  </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    lineHeight: 2,
                    color: 'rgba(255,255,255,0.9)'
                  }}
                >
                  Contact our customer service team at{' '}
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
                  {' '}or WhatsApp at{' '}
                  <Box 
                    component="a" 
                    href="https://wa.me/8801611101430" 
                    target="_blank"
                    rel="noopener noreferrer"
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

export default ReturnExchangePolicy; 