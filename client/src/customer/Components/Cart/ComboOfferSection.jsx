import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Collapse,
  IconButton,
  Divider,
  Alert,
  LinearProgress,
  Stack
} from '@mui/material';
import OfferIcon from '@mui/icons-material/LocalOffer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarIcon from '@mui/icons-material/Star';
import CartIcon from '@mui/icons-material/ShoppingCart';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { keyframes } from '@mui/system';
import { useNavigate } from 'react-router-dom';

// Animated gradient keyframe
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Pulse animation for the offer badge
const pulseAnimation = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
`;

const ComboOfferSection = ({ 
  appliedOffers = [], 
  potentialSavings = [], 
  totalComboDiscount = 0,
  comboOfferDiscounts = []
}) => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const formatCurrency = (amount) => `৳${Number(amount).toFixed(0)}`;

  // Don't render if no combo offers are applicable
  if (appliedOffers.length === 0 && potentialSavings.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      {/* Applied Combo Offers */}
      {appliedOffers.length > 0 && (
        <Card
          elevation={0}
          sx={{
            mb: 2,
            background: 'linear-gradient(-45deg, #4CAF50, #8BC34A, #CDDC39, #4CAF50)',
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
              borderRadius: 'inherit'
            },
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                  animation: `${pulseAnimation} 2s infinite`,
                  mr: 2,
                }}
              >
                <CelebrationIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="700" sx={{ color: '#1a1a1a', fontSize: '1.1rem' }}>
                  🎉 COMBO OFFERS APPLIED!
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                  You&apos;re saving {formatCurrency(totalComboDiscount)} with combo pricing!
                </Typography>
              </Box>

              <Chip
                label={`-${formatCurrency(totalComboDiscount)}`}
                sx={{
                  backgroundColor: '#E8F5E8',
                  color: '#2E7D2E',
                  fontWeight: 'bold',
                  fontSize: '0.85rem'
                }}
              />
            </Box>

            {/* Applied Offers Details */}
            <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 2, p: 2 }}>
              {comboOfferDiscounts.map((discount, index) => (
                <Box key={index} sx={{ mb: index < comboOfferDiscounts.length - 1 ? 2 : 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" fontWeight="600" color="text.primary">
                      {discount.offerName}
                    </Typography>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      -{formatCurrency(discount.totalDiscount)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    {discount.categoryName} • {discount.totalQuantity} items at {formatCurrency(discount.perUnitComboPrice)} each
                  </Typography>
                  
                  {index < comboOfferDiscounts.length - 1 && (
                    <Divider sx={{ mt: 1 }} />
                  )}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Potential Savings */}
      {potentialSavings.length > 0 && (
        <Card
          elevation={0}
          sx={{
            mb: 2,
            background: 'linear-gradient(-45deg, #FF9800, #FFC107, #FFEB3B, #FF9800)',
            backgroundSize: '400% 400%',
            animation: `${gradientAnimation} 20s ease infinite`,
            border: '2px solid transparent',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 'inherit'
            }
          }}
        >
          <CardContent sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #FF9800, #FFC107)',
                  animation: `${pulseAnimation} 2s infinite`,
                  mr: 2,
                }}
              >
                <TrendingUpIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight="700" sx={{ color: '#1a1a1a', fontSize: '1.1rem' }}>
                  💡 UNLOCK MORE SAVINGS!
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
                  Add a few more items to activate combo pricing
                </Typography>
              </Box>

              <IconButton
                onClick={() => toggleSection('potential')}
                sx={{ color: '#666' }}
              >
                {expandedSections.potential ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={expandedSections.potential}>
              <Box sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 2, p: 2 }}>
                {potentialSavings.map((saving, index) => (
                  <Box key={index} sx={{ mb: index < potentialSavings.length - 1 ? 3 : 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" fontWeight="600" color="text.primary">
                        {saving.offerName}
                      </Typography>
                      <Chip
                        label={`Save ${formatCurrency(saving.totalPotentialSavings)}`}
                        size="small"
                        sx={{
                          backgroundColor: '#FFF3E0',
                          color: '#E65100',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      {saving.categoryName} • Need {saving.itemsNeeded} more item{saving.itemsNeeded > 1 ? 's' : ''}
                    </Typography>
                    
                    {/* Progress Bar */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Progress: {saving.currentQuantity}/{saving.minimumQuantity} items
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round((saving.currentQuantity / saving.minimumQuantity) * 100)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(saving.currentQuantity / saving.minimumQuantity) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#FF9800',
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CartIcon />}
                        onClick={() => navigate(`/products?category=${saving.categorySlug || saving.categoryId}`)}
                        sx={{
                          backgroundColor: '#FF9800',
                          color: 'white',
                          fontWeight: 'bold',
                          borderRadius: 2,
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: '#F57C00'
                          }
                        }}
                      >
                        Shop {saving.categoryName}
                      </Button>
                    </Box>
                    
                    {index < potentialSavings.length - 1 && (
                      <Divider sx={{ mt: 2 }} />
                    )}
                  </Box>
                ))}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ComboOfferSection; 