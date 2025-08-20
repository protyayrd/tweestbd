import {
  Box,
  Grid,
  Typography,
  Chip,
  CircularProgress,
  Button,
  useMediaQuery
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import AdjustIcon from "@mui/icons-material/Adjust";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { API_BASE_URL } from '../../../config/api';
import { useTheme } from "@mui/material/styles";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const OrderCard = ({ item, order }) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const product = item?.product || {};
  const selectedColor = item?.color || '';

  const formatImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${API_BASE_URL}/${cleanUrl}`;
  };

  let imageUrl = '';

  if (selectedColor && product?.colors && Array.isArray(product.colors)) {
    const colorObj = product.colors.find(c =>
      c?.name?.toLowerCase() === selectedColor.toLowerCase()
    );
    if (colorObj?.images?.length > 0) {
      imageUrl = formatImageUrl(colorObj.images[0]);
    }
  }

  if (!imageUrl && product?.imageUrl) {
    imageUrl = formatImageUrl(product.imageUrl);
  }

  if (!imageUrl && Array.isArray(product?.images) && product.images.length > 0) {
    imageUrl = formatImageUrl(product.images[0]);
  }

  if (!imageUrl && product?.thumbnail) {
    imageUrl = formatImageUrl(product.thumbnail);
  }

  const fallbackImage = 'https://via.placeholder.com/80x80?text=No+Image';

  const originalPrice = item?.price || 0;
  const discountedPrice = item?.discountedPrice || originalPrice;
  const quantity = item?.quantity || 1;
  const totalOriginalPrice = originalPrice * quantity;
  const totalDiscountedPrice = discountedPrice * quantity;

  const promoDiscount = order?.promoCodeDiscount || 0;
  const promoCode = order?.promoDetails?.code || '';
  const hasPromoCode = promoCode || promoDiscount > 0;

  const finalPrice = Math.max(0, totalDiscountedPrice - promoDiscount);

  const discountPercentage = originalPrice > 0
    ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
    : 0;

  const handleImageLoad = () => {
    setLoading(false);
  };

  const renderColorSwatch = (colorName) => {
    if (!colorName) return null;
    const colorMap = {
      black: '#000', white: '#fff', red: '#f00', blue: '#00f', green: '#080',
      yellow: '#ff0', purple: '#800080', orange: '#ffa500', pink: '#ffc0cb',
      gray: '#808080', brown: '#a52a2a', navy: '#000080', teal: '#008080',
      maroon: '#800000', olive: '#808000', silver: '#c0c0c0', gold: '#ffd700'
    };
    const backgroundColor = colorMap[colorName.toLowerCase()] || colorName;
    const isWhite = backgroundColor.toLowerCase() === '#fff' || backgroundColor.toLowerCase() === 'white';

    return (
      <Box
        sx={{
          backgroundColor,
          width: 16,
          height: 16,
          borderRadius: '50%',
          marginRight: 1,
          border: isWhite ? '1px solid #ccc' : 'none',
        }}
      />
    );
  };

  const getStatusColor = () => {
    switch (order?.orderStatus) {
      case 'CONFIRMED': return '#00503a';
      case 'PLACED': return '#00503a';
      case 'SHIPPED': return '#00503a';
      case 'DELIVERED': return '#4CAF50';
      case 'CANCELLED': return '#F44336';
      default: return '#757575';
    }
  };
  
  const getStatusBgColor = () => {
    switch (order?.orderStatus) {
      case 'CONFIRMED': return '#00503a15';
      case 'PLACED': return '#00503a15';
      case 'SHIPPED': return '#00503a15';
      case 'DELIVERED': return '#4CAF5015';
      case 'CANCELLED': return '#F4433615';
      default: return '#75757515';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={5}>
          <Box sx={{ display: 'flex' }}>
            <Box
              onClick={() => navigate(product?.slug ? `/product/${product.slug}` : `/product/${product?._id}`)}
              sx={{
                width: 100,
                height: 100,
                overflow: 'hidden',
                borderRadius: 2,
                border: '1px solid #eee',
                backgroundColor: '#f9f9fa',
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
            >
              {loading && !imgError && (
                <CircularProgress size={20} sx={{ position: 'absolute', top: '40%', left: '40%', color: '#00503a' }} />
              )}
              <img
                src={imgError ? fallbackImage : imageUrl || fallbackImage}
                alt={product?.title || 'Product'}
                onLoad={handleImageLoad}
                onError={() => {
                  setImgError(true);
                  setLoading(false);
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: loading ? 0.5 : 1
                }}
              />
            </Box>
            <Box sx={{ ml: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{ 
                  cursor: 'pointer', 
                  fontWeight: 500,
                  '&:hover': { color: '#00503a' },
                  transition: 'color 0.2s'
                }}
                                onClick={() => navigate(product?.slug ? `/product/${product.slug}` : `/product/${product?._id}`)}
                >
                  {product?.title || 'Product'}
                </Typography>
              
              {item?.size && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Size: {item.size}</Typography>
              )}
              
              {selectedColor && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                  {renderColorSwatch(selectedColor)} {selectedColor}
                </Typography>
              )}
              
              <Typography variant="body2" sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>Qty:</Box> 
                <Box component="span" sx={{ fontWeight: 500 }}>{quantity}</Box>
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3} md={3}>
          <Box>
            <Typography fontWeight={600} sx={{ color: '#00503a' }}>
              Tk. {discountedPrice}
            </Typography>
            
            {originalPrice > discountedPrice && (
              <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                Tk. {originalPrice}
              </Typography>
            )}
            
            {discountPercentage > 0 && (
              <Chip 
                label={`${discountPercentage}% OFF`} 
                size="small" 
                sx={{ 
                  backgroundColor: '#4CAF5015', 
                  color: '#4CAF50',
                  border: '1px solid #4CAF5030',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  mt: 0.5
                }} 
              />
            )}
            
            {hasPromoCode && (
              <Box mt={1}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocalOfferIcon sx={{ fontSize: '0.9rem', color: '#00503a', mr: 0.5 }} />
                  <Typography variant="caption" sx={{ color: '#00503a' }}>
                    {promoCode ? `Promo: ${promoCode}` : 'Promo applied'}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 500, mt: 0.5 }}>
                  -Tk. {promoDiscount}
                </Typography>
              </Box>
            )}
            
            {hasPromoCode && (
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#00503a', mt: 0.5 }}>
                Total: Tk. {finalPrice}
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid item xs={6} sm={3} md={4}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: isMobile ? 'flex-end' : 'flex-start',
            height: '100%',
            justifyContent: 'space-between'
          }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                p: 1,
                borderRadius: 1,
                bgcolor: getStatusBgColor(),
                mb: 1
              }}
            >
              {order?.orderStatus === 'DELIVERED' ? (
                <FiberManualRecordIcon sx={{ fontSize: 14, color: getStatusColor(), mr: 1 }} />
              ) : (
                <AdjustIcon sx={{ fontSize: 14, color: getStatusColor(), mr: 1 }} />
              )}
              <Typography variant="body2" sx={{ color: getStatusColor(), fontWeight: 600 }}>
                {{
                  'CONFIRMED': "Order Confirmed",
                  'PLACED': "Order Placed",
                  'SHIPPED': "Order Shipped",
                  'DELIVERED': "Delivered",
                  'CANCELLED': "Cancelled"
                }[order?.orderStatus] || order?.orderStatus}
              </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary">
              {{
                'DELIVERED': `Delivered on ${new Date(order?.deliveryDate || order?.updatedAt || order?.createdAt).toLocaleDateString()}`,
                'SHIPPED': "On the way",
                'CANCELLED': "Order has been cancelled"
              }[order?.orderStatus] || ""}
            </Typography>

            <Button 
              size="small" 
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(product?.slug ? `/product/${product.slug}` : `/product/${product?._id}`)}
              sx={{ 
                mt: 2, 
                color: '#00503a', 
                textTransform: 'none',
                borderColor: '#00503a',
                '&:hover': {
                  backgroundColor: '#00503a10',
                }
              }}
            >
              Track Order
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderCard;
