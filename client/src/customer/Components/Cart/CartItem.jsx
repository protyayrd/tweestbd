import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { removeCartItem, updateCartItem } from "../../../Redux/Customers/Cart/Action";
import { 
  Box, 
  Button, 
  IconButton, 
  Typography, 
  Paper,
  CircularProgress
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { getImageUrl } from "../../../config/api";

const CartItem = ({ item, showButton }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Get the image URL for the selected color
  const getItemImage = () => {
    if (item?.product?.colors && item?.color) {
      const colorData = item.product.colors.find(c => c.name === item.color);
      if (colorData && colorData.images && colorData.images.length > 0) {
        return getImageUrl(colorData.images[0]);
      }
    }
    // Fallback to product's main image if color image not found
    return item?.product?.imageUrl ? getImageUrl(item.product.imageUrl) : "";
  };

  const handleRemoveItemFromCart = async () => {
    try {
      setLoading(true);
      await dispatch(removeCartItem(item?._id));
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCartItem = async (num) => {
    try {
      setUpdateLoading(true);
      const newQuantity = item.quantity + num;
      if (newQuantity > 0) {
        await dispatch(updateCartItem(item?._id, { quantity: newQuantity }));
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: '1px solid #e0e0e0',
          '&:hover': {
            borderColor: '#bdbdbd'
          }
        }}
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box 
            sx={{ 
              width: { xs: 80, sm: 120 }, 
              height: { xs: 80, sm: 120 },
              flexShrink: 0
            }}
          >
            <img
              src={getItemImage()}
              alt={item?.product?.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '4px'
              }}
            />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                  {item?.product?.title}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Size: {item?.size}
                  </Typography>
                  {item?.color && (
                    <Typography variant="body2" color="text.secondary">
                      Color: {item.color}
                    </Typography>
                  )}
                </Box>
              </Box>

              {showButton && (
                <Button
                  startIcon={loading ? <CircularProgress size={20} /> : <DeleteOutlineIcon />}
                  onClick={handleRemoveItemFromCart}
                  disabled={loading}
                  sx={{
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: 'error.lighter'
                    }
                  }}
                >
                  Remove
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Tk. {item?.product?.discountedPrice}
              </Typography>
              {item?.product?.price > item?.product?.discountedPrice && (
                <>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textDecoration: 'line-through' }}
                  >
                    Tk. {item?.product?.price}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {item?.product?.discountPersent}% off
                  </Typography>
                </>
              )}
            </Box>

            {showButton && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  position: 'relative'
                }}>
                  <IconButton
                    size="small"
                    onClick={() => handleUpdateCartItem(-1)}
                    disabled={updateLoading || item?.quantity <= 1}
                    sx={{ color: 'black' }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ px: 2, py: 0.5, minWidth: '40px', textAlign: 'center' }}>
                    {item?.quantity}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleUpdateCartItem(1)}
                    disabled={updateLoading}
                    sx={{ color: 'black' }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                  {updateLoading && (
                    <CircularProgress
                      size={24}
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginTop: '-12px',
                        marginLeft: '-12px'
                      }}
                    />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Total: Tk. {(item?.quantity * item?.product?.discountedPrice).toFixed(2)}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default CartItem;
