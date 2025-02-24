import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCategories } from "../Redux/Admin/Category/Action";
import { findProducts } from "../Redux/Customers/Product/Action";
import { getEdushopCategories } from '../Redux/Admin/Edushop/Action';
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
import { selectEdushopCategories } from '../Redux/Admin/Edushop/Selectors';

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
  const edushopCategories = useSelector(selectEdushopCategories);

  // Get level 1 and 2 categories
  const level1Categories = categories?.filter(cat => cat.level === 1) || [];
  const level2Categories = categories?.filter(cat => cat.level === 2) || [];

  useEffect(() => {
    dispatch(getCategories());
    dispatch(getEdushopCategories());
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
    navigate(`/category/${categoryId}`);
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
                  gap: '0.5rem',
                  padding: { left: '8rem', right: '8rem' },
                  arrows: true,
                  pagination: false,
                  autoplay: true,
                  interval: 3000,
                  height: 'auto',
                  focus: 'center',
                  trimSpace: true,
                  updateOnMove: true,
                  snap: true,
                  speed: 1000,
                  breakpoints: {
                    1200: {
                      perPage: 3,
                      gap: '0.5rem',
                      padding: { left: '8rem', right: '8rem' }
                    },
                    768: {
                      perPage: 1,
                      gap: '0.5rem',
                      padding: { left: '4rem', right: '4rem' },
                      focus: 'center'
                    },
                    480: {
                      perPage: 1,
                      gap: '0.5rem',
                      padding: { left: '2rem', right: '2rem' },
                      focus: 'center'
                    }
                  }
                }}
              >
                {newArrivals.slice(0, 6).map((product) => (
                  <SplideSlide key={product._id}>
                    <Box sx={{ 
                      p: 0,
                      m: 0,
                      height: '100%',
                      '& > *': { margin: 0, padding: 0 }
                    }}>
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

      {/* Edushop Section */}
      {edushopCategories.length > 0 && (
        <Box 
          sx={{ 
            width: '100vw',
            position: 'relative',
            left: '50%',
            right: '50%',
            marginLeft: '-50vw',
            marginRight: '-50vw',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            minHeight: '100vh',
            width: '100%',
            margin: 0,
            padding: 0
          }}>
            {/* Image Section */}
            <Box sx={{ 
              width: '100%',
              height: { xs: '70vh', md: '100vh' },
              position: 'relative',
              overflow: 'hidden',
              flex: { md: 7 },
              margin: 0,
              padding: 0
            }}>
              {edushopCategories
                .filter(category => category.level === 1)
                .map((category) => (
                  <Box
                    key={category._id}
                    onClick={() => navigate(`/edushop/${category._id}`)}
                    sx={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      cursor: 'pointer',
                      margin: 0,
                      padding: 0
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
                        transition: 'transform 0.6s ease',
                        display: 'block',
                        margin: 0,
                        padding: 0,
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                  </Box>
                ))}
            </Box>

            {/* Logo and Button Section */}
            <Box sx={{ 
              width: '100%',
              height: { xs: '30vh', md: '100vh' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000',
              flex: { md: 3 },
              margin: 0,
              padding: { xs: '1rem', md: '2rem' }
            }}>
              {edushopCategories
                .filter(category => category.level === 1)
                .map((category) => (
                  <Box
                    key={category._id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: { xs: 3, md: 6 },
                      width: '100%',
                      maxWidth: '400px',
                      margin: 0
                    }}
                  >
                    {/* Logo Section */}
                    <Box sx={{ 
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: 0
                    }}>
                      <Box
                        component="img"
                        src={`${process.env.REACT_APP_API_URL}${category.logoUrl}`}
                        alt={`${category.name} logo`}
                        sx={{
                          width: '100%',
                          height: 'auto',
                          maxWidth: { xs: '200px', md: '280px' },
                          objectFit: 'contain',
                          filter: 'brightness(0) invert(1)',
                          display: 'block',
                          margin: 0
                        }}
                      />
                    </Box>

                    {/* Button Section */}
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/edushop/${category._id}`)}
                      sx={{
                        backgroundColor: '#fff',
                        color: '#000',
                        padding: { xs: '12px 40px', md: '15px 50px' },
                        borderRadius: '0',
                        textTransform: 'uppercase',
                        fontSize: { xs: '0.8rem', md: '0.9rem' },
                        fontWeight: 500,
                        letterSpacing: '0.2em',
                        transition: 'all 0.3s ease',
                        marginTop: { xs: 2, md: 3 },
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Shop Now
                    </Button>
                  </Box>
                ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* Categories Section */}
      <section>
        {level1Categories.map((category) => (
          <div key={category._id}>
            <div className="flex-container">
              {getSubcategories(category._id).map((subCategory) => (
                <div key={subCategory._id} className="flex-item">
                  <div 
                    className="inner-image" 
                    style={{ 
                      backgroundImage: subCategory.imageUrl ? 
                        `url(${process.env.REACT_APP_API_URL}${subCategory.imageUrl.startsWith('/') ? '' : '/'}${subCategory.imageUrl})` 
                        : 'none',
                      backgroundPosition: 'center top',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleCategoryClick(subCategory._id)}
                  >
                    <Typography 
                      variant="h4" 
                      className="category-names"
                      sx={{
                        color: 'white',
                        textTransform: 'uppercase',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                      }}
                    >
                      {subCategory.name}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Homepage;
