import React, { useEffect, useState, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import axios from 'axios';
import { useDispatch, useSelector } from "react-redux";
import { getCategories } from "../Redux/Admin/Category/Action";
import { findProducts } from "../Redux/Customers/Product/Action";
import { Box, Container, IconButton, Typography, Grid, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../config/api';
import HomeCarousel from "../customer/Components/Carousel/HomeCarousel";
import HomeProductCard from "../customer/Components/Home/HomeProductCard";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { styled } from '@mui/material/styles';
// Import Swiper React components
// Moved Swiper into a lazy-loaded child to reduce initial bundle
// Import IntersectionObserver hook for better performance
import { useInView } from 'react-intersection-observer';
const NewArrivalsCarousel = lazy(() => import('../customer/Components/Home/NewArrivalsCarousel'));

const ScrollButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  zIndex: 2,
  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  width: 40,
  height: 40,
}));

const ProductsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  overflowX: 'hidden',
  scrollBehavior: 'smooth',
  position: 'relative',
  gap: theme.spacing(3),
  '&::-webkit-scrollbar': {
    display: 'none'
  },
  scrollbarWidth: 'none',
  padding: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(2),
  }
}));

const ProductWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  backgroundColor: '#fff',
  position: 'relative',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  '& .product-image': {
    width: '100%',
    paddingTop: '150%',
    position: 'relative',
    overflow: 'hidden',
    margin: 0,
    border: '1px solid #e0e0e0',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    background: '#fff',
    '& img': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      filter: 'brightness(1.02) contrast(1.1)',
      transform: 'scale(1.01)',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        filter: 'brightness(1.05) contrast(1.15)',
        transform: 'scale(1.03)'
      }
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
      zIndex: 2,
      pointerEvents: 'none'
    }
  },
  '& .product-info': {
    padding: '0.5rem 0 0 0',
    textAlign: 'left',
    margin: 0,
    '& .product-title': {
      fontSize: '0.9rem',
      fontWeight: 500,
      marginBottom: '0.25rem',
      color: '#000'
    },
    '& .product-price': {
      fontSize: '0.9rem',
      color: '#000',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      margin: 0,
      '& .original-price': {
        textDecoration: 'line-through',
        color: '#666'
      },
      '& .discount': {
        color: '#666'
      }
    }
  },
  [theme.breakpoints.down('sm')]: {
    '& .product-image': {
      paddingTop: '180%',
    }
  }
}));

const NewBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 8,
  left: 8,
  backgroundColor: '#000',
  color: '#fff',
  padding: '2px 8px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  zIndex: 1,
  borderRadius: '2px'
}));

const ImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  '&:hover': {
    transform: 'scale(1.02)',
    transition: 'transform 0.3s ease-in-out'
  }
}));

const CategoryInfo = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(2),
  background: 'rgba(0, 0, 0, 0.5)',
  borderRadius: '0 0 4px 4px',
  color: '#fff',
  '& .category-title': {
    fontSize: '1.2rem',
    fontWeight: 600,
    marginBottom: theme.spacing(1)
  },
  '& .view-collection': {
    fontSize: '0.9rem',
    fontWeight: 500
  }
}));

const CategoryCard = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  '&:hover': {
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
  }
}));

const Homepage = () => {
  // Swiper usage moved to NewArrivalsCarousel

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [newArrivalsByCategory, setNewArrivalsByCategory] = useState({});
  
  // Use IntersectionObserver for the New Arrivalss section
  const { ref: newArrivalsRef, inView: newArrivalsInView } = useInView({
    threshold: 0.2, // 20% visibility triggers the callback
    triggerOnce: false
  });
  
  // No external swiper ref needed; each carousel manages its own autoplay based on inView
  
  const categoryState = useSelector((state) => state.category);
  const { categories = [], loading = false, error = null } = categoryState || {};
  const customersProduct = useSelector((state) => state.customersProduct);

  // Get level 1, 2 and 3 categories
  const level1Categories = categories?.filter(cat => cat.level === 1) || [];
  const level2Categories = categories?.filter(cat => cat.level === 2) || [];
  const level3Categories = categories?.filter(cat => cat.level === 3) || [];

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  // Add this function to filter out duplicate products
  const getUniqueProducts = (products) => {
    const seen = new Set();
    return products.filter(product => {
      const duplicate = seen.has(product._id);
      seen.add(product._id);
      return !duplicate;
    });
  };

  // Function to get category name for a product
  const getCategoryNameForProduct = (product) => {
    if (!product || !product.category || !categories) return '';
    const categoryId = typeof product.category === 'string' ? product.category : product.category._id;
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : '';
  };

  // Group products by category for better display
  const groupProductsByCategory = (products) => {
    const grouped = {};
    products.forEach(product => {
      const categoryId = product?.category?._id || product?.category;
      if (!categoryId) return;
      if (!grouped[categoryId]) grouped[categoryId] = [];
      grouped[categoryId].push(product);
    });
    return grouped;
  };

  // Fetch new arrivals per level 3 category using server-side filtering
  useEffect(() => {
    const fetchCategoryNewArrivals = async (categoryId) => {
      const collected = [];
      let pageNumber = 1;
      const pageSize = 200;
      let totalPages = 1;
      do {
        const params = new URLSearchParams();
        params.append('pageNumber', String(pageNumber));
        params.append('pageSize', String(pageSize));
        params.append('category', categoryId);
        params.append('isNewArrival', 'true');
        const url = `${API_BASE_URL}/api/products?${params.toString()}`;
        const response = await axios.get(url);
        const data = response.data || {};
        const content = Array.isArray(data.content) ? data.content : [];
        totalPages = Number(data.totalPages || 1);
        for (const p of content) {
          collected.push(p);
        }
        pageNumber += 1;
      } while (pageNumber <= totalPages);
      return getUniqueProducts(collected);
    };

    const fetchAll = async () => {
      if (!level3Categories || level3Categories.length === 0) return;
      try {
        const entries = await Promise.all(
          level3Categories.map(async (cat) => {
            const prods = await fetchCategoryNewArrivals(cat._id);
            return [cat._id, prods];
          })
        );
        setNewArrivalsByCategory(Object.fromEntries(entries));
      } catch (e) {
        console.error('Error fetching per-category new arrivals:', e);
      }
    };

    fetchAll();
  }, [level3Categories]);

  // Add intersection observer for lazy loading images
  useEffect(() => {
    // Create an intersection observer to handle lazy loading
    const options = {
      rootMargin: '100px 0px',
      threshold: 0.1
    };
    
    const handleIntersection = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // Replace the placeholder with the actual image source
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        }
      });
    };
    
    const observer = new IntersectionObserver(handleIntersection, options);
    
    // Target all images with lazyload class
    const lazyImages = document.querySelectorAll('img.lazyload');
    lazyImages.forEach(img => observer.observe(img));
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [categories]);

  const handleCategoryClick = (categoryId) => {
    // First check if we have categories loaded
    if (!categories?.length) {
      return;
    }

    // Find the category and check if it exists
    const category = categories.find(cat => cat._id === categoryId);
    if (!category) {
      return;
    }

    // Check if this is a subcategory (level 2)
    const isSubcategory = category.level === 2;
    
    // If it's a level 2 category, check for level 3 subcategories
    if (isSubcategory) {
      const hasLevel3Categories = categories.some(cat => 
        cat.level === 3 && cat.parentCategory && cat.parentCategory._id === categoryId
      );

      // Log for debugging
      console.log('Category navigation details:', {
        categoryId,
        categoryName: category.name,
        level: category.level,
        hasLevel3Categories,
        parentCategory: category.parentCategory,
        level3Categories: categories.filter(cat => cat.level === 3 && cat.parentCategory && cat.parentCategory._id === categoryId)
      });

                      if (hasLevel3Categories) {
                  navigate(`/category/${category.slug || categoryId}`);
                } else {
                  navigate(`/category/coming-soon/${category.slug || categoryId}`);
                }
      return;
    }

    // For level 1 categories, check for level 2 subcategories
    const hasSubcategories = level2Categories.some(cat => cat.parentCategory?._id === categoryId);

    // Log for debugging
    console.log('Category navigation:', {
      categoryId,
      categoryName: category.name,
      level: category.level,
      hasSubcategories
    });

                // Navigate based on subcategories
            if (hasSubcategories) {
              navigate(`/category/${category.slug || categoryId}`);
            } else {
              navigate(`/category/coming-soon/${category.slug || categoryId}`);
            }
  };

  const getSubcategories = (parentId) => {
    return level2Categories.filter(cat => cat.parentCategory?._id === parentId);
  };

  return (
    <div>
      {/* Hero Slider Section */}
      <section className="slider-area position-relative">
        <Box>
          <HomeCarousel />
        </Box>
      </section>

      {/* New Arrivals Per Level 3 Category */}
      {Object.keys(newArrivalsByCategory).length > 0 && (
        <section style={{ padding: '1.5rem 0', minHeight: '60vh' }} ref={newArrivalsRef}>
          <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
            {level3Categories.map((cat) => {
              const products = newArrivalsByCategory[cat._id] || [];
              if (!products.length) return null;
              return (
                <Box key={cat._id} sx={{ mb: 6 }}>
                  <Box sx={{
                    width: '100%',
                    maxWidth: '90%',
                    textAlign: 'center',
                    position: 'relative',
                    py: 2,
                    mx: 'auto',
                    '&::before, &::after': {
                      content: '""',
                      position: 'absolute',
                      height: '2px',
                      width: '100%',
                      background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0) 100%)',
                      left: 0
                    },
                    '&::before': { top: 0 },
                    '&::after': { bottom: 0 }
                  }}>
                    <Typography 
                      variant="h3" 
                      component="h2" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#000',
                        fontSize: { xs: '1.6rem', sm: '2rem', md: '2.2rem' },
                        textTransform: 'uppercase',
                        letterSpacing: '3px',
                        position: 'relative',
                        display: 'inline-block',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: '-8px',
                          left: '25%',
                          width: '50%',
                          height: '3px',
                          backgroundColor: '#000'
                        }
                      }}
                    >
                      {`NEW ARRIVALS - ${cat.name}`}
                    </Typography>
                  </Box>
                  <Suspense fallback={<div style={{ height: '400px' }} />}> 
                    <NewArrivalsCarousel 
                      products={products}
                      getCategoryNameForProduct={getCategoryNameForProduct}
                      inView={newArrivalsInView}
                    />
                  </Suspense>
                </Box>
              );
            })}
          </Container>
        </section>
      )}

      {/* Categories Section */}
      <section style={{ width: '100%', margin: 0, padding: '1.5rem 0 0 0', minHeight: '80vh' }} id="categories-section">
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 }, mb: 3 }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            mb: 3,
            overflow: 'hidden'
          }}>
            <Box sx={{
              width: '100%',
              maxWidth: '90%',
              textAlign: 'center',
              position: 'relative',
              py: 2,
              '&::before, &::after': {
                content: '""',
                position: 'absolute',
                height: '2px',
                width: '100%',
                background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0) 100%)',
                left: 0
              },
              '&::before': {
                top: 0
              },
              '&::after': {
                bottom: 0
              }
            }}>
              <Typography 
                variant="h3" 
                component="h2" 
                sx={{ 
                  fontWeight: 600,
                  color: '#000',
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                  textTransform: 'uppercase',
                  letterSpacing: '3px',
                  position: 'relative',
                  display: 'inline-block',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-8px',
                    left: '25%',
                    width: '50%',
                    height: '3px',
                    backgroundColor: '#000'
                  }
                }}
              >
                SHOP BY CATEGORY
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  mt: 2,
                  color: '#555',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  letterSpacing: '1px',
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                Explore our curated collections
              </Typography>
            </Box>
          </Box>
        </Container>
        {level1Categories.map((category) => {
          const subcategories = getSubcategories(category._id);
          const hasProducts = category.products && category.products.length > 0;
          
          // Only show Coming Soon if no subcategories AND no products
          if (subcategories.length === 0 && !hasProducts) {
            return (
              <Box key={category._id} sx={{ width: '100%', mb: { xs: 0.5, md: 1 } }}>
                <Grid container spacing={{ xs: 0.5, md: 1 }}>
                  <Grid item xs={12} sm={12} sx={{ 
                    height: { xs: '50vh', sm: '60vh', md: '70vh' }
                  }}>
                    <Box
                      onClick={() => navigate(`/category/coming-soon/${category.slug || category._id}`)}
                      sx={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                        backgroundColor: '#000',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 4,
                        cursor: 'pointer',
                        '&:hover': {
                          '& .category-title': {
                            transform: 'scale(1.05)',
                          },
                          '& .coming-soon': {
                            color: '#FFD700',
                          }
                        }
                      }}
                    >
                      <Typography
                        className="category-title"
                        variant="h2"
                        sx={{
                          color: 'white',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '0.2em',
                          textAlign: 'center',
                          fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
                          mb: 3,
                          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                          transition: 'transform 0.3s ease',
                        }}
                      >
                        {category.name}
                      </Typography>
                      <Typography
                        className="coming-soon"
                        variant="h3"
                        sx={{
                          color: '#FFD700',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          letterSpacing: '0.15em',
                          textAlign: 'center',
                          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                          mb: 4,
                          transition: 'color 0.3s ease',
                        }}
                      >
                        Coming Soon
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'rgba(255,255,255,0.8)',
                          textAlign: 'center',
                          maxWidth: '600px',
                          fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                          letterSpacing: '0.05em',
                          lineHeight: 1.6,
                        }}
                      >
                        We&apos;re working on something exciting! Stay tuned for our latest collection.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            );
          }

          // Show regular category view for categories with subcategories or products
          return (
            <Box key={category._id} sx={{ 
              width: '100%', 
              mb: { xs: 0.5, md: 1 },
              // Optimize rendering
              contentVisibility: 'auto',
              containIntrinsicSize: '0 600px',
              // Hardware acceleration
              willChange: 'transform',
              transform: 'translateZ(0)'
            }}>
              <Grid container spacing={{ xs: 0.5, md: 1 }}>
                {subcategories.length > 0 ? (
                  // If has subcategories, show them
                  subcategories.map((subCategory) => (
                    <Grid item xs={12} sm={6} key={subCategory._id} sx={{ 
                      height: { xs: '70vh', sm: '80vh', md: '90vh' }
                    }}>
                      <Box
                        onClick={() => handleCategoryClick(subCategory._id)}
                        sx={{
                          width: '100%',
                          height: '100%',
                          position: 'relative',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          '&:hover': {
                            '& img': {
                              transform: 'scale(1.05)',
                            },
                            '& .category-overlay': {
                              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)',
                            }
                          }
                        }}
                        className="image-container"
                      >
                        <Box
                          component="img"
                          src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" // Tiny placeholder
                          data-src={`${process.env.REACT_APP_API_URL}${subCategory.imageUrl}`}
                          alt={subCategory.name}
                          className="center-image lazyload"
                          loading="lazy"
                          width="1920"
                          height="1080"
                          sx={{
                            width: '100%',
                            height: '100%',
                            transition: 'transform 0.4s ease',
                            display: 'block', 
                            margin: '0 auto',
                            // Image quality optimization
                            objectFit: 'cover',
                            filter: 'brightness(1.02)',
                            // Optimize memory consumption
                            imageRendering: { xs: 'optimizeSpeed', md: 'auto' },
                            // Prevent layout shift
                            aspectRatio: '16/9'
                          }}  
                        />
                        <Box
                          className="category-overlay"
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            // Simplified gradient for better performance
                            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            padding: { xs: '1.5rem', sm: '2rem', md: '3rem' },
                            // Reduced transition properties
                            transition: 'opacity 0.2s ease',
                            // Prevent repaints during scroll
                            willChange: 'opacity',
                            // Hardware acceleration
                            transform: 'translateZ(0)'
                          }}
                        >
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: { xs: '0.1em', md: '0.15em' },
                              textShadow: '2px 2px 4px rgba(0,0,0,0.4)',
                              textAlign: 'center',
                              color: 'white',
                              fontSize: { 
                                xs: '1.5rem',
                                sm: '2rem',
                                md: '2.5rem'
                              },
                              lineHeight: 1.2,
                              mb: { xs: 1, md: 2 }
                            }}
                          >
                            {subCategory.name}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.9)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.2em',
                              fontSize: { xs: '0.8rem', md: '0.9rem' },
                              fontWeight: 500,
                              textAlign: 'center',
                              opacity: 0.9
                            }}
                          >
                            {(() => {
                              // For level 2 categories, check for level 3 subcategories
                              if (subCategory.level === 2) {
                                const hasLevel3Categories = categories.some(cat => 
                                  cat.level === 3 && cat.parentCategory && cat.parentCategory._id === subCategory._id
                                );
                                return hasLevel3Categories ? 'View Collection' : 'Coming Soon';
                              }
                              return 'View Collection';
                            })()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))
                ) : (
                  // If no subcategories but has products, show single category
                  <Grid item xs={12} sm={12} sx={{ 
                    height: { xs: '70vh', sm: '80vh', md: '90vh' }
                  }}>
                    <Box
                      onClick={() => handleCategoryClick(category._id)}
                      sx={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        '&:hover': {
                          '& img': {
                            transform: 'scale(1.05)',
                          },
                          '& .category-overlay': {
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)',
                          }
                        }
                      }}
                      className="image-container"
                    >
                      <Box
                        component="img"
                        src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" // Tiny placeholder
                        data-src={`${process.env.REACT_APP_API_URL}${category.imageUrl}`}
                        alt={category.name}
                        className="center-image lazyload"
                        loading="lazy"
                        width="1920"
                        height="1080"
                        sx={{
                          width: '100%',
                          height: '100%',
                          transition: 'transform 0.4s ease',
                          display: 'block',
                          margin: '0 auto',
                          // Proper image aspect ratio to prevent layout shifts
                          aspectRatio: '16/9',
                          // Image quality optimization with CSS filters instead of overlays
                          objectFit: 'cover',
                          filter: 'brightness(1.05) contrast(1.02)',
                          // Optimize memory consumption
                          imageRendering: { xs: 'auto', md: 'auto' }
                        }}
                      />
                      <Box
                        className="category-overlay"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          // Remove black overlay shadows entirely
                          background: 'none',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          padding: { xs: '2rem', sm: '3rem', md: '4rem' },
                          transition: 'transform 0.3s ease',
                        }}
                      >
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: { xs: '0.1em', md: '0.15em' },
                            // Enhanced text shadow for readability without overlay
                            textShadow: '0 2px 4px rgba(0,0,0,0.7), 0 4px 8px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)',
                            textAlign: 'center',
                            color: 'white',
                            fontSize: { 
                              xs: '1.5rem',
                              sm: '2rem',
                              md: '2.5rem'
                            },
                            lineHeight: 1.2,
                            mb: { xs: 1, md: 2 },
                            // Add a subtle background for legibility
                            padding: '0.5rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(0,0,0,0.2)'
                          }}
                        >
                          {category.name}
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.95)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2em',
                            fontSize: { xs: '0.8rem', md: '0.9rem' },
                            fontWeight: 500,
                            textAlign: 'center',
                            // Add subtle text shadow for better contrast
                            textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.4)',
                            // Add a subtle background for better legibility
                            padding: '0.2rem 1rem',
                            borderRadius: '2px',
                            backgroundColor: 'rgba(0,0,0,0.15)'
                          }}
                        >
                          {(() => {
                            // For level 1 categories, check for level 2 subcategories
                            const hasLevel2Categories = categories
                              .filter(cat => cat.level === 2)
                              .some(cat => cat.parentCategory?._id === category._id);
                            return hasLevel2Categories ? 'View Collection' : 'Coming Soon';
                          })()}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          );
        })}
      </section>
    </div>
  );
};

export default Homepage;
