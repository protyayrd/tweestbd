import React, { useState } from "react";
import { Button, CircularProgress, Grid, Paper, Typography, Box, Divider, Container, Alert, Stack } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import CartItem from "../Cart/CartItem";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getOrderById, createOrder } from "../../../Redux/Customers/Order/Action";
import AddressCard from "../adreess/AdreessCard";
import { getImageUrl } from "../../../config/api";

const OrderSummary = ({ handleNext }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get("order_id");
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const { order, cart } = useSelector(state => state);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if(orderId) {
      dispatch(getOrderById(orderId));
    }
  }, [orderId, dispatch]);

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the selected address from localStorage
      const selectedAddress = JSON.parse(localStorage.getItem("selectedAddress"));
      
      if (!selectedAddress) {
        throw new Error("No address selected. Please go back and select a delivery address.");
      }
      
      const orderData = {
        address: selectedAddress,
        orderItems: cart.cartItems.map((item) => ({
          product: item.product._id,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          discountedPrice: item.discountedPrice,
          color: item.color || null // Ensure color is included
        })),
        totalPrice: cart.totalPrice,
        totalDiscountedPrice: cart.totalDiscountedPrice,
        discount: cart.discount,
        productDiscount: cart.discount - (cart.promoCodeDiscount || 0),
        promoCodeDiscount: cart.promoCodeDiscount || 0,
        promoDetails: cart.promoDetails || {
          code: null,
          discountType: null,
          discountAmount: 0,
          maxDiscountAmount: null
        },
        totalItem: cart.totalItem,
        jwt: jwt
      };

      console.log("Creating order with data:", orderData);
      const result = await dispatch(createOrder(orderData));
      setLoading(false);
      
      // If we have an order ID, update the URL and then proceed to next step
      if (result?.payload?._id) {
        navigate(`/checkout?step=3&order_id=${result.payload._id}`);
      }
      
      handleNext();
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
        <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: '#ffffff', color: '#000000' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, color: '#000000' }}>
            Order Summary
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#000000' }}>
              Selected Address
            </Typography>
            {JSON.parse(localStorage.getItem("selectedAddress")) ? (
              <Box sx={{ 
                p: 2, 
                bgcolor: '#f5f5f5', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: '#000000'
              }}>
                <Typography variant="body1" gutterBottom color="#000000">
                  {JSON.parse(localStorage.getItem("selectedAddress")).firstName} {JSON.parse(localStorage.getItem("selectedAddress")).lastName}
                </Typography>
                <Typography variant="body2" color="#000000" gutterBottom>
                  {JSON.parse(localStorage.getItem("selectedAddress")).streetAddress}
                  {JSON.parse(localStorage.getItem("selectedAddress")).upazilla ? `, ${JSON.parse(localStorage.getItem("selectedAddress")).upazilla}` : ''}
                  {JSON.parse(localStorage.getItem("selectedAddress")).district ? `, ${JSON.parse(localStorage.getItem("selectedAddress")).district}` : ''}
                  {JSON.parse(localStorage.getItem("selectedAddress")).division ? `, ${JSON.parse(localStorage.getItem("selectedAddress")).division}` : ''}
                  {JSON.parse(localStorage.getItem("selectedAddress")).zipCode ? ` - ${JSON.parse(localStorage.getItem("selectedAddress")).zipCode}` : ''}
                </Typography>
                <Typography variant="body2" color="#000000">
                  Phone: {JSON.parse(localStorage.getItem("selectedAddress")).mobile}
                </Typography>
              </Box>
            ) : (
              <Alert severity="warning">
                No address selected. Please go back and select a delivery address.
              </Alert>
            )}
          </Box>
          
          <Divider sx={{ my: 3, bgcolor: '#000000' }} />
          
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#000000' }}>
            Cart Items
          </Typography>
          
          {cart.cartItems.map((item) => (
            <Box key={item._id} sx={{ mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={3} sm={2}>
                  <Box sx={{ 
                    height: 80, 
                    width: 80, 
                    position: 'relative', 
                    border: '1px solid #000000',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}>
                    <img 
                      src={item.product.imageUrl && item.product.imageUrl.length > 0 
                        ? getImageUrl(item.product.imageUrl[0]) 
                        : 'https://via.placeholder.com/80'}
                      alt={item.product.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/80';
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={9} sm={10}>
                  <Typography variant="body1" gutterBottom color="#000000">
                    {item.product.title}
                  </Typography>
                  <Typography variant="body2" color="#000000">
                    Size: {item.size}
                    {item.color && `, Color: ${item.color}`}
                    , Qty: {item.quantity}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#000000' }}>
                      ৳{item.discountedPrice}
                    </Typography>
                    {item.price !== item.discountedPrice && (
                      <>
                        <Typography variant="body2" sx={{ textDecoration: 'line-through', ml: 1 }} color="#666666">
                          ৳{item.price}
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 1 }} color="#000000">
                          ({Math.round(((item.price - item.discountedPrice) / item.price) * 100)}% off)
                        </Typography>
                      </>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="#000000">
                      Total: ৳{(item.discountedPrice * item.quantity).toFixed(2)}
                    </Typography>
                    {item.price !== item.discountedPrice && (
                      <>
                        <Typography variant="body2" sx={{ textDecoration: 'line-through', ml: 1 }} color="#666666">
                          ৳{(item.price * item.quantity).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="#000000" sx={{ ml: 1 }}>
                          (Save ৳{((item.price - item.discountedPrice) * item.quantity).toFixed(2)})
                        </Typography>
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2, bgcolor: '#000000' }} />
            </Box>
          ))}
          
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body1" color="#000000">Subtotal ({cart.totalItem} {cart.totalItem === 1 ? 'item' : 'items'})</Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="body1" color="#000000">৳{cart.totalPrice}</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body1" color="#000000">Product Discount</Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="body1" color="#000000">-৳{cart.discount - (cart.promoCodeDiscount || 0)}</Typography>
              </Grid>
              
              {cart.promoCodeDiscount > 0 && (
                <>
                  <Grid item xs={6}>
                    <Typography variant="body1" color="#000000">Promo Code Discount</Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="body1" color="#000000">-৳{cart.promoCodeDiscount}</Typography>
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1, bgcolor: '#000000' }} />
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#000000' }}>Total</Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#000000' }}>৳{cart.totalDiscountedPrice}</Typography>
              </Grid>
              
              {cart.discount > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: '#f5f5f5',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: '#000000',
                    mt: 1
                  }}>
                    <Typography variant="body2" color="#000000" sx={{ fontWeight: 500 }}>
                      You save ৳{cart.discount} ({Math.round((cart.discount / cart.totalPrice) * 100)}% off) on this order
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={handleProceedToPayment}
              disabled={loading || !JSON.parse(localStorage.getItem("selectedAddress"))}
              sx={{ 
                bgcolor: '#000000', 
                color: '#ffffff',
                '&:hover': {
                  bgcolor: '#333333',
                },
                '&.Mui-disabled': {
                  bgcolor: '#cccccc',
                  color: '#666666'
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Proceed to Payment"}
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
                borderColor: '#000000'
              }}
            >
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, color: '#000000' }}>
                Order Summary
              </Typography>
              
              {/* Order ID and Date */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="#000000" gutterBottom>
                  Order ID: {order.order._id}
                </Typography>
                <Typography variant="body2" color="#000000">
                  Placed on: {new Date(order.order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 3, bgcolor: '#000000' }} />
              
              {/* Shipping Address */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#000000' }}>
                  Shipping Address
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: '#f5f5f5', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: '#000000'
                }}>
                  <Typography variant="body1" gutterBottom color="#000000">
                    {order.order.shippingAddress?.firstName || ''} {order.order.shippingAddress?.lastName || ''}
                  </Typography>
                  <Typography variant="body2" color="#000000" gutterBottom>
                    {order.order.shippingAddress?.streetAddress || ''}
                    {order.order.shippingAddress?.upazilla ? `, ${order.order.shippingAddress.upazilla}` : ''}
                    {order.order.shippingAddress?.district ? `, ${order.order.shippingAddress.district}` : ''}
                    {order.order.shippingAddress?.division ? `, ${order.order.shippingAddress.division}` : ''}
                    {order.order.shippingAddress?.zipCode ? ` - ${order.order.shippingAddress.zipCode}` : ''}
                  </Typography>
                  <Typography variant="body2" color="#000000">
                    Phone: {order.order.shippingAddress?.mobile || ''}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 3, bgcolor: '#000000' }} />
              
              {/* Order Items */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#000000' }}>
                  Order Items ({order.order.orderItems.length})
                </Typography>
                
                {order.order.orderItems.map((item) => (
                  <Box 
                    key={item._id} 
                    sx={{ 
                      display: 'flex', 
                      py: 2,
                      borderBottom: '1px solid',
                      borderColor: '#000000'
                    }}
                  >
                    {/* Product Image */}
                    <Box 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: 1,
                        overflow: 'hidden',
                        mr: 2,
                        border: '1px solid',
                        borderColor: '#000000'
                      }}
                    >
                      <Box
                        component="img"
                        src={item.product?.imageUrl && Array.isArray(item.product.imageUrl) && item.product.imageUrl.length > 0
                          ? getImageUrl(item.product.imageUrl[0])
                          : item.product?.imageUrl 
                            ? getImageUrl(item.product.imageUrl)
                            : 'https://via.placeholder.com/80'}
                        alt={item.product?.title || 'Product Image'}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/80';
                        }}
                      />
                    </Box>
                    
                    {/* Product Details */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#000000' }}>
                        {item.product?.title || 'Product'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1, gap: 2 }}>
                        <Typography variant="body2" color="#000000">
                          Size: {item.size || 'N/A'}
                        </Typography>
                        {item.color && (
                          <Typography variant="body2" color="#000000">
                            Color: {item.color}
                          </Typography>
                        )}
                        <Typography variant="body2" color="#000000">
                          Qty: {item.quantity}
                        </Typography>
                      </Box>
                      
                      {/* Price Display */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: '#000000', mr: 1 }}>
                          Tk. {item.discountedPrice}
                        </Typography>
                        {item.price > item.discountedPrice && (
                          <>
                            <Typography 
                              variant="body2" 
                              color="#666666" 
                              sx={{ textDecoration: 'line-through', mr: 1 }}
                            >
                              Tk. {item.price}
                            </Typography>
                            <Typography variant="body2" color="#000000">
                              ({Math.round(((item.price - item.discountedPrice) / item.price) * 100)}% off)
                            </Typography>
                          </>
                        )}
                      </Box>
                      
                      {/* Item Total with Savings */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="#000000" sx={{ mr: 1 }}>
                          Item Total: Tk. {(item.discountedPrice * item.quantity).toFixed(2)}
                        </Typography>
                        {item.price > item.discountedPrice && (
                          <Typography variant="body2" color="#000000">
                            (Save Tk. {((item.price - item.discountedPrice) * item.quantity).toFixed(2)})
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    {/* Item Total */}
                    <Box sx={{ ml: 2, textAlign: 'right', minWidth: '80px' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                        Tk. {(item.discountedPrice * item.quantity).toFixed(2)}
                      </Typography>
                      {item.price > item.discountedPrice && (
                        <Typography variant="body2" color="#000000">
                          Save Tk. {((item.price - item.discountedPrice) * item.quantity).toFixed(2)}
                        </Typography>
                      )}
                    </Box>
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
                borderColor: '#000000'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: '#000000' }}>
                Price Details
              </Typography>
              
              <Stack spacing={2}>
                {/* Original Price */}
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="#000000">
                    Original Price ({order.order.totalItem} {order.order.totalItem === 1 ? 'item' : 'items'})
                  </Typography>
                  <Typography color="#000000">Tk. {order.order.totalPrice.toFixed(2)}</Typography>
                </Stack>
                
                {/* Product Discount */}
                {order.order.productDiscount > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography color="#000000" sx={{ fontWeight: 500 }}>
                        Product Discount
                      </Typography>
                      <Typography variant="caption" color="#000000">
                        ({Math.round((order.order.productDiscount / order.order.totalPrice) * 100)}% off)
                      </Typography>
                    </Box>
                    <Typography color="#000000" sx={{ fontWeight: 500 }}>
                      -Tk. {order.order.productDiscount.toFixed(2)}
                    </Typography>
                  </Stack>
                )}
                
                {/* Promo Code Discount */}
                {order.order.promoCodeDiscount > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography color="#000000" sx={{ fontWeight: 500 }}>
                        Coupon Discount
                      </Typography>
                      {order.order.promoDetails && (
                        <Typography variant="caption" color="#000000">
                          {order.order.promoDetails.code} ({order.order.promoDetails.discountType === 'PERCENTAGE' 
                            ? `${order.order.promoDetails.discountAmount}%` 
                            : `Tk. ${order.order.promoDetails.discountAmount}`})
                        </Typography>
                      )}
                    </Box>
                    <Typography color="#000000" sx={{ fontWeight: 500 }}>
                      -Tk. {order.order.promoCodeDiscount.toFixed(2)}
                    </Typography>
                  </Stack>
                )}
                
                {/* Delivery Charge */}
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="#000000">Delivery Charge</Typography>
                  <Typography color="#000000">
                    {order.order.deliveryCharge > 0 
                      ? `Tk. ${order.order.deliveryCharge.toFixed(2)}` 
                      : <Typography component="span" color="#000000">FREE</Typography>}
                  </Typography>
                </Stack>
                
                <Divider sx={{ bgcolor: '#000000' }} />
                
                {/* Total Savings */}
                {(order.order.productDiscount > 0 || order.order.promoCodeDiscount > 0) && (
                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: '#f5f5f5',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: '#000000'
                  }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle2" color="#000000" sx={{ fontWeight: 600 }}>
                          Total Savings
                        </Typography>
                        <Typography variant="caption" color="#000000">
                          {Math.round(((order.order.productDiscount + order.order.promoCodeDiscount) / order.order.totalPrice) * 100)}% off
                        </Typography>
                      </Box>
                      <Typography variant="subtitle2" color="#000000" sx={{ fontWeight: 600 }}>
                        Tk. {(order.order.productDiscount + order.order.promoCodeDiscount).toFixed(2)}
                      </Typography>
                    </Stack>
                  </Box>
                )}
                
                {/* Final Amount */}
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#000000' }}>
                    Amount to Pay
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#000000' }}>
                    Tk. {order.order.totalDiscountedPrice.toFixed(2)}
                  </Typography>
                </Stack>
              </Stack>
              
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
                  '&:hover': { bgcolor: '#333333' },
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
