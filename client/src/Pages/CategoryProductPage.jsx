import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Pagination,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link,
  Rating
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
// no icons in compact header
import { findProducts } from '../Redux/Customers/Product/Action';
import { getCategories } from '../Redux/Admin/Category/Action';
import { addItemToCart } from '../Redux/Customers/Cart/Action';
import { getImageUrl } from '../config/api';

// Product card component
const ProductCardComponent = ({ product, onAddToCart, loading }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:960px)');

  // Derive primary/secondary image similar to Product list component
  const primaryImage = useMemo(() => {
    // Prefer selected color images if provided
    if (Array.isArray(product?.selectedColorImages) && product.selectedColorImages.length > 0) {
      return product.selectedColorImages[0];
    }
    // Prefer first color's first image
    if (Array.isArray(product?.colors) && product.colors[0]?.images?.length) {
      return product.colors[0].images[0];
    }
    // Fallbacks
    if (product?.imageUrl) return product.imageUrl;
    if (Array.isArray(product?.images) && product.images.length > 0) return product.images[0];
    return null;
  }, [product]);

  const secondaryImage = useMemo(() => {
    if (Array.isArray(product?.selectedColorImages) && product.selectedColorImages.length > 1) {
      return product.selectedColorImages[1];
    }
    if (Array.isArray(product?.colors) && product.colors[0]?.images?.length > 1) {
      return product.colors[0].images[1];
    }
    if (Array.isArray(product?.images) && product.images.length > 1) return product.images[1];
    return null;
  }, [product]);

  // Safety check for product object
  if (!product || typeof product !== 'object') {
    return null;
  }

    const ProductCard = styled(Card)(({ theme }) => ({
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease-in-out',
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
      }
    }));

    const ImageContainer = styled(Box)(({ theme }) => ({
      position: 'relative',
      width: '100%',
      paddingTop: '150%', // 2:3 aspect ratio (683x1024)
      borderRadius: '8px 8px 0 0',
      overflow: 'hidden',
      backgroundColor: '#f8fafc'
    }));

    const ProductImage = styled('img')({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transition: 'transform 0.3s ease',
      '&:hover': {
        transform: 'scale(1.05)',
      }
    });

    const PriceContainer = styled(Box)(({ theme }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      marginBottom: theme.spacing(1)
    }));

    const DiscountChip = styled(Box)(({ theme }) => ({
      backgroundColor: '#e53e3e',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: 700,
      position: 'absolute',
      top: '8px',
      left: '8px',
      zIndex: 1
    }));

    const AddToCartButton = styled(Button)(({ theme }) => ({
      borderRadius: '8px',
      padding: '10px 16px',
      marginTop: 'auto',
      fontWeight: 600,
      textTransform: 'none',
      fontSize: '0.875rem',
      '&:disabled': {
        backgroundColor: '#e2e8f0',
        color: '#94a3b8',
      }
    }));

    const handleImageLoad = () => {
      setImageLoading(false);
    };

    const handleImageError = () => {
      setImageLoading(false);
    };

    const handleCardClick = (event) => {
      const productUrl = product?.slug ? `/product/${product.slug}` : `/product/${product._id}`;
      if (event?.ctrlKey || event?.metaKey) {
        window.open(productUrl, '_blank');
      } else {
        window.location.href = productUrl;
      }
    };

    return (
      <ProductCard onClick={handleCardClick}>
        <ImageContainer>
          {(product.discountPersent > 0 || product.discountPercentage > 0 || (product.price > (product.discountedPrice ?? product.price))) && (
            <DiscountChip>
              -{product.discountPersent || product.discountPercentage || Math.round(((product.price - (product.discountedPrice ?? product.price)) / product.price) * 100)}%
            </DiscountChip>
          )}
          {imageLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}
          <ProductImage
            src={primaryImage ? getImageUrl(primaryImage) : 'https://via.placeholder.com/400x600?text=No+Image'}
            alt={product.title || 'Product'}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={(e) => { handleImageError?.(); e.currentTarget.src = 'https://via.placeholder.com/400x600?text=No+Image'; }}
            style={{ opacity: imageLoading ? 0 : 1 }}
          />
        </ImageContainer>
        
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontSize: '0.95rem',
              fontWeight: 600,
              marginBottom: '6px',
              minHeight: '1.3rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2
            }}
          >
            {product.title}
          </Typography>

          {typeof product?.ratings === 'number' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Rating value={Number(product.ratings) || 0} precision={0.1} size="small" readOnly />
              <Typography variant="caption" color="text.secondary">
                ({product.numRatings || 0})
              </Typography>
            </Box>
          )}
          
          <PriceContainer>
            <Typography
              variant="h6"
              sx={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#0f172a'
              }}
            >
              Tk. {product.discountedPrice ?? product.price}
            </Typography>
            {(product.discountPersent > 0 || product.discountPercentage > 0 || (product.price > (product.discountedPrice ?? product.price))) && (
              <Typography
                variant="body2"
                sx={{
                  color: '#718096',
                  fontSize: '0.875rem',
                  textDecoration: 'line-through'
                }}
              >
                Tk. {product.price}
              </Typography>
            )}
          </PriceContainer>
          
          <AddToCartButton
            variant="contained"
            fullWidth
            disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            sx={{
              backgroundColor: '#0f172a',
              '&:hover': {
                backgroundColor: '#1e293b',
              }
            }}
          >
            {loading ? 'Adding...' : 'Add to Cart'}
          </AddToCartButton>
        </CardContent>
      </ProductCard>
    );
  };

// Lazy loaded product card component
const LazyProductCard = lazy(() => Promise.resolve({ default: ProductCardComponent }));

// Styled header matching the provided reference
const CategoryHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(6, 0),
  textAlign: 'center',
  position: 'relative',
  marginBottom: theme.spacing(3),
  // subtle top and bottom separators like the provided reference
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.12) 15%, rgba(0,0,0,0.12) 85%, transparent 100%)'
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.12) 15%, rgba(0,0,0,0.12) 85%, transparent 100%)'
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(5, 0),
    marginBottom: theme.spacing(2.5),
  }
}));

const HeaderContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const CategoryTitle = styled(Typography)(({ theme }) => ({
  fontSize: '2.1rem',
  fontWeight: 800,
  letterSpacing: '0.12rem',
  color: '#0f172a',
  textTransform: 'uppercase',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.6rem',
  }
}));

const TitleUnderline = styled(Box)(({ theme }) => ({
  width: '160px',
  height: '3px',
  backgroundColor: '#0f172a',
  borderRadius: '2px',
  marginTop: theme.spacing(0.25),
}));

const CategorySubtitle = styled(Typography)(({ theme }) => ({
  fontSize: '0.95rem',
  color: '#6b7280',
  fontStyle: 'italic',
  fontWeight: 500,
  marginTop: theme.spacing(0.25),
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.9rem',
  }
}));

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiBreadcrumbs-separator': {
    color: '#cbd5e1',
    fontSize: '1.25rem',
    margin: theme.spacing(0, 1),
  },
  '& .MuiLink-root': {
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.spacing(0.5),
    '&:hover': {
      color: '#0f172a',
      backgroundColor: '#f1f5f9',
      textDecoration: 'none',
    }
  },
  '& .MuiTypography-root': {
    color: '#0f172a',
    fontWeight: 600,
    fontSize: '0.875rem',
  }
}));

const CategoryProductPage = () => {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const customersProduct = useSelector((state) => state.customersProduct);
  const categories = useSelector((state) => state.category);
  
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:960px)');

  // Parse category slug and page from URL
  const parseUrlParams = useMemo(() => {
    const parts = categorySlug.split('&');
    const categoryPart = parts[0];
    const pagePart = parts.find(part => part.startsWith('page='));
    const pageNumber = pagePart ? parseInt(pagePart.split('=')[1]) : 1;
    
    return { categorySlug: categoryPart, page: pageNumber };
  }, [categorySlug]);

  // Find current category - use same logic as Product component
  const currentCategory = useMemo(() => {
    if (!categories?.categories) return null;
    
    // Try to find by slug first, then by ID (same logic as Product component)
    const foundCategory = categories.categories.find(cat => cat.slug === parseUrlParams.categorySlug) ||
                         categories.categories.find(cat => cat._id === parseUrlParams.categorySlug);
    
    // If category was found by ID but has a slug, redirect to slug version
    if (foundCategory && foundCategory.slug && parseUrlParams.categorySlug === foundCategory._id) {
      navigate(`/${foundCategory.slug}&page=${parseUrlParams.page}`, { replace: true });
    }
    
    return foundCategory;
  }, [categories?.categories, parseUrlParams.categorySlug, navigate, parseUrlParams.page]);

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
    navigate(`/${parseUrlParams.categorySlug}&page=${value}`);
  };

  // Handle sort change
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setPage(1);
    navigate(`/${parseUrlParams.categorySlug}&page=1`);
  };

  // Handle add to cart
  const handleAddToCart = (product) => {
    setLoading(true);
    
    if (auth.user) {
      // Authenticated user - use Redux
      dispatch(addItemToCart({
        productId: product._id,
        quantity: 1,
        color: product.colors[0]?.name || 'Default',
        size: product.sizes[0]?.name || 'Default'
      })).then(() => {
        setSnackbar({
          open: true,
          message: (
            <span>
              Added to cart! <Link href="/cart" sx={{ color: 'inherit', textDecoration: 'underline' }}>View Cart</Link>
            </span>
          ),
          severity: 'success'
        });
        setLoading(false);
      }).catch(() => {
        setSnackbar({
          open: true,
          message: 'Failed to add to cart',
          severity: 'error'
        });
        setLoading(false);
      });
    } else {
      // Guest user - use localStorage
      try {
        const existingCart = JSON.parse(localStorage.getItem('guestCartItems') || '[]');
        const colorName = product.colors?.[0]?.name || 'Default';
        const sizeName = product.sizes?.[0]?.name || 'Default';
        const existingItemIndex = existingCart.findIndex(item => 
          item.productId === product._id && 
          item.color === colorName &&
          item.size === sizeName
        );

        // Enrich product snapshot for cart to match downstream expectations
        const productSnapshot = {
          _id: product._id,
          title: product.title,
          price: product.price,
          discountedPrice: product.discountedPrice ?? product.price,
          imageUrl: product.images?.[0] || null,
          selectedColorImages: product.colors?.[0]?.images || product.images ? [product.images?.[0]].filter(Boolean) : [],
          colors: product.colors || [],
          category: product.category || null
        };

        if (existingItemIndex >= 0) {
          existingCart[existingItemIndex].quantity += 1;
        } else {
          existingCart.push({
            productId: product._id,
            product: productSnapshot,
            quantity: 1,
            color: colorName,
            size: sizeName
          });
        }

        localStorage.setItem('guestCartItems', JSON.stringify(existingCart));
        setSnackbar({
          open: true,
          message: (
            <span>
              Added to cart! <Link href="/cart" sx={{ color: 'inherit', textDecoration: 'underline' }}>View Cart</Link>
            </span>
          ),
          severity: 'success'
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to add to cart',
          severity: 'error'
        });
      }
      setLoading(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Fetch categories and products
  useEffect(() => {
    if (!categories?.categories) {
      dispatch(getCategories());
    }
  }, [dispatch, categories?.categories]);

  useEffect(() => {
    if (currentCategory) {
      const sortParams = {
        newest: { sortBy: 'createdAt', sortOrder: 'desc' },
        oldest: { sortBy: 'createdAt', sortOrder: 'asc' },
        priceLow: { sortBy: 'discountedPrice', sortOrder: 'asc' },
        priceHigh: { sortBy: 'discountedPrice', sortOrder: 'desc' },
        name: { sortBy: 'title', sortOrder: 'asc' }
      };

      const { sortBy: sortField, sortOrder } = sortParams[sortBy];
      
      dispatch(findProducts({
        category: currentCategory._id,
        pageNumber: parseUrlParams.page,
        pageSize: 12,
        sortBy: sortField,
        sortOrder: sortOrder
      }));
    }
  }, [dispatch, currentCategory, parseUrlParams.page, sortBy]);

  // Update page state when URL changes
  useEffect(() => {
    setPage(parseUrlParams.page);
  }, [parseUrlParams.page]);

  if (categories?.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentCategory) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Category not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f7fafc' }}>
      {/* Header */}
      <CategoryHeader>
        <Container maxWidth="xl">
          <HeaderContent>
            {/* Breadcrumbs centered under/over title for correct navigation */}
            <StyledBreadcrumbs aria-label="breadcrumb" sx={{ justifyContent: 'center', display: 'flex' }}>
              <Link component="button" onClick={() => navigate('/')} color="inherit" sx={{ cursor: 'pointer' }}>
                Home
              </Link>
              {currentCategory?.parentCategory?._id && (
                <Link
                  component="button"
                  onClick={() => {
                    const parent = categories?.categories?.find(c => c._id === currentCategory.parentCategory._id);
                    const parentSlug = parent?.slug || currentCategory.parentCategory._id;
                    navigate(`/category/${parentSlug}`);
                  }}
                  color="inherit"
                  sx={{ cursor: 'pointer' }}
                >
                  {currentCategory?.parentCategory?.name || 'Parent'}
                </Link>
              )}
              <Typography color="inherit">{currentCategory?.name}</Typography>
            </StyledBreadcrumbs>

            <CategoryTitle>{currentCategory?.name || 'Products'}</CategoryTitle>
            <TitleUnderline />
            <CategorySubtitle>The latest additions to our collection</CategorySubtitle>
          </HeaderContent>
        </Container>
      </CategoryHeader>

      <Container maxWidth="xl" sx={{ pt: 2 }}>

        {/* Products Grid */}
        {customersProduct.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : customersProduct.products?.content?.length > 0 ? (
          <>
            <Grid
              container
              spacing={3}
              sx={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
                gap: 3,
                mb: 4,
                pl: { xs: 3, sm: 3, md: 0 } // stronger left padding on mobile/tablet, none on desktop
              }}
            >
              {customersProduct.products.content.map((product) => (
                product && (
                  <Suspense key={product._id || Math.random()} fallback={<CircularProgress />}>
                    <LazyProductCard
                      product={product}
                      onAddToCart={handleAddToCart}
                      loading={loading}
                    />
                  </Suspense>
                )
              ))}
            </Grid>

            {/* Pagination */}
            {customersProduct.products?.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={customersProduct.products.totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: '8px',
                      fontWeight: 600,
                    },
                    '& .Mui-selected': {
                      backgroundColor: '#0f172a',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#1e293b',
                      }
                    }
                  }}
                />
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              We couldn&apos;t find any products in this category.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/category')}
              sx={{
                borderColor: '#0f172a',
                color: '#0f172a',
                '&:hover': {
                  borderColor: '#1e293b',
                  backgroundColor: '#f8fafc',
                }
              }}
            >
              Browse All Categories
            </Button>
          </Box>
        )}
      </Container>

      {/* Toast Message */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiAlert-root': {
            backgroundColor: snackbar.severity === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white',
            }
          }
        }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CategoryProductPage;
