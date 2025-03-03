import React, { useState, useEffect } from "react";
import CartItem from "./CartItem";
import { 
  Box, 
  Button, 
  Typography, 
  Divider, 
  Container, 
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  TextField,
  Card,
  Grid,
  Stack
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCart, applyPromoCode, removePromoCode } from "../../../Redux/Customers/Cart/Action";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import api from '../../../config/api';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { 
  GET_CART_SUCCESS, 
  REMOVE_PROMO_CODE_REQUEST,
  REMOVE_PROMO_CODE_SUCCESS,
  REMOVE_PROMO_CODE_FAILURE,
  APPLY_PROMO_CODE_REQUEST,
  APPLY_PROMO_CODE_SUCCESS,
  APPLY_PROMO_CODE_FAILURE
} from "../../../Redux/Customers/Cart/ActionType";

const Cart = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const jwt = localStorage.getItem("jwt");
  const { cartItems, cart, loading: cartLoading, error } = useSelector(state => state.cart);
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeError, setPromoCodeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [promoCodeValid, setPromoCodeValid] = useState(false);

  const fetchCart = async () => {
    try {
      await dispatch(getCart());
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  useEffect(() => {
    if (!jwt) {
      navigate('/login');
      return;
    }

    // Fetch cart data when component mounts or when navigating to the page
    fetchCart();

    // Add event listener for page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCart();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('refresh') === 'true') {
      fetchCart();
      // Remove the refresh parameter
      searchParams.delete('refresh');
      navigate({ search: searchParams.toString() }, { replace: true });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [jwt, dispatch, navigate, location.search]);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoCodeError('Please enter a promo code');
      return;
    }

    setLoading(true);
    try {
      const response = await dispatch(applyPromoCode(promoCode.trim()));
      
      if (response && response.status) {
        setPromoCodeValid(true);
        setPromoCodeError('');
        
        // Ensure the cart state is updated with the latest data
        if (response.cart) {
          dispatch({
            type: GET_CART_SUCCESS,
            payload: response.cart
          });
        }
        
        setSnackbar({
          open: true,
          message: response.message || 'Promo code applied successfully!',
          severity: 'success'
        });
      } else {
        setPromoCodeError('Invalid promo code');
        setPromoCodeValid(false);
      }
    } catch (error) {
      console.error('Error applying promo code:', error);
      setPromoCodeError(error.response?.data?.message || 'Failed to apply promo code');
      setPromoCodeValid(false);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to apply promo code',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePromoCode = async () => {
    setLoading(true);
    try {
      const response = await dispatch(removePromoCode());
      
      if (response && response.status) {
        // Reset promo code state in the component
        setPromoCode('');
        setPromoCodeError('');
        setPromoCodeValid(false);
        
        // Ensure the cart state is updated with the latest data
        if (response.cart) {
          dispatch({
            type: GET_CART_SUCCESS,
            payload: response.cart
          });
        }
        
        setSnackbar({
          open: true,
          message: response.message || 'Promo code removed successfully!',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error removing promo code:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to remove promo code',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{
            bgcolor: 'black',
            color: 'white',
            '&:hover': { bgcolor: '#333' }
          }}
        >
          Return to Home
        </Button>
      </Container>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1
        }}>
          <ShoppingCartIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Your Cart is Empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Looks like you haven&apos;t added anything to your cart yet.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/products')}
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: '#333' },
              px: 4
            }}
          >
            Continue Shopping
          </Button>
        </Box>
      </Container>
    );
  }

  const totalItems = cartItems?.length || 0;
  const totalQuantity = cartItems?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
  
  // Get values directly from cart object
  const subtotal = cart?.totalPrice || 0;
  const productDiscount = (cart?.discount || 0) - (cart?.promoCodeDiscount || 0);
  const promoDiscount = cart?.promoCodeDiscount || 0;
  const totalDiscount = cart?.discount || 0;
  const finalTotal = cart?.totalDiscountedPrice || 0;
  const discountPercentage = Math.round((totalDiscount / subtotal) * 100) || 0;

  // Check if promo code exists and has a discount
  const hasPromoCode = cart?.promoDetails && cart.promoDetails.code && promoDiscount > 0;
  const promoDetails = cart?.promoDetails || {
    code: '',
    discountType: 'FIXED',
    discountAmount: 0,
    maxDiscountAmount: null
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Shopping Cart</Typography>

      <Grid container spacing={4}>
        {/* Cart Items */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {cartItems.map((item) => (
              <CartItem key={item._id} item={item} showButton={true} />
            ))}
          </Box>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, position: 'sticky', top: 24 }}>
            <Typography variant="h6" gutterBottom>Order Summary</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} in cart
            </Typography>

            {/* Price Breakdown */}
            <Box sx={{ 
              bgcolor: 'grey.50',
              borderRadius: 1,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              mb: 3
            }}>
              {/* Original Price */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">
                  Original Price ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})
                </Typography>
                <Typography>Tk. {subtotal.toFixed(2)}</Typography>
              </Box>

              {/* Product Discounts */}
              {productDiscount > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography color="success.main" sx={{ fontWeight: 500 }}>
                      Product Discounts
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      ({Math.round((productDiscount / subtotal) * 100)}% off)
                    </Typography>
                  </Box>
                  <Typography color="success.main" sx={{ fontWeight: 500 }}>-Tk. {productDiscount.toFixed(2)}</Typography>
                </Stack>
              )}
            </Box>

            {/* Coupon Code Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Have a Coupon Code?
              </Typography>
              
              {/* Promo Code Input/Display */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                {hasPromoCode ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 1.5
                  }}>
                    {/* Applied Code Details */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between'
                    }}>
                      <Box>
                        <Typography variant="subtitle2" color="success.main" sx={{ mb: 0.5 }}>
                          Applied Code: {promoDetails.code}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {promoDetails.discountType === 'PERCENTAGE' 
                            ? `${promoDetails.discountAmount}% off`
                            : `Tk. ${promoDetails.discountAmount} off`}
                          {promoDetails.maxDiscountAmount && ` (max Tk. ${promoDetails.maxDiscountAmount})`}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={handleRemovePromoCode}
                        disabled={loading}
                        startIcon={<DeleteOutlineIcon />}
                      >
                        Remove
                      </Button>
                    </Box>
                    {/* Promo Discount Amount */}
                    <Box sx={{ 
                      mt: 1,
                      p: 1.5,
                      bgcolor: 'success.50',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Typography variant="body2" color="success.main">
                        Promo Code Savings
                      </Typography>
                      <Typography variant="subtitle2" color="success.main">
                        -Tk. {promoDiscount.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Enter coupon code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      error={!!promoCodeError}
                      helperText={promoCodeError}
                      disabled={loading}
                    />
                    <Button
                      variant="contained"
                      onClick={validatePromoCode}
                      disabled={!promoCode || loading}
                      sx={{ minWidth: '120px' }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Apply'}
                    </Button>
                  </Box>
                )}
              </Paper>
            </Box>

            {/* Final Price Breakdown */}
            <Box sx={{ 
              bgcolor: 'grey.50',
              borderRadius: 1,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}>
              {/* Original Price */}
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">
                  Original Price ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})
                </Typography>
                <Typography>Tk. {subtotal.toFixed(2)}</Typography>
              </Stack>

              {/* Product Discounts */}
              {productDiscount > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography color="success.main" sx={{ fontWeight: 500 }}>
                      Product Discounts
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      ({Math.round((productDiscount / subtotal) * 100)}% off)
                    </Typography>
                  </Box>
                  <Typography color="success.main" sx={{ fontWeight: 500 }}>-Tk. {productDiscount.toFixed(2)}</Typography>
                </Stack>
              )}

              {/* Promo Discount */}
              {promoDiscount > 0 && promoDetails && promoDetails.code && (
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography color="success.main" sx={{ fontWeight: 500 }}>
                      Coupon Discount ({promoDetails.code})
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      {promoDetails.discountType === 'PERCENTAGE' 
                        ? `${promoDetails.discountAmount}% off`
                        : `Tk. ${promoDetails.discountAmount} off`}
                    </Typography>
                  </Box>
                  <Typography color="success.main" sx={{ fontWeight: 500 }}>-Tk. {promoDiscount.toFixed(2)}</Typography>
                </Stack>
              )}

              {/* Total Savings */}
              {totalDiscount > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  bgcolor: 'success.lighter',
                  p: 1.5,
                  borderRadius: 1,
                  mt: 0.5,
                  border: '1px solid',
                  borderColor: 'success.light'
                }}>
                  <Box>
                    <Typography variant="subtitle2" color="success.dark" sx={{ fontWeight: 600 }}>
                      Total Savings
                    </Typography>
                    <Typography variant="caption" color="success.dark">
                      {discountPercentage}% off original price
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" color="success.dark" sx={{ fontWeight: 600 }}>
                    Tk. {totalDiscount.toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Divider />

              {/* Final Total */}
              <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Total Amount
                  </Typography>
                  {totalDiscount > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Original price: Tk. {subtotal.toFixed(2)}
                    </Typography>
                  )}
                </Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Tk. {finalTotal.toFixed(2)}
                </Typography>
              </Stack>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => navigate('/checkout')}
              sx={{
                mt: 3,
                bgcolor: 'black',
                '&:hover': { bgcolor: '#222' }
              }}
            >
              Proceed to Checkout ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})
            </Button>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Cart;
