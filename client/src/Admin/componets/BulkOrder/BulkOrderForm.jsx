import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  Grid,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useDispatch, useSelector } from 'react-redux';
import { createBulkOrder } from '../../../Redux/Admin/Order/Action';
import { findProducts } from '../../../Redux/Customers/Product/Action';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BulkOrderForm = () => {
  const dispatch = useDispatch();
  const { content: products, loading } = useSelector((state) => state.customersProduct);
  const [orderItems, setOrderItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    streetAddress: '',
    division: '',
    district: '',
    upazilla: '',
    zipCode: '',
    mobile: '',
  });

  useEffect(() => {
    dispatch(findProducts({}));
  }, [dispatch]);

  const handleAddItem = () => {
    if (!selectedProduct || !selectedSize || quantity < 1) {
      toast.error('Please fill all required fields');
      return;
    }

    const product = products?.find((p) => p._id === selectedProduct);
    if (!product) return;

    const newItem = {
      product: selectedProduct,
      productDetails: product,
      size: selectedSize,
      quantity: quantity,
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProduct('');
    setSelectedSize('');
    setQuantity(1);
  };

  const handleRemoveItem = (index) => {
    const newItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(newItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    const requiredFields = ['firstName', 'lastName', 'streetAddress', 'division', 'district', 'upazilla', 'zipCode', 'mobile'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill all required address fields: ${missingFields.join(', ')}`);
      return;
    }

    const orderData = {
      orderItems: orderItems.map(item => ({
        product: item.product,
        quantity: item.quantity,
        size: item.size,
      })),
      shippingAddress,
      notes,
      paymentMethod: 'CASH_ON_DELIVERY', // Default payment method
    };

    dispatch(createBulkOrder(orderData))
      .then(() => {
        toast.success('Bulk order created successfully');
        setOrderItems([]);
        setNotes('');
        setShippingAddress({
          firstName: '',
          lastName: '',
          streetAddress: '',
          division: '',
          district: '',
          upazilla: '',
          zipCode: '',
          mobile: '',
        });
      })
      .catch((error) => {
        toast.error(error.message || 'Error creating bulk order');
      });
  };

  return (
    <Box component={Paper} p={3}>
      <Typography variant="h5" gutterBottom>
        Create Bulk Order
      </Typography>

      <form onSubmit={handleSubmit}>
        {/* Product Selection */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <Select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                displayEmpty
                placeholder="Select Product"
                disabled={loading}
              >
                <MenuItem value="">Select Product</MenuItem>
                {loading ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} />
                    Loading products...
                  </MenuItem>
                ) : products?.map((product) => (
                  <MenuItem key={product._id} value={product._id}>
                    {product.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <Select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                displayEmpty
                disabled={!selectedProduct || loading}
              >
                <MenuItem value="">Select Size</MenuItem>
                {selectedProduct &&
                  products?.find((p) => p._id === selectedProduct)
                    ?.colors?.reduce((sizes, color) => {
                      color.sizes.forEach((size) => {
                        if (!sizes.find((s) => s.name === size.name)) {
                          sizes.push(size);
                        }
                      });
                      return sizes;
                    }, [])
                    ?.map((size) => (
                      <MenuItem key={size.name} value={size.name}>
                        {size.name}
                      </MenuItem>
                    ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
              fullWidth
              label="Quantity"
              InputProps={{ inputProps: { min: 1 } }}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              onClick={handleAddItem}
              startIcon={<AddIcon />}
              fullWidth
              disabled={loading}
            >
              Add Item
            </Button>
          </Grid>
        </Grid>

        {/* Order Items Table */}
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orderItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.productDetails.title}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    ₹{(item.productDetails.discountedPrice * item.quantity).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleRemoveItem(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {orderItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No items added yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Shipping Address */}
        <Typography variant="h6" gutterBottom>
          Shipping Address
        </Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Name"
              value={shippingAddress.firstName}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, firstName: e.target.value })
              }
              required
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={shippingAddress.lastName}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, lastName: e.target.value })
              }
              required
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              value={shippingAddress.streetAddress}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, streetAddress: e.target.value })
              }
              required
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Division"
              value={shippingAddress.division}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, division: e.target.value })
              }
              required
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="District"
              value={shippingAddress.district}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, district: e.target.value })
              }
              required
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Upazilla"
              value={shippingAddress.upazilla}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, upazilla: e.target.value })
              }
              required
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="ZIP Code"
              value={shippingAddress.zipCode}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, zipCode: e.target.value })
              }
              required
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mobile"
              value={shippingAddress.mobile}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, mobile: e.target.value })
              }
              required
              disabled={loading}
            />
          </Grid>
        </Grid>

        {/* Notes */}
        <TextField
          fullWidth
          label="Order Notes"
          multiline
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 3 }}
          disabled={loading}
        />

        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          size="large"
          disabled={loading || orderItems.length === 0}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Creating Order...
            </>
          ) : (
            'Create Bulk Order'
          )}
        </Button>
      </form>
    </Box>
  );
};

export default BulkOrderForm; 

