import React, { useState } from "react";
import { Button, CircularProgress, Grid, Paper, Typography, Box, Divider, Container, Alert, Stack } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import CartItem from "../Cart/CartItem";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getOrderById, createOrder, getOrderSummary } from "../../../Redux/Customers/Order/Action";
import { findUserCart } from "../../../Redux/Customers/Cart/Action";
import { trackInitiateCheckout } from "../../../utils/gtmEvents";
import AddressCard from "../adreess/AdreessCard";
import { getImageUrl } from "../../../config/api";
import pathaoService from '../../../services/pathaoService';
import priceService from '../../../services/priceCalculationService';
import PriceDetailsPanel from './PriceDetailsPanel';
import api from '../../../config/api';
import ArrowBack from '@mui/icons-material/ArrowBack';

const OrderSummary = ({ handleNext, handleBack, isGuestCheckout, guestCart }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get("order_id");
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const { order, cart } = useSelector(state => state);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliveryChargeLoading, setDeliveryChargeLoading] = useState(false);
  const [deliveryChargeError, setDeliveryChargeError] = useState(null);

  // For guest checkout, use the cart data passed as prop
  const activeCart = isGuestCheckout && !jwt ? guestCart : cart;
  const cartItems = activeCart?.cartItems || [];

  useEffect(() => {
    if(orderId) {
      dispatch(getOrderById(orderId));
    } else {
      // Fetch cart data when component mounts, but only for logged-in users
      if (!isGuestCheckout || jwt) {
        dispatch(findUserCart());
      }
    }
  }, [orderId, dispatch, isGuestCheckout, jwt]);
  
  // Track InitiateCheckout event when cart data is loaded
  useEffect(() => {
    if (!orderId && cart.cartItems && cart.cartItems.length > 0) {
      trackInitiateCheckout(cart.cartItems, cart);
    }
  }, [orderId, cart.cartItems, cart]);

  // Add this logging to see the full cart data structure
  useEffect(() => {
    // This block was intended to check for product colors
    // Since it's not doing anything, we can remove the empty conditionals
    // if (cart.cartItems && cart.cartItems.length > 0) {
    //   if (cart.cartItems[0]?.product?.colors) {
    //   } else {
    //   }
    // }
  }, [cart.cartItems]);

  // Optimize the calculateDeliveryCharge function to reduce CPU usage
  useEffect(() => {
    const calculateDeliveryCharge = async () => {
      try {
        // Skip if we're already loading or have a delivery charge for an existing order
        if (deliveryChargeLoading || (orderId && order.order?.deliveryCharge !== undefined)) {
          if (orderId && order.order?.deliveryCharge !== undefined) {
            setDeliveryCharge(order.order.deliveryCharge);
          }
          return;
        }
        
        setDeliveryChargeLoading(true);
        setDeliveryChargeError(null);
        
        // Get the selected address - only calculate once
        let addressData;
        try {
          addressData = JSON.parse(localStorage.getItem("selectedAddress"));
        } catch (e) {
          console.error('Error parsing selected address:', e);
          setDeliveryChargeError("Invalid address data");
          setDeliveryCharge(110); // Default to outside Dhaka rate
          setDeliveryChargeLoading(false);
          return;
        }
        
        if (!addressData || !addressData.city) {
          setDeliveryChargeError("Please select a delivery address");
          setDeliveryCharge(120); // Default to outside Dhaka rate
          setDeliveryChargeLoading(false);
          return;
        }

        try {
          // Simple delivery charge calculation based on city
          const cityName = addressData.city.toString().toLowerCase();
          let charge;
          if (cityName === 'dhaka') {
            charge = 60; // Dhaka main city
          } else if (cityName.includes('dhaka')) {
            charge = 90; // Dhaka sub areas
          } else {
            charge = 120; // Outside Dhaka
          }

          console.log('Delivery charge calculation:', {
            city: addressData.city,
            isDhaka,
            charge
          });

          setDeliveryCharge(charge);
          setDeliveryChargeError(null);
        } catch (error) {
          console.error('Error calculating delivery charge:', error);
          setDeliveryChargeError("Error calculating delivery charge");
          setDeliveryCharge(120); // Default to outside Dhaka rate
        } finally {
          setDeliveryChargeLoading(false);
        }
      } catch (error) {
        console.error('Error calculating delivery charge:', error);
        setDeliveryChargeError("Failed to calculate delivery charge");
        setDeliveryCharge(110); // Default rate
        setDeliveryChargeLoading(false);
      }
    };

    // Only calculate when component mounts or when order changes
    calculateDeliveryCharge();
  }, [orderId, order.order?.deliveryCharge, deliveryChargeLoading]);

  // For guest checkout with no cart data, redirect to cart
  useEffect(() => {
    if (isGuestCheckout && !jwt && (!guestCart || !cartItems || cartItems.length === 0)) {
      navigate("/cart");
    }
  }, [isGuestCheckout, jwt, guestCart, cartItems, navigate]);

  // Get address data from localStorage for guests
  const [guestAddress, setGuestAddress] = useState(null);
  
  useEffect(() => {
    if (isGuestCheckout && !jwt) {
      const addressData = localStorage.getItem('guestAddress');
      if (addressData) {
        try {
          setGuestAddress(JSON.parse(addressData));
        } catch (e) {
          console.error("Error parsing guest address:", e);
        }
      } else {
        // If no address data, go back to address form
        handleBack();
      }
    }
  }, [isGuestCheckout, jwt, handleBack]);

  // Use the appropriate address based on guest status
  const selectedAddress = isGuestCheckout && !jwt 
    ? guestAddress 
    : order?.order?.shippingAddress;

  // Optimize the address display logic by extracting the address parsing into a helper function
  const getFormattedAddress = (addressObj) => {
    if (!addressObj) return '';
    
    const parts = [];
    
    if (addressObj.streetAddress) parts.push(addressObj.streetAddress);
    if (addressObj.area) parts.push(addressObj.area);
    if (addressObj.zone) parts.push(addressObj.zone);
    if (addressObj.city) parts.push(addressObj.city);
    
    return parts.join(', ') + (addressObj.zipCode ? ` - ${addressObj.zipCode}` : '');
  };

  // Early return for loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Functions to calculate price details
  const calculateTotal = () => {
    if (isGuestCheckout && !jwt) {
      // For guest checkout, use the cart data directly
      const productPrice = Number(activeCart?.totalPrice || 0);
      const productDiscount = (Number(activeCart?.discount || 0) - (Number(activeCart?.promoCodeDiscount || 0)));
      const promoDiscount = Number(activeCart?.promoCodeDiscount || 0);
      const delivery = Number(deliveryCharge || 0);
      const totalAmount = Math.max(0, productPrice - productDiscount - promoDiscount + delivery);
      
      return {
        totalPrice: productPrice,
        totalDiscountedPrice: totalAmount,
        discount: productDiscount + promoDiscount,
        productDiscount: productDiscount || 0, // Ensure this is not null/undefined
        promoDiscount: promoDiscount || 0,
        deliveryCharge: delivery || 0,
        totalAmount: totalAmount
      };
    }
    
    // For logged-in users with existing order
    return {
      totalPrice: order?.order?.totalPrice || 0,
      totalDiscountedPrice: order?.order?.totalDiscountedPrice || 0,
      discount: order?.order?.discount || 0,
      productDiscount: order?.order?.productDiscount || 0, // Ensure this is not null/undefined
      deliveryCharge: order?.order?.deliveryCharge || 0,
      totalAmount: order?.order?.totalAmount || 0,
      promoDiscount: order?.order?.promoCodeDiscount || 0
    };
  };
  
  const priceDetails = calculateTotal();

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the selected address from localStorage
      const selectedAddress = JSON.parse(localStorage.getItem("selectedAddress"));
      
      if (!selectedAddress) {
        throw new Error("No address selected. Please go back and select a delivery address.");
      }
      
      // Calculate prices using the price service for consistency
      // This ensures the same calculation logic is used across components
      const productPrice = Number(cart.totalPrice) || 0;
      const productDiscount = (Number(cart.discount) || 0) - (Number(cart.promoCodeDiscount) || 0);
      const promoDiscount = Number(cart.promoCodeDiscount) || 0;
      const delivery = Number(deliveryCharge) || 0;
      
      // Calculate the total discounted price
      const finalPrice = priceService.calculateFinalPrice({
        productPrice,
        productDiscount,
        promoDiscount,
        deliveryCharge: delivery,
        paymentOption: 'online'
      });
      
      // Create the order data object with safe default values for all fields
      const orderData = {
        address: {
          ...selectedAddress,
          // Ensure all required fields exist
          division: selectedAddress.division || selectedAddress.state || "Dhaka",
          district: selectedAddress.district || selectedAddress.city || "Dhaka",
          upazilla: selectedAddress.upazilla || selectedAddress.area || selectedAddress.zone || "Gulshan",
          zipCode: selectedAddress.zipCode || "1212",
          isGuestAddress: true  // Set this flag for guest orders
        },
        orderItems: (cartItems || []).map((item) => ({
          product: item?.product?._id,
          size: item?.size || "",
          quantity: item?.quantity || 1,
          price: item?.price || 0,
          discountedPrice: item?.discountedPrice || 0,
          color: item?.color || ""
        })),
        totalPrice: productPrice + delivery,
        totalDiscountedPrice: finalPrice,
        discount: productDiscount + promoDiscount,
        productDiscount: productDiscount || 0,
        promoCodeDiscount: promoDiscount || 0,
        deliveryCharge: delivery || 0,
        totalItem: cartItems?.length || 0
      };

      // For guest checkout, save this data to localStorage to be accessible in the payment step
      if (isGuestCheckout && !jwt) {
        try {
          const guestOrderData = {
            ...orderData,
            cartItems: cartItems || [],
            _id: null // Will be filled after API response
          };
          
          localStorage.setItem('guestOrderData', JSON.stringify(guestOrderData));
        } catch (e) {
          console.error('Error saving guest order data to localStorage:', e);
          // Continue with the order creation anyway
        }
      }

      try {
        // Log the address data we're about to send
        console.log("Guest checkout address data:", {
          address: {
            ...selectedAddress,
            division: selectedAddress.division || selectedAddress.state || "Dhaka",
            district: selectedAddress.district || selectedAddress.city || "Dhaka",
            upazilla: selectedAddress.upazilla || selectedAddress.area || selectedAddress.zone || "Gulshan",
            zipCode: selectedAddress.zipCode || "1212"
          }
        });
        
        // Use the guest order API endpoint
        const response = await api.post('/api/orders/guest', orderData);
        
        if (response.data && response.data._id) {
          setLoading(false);
          
          // If guest checkout, update the order data in localStorage with the order ID
          if (isGuestCheckout && !jwt) {
            try {
              const guestOrderData = JSON.parse(localStorage.getItem('guestOrderData') || '{}');
              guestOrderData._id = response.data._id;
              localStorage.setItem('guestOrderData', JSON.stringify(guestOrderData));
            } catch (e) {
              console.error('Error updating guest order data in localStorage:', e);
              // Continue with the order creation anyway
            }
          }
          
          navigate(`/checkout?step=3&order_id=${response.data._id}`);
          handleNext();
          return;
        }
      } catch (error) {
        console.error('Error creating order:', error);
        console.error('Error response:', error.response?.data);
        setError(error.response?.data?.message || 'Failed to create order. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      setLoading(false);
      setError(error.message || "Failed to create order");
    }
  };

  const handleProceedToPayment = () => {
    // If we already have an order, just proceed to payment
    if (order.order) {
      handleNext();
    } else {
      // Otherwise create a new order first
      handleCreateOrder();
    }
  };

  // If we're creating a new order and don't have an order ID yet
  if (!orderId && !order.order) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper 
          elevation={0} 
          variant="outlined" 
          sx={{ 
            p: 4, 
            borderRadius: 2, 
            bgcolor: '#ffffff', 
            color: '#000000',
            border: '1px solid',
            borderColor: '#00503a20'
          }}
        >
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ 
              fontWeight: 600, 
              mb: 4, 
              color: '#000000',
              pb: 2,
              borderBottom: '2px solid',
              borderColor: '#00503a20'
            }}
          >
            Order Summary
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                '& .MuiAlert-icon': {
                  color: '#ff1744'
                }
              }}
            >
              {error}
            </Alert>
          )}
          
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontWeight: 600, 
                color: '#000000',
                mb: 2
              }}
            >
              Delivery Address
            </Typography>
            {JSON.parse(localStorage.getItem("selectedAddress")) ? (
              <Box sx={{ 
                p: 3, 
                bgcolor: '#00503a08', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: '#00503a20'
              }}>
                <Typography 
                  variant="subtitle1" 
                  gutterBottom 
                  sx={{
                    color: '#000000',
                    fontWeight: 600
                  }}
                >
                  {(() => {
                    try {
                      const addr = JSON.parse(localStorage.getItem("selectedAddress"));
                      return addr.name || `${addr.firstName || ''} ${addr.lastName || ''}`.trim();
                    } catch (e) {
                      console.error('Error parsing address:', e);
                      return 'Name not available';
                    }
                  })()}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{
                    color: '#000000',
                    mb: 1
                  }}
                >
                  {(() => {
                    try {
                      const addr = JSON.parse(localStorage.getItem("selectedAddress"));
                      return getFormattedAddress(addr);
                    } catch (e) {
                      console.error('Error parsing address:', e);
                      return 'Address data not available';
                    }
                  })()}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{
                    color: '#00503a',
                    fontWeight: 500
                  }}
                >
                  Phone: {JSON.parse(localStorage.getItem("selectedAddress")).mobile}
                </Typography>
              </Box>
            ) : (
              <Alert 
                severity="warning"
                sx={{
                  bgcolor: '#fff3e0',
                  color: '#ff6d00',
                  '& .MuiAlert-icon': {
                    color: '#ff6d00'
                  }
                }}
              >
                No address selected. Please go back and select a delivery address.
              </Alert>
            )}
          </Box>
          
          <Divider sx={{ my: 4, borderColor: '#00503a20' }} />
          
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              fontWeight: 600, 
              color: '#000000',
              mb: 3
            }}
          >
            Cart Items ({cart.cartItems?.length || 0})
          </Typography>
          
          {cart.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#00503a' }} />
            </Box>
          ) : cart.error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {cart.error}
            </Alert>
          ) : cart.cartItems && cart.cartItems.length > 0 ? (
            cart.cartItems.map((item) => (
              <Box 
                key={item._id} 
                sx={{ 
                  mb: 3,
                  pb: 3,
                  borderBottom: '1px solid',
                  borderColor: '#00503a20',
                  '&:last-child': {
                    borderBottom: 'none',
                    pb: 0,
                    mb: 0
                  }
                }}
              >
                {/* Debug information for price calculation */}
                {console.log('Item price details:', {
                  regularPrice: item.price,
                  discountedPrice: item.discountedPrice,
                  displayPrice: (item.discountedPrice !== undefined && item.discountedPrice > 0) ? item.discountedPrice : (item.price || 0)
                })}
                <Grid container spacing={3} alignItems="flex-start">
                  {/* Product Image */}
                  <Grid item xs={4} sm={3}>
                    <Box 
                      sx={{ 
                        height: { xs: 150, sm: 200 }, 
                        width: '100%',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        bgcolor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}
                    >
                      <Box
                        component="img"
                        src={(() => {
                          
                          try {
                            // Get the color directly from the item
                            const itemColor = item.color;
                            
                            // If we have colors array and a specific color, try to get color's image
                            if (itemColor && item.product?.colors) {
                              const selectedColor = item.product.colors.find(c => c.name === itemColor);
                              if (selectedColor?.images?.length > 0) {
                                const imagePath = selectedColor.images[0];
                                const imageUrl = getImageUrl(imagePath);
                                return imageUrl;
                              }
                            }
                            
                            // Check for selectedColorImages array (from cart service)
                            if (item.product?.selectedColorImages?.length > 0) {
                              const imageUrl = getImageUrl(item.product.selectedColorImages[0]);
                              return imageUrl;
                            }
                            
                            // First try to get the product's main image
                            if (item.product?.imageUrl) {
                              const imageUrl = getImageUrl(item.product.imageUrl);
                              return imageUrl;
                            }
                            
                            // Fallback to embedded SVG image
                            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzY2NjY2NiI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                          } catch (error) {
                            console.error('Error in image URL resolution:', error);
                            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iI2NjMDAwMCI+RXJyb3I8L3RleHQ+PC9zdmc+';
                          }
                        })()}
                        alt={item.product?.title || 'Product Image'}
                        sx={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'contain',
                          p: 2,
                          zIndex: 1,
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iI2NjMDAwMCI+RXJyb3I8L3RleHQ+PC9zdmc+';
                        }}
                      />
                    </Box>
                  </Grid>
                  
                  {/* Product Details */}
                  <Grid item xs={8} sm={9}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#000000',
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                        mb: 1
                      }}
                    >
                      {item.product?.title || 'Product'}
                    </Typography>
                    
                    <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                      <Typography 
                        variant="body1" 
                        sx={{
                          color: '#00503a',
                          fontWeight: 500
                        }}
                      >
                        Size: {item.size || 'N/A'}
                      </Typography>
                      {item.color && (
                        <Typography 
                          variant="body1" 
                          sx={{
                            color: '#00503a',
                            fontWeight: 500
                          }}
                        >
                          Color: {item.color}
                        </Typography>
                      )}
                      <Typography 
                        variant="body1" 
                        sx={{
                          color: '#00503a',
                          fontWeight: 500
                        }}
                      >
                        Qty: {item.quantity}
                      </Typography>
                    </Stack>
                    
                    {/* Price Display */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography 
                        variant="h6" 
                            sx={{ 
                          fontWeight: 600, 
                          color: '#00503a'
                            }}
                          >
                        {
                          // Debug the price values
                          (() => {
                            // Get product price directly from product object if item price is undefined
                            const productPrice = item.product?.price || 0;
                            const productDiscountedPrice = item.product?.discountedPrice || 0;
                            
                            // Use either item prices or product prices, whichever is available
                            const regularPrice = Number(item.price !== undefined ? item.price : productPrice) || 0;
                            const discPrice = Number(item.discountedPrice !== undefined ? item.discountedPrice : productDiscountedPrice) || 0;
                            
                            console.log('Price calculation details:', {
                              itemPrice: item.price,
                              itemDiscountedPrice: item.discountedPrice,
                              productPrice: productPrice,
                              productDiscountedPrice: productDiscountedPrice,
                              finalRegularPrice: regularPrice,
                              finalDiscPrice: discPrice
                            });
                            
                            // More reliable price calculation logic that handles all edge cases
                            const displayPrice = regularPrice > 0 ? (discPrice > 0 ? discPrice : regularPrice) : 0;
                            
                            return `৳${displayPrice.toFixed(2)}`;
                          })()
                        }
                          </Typography>
                      {(item.price || 0) > (item.discountedPrice || 0) && (
                        <>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              textDecoration: 'line-through', 
                              ml: 2,
                              color: '#666666'
                            }}
                          >
                            ৳{(item.price || 0).toFixed(2)}
                          </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                              ml: 2,
                            color: '#00503a',
                              bgcolor: '#00503a15',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              fontWeight: 500
                          }}
                        >
                            {(item.price || 0) > 0 ? Math.round(((item.price || 0) - (item.discountedPrice || 0)) / (item.price || 0) * 100) : 0}% off
                        </Typography>
                        </>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ))
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              Your cart is empty. Please add items to your cart before proceeding to checkout.
            </Alert>
          )}
          
          <Box sx={{ mt: 4 }}>
            <PriceDetailsPanel 
              totalItem={cartItems?.length || 0}
              totalPrice={activeCart?.totalPrice || 0}
              productDiscount={(Number(activeCart?.discount || 0) - Number(activeCart?.promoCodeDiscount || 0)) || 0}
              promoCodeDiscount={Number(activeCart?.promoCodeDiscount || 0)}
              deliveryCharge={deliveryCharge}
              paymentOption="online"
            />
          </Box>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleProceedToPayment}
              disabled={loading || !JSON.parse(localStorage.getItem("selectedAddress"))}
              sx={{
                bgcolor: 'black',
                color: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#00503a'
                },
                '&.Mui-disabled': {
                  bgcolor: '#cccccc',
                  color: '#666666'
                }
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Proceed to Payment'
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  if (order.loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <CircularProgress sx={{ color: '#000000' }} />
    </div>;
  }

  if (!order.order) {
    return <div className="flex justify-center items-center min-h-screen">
      <CircularProgress sx={{ color: '#000000' }} />
    </div>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {order.loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#000000' }} />
        </Box>
      ) : order.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {order.error}
        </Alert>
      ) : order.order ? (
        <Grid container spacing={4}>
          {/* Left Column - Order Details */}
          <Grid item xs={12} md={8}>
            <Paper 
              elevation={0} 
              variant="outlined" 
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: 2,
                bgcolor: '#ffffff',
                borderColor: 'rgba(0, 0, 0, 0.1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, color: '#000000' }}>
                Order Summary
              </Typography>
              
              {/* Order ID and Date */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="#000000" gutterBottom>
                  Order ID: {order.order.formattedOrderId || order.order._id}
                </Typography>
                <Typography variant="body2" color="#000000">
                  Placed on: {new Date(order.order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 3, bgcolor: 'rgba(0, 0, 0, 0.1)' }} />
              
              {/* Shipping Address */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#000000' }}>
                  Shipping Address
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(0, 0, 0, 0.02)', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'rgba(0, 0, 0, 0.1)'
                }}>
                  <Typography variant="body1" gutterBottom color="#000000" fontWeight={500}>
                    {order.order.shippingAddress?.firstName || ''} {order.order.shippingAddress?.lastName || ''}
                  </Typography>
                  <Typography variant="body2" color="#000000" gutterBottom>
                    {(() => {
                      try {
                        return getFormattedAddress(order.order.shippingAddress);
                      } catch (e) {
                        console.error('Error formatting order address:', e);
                        return 'Address data not available';
                      }
                    })()}
                  </Typography>
                  <Typography variant="body2" color="#000000">
                    Phone: {order.order.shippingAddress?.mobile || ''}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 3, bgcolor: 'rgba(0, 0, 0, 0.1)' }} />
              
              {/* Order Items */}
              <Box>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#000000',
                    mb: 3
                  }}
                >
                  Order Items ({order.order.orderItems.length})
                </Typography>
                
                {order.order.orderItems.map((item) => (
                  <Box 
                    key={item._id} 
                    sx={{ 
                      mb: 3,
                      pb: 3,
                      borderBottom: '1px solid',
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                      '&:last-child': {
                        borderBottom: 'none',
                        pb: 0,
                        mb: 0
                      }
                    }}
                  >
                    <Grid container spacing={3} alignItems="flex-start">
                      {/* Product Image */}
                      <Grid item xs={4} sm={3}>
                        <Box 
                          sx={{ 
                            height: { xs: 150, sm: 180 }, 
                            width: '100%',
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'rgba(0, 0, 0, 0.1)',
                            position: 'relative',
                            bgcolor: '#ffffff'
                          }}
                        >
                          <Box
                            component="img"
                            src={(() => {
                              
                              try {
                                // Get the color directly from the item
                                const itemColor = item.color;
                                
                                // Check for product details with color image (added in our updated createOrder)
                                if (item.productDetails?.colorImage) {
                                  const imageUrl = getImageUrl(item.productDetails.colorImage);
                                  return imageUrl;
                                }
                                
                                // Try to find matching product in the cart with the same color
                                if (itemColor && cart.cartItems && cart.cartItems.length > 0) {
                                  
                                  // Find a cart item with the same product ID and color
                                  const matchingCartItem = cart.cartItems.find(
                                    cartItem => 
                                      cartItem.product._id === item.product._id && 
                                      cartItem.color === itemColor
                                  );
                                  
                                  if (matchingCartItem) {
                                    
                                    // Try to get the image from the product's colors array
                                    if (matchingCartItem.product.colors) {
                                      const colorObj = matchingCartItem.product.colors.find(
                                        c => c.name === itemColor
                                      );
                                      
                                      if (colorObj?.images?.length > 0) {
                                        const imageUrl = getImageUrl(colorObj.images[0]);
                                        return imageUrl;
                                      }
                                    }
                                    
                                    // Try to get the image from selectedColorImages
                                    if (matchingCartItem.product.selectedColorImages?.length > 0) {
                                      const imageUrl = getImageUrl(matchingCartItem.product.selectedColorImages[0]);
                                      return imageUrl;
                                    }
                                  }
                                }
                                
                                // First try to get the product's main image
                                if (item.product?.imageUrl) {
                                  const imageUrl = getImageUrl(item.product.imageUrl);
                                  return imageUrl;
                                }
                                
                                // Fallback to embedded SVG image
                                return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzY2NjY2NiI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                              } catch (error) {
                                console.error('Error in image URL resolution:', error);
                                return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iI2NjMDAwMCI+RXJyb3I8L3RleHQ+PC9zdmc+';
                              }
                            })()}
                            alt={item.product?.title || 'Product Image'}
                            sx={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'contain',
                              p: 2,
                              zIndex: 1,
                              transition: 'transform 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.05)'
                              }
                            }}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iI2NjMDAwMCI+RXJyb3I8L3RleHQ+PC9zdmc+';
                            }}
                          />
                        </Box>
                      </Grid>
                      
                      {/* Product Details */}
                      <Grid item xs={8} sm={9}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#000000',
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                            mb: 1
                          }}
                        >
                          {item.product?.title || 'Product'}
                        </Typography>
                        
                        <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                          <Typography 
                            variant="body1" 
                            sx={{
                              color: '#00503a',
                              fontWeight: 500
                            }}
                          >
                            Size: {item.size || 'N/A'}
                          </Typography>
                          {item.color && (
                            <Typography 
                              variant="body1" 
                              sx={{
                                color: '#00503a',
                                fontWeight: 500
                              }}
                            >
                              Color: {item.color}
                            </Typography>
                          )}
                          <Typography 
                            variant="body1" 
                            sx={{
                              color: '#00503a',
                              fontWeight: 500
                            }}
                          >
                            Qty: {item.quantity}
                          </Typography>
                        </Stack>
                        
                        {/* Price Display */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600, 
                              color: '#00503a'
                            }}
                          >
                            ৳{(item.discountedPrice || 0).toFixed(2)}
                          </Typography>
                          {(item.price || 0) > (item.discountedPrice || 0) && (
                            <>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  textDecoration: 'line-through', 
                                  ml: 2,
                                  color: '#666666'
                                }}
                              >
                                ৳{(item.price || 0).toFixed(2)}
                              </Typography>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  ml: 2,
                                  color: '#00503a',
                                  bgcolor: '#00503a15',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontWeight: 500
                                }}
                              >
                                {(item.price || 0) > 0 ? Math.round(((item.price || 0) - (item.discountedPrice || 0)) / (item.price || 0) * 100) : 0}% off
                              </Typography>
                            </>
                          )}
                        </Box>
                        
                        {/* Item Total */}
                        <Typography 
                          variant="subtitle1" 
                          sx={{
                            color: '#000000',
                            fontWeight: 500
                          }}
                        >
                          Total: ৳{((item.discountedPrice || 0) * (item.quantity || 1)).toFixed(2)}
                          {(item.price || 0) > (item.discountedPrice || 0) && (
                            <Typography 
                              component="span" 
                              variant="body1" 
                              sx={{ 
                                ml: 1,
                                color: '#00503a',
                                fontWeight: 500
                              }}
                            >
                              (Save ৳{(((item.price || 0) - (item.discountedPrice || 0)) * (item.quantity || 1)).toFixed(2)})
                            </Typography>
                          )}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
          
          {/* Right Column - Price Details */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0} 
              variant="outlined" 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                position: 'sticky',
                top: 24,
                bgcolor: '#ffffff',
                borderColor: '#00503a20',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              {order.order && (
                <PriceDetailsPanel 
                  {...priceService.formatOrderPriceData(order.order, 'online')}
                />
              )}
              
              {/* Payment Button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleProceedToPayment}
                sx={{
                  mt: 4,
                  bgcolor: '#000000',
                  color: '#ffffff',
                  '&:hover': { bgcolor: '#00503a' },
                  py: 1.5
                }}
              >
                Proceed to Payment
              </Button>
            </Paper>
          </Grid>
        </Grid>
      ) : null}
    </Container>
  );
}

export default OrderSummary;
