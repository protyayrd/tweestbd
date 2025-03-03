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

  const handleRemoveItemFromCart = async () => {
    setLoading(true);
    try {
      await dispatch(removeCartItem(item._id));
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCartItem = async (change) => {
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) return;

    setUpdateLoading(true);
    try {
      await dispatch(updateCartItem({
        cartItemId: item._id,
        data: { quantity: newQuantity }
      }));
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Get product data
  const product = item.product || {};
  const imageUrl = product.imageUrl ? getImageUrl(product.imageUrl) : null;
  const fallbackImage = '/images/placeholder.png';
  
  // Calculate prices and discounts
  const originalPrice = product.price || 0;
  const discountedPrice = product.discountedPrice || originalPrice;
  const quantity = item.quantity || 1;
  const totalOriginalPrice = originalPrice * quantity;
  const totalDiscountedPrice = discountedPrice * quantity;
  const totalSavings = totalOriginalPrice - totalDiscountedPrice;
  const discountPercentage = originalPrice > 0 
    ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) 
    : 0;

  // These values should only be used for the mobile view detailed breakdown
  const productDiscount = totalOriginalPrice - totalDiscountedPrice;
  
  // Check if there's an actual promo discount applied to this item
  const promoDiscount = item.promoDiscount && item.promoDiscount > 0 ? item.promoDiscount : 0;
  const totalDiscount = productDiscount + promoDiscount;
  const finalPrice = totalDiscountedPrice - promoDiscount;

  // Get promo code details
  const promoDetails = item.cart?.promoDetails;
  const hasPromoCode = promoDetails?.code && promoDiscount > 0;

  console.log('Rendering cart item:', {
    id: item._id,
    color: item.color,
    imageUrl,
    originalPrice,
    discountedPrice,
    totalOriginalPrice,
    totalDiscountedPrice,
    discountPercentage
  });

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderColor: 'divider'
        },
        bgcolor: 'background.paper'
      }}
    >
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
      >
        {/* Product Image */}
        <Box 
          sx={{ 
            width: { xs: '100%', sm: 120 }, 
            height: { xs: 200, sm: 120 },
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box
            component="img"
            src={imgError || !imageUrl ? fallbackImage : imageUrl}
            alt={product.title || 'Product image'}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={() => setImgError(true)}
          />
        </Box>

        {/* Product Details */}
        <Box sx={{ flex: 1 }}>
          <Stack spacing={2}>
            {/* Title and Remove Button */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
                  {product.title}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Size: {item.size}
                  </Typography>
                  {item.color && (
                    <Typography variant="body2" color="text.secondary">
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
                  color="error"
                  sx={{ minWidth: 'auto' }}
                >
                  Remove
                </Button>
              )}
            </Stack>

            {/* Price Display */}
            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Tk. {discountedPrice.toFixed(2)}
              </Typography>
              {originalPrice > discountedPrice && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textDecoration: 'line-through' }}
                >
                  Tk. {originalPrice.toFixed(2)}
                </Typography>
              )}
              {discountPercentage > 0 && (
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                  ({discountPercentage}% off)
                </Typography>
              )}
            </Stack>

            {/* Total Price Display */}
            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Total:
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Tk. {totalDiscountedPrice.toFixed(2)}
              </Typography>
              {totalSavings > 0 && (
                <>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textDecoration: 'line-through' }}
                  >
                    Tk. {totalOriginalPrice.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                    (Save Tk. {totalSavings.toFixed(2)})
                  </Typography>
                </>
              )}
            </Stack>

            {/* Quantity Controls */}
            {showButton && (
              <Box sx={{ position: 'relative' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Quantity:
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.paper'
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleUpdateCartItem(-1)}
                      disabled={updateLoading || quantity <= 1}
                      sx={{ color: 'text.primary' }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <Typography
                      sx={{
                        px: 3,
                        py: 0.5,
                        minWidth: '40px',
                        textAlign: 'center',
                        userSelect: 'none'
                      }}
                    >
                      {quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleUpdateCartItem(1)}
                      disabled={updateLoading}
                      sx={{ color: 'text.primary' }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {updateLoading && (
                    <CircularProgress size={20} />
                  )}
                </Stack>
              </Box>
            )}

            {/* Total Price Breakdown */}
            <Box sx={{ 
              mt: 1,
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1
            }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Subtotal ({quantity} {quantity === 1 ? 'item' : 'items'})
                  </Typography>
                  <Typography variant="body2">
                    Tk. {totalOriginalPrice.toFixed(2)}
                  </Typography>
                </Stack>

                {item.productDiscount > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="success.main">
                      Product Discount
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      -Tk. {productDiscount.toFixed(2)}
                    </Typography>
                  </Stack>
                )}

                {promoDiscount > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="success.main">
                      Coupon Discount
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      -Tk. {promoDiscount.toFixed(2)}
                    </Typography>
                  </Stack>
                )}

                <Divider />

                <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Final Price
                    </Typography>
                    {totalDiscount > 0 && (
                      <Typography variant="caption" color="success.main">
                        You save {Math.round((totalDiscount / totalOriginalPrice) * 100)}% (Tk. {totalDiscount.toFixed(2)})
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="subtitle1" fontWeight="bold">
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
