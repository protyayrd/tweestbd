import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  Breadcrumbs,
  Link,
  Drawer,
  IconButton,
  FormHelperText,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../../config/api';
import { getImageUrl } from '../../../config/api';
import CloseIcon from '@mui/icons-material/Close';
import { addItemToCart } from "../../../Redux/Customers/Cart/Action";
import AuthModal from '../Auth/AuthModal';

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeError, setPromoCodeError] = useState('');
  const [discount, setDiscount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [selectedImage, setSelectedImage] = useState(0);
  const [openCart, setOpenCart] = React.useState(false);
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/api/products/${productId}`);
        console.log('Raw API response:', response.data);
        // The response is the product object directly, not in an array
        const productData = response.data;
        console.log('Product data:', productData);
        console.log('Colors:', productData.colors);
        console.log('Size Guide:', productData.sizeGuide);
        setProduct(productData);
        if (productData.colors && productData.colors.length > 0) {
          console.log('First color:', productData.colors[0]);
          console.log('First color sizes:', productData.colors[0].sizes);
          setSelectedColor(productData.colors[0].name);
          if (productData.colors[0].sizes && productData.colors[0].sizes.length > 0) {
            setSelectedSize(productData.colors[0].sizes[0].name);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setSnackbar({
          open: true,
          message: 'Error loading product details',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleColorChange = (event) => {
    const colorName = event.target.value;
    setSelectedColor(colorName);
    const selectedColorObj = product.colors.find(c => c.name === colorName);
    if (selectedColorObj && selectedColorObj.sizes.length > 0) {
      setSelectedSize(selectedColorObj.sizes[0].name);
    } else {
      setSelectedSize('');
    }
    setSelectedImage(0);
  };

  const handleSizeChange = (event) => {
    setSelectedSize(event.target.value);
  };

  const handleQuantityChange = (event) => {
    const value = parseInt(event.target.value);
    if (value > 0) {
      const selectedColorObj = product.colors.find(c => c.name === selectedColor);
      if (selectedColorObj) {
        const selectedSizeObj = selectedColorObj.sizes.find(s => s.name === selectedSize);
        if (selectedSizeObj && value > selectedSizeObj.quantity) {
          setSnackbar({
            open: true,
            message: `Only ${selectedSizeObj.quantity} items available for this size`,
            severity: 'warning'
          });
          setQuantity(selectedSizeObj.quantity);
        } else {
          setQuantity(value);
        }
      }
    }
  };

  const getAvailableSizes = () => {
    const selectedColorObj = product.colors.find(c => c.name === selectedColor);
    console.log('Selected color object:', selectedColorObj);
    console.log('Available sizes:', selectedColorObj ? selectedColorObj.sizes : []);
    return selectedColorObj ? selectedColorObj.sizes : [];
  };

  const getAvailableQuantity = () => {
    const selectedColorObj = product.colors.find(c => c.name === selectedColor);
    if (selectedColorObj) {
      const selectedSizeObj = selectedColorObj.sizes.find(s => s.name === selectedSize);
      return selectedSizeObj ? selectedSizeObj.quantity : 0;
    }
    return 0;
  };

  const validatePromoCode = async () => {
    try {
      const response = await api.post('/api/promo-codes/validate', {
        code: promoCode,
        productId,
        orderAmount: product.discountedPrice * quantity
      });

      if (response.data.valid) {
        setDiscount(response.data.discount);
        setPromoCodeError('');
        setSnackbar({
          open: true,
          message: 'Promo code applied successfully!',
          severity: 'success'
        });
      }
    } catch (error) {
      setPromoCodeError(error.response?.data?.message || 'Invalid promo code');
      setDiscount(0);
    }
  };

  const handleSubmit = () => {
    if (!jwt) {
      setOpenAuthModal(true);
      return;
    }

    if (!product || !product._id) {
      setSnackbar({
        open: true,
        message: 'Product data is not available',
        severity: 'error'
      });
      return;
    }

    if (!selectedSize) {
      setSnackbar({
        open: true,
        message: 'Please select a size',
        severity: 'error'
      });
      return;
    }

    if (!selectedColor) {
      setSnackbar({
        open: true,
        message: 'Please select a color',
        severity: 'error'
      });
      return;
    }

    // Find the selected color object
    const selectedColorObj = product.colors.find(c => c.name === selectedColor);
    if (!selectedColorObj) {
      setSnackbar({
        open: true,
        message: 'Selected color not found',
        severity: 'error'
      });
      return;
    }

    // Match the server's expected data structure
    const cartData = {
      productId: product._id,
      size: selectedSize,
      quantity: quantity || 1,
      color: selectedColor,
      product: {
        _id: product._id,
        title: product.title,
        price: product.price,
        discountedPrice: product.discountedPrice
      }
    };

    console.log('Selected color before dispatch:', selectedColor);
    console.log('Cart data being sent:', cartData);
    
    // Pass cartData directly without nesting
    dispatch(addItemToCart(cartData))
      .then((response) => {
        console.log('Add to cart success:', response);
        setOpenCart(true);
        setSnackbar({
          open: true,
          message: 'Product added to cart successfully!',
          severity: 'success'
        });
      })
      .catch((error) => {
        console.error('Error adding to cart:', error);
        console.error('Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.response?.data?.message
        });

        // Handle specific error cases
        if (error.response?.status === 401) {
          setSnackbar({
            open: true,
            message: 'Please login to add items to cart',
            severity: 'error'
          });
          navigate('/login');
        } else if (error.response?.status === 400) {
          setSnackbar({
            open: true,
            message: error.response.data?.message || 'Invalid cart data. Please check your selections.',
            severity: 'error'
          });
        } else {
          setSnackbar({
            open: true,
            message: error.response?.data?.message || 'Error adding item to cart. Please try again.',
            severity: 'error'
          });
        }
      });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!product) {
    return (
      <Box p={3}>
        <Alert severity="error">Product not found</Alert>
      </Box>
    );
  }

  const finalPrice = product.discountedPrice - discount;

  // Cart Drawer Component
  const CartDrawer = () => (
    <Drawer
      anchor="right"
      open={openCart}
      onClose={() => setOpenCart(false)}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          bgcolor: 'white',
          p: 3
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Shopping Cart</Typography>
        <IconButton onClick={() => setOpenCart(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, borderBottom: '1px solid #eee', pb: 2 }}>
          <img 
            src={product.colors[selectedColor]?.images[selectedImage]} 
            alt={product.title}
            style={{ width: 80, height: 80, objectFit: 'cover' }}
          />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {product.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Size: {selectedSize}, Color: {selectedColor}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quantity: {quantity}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>
              Tk. {finalPrice.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/cart')}
            sx={{
              bgcolor: 'black',
              color: 'white',
              py: 1.5,
              '&:hover': {
                bgcolor: '#333'
              }
            }}
          >
            View Cart
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setOpenCart(false)}
            sx={{
              mt: 2,
              borderColor: 'black',
              color: 'black',
              py: 1.5,
              '&:hover': {
                borderColor: '#333',
                bgcolor: 'rgba(0,0,0,0.05)'
              }
            }}
          >
            Continue Shopping
          </Button>
        </Box>
      </Box>
    </Drawer>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/" sx={{ textDecoration: 'none' }}>
          Home
        </Link>
        <Link color="inherit" href="/men" sx={{ textDecoration: 'none' }}>
          Men
        </Link>
        <Typography color="text.primary">{product.title}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Left side - Images */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Thumbnail Column */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100px' }}>
              {selectedColor && product.colors.find(c => c.name === selectedColor)?.images.map((image, index) => (
                <Paper
                  key={index}
                  elevation={selectedImage === index ? 4 : 1}
                  sx={{
                    cursor: 'pointer',
                    border: selectedImage === index ? '2px solid #000' : '1px solid #ddd',
                    overflow: 'hidden',
                  }}
                  onClick={() => setSelectedImage(index)}
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${product.title} - ${index + 1}`}
                    style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                  />
                </Paper>
              ))}
            </Box>

            {/* Main Image */}
            <Box sx={{ flex: 1 }}>
              <Paper elevation={1} sx={{ height: '600px', overflow: 'hidden' }}>
                {selectedColor && (
                  <img
                    src={getImageUrl(product.colors.find(c => c.name === selectedColor)?.images[selectedImage])}
                    alt={product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </Paper>
            </Box>
          </Box>
        </Grid>

        {/* Right side - Product Info */}
        <Grid item xs={12} md={6}>
          <Box sx={{ maxWidth: '500px' }}>
            <Typography variant="h4" gutterBottom>
              {product.title}
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph>
              {product.description}
            </Typography>

            <Box sx={{ my: 3 }}>
              <Typography variant="h5" gutterBottom>
                Tk. {finalPrice.toFixed(2)}
                {product.discountPersent > 0 && (
                  <Typography
                    component="span"
                    sx={{
                      textDecoration: 'line-through',
                      color: 'text.secondary',
                      ml: 2,
                      fontSize: '1rem',
                    }}
                  >
                    Tk. {product.price.toFixed(2)}
                  </Typography>
                )}
              </Typography>
            </Box>

            {/* Product Details */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {product.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Selected Color: {selectedColor || 'Not Selected'}
              </Typography>
              <Typography variant="h6" color="primary">
                Tk. {finalPrice.toFixed(2)}
              </Typography>
              {discount > 0 && (
                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                  Original Price: Tk. {product.discountedPrice.toFixed(2)}
                </Typography>
              )}
            </Box>

            {/* Move Size Guide before Size Selection */}
            {product?.sizeGuide && (
              <Box sx={{ mt: 2, mb: 4, border: '1px solid #eee', borderRadius: 1, p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Size Guide
                </Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '12px', border: '1px solid #ddd', backgroundColor: '#f5f5f5', textAlign: 'left' }}>Size</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd', backgroundColor: '#f5f5f5', textAlign: 'center' }}>Chest (inches)</th>
                        <th style={{ padding: '12px', border: '1px solid #ddd', backgroundColor: '#f5f5f5', textAlign: 'center' }}>Body Length (inches)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.sizeGuide && Object.entries(product.sizeGuide)
                        .sort((a, b) => {
                          const sizeOrder = { 'S': 1, 'M': 2, 'L': 3, 'XL': 4, 'XXL': 5, 'XXXL': 6 };
                          return (sizeOrder[a[0]] || 99) - (sizeOrder[b[0]] || 99);
                        })
                        .map(([size, measurements]) => {
                          // Skip if measurements is not an object or missing required properties
                          if (!measurements || typeof measurements !== 'object' || !measurements.chest || !measurements.bodyLength) {
                            return null;
                          }
                          return (
                            <tr key={size} style={{
                              backgroundColor: size === selectedSize ? '#f8f8f8' : 'transparent'
                            }}>
                              <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: size === selectedSize ? 'bold' : 'normal' }}>{size}</td>
                              <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>{measurements.chest}"</td>
                              <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>{measurements.bodyLength}"</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </Box>
              </Box>
            )}

            {/* Color Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Color</InputLabel>
              <Select 
                value={selectedColor} 
                onChange={handleColorChange} 
                label="Color"
                error={!selectedColor}
              >
                {product?.colors?.map((color) => (
                  <MenuItem key={color.name} value={color.name}>
                    {color.name}
                  </MenuItem>
                ))}
              </Select>
              {!selectedColor && (
                <FormHelperText error>Please select a color</FormHelperText>
              )}
            </FormControl>

            {/* Size Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Size</InputLabel>
              <Select 
                value={selectedSize} 
                onChange={handleSizeChange} 
                label="Size"
                error={!selectedSize}
              >
                {getAvailableSizes()
                  .sort((a, b) => {
                    const sizeOrder = { 'S': 1, 'M': 2, 'L': 3, 'XL': 4, 'XXL': 5, 'XXXL': 6 };
                    return (sizeOrder[a.name] || 99) - (sizeOrder[b.name] || 99);
                  })
                  .map((size) => (
                    <MenuItem 
                      key={size.name} 
                      value={size.name}
                      disabled={size.quantity === 0}
                    >
                      {size.name} {size.quantity > 0 ? `(${size.quantity} available)` : '(Out of stock)'}
                    </MenuItem>
                  ))}
              </Select>
              {!selectedSize && (
                <FormHelperText error>Please select a size</FormHelperText>
              )}
            </FormControl>

            {/* Quantity */}
            <TextField
              type="number"
              label="Quantity"
              value={quantity}
              onChange={handleQuantityChange}
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{ 
                inputProps: { 
                  min: 1,
                  max: getAvailableQuantity()
                } 
              }}
              helperText={`${getAvailableQuantity()} items available`}
            />

            {/* Promo Code */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                label="Promo Code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                error={!!promoCodeError}
                helperText={promoCodeError}
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                onClick={validatePromoCode}
                sx={{ minWidth: '120px' }}
              >
                Apply
              </Button>
            </Box>

            {/* Add to Cart Button */}
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={handleSubmit}
              sx={{ mb: 2 }}
              disabled={!selectedColor || !selectedSize || quantity < 1 || quantity > getAvailableQuantity()}
            >
              Add to Cart
            </Button>

            {/* Additional Info */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Product Details
              </Typography>
              <Typography variant="body2" paragraph>
                • 100% Ultra Fine Cotton
              </Typography>
              <Typography variant="body2" paragraph>
                • 100% Two-Ply Weave Weighing 125 GSM
              </Typography>
              <Typography variant="body2" paragraph>
                • Fabric is Treated with Liquid Ammonia and Easy Care
              </Typography>
            </Box>

            {/* Care Instructions */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Care Instructions
              </Typography>
              <Typography variant="body2" paragraph>
                • Dry clean only
              </Typography>
              <Typography variant="body2" paragraph>
                • Do not bleach
              </Typography>
              <Typography variant="body2" paragraph>
                • Steam iron at low to medium heat
              </Typography>
              <Typography variant="body2" paragraph>
                • Do not iron over any embroidered areas
              </Typography>
              <Typography variant="body2" paragraph>
                • Do not iron over the label or the buttons
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <CartDrawer />
      <AuthModal open={openAuthModal} handleClose={() => setOpenAuthModal(false)} />
    </Box>
  );
};

export default ProductDetails; 