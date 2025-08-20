import * as React from "react";
import { 
  Box, 
  Typography, 
  Container,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
  Alert,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  Divider,
  Card,
  CardContent,
  Snackbar,
  CircularProgress
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { createOrder } from "../../../Redux/Customers/Order/Action";
import { createPayment } from "../../../Redux/Customers/Payment/Action";
import { clearCart } from "../../../Redux/Customers/Cart/Action";
import { findUserCart } from "../../../Redux/Customers/Cart/Action";
import { applyPromoCode, removePromoCode } from "../../../Redux/Customers/Cart/Action";
import { trackInitiateCheckout } from "../../../utils/gtmEvents";
import pathaoService from '../../../services/pathaoService';
import comboOfferService from '../../../services/comboOfferService';
import { getImageUrl } from '../../../config/api';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ComboOfferSection from "../Cart/ComboOfferSection";

const PRIMARY_COLOR = '#00503a';
const SECONDARY_COLOR = '#69af5a';

const commonTextFieldStyles = {
  '& .MuiOutlinedInput-root': { 
    '&.Mui-focused fieldset': { 
      borderColor: SECONDARY_COLOR
    },
    '&:hover fieldset': {
      borderColor: SECONDARY_COLOR 
    },
    '& input': {
      color: PRIMARY_COLOR
    },
    '& textarea': {
      color: PRIMARY_COLOR
    }
  },
  '& .MuiInputLabel-root': {
    color: PRIMARY_COLOR,
    '&.Mui-focused': {
      color: SECONDARY_COLOR
    }
  }
};

export default function Checkout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const queryParams = new URLSearchParams(location.search);
  const isGuestCheckout = queryParams.get('guest') === 'true';
  const jwt = localStorage.getItem("jwt");
  const { auth, cart, order } = useSelector((store) => store);
  
  // State management
  const [guestCart, setGuestCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Address form states
  const [isGuest, setIsGuest] = useState(isGuestCheckout || !auth?.user);
  const [formValues, setFormValues] = useState({
    name: `${auth?.user?.firstName || ''} ${auth?.user?.lastName || ''}`.trim(),
    phoneNumber: auth?.user?.phoneNumber || '',
    email: auth?.user?.email || '',
    address: '',
    zipCode: '1212'
  });
  
  // Location states
  const [cities, setCities] = useState([]);
  const [deliveryArea, setDeliveryArea] = useState("");

  // Order and payment states
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [paymentOption, setPaymentOption] = useState("cod");
  const [orderData, setOrderData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Promo code states
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeError, setPromoCodeError] = useState("");
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);
  const [promoCodeValid, setPromoCodeValid] = useState(false);

  // Combo offer states
  const [comboOfferData, setComboOfferData] = useState({
    appliedOffers: [],
    potentialSavings: [],
    totalComboDiscount: 0,
    comboOfferDiscounts: [],
    updatedCartItems: []
  });
  const [comboOffersLoading, setComboOffersLoading] = useState(false);

  // Initialize guest cart data
  useEffect(() => {
    if (isGuestCheckout && !jwt) {
      const guestCartData = localStorage.getItem('guestCart');
      if (guestCartData) {
        try {
          const parsedCart = JSON.parse(guestCartData);
          setGuestCart(parsedCart);
        } catch (e) {
          console.error("Error parsing guest cart:", e);
        }
      } else {
        const guestCartItems = localStorage.getItem('guestCartItems');
        if (guestCartItems) {
          try {
            const parsedItems = JSON.parse(guestCartItems);
            setGuestCart({
              cartItems: parsedItems,
              totalItem: parsedItems.length,
              totalPrice: parsedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
              totalDiscountedPrice: parsedItems.reduce((sum, item) => sum + (item.discountedPrice * item.quantity), 0),
              discount: parsedItems.reduce((sum, item) => sum + ((item.price - item.discountedPrice) * item.quantity), 0)
            });
          } catch (e) {
            console.error("Error parsing guest cart items:", e);
          }
        } else {
          navigate("/cart");
        }
      }
    } else if (!isGuestCheckout && jwt) {
      // For logged-in users, fetch cart if needed
      dispatch(findUserCart());
    }
  }, [isGuestCheckout, jwt, navigate, dispatch]);

  // Track InitiateCheckout when cart data is available
  useEffect(() => {
    const currentCart = isGuestCheckout ? guestCart : cart;
    const cartItems = currentCart?.cartItems || [];
    
    // Track InitiateCheckout event when cart has items
    if (cartItems && cartItems.length > 0) {
      console.log('Tracking InitiateCheckout event for:', cartItems.length, 'items');
      trackInitiateCheckout(cartItems, currentCart);
    }
  }, [isGuestCheckout, guestCart, cart]);

  // Check for combo offers when cart data changes
  useEffect(() => {
    const currentCart = isGuestCheckout ? guestCart : cart;
    const cartItems = currentCart?.cartItems || [];
    
    if (cartItems && cartItems.length > 0) {
      checkComboOffers(cartItems);
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
  }, [isGuestCheckout, guestCart, cart]);

  const checkComboOffers = async (cartItems) => {
    if (!cartItems || cartItems.length === 0) return;
    
    try {
      setComboOffersLoading(true);
      
      // Get unique category IDs from cart items
      const categoryIds = [...new Set(
        cartItems
          .map(item => item.product?.category?._id)
          .filter(Boolean)
      )];

      if (categoryIds.length === 0) {
        return;
      }

      // Get combo offers for these categories
      const comboOffers = await comboOfferService.getComboOffersByCategories(categoryIds);
      
      // Apply combo offers to cart items
      const result = comboOfferService.applyComboOffersToCart(cartItems, comboOffers);
      
      // Calculate potential savings for categories not yet eligible
      const potentialSavings = comboOfferService.calculatePotentialSavings(cartItems, comboOffers);
      
      setComboOfferData({
        appliedOffers: result.appliedOffers,
        potentialSavings,
        totalComboDiscount: result.totalComboDiscount,
        comboOfferDiscounts: result.comboOfferDiscounts,
        updatedCartItems: result.updatedCartItems
      });
      
    } catch (error) {
      console.error('Error checking combo offers in checkout:', error);
    } finally {
      setComboOffersLoading(false);
    }
  };

  // Initialize Pathao locations
  useEffect(() => {
    const initializePathao = async () => {
      try {
        setLoading(true);
        const citiesData = await pathaoService.getCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Error loading cities:', error);
        setError('Failed to load delivery locations. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    initializePathao();
  }, []);



  // Calculate delivery charge
  useEffect(() => {
    const calculateDelivery = () => {
      if (!deliveryArea) return;
      if (!(guestCart || cart)) return;
      const charge = deliveryArea === 'inside_dhaka' ? 60 : 120;
      setDeliveryCharge(charge);
    };
    calculateDelivery();
  }, [deliveryArea, guestCart, cart]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Promo code handlers
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

    setPromoCodeLoading(true);
    setPromoCodeError('');
    
    try {
      // For non-authenticated users or guest checkout, handle promo codes locally
      if (!jwt || isGuestCheckout) {
        // Get cart items from various sources
        const guestCartItems = JSON.parse(localStorage.getItem('guestCartItems') || '[]');
        const hasGuestCart = guestCart && guestCart.cartItems && guestCart.cartItems.length > 0;
        const hasCartItems = cartItems && cartItems.length > 0;
        
        if (!hasGuestCart && !hasCartItems && guestCartItems.length === 0) {
          throw new Error('Your cart is empty');
        }
        
        // Check common promo codes - hardcoded for demo purposes
        let discount = 0;
        let discountType = 'FIXED';
        let maxDiscountAmount = null;
        
        const codeUpper = promoCode.trim().toUpperCase();
        if (codeUpper === 'WELCOME10') {
          discount = 10;
          discountType = 'PERCENTAGE';
        } else if (codeUpper === 'SAVE20') {
          discount = 20;
          discountType = 'PERCENTAGE';
          maxDiscountAmount = 1000;
        } else if (codeUpper === 'FLAT100') {
          discount = 100;
          discountType = 'FIXED';
        } else if (codeUpper === 'NEW50') {
          discount = 50;
          discountType = 'FIXED';
        } else if (codeUpper === 'SAVE15') {
          discount = 15;
          discountType = 'PERCENTAGE';
          maxDiscountAmount = 500;
        } else {
          throw new Error('Invalid promo code');
        }
        
        // Calculate the promo discount
        let promoDiscount = 0;
        const cartTotal = currentCart?.totalDiscountedPrice || 0;
        
        if (discountType === 'PERCENTAGE') {
          promoDiscount = (cartTotal * discount) / 100;
          if (maxDiscountAmount && promoDiscount > maxDiscountAmount) {
            promoDiscount = maxDiscountAmount;
          }
        } else {
          promoDiscount = Math.min(discount, cartTotal);
        }
        
        // Update guest cart with promo code
        const updatedGuestCart = {
          ...guestCart,
          promoCodeDiscount: promoDiscount,
          totalDiscountedPrice: (guestCart?.totalDiscountedPrice || 0) - promoDiscount,
          promoDetails: {
            code: codeUpper,
            discountType,
            discountAmount: discount,
            maxDiscountAmount
          }
        };
        
        setGuestCart(updatedGuestCart);
        localStorage.setItem('guestCart', JSON.stringify(updatedGuestCart));
        
        setSnackbar({
          open: true,
          message: 'Promo code applied successfully!',
          severity: 'success'
        });
        
        setPromoCodeValid(true);
        setPromoCode('');
        return;
      }
      
      // For authenticated users, use the existing Redux action
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
        
        // Refresh cart data
        dispatch(findUserCart());
      } else {
        setPromoCodeError(response?.message || 'Invalid promo code');
        setPromoCodeValid(false);
        
        setSnackbar({
          open: true,
          message: response?.message || 'Invalid promo code',
          severity: 'error'
        });
      }
    } catch (error) {
      setPromoCodeError(error.message || 'Invalid promo code');
      setPromoCodeValid(false);
      
      setSnackbar({
        open: true,
        message: error.message || 'Invalid promo code',
        severity: 'error'
      });
    } finally {
      setPromoCodeLoading(false);
    }
  };

  const handleRemovePromoCode = async () => {
    setPromoCodeLoading(true);
    
    try {
      // For non-authenticated users or guest checkout, handle promo code removal locally
      if (!jwt || isGuestCheckout) {
        // For guest users, remove promo code locally
        const updatedGuestCart = {
          ...guestCart,
          promoCodeDiscount: 0,
          totalDiscountedPrice: (guestCart?.totalDiscountedPrice || 0) + (guestCart?.promoCodeDiscount || 0),
          promoDetails: null
        };
        
        setGuestCart(updatedGuestCart);
        localStorage.setItem('guestCart', JSON.stringify(updatedGuestCart));
        
        setSnackbar({
          open: true,
          message: 'Promo code removed successfully!',
          severity: 'success'
        });
        
        setPromoCode('');
        setPromoCodeError('');
        setPromoCodeValid(false);
        return;
      }
      
      // For authenticated users, use the existing Redux action
      const response = await dispatch(removePromoCode());
      
      if (response && response.status) {
        setPromoCode('');
        setPromoCodeError('');
        setPromoCodeValid(false);
        
        setSnackbar({
          open: true,
          message: response.message || 'Promo code removed successfully!',
          severity: 'success'
        });
        
        // Refresh cart data
        dispatch(findUserCart());
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to remove promo code',
        severity: 'error'
      });
    } finally {
      setPromoCodeLoading(false);
    }
  };

  // Get current cart data
  const currentCart = isGuestCheckout ? guestCart : cart;
  const cartItems = currentCart?.cartItems || [];

  // Use updated cart items with combo pricing if available
  const effectiveCartItems = comboOfferData.updatedCartItems.length > 0 ? comboOfferData.updatedCartItems : cartItems;

  // Calculate totals including combo discounts
  const subtotal = currentCart?.totalPrice || 0;
  const productDiscount = (currentCart?.discount || 0) - (currentCart?.promoCodeDiscount || 0);
  const promoDiscount = currentCart?.promoCodeDiscount || 0;
  const comboDiscount = comboOfferData.totalComboDiscount || 0;
  
  // Recalculate totals based on updated cart items with combo pricing
  const subtotalWithCombo = effectiveCartItems?.reduce((sum, item) => {
    // Use combo pricing if available, otherwise use original pricing
    const itemPrice = item.hasComboOffer ? item.comboPerUnitPrice : (item.discountedPrice || item.product?.discountedPrice || item.product?.price || 0);
    return sum + (itemPrice * (item.quantity || 0));
  }, 0) || 0;
  
  const finalTotal = subtotalWithCombo - promoDiscount + deliveryCharge;

  const handleCompleteOrder = async () => {
    // Validation - allow null strings, just check for delivery area
    const name = formValues.name || "";
    const phoneNumber = formValues.phoneNumber || "";
    const address = formValues.address || "";

    if (!deliveryArea) {
      setError("Please select your delivery area");
      return;
    }

    if (!effectiveCartItems || effectiveCartItems.length === 0) {
      setError("Your cart is empty. Please add items to cart first.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Create address object
      const city = deliveryArea === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka';

      const addressData = {
        firstName: name.split(' ')[0] || '',
        lastName: name.split(' ')[1] || '',
        phoneNumber: phoneNumber,
        mobile: phoneNumber,
        streetAddress: address,
        city,
        zone: city, // Use city as zone since we no longer collect zone
        area: city, // Use city as area since we no longer collect area
        // Server expects these field names for guest orders
        division: city || 'Dhaka',
        district: city || 'Dhaka',
        upazilla: city || 'Dhaka',
        pathao_city_id: deliveryArea === 'inside_dhaka' ? (cities.find(c => c.city_name?.toLowerCase() === 'dhaka')?.city_id || 1) : null,
        pathao_zone_id: null,
        pathao_area_id: null,
        zipCode: formValues.zipCode,
        isGuestCheckout: isGuestCheckout || isGuest,
        email: formValues.email || ''
      };

      // Create order data
      const orderRequestData = {
        address: addressData,
        orderItems: effectiveCartItems.map((item) => ({
          product: item?.product?._id,
          size: item?.size || "",
          quantity: item?.quantity || 1,
          price: item?.price || item?.product?.price || 0,
          discountedPrice: item.hasComboOffer ? item.comboPerUnitPrice : (item?.discountedPrice || item?.product?.discountedPrice || 0),
          color: item?.color || "",
          hasComboOffer: item.hasComboOffer || false,
          comboOfferName: item.comboOfferName || null,
          comboOfferDiscount: item.comboOfferDiscount || 0
        })),
        totalPrice: subtotal + deliveryCharge,
        totalDiscountedPrice: finalTotal,
        discount: (currentCart?.discount || 0) + comboDiscount,
        productDiscount: productDiscount || 0,
        promoCodeDiscount: promoDiscount || 0,
        comboOfferDiscount: comboDiscount || 0,
        deliveryCharge: deliveryCharge || 0,
        totalItem: effectiveCartItems?.length || 0,
        // Include combo offer details
        appliedComboOffers: comboOfferData.appliedOffers || []
      };

      let createdOrder;

      if (isGuestCheckout && !jwt) {
        // For guest checkout, we need to create the order on the server first
        try {
          const response = await fetch('/api/orders/guest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderRequestData)
          });
          
          if (!response.ok) {
            throw new Error('Failed to create guest order');
          }
          
          const orderData = await response.json();
          createdOrder = orderData.order || orderData;
          
          // Store order data for potential later use
          localStorage.setItem('guestOrderData', JSON.stringify({
            ...createdOrder,
            // Ensure shipping address is included with all details
            shippingAddress: addressData,
            // Ensure delivery charge is included
            deliveryCharge: deliveryCharge,
            shippingPrice: deliveryCharge,
            totalPrice: subtotal,
            totalDiscountedPrice: finalTotal - deliveryCharge,
            discount: (currentCart?.discount || 0),
            productDiscount: productDiscount || 0,
            promoCodeDiscount: promoDiscount || 0
          }));
          setOrderData(createdOrder);
        } catch (error) {
          console.error('Error creating guest order:', error);
          throw new Error('Failed to create order. Please try again.');
        }
    } else {
        // Create order for logged-in users
        const response = await dispatch(createOrder(orderRequestData));
        if (response.error) {
          throw new Error(response.error);
        }
        createdOrder = response.payload || order.order;
        setOrderData(createdOrder);
    }

      // Handle payment based on option
      await processPayment(createdOrder);

    } catch (error) {
      console.error('Error creating order:', error);
      setError(error.message || "Failed to create order. Please try again.");
      setIsSubmitting(false);
    }
  };

  const processPayment = async (order) => {
    try {
      const name = formValues.name || "";
      const phoneNumber = formValues.phoneNumber || "";
      const address = formValues.address || "";

      const paymentData = {
        orderId: order._id,
        paymentMethod: paymentOption,
        paymentOption: paymentOption,
        amount: finalTotal,
        // Add customer information for payment processing
        customerPhone: phoneNumber,
        customerName: name,
        customerEmail: formValues.email || '',
        // Add paymentPhoneNumber field that the server expects
        paymentPhoneNumber: phoneNumber,
        // Add guest checkout flag and due amount for COD
        isGuestCheckout: isGuestCheckout || isGuest,
        dueAmount: paymentOption === 'cod' ? finalTotal : 0,
        // Add JWT token for authenticated users
        jwt: !isGuestCheckout && !isGuest ? jwt : undefined,
        // Add address information
        shippingAddress: {
          firstName: name.split(' ')[0] || '',
          lastName: name.split(' ')[1] || '',
          phoneNumber: phoneNumber,
          email: formValues.email || '',
          streetAddress: address,
          city: deliveryArea === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka',
          zone: deliveryArea === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka',
          area: deliveryArea === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka',
          // Add required fields for payment validation
          division: deliveryArea === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka',
          district: deliveryArea === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka',
          upazilla: deliveryArea === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka'
        }
      };

      console.log('payment details:', paymentData);

      if (paymentOption === "online") {
        // Update paymentMethod to SSLCommerz in the data
        paymentData.paymentMethod = "SSLCommerz";
        
        const response = await dispatch(createPayment(paymentData));
        console.log('Payment response:', response);
        
        // Try multiple possible paths for the payment URL
        const paymentUrl = response?.paymentUrl || 
                          response?.payload?.paymentUrl || 
                          response?.data?.paymentUrl ||
                          response?.payload?.data?.paymentUrl ||
                          response?.response?.data?.paymentUrl;
        
        console.log('Extracted payment URL:', paymentUrl);
        
        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          console.error('Payment response structure:', JSON.stringify(response, null, 2));
          throw new Error("Payment URL not received. Please try again or contact support.");
        }
      } else if (paymentOption === "bkash") {
        // Update paymentMethod to bKash in the data
        paymentData.paymentMethod = "bKash";
        
        const response = await dispatch(createPayment(paymentData));
        console.log('bKash Payment response:', response);
        
        // Try multiple possible paths for the payment URL
        const paymentUrl = response?.paymentUrl || 
                          response?.payload?.paymentUrl || 
                          response?.data?.paymentUrl ||
                          response?.payload?.data?.paymentUrl ||
                          response?.response?.data?.paymentUrl;
        
        console.log('Extracted bKash payment URL:', paymentUrl);
        
        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          console.error('bKash Payment response structure:', JSON.stringify(response, null, 2));
          throw new Error("bKash payment URL not received. Please try again or contact support.");
        }
      } else if (paymentOption === "cod") {
        // Update paymentMethod to COD in the data
        paymentData.paymentMethod = "COD";
        console.log("COD Payment Data being sent:", paymentData);
        
        // Only clear cart for logged-in users
        if (!isGuestCheckout && jwt) {
          await dispatch(clearCart());
        }
        
        // Clean up guest cart data
        if (isGuestCheckout) {
          localStorage.removeItem('guestCart');
          localStorage.removeItem('guestCartItems');
          // Keep guest order data for confirmation page
        }
        
        // Ensure we have a valid order ID before redirecting
        const orderId = order._id || order.id;
        if (!orderId) {
          throw new Error("Order ID not found. Please contact support.");
        }
        
        window.location.href = `/order-confirmation?order_id=${orderId}&payment_type=cod&guest=${isGuestCheckout}`;
      }
    } catch (error) {
      console.error("Payment error:", error);
      setError(error.message || "Failed to process payment");
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          onClick={() => navigate('/cart')}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2, color: PRIMARY_COLOR }}
        >
          Back to Cart
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: PRIMARY_COLOR }}>
          Checkout
        </Typography>
      {isGuestCheckout && (
          <Alert severity="info" sx={{ mt: 2 }}>
          You are checking out as a guest. Your order can be tracked using your phone number.
          </Alert>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Combo Offers Banner */}
      <Box sx={{ mb: 3 }}>
        <ComboOfferSection
          appliedOffers={comboOfferData.appliedOffers}
          potentialSavings={comboOfferData.potentialSavings}
          totalComboDiscount={comboOfferData.totalComboDiscount}
          comboOfferDiscounts={comboOfferData.comboOfferDiscounts}
        />
      </Box>
      
      <Grid container spacing={4}>
        {/* Left Column - Forms */}
        <Grid item xs={12} md={8}>
          {/* Delivery Address Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: PRIMARY_COLOR }}>
              Delivery Address
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12}>
                <TextField
                  name="name"
                  label="Name"
                  fullWidth
                  value={formValues.name}
                  onChange={handleInputChange}
                  sx={commonTextFieldStyles}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <TextField
                  name="phoneNumber"
                  label="Phone Number"
                  fullWidth
                  value={formValues.phoneNumber}
                  onChange={handleInputChange}
                  sx={commonTextFieldStyles}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: PRIMARY_COLOR }}>
                  Delivery Area
                </Typography>
                <RadioGroup value={deliveryArea} onChange={(e) => setDeliveryArea(e.target.value)}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      mb: 2, 
                      cursor: 'pointer',
                      borderColor: deliveryArea === 'inside_dhaka' ? PRIMARY_COLOR : 'rgba(0,0,0,0.12)',
                      '&:hover': { borderColor: PRIMARY_COLOR }
                    }}
                    onClick={() => setDeliveryArea('inside_dhaka')}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel
                        value="inside_dhaka"
                        control={<Radio sx={{ '&.Mui-checked': { color: PRIMARY_COLOR } }} />}
                        label="Inside Dhaka (Tk. 60)"
                        sx={{ mr: 2 }}
                      />
                    </CardContent>
                  </Card>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      mb: 2, 
                      cursor: 'pointer',
                      borderColor: deliveryArea === 'outside_dhaka' ? PRIMARY_COLOR : 'rgba(0,0,0,0.12)',
                      '&:hover': { borderColor: PRIMARY_COLOR }
                    }}
                    onClick={() => setDeliveryArea('outside_dhaka')}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel
                        value="outside_dhaka"
                        control={<Radio sx={{ '&.Mui-checked': { color: PRIMARY_COLOR } }} />}
                        label="Outside Dhaka (Tk. 120)"
                        sx={{ mr: 2 }}
                      />
                    </CardContent>
                  </Card>
                </RadioGroup>
              </Grid>
              {isGuest && (
                <Grid item xs={12}>
                  <TextField
                    name="email"
                    label="Email (optional)"
                    fullWidth
                    type="email"
                    value={formValues.email}
                    onChange={handleInputChange}
                    sx={commonTextFieldStyles}
                    helperText="Provide an email to receive order confirmation"
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  name="address"
                  label="Street Address"
                  fullWidth
                  multiline
                  rows={2}
                  value={formValues.address}
                  onChange={handleInputChange}
                  sx={commonTextFieldStyles}
                  InputProps={{
                    startAdornment: <LocationOnIcon sx={{ mr: 1, mt: 1.5, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Promo Code Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: PRIMARY_COLOR }}>
              Promo Code
            </Typography>
            
            {currentCart?.promoDetails ? (
              // Show applied promo code
              <Box sx={{ 
                p: 2, 
                bgcolor: 'rgba(105, 175, 90, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(105, 175, 90, 0.3)'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: 600,
                      color: PRIMARY_COLOR
                    }}>
                      Applied: {currentCart.promoDetails.code}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {currentCart.promoDetails.discountType === 'PERCENTAGE' 
                        ? `${currentCart.promoDetails.discountAmount}% off`
                        : `Tk. ${currentCart.promoDetails.discountAmount} off`}
                    </Typography>
                  </Box>
        <Button
          variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleRemovePromoCode}
                    disabled={promoCodeLoading}
                    sx={{ minWidth: 'auto', px: 2 }}
                  >
                    Remove
                  </Button>
                </Box>
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  color: 'success.main'
                }}>
                  You saved Tk. {currentCart.promoCodeDiscount || 0}
                </Typography>
              </Box>
            ) : (
              // Show promo code input form
              <Box>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Enter Promo Code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    error={!!promoCodeError}
                    helperText={promoCodeError}
                    disabled={promoCodeLoading}
                    sx={commonTextFieldStyles}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        validatePromoCode();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={validatePromoCode}
                    disabled={promoCodeLoading || !promoCode.trim()}
          sx={{ 
                      bgcolor: PRIMARY_COLOR,
                      '&:hover': { bgcolor: SECONDARY_COLOR },
                      minWidth: 100,
                      height: 56 // Match TextField height
          }}
        >
                    {promoCodeLoading ? (
                      <CircularProgress size={20} sx={{ color: 'white' }} />
                    ) : (
                      'Apply'
                    )}
        </Button>
                </Box>
              </Box>
            )}
          </Paper>

          {/* Payment Options Section */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: PRIMARY_COLOR }}>
              Payment Method
            </Typography>
            
            <RadioGroup
              value={paymentOption}
              onChange={(e) => setPaymentOption(e.target.value)}
            >
              {/* Cash on Delivery - First option */}
              <Card 
                variant="outlined" 
                sx={{ 
                  mb: 2, 
                  cursor: 'pointer',
                  borderColor: paymentOption === 'cod' ? PRIMARY_COLOR : 'rgba(0,0,0,0.12)',
                  '&:hover': { borderColor: PRIMARY_COLOR }
                }}
                onClick={() => setPaymentOption('cod')}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    value="cod"
                    control={<Radio sx={{ '&.Mui-checked': { color: PRIMARY_COLOR } }} />}
                    label=""
                    sx={{ mr: 2 }}
                  />
                  <LocalShippingIcon sx={{ mr: 2, color: PRIMARY_COLOR }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Cash on Delivery
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pay when you receive your order
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* bKash Payment - Second option */}
              <Card 
                variant="outlined" 
                sx={{ 
                  mb: 2, 
                  cursor: 'pointer',
                  borderColor: paymentOption === 'bkash' ? PRIMARY_COLOR : 'rgba(0,0,0,0.12)',
                  '&:hover': { borderColor: PRIMARY_COLOR }
                }}
                onClick={() => setPaymentOption('bkash')}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    value="bkash"
                    control={<Radio sx={{ '&.Mui-checked': { color: PRIMARY_COLOR } }} />}
                    label=""
                    sx={{ mr: 2 }}
                  />
                  <AccountBalanceWalletIcon sx={{ mr: 2, color: "#E2136E" }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Pay with bKash
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pay securely using bKash mobile wallet
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* SSLCommerz Payment - Third option */}
              <Card 
                variant="outlined" 
                sx={{ 
                  mb: 2, 
                  cursor: 'pointer',
                  borderColor: paymentOption === 'online' ? PRIMARY_COLOR : 'rgba(0,0,0,0.12)',
                  '&:hover': { borderColor: PRIMARY_COLOR }
                }}
                onClick={() => setPaymentOption('online')}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    value="online"
                    control={<Radio sx={{ '&.Mui-checked': { color: PRIMARY_COLOR } }} />}
                    label=""
                    sx={{ mr: 2 }}
                  />
                  <CreditCardIcon sx={{ mr: 2, color: PRIMARY_COLOR }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Pay Online
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pay securely with SSL Commerz
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </RadioGroup>
          </Paper>
        </Grid>

        {/* Right Column - Order Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: PRIMARY_COLOR }}>
              Order Summary
            </Typography>

            {/* Cart Items */}
            <Box sx={{ mb: 3 }}>
              {effectiveCartItems.map((item, index) => {
                // Use combo pricing if available, otherwise use original pricing
                const displayPrice = item.hasComboOffer ? item.comboPerUnitPrice : (item.discountedPrice || item.product?.discountedPrice || item.product?.price || 0);
                const itemTotal = displayPrice * item.quantity;
                
                return (
                <Box key={index} sx={{ display: 'flex', mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                  <Box
                    component="img"
                    src={getImageUrl(item.product?.imageUrl || item.product?.selectedColorImages?.[0])}
                    alt={item.product?.title}
                    sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, mr: 2 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {item.product?.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.color} / {item.size} / Qty: {item.quantity}
                        {item.hasComboOffer && (
                          <Box component="span" sx={{ color: '#4CAF50', fontWeight: 600, ml: 1 }}>
                            • COMBO OFFER
                          </Box>
                        )}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                        Tk. {itemTotal.toFixed(0)}
                        {item.hasComboOffer && (
                          <Typography variant="caption" sx={{ color: '#666', textDecoration: 'line-through', ml: 1 }}>
                            {((item.product?.discountedPrice || item.product?.price || 0) * item.quantity).toFixed(0)}
                          </Typography>
                        )}
                    </Typography>
                  </Box>
                </Box>
                );
              })}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Price Breakdown */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Original Subtotal</Typography>
                <Typography variant="body2">Tk. {subtotal.toFixed(0)}</Typography>
              </Box>
              {(productDiscount > 0 || comboDiscount > 0) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="success.main">
                    Total Savings {comboDiscount > 0 && "(incl. combo offers)"}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    -Tk. {(productDiscount + comboDiscount).toFixed(0)}
                  </Typography>
                </Box>
              )}
              {promoDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="success.main">Promo Discount</Typography>
                  <Typography variant="body2" color="success.main">-Tk. {promoDiscount.toFixed(0)}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Items Total</Typography>
                <Typography variant="body2">Tk. {subtotalWithCombo.toFixed(0)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Delivery Charge</Typography>
                <Typography variant="body2">Tk. {deliveryCharge.toFixed(0)}</Typography>
      </Box>
    </Box>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: PRIMARY_COLOR }}>
                Tk. {finalTotal}
              </Typography>
            </Box>

            {/* Complete Order Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleCompleteOrder}
              disabled={isSubmitting || !deliveryArea}
              sx={{
                bgcolor: PRIMARY_COLOR,
                '&:hover': { bgcolor: SECONDARY_COLOR },
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : paymentOption === 'online' ? (
                'Proceed to Payment'
              ) : paymentOption === 'bkash' ? (
                'Pay with bKash'
              ) : (
                'Place COD Order'
              )}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
