import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  LinearProgress,
  Alert,
  Badge,
  Grow,
  Collapse,
  IconButton
} from '@mui/material';
import OfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import CartIcon from '@mui/icons-material/ShoppingCart';
import { keyframes } from '@mui/system';
import api from '../../../../config/api';

// Animated gradient keyframe
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Pulse animation for the offer badge
const pulseAnimation = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(255, 193, 7, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
`;

const ComboOfferBanner = ({ productCategory, productPrice = 0 }) => {
  const [comboOffer, setComboOffer] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productCategory) {
      fetchComboOffer();
    }
  }, [productCategory]);

  const fetchComboOffer = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/combo-offers/category/${productCategory._id}`);
      if (response.data.success) {
        setComboOffer(response.data.data);
      }
    } catch (error) {
      // Silently handle - combo offer might not exist for this category
      console.log('No combo offer found for this category');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !comboOffer || !isVisible) {
    return null;
  }

  const perUnitPrice = comboOffer.comboPrice / comboOffer.minimumQuantity;
  const savingsPerUnit = productPrice - perUnitPrice;
  const savingsPercentage = ((savingsPerUnit / productPrice) * 100).toFixed(0);
  const totalSavings = savingsPerUnit * comboOffer.minimumQuantity;

  return (
    <Grow in={isVisible} timeout={800}>
      <Box sx={{ position: 'relative', mb: 3 }}>
        <Card
          elevation={0}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(-45deg, #FF6B6B, #4ECDC4, #45B7D1, #FFA07A)',
            backgroundSize: '400% 400%',
            animation: `${gradientAnimation} 15s ease infinite`,
            border: '2px solid transparent',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            },
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={() => setIsVisible(false)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
              },
              width: 28,
              height: 28,
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <CardContent sx={{ position: 'relative', zIndex: 1, pt: 2, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {/* Animated offer badge */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #FFC107, #FF9800)',
                  animation: `${pulseAnimation} 2s infinite`,
                  mr: 2,
                }}
              >
                <OfferIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h6" 
                  fontWeight="700" 
                  sx={{ 
                    color: '#1a1a1a',
                    fontSize: '1.1rem',
                    lineHeight: 1.2,
                  }}
                >
                  🔥 COMBO OFFER AVAILABLE!
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#666', 
                    fontSize: '0.9rem',
                    mt: 0.5 
                  }}
                >
                  Buy {comboOffer.minimumQuantity}+ items & save big!
                </Typography>
              </Box>

              {/* Savings badge */}
              <Chip
                label={`৳${totalSavings}`}
                sx={{
                  backgroundColor: '#E8F5E8',
                  color: '#2E7D2E',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  height: 32,
                  '& .MuiChip-label': {
                    px: 2,
                  },
                }}
              />
            </Box>

            {/* Pricing comparison */}
            <Box 
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: 2,
                p: 2,
                mb: 2,
                border: '1px solid rgba(0, 0, 0, 0.1)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Single Item Price:
                </Typography>
                <Typography variant="body1" sx={{ textDecoration: 'line-through', color: '#999' }}>
                  ৳{productPrice}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Combo Price (each):
                </Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  ৳{perUnitPrice.toFixed(0)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  You Save:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" color="success.main" fontWeight="bold">
                    ৳{savingsPerUnit.toFixed(0)}
                  </Typography>
                  <Chip 
                    label={`${savingsPercentage}% OFF`}
                    size="small"
                    sx={{ 
                      backgroundColor: '#FFE0B2',
                      color: '#E65100',
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      height: 24,
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Expandable details */}
            <Button
              variant="text"
              onClick={() => setIsExpanded(!isExpanded)}
              startIcon={<InfoIcon />}
              sx={{
                color: '#666',
                fontSize: '0.8rem',
                p: 0,
                minHeight: 'auto',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#333',
                },
              }}
            >
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </Button>

            <Collapse in={isExpanded}>
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>{comboOffer.name}</strong>
                </Typography>
                {comboOffer.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {comboOffer.description}
                  </Typography>
                )}
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Pricing breakdown:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Buy {comboOffer.minimumQuantity} items: ৳{comboOffer.comboPrice} total
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Buy 3 items: ৳{(perUnitPrice * 3).toFixed(0)} total
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Buy 4 items: ৳{(perUnitPrice * 4).toFixed(0)} total
                  </Typography>
                </Box>

                <Alert 
                  severity="info" 
                  sx={{ 
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    border: '1px solid rgba(33, 150, 243, 0.2)',
                    '& .MuiAlert-icon': {
                      color: '#1976d2',
                    },
                  }}
                >
                  <Typography variant="caption">
                    Offer applies automatically when you add {comboOffer.minimumQuantity} or more items of this category to your cart!
                  </Typography>
                </Alert>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Box>
    </Grow>
  );
};

export default ComboOfferBanner; 