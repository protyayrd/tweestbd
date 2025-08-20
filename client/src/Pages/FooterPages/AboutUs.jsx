import React from 'react';
import { Box, Container, Typography, Paper, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  backgroundColor: '#1a1a1a',
  color: 'white',
  borderRadius: theme.shape.borderRadius * 2,
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(3),
  }
}));

const AboutUs = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        <StyledPaper>
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
            About Us
          </Typography>
          
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3,
              color: '#69af5a',
              fontWeight: 500
            }}
          >
            Welcome to TWEEST – Where Fashion Meets Comfort and Class.
          </Typography>

          <Typography 
            variant="body1" 
            paragraph 
            sx={{ 
              mb: 3, 
              lineHeight: 2,
              color: 'rgba(255,255,255,0.9)',
              fontSize: '1.1rem'
            }}
          >
            Founded by a team of passionate Textile Engineers, TWEEST was born from a deep love for fashion, comfort, and premium design. We believe clothing should do more than just look good — it should feel good, fit well, and inspire confidence.
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
            At TWEEST, every piece is crafted with care, using luxurious, high-quality fabrics and innovative designs that blend style with ultimate comfort. From everyday essentials to standout fashion pieces, we offer a unique collection for men, women, boys, and girls — whether you&apos;re a student, a working professional, or simply someone who loves to dress well.
          </Typography>

          <Box sx={{ mt: 6, mb: 6 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                color: '#69af5a',
                mb: 3,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              What Makes TWEEST Unique?
            </Typography>
            <Grid container spacing={3}>
              {[
                { title: 'Elite Style', desc: 'Modern, fashionable looks for every lifestyle.' },
                { title: 'Comfort First', desc: 'Designs that feel as good as they look.' },
                { title: 'Premium Fabrics', desc: 'Handpicked materials for long-lasting wear.' },
                { title: 'Global Presence', desc: 'Available online and offline, serving customers worldwide.' }
              ].map((item, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box sx={{ mb: 2 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#69af5a',
                        mb: 1,
                        fontWeight: 600
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography 
                      sx={{ 
                        color: 'rgba(255,255,255,0.9)',
                        lineHeight: 1.8
                      }}
                    >
                      {item.desc}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ mt: 6 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                color: '#69af5a',
                mb: 3,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Our Mission
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                lineHeight: 2,
                color: 'rgba(255,255,255,0.9)',
                fontSize: '1.1rem'
              }}
            >
              To empower individuals through clothing that celebrates both comfort and confidence. We are committed to customer happiness and satisfaction, delivering products that exceed expectations every time.
            </Typography>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography 
              variant="body1" 
              sx={{ 
                lineHeight: 2,
                color: 'rgba(255,255,255,0.9)',
                fontSize: '1.1rem',
                fontStyle: 'italic',
                textAlign: 'center',
                mt: 6
              }}
            >
              Join the TWEEST movement — where fashion meets function, and your comfort is always in style.
            </Typography>
          </Box>
        </StyledPaper>
      </Box>
    </Container>
  );
};

export default AboutUs; 