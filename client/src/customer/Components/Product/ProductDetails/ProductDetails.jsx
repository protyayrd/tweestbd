import { useState, useEffect, useMemo } from "react";
import { RadioGroup } from "@headlessui/react";
import { useNavigate, useParams } from "react-router-dom";
import ProductReviewCard from "./ProductReviewCard";
import ComboOfferBanner from "./ComboOfferBanner";
import { trackViewContent, trackAddToCart } from "../../../../utils/gtmEvents";
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
  DialogActions,
  DialogContentText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Typography,
  Avatar,
  Divider,
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  Paper,
} from "@mui/material";
import {
  NavigateBefore,
  NavigateNext,
  InfoOutlined,
  Star,
  StarBorder,
  StarHalf,
  ThumbUp,
  ThumbDown,
  Sort,
  FilterList,
  VerifiedUser,
} from '@mui/icons-material';
import HomeProductCard from "../../Home/HomeProductCard";
import { useDispatch, useSelector } from "react-redux";
import { findProductById, findProductBySlug, findProducts } from "../../../../Redux/Customers/Product/Action";
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
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeGuideData, setSizeGuideData] = useState(null);
  const [isMobileZoomActive, setIsMobileZoomActive] = useState(false);
  const [touchPosition, setTouchPosition] = useState({ x: 50, y: 50 });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { customersProduct, review } = useSelector((store) => store);
  const { param } = useParams(); // Unified parameter for slug or ID

  // Add new state for review and rating
  const [reviewTab, setReviewTab] = useState(0);
  const [reviewSort, setReviewSort] = useState('newest');
  const [filterRating, setFilterRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });

  const [similarProducts, setSimilarProducts] = useState([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // MOVE ALL HOOKS BEFORE EARLY RETURNS
  // Filter reviews based on selected rating
  const filteredReviews = useMemo(() => {
    if (!review.reviews) return [];

    let filtered = [...review.reviews];

    // Apply rating filter if selected
    if (filterRating > 0) {
      filtered = filtered.filter(item =>
        Math.round(item.rating) === filterRating
      );
    }

    // Apply sorting
    if (reviewSort === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (reviewSort === 'highest') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (reviewSort === 'lowest') {
      filtered.sort((a, b) => a.rating - b.rating);
    }

    return filtered;
  }, [review.reviews, filterRating, reviewSort]);

  useEffect(() => {
    // Transform the size guide data when product changes
    if (customersProduct.product?.sizeGuide) {
      const transformedData = Object.entries(customersProduct.product.sizeGuide).map(([size, measurements]) => {
        // Get length value, prioritizing length over bodyLength
        const lengthValue = measurements.length || measurements.bodyLength;
        return {
          size,
          chest: measurements.chest,
          length: lengthValue,  // Use the normalized length value
          shoulder: measurements.shoulder
        };
      });
      setSizeGuideData(transformedData);
    }
  }, [customersProduct.product?.sizeGuide]);

  useEffect(() => {
    console.log('ProductDetails useEffect triggered - param:', param);
    console.log('customersProduct state:', customersProduct);
    
    // Determine if param is a slug or an ID (assuming IDs are 24 hex chars)
    if (param && param.length === 24 && /^[0-9a-fA-F]{24}$/.test(param)) {
      dispatch(findProductById({ productId: param }));
    } else if (param) {
      dispatch(findProductBySlug(param));
    } else {
      // Handle case where no param is provided, e.g., navigate to a default product or show error
      console.warn("No product ID or slug provided in URL.");
      // Optionally navigate away or show a "product not found" message immediately
      // navigate('/products'); 
    }
  }, [param, dispatch]);
  
  // When product is loaded via slug, fetch reviews
  useEffect(() => {
    if (customersProduct.product?._id) {
      dispatch(getAllReviews(customersProduct.product._id));
    }
  }, [customersProduct.product, dispatch]);
  
  // Track ViewContent event when product data is loaded
  useEffect(() => {
    if (customersProduct.product && Object.keys(customersProduct.product).length > 0) {
      trackViewContent(customersProduct.product);
    }
  }, [customersProduct.product]);

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

  // Add useEffect to calculate rating distribution
  useEffect(() => {
    if (review.reviews && review.reviews.length > 0) {
      // Create a count of ratings
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      review.reviews.forEach(review => {
        // Make sure we're dealing with a number
        const rating = Math.round(review.rating || 5);
        if (distribution[rating] !== undefined) {
          distribution[rating]++;
        }
      });

      setRatingDistribution(distribution);
    }
  }, [review.reviews]);

  // Add a useEffect for fetching similar products
  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (!customersProduct.product?.category) return;

      setIsLoadingSimilar(true);
      try {
        // First try to get products from the same category
        let sameCategoryProducts = await fetchProductsByCategory(customersProduct.product.category._id);

        // Filter out the current product
        sameCategoryProducts = sameCategoryProducts.filter(product =>
          product._id !== customersProduct.product._id
        );

        // If we have at least 4 products, we're done
        if (sameCategoryProducts.length >= 4) {
          setSimilarProducts(sameCategoryProducts.slice(0, 4));
          setIsLoadingSimilar(false);
          return;
        }

        // If we need more products and have a parent category (level 2)
        if (sameCategoryProducts.length < 4 && customersProduct.product.category.parentCategory) {
          // Get the parent category to find sibling categories
          const parentCategoryId = customersProduct.product.category.parentCategory;

          // Get all subcategories of this parent
          const siblingCategoriesResponse = await api.get(`/api/categories/parent/${parentCategoryId}`);
          const siblingCategories = siblingCategoriesResponse.data;

          // Filter out the current category
          const otherCategories = siblingCategories.filter(cat =>
            cat._id !== customersProduct.product.category._id
          );

          // For each sibling category, fetch products until we have enough
          let allSimilarProducts = [...sameCategoryProducts];

          for (const category of otherCategories) {
            if (allSimilarProducts.length >= 4) break;

            const categoryProducts = await fetchProductsByCategory(category._id);
            allSimilarProducts = [...allSimilarProducts, ...categoryProducts];

            if (allSimilarProducts.length >= 4) break;
          }

          setSimilarProducts(allSimilarProducts.slice(0, 4));
        } else {
          // Just use what we have from the same category
          setSimilarProducts(sameCategoryProducts);
        }
      } catch (error) {
        console.error("Error fetching similar products:", error);
      } finally {
        setIsLoadingSimilar(false);
      }
    };

    fetchSimilarProducts();
  }, [customersProduct.product]);

  // Helper function to fetch products by category
  const fetchProductsByCategory = async (categoryId) => {
    try {
      const response = await api.get('/api/products', {
        params: {
          category: categoryId,
          pageSize: 5  // Request more than needed to account for filtering
        }
      });
      return response.data.content || [];
    } catch (error) {
      console.error(`Error fetching products for category ${categoryId}:`, error);
      return [];
    }
  };

  // NOW ADD THE EARLY RETURNS AFTER ALL HOOKS
  if (customersProduct.loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-[1440px] mx-auto pt-6 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7 xl:col-span-8">
                <div className="aspect-w-4 aspect-h-5 w-full rounded-lg bg-gray-200"></div>
              </div>
              <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CHECK IF PRODUCT DATA EXISTS
  if (!customersProduct.product) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-[1440px] mx-auto pt-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-4">Product not found</div>
              <button 
                onClick={() => navigate('/')} 
                className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  const handleSubmit = async () => {
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

    if (selectedSize.quantity === 0) {
      setSnackbar({
        open: true,
        message: 'Selected size is out of stock',
        severity: 'error'
      });
      return;
    }

    try {
      setAddingToCart(true);
      
      const data = {
        productId: customersProduct.product._id,
        size: selectedSize.name,
        color: selectedColor.name,
        quantity: 1,
        price: customersProduct.product.price,
        discountedPrice: customersProduct.product.discountedPrice || customersProduct.product.price,
        product: {
          _id: customersProduct.product._id,
          title: customersProduct.product.title,
          price: customersProduct.product.price,
          discountedPrice: customersProduct.product.discountedPrice || customersProduct.product.price,
          imageUrl: customersProduct.product.imageUrl
        }
      };

      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        // Automatically proceed as guest - no modal, just add to guest cart
        const enhancedCartItem = {
          ...data,
          product: {
            _id: customersProduct.product._id,
            title: customersProduct.product.title,
            price: customersProduct.product.price,
            discountedPrice: customersProduct.product.discountedPrice,
            imageUrl: customersProduct.product.imageUrl,
            category: customersProduct.product.category // Include category for combo offers
          }
        };
        
        // Add color-specific images if available
        if (selectedColor && selectedColor.name) {
          enhancedCartItem.product.colors = [
            {
              name: selectedColor.name,
              images: selectedColor.images || []
            }
          ];
          
          if (selectedColor.images && selectedColor.images.length > 0) {
            enhancedCartItem.product.selectedColorImages = selectedColor.images;
          }
        }
        
        // Store cart items in localStorage for guest checkout
        const existingItems = JSON.parse(localStorage.getItem('guestCartItems') || '[]');
        const updatedItems = [...existingItems, enhancedCartItem];
        localStorage.setItem('guestCartItems', JSON.stringify(updatedItems));
        
        // Create/update guest cart object
        const guestCart = {
          cartItems: updatedItems,
          totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          totalDiscountedPrice: updatedItems.reduce((sum, item) => sum + (item.discountedPrice * item.quantity), 0),
          discount: updatedItems.reduce((sum, item) => sum + ((item.price - item.discountedPrice) * item.quantity), 0),
          totalItem: updatedItems.length,
          promoCodeDiscount: 0,
          promoDetails: null
        };
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        
        // Track the AddToCart event for guest users (Meta Pixel tracking)
        trackAddToCart(data, data.quantity || 1);
        
        // Show success message
        setSnackbar({
          open: true,
          message: 'Item added to cart!',
          severity: 'success'
        });
        
        // Navigate to cart page after a short delay to show success message
        setTimeout(() => {
          navigate('/cart');
        }, 1000);
        
        setAddingToCart(false);
        return;
      }

      const response = await dispatch(addItemToCart(data));

      if (response.payload) {
        setSnackbar({
          open: true,
          message: 'Item added to cart successfully!',
          severity: 'success'
        });
        
        // Navigate to cart page after a short delay to show success message
        setTimeout(() => {
          navigate('/cart');
        }, 1000);
      } else {
        throw new Error('Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to add item to cart',
        severity: 'error'
      });
    } finally {
      setAddingToCart(false);
    }
  };

  // New Buy Now function for direct checkout
  const handleBuyNow = async () => {
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

    if (selectedSize.quantity === 0) {
      setSnackbar({
        open: true,
        message: 'Selected size is out of stock',
        severity: 'error'
      });
      return;
    }
    
    try {
      setAddingToCart(true);
      
      const data = {
        productId: customersProduct.product._id,
        size: selectedSize.name,
        color: selectedColor.name,
        quantity: 1,
        price: customersProduct.product.price,
        discountedPrice: customersProduct.product.discountedPrice || customersProduct.product.price,
        product: {
          _id: customersProduct.product._id,
          title: customersProduct.product.title,
          price: customersProduct.product.price,
          discountedPrice: customersProduct.product.discountedPrice || customersProduct.product.price,
          imageUrl: customersProduct.product.imageUrl
        }
      };

      const jwt = localStorage.getItem("jwt");
      
      if (!jwt) {
        // For guest checkout - create enhanced cart item and go directly to checkout
    const enhancedCartItem = {
          ...data,
      product: {
        _id: customersProduct.product._id,
        title: customersProduct.product.title,
        price: customersProduct.product.price,
        discountedPrice: customersProduct.product.discountedPrice,
        imageUrl: customersProduct.product.imageUrl,
        category: customersProduct.product.category // Include category for combo offers
      }
    };
    
    // Add color-specific images if available
    if (selectedColor && selectedColor.name) {
      enhancedCartItem.product.colors = [
        {
          name: selectedColor.name,
          images: selectedColor.images || []
        }
      ];
      
      if (selectedColor.images && selectedColor.images.length > 0) {
        enhancedCartItem.product.selectedColorImages = selectedColor.images;
      }
    }
    
        // Create guest cart for direct checkout
        const guestCart = {
          cartItems: [enhancedCartItem],
          totalPrice: data.price,
          totalDiscountedPrice: data.discountedPrice,
          discount: data.price - data.discountedPrice,
          totalItem: 1,
          promoCodeDiscount: 0,
          promoDetails: null
        };
        
        // Store in localStorage with proper synchronization
        try {
          localStorage.setItem('guestCartItems', JSON.stringify([enhancedCartItem]));
          localStorage.setItem('guestCart', JSON.stringify(guestCart));
    
          // Add a small delay to ensure localStorage is written before navigation
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Track AddToCart event for Meta Pixel (for Buy Now flow)
          trackAddToCart(data, data.quantity || 1);
          
          // Verify data was saved correctly
          const savedCartItems = localStorage.getItem('guestCartItems');
          const savedCart = localStorage.getItem('guestCart');
          
          if (!savedCartItems || !savedCart) {
            throw new Error('Failed to save cart data to localStorage');
          }
          
          console.log('Guest cart saved successfully:', {
            cartItems: JSON.parse(savedCartItems),
            cart: JSON.parse(savedCart)
          });
    
          // Navigate directly to checkout as guest
          navigate('/checkout?guest=true&step=2');
          return;
        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError);
    setSnackbar({
      open: true,
            message: 'Failed to save cart data. Please try again.',
            severity: 'error'
    });
          return;
        }
      }

      // For logged-in users, add to cart first then go to checkout
      const response = await dispatch(addItemToCart(data));

      if (response.payload) {
        // Add a small delay to ensure cart state is updated before navigation
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Navigate to checkout
        navigate('/checkout');
      } else {
        throw new Error('Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error processing buy now:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to process purchase',
        severity: 'error'
      });
    } finally {
      setAddingToCart(false);
    }
  };

  // Format the description text to show in multiple lines
  const formatDescription = (description) => {
    if (!description) return [];
    // Split by periods and filter out empty lines
    return description
      .split('.')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  // Initialize product with default values
      const product = {
      breadcrumbs: [
        { id: 1, name: "Products", href: "/products" },
        {
          id: 2,
          name: customersProduct.product?.category?.name || "Category",
          href: `/${customersProduct.product?.category?.slug || customersProduct.product?.category?._id || ''}&page=1`
        },
      ],
    images: customersProduct.product?.colors?.[0]?.images || customersProduct.product?.images || [],
    sizes: customersProduct.product?.sizes || [],
    colors: customersProduct.product?.colors || [],
    highlights: [],
    details: customersProduct.product?.description || "",
    title: customersProduct.product?.title || "",
    sku: customersProduct.product?.sku || "",
    ratings: customersProduct.product?.ratings || 0,
    numRatings: customersProduct.product?.numRatings || 0
  };

  const currentImage = selectedColor?.images?.[currentImageIndex];
  const finalPrice = customersProduct.product?.discountedPrice || customersProduct.product?.price || 0;

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
                    : (product.images?.[0] ? getImageUrl(product.images[0]) : 'https://via.placeholder.com/400x600?text=No+Image')}
                  alt={customersProduct.product?.title}
                  className={`w-full h-full object-cover object-center transform-gpu transition-transform duration-300 ease-out ${isMobileZoomActive ? 'scale-[2.5]' : ''} hover:scale-[2.5]`}
                  style={{
                    transformOrigin: `${touchPosition.x}% ${touchPosition.y}%`,
                    cursor: 'zoom-in'
                  }}
                  onMouseMove={(e) => {
                    // For desktop hover behavior
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setTouchPosition({ x, y });
                  }}
                  onTouchStart={(e) => {
                    // For mobile touch behavior
                    if (!isMobileZoomActive) {
                      // Prevent default to avoid scrolling while zooming
                      e.preventDefault();
                      const touch = e.touches[0];
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
                      const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
                      setTouchPosition({ x, y });
                      setIsMobileZoomActive(true);
                    }
                  }}
                  onTouchMove={(e) => {
                    // Update zoom position when moving finger
                    if (isMobileZoomActive) {
                      // Always prevent default during active zoom to maintain focus
                      e.preventDefault();
                      e.stopPropagation();
                      const touch = e.touches[0];
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
                      const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
                      setTouchPosition({ x, y });
                    }
                  }}
                  onTouchEnd={(e) => {
                    // Reset zoom when touch ends
                    if (isMobileZoomActive) {
                      e.preventDefault();
                      setIsMobileZoomActive(false);
                    }
                  }}
                  onTouchCancel={(e) => {
                    // Also handle touch cancel events
                    if (isMobileZoomActive) {
                      e.preventDefault();
                      setIsMobileZoomActive(false);
                    }
                  }}
                />
                {/* Zoom indicator for mobile */}
                {isMobileZoomActive && (
                  <div 
                    className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{ zIndex: 20 }}
                  >
                    Tap to exit zoom
                  </div>
                )}
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
                      className={`relative aspect-w-4 aspect-h-3 overflow-hidden rounded-lg transition-all duration-200 ${currentImageIndex === index
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

                {/* Main Description - New position after product title */}
                {customersProduct.product?.description && (
                  <div className="mt-4">
                    <p className="text-gray-600 italic leading-relaxed text-sm">
                      {customersProduct.product.description}
                    </p>
                  </div>
                )}

                {/* SKU section - Add this */}
                {customersProduct.product?.sku && (
                  <p className="mt-1 text-sm text-gray-500">
                    PID: {customersProduct.product.sku}
                  </p>
                )}
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
                <div className="mt-4 grid grid-cols-5 gap-2">
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
                          className={`w-full py-3 text-sm font-medium uppercase transition-all duration-200 ${size.quantity === 0
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

                {/* Stock Summary */}
                {selectedColor && selectedSize && (
                  <div className="mt-3 p-2 bg-gray-50 rounded-md">
                    <p className="text-sm text-center">
                      <span className="font-medium">Selected:</span> {selectedColor.name} / {selectedSize.name} -
                      {selectedSize.quantity > 0 ? (
                        <span className="text-green-600 font-medium"> {selectedSize.quantity} in stock</span>
                      ) : (
                        <span className="text-red-500 font-medium"> Out of stock</span>
                      )}
                    </p>
                    {/* Size Guide Info for Selected Size */}
                    {sizeGuideData && sizeGuideData.find(guide => guide.size === selectedSize.name) && (
                      <div className="mt-2 text-xs text-gray-600 text-center">
                        <span className="font-medium">Size Guide:</span> 
                        {(() => {
                          const guide = sizeGuideData.find(g => g.size === selectedSize.name);
                          const measurements = [];
                          if (guide.chest) measurements.push(`Chest: ${guide.chest}`);
                          if (guide.length) measurements.push(`Length: ${guide.length}`);
                          if (guide.shoulder) measurements.push(`Shoulder: ${guide.shoulder}`);
                          return measurements.length > 0 ? ` ${measurements.join(', ')}` : ' No measurements available';
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Add to Cart and Buy Now Buttons */}
              <div className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  {/* Add to Cart Button */}
                <Button
                  onClick={handleSubmit}
                    variant="outlined"
                    fullWidth
                    disabled={addingToCart}
                    sx={{
                      py: 2,
                      borderColor: 'black',
                      color: 'black',
                      '&:hover': {
                        borderColor: '#00503a',
                        backgroundColor: 'rgba(0, 80, 58, 0.04)'
                      },
                      '&.Mui-disabled': {
                        borderColor: 'rgba(0,0,0,0.12)',
                        color: 'rgba(0,0,0,0.26)'
                      }
                    }}
                  >
                    {addingToCart ? (
                      <CircularProgress size={24} sx={{ color: 'black' }} />
                    ) : (
                      'Add to Cart'
                    )}
                  </Button>

                  {/* Buy Now Button */}
                  <Button
                    onClick={handleBuyNow}
                  variant="contained"
                  fullWidth
                  disabled={addingToCart}
                  sx={{
                    py: 2,
                    backgroundColor: 'black',
                    '&:hover': {
                      backgroundColor: '#00503a'
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  {addingToCart ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                      'Buy Now'
                  )}
                </Button>
                </div>
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

              {/* Product Features - Replacing description section */}
              {customersProduct.product?.features && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Features</h3>
                  <div className="space-y-3">
                    {customersProduct.product.features.split('\n')
                      .filter(line => line.trim() !== '')
                      .map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="text-green-600 mt-1">✓</span>
                          <div className="flex-1">
                            <p className="text-gray-600 leading-relaxed">
                              {feature.trim()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Perfect For - Additional section */}
              {customersProduct.product?.perfectFor && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-600 mb-4">Perfect For</h3>
                  <div className="space-y-3">
                    {customersProduct.product.perfectFor.split('\n')
                      .filter(line => line.trim() !== '')
                      .map((perfect, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="text-green-600 mt-1">•</span>
                          <div className="flex-1">
                            <p className="text-gray-600 leading-relaxed">
                              {perfect.trim()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Additional Information Section - Before reviews */}
        {customersProduct.product?.additionalInfo && (
          <section className="mt-16 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Additional Information
            </h2>
            <div className="prose prose-lg max-w-none text-gray-600">
              {customersProduct.product.additionalInfo.split('\n').filter(line => line.trim() !== '')
                .map((perfect, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-green-600 mt-1"> - </span>
                    <div className="flex-1">
                      <p className="text-gray-600 leading-relaxed">
                        {perfect.trim()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Reviews Section - Improved Version */}
        <section className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Customer Reviews & Feedback
            </h2>
          </div>

          <Grid container spacing={4}>
            {/* Rating Summary - Left Column */}
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#f9fafb', mb: 3 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h3" fontWeight="700" sx={{ color: '#111827' }}>
                    {typeof customersProduct.product?.ratings === 'number'
                      ? customersProduct.product.ratings.toFixed(1)
                      : '0.0'
                    }
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                    <Rating
                      value={Number(customersProduct.product?.ratings) || 0}
                      precision={0.5}
                      readOnly
                      size="large"
                      sx={{ color: '#facc15' }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Based on {customersProduct.product?.numRatings || 0} ratings
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Rating Distribution */}
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                  Rating Distribution
                </Typography>

                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDistribution[star] || 0;
                  const percentage = customersProduct.product?.numRatings
                    ? Math.round((count / customersProduct.product.numRatings) * 100)
                    : 0;

                  return (
                    <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '60px' }}>
                        <Typography variant="body2" sx={{ mr: 0.5 }}>{star}</Typography>
                        <Star sx={{ fontSize: 16, color: '#facc15' }} />
                      </Box>
                      <Box sx={{ flexGrow: 1, mx: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              bgcolor: star > 3 ? '#10b981' : star > 1 ? '#f59e0b' : '#ef4444',
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ minWidth: '36px', textAlign: 'right' }}>
                        {count}
                      </Typography>
                    </Box>
                  );
                })}
              </Paper>

              {/* Review Filters */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#f9fafb' }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <FilterList sx={{ mr: 1, fontSize: 20 }} />
                  Filter Reviews
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>By Rating</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      label="All"
                      onClick={() => setFilterRating(0)}
                      color={filterRating === 0 ? "primary" : "default"}
                      sx={{
                        bgcolor: filterRating === 0 ? 'black' : undefined,
                        '&.MuiChip-colorPrimary': { color: 'white' },
                        fontWeight: 500
                      }}
                    />
                    {[5, 4, 3, 2, 1].map(rating => (
                      <Chip
                        key={rating}
                        label={`${rating} ★`}
                        onClick={() => setFilterRating(rating)}
                        color={filterRating === rating ? "primary" : "default"}
                        sx={{
                          bgcolor: filterRating === rating ? 'black' : undefined,
                          '&.MuiChip-colorPrimary': { color: 'white' },
                          fontWeight: 500
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>Sort By</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      label="Newest"
                      onClick={() => setReviewSort('newest')}
                      color={reviewSort === 'newest' ? "primary" : "default"}
                      sx={{
                        bgcolor: reviewSort === 'newest' ? 'black' : undefined,
                        '&.MuiChip-colorPrimary': { color: 'white' },
                        fontWeight: 500
                      }}
                    />
                    <Chip
                      label="Highest Rating"
                      onClick={() => setReviewSort('highest')}
                      color={reviewSort === 'highest' ? "primary" : "default"}
                      sx={{
                        bgcolor: reviewSort === 'highest' ? 'black' : undefined,
                        '&.MuiChip-colorPrimary': { color: 'white' },
                        fontWeight: 500
                      }}
                    />
                    <Chip
                      label="Lowest Rating"
                      onClick={() => setReviewSort('lowest')}
                      color={reviewSort === 'lowest' ? "primary" : "default"}
                      sx={{
                        bgcolor: reviewSort === 'lowest' ? 'black' : undefined,
                        '&.MuiChip-colorPrimary': { color: 'white' },
                        fontWeight: 500
                      }}
                    />
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Reviews List - Right Column */}
            <Grid item xs={12} md={8}>
              {filteredReviews.length > 0 ? (
                <div className="space-y-6">
                  {filteredReviews.map((item, i) => (
                    <Card key={i} elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid #eee' }}>
                      <CardContent sx={{ p: 3 }}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              alt={item.user?.firstName || 'User'}
                              src={item.user?.profilePicture}
                              sx={{
                                bgcolor: 'primary.main',
                                width: 48,
                                height: 48,
                                fontSize: '1.25rem',
                                fontWeight: 600
                              }}
                            >
                              {item.user?.firstName?.charAt(0) || 'U'}
                            </Avatar>
                            <div>
                              <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {item.user?.firstName} {item.user?.lastName || ''}
                                {item.verifiedPurchase && (
                                  <Chip
                                    icon={<VerifiedUser style={{ color: '#4CAF50', fontSize: '1rem' }} />}
                                    label="Verified Purchase"
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      height: '25px',
                                      fontSize: '1rem',
                                      fontWeight: 'bold',
                                      borderRadius: '8px',
                                      border: '2px solid #4CAF50',
                                      color: '#4CAF50',
                                      '& .MuiChip-label': { px: 1 }
                                    }}
                                  />
                                )}
                              </Typography>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </Typography>
                              </div>
                            </div>
                          </div>
                          <Rating
                            value={item.rating || 5}
                            precision={0.5}
                            readOnly
                            sx={{ color: '#facc15' }}
                          />
                        </div>

                        <Typography variant="body1" sx={{ mb: 3, color: '#1f2937', lineHeight: 1.6 }}>
                          {item.review}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button
                            size="small"
                            startIcon={<ThumbUp />}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                            }}
                          >
                            Helpful
                          </Button>
                          <Button
                            size="small"
                            startIcon={<ThumbDown />}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                            }}
                          >
                            Not Helpful
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 8,
                    textAlign: 'center',
                    bgcolor: '#f9fafb',
                    borderRadius: 2,
                    height: '100%',
                    minHeight: 300
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1, color: '#4b5563' }}>
                    No Reviews Yet
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 4, color: '#6b7280', maxWidth: 400 }}>
                    {filterRating > 0
                      ? `There are no ${filterRating}-star reviews for this product yet.`
                      : "This product doesn't have any reviews yet."}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </section>

        {/* Similar Products */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Similar Products</h2>

          {isLoadingSimilar ? (
            <div className="flex justify-center items-center py-12">
              <CircularProgress />
            </div>
          ) : similarProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((item) => (
                <HomeProductCard key={item._id} product={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Typography variant="body1" color="text.secondary">
                No similar products found
              </Typography>
            </div>
          )}
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
                        Length (inches)
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
                          {row.length || '-'}
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
                        Shoulder (inches)
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
                          {row.shoulder || '-'}
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
                          3
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#334155' }}>
                          Shoulder
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                        Measure across the back from one shoulder point to the other.
                        Keep the measuring tape straight and parallel to the ground.
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
