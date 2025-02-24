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
  Divider
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';

const priceRanges = [
  { label: 'Under Tk. 1000', value: '0-1000' },
  { label: 'Tk. 1000 - Tk. 2000', value: '1000-2000' },
  { label: 'Tk. 2000 - Tk. 3000', value: '2000-3000' },
  { label: 'Above Tk. 3000', value: '3000-999999' }
];

const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Gray', 'Navy'];
const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

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
    categories: []
  });
  const [availableFilters, setAvailableFilters] = useState({
    colors: [],
    sizes: []
  });

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const page = parseInt(searchParams.get('page')) || 1;
    const sort = searchParams.get('sort') || '';
    const category = searchParams.get('category') || '';

    setCurrentPage(page);
    setSortBy(sort);

    const filterParams = {
      category,
      pageNumber: page,
      pageSize: 12,
      sort,
      minPrice: '',
      maxPrice: '',
      colors: filters.colors,
      sizes: filters.sizes
    };

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-');
      filterParams.minPrice = min;
      filterParams.maxPrice = max;
    }

    dispatch(findProducts(filterParams))
      .then(response => {
        if (response?.availableFilters) {
          setAvailableFilters({
            colors: response.availableFilters.colors || [],
            sizes: response.availableFilters.sizes || []
          });
        }
      });
  }, [dispatch, location.search, filters]);

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
    navigate(`/product/${productId}`);
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
      categories: []
    });
    
    const searchParams = new URLSearchParams(location.search);
    ['priceRange', 'colors', 'sizes', 'categories'].forEach(param => {
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
        sx: { width: '280px', p: 2 }
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

        {availableFilters.colors.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Colors</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {availableFilters.colors.map((color) => (
                <FormControlLabel
                  key={color}
                  control={
                    <Checkbox
                      checked={filters.colors.includes(color)}
                      onChange={() => handleFilterChange('colors', color)}
                    />
                  }
                  label={color}
                />
              ))}
            </AccordionDetails>
          </Accordion>
        )}

        {availableFilters.sizes.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Sizes</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {availableFilters.sizes.map((size) => (
                <FormControlLabel
                  key={size}
                  control={
                    <Checkbox
                      checked={filters.sizes.includes(size)}
                      onChange={() => handleFilterChange('sizes', size)}
                    />
                  }
                  label={size}
                />
              ))}
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
        {/* Header, Sort and Filter */}
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

        {/* Active Filters */}
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

            {/* Pagination */}
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
