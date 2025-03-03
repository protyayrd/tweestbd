import { Box, Grid, Typography, Chip, Badge, CircularProgress, Divider } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import AdjustIcon from "@mui/icons-material/Adjust";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StarIcon from "@mui/icons-material/Star";
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { API_BASE_URL } from "../../../config/api";

const OrderCard = ({ item, order }) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Debug logs to see what data we're working with
  console.log("Order Item:", JSON.stringify(item, null, 2));
  console.log("Order:", JSON.stringify(order, null, 2));
  
  // Get product details
  const product = item?.product || {};
  const selectedColor = item?.color || '';
  
  // More robust approach to image URL construction
  let imageUrl = '';
  
  // Function to properly format image URL
  const formatImageUrl = (url) => {
    if (!url) return '';
    
    // If it's already an absolute URL, return it as is
    if (url.startsWith('http')) return url;
    
    // Remove any leading slashes
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    
    // Construct the full URL
    return `${API_BASE_URL}/${cleanUrl}`;
  };
  
  // Try to get the image URL from the product's color-specific images first
  if (selectedColor && product?.colors && Array.isArray(product.colors)) {
    const colorObj = product.colors.find(c => 
      c && c.name && c.name.toLowerCase() === selectedColor.toLowerCase()
    );
    
    if (colorObj && colorObj.images && colorObj.images.length > 0) {
      imageUrl = formatImageUrl(colorObj.images[0]);
      console.log("Using color-specific image:", imageUrl);
    }
  }
  
  // If no color-specific image, try the product's main image
  if (!imageUrl && product?.imageUrl) {
    imageUrl = formatImageUrl(product.imageUrl);
    console.log("Using product's main image:", imageUrl);
  }
  
  // If still no image, try the product's images array
  if (!imageUrl && product?.images && Array.isArray(product.images) && product.images.length > 0) {
    imageUrl = formatImageUrl(product.images[0]);
    console.log("Using product's images array:", imageUrl);
  }
  
  // If the product has a thumbnail, use that as a last resort
  if (!imageUrl && product?.thumbnail) {
    imageUrl = formatImageUrl(product.thumbnail);
    console.log("Using product's thumbnail:", imageUrl);
  }
  
  // Absolute URL for fallback image
  const fallbackImage = 'https://via.placeholder.com/80x80?text=No+Image';
  
  console.log("Final Image URL:", imageUrl);
  
  // Calculate prices and discounts
  const originalPrice = item?.price || 0;
  const discountedPrice = item?.discountedPrice || originalPrice;
  const quantity = item?.quantity || 1;
  const totalOriginalPrice = originalPrice * quantity;
  const totalDiscountedPrice = discountedPrice * quantity;
  
  // Check for promo code discount
  const promoDiscount = order?.promoCodeDiscount || 0;
  const promoCode = order?.promoDetails?.code || '';
  const hasPromoCode = promoCode || promoDiscount > 0;
  
  // Calculate final price after promo discount
  const finalPrice = Math.max(0, totalDiscountedPrice - promoDiscount);
  
  // Calculate discount percentage
  const discountPercentage = originalPrice > 0 
    ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) 
    : 0;
  
  // Handle image load
  const handleImageLoad = () => {
    setLoading(false);
  };
  
  // Enhanced color rendering with direct HTML for better visibility
  const renderColorSwatch = (colorName) => {
    if (!colorName) return null;
    
    // Map of common color names to hex values
    const colorMap = {
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'yellow': '#FFFF00',
      'purple': '#800080',
      'orange': '#FFA500',
      'pink': '#FFC0CB',
      'gray': '#808080',
      'brown': '#A52A2A',
      'navy': '#000080',
      'teal': '#008080',
      'maroon': '#800000',
      'olive': '#808000',
      'silver': '#C0C0C0',
      'gold': '#FFD700',
      'beige': '#F5F5DC',
      'ivory': '#FFFFF0',
      'khaki': '#F0E68C',
      'lavender': '#E6E6FA',
      'cyan': '#00FFFF',
      'magenta': '#FF00FF',
      'indigo': '#4B0082',
      'violet': '#EE82EE',
      'turquoise': '#40E0D0',
      'coral': '#FF7F50',
      'crimson': '#DC143C',
      'aqua': '#00FFFF',
      'lime': '#00FF00',
      'fuchsia': '#FF00FF',
    };
    
    const colorKey = colorName.toLowerCase();
    const backgroundColor = colorMap[colorKey] || colorName;
    
    // Special handling for white color
    const isWhite = colorKey === 'white' || backgroundColor === '#FFFFFF' || backgroundColor === '#fff';
    
    // Create a direct HTML element for the color swatch
    return (
      <div 
        style={{
          backgroundColor: backgroundColor,
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          display: 'inline-block',
          marginRight: '8px',
          border: isWhite ? '2px solid #aaa' : 'none',
          boxShadow: '0 0 5px rgba(0,0,0,0.6)',
          verticalAlign: 'middle'
        }}
      />
    );
  };
  
  // Use useEffect to log when component mounts or updates with more detailed information
  useEffect(() => {
    console.log("OrderCard rendered with item:", JSON.stringify(item, null, 2));
    console.log("Selected color:", selectedColor);
    console.log("Image URL:", imageUrl);
    
    // Log product structure to help debug
    if (product) {
      console.log("Product structure:", {
        hasImageUrl: !!product.imageUrl,
        hasImages: !!(product.images && product.images.length > 0),
        hasColors: !!(product.colors && product.colors.length > 0),
        hasThumbnail: !!product.thumbnail
      });
    }
    
    // Check if the selected color exists in product colors
    if (selectedColor && product?.colors) {
      const colorExists = product.colors.some(c => 
        c && c.name && c.name.toLowerCase() === selectedColor.toLowerCase()
      );
      console.log(`Selected color "${selectedColor}" exists in product colors: ${colorExists}`);
    }
  }, [item, selectedColor, imageUrl, product]);
  
  return (
    <Box className="p-5 shadow-lg hover:shadow-2xl border" sx={{ 
      backgroundColor: '#ffffff', 
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
      }
    }}>
      <Grid spacing={2} container sx={{ justifyContent: "space-between" }}>
        <Grid item xs={6}>
          <div
            onClick={() => navigate(`/account/order/${order?._id}`)}
            className="flex cursor-pointer"
          >
            {/* Image with loading state and fallback */}
            <Box
              sx={{
                width: "5rem",
                height: "5rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                borderRadius: "4px",
                border: "1px solid #ddd",
                backgroundColor: "#f9f9f9",
                position: "relative"
              }}
            >
              {loading && !imgError && (
                <CircularProgress size={24} sx={{ position: 'absolute', zIndex: 1 }} />
              )}
              <img
                src={imgError ? fallbackImage : (imageUrl || fallbackImage)}
                alt={product?.title || "Product image"}
                onLoad={handleImageLoad}
                onError={(e) => {
                  console.error("Image failed to load:", imageUrl);
                  console.error("Image error event:", e);
                  setImgError(true);
                  setLoading(false);
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  opacity: loading ? 0.5 : 1,
                  transition: 'opacity 0.3s ease'
                }}
              />
            </Box>
            
            <div className="ml-5">
              <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 0.5 }}>
                {product?.title || 'Product'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <span>Size: {item?.size || 'N/A'}</span>
              </Typography>
              
              {selectedColor && (
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  {renderColorSwatch(selectedColor)}
                  <span>Color: {selectedColor}</span>
                </Typography>
              )}
              
              <Typography variant="body2" color="text.secondary">
                <span>Quantity: {quantity}</span>
              </Typography>
            </div>
          </div>
        </Grid>

        <Grid item xs={2}>
          {/* Unit price */}
          <Typography fontWeight="bold">
            Tk. {discountedPrice}
          </Typography>
          
          {originalPrice > discountedPrice && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ textDecoration: 'line-through' }}
            >
              Tk. {originalPrice}
            </Typography>
          )}
          
          {discountPercentage > 0 && (
            <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 'medium' }}>
              Save {discountPercentage}%
            </Typography>
          )}
          
          <Divider sx={{ my: 1 }} />
          
          {/* Total price with quantity */}
          <Typography variant="body2" fontWeight="medium">
            Subtotal: Tk. {totalDiscountedPrice}
          </Typography>
          
          {/* Promo code discount if available */}
          {hasPromoCode && (
            <Box sx={{ mt: 0.5 }}>
              {promoCode && (
                <Chip 
                  icon={<LocalOfferIcon fontSize="small" />}
                  label={promoCode}
                  size="small"
                  sx={{ 
                    mb: 0.5, 
                    fontSize: '0.7rem',
                    backgroundColor: '#000',
                    color: '#fff',
                    '& .MuiChip-icon': {
                      color: '#fff'
                    }
                  }}
                />
              )}
              {promoDiscount > 0 && (
                <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 'medium', fontSize: '0.8rem' }}>
                  Promo discount: -Tk. {promoDiscount}
                </Typography>
              )}
            </Box>
          )}
          
          {/* Final price after promo discount */}
          {promoDiscount > 0 && (
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 0.5, borderTop: '1px dashed #ddd', pt: 0.5 }}>
              Final: Tk. {finalPrice}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={4}>
          <Box sx={{ 
            p: 1.5, 
            backgroundColor: '#f5f5f5', 
            borderRadius: '4px',
            border: '1px solid #eee'
          }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              {order?.orderStatus === "DELIVERED" ? (
               <>
                 <FiberManualRecordIcon
                    sx={{ width: "15px", height: "15px", color: "#4CAF50" }}
                    className="p-0 mr-2 text-sm"
                  />
                  <span>Delivered On {new Date(order.deliveryDate || order.updatedAt || order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
               </>
              ) : (
                <>
                  <AdjustIcon
                    sx={{ 
                      width: "15px", 
                      height: "15px",
                      color: order?.orderStatus === "CANCELLED" ? "#F44336" : "#4CAF50"
                    }}
                    className="p-0 mr-2 text-sm"
                  />
                  <span>
                    {order?.orderStatus === "CONFIRMED" && "Order Confirmed"}
                    {order?.orderStatus === "PLACED" && "Order Placed"}
                    {order?.orderStatus === "SHIPPED" && "Order Shipped"}
                    {order?.orderStatus === "CANCELLED" && "Order Cancelled"}
                  </span>
                </>
              )}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {order?.orderStatus === "DELIVERED" && "Your Item Has Been Delivered"}
              {order?.orderStatus === "CONFIRMED" && "Your Order Has Been Confirmed"}
              {order?.orderStatus === "PLACED" && "Your Order Has Been Placed"}
              {order?.orderStatus === "SHIPPED" && "Your Order Is On The Way"}
              {order?.orderStatus === "CANCELLED" && "Your Order Has Been Cancelled"}
            </Typography>
            
            {order?.orderStatus === "DELIVERED" && (
              <Box
                onClick={() => navigate(`/account/rate/${product?._id}`)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: '#000',
                  backgroundColor: '#f0f0f0',
                  p: 1,
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#000',
                    color: '#fff'
                  }
                }}
              >
                <StarIcon sx={{ fontSize: "1.5rem", mr: 1 }} />
                <Typography variant="body2" fontWeight="medium">Rate & Review Product</Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderCard;
