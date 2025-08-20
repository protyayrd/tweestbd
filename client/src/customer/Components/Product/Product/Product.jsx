import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { findProducts } from '../../../../Redux/Customers/Product/Action';
import { getCategories } from '../../../../Redux/Admin/Category/Action';
import { getImageUrl } from '../../../../config/api';
import {
  Box,
  Grid,
  Typography,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  styled,
  Card,
  CardContent,
  Drawer,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  Button,
  Divider,
  TextField,
  Skeleton
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';

const priceRanges = [
  { label: 'Under Tk. 1000', value: '0-1000' },
  { label: 'Tk. 1000 - Tk. 2000', value: '1000-2000' },
  { label: 'Tk. 2000 - Tk. 3000', value: '2000-3000' },
  { label: 'Tk. 3000 - Tk. 5000', value: '3000-5000' },
  { label: 'Above Tk. 5000', value: '5000-999999' }
];

const discountRanges = [
  { label: '10% or more', value: 10 },
  { label: '20% or more', value: 20 },
  { label: '30% or more', value: 30 },
  { label: '40% or more', value: 40 },
  { label: '50% or more', value: 50 }
];

const ratings = [5, 4, 3, 2, 1];

const stockOptions = [
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' }
];

const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Gray', 'Navy', 'Brown', 'Beige', 'Pink', 'Purple', 'Yellow', 'Orange'];
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

// Add default color mapping for color swatches
const colorMap = {
  'black': '#000000',
  'white': '#FFFFFF',
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#008000',
  'gray': '#808080',
  'grey': '#808080',
  'navy': '#000080',
  'brown': '#A52A2A',
  'beige': '#F5F5DC',
  'pink': '#FFC0CB',
  'purple': '#800080',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'maroon': '#800000',
  'olive': '#808000',
  'teal': '#008080',
  'ivory': '#FFFFF0'
};

// Helper function to get color code
const getColorCode = (colorName) => {
  const key = colorName.toLowerCase();
  return colorMap[key] || key;
};

const ProductImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center center',
  position: 'absolute',
  top: 0,
  left: 0,
  transition: 'opacity 0.3s ease-in-out',
});

const ImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  paddingTop: '150%',
  overflow: 'hidden',
  border: '1px solid #999',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  background: '#fff',
  '&:hover': {
    '& .secondary-image': {
      opacity: 1,
    },
    '& .primary-image': {
      opacity: 0,
    }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 60%)',
    zIndex: 2,
    pointerEvents: 'none'
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    background: 'linear-gradient(315deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 60%)',
    zIndex: 2,
    pointerEvents: 'none'
  },
  [theme.breakpoints.down('sm')]: {
    paddingTop: '150%',
  }
}));

const ProductCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  borderRadius: 0,
  boxShadow: 'none',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)'
  },
  '& .MuiCardContent-root': {
    padding: '0.75rem 0 0 0',
    backgroundColor: 'transparent',
  },
}));

const PriceContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '4px',
});

const FilterButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#000000',
  color: 'white',
  '&:hover': {
    backgroundColor: '#00503a',
  },
}));

const FilterChip = styled(Chip)(({ theme }) => ({
  borderRadius: '4px',
  fontWeight: 500,
  '&.MuiChip-filled': {
    backgroundColor: '#f0f0f0',
    color: '#000',
    border: '1px solid #e0e0e0',
  },
  '& .MuiChip-deleteIcon': {
    color: '#666',
    '&:hover': {
      color: '#000',
    },
  }
}));

const ColorSwatch = styled(Box)(({ color, selected }) => ({
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: color.toLowerCase(),
  border: selected ? '2px solid #000' : '1px solid #ddd',
  cursor: 'pointer',
  boxShadow: selected ? '0 0 0 2px white, 0 0 0 3px #666' : 'none',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 0 0 2px white, 0 0 0 3px #666',
  }
}));

const SizeBox = styled(Box)(({ selected }) => ({
  minWidth: '35px',
  height: '35px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: selected ? '2px solid #000' : '1px solid #ddd',
  borderRadius: '4px',
  padding: '0 8px',
  cursor: 'pointer',
  backgroundColor: selected ? '#f5f5f5' : 'white',
  fontWeight: selected ? 'bold' : 'normal',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: '#f5f5f5',
    borderColor: '#999'
  }
}));

const PriceSlider = styled(Box)(({ theme }) => ({
  padding: '0 10px',
  marginTop: '10px',
  marginBottom: '20px',
}));

const FilterAccordion = styled(Accordion)(({ theme }) => ({
  boxShadow: 'none',
  '&:not(:last-child)': {
    borderBottom: '1px solid #eee',
  },
  '&:before': {
    display: 'none',
  },
  '& .MuiAccordionSummary-root': {
    padding: '0 8px',
    minHeight: '48px',
    '&.Mui-expanded': {
      minHeight: '48px',
    }
  },
  '& .MuiAccordionSummary-content': {
    margin: '12px 0',
    '&.Mui-expanded': {
      margin: '12px 0',
    }
  },
  '& .MuiAccordionDetails-root': {
    padding: '0 16px 16px',
  },
}));

// Add this new styled component for the discount chip
const DiscountChip = styled(Chip)({
  position: 'absolute',
  top: '10px',
  left: '10px',
  zIndex: 10,
  backgroundColor: '#00503a',
  color: '#fff',
  fontWeight: 600,
  fontSize: '0.75rem',
  borderRadius: '4px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  '& .MuiChip-label': {
    padding: '0 8px',
  }
});

const ProductSkeleton = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Card sx={{ height: '100%', boxShadow: 'none', borderRadius: 0 }}>
      <Box sx={{ 
        position: 'relative', 
        paddingTop: '150%',
        border: '1px solid #999',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        background: '#fff',
        mb: 1
      }}>
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height="100%" 
          animation="wave"
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            backgroundColor: '#69af5a',
            opacity: 0.2,
          }}
        />
      </Box>
      <Box sx={{ p: 1 }}>
        <Skeleton variant="text" width="70%" height={24} sx={{ backgroundColor: '#69af5a', opacity: 0.2 }} />
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Skeleton variant="text" width="30%" height={24} sx={{ backgroundColor: '#69af5a', opacity: 0.2 }} />
          <Skeleton variant="text" width="20%" height={24} sx={{ backgroundColor: '#69af5a', opacity: 0.2 }} />
          <Skeleton variant="text" width="25%" height={24} sx={{ backgroundColor: '#69af5a', opacity: 0.2 }} />
        </Box>
      </Box>
    </Card>
  );
};

const ProductCardWithLoader = React.memo(({ product, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Memoize image calculations
  const { primaryImage, secondaryImage, hasDiscount } = useMemo(() => {
    const primary = product.colors?.[0]?.images?.[0];
    const secondary = product.colors?.[0]?.images?.[1] || primary;
    const discount = product.discountedPrice && product.discountedPrice < product.price && product.discountPersent;
    
    return {
      primaryImage: primary,
      secondaryImage: secondary,
      hasDiscount: discount
    };
  }, [product.colors, product.discountedPrice, product.price, product.discountPersent]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  return (
    <ProductCard onClick={onClick}>
      <ImageContainer>
        {!imageLoaded && (
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height="100%" 
            animation="wave"
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              backgroundColor: '#69af5a',
              opacity: 0.2,
              zIndex: 1
            }}
          />
        )}
        
        {/* Add the discount chip if there's a discount */}
        {hasDiscount && (
          <DiscountChip 
            label={`- ${product.discountPersent}%`}
            size="small"
          />
        )}
        
        <ProductImage
          className="primary-image"
          src={primaryImage ? getImageUrl(primaryImage) : 'https://via.placeholder.com/400x600'}
          alt={product.title}
          onLoad={handleImageLoad}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x600';
            setImageLoaded(true);
          }}
          style={{ 
            opacity: imageLoaded ? 1 : 0,
            zIndex: 2,
            objectFit: 'cover',
            objectPosition: 'center center'
          }}
        />
        <ProductImage
          className="secondary-image"
          src={secondaryImage ? getImageUrl(secondaryImage) : 'https://via.placeholder.com/400x600'}
          alt={`${product.title} - hover`}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x600';
          }}
          sx={{ 
            opacity: 0,
            zIndex: 2,
            objectFit: 'cover',
            objectPosition: 'center center'
          }}
        />
      </ImageContainer>
      
      <CardContent>
        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: '0.9rem',
            fontWeight: 500,
            mb: 1,
            color: '#000'
          }}
        >
          {product.title}
        </Typography>
        
        <PriceContainer>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: '0.9rem',
              fontWeight: 500,
              color: '#000'
            }}
          >
            Tk. {product.discountedPrice || product.price}
          </Typography>
          
          {hasDiscount && (
            <Typography 
              variant="body2" 
              sx={{ 
                textDecoration: 'line-through',
                color: '#666',
                fontSize: '0.9rem'
              }}
            >
              Tk. {product.price}
            </Typography>
          )}
        </PriceContainer>
      </CardContent>
    </ProductCard>
  );
});

ProductCardWithLoader.displayName = 'ProductCardWithLoader';

const Product = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { customersProduct, category } = useSelector((store) => store);
  const [sortBy, setSortBy] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: '',
    colors: [],
    sizes: [],
    categories: [],
    minDiscount: '',
    rating: '',
    stock: '',
    isNewArrival: false,
    isFeatured: false,
    search: ''
  });
  const [availableFilters, setAvailableFilters] = useState({
    colors: colors,
    sizes: sizes
  });

  // Calculate mobile container height to take up 90% of viewport
  const mobileContainerStyle = isMobile ? {
    minHeight: '90vh',
    display: 'flex',
    flexDirection: 'column'
  } : {};

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  // Memoize filter params calculation
  const filterParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get('page')) || 1;
    const sort = params.get('sort') || '';
    const categoryId = params.get('category');
    const search = params.get('search') || '';

    // Create base filter params
    const newFilterParams = {
      pageNumber: page,
      pageSize: 12,
      sort,
      minPrice: '',
      maxPrice: '',
      colors: filters.colors,
      sizes: filters.sizes,
      search: search || filters.search,
      minDiscount: filters.minDiscount,
      rating: filters.rating,
      stock: filters.stock,
      isNewArrival: filters.isNewArrival,
      isFeatured: filters.isFeatured
    };

            // Handle category filtering - only use subcategories
        if (categoryId) {
          // Resolve categoryId from slug if necessary
          const selectedCategory = category.categories?.find(cat => cat.slug === categoryId) ||
                                   category.categories?.find(cat => cat._id === categoryId);
          
          if (selectedCategory) {
            newFilterParams.category = selectedCategory._id;
            // Canonicalize URL if an ID was used but a slug exists
            if (selectedCategory.slug && categoryId === selectedCategory._id) {
              const newSearchParams = new URLSearchParams(location.search);
              newSearchParams.set('category', selectedCategory.slug);
              navigate({ search: newSearchParams.toString() }, { replace: true });
            }
          }
        }

    // Handle price range
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-');
      newFilterParams.minPrice = min;
      newFilterParams.maxPrice = max;
    }

    return newFilterParams;
  }, [location.search, filters, category.categories]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get('page')) || 1;
    const sort = params.get('sort') || '';

    setCurrentPage(page);
    setSortBy(sort);
  }, [location.search]);

  // Add this effect to update available filters when product data is received
  useEffect(() => {
    if (customersProduct.products?.availableFilters) {
      setAvailableFilters(prevFilters => ({
        colors: customersProduct.products.availableFilters.colors || prevFilters.colors,
        sizes: customersProduct.products.availableFilters.sizes || prevFilters.sizes
      }));
      
    }
  }, [customersProduct.products]);

  useEffect(() => {
    if (Object.keys(filterParams).length > 0) {
      dispatch(findProducts(filterParams));
    }
  }, [dispatch, filterParams]);

  const handleSortChange = useCallback((event) => {
    const value = event.target.value;
    setSortBy(value);
    const searchParams = new URLSearchParams(location.search);
    if (value) {
      searchParams.set('sort', value);
    } else {
      searchParams.delete('sort');
    }
    searchParams.set('page', '1');
    navigate({ search: searchParams.toString() });
  }, [location.search, navigate]);

  const handlePageChange = useCallback((event, value) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', value);
    navigate({ search: searchParams.toString() });
  }, [location.search, navigate]);

  const handleProductClick = useCallback((productId, product) => {
    if (product?.slug) {
      window.location.href = `/p/${product.slug}`;
    } else {
      window.location.href = `/product/${productId}`;
    }
  }, []);

  const handleFilterChange = (type, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (type === 'priceRange') {
        newFilters.priceRange = newFilters.priceRange === value ? '' : value;
      } else if (Array.isArray(prev[type])) {
        const index = prev[type].indexOf(value);
        if (index === -1) {
          newFilters[type] = [...prev[type], value];
        } else {
          newFilters[type] = prev[type].filter(item => item !== value);
        }
      } else {
        newFilters[type] = value;
      }

      const searchParams = new URLSearchParams(location.search);
      Object.entries(newFilters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          searchParams.set(key, value.join(','));
        } else if (value && !Array.isArray(value)) {
          searchParams.set(key, value);
        } else {
          searchParams.delete(key);
        }
      });
      searchParams.set('page', '1');
      navigate({ search: searchParams.toString() });
      
      return newFilters;
    });
  };

  const handleClearFilters = () => {
    setFilters({
      priceRange: '',
      colors: [],
      sizes: [],
      categories: [],
      minDiscount: '',
      rating: '',
      stock: '',
      isNewArrival: false,
      isFeatured: false,
      search: ''
    });
    
    const searchParams = new URLSearchParams(location.search);
    ['priceRange', 'colors', 'sizes', 'categories', 'minDiscount', 'rating', 'stock', 'isNewArrival', 'isFeatured', 'search'].forEach(param => {
      searchParams.delete(param);
    });
    navigate({ search: searchParams.toString() });
  };

  const FilterDrawer = () => (
    <Drawer
      anchor="left"
      open={isFilterOpen}
      onClose={() => setIsFilterOpen(false)}
      PaperProps={{
        sx: { 
          width: { xs: '85%', sm: '380px' },
          p: 2,
          borderRadius: { xs: 0, sm: '0 8px 8px 0' }
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2, 
          pb: 1, 
          borderBottom: '1px solid #eee'
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              fontSize: '1.2rem'
            }}
          >
            Refine Results
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={handleClearFilters}
              sx={{ 
                borderRadius: '4px',
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Clear All
            </Button>
            <IconButton 
              onClick={() => setIsFilterOpen(false)}
              sx={{ p: 0.5 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box 
          sx={{ 
            flexGrow: 1,
            overflowY: 'auto',
            pr: 1,
            mr: -1,
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f5f5f5',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#ddd',
              borderRadius: '4px',
            },
          }}
        >
          <FilterAccordion defaultExpanded>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ px: 1 }}
            >
              <Typography sx={{ fontWeight: 600 }}>Search</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                fullWidth
                size="small"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  sx: { borderRadius: '4px' }
                }}
              />
            </AccordionDetails>
          </FilterAccordion>

          <FilterAccordion defaultExpanded>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ px: 1 }}
            >
              <Typography sx={{ fontWeight: 600 }}>Price Range</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {priceRanges.map((range) => (
                  <FormControlLabel
                    key={range.value}
                    control={
                      <Checkbox
                        checked={filters.priceRange === range.value}
                        onChange={() => handleFilterChange('priceRange', range.value)}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="body2">{range.label}</Typography>
                    }
                    sx={{ ml: -1 }}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </FilterAccordion>

          {availableFilters.colors.length > 0 && (
            <FilterAccordion>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{ px: 1 }}
              >
                <Typography sx={{ fontWeight: 600 }}>Colors</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {availableFilters.colors.map((color) => (
                    <ColorSwatch
                      key={color}
                      color={getColorCode(color)}
                      selected={filters.colors.includes(color)}
                      onClick={() => handleFilterChange('colors', color)}
                      title={color}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </FilterAccordion>
          )}

          {availableFilters.sizes.length > 0 && (
            <FilterAccordion>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{ px: 1 }}
              >
                <Typography sx={{ fontWeight: 600 }}>Sizes</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {availableFilters.sizes.map((size) => (
                    <SizeBox
                      key={size}
                      selected={filters.sizes.includes(size)}
                      onClick={() => handleFilterChange('sizes', size)}
                    >
                      {size}
                    </SizeBox>
                  ))}
                </Box>
              </AccordionDetails>
            </FilterAccordion>
          )}

          <FilterAccordion>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ px: 1 }}
            >
              <Typography sx={{ fontWeight: 600 }}>Discount</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {discountRanges.map((discount) => (
                  <FormControlLabel
                    key={discount.value}
                    control={
                      <Checkbox
                        checked={filters.minDiscount === discount.value}
                        onChange={() => handleFilterChange('minDiscount', discount.value)}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="body2">{discount.label}</Typography>
                    }
                    sx={{ ml: -1 }}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </FilterAccordion>

          <FilterAccordion>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ px: 1 }}
            >
              <Typography sx={{ fontWeight: 600 }}>Rating</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {ratings.map((rating) => (
                  <FormControlLabel
                    key={rating}
                    control={
                      <Checkbox
                        checked={filters.rating === rating}
                        onChange={() => handleFilterChange('rating', rating)}
                        size="small"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {[...Array(rating)].map((_, i) => (
                          <Box 
                            key={i} 
                            component="span" 
                            sx={{ color: 'gold', fontSize: '18px' }}
                          >
                            ★
                          </Box>
                        ))}
                        <Typography variant="body2">&nbsp;& Above</Typography>
                      </Box>
                    }
                    sx={{ ml: -1 }}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </FilterAccordion>

          <FilterAccordion>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ px: 1 }}
            >
              <Typography sx={{ fontWeight: 600 }}>Availability</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {stockOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={filters.stock === option.value}
                        onChange={() => handleFilterChange('stock', option.value)}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="body2">{option.label}</Typography>
                    }
                    sx={{ ml: -1 }}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </FilterAccordion>

          <FilterAccordion>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ px: 1 }}
            >
              <Typography sx={{ fontWeight: 600 }}>Special</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.isNewArrival}
                      onChange={(e) => handleFilterChange('isNewArrival', e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">New Arrivals</Typography>
                  }
                  sx={{ ml: -1 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.isFeatured}
                      onChange={(e) => handleFilterChange('isFeatured', e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">Featured Products</Typography>
                  }
                  sx={{ ml: -1 }}
                />
              </Box>
            </AccordionDetails>
          </FilterAccordion>
        </Box>

        <Box sx={{ pt: 2, mt: 1, borderTop: '1px solid #eee' }}>
          <Button 
            variant="contained" 
            fullWidth
            onClick={() => setIsFilterOpen(false)}
            sx={{ 
              py: 1.2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '4px',
              backgroundColor: '#000000',
              color: 'white',
              '&:hover': {
                backgroundColor: '#00503a',
              }
            }}
          >
            Apply Filters
          </Button>
        </Box>
      </Box>
    </Drawer>
  );

  const ActiveFilters = () => {
    // Check if any filters are active
    const hasActiveFilters = Object.values(filters).some(filter => 
      Array.isArray(filter) ? filter.length > 0 : filter !== '' && filter !== false
    );

    if (!hasActiveFilters) return null;

    const getChipLabel = (key, value) => {
      switch(key) {
        case 'priceRange':
          return priceRanges.find(range => range.value === value)?.label || value;
        case 'minDiscount':
          return `${value}% off or more`;
        case 'rating':
          return `${value}★ & Above`;
        case 'stock':
          return value === 'in_stock' ? 'In Stock' : 'Out of Stock';
        case 'isNewArrival':
          return 'New Arrivals';
        case 'isFeatured':
          return 'Featured';
        default:
          return value;
      }
    };

    return (
      <Box 
        sx={{ 
          mb: 3, 
          p: 2,
          backgroundColor: '#fafafa',
          borderRadius: '6px',
          border: '1px solid #eaeaea',
        }}
      >
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600, 
              color: '#000',
              mr: 1
            }}
          >
            Active Filters
          </Typography>
          
          <Button 
            variant="text" 
            size="small" 
            onClick={handleClearFilters}
            sx={{ 
              color: '#000',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              p: 0.5,
              minWidth: 'auto'
            }}
          >
            Clear All
          </Button>
        </Box>
        
        <Box sx={{
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1,
          alignItems: 'center'
        }}>
          {Object.entries(filters).map(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
              return value.map(item => (
                <FilterChip
                  key={`${key}-${item}`}
                  label={item}
                  onDelete={() => handleFilterChange(key, item)}
                  size="small"
                />
              ));
            } else if (value && !Array.isArray(value) && value !== false) {
              return (
                <FilterChip
                  key={key}
                  label={getChipLabel(key, value)}
                  onDelete={() => handleFilterChange(key, value === true ? false : '')}
                  size="small"
                />
              );
            }
            return null;
          })}
        </Box>
      </Box>
    );
  };

  if (customersProduct.loading) {
    return (
      <Box sx={{ width: '100%', bgcolor: '#fff', ...mobileContainerStyle }}>
        <Box sx={{ 
          maxWidth: '100%', 
          px: { xs: 2, md: 4 }, 
          py: 4,
          boxShadow: '0 0 10px rgba(0,0,0,0.03)'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Skeleton variant="rectangular" width={100} height={40} sx={{ backgroundColor: '#69af5a', opacity: 0.2 }} />
            <Skeleton variant="rectangular" width={200} height={40} sx={{ backgroundColor: '#69af5a', opacity: 0.2 }} />
          </Box>
          
          <Grid container spacing={2}>
            {Array.from(new Array(12)).map((_, index) => (
              <Grid item xs={6} sm={6} md={3} key={index}>
                <ProductSkeleton />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', bgcolor: '#fff', ...mobileContainerStyle }}>
      <Box sx={{ 
        maxWidth: '100%', 
        px: { xs: 2, md: 4 }, 
        py: 4,
        boxShadow: '0 0 10px rgba(0,0,0,0.03)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexDirection: { xs: 'row', sm: 'row' },
          width: '100%',
          gap: { xs: 1, sm: 2 }
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 },
            flex: { xs: '1', sm: 'auto' }
          }}>
            <FilterButton 
              onClick={() => setIsFilterOpen(true)}
              startIcon={<FilterListIcon />}
              variant="contained"
              size={isMobile ? "small" : "medium"}
              sx={{
                borderRadius: '4px',
                textTransform: 'none',
                fontWeight: 600,
                px: { xs: 1, sm: 2 },
                whiteSpace: 'nowrap',
                minWidth: 'auto'
              }}
            >
              Filter {Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f !== '' && f !== false) && '•'}
            </FilterButton>
            
            {customersProduct.products?.totalProducts > 0 && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary', 
                  fontWeight: 500,
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                {customersProduct.products?.totalProducts} {customersProduct.products?.totalProducts === 1 ? 'Product' : 'Products'}
              </Typography>
            )}
          </Box>
          
          <FormControl 
            size="small" 
            sx={{ 
              width: { xs: '50%', sm: 'auto' }, 
              minWidth: { xs: 'auto', sm: 200 },
              flex: { xs: '1', sm: 'auto' }
            }}
          >
            <Select
              value={sortBy}
              onChange={handleSortChange}
              displayEmpty
              variant="outlined"
              sx={{ 
                borderRadius: '4px',
                '& .MuiSelect-select': {
                  paddingRight: { xs: '26px', sm: '32px' }
                }
              }}
            >
              <MenuItem value="">Sort By</MenuItem>
              <MenuItem value="price_low">Price: Low to High</MenuItem>
              <MenuItem value="price_high">Price: High to Low</MenuItem>
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="popularity">Popularity</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <ActiveFilters />

        <FilterDrawer />

        {customersProduct.products?.totalProducts > 0 && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary', 
              fontWeight: 500,
              display: { xs: 'block', sm: 'none' },
              mb: 2
            }}
          >
            {customersProduct.products?.totalProducts} {customersProduct.products?.totalProducts === 1 ? 'Product' : 'Products'}
          </Typography>
        )}

        {customersProduct.error ? (
          <Alert severity="error" sx={{ mb: 4 }}>
            {customersProduct.error}
          </Alert>
        ) : (!customersProduct.products?.content || customersProduct.products.content.length === 0) && filterParams.category ? (
          <Box
            sx={{
              minHeight: '70vh',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
              position: 'relative',
              overflow: 'hidden',
              margin: 0,
              padding: 4,
              color: 'white',
              textAlign: 'center'
            }}
          >
            <Typography
              variant="h2"
              sx={{
                color: '#FFD700',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '0.15em',
                marginBottom: 4,
                fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              Coming Soon
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                maxWidth: '800px',
                marginBottom: 6,
                lineHeight: 1.8,
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
              }}
            >
              We&apos;re working on something exciting! Our team is curating an exceptional collection that will be worth the wait. Stay tuned for updates.
            </Typography>
            <Button
              onClick={() => navigate('/')}
              sx={{
                backgroundColor: '#FFD700',
                color: '#000',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                '&:hover': {
                  backgroundColor: '#fff'
                }
              }}
            >
              Return to Homepage
            </Button>
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              {customersProduct.products?.content?.map((product) => (
                <Grid 
                  item 
                  xs={6} 
                  sm={6} 
                  md={3} 
                  key={product._id} 
                  sx={{ 
                    ...(isMobile ? { height: '45vh' } : {})
                  }}
                >
                  <ProductCardWithLoader 
                    product={product} 
                    onClick={() => handleProductClick(product._id, product)} 
                  />
                </Grid>
              ))}
            </Grid>

            {customersProduct.products?.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                <Pagination
                  count={customersProduct.products.totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default Product;
