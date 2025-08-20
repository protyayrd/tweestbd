import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { removeCartItem, updateCartItem } from "../../../Redux/Customers/Cart/Action";
import { 
  Box, 
  Button, 
  IconButton, 
  Typography, 
  Paper,
  CircularProgress,
  Divider,
  Stack
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { getImageUrl } from "../../../config/api";

const CartItem = ({ item, showButton }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const jwt = localStorage.getItem("jwt");

  // Debug: Log cart item data
  console.log('🛒 [CartItem] Rendering cart item:', {
    _id: item._id,
    productTitle: item.product?.title,
    hasComboOffer: item.hasComboOffer,
    comboOfferName: item.comboOfferName,
    comboPerUnitPrice: item.comboPerUnitPrice,
    originalPrice: item.product?.price,
    discountedPrice: item.product?.discountedPrice,
    quantity: item.quantity,
    categoryId: item.product?.category?._id,
    categoryName: item.product?.category?.name
  });
  const isGuestMode = !jwt;

  const handleRemoveItemFromCart = async () => {
    setLoading(true);
    try {
      if (isGuestMode) {
        // For guest mode, handle cart item removal locally
        const guestCartItems = JSON.parse(localStorage.getItem('guestCartItems') || '[]');
        const updatedItems = guestCartItems.filter(cartItem => 
          cartItem.productId !== item.productId || 
          cartItem.size !== item.size || 
          cartItem.color !== item.color
        );
        localStorage.setItem('guestCartItems', JSON.stringify(updatedItems));
        
        // Manually update the Redux store for immediate UI update
        // We'll use the window.location.reload() as a simple way to refresh the cart
        window.location.reload();
      } else {
        // Regular cart item removal for authenticated users
        await dispatch(removeCartItem(item._id));
      }
    } catch (error) {
      // Error will be handled by the reducer
      console.error("Error removing item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCartItem = async (change) => {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) return;

    setUpdateLoading(true);
    try {
      if (isGuestMode) {
        // For guest mode, handle quantity update locally
        const guestCartItems = JSON.parse(localStorage.getItem('guestCartItems') || '[]');
        const updatedItems = guestCartItems.map(cartItem => {
          if (cartItem.productId === item.productId && 
              cartItem.size === item.size && 
              cartItem.color === item.color) {
            return { ...cartItem, quantity: newQuantity };
          }
          return cartItem;
        });
        localStorage.setItem('guestCartItems', JSON.stringify(updatedItems));
        
        // Refresh the page to update the cart
        window.location.reload();
      } else {
        // Regular cart update for authenticated users
        await dispatch(updateCartItem({
          cartItemId: item._id,
          data: { quantity: newQuantity }
        }));
      }
    } catch (error) {
      // Error will be handled by the reducer
      console.error("Error updating item:", error);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Get product data
  const product = item.product || {};
  
  // Get image URL based on selected color
  let imageUrl = null;
  
  // First try to get product.imageUrl which is the most reliable source
  if (product.imageUrl) {
    imageUrl = getImageUrl(product.imageUrl);
  }
  
  // If we have color information, try to get the color-specific image
  if (item.color) {
    // Try to get the image from the product's selectedColorImages array
    if (product.selectedColorImages && Array.isArray(product.selectedColorImages) && product.selectedColorImages.length > 0) {
      const firstImage = product.selectedColorImages[0];
      imageUrl = getImageUrl(firstImage);
    }
    // Try to get it from the product's colors array
    else if (product.colors && Array.isArray(product.colors)) {
      const selectedColor = product.colors.find(c => c.name === item.color);
      
      if (selectedColor && selectedColor.images && selectedColor.images.length > 0) {
        const firstImage = selectedColor.images[0];
        imageUrl = getImageUrl(firstImage);
      }
    }
  }
  
  // Use a fallback image URL that doesn't require authentication
  const fallbackImage = '/images/placeholder-product.png';
  
  // Calculate prices and discounts
  const originalPrice = product.price || 0;
  const discountedPrice = product.discountedPrice || originalPrice;
  const quantity = item.quantity || 1;
  
  // Use combo pricing if available
  const effectivePrice = item.hasComboOffer ? item.comboPerUnitPrice : discountedPrice;
  const totalOriginalPrice = originalPrice * quantity;
  const totalEffectivePrice = effectivePrice * quantity;
  const totalSavings = totalOriginalPrice - totalEffectivePrice;
  
  // Calculate discount percentage based on effective price
  const discountPercentage = originalPrice > 0 
    ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) 
    : 0;

  // Calculate product discount and combo discount separately
  const productDiscount = (originalPrice - discountedPrice) * quantity;
  const comboDiscount = item.hasComboOffer ? (discountedPrice - item.comboPerUnitPrice) * quantity : 0;
  
  // Check if there's an actual promo discount applied to this item
  const promoDiscount = item.promoDiscount && item.promoDiscount > 0 ? item.promoDiscount : 0;
  const totalDiscount = productDiscount + comboDiscount + promoDiscount;
  const finalPrice = totalEffectivePrice - promoDiscount;

  // Get promo code details
  const promoDetails = item.cart?.promoDetails;
  const hasPromoCode = promoDetails?.code && promoDiscount > 0;

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        p: 3,
        mb: 2,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          borderColor: '#00503a'
        },
        bgcolor: 'background.paper'
      }}
    >
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={3}
        alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
      >
        {/* Product Image */}
        <Box 
          sx={{ 
            width: { xs: '100%', sm: 200 }, 
            height: { xs: 300, sm: 250 },
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box
            component="img"
            src={imgError || !imageUrl ? fallbackImage : imageUrl}
            alt={`${product.title} - ${item.color || ''}`}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              bgcolor: '#f5f5f5'
            }}
            onError={(e) => {
              setImgError(true);
            }}
          />
        </Box>

        {/* Product Details */}
        <Box sx={{ flex: 1 }}>
          <Stack spacing={2.5}>
            {/* Title and Remove Button */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  mb: 1,
                  color: 'black'
                }}>
                  {product.title}
                </Typography>
                <Stack direction="row" spacing={3}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#00503a',
                      fontWeight: 500
                    }}
                  >
                    Size: {item.size}
                  </Typography>
                  {item.color && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#00503a',
                        fontWeight: 500
                      }}
                    >
                      Color: {item.color}
                    </Typography>
                  )}
                </Stack>
              </Box>
              {showButton && (
                <Button
                  startIcon={loading ? <CircularProgress size={20} /> : <DeleteOutlineIcon />}
                  onClick={handleRemoveItemFromCart}
                  disabled={loading}
                  variant="outlined"
                  sx={{ 
                    borderColor: 'error.main',
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: 'error.main',
                      color: 'white',
                      borderColor: 'error.main'
                    }
                  }}
                >
                </Button>
              )}
            </Stack>

            {/* Price Display */}
            <Stack direction="column" spacing={1}>
              <Stack direction="row" alignItems="baseline" spacing={1.5}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#00503a' }}>
                  Tk. {effectivePrice.toFixed(2)}
                </Typography>
                {originalPrice > effectivePrice && (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ textDecoration: 'line-through' }}
                  >
                    Tk. {originalPrice.toFixed(2)}
                  </Typography>
                )}
                {discountPercentage > 0 && (
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: '#00503a',
                      fontWeight: 500,
                      bgcolor: '#00503a20',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1
                    }}
                  >
                    {discountPercentage}% off
                  </Typography>
                )}
              </Stack>
              {item.hasComboOffer && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#4CAF50',
                      fontWeight: 600,
                      bgcolor: '#E8F5E8',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem'
                    }}
                  >
                    🎉 COMBO OFFER
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.comboOfferName}
                  </Typography>
                </Stack>
              )}
            </Stack>

            {/* Quantity Controls */}
            {showButton && (
              <Box sx={{ position: 'relative' }}>
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Typography variant="body1" sx={{ color: 'black', fontWeight: 500 }}>
                    Quantity:
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      border: '2px solid',
                      borderColor: '#00503a',
                      borderRadius: 2,
                      bgcolor: 'background.paper'
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleUpdateCartItem(-1)}
                      disabled={updateLoading || quantity <= 1}
                      sx={{ 
                        color: '#00503a',
                        '&:hover': {
                          bgcolor: '#00503a10'
                        }
                      }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography
                      sx={{
                        px: 4,
                        py: 0.5,
                        minWidth: '40px',
                        textAlign: 'center',
                        userSelect: 'none',
                        fontWeight: 600,
                        color: '#00503a'
                      }}
                    >
                      {quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleUpdateCartItem(1)}
                      disabled={updateLoading}
                      sx={{ 
                        color: '#00503a',
                        '&:hover': {
                          bgcolor: '#00503a10'
                        }
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {updateLoading && (
                    <CircularProgress size={20} sx={{ color: '#00503a' }} />
                  )}
                </Stack>
              </Box>
            )}

            {/* Total Price Breakdown */}
            <Box sx={{ 
              mt: 1,
              p: 2.5,
              bgcolor: '#00503a08',
              borderRadius: 2,
              border: '1px solid',
              borderColor: '#00503a20'
            }}>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body1" sx={{ color: 'black', fontWeight: 500 }}>
                    Subtotal ({quantity} {quantity === 1 ? 'item' : 'items'})
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'black', fontWeight: 500 }}>
                    Tk. {totalOriginalPrice.toFixed(2)}
                  </Typography>
                </Stack>

                {productDiscount > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body1" sx={{ color: '#00503a', fontWeight: 500 }}>
                      Product Discount
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#00503a', fontWeight: 500 }}>
                      -Tk. {productDiscount.toFixed(2)}
                    </Typography>
                  </Stack>
                )}

                {comboDiscount > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body1" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                      Combo Offer Savings
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                      -Tk. {comboDiscount.toFixed(2)}
                    </Typography>
                  </Stack>
                )}

                {promoDiscount > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body1" sx={{ color: '#00503a', fontWeight: 500 }}>
                      Coupon Discount
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#00503a', fontWeight: 500 }}>
                      -Tk. {promoDiscount.toFixed(2)}
                    </Typography>
                  </Stack>
                )}

                <Divider sx={{ borderColor: '#00503a20' }} />

                <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'black' }}>
                      Final Price
                    </Typography>
                    {totalDiscount > 0 && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#00503a',
                          fontWeight: 500
                        }}
                      >
                        You save {Math.round((totalDiscount / totalOriginalPrice) * 100)}% (Tk. {totalDiscount.toFixed(2)})
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#00503a' }}>
                    Tk. {finalPrice.toFixed(2)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

export default CartItem;
