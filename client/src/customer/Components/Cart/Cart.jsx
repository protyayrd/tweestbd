import React, { useState } from "react";
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
  Snackbar
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getCart } from "../../../Redux/Customers/Cart/Action";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const jwt = localStorage.getItem("jwt");
  const { cartItems, cart, loading, error } = useSelector(state => state.cart);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const fetchCart = async () => {
    try {
      await dispatch(getCart());
    } catch (error) {
      console.error('Error fetching cart:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error loading cart',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    if (!jwt) {
      navigate('/login');
      return;
    }

    fetchCart();
  }, [jwt, dispatch, navigate]);

  if (loading) {
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
          gap: 2
        }}>
          <ShoppingCartIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Your cart&apos;s empty
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Looks like you haven&apos;t added anything to your cart yet
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: '#333' }
            }}
          >
            Start Shopping
          </Button>
        </Box>
      </Container>
    );
  }

  const totalItems = cartItems.length;
  const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const totalDiscount = cartItems.reduce((total, item) => 
    total + ((item.product.price - item.product.discountedPrice) * item.quantity), 0);
  const finalTotal = subtotal - totalDiscount;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Cart Items */}
        <Box sx={{ flex: '2' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {cartItems.map((item) => (
              <CartItem key={item._id} item={item} showButton={true} />
            ))}
          </Box>
        </Box>

        {/* Order Summary */}
        <Box sx={{ flex: '1' }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Order Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">
                  Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                </Typography>
                <Typography>Tk. {subtotal.toFixed(2)}</Typography>
              </Box>
              
              {totalDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Discount</Typography>
                  <Typography color="success.main">
                    -Tk. {totalDiscount.toFixed(2)}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Delivery</Typography>
                <Typography color="success.main">Free</Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Total</Typography>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Tk. {finalTotal.toFixed(2)}
                </Typography>
                {totalDiscount > 0 && (
                  <Typography variant="caption" color="success.main">
                    You save Tk. {totalDiscount.toFixed(2)}
                  </Typography>
                )}
              </Box>
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/checkout?step=2")}
              sx={{
                py: 1.5,
                bgcolor: 'black',
                color: 'white',
                '&:hover': { bgcolor: '#333' }
              }}
            >
              Proceed to Checkout
            </Button>
          </Paper>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Cart;
