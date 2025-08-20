import {
  Button,
  Grid,
  Rating,
  TextField,
  Typography,
  useMediaQuery,
  Box,
  Container,
  Paper,
  Divider,
  Chip,
  Alert,
  Stack,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Tooltip,
  Avatar,
  CircularProgress,
  Breadcrumbs
} from "@mui/material";
import React, { useEffect, useState } from "react";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { useDispatch, useSelector } from "react-redux";
import { createReview, createRating } from "../../../Redux/Customers/Review/Action";
import { useNavigate, useParams, Link } from "react-router-dom";
import { findProductById } from "../../../Redux/Customers/Product/Action";
import { useTheme } from "@mui/material/styles";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import VerifiedIcon from "@mui/icons-material/Verified";
import HomeIcon from "@mui/icons-material/Home";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import { API_BASE_URL } from '../../../config/api';

// Sample rating distribution data (can be replaced with actual data from API)
const ratingDistribution = [
  { value: 5, count: 2450 },
  { value: 4, count: 1800 },
  { value: 3, count: 580 },
  { value: 2, count: 120 },
  { value: 1, count: 50 }
];

// Calculate total ratings and average
const totalRatings = ratingDistribution.reduce((acc, item) => acc + item.count, 0);
const averageRating = ratingDistribution.reduce((acc, item) => acc + item.value * item.count, 0) / totalRatings;

const RatingBar = ({ value, count, total }) => {
  const percentage = (count / total) * 100;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
      <Box sx={{ width: 25, textAlign: 'center', mr: 1 }}>
        <Typography variant="body2">{value}</Typography>
      </Box>
      <StarIcon sx={{ color: '#faaf00', fontSize: 16, mr: 1 }} />
      <Box sx={{ flexGrow: 1, mr: 2 }}>
        <LinearProgress 
          variant="determinate" 
          value={percentage} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            backgroundColor: 'rgba(0,0,0,0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#faaf00',
              borderRadius: 4
            }
          }} 
        />
      </Box>
      <Box sx={{ width: 40 }}>
        <Typography variant="caption">{count}</Typography>
      </Box>
    </Box>
  );
};

const RateProduct = () => {
  const [formData, setFormData] = useState({ 
    title: "", 
    description: ""
  });
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const { customersProduct } = useSelector((store) => store);
  const { productId } = useParams();
  const navigate = useNavigate();

  // Format image URL - Fixed to properly handle API_BASE_URL
  const formatImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    // Clean up the URL path
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    
    // Make sure API_BASE_URL doesn't end with a slash and cleanUrl doesn't start with one
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    
    return `${baseUrl}/${cleanUrl}`;
  };

  const handleRateProduct = (event, newValue) => {
    setRating(newValue);
  };

  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!rating) {
      setError("Please select a rating");
      return;
    }
    
    if (!formData.title.trim()) {
      setError("Please provide a review title");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      // Send both rating and review
      await dispatch(createRating({ rating, productId }));
      await dispatch(createReview({ review: formData.title, description: formData.description, productId }));
      
      setSuccess(true);
      setFormData({ title: "", description: "" });
      setRating(0);
      
      // Redirect after showing success message
      setTimeout(() => {
        navigate(`/product/${productId}`);
      }, 1500);
    } catch (err) {
      setError("Failed to submit review. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabelText = (value) => {
    const labels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[value] || '';
  };

  useEffect(() => {
    dispatch(findProductById({ productId }));
  }, [dispatch, productId]);

  const product = customersProduct.product || {};
  const imageUrl = product?.imageUrl;
  const formattedImageUrl = imageUrl ? formatImageUrl(imageUrl) : '';

  const handleCancel = () => {
    if (productId) {
              navigate(product?.slug ? `/product/${product.slug}` : `/product/${productId}`);
    } else {
      navigate('/account/orders');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<KeyboardArrowRightIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link 
          to="/"
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            color: 'inherit',
            textDecoration: 'none'
          }}
        >
          <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
          Home
        </Link>
        <Link
          to="/account/order"
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            color: 'inherit',
            textDecoration: 'none'
          }}
        >
          <ShoppingBagIcon sx={{ mr: 0.5, fontSize: 18 }} />
          My Orders
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <StarIcon sx={{ mr: 0.5, fontSize: 18 }} />
          Rate & Review
        </Typography>
      </Breadcrumbs>
      
      {/* Page Title */}
      <Typography 
        variant="h4" 
        fontWeight="bold"
        sx={{ 
          mb: 3,
          fontSize: { xs: '1.5rem', md: '2rem' },
          position: 'relative',
          pb: 1,
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '40px',
            height: '3px',
            backgroundColor: 'primary.main',
            borderRadius: '2px'
          }
        }}
      >
        Rate & Review Product
      </Typography>
      
      <Grid container spacing={4}>
        {/* Product Information */}
        <Grid item xs={12} md={5}>
          <Card 
            elevation={1}
            sx={{ 
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
                {/* Product Image */}
                <Box 
                  sx={{ 
                    width: { xs: '100%', sm: '40%' },
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: '180px', md: '200px' },
                      height: { xs: '180px', md: '200px' },
                      border: '1px solid #eee',
                      borderRadius: 2,
                      overflow: 'hidden',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#f9f9fa',
                      position: 'relative'
                    }}
                  >
                    {customersProduct.loading ? (
                      <CircularProgress size={30} />
                    ) : (
                      <img
                        src={formattedImageUrl || 'https://via.placeholder.com/200x200?text=No+Image'}
                        alt={product?.title || "Product"}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center'
                        }}
                        onError={(e) => {
                          console.error('Image failed to load:', formattedImageUrl);
                          e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                        }}
                      />
                    )}
                  </Box>
                </Box>
                
                {/* Product Details */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    {product?.title || 'Product'}
                  </Typography>
                  
                  {product?.brand && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 2 }}
                    >
                      {product.brand}
                    </Typography>
                  )}
                  
                  <Stack 
                    direction="row" 
                    spacing={2}
                    divider={<Divider orientation="vertical" flexItem />}
                    sx={{ mb: 2 }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Price
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        Tk. {product?.price || 0}
                      </Typography>
                    </Box>
                    
                    {product?.size && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Size
                        </Typography>
                        <Typography variant="body1">
                          {product.size}
                        </Typography>
                      </Box>
                    )}
                    
                    {product?.color && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Color
                        </Typography>
                        <Typography variant="body1">
                          {product.color}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mt: 2,
                      pt: 1, 
                      borderTop: '1px dashed #eee'
                    }}
                  >
                    <FiberManualRecordIcon
                      sx={{ 
                        width: 14, 
                        height: 14, 
                        color: 'success.main',
                        mr: 1 
                      }}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Delivered on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Share your experience to help other shoppers
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Review Form */}
        <Grid item xs={12} md={7}>
          {success ? (
            <Alert 
              severity="success"
              sx={{ mb: 3 }}
            >
              Your review has been submitted successfully! Redirecting to product page...
            </Alert>
          ) : null}
          
          {error ? (
            <Alert 
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          ) : null}
          
          <form onSubmit={handleSubmit}>
            <Paper 
              elevation={1}
              sx={{ 
                p: 3, 
                borderRadius: 2,
                mb: 3
              }}
            >
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Rate This Product
              </Typography>
              
              <Box sx={{ py: 2 }}>
                <Rating
                  name="product-rating"
                  value={rating}
                  precision={1}
                  size="large"
                  onChange={handleRateProduct}
                  onChangeActive={(event, newHover) => {
                    setHoverRating(newHover);
                  }}
                  sx={{ 
                    fontSize: '3rem',
                    color: '#faaf00',
                    '& .MuiRating-iconFilled': {
                      color: '#faaf00',
                    },
                  }}
                  emptyIcon={<StarBorderIcon fontSize="inherit" />}
                  icon={<StarIcon fontSize="inherit" />}
                />
                
                {rating !== null && (
                  <Box sx={{ ml: 2, mt: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {getRatingLabelText(hoverRating !== -1 ? hoverRating : rating)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
            
            <Paper 
              elevation={1}
              sx={{ 
                p: 3, 
                borderRadius: 2,
                mb: 3
              }}
            >
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Write Your Review
              </Typography>
              
              <TextField
                label="Review Title"
                placeholder="What's most important to know?"
                variant="outlined"
                fullWidth
                margin="normal"
                value={formData.title}
                onChange={handleChange}
                name="title"
                required
                sx={{ mb: 3 }}
              />
              
              <TextField
                label="Your Review"
                placeholder="What did you like or dislike? How was your experience with this product?"
                variant="outlined"
                fullWidth
                margin="normal"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange}
                name="description"
                helperText="Your review will help other shoppers make better purchases"
                sx={{ mb: 3 }}
              />
            </Paper>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate(product?.slug ? `/product/${product.slug}` : `/product/${productId}`)}
                sx={{
                  borderColor: '#ccc',
                  color: '#555',
                  '&:hover': {
                    borderColor: '#999',
                    backgroundColor: 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                Cancel
              </Button>
              
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                sx={{ 
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </Box>
          </form>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RateProduct;
