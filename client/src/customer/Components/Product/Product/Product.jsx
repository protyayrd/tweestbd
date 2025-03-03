import React, { useState, useEffect } from 'react';
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
  TextField
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

const ProductImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  position: 'absolute',
  top: 0,
  left: 0,
  transition: 'opacity 0.3s ease-in-out',
});

const ImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  paddingTop: '135%',
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
    paddingTop: '180%',
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
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '6px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  color: '#666',
  textTransform: 'none',
  '&:hover': {
    backgroundColor: '#f5f5f5'
  }
}));

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
    colors: [],
    sizes: []
  });
  const [filterParams, setFilterParams] = useState({});

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = parseInt(params.get('page')) || 1;
    const sort = params.get('sort') || '';
    const categoryId = params.get('category');
    const search = params.get('search') || '';

    setCurrentPage(page);
    setSortBy(sort);

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
      // Find the selected category
      const selectedCategory = category.categories?.find(cat => cat._id === categoryId);
      
      if (selectedCategory) {
        // Only use the category directly, no parent category logic
        newFilterParams.category = categoryId;
      }
    }

    // Handle price range
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-');
      newFilterParams.minPrice = min;
      newFilterParams.maxPrice = max;
    }

    console.log('Setting filter params:', newFilterParams);
    setFilterParams(newFilterParams);
  }, [location.search, filters, category.categories, navigate]);

  useEffect(() => {
    if (Object.keys(filterParams).length > 0) {
      console.log('Fetching products with params:', filterParams);
      dispatch(findProducts(filterParams));
    }
  }, [dispatch, filterParams]);

  const handleSortChange = (event) => {
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
  };

  const handlePageChange = (event, value) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', value);
    navigate({ search: searchParams.toString() });
  };

  const handleProductClick = (productId) => {
    window.location.href = `/product/${productId}`;
  };

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
        sx: { width: '320px', p: 2 }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <IconButton onClick={() => setIsFilterOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Button 
        variant="outlined" 
        fullWidth 
        onClick={handleClearFilters}
        sx={{ mb: 2 }}
      >
        Clear All
      </Button>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Search</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              fullWidth
              size="small"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              sx={{ mb: 1 }}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Price Range</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {priceRanges.map((range) => (
              <FormControlLabel
                key={range.value}
                control={
                  <Checkbox
                    checked={filters.priceRange === range.value}
                    onChange={() => handleFilterChange('priceRange', range.value)}
                  />
                }
                label={range.label}
              />
            ))}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Discount</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {discountRanges.map((discount) => (
              <FormControlLabel
                key={discount.value}
                control={
                  <Checkbox
                    checked={filters.minDiscount === discount.value}
                    onChange={() => handleFilterChange('minDiscount', discount.value)}
                  />
                }
                label={discount.label}
              />
            ))}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Rating</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {ratings.map((rating) => (
              <FormControlLabel
                key={rating}
                control={
                  <Checkbox
                    checked={filters.rating === rating}
                    onChange={() => handleFilterChange('rating', rating)}
                  />
                }
                label={`${rating} Stars & Above`}
              />
            ))}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Availability</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {stockOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={filters.stock === option.value}
                    onChange={() => handleFilterChange('stock', option.value)}
                  />
                }
                label={option.label}
              />
            ))}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Special</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.isNewArrival}
                  onChange={(e) => handleFilterChange('isNewArrival', e.target.checked)}
                />
              }
              label="New Arrivals"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.isFeatured}
                  onChange={(e) => handleFilterChange('isFeatured', e.target.checked)}
                />
              }
              label="Featured Products"
            />
          </AccordionDetails>
        </Accordion>

        {availableFilters.colors.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Colors</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableFilters.colors.map((color) => (
                  <Chip
                    key={color}
                    label={color}
                    onClick={() => handleFilterChange('colors', color)}
                    onDelete={
                      filters.colors.includes(color) 
                        ? () => handleFilterChange('colors', color)
                        : undefined
                    }
                    color={filters.colors.includes(color) ? "primary" : "default"}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {availableFilters.sizes.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Sizes</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableFilters.sizes.map((size) => (
                  <Chip
                    key={size}
                    label={size}
                    onClick={() => handleFilterChange('sizes', size)}
                    onDelete={
                      filters.sizes.includes(size) 
                        ? () => handleFilterChange('sizes', size)
                        : undefined
                    }
                    color={filters.sizes.includes(size) ? "primary" : "default"}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    </Drawer>
  );

  if (customersProduct.loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', bgcolor: '#fff' }}>
      <Box sx={{ maxWidth: '100%', px: 2, py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <FilterButton 
            onClick={() => setIsFilterOpen(true)}
            startIcon={<FilterListIcon />}
          >
            Filter
          </FilterButton>
          
          <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 200 }}>
            <Select
              value={sortBy}
              onChange={handleSortChange}
              displayEmpty
              variant="outlined"
            >
              <MenuItem value="">Sort By</MenuItem>
              <MenuItem value="price_low">Price: Low to High</MenuItem>
              <MenuItem value="price_high">Price: High to Low</MenuItem>
              <MenuItem value="newest">Newest First</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {Object.values(filters).some(filter => 
          Array.isArray(filter) ? filter.length > 0 : filter !== ''
        ) && (
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(filters).map(([key, value]) => {
              if (Array.isArray(value) && value.length > 0) {
                return value.map(item => (
                  <Chip
                    key={`${key}-${item}`}
                    label={item}
                    onDelete={() => handleFilterChange(key, item)}
                    size="small"
                  />
                ));
              } else if (value && !Array.isArray(value)) {
                return (
                  <Chip
                    key={key}
                    label={priceRanges.find(range => range.value === value)?.label || value}
                    onDelete={() => handleFilterChange(key, value)}
                    size="small"
                  />
                );
              }
              return null;
            })}
          </Box>
        )}

        <FilterDrawer />

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
              {customersProduct.products?.content?.map((product) => {
                const primaryImage = product.colors?.[0]?.images?.[0];
                const secondaryImage = product.colors?.[0]?.images?.[1] || primaryImage;
                
                return (
                  <Grid item xs={12} sm={6} md={3} key={product._id}>
                    <ProductCard onClick={() => handleProductClick(product._id)}>
                      <ImageContainer>
                        <ProductImage
                          className="primary-image"
                          src={primaryImage ? getImageUrl(primaryImage) : 'https://via.placeholder.com/400x600'}
                          alt={product.title}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x600';
                          }}
                        />
                        <ProductImage
                          className="secondary-image"
                          src={secondaryImage ? getImageUrl(secondaryImage) : 'https://via.placeholder.com/400x600'}
                          alt={`${product.title} - hover`}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x600';
                          }}
                          sx={{ opacity: 0 }}
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
                          
                          {product.discountedPrice && product.discountedPrice < product.price && (
                            <>
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
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#666',
                                  fontSize: '0.9rem'
                                }}
                              >
                                ({product.discountPersent}% OFF)
                              </Typography>
                            </>
                          )}
                        </PriceContainer>
                      </CardContent>
                    </ProductCard>
                  </Grid>
                );
              })}
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
