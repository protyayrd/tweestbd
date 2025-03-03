import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCategories } from "../Redux/Admin/Category/Action";
import { findProducts } from "../Redux/Customers/Product/Action";
import { Box, Container, IconButton, Typography, Grid, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import HomeCarousel from "../customer/Components/Carousel/HomeCarousel";
import HomeProductCard from "../customer/Components/Home/HomeProductCard";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { styled } from '@mui/material/styles';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import { motion } from 'framer-motion';

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
    paddingTop: '180%',
    position: 'relative',
    overflow: 'hidden',
    margin: 0,
    border: '4px solid #000',
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
      paddingTop: '200%',
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

const CategoryCard = styled(motion.div)(({ theme }) => ({
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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [newArrivals, setNewArrivals] = useState([]);
  
  const categoryState = useSelector((state) => state.category);
  const { categories, loading, error } = categoryState;
  const customersProduct = useSelector((state) => state.customersProduct);

  // Get level 1 and 2 categories
  const level1Categories = categories?.filter(cat => cat.level === 1) || [];
  const level2Categories = categories?.filter(cat => cat.level === 2) || [];

  useEffect(() => {
    dispatch(getCategories());
    dispatch(findProducts({
      isNewArrival: true,
      sort: "createdAt_desc",
      pageSize: 6,
      pageNumber: 1,
      filters: {
        isNewArrival: true
      }
    }));
  }, [dispatch]);

  useEffect(() => {
    if (customersProduct?.products?.content) {
      const newArrivalProducts = customersProduct.products.content.filter(product => product.isNewArrival);
      setNewArrivals(newArrivalProducts);
    }
  }, [customersProduct?.products?.content]);

  const handleCategoryClick = (categoryId) => {
    // First check if we have categories loaded
    if (!categories?.length) {
      console.log('Categories not loaded yet');
      return;
    }

    // Find the category and check if it exists
    const category = categories.find(cat => cat._id === categoryId);
    if (!category) {
      console.log('Category not found:', categoryId);
      return;
    }

    // Check if this is a subcategory (level 2)
    const isSubcategory = category.level === 2;
    
    // If it's a level 2 category, check for level 3 subcategories
    if (isSubcategory) {
      const hasLevel3Categories = categories.some(cat => 
        cat.level === 3 && cat.parentCategory?._id === categoryId
      );

      // Log for debugging
      console.log('Homepage Category Click (Level 2):', {
        categoryId,
        categoryName: category.name,
        level: category.level,
        hasLevel3Categories,
        parentCategory: category.parentCategory
      });

      if (hasLevel3Categories) {
        navigate(`/category/${categoryId}`);
      } else {
        navigate(`/category/coming-soon/${categoryId}`);
      }
      return;
    }

    // For level 1 categories, check for level 2 subcategories
    const hasSubcategories = level2Categories.some(cat => cat.parentCategory?._id === categoryId);

    // Log for debugging
    console.log('Homepage Category Click (Level 1):', {
      categoryId,
      categoryName: category.name,
      level: category.level,
      hasSubcategories
    });

    // Navigate based on subcategories
    if (hasSubcategories) {
      navigate(`/category/${categoryId}`);
    } else {
      navigate(`/category/coming-soon/${categoryId}`);
    }
  };

  const getSubcategories = (parentId) => {
    return level2Categories.filter(cat => cat.parentCategory?._id === parentId);
  };

  return (
    <div>
      {/* Hero Slider Section */}
      <section className="slider-area position-relative">
        <HomeCarousel />
      </section>

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section style={{ padding: '0' }}>
          <Container maxWidth={false} sx={{ px: { xs: 0, sm: 0, md: 0 } }}>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                ml: 4,
                mb: 2,
                fontWeight: 'bold',
                color: '#000',
                fontSize: { xs: '1.5rem', sm: '2rem' },
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              New Arrival
            </Typography>
            <Box sx={{ 
              position: 'relative',
              overflow: 'hidden',
              '& .splide': {
                padding: '0',
                overflow: 'hidden'
              },
              '& .splide__slide': {
                height: 'auto',
                padding: '0',
                margin: '0',
                overflow: 'hidden'
              },
              '& .splide__list': {
                gap: '0',
                margin: '0',
                padding: '0',
                overflow: 'visible'
              },
              '& .splide__track': {
                overflow: 'hidden',
                padding: '0'
              }
            }}>
              <Splide
                options={{
                  type: 'loop',
                  perPage: 3,
                  perMove: 1,
                  gap: '1.5rem',
                  padding: { left: '8rem', right: '8rem' },
                  arrows: true,
                  pagination: false,
                  autoplay: true,
                  interval: 3000,
                  height: 'auto',
                  focus: false,
                  drag: true,
                  speed: 1000,
                  breakpoints: {
                    1200: {
                      perPage: 3,
                      gap: '1.5rem',
                      padding: { left: '8rem', right: '8rem' }
                    },
                    768: {
                      perPage: 2,
                      gap: '1rem',
                      padding: { left: '4rem', right: '4rem' }
                    },
                    480: {
                      perPage: 1,
                      gap: '1rem',
                      padding: { left: '2rem', right: '2rem' }
                    }
                  }
                }}
              >
                {newArrivals.slice(0, 6).map((product) => (
                  <SplideSlide key={product._id}>
                    <Box 
                      sx={{ 
                        p: 0,
                        m: 0,
                        height: '100%',
                        '& > *': { margin: 0, padding: 0 }
                      }}
                    >
                      <ProductWrapper>
                        <HomeProductCard product={product} />
                      </ProductWrapper>
                    </Box>
                  </SplideSlide>
                ))}
              </Splide>
            </Box>
          </Container>
        </section>
      )}

      {/* Categories Section */}
      <section style={{ width: '100vw', margin: 0, padding: 0 }}>
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
                      onClick={() => navigate(`/category/coming-soon/${category._id}`)}
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
            <Box key={category._id} sx={{ width: '100%', mb: { xs: 0.5, md: 1 } }}>
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
                      >
                        <Box
                          component="img"
                          src={`${process.env.REACT_APP_API_URL}${subCategory.imageUrl}`}
                          alt={subCategory.name}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'all 0.6s ease',
                          }}
                        />
                        <Box
                          className="category-overlay"
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            padding: { xs: '2rem', sm: '3rem', md: '4rem' },
                            transition: 'all 0.3s ease',
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
                                  cat.level === 3 && cat.parentCategory?._id === subCategory._id
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
                    >
                      <Box
                        component="img"
                        src={`${process.env.REACT_APP_API_URL}${category.imageUrl}`}
                        alt={category.name}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'all 0.6s ease',
                        }}
                      />
                      <Box
                        className="category-overlay"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          padding: { xs: '2rem', sm: '3rem', md: '4rem' },
                          transition: 'all 0.3s ease',
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
                          {category.name}
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
