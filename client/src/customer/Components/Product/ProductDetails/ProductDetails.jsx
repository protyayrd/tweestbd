import { useState } from "react";
import { RadioGroup } from "@headlessui/react";
import { useNavigate, useParams } from "react-router-dom";
import ProductReviewCard from "./ProductReviewCard";
import { 
  Box, 
  Button, 
  Grid, 
  LinearProgress, 
  Rating, 
  TextField, 
  Alert, 
  Snackbar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Typography,
} from "@mui/material";
import { NavigateBefore, NavigateNext, InfoOutlined } from '@mui/icons-material';
import HomeProductCard from "../../Home/HomeProductCard";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { findProductById, findProducts } from "../../../../Redux/Customers/Product/Action";
import { addItemToCart } from "../../../../Redux/Customers/Cart/Action";
import { getAllReviews } from "../../../../Redux/Customers/Review/Action";
import { getImageUrl } from '../../../../config/api';
import api from '../../../../config/api';

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Add this CSS class at the top of your file
const zoomStyles = {
  transition: 'transform 0.3s ease-out',
  '&:hover': {
    transform: 'scale(1.5)',
    cursor: 'zoom-in'
  }
};

export default function ProductDetails() {
  const [selectedSize, setSelectedSize] = useState();
  const [selectedColor, setSelectedColor] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeError, setPromoCodeError] = useState('');
  const [discount, setDiscount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeGuideData, setSizeGuideData] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { customersProduct, review } = useSelector((store) => store);
  const { productId } = useParams();

  useEffect(() => {
    // Transform the size guide data when product changes
    if (customersProduct.product?.sizeGuide) {
      const transformedData = Object.entries(customersProduct.product.sizeGuide).map(([size, measurements]) => ({
        size,
        ...measurements
      }));
      setSizeGuideData(transformedData);
    }
  }, [customersProduct.product?.sizeGuide]);

  useEffect(() => {
    const data = { productId };
    dispatch(findProductById(data));
    dispatch(getAllReviews(productId));
  }, [productId, dispatch]);

  useEffect(() => {
    if (customersProduct.product?.category?._id) {
      dispatch(findProducts({
        category: customersProduct.product.category._id,
        colors: [],
        sizes: [],
        minPrice: 0,
        maxPrice: 10000,
        minDiscount: 0,
        pageNumber: 1,
        pageSize: 10,
        sort: "price_low"
      }));
    }
  }, [customersProduct.product?.category?._id, dispatch]);

  useEffect(() => {
    if (!selectedColor && customersProduct.product?.colors?.length > 0) {
      setSelectedColor(customersProduct.product.colors[0]);
    }
  }, [customersProduct.product]);

  const handleColorChange = (color) => {
    if (color.quantity === 0) return;
    setSelectedColor(color);
    setCurrentImageIndex(0);
  };

  const handleNextImage = () => {
    if (selectedColor && selectedColor.images) {
      setCurrentImageIndex((prev) => 
        prev === selectedColor.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handlePrevImage = () => {
    if (selectedColor && selectedColor.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedColor.images.length - 1 : prev - 1
      );
    }
  };

  const validatePromoCode = async () => {
    try {
      const response = await api.post('/api/promo-codes/validate', {
        code: promoCode,
        productId,
        orderAmount: customersProduct.product?.discountedPrice || 0
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

    const data = { 
      productId, 
      size: selectedSize.name,
      color: selectedColor.name,
      price: finalPrice,
      discountedPrice: finalPrice - discount
    };
    dispatch(addItemToCart({ data }));
    navigate("/cart");
  };

  // Initialize product with default values
  const product = {
    breadcrumbs: [
      { id: 1, name: "Products", href: "/" },
      { 
        id: 2, 
        name: customersProduct.product?.category?.name || "Category", 
        href: `/category/${customersProduct.product?.category?._id || ''}`
      },
    ],
    images: customersProduct.product?.colors?.[0]?.images || [],
    sizes: customersProduct.product?.sizes || [],
    colors: customersProduct.product?.colors || [],
    highlights: [],
    details: customersProduct.product?.description || ""
  };

  if (!customersProduct.product) {
    return <div>Loading...</div>;
  }

  const currentImage = selectedColor?.images?.[currentImageIndex];
  const finalPrice = (customersProduct.product?.discountedPrice || 0) - discount;

  // Format the description text to show in multiple lines
  const formatDescription = (description) => {
    if (!description) return [];
    // Split by periods and filter out empty lines
    return description
      .split('.')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1440px] mx-auto pt-6 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            {product.breadcrumbs.map((breadcrumb) => (
              <li key={breadcrumb.id}>
                <div className="flex items-center">
                  <a href={breadcrumb.href} className="font-medium text-gray-600 hover:text-gray-900">
                    {breadcrumb.name}
                  </a>
                  <svg width={16} height={20} viewBox="0 0 16 20" fill="currentColor" className="h-5 w-4 text-gray-300">
                    <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
                  </svg>
                </div>
              </li>
            ))}
            <li className="font-medium text-gray-900">{customersProduct.product?.title}</li>
          </ol>
        </nav>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Image gallery - Wider layout */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="sticky top-4 space-y-6">
              <div className="aspect-w-4 aspect-h-5 w-full rounded-lg bg-gray-100 overflow-hidden">
                <img
                  src={selectedColor?.images?.[currentImageIndex] 
                    ? getImageUrl(selectedColor.images[currentImageIndex])
                    : getImageUrl(product.images[0])}
                  alt={customersProduct.product?.title}
                  className="w-full h-full object-cover object-center transform-gpu transition-transform duration-300 ease-out hover:scale-[2.5]"
                  style={{ 
                    transformOrigin: 'var(--mouse-x, center) var(--mouse-y, center)',
                    cursor: 'zoom-in'
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                    e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
                  }}
                />
                {selectedColor?.images?.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200 z-10"
                    >
                      <NavigateBefore />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200 z-10"
                    >
                      <NavigateNext />
                    </button>
                  </>
                )}
              </div>
              {selectedColor?.images?.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {selectedColor.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative aspect-w-4 aspect-h-3 overflow-hidden rounded-lg transition-all duration-200 ${
                        currentImageIndex === index 
                          ? 'ring-2 ring-black ring-offset-2' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${selectedColor.name} - View ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product info - Minimal design */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="space-y-6">
              {/* Title and Brand */}
              <div>
                <h1 className="text-2xl font-medium text-gray-900">
                  {customersProduct.product?.brand}
                </h1>
                <p className="mt-1 text-lg text-gray-500">
                  {customersProduct.product?.title}
                </p>
              </div>

              {/* Price */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-baseline">
                  <p className="text-3xl font-medium text-gray-900">
                    Tk. {finalPrice}
                  </p>
                  <p className="ml-4 text-lg text-gray-500 line-through">
                    Tk. {customersProduct.product?.price}
                  </p>
                  <span className="ml-4 px-2.5 py-0.5 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                    {customersProduct.product?.discountPersent}% Off
                  </span>
                </div>
                {discount > 0 && (
                  <p className="mt-2 text-sm text-blue-600">
                    Extra Tk. {discount} off applied
                  </p>
                )}
              </div>

              {/* Colors */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-900">Color</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <Tooltip key={color.name} title={color.quantity === 0 ? 'Out of stock' : `${color.quantity} in stock`}>
                      <div>
                        <button
                          type="button"
                          onClick={() => color.quantity > 0 && handleColorChange(color)}
                          className={`group relative h-16 w-16 rounded-lg transition-all duration-200 ${
                            color.quantity === 0 
                              ? 'cursor-not-allowed opacity-50' 
                              : selectedColor?.name === color.name
                                ? 'ring-2 ring-black'
                                : 'hover:ring-1 hover:ring-gray-400'
                          }`}
                        >
                          {color.images?.[0] && (
                            <img
                              src={getImageUrl(color.images[0])}
                              alt={color.name}
                              className="h-full w-full rounded-lg object-cover"
                            />
                          )}
                          <span className="sr-only">{color.name}</span>
                          {selectedColor?.name === color.name && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-black" />
                          )}
                        </button>
                        <p className="mt-1.5 text-xs text-center text-gray-500">{color.name}</p>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Size</h3>
                  {customersProduct.product?.sizeGuide && (
                    <Button
                      startIcon={<InfoOutlined />}
                      onClick={() => setSizeGuideOpen(true)}
                      size="small"
                      sx={{ 
                        color: 'black',
                        borderColor: 'black',
                        '&:hover': {
                          borderColor: 'black',
                          backgroundColor: 'rgba(0,0,0,0.04)'
                        }
                      }}
                      variant="outlined"
                    >
                      Size Guide
                    </Button>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {selectedColor?.sizes?.map((size) => (
                    <Tooltip
                      key={size.name}
                      title={size.quantity === 0 ? 'Out of stock' : `${size.quantity} in stock`}
                    >
                      <div>
                        <button
                          type="button"
                          onClick={() => size.quantity > 0 && setSelectedSize(size)}
                          disabled={size.quantity === 0}
                          className={`w-full py-3 text-sm font-medium uppercase transition-all duration-200 ${
                            size.quantity === 0
                              ? 'cursor-not-allowed bg-gray-50 text-gray-400'
                              : selectedSize?.name === size.name
                                ? 'bg-black text-white'
                                : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
                          } rounded-md`}
                        >
                          {size.name}
                        </button>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Promo Code */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex gap-2">
                  <TextField
                    fullWidth
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    error={!!promoCodeError}
                    helperText={promoCodeError}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '6px',
                      }
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={validatePromoCode}
                    sx={{ 
                      minWidth: '100px',
                      color: 'black',
                      borderColor: 'black',
                      '&:hover': {
                        borderColor: 'black',
                        backgroundColor: 'rgba(0,0,0,0.04)'
                      }
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="border-t border-gray-200 pt-6">
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  fullWidth
                  disabled={!selectedSize || !selectedColor}
                  sx={{ 
                    py: 2,
                    backgroundColor: 'black',
                    '&:hover': {
                      backgroundColor: '#222'
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  {!selectedSize || !selectedColor ? 'Select Size & Color' : 'Add to Cart'}
                </Button>
              </div>

              {/* Ratings Summary */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-3xl font-semibold text-gray-900">
                      {typeof customersProduct.product?.ratings === 'number' 
                        ? customersProduct.product.ratings.toFixed(1) 
                        : '0.0'
                      }
                    </p>
                    <p className="text-sm text-gray-500">out of 5</p>
                  </div>
                  <div className="flex-1">
                    <Rating
                      value={Number(customersProduct.product?.ratings) || 0}
                      precision={0.5}
                      readOnly
                      size="large"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Based on {customersProduct.product?.numRatings || 0} ratings
                    </p>
                  </div>
                </div>
              </div>

              {/* Description with better formatting */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Product Details</h3>
                <div className="space-y-4">
                  {formatDescription(customersProduct.product?.description).map((line, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-gray-400 mt-1.5">•</span>
                      <div className="flex-1">
                        <p className="text-gray-600 leading-relaxed">
                          {line.charAt(0).toUpperCase() + line.slice(1)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Product Information */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Category</p>
                    <p className="font-medium text-gray-900">{customersProduct.product?.category?.name}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Stock</p>
                    <p className="font-medium text-gray-900">{selectedColor?.quantity || 0} pieces</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Availability</p>
                    <p className={`font-medium ${selectedColor?.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedColor?.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="mt-16 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Customer Reviews & Ratings
          </h2>
          <Grid container spacing={7}>
            <Grid item xs={7}>
              <div className="space-y-6">
                {(review.reviews || []).map((item, i) => (
                  <ProductReviewCard key={i} item={item} />
                ))}
              </div>
            </Grid>
            <Grid item xs={5}>
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Rating Summary</h3>
                <Box>
                  <Grid container justifyContent="center" alignItems="center" gap={2}>
                    <Grid xs={2}>
                      <p className="text-sm font-medium">Excellent</p>
                    </Grid>
                    <Grid xs={7}>
                      <LinearProgress
                        sx={{ 
                          bgcolor: "#e5e7eb", 
                          borderRadius: 4, 
                          height: 8,
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                          }
                        }}
                        variant="determinate"
                        value={customersProduct.product?.ratings ? (customersProduct.product.ratings / 5) * 100 : 0}
                        color="success"
                      />
                    </Grid>
                    <Grid xs={2}>
                      <p className="text-sm text-gray-500">
                        {customersProduct.product?.numRatings || 0}
                      </p>
                    </Grid>
                  </Grid>
                </Box>
              </div>
            </Grid>
          </Grid>
        </section>

        {/* Similar Products */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Similar Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {customersProduct.products?.[customersProduct.product?.category?._id]?.content?.map((item) => (
              <HomeProductCard key={item._id} product={item} />
            ))}
          </div>
        </section>
      </div>

      {/* Size Guide Dialog */}
      <Dialog
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            maxWidth: '800px'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            fontSize: '1.75rem', 
            fontWeight: 'bold',
            borderBottom: '1px solid #e5e7eb',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box>
            Size Guide
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, fontWeight: 'normal' }}>
              Find your perfect fit
            </Typography>
          </Box>
          <IconButton onClick={() => setSizeGuideOpen(false)} size="small">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ padding: '24px' }}>
          {sizeGuideData ? (
            <Box>
              {/* Size Chart */}
              <Box 
                sx={{ 
                  overflowX: 'auto',
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                }}
              >
                <Table 
                  sx={{ 
                    minWidth: 400,
                    '& .MuiTableCell-root': {
                      borderColor: '#e5e7eb',
                      padding: '16px'
                    }
                  }}
                >
                  <TableBody>
                    <TableRow 
                      sx={{ 
                        '& th, & td': { 
                          bgcolor: '#f8fafc',
                          fontWeight: 600,
                          borderBottom: '2px solid #e2e8f0'
                        }
                      }}
                    >
                      <TableCell 
                        component="th" 
                        sx={{ 
                          width: '180px',
                          borderTopLeftRadius: '12px',
                        }}
                      >
                        Measurements
                      </TableCell>
                      {sizeGuideData.map((row) => (
                        <TableCell 
                          key={row.size} 
                          align="center"
                          sx={{
                            fontSize: '1.1rem',
                            color: '#1e293b'
                          }}
                        >
                          {row.size}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow 
                      sx={{ 
                        '&:hover': { 
                          bgcolor: '#f8fafc',
                          '& th': { bgcolor: '#f1f5f9' }
                        }
                      }}
                    >
                      <TableCell 
                        component="th" 
                        sx={{ 
                          bgcolor: '#f8fafc',
                          fontWeight: 500,
                          color: '#475569'
                        }}
                      >
                        Chest (inches)
                      </TableCell>
                      {sizeGuideData.map((row) => (
                        <TableCell 
                          key={row.size} 
                          align="center"
                          sx={{ 
                            fontWeight: 500,
                            color: '#334155'
                          }}
                        >
                          {row.chest}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow 
                      sx={{ 
                        '&:hover': { 
                          bgcolor: '#f8fafc',
                          '& th': { bgcolor: '#f1f5f9' }
                        }
                      }}
                    >
                      <TableCell 
                        component="th" 
                        sx={{ 
                          bgcolor: '#f8fafc',
                          fontWeight: 500,
                          color: '#475569',
                          borderBottomLeftRadius: '12px'
                        }}
                      >
                        Body Length (inches)
                      </TableCell>
                      {sizeGuideData.map((row) => (
                        <TableCell 
                          key={row.size} 
                          align="center"
                          sx={{ 
                            fontWeight: 500,
                            color: '#334155'
                          }}
                        >
                          {row.bodyLength}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>

              {/* Measurement Guide */}
              <Box sx={{ mt: 6 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 3,
                    color: '#1e293b'
                  }}
                >
                  How to Take Measurements
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box 
                      sx={{ 
                        p: 3, 
                        borderRadius: '12px',
                        bgcolor: '#f8fafc',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box 
                          sx={{ 
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#475569',
                            fontWeight: 600
                          }}
                        >
                          1
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#334155' }}>
                          Chest
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                        Measure around the fullest part of your chest, keeping the measuring tape horizontal and relaxed.
                        Make sure the tape is not too tight or too loose.
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box 
                      sx={{ 
                        p: 3, 
                        borderRadius: '12px',
                        bgcolor: '#f8fafc',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box 
                          sx={{ 
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#475569',
                            fontWeight: 600
                          }}
                        >
                          2
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#334155' }}>
                          Body Length
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                        Measure from the highest point of the shoulder seam straight down to your desired length.
                        Keep the measuring tape straight and perpendicular to the ground.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          ) : (
            <Box p={4} textAlign="center">
              <CircularProgress size={32} />
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                Loading size guide...
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ borderRadius: '8px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
