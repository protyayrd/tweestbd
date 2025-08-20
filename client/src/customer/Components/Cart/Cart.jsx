import React, { useState, useEffect } from "react";
import CartItem from "./CartItem";
import ComboOfferSection from "./ComboOfferSection";
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
  Stack,
  Skeleton
} from "@mui/material";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCart, applyPromoCode, removePromoCode, clearCart } from "../../../Redux/Customers/Cart/Action";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import api from '../../../config/api';
import { trackInitiateCheckout } from "../../../utils/gtmEvents";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import comboOfferService from '../../../services/comboOfferService';
import { 
  GET_CART_SUCCESS, 
  REMOVE_PROMO_CODE_REQUEST,
  REMOVE_PROMO_CODE_SUCCESS,
  REMOVE_PROMO_CODE_FAILURE,
  APPLY_PROMO_CODE_REQUEST,
  APPLY_PROMO_CODE_SUCCESS,
  APPLY_PROMO_CODE_FAILURE
} from "../../../Redux/Customers/Cart/ActionType";

import { ArrowDownRightIcon } from "@heroicons/react/24/outline";
import { ArrowForwardIos } from "@mui/icons-material";

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
  const [clearCartLoading, setClearCartLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Combo offer state
  const [comboOfferData, setComboOfferData] = useState({
    appliedOffers: [],
    potentialSavings: [],
    totalComboDiscount: 0,
    comboOfferDiscounts: [],
    updatedCartItems: []
  });
  const [comboOffersLoading, setComboOffersLoading] = useState(false);

  const fetchCart = async () => {
    try {
      await dispatch(getCart());
    } catch (error) {
      // Error will be handled by the reducer
    }
  };

  // Separate effect for initial cart fetch and auth check
  useEffect(() => {
    // Check for guest cart items first
    const guestCartItems = localStorage.getItem('guestCartItems');
    const pendingCartItem = sessionStorage.getItem('pendingCartItem');
    
    // If user is not logged in AND has no guest cart items AND no pending cart item, redirect to login
    if (!jwt && !guestCartItems && !pendingCartItem) {
      // Only redirect to login if there are no guest cart items
      navigate('/login?returnTo=/cart');
      return;
    }

    // If we have a pendingCartItem in sessionStorage, move it to guestCartItems
    if (!jwt && pendingCartItem && !guestCartItems) {
      try {
        const parsedItem = JSON.parse(pendingCartItem);
        localStorage.setItem('guestCartItems', JSON.stringify([parsedItem]));
        
        // Clear the pending item after moving it
        sessionStorage.removeItem('pendingCartItem');
        
        // Process as guest cart item
        const items = [parsedItem];
        processGuestCartItems(items);
        return;
      } catch (error) {
        console.error('Error processing pending cart item:', error);
      }
    }

    // If we have guest cart items but no JWT, we're in guest mode
    if (!jwt && guestCartItems) {
      // Create a cart-like structure from the guest cart items
      try {
        const parsedItems = JSON.parse(guestCartItems);
        processGuestCartItems(parsedItems);
        return;
      } catch (error) {
        console.error('Error parsing guest cart items:', error);
      }
    }

    // Regular cart fetch for logged in users
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
  }, [jwt, dispatch, navigate, location.search]); // Remove cart and cartItems dependencies
  
  // Helper function to process guest cart items
  const processGuestCartItems = (items) => {
    if (!items || items.length === 0) return;
    
    // Calculate totals for the guest cart
    let totalPrice = 0;
    let totalDiscountedPrice = 0;
    let discount = 0;
    
    // Process each item
    items.forEach(item => {
      const itemPrice = (item.price || 0) * (item.quantity || 1);
      const itemDiscountedPrice = (item.discountedPrice || item.price || 0) * (item.quantity || 1);
      
      totalPrice += itemPrice;
      totalDiscountedPrice += itemDiscountedPrice;
      discount += (itemPrice - itemDiscountedPrice);
    });
    
    // Dispatch a cart success action to update the Redux store
    dispatch({
      type: GET_CART_SUCCESS,
      payload: {
        cartItems: items,
        totalPrice,
        totalDiscountedPrice,
        discount,
        totalItem: items.length,
        promoCodeDiscount: 0,
        promoDetails: null
      }
    });
  };

  // Reset image loaded state when cart status changes
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      setImageLoaded(false);
    }
  }, [cartItems]);

  // Check for combo offers when cart items change
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      checkComboOffers();
    } else {
      // Reset combo offer data if no items
      setComboOfferData({
        appliedOffers: [],
        potentialSavings: [],
        totalComboDiscount: 0,
        comboOfferDiscounts: [],
        updatedCartItems: []
      });
    }
  }, [cartItems]);

  const checkComboOffers = async () => {
    console.log('🔍 [Cart] Starting combo offer check...');
    console.log('🔍 [Cart] Cart items:', cartItems);
    
    if (!cartItems || cartItems.length === 0) {
      console.log('❌ [Cart] No cart items found, skipping combo offer check');
      return;
    }
    
    try {
      setComboOffersLoading(true);
      console.log('🔍 [Cart] Combo offers loading set to true');
      
      // Debug: Log each cart item's structure
      cartItems.forEach((item, index) => {
        console.log(`🔍 [Cart] Item ${index + 1}:`, {
          _id: item._id,
          productId: item.productId || item.product?._id,
          productTitle: item.product?.title,
          category: item.product?.category,
          categoryId: item.product?.category?._id,
          categoryName: item.product?.category?.name,
          quantity: item.quantity,
          hasComboOffer: item.hasComboOffer,
          comboOfferName: item.comboOfferName,
          comboPerUnitPrice: item.comboPerUnitPrice
        });
      });
      
      // Get unique category IDs from cart items
      const categoryIds = [...new Set(
        cartItems
          .map(item => {
            const categoryId = item.product?.category?._id;
            console.log(`🔍 [Cart] Product ${item.product?.title} category ID:`, categoryId);
            return categoryId;
          })
          .filter(Boolean)
      )];

      console.log('🔍 [Cart] Extracted category IDs:', categoryIds);

      if (categoryIds.length === 0) {
        console.log('❌ [Cart] No category IDs found in cart items');
        console.log('🔍 [Cart] Sample cart item structure:', cartItems[0]);
        return;
      }

      console.log('📡 [Cart] Fetching combo offers for categories:', categoryIds);
      // Get combo offers for these categories
      const comboOffers = await comboOfferService.getComboOffersByCategories(categoryIds);
      console.log('📡 [Cart] Received combo offers:', comboOffers);
      
      // Apply combo offers to cart items
      console.log('⚙️ [Cart] Applying combo offers to cart items...');
      const result = comboOfferService.applyComboOffersToCart(cartItems, comboOffers);
      console.log('⚙️ [Cart] Combo offer application result:', result);
      
      // Calculate potential savings for categories not yet eligible
      console.log('💰 [Cart] Calculating potential savings...');
      const potentialSavings = comboOfferService.calculatePotentialSavings(cartItems, comboOffers);
      console.log('💰 [Cart] Potential savings calculated:', potentialSavings);
      
      const finalComboOfferData = {
        appliedOffers: result.appliedOffers,
        potentialSavings,
        totalComboDiscount: result.totalComboDiscount,
        comboOfferDiscounts: result.comboOfferDiscounts,
        updatedCartItems: result.updatedCartItems
      };
      
      console.log('✅ [Cart] Setting final combo offer data:', finalComboOfferData);
      setComboOfferData(finalComboOfferData);
      
    } catch (error) {
      console.error('❌ [Cart] Error checking combo offers:', error);
      console.error('❌ [Cart] Error stack:', error.stack);
    } finally {
      setComboOffersLoading(false);
      console.log('🔍 [Cart] Combo offers loading set to false');
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoCodeError('Please enter a promo code');
      setSnackbar({
        open: true,
        message: 'Please enter a promo code',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      // For guest users, handle promo codes locally
      if (!jwt) {
        // Simulate a successful promo code application
        // In real implementation, this should call an API endpoint that doesn't require auth
        const guestCartItems = JSON.parse(localStorage.getItem('guestCartItems') || '[]');
        if (guestCartItems.length === 0) {
          throw new Error('Your cart is empty');
        }
        
        // Check common promo codes - hardcoded for demo purposes
        // In production, this should validate against an API
        let discount = 0;
        let discountType = 'FIXED';
        let maxDiscountAmount = null;
        
        if (promoCode.trim().toUpperCase() === 'WELCOME10') {
          discount = 10;
          discountType = 'PERCENTAGE';
        } else if (promoCode.trim().toUpperCase() === 'SAVE20') {
          discount = 20;
          discountType = 'PERCENTAGE';
          maxDiscountAmount = 1000;
        } else if (promoCode.trim().toUpperCase() === 'FLAT100') {
          discount = 100;
          discountType = 'FIXED';
        } else {
          throw new Error('Invalid promo code');
        }
        
        // Calculate the promo discount
        let promoDiscount = 0;
        const cartTotal = cart.totalDiscountedPrice || 0;
        
        if (discountType === 'PERCENTAGE') {
          promoDiscount = (cartTotal * discount) / 100;
          if (maxDiscountAmount && promoDiscount > maxDiscountAmount) {
            promoDiscount = maxDiscountAmount;
          }
        } else {
          promoDiscount = discount;
        }
        
        // Update the cart in Redux
        dispatch({
          type: GET_CART_SUCCESS,
          payload: {
            ...cart,
            promoCodeDiscount: promoDiscount,
            totalDiscountedPrice: cart.totalDiscountedPrice - promoDiscount,
            promoDetails: {
              code: promoCode.trim().toUpperCase(),
              discountType,
              discountAmount: discount,
              maxDiscountAmount
            }
          }
        });
        
        // Save the promo code to localStorage for persistence
        localStorage.setItem('guestPromoCode', JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          discountType,
          discountAmount: discount,
          maxDiscountAmount,
          promoDiscount
        }));
        
        setSnackbar({
          open: true,
          message: 'Promo code applied successfully!',
          severity: 'success'
        });
        
        setPromoCodeValid(true);
        setPromoCodeError('');
        setPromoCode('');
        return;
      }
      
      // Regular promo code validation for authenticated users
      const response = await dispatch(applyPromoCode(promoCode.trim()));
      
      if (response && response.status) {
        setPromoCodeValid(true);
        setPromoCodeError('');
        setPromoCode('');
        
        setSnackbar({
          open: true,
          message: response.message || 'Promo code applied successfully!',
          severity: 'success'
        });
      } else {
        // Handle error response without throwing
        setPromoCodeError(response?.message || 'Invalid promo code');
        setPromoCodeValid(false);
        
        setSnackbar({
          open: true,
          message: response?.message || 'Invalid promo code',
          severity: 'error'
        });
      }
    } catch (error) {
      // Set error message in the TextField
      setPromoCodeError(error.message || 'Invalid promo code');
      setPromoCodeValid(false);
      
      // Show error in snackbar
      setSnackbar({
        open: true,
        message: error.message || 'Invalid promo code',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePromoCode = async () => {
    setLoading(true);
    try {
      if (!jwt) {
        // For guest users, handle promo code removal locally
        localStorage.removeItem('guestPromoCode');
        
        // Update the cart in Redux without promo code
        dispatch({
          type: GET_CART_SUCCESS,
          payload: {
            ...cart,
            promoCodeDiscount: 0,
            totalDiscountedPrice: cart.totalDiscountedPrice + (cart.promoCodeDiscount || 0),
            promoDetails: null
          }
        });
        
        setSnackbar({
          open: true,
          message: 'Promo code removed successfully!',
          severity: 'success'
        });
        
        // Reset promo code state in the component
        setPromoCode('');
        setPromoCodeError('');
        setPromoCodeValid(false);
        return;
      }
      
      // Regular promo code removal for authenticated users
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

  const handleClearCart = async () => {
    try {
      setClearCartLoading(true);
      const result = await dispatch(clearCart());
      
      if (result.status) {
        // Reset any local cart-related state
        setPromoCode('');
        setPromoCodeError('');
        setPromoCodeValid(false);
        
        setSnackbar({
          open: true,
          message: 'Cart cleared successfully',
          severity: 'success'
        });

        // Ensure we have the latest cart state
        try {
          await dispatch(getCart());
        } catch (error) {
          // Recovery failed, error will be handled by the reducer
        }
      } else {
        throw new Error(result.message || 'Failed to clear cart');
      }
    } catch (error) {
      // Try to recover by fetching cart again
      try {
        await dispatch(getCart());
      } catch (recoveryError) {
        // Recovery failed, error will be handled by the reducer
      }
      
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || 'Failed to clear cart',
        severity: 'error'
      });
    } finally {
      setClearCartLoading(false);
    }
  };

  const handleCheckout = () => {
    // Track InitiateCheckout event before navigating to checkout
    if (cartItems && cartItems.length > 0) {
      console.log('Tracking InitiateCheckout from cart page for:', cartItems.length, 'items');
      trackInitiateCheckout(cartItems, cart);
    }
    
    // If user is not logged in, add the guest flag to the URL
    if (!jwt) {
      // Make sure we have guest cart items in localStorage
      if (effectiveCartItems && effectiveCartItems.length > 0) {
        // Save the updated cart items (with combo offers) to localStorage for guest checkout
        localStorage.setItem('guestCartItems', JSON.stringify(effectiveCartItems));
        
        // Also save the cart object with updated totals including combo offers
        localStorage.setItem('guestCart', JSON.stringify({
          cartItems: effectiveCartItems,
          totalPrice: cart.totalPrice,
          totalDiscountedPrice: finalTotal + (cart.promoCodeDiscount || 0), // Add back promo discount for recalculation
          discount: cart.discount + comboDiscount,
          totalItem: effectiveCartItems.length,
          promoCodeDiscount: cart.promoCodeDiscount || 0,
          promoDetails: cart.promoDetails,
          comboOfferData: comboOfferData
        }));
      }
      
      // Navigate directly to checkout with guest parameter
      navigate('/checkout?guest=true&step=2');
    } else {
      navigate('/checkout');
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
          onClick={() => navigate('/cart')}
          sx={{
            bgcolor: 'black',
            color: 'white',
            '&:hover': { bgcolor: '#333' }
          }}
        >
          Return to Cart
        </Button>
      </Container>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <Container maxWidth="100%" sx={{ py: 0, overflow: 'hidden' }}>
        <Box sx={{ 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          position: 'relative',
          width: '100%',
          height: { xs: '450px', md: 'auto' }
        }}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            overflow: 'hidden',
            position: 'relative'
          }}>
            {!imageLoaded && (
              <Skeleton 
                variant="rectangular" 
                width="100%" 
                height="100%" 
                animation="pulse"
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  backgroundColor: '#e0e0e0',
                  opacity: 0.5,
                  zIndex: 1
                }}
              />
            )}
            <img 
              src="/images/CartEmpty.png" 
              alt="Empty Cart" 
              onLoad={() => {
                // Set a small timeout to ensure the image is fully rendered
                setTimeout(() => setImageLoaded(true), 100);
              }}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease-out'
              }} 
            />
          </div>
          <Button
            variant="contained"
            onClick={() => navigate('/products')}
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: '#00503a' },
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              position: 'relative',
              zIndex: 2,
              mt: 2
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
  
  // Get values directly from cart object and include combo discounts
  const subtotal = cart?.totalPrice || 0;
  const productDiscount = (cart?.discount || 0) - (cart?.promoCodeDiscount || 0);
  const promoDiscount = cart?.promoCodeDiscount || 0;
  const comboDiscount = comboOfferData.totalComboDiscount || 0;
  
  // Use updated cart items with combo pricing if available
  const effectiveCartItems = comboOfferData.updatedCartItems.length > 0 ? comboOfferData.updatedCartItems : cartItems;
  
  // Recalculate totals based on updated cart items with combo pricing
  const subtotalWithCombo = effectiveCartItems?.reduce((sum, item) => {
    // Use combo pricing if available, otherwise use original pricing
    const itemPrice = item.hasComboOffer ? item.comboPerUnitPrice : (item.product?.discountedPrice || item.product?.price || 0);
    return sum + (itemPrice * (item.quantity || 0));
  }, 0) || 0;
  
  const totalDiscount = subtotal - subtotalWithCombo + promoDiscount;
  const finalTotal = subtotalWithCombo - promoDiscount;
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
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        borderBottom: '2px solid',
        borderColor: '#00503a20',
        pb: 3
      }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 600,
          color: 'black'
        }}>
          Shopping Cart
        </Typography>
        <Button
          variant="outlined"
          startIcon={clearCartLoading ? <CircularProgress size={20} /> : <DeleteOutlineIcon />}
          onClick={handleClearCart}
          disabled={clearCartLoading || !cartItems?.length}
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
          Clear Cart
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Cart Items */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {effectiveCartItems.map((item) => (
              <CartItem key={item._id} item={item} showButton={true} />
            ))}
            
            {/* Combo Offers Section */}
            <ComboOfferSection
              appliedOffers={comboOfferData.appliedOffers}
              potentialSavings={comboOfferData.potentialSavings}
              totalComboDiscount={comboOfferData.totalComboDiscount}
              comboOfferDiscounts={comboOfferData.comboOfferDiscounts}
            />
            
            {/* Desktop Continue Shopping Button */}
            <Box sx={{ display: { xs: 'none', sm: 'block' }, width: 'auto' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                sx={{
                  mt: 2,
                  alignSelf: 'flex-start',
                  border: '2px solid',
                  borderColor: '#00503a',
                  borderRadius: 2,
                  color: '#00503a',
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: '#00503a',
                    color: 'white',
                    borderColor: '#00503a'
                  },
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  textTransform: 'none',
                  fontWeight: 500
                }}
                startIcon={<ArrowBackIosIcon fontSize="small" />}
              >
                Continue Shopping
              </Button>
            </Box>
            
            {/* Mobile Buttons - Continue Shopping and Checkout */}
            <Stack 
              direction="row" 
              spacing={2} 
              sx={{ 
                display: { xs: 'flex', sm: 'none' },
                mt: 3,
                width: '100%'
              }}
            >
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/')}
                sx={{
                  flex: 1,
                  py: 1.5,
                  color: '#00503a',
                  borderColor: '#00503a',
                  '&:hover': { 
                    borderColor: '#00503a',
                    bgcolor: 'rgba(0, 80, 58, 0.04)'
                  }
                }}
                startIcon={<ArrowBackIosIcon fontSize="small" />}
              >
                Continue Shopping
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleCheckout}
                sx={{
                  flex: 1,
                  bgcolor: 'black',
                  color: 'white',
                  py: 1.5,
                  '&:hover': { 
                    bgcolor: '#00503a'
                  }
                }}
                endIcon={<ArrowForwardIos fontSize="small" />}
              >
                Checkout
              </Button>
            </Stack>
          </Box>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            p: 3, 
            position: 'sticky', 
            top: 24,
            border: '1px solid',
            borderColor: '#00503a20',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <Typography variant="h5" gutterBottom sx={{ 
              fontWeight: 600,
              color: 'black',
              pb: 2,
              borderBottom: '2px solid',
              borderColor: '#00503a20'
            }}>
              Order Summary
            </Typography>
            <Typography variant="body1" sx={{ 
              mb: 3,
              color: '#00503a',
              fontWeight: 500
            }}>
              {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} in cart
            </Typography>

            {/* Price Breakdown */}
            <Box sx={{ 
              bgcolor: '#00503a08',
              borderRadius: 2,
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mb: 3,
              border: '1px solid',
              borderColor: '#00503a20'
            }}>
              {/* Original Price */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ color: 'black', fontWeight: 500 }}>
                  Original Price ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})
                </Typography>
                <Typography sx={{ color: 'black', fontWeight: 500 }}>
                  Tk. {subtotal.toFixed(2)}
                </Typography>
              </Box>

              {/* Product Discounts */}
              {productDiscount > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography sx={{ 
                      color: '#00503a',
                      fontWeight: 500
                    }}>
                      Product Discounts
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#00503a',
                      fontWeight: 500
                    }}>
                      ({Math.round((productDiscount / subtotal) * 100)}% off)
                    </Typography>
                  </Box>
                  <Typography sx={{ 
                    color: '#00503a',
                    fontWeight: 500
                  }}>
                    -Tk. {productDiscount.toFixed(2)}
                  </Typography>
                </Stack>
              )}

              {/* Combo Offer Discounts */}
              {comboDiscount > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography sx={{ 
                      color: '#4CAF50',
                      fontWeight: 500
                    }}>
                      Combo Offer Savings
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#4CAF50',
                      fontWeight: 500
                    }}>
                      ({Math.round((comboDiscount / subtotal) * 100)}% off)
                    </Typography>
                  </Box>
                  <Typography sx={{ 
                    color: '#4CAF50',
                    fontWeight: 500
                  }}>
                    -Tk. {comboDiscount.toFixed(2)}
                  </Typography>
                </Stack>
              )}
            </Box>

            {/* Coupon Code Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 600,
                color: 'black'
              }}>
                Have a Coupon Code?
              </Typography>
              
              {/* Promo Code Input/Display */}
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2.5,
                  border: '1px solid',
                  borderColor: '#00503a20',
                  borderRadius: 2
                }}
              >
                {hasPromoCode ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    {/* Applied Code Details */}
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between'
                    }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ 
                          mb: 0.5,
                          color: '#00503a',
                          fontWeight: 600
                        }}>
                          Applied Code: {promoDetails.code}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {promoDetails.discountType === 'PERCENTAGE' 
                            ? `${promoDetails.discountAmount}% off`
                            : `Tk. ${promoDetails.discountAmount} off`}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={handleRemovePromoCode}
                        disabled={loading}
                        startIcon={<DeleteOutlineIcon />}
                        sx={{
                          borderColor: 'error.main',
                          color: 'error.main',
                          '&:hover': {
                            backgroundColor: 'error.main',
                            color: 'white'
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </Box>
                    {/* Promo Discount Amount */}
                    <Box sx={{ 
                      p: 2,
                      bgcolor: '#00503a08',
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid',
                      borderColor: '#00503a20'
                    }}>
                      <Typography variant="body1" sx={{ 
                        color: '#00503a',
                        fontWeight: 500
                      }}>
                        Promo Code Savings
                      </Typography>
                      <Typography variant="subtitle1" sx={{ 
                        color: '#00503a',
                        fontWeight: 600
                      }}>
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: '#00503a'
                          }
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={validatePromoCode}
                      disabled={!promoCode || loading}
                      sx={{ 
                        minWidth: '120px',
                        bgcolor: '#00503a',
                        '&:hover': {
                          bgcolor: 'black'
                        }
                      }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Apply'}
                    </Button>
                  </Box>
                )}
              </Paper>
            </Box>

            {/* Final Price Breakdown */}
            <Box sx={{ 
              bgcolor: '#00503a08',
              borderRadius: 2,
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              border: '1px solid',
              borderColor: '#00503a20'
            }}>
              {/* Original Price */}
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: 'black', fontWeight: 500 }}>
                  Original Price ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})
                </Typography>
                <Typography sx={{ color: 'black', fontWeight: 500 }}>
                  Tk. {subtotal.toFixed(2)}
                </Typography>
              </Stack>

              {/* Product Discounts */}
              {productDiscount > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography sx={{ 
                      color: '#00503a',
                      fontWeight: 500
                    }}>
                      Product Discounts
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#00503a',
                      fontWeight: 500
                    }}>
                      ({Math.round((productDiscount / subtotal) * 100)}% off)
                    </Typography>
                  </Box>
                  <Typography sx={{ 
                    color: '#00503a',
                    fontWeight: 500
                  }}>
                    -Tk. {productDiscount.toFixed(2)}
                  </Typography>
                </Stack>
              )}

              {/* Promo Discount */}
              {promoDiscount > 0 && promoDetails && promoDetails.code && (
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography sx={{ 
                      color: '#00503a',
                      fontWeight: 500
                    }}>
                      Coupon Discount ({promoDetails.code})
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#00503a',
                      fontWeight: 500
                    }}>
                      {promoDetails.discountType === 'PERCENTAGE' 
                        ? `${promoDetails.discountAmount}% off`
                        : `Tk. ${promoDetails.discountAmount} off`}
                    </Typography>
                  </Box>
                  <Typography sx={{ 
                    color: '#00503a',
                    fontWeight: 500
                  }}>
                    -Tk. {promoDiscount.toFixed(2)}
                  </Typography>
                </Stack>
              )}

              {/* Total Savings */}
              {totalDiscount > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  bgcolor: '#00503a15',
                  p: 2,
                  borderRadius: 2,
                  mt: 0.5,
                  border: '1px solid',
                  borderColor: '#00503a30'
                }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: 600,
                      color: '#00503a'
                    }}>
                      Total Savings
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#00503a',
                      fontWeight: 500
                    }}>
                      {discountPercentage}% off original price
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 600,
                    color: '#00503a'
                  }}>
                    Tk. {totalDiscount.toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ borderColor: '#00503a20' }} />

              {/* Final Total */}
              <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    color: 'black'
                  }}>
                    Total Amount
                  </Typography>
                  {totalDiscount > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Original price: Tk. {subtotal.toFixed(2)}
                    </Typography>
                  )}
                </Box>
                <Typography variant="h5" sx={{ 
                  fontWeight: 600,
                  color: '#00503a'
                }}>
                  Tk. {finalTotal.toFixed(2)}
                </Typography>
              </Stack>
            </Box>

            {/* Desktop Checkout Button */}
            <Box sx={{ display: { xs: 'none', sm: 'block' }, width: '100%' }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleCheckout}
                sx={{
                  mt: 3,
                  bgcolor: 'black',
                  color: 'white',
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  '&:hover': { 
                    bgcolor: '#00503a'
                  }
                }}
              >
                Proceed to Checkout ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})
              </Button>
            </Box>
            
            {/* Mobile Checkout Buttons */}
            <Stack 
              direction="row" 
              spacing={2} 
              sx={{ 
                display: { xs: 'flex', sm: 'none' },
                mt: 3,
                width: '100%'
              }}
            >
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/products')}
                sx={{
                  flex: 1,
                  py: 1.5,
                  color: '#00503a',
                  borderColor: '#00503a',
                  '&:hover': { 
                    borderColor: '#00503a',
                    bgcolor: 'rgba(0, 80, 58, 0.04)'
                  }
                }}
                startIcon={<ArrowBackIosIcon fontSize="small" />}
              >
                Continue Shopping
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleCheckout}
                sx={{
                  flex: 1,
                  bgcolor: 'black',
                  color: 'white',
                  py: 1.5,
                  '&:hover': { 
                    bgcolor: '#00503a'
                  }
                }}
                endIcon={<ArrowForwardIos fontSize="small" />}
              >
                Checkout
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            bgcolor: snackbar.severity === 'success' ? '#00503a' : 
                    snackbar.severity === 'error' ? '#d32f2f' : undefined
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Cart;
