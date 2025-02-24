import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { getCategories } from "../Redux/Admin/Category/Action";
import { selectCategories, selectCategoryLoading, selectCategoryError } from "../Redux/Admin/Category/Selectors";
import { Box, Grid, Container, Typography, CircularProgress, Alert, styled, Breadcrumbs, Link } from "@mui/material";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { motion } from "framer-motion";

const CategoryCard = styled(motion.div)(({ theme }) => ({
  width: '100%',
  backgroundColor: '#fff',
  position: 'relative',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  cursor: 'pointer',
  borderRadius: 0,
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
  }
}));

const ImageContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  paddingTop: '66.67%', // 3:2 aspect ratio
  position: 'relative',
  overflow: 'hidden',
  margin: 0,
  background: '#f5f5f5',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)',
    opacity: 0.85,
    transition: 'opacity 0.3s ease',
  },
  '&:hover': {
    transform: 'scale(1.05)',
    '&::after': {
      opacity: 0.95,
    }
  }
}));

const CategoryInfo = styled(Box)(({ theme }) => ({
  padding: '1.5rem',
  textAlign: 'center',
  position: 'absolute',
  bottom: '50%',
  left: 0,
  right: 0,
  transform: 'translateY(50%)',
  zIndex: 2,
  transition: 'transform 0.3s ease',
  '& .category-title': {
    fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
    fontFamily: "'Playfair Display', serif",
    fontWeight: 700,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    marginBottom: '1rem',
    lineHeight: 1,
  },
  '& .view-collection': {
    fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    fontWeight: 400,
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    position: 'relative',
    display: 'inline-block',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
    transition: 'all 0.3s ease',
    '&:hover': {
      letterSpacing: '3px',
      textUnderlineOffset: '5px'
    }
  }
}));

const BannerOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(45deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: '1.5rem',
  padding: '0 1rem',
}));

const CategoryPage = () => {
  const { categoryId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const categories = useSelector(selectCategories);
  const categoryLoading = useSelector(selectCategoryLoading);
  const categoryError = useSelector(selectCategoryError);

  const currentCategory = useMemo(() => {
    return categories?.find(cat => cat._id === categoryId);
  }, [categories, categoryId]);

  const subcategories = useMemo(() => {
    if (!categories || !currentCategory) return [];
    return categories.filter(cat => 
      cat.parentCategory && cat.parentCategory._id === categoryId
    );
  }, [categories, categoryId, currentCategory]);

  useEffect(() => {
    if (!categories) {
      dispatch(getCategories());
    }
  }, [dispatch, categories]);

  const handleSubcategoryClick = (subcategoryId) => {
    navigate(`/products?category=${subcategoryId}&page=1`);
  };

  const handleAllProductsClick = () => {
    try {
      // Create a query object for better handling
      const queryParams = new URLSearchParams();
      
      // Add the main category
      queryParams.append('category', categoryId);
      
      // Add subcategories if they exist
      if (subcategories.length > 0) {
        subcategories.forEach(sub => {
          queryParams.append('subcategories', sub._id);
        });
      }
      
      // Add page parameter
      queryParams.append('page', '1');
      
      // Navigate with the constructed query string
      navigate(`/products?${queryParams.toString()}`);
    } catch (error) {
      console.error('Navigation error:', error);
      // You might want to show an error message to the user here
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/400x600';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${process.env.REACT_APP_API_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  if (categoryLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (categoryError) {
    return (
      <Box sx={{ padding: '2rem' }}>
        <Alert severity="error">
          {categoryError}
        </Alert>
      </Box>
    );
  }

  if (!currentCategory) {
    return (
      <Alert severity="warning" sx={{ margin: '2rem' }}>
        Category not found. The category may have been deleted or moved.
      </Alert>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      {/* Breadcrumb Navigation */}
      <Box sx={{ borderBottom: '1px solid rgba(0,0,0,0.1)', mb: 0, backgroundColor: '#fff' }}>
        <Box sx={{ py: 2, px: { xs: 2, sm: 3, md: 4 } }}>
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
          >
            <Link 
              color="inherit" 
              href="/"
              sx={{ 
                textDecoration: 'none',
                color: 'text.primary',
                '&:hover': { 
                  textDecoration: 'underline',
                }
              }}
            >
              Home
            </Link>
            <Typography color="text.primary">{currentCategory.name}</Typography>
          </Breadcrumbs>
        </Box>
      </Box>

      {/* Category Banner */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          marginBottom: 4
        }}
      >
        <Box
          component="img"
          src={getImageUrl(currentCategory.imageUrl)}
          alt={currentCategory.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            filter: 'brightness(0.85)',
          }}
        />
        <BannerOverlay>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h1"
              component="h1"
              sx={{
                color: 'white',
                textAlign: 'center',
                textTransform: 'uppercase',
                fontWeight: 900,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                fontSize: { xs: '2rem', sm: '3rem', md: '4rem', lg: '5rem' },
                letterSpacing: { xs: '3px', sm: '4px', md: '6px' },
                marginBottom: { xs: 1, sm: 1.5, md: 2 },
                px: { xs: 1, sm: 2 }
              }}
            >
              {currentCategory.name}
            </Typography>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Typography
              variant="h5"
              sx={{
                color: 'white',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: { xs: '4px', sm: '6px', md: '8px' },
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                fontSize: { xs: '0.875rem', sm: '1.1rem', md: '1.4rem' },
                fontWeight: 300,
                px: { xs: 1, sm: 2 }
              }}
            >
              Discover Our Collection
            </Typography>
          </motion.div>
        </BannerOverlay>
      </Box>

      {/* Subcategories Section */}
      {subcategories.length > 0 && (
        <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, mb: 8 }}>
          <Grid container spacing={2}>
            {/* View All Products Card */}
            <Grid item xs={6} md={4}>
              <CategoryCard
                onClick={handleAllProductsClick}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <ImageContainer
                  sx={{
                    backgroundImage: `url(${getImageUrl(currentCategory.imageUrl)})`,
                  }}
                >
                  <CategoryInfo>
                    <Typography className="category-title">
                      All Products
                    </Typography>
                    <Typography className="view-collection">
                      View Collection
                    </Typography>
                  </CategoryInfo>
                </ImageContainer>
              </CategoryCard>
            </Grid>

            {/* Subcategories */}
            {subcategories.map((subcat, index) => (
              <Grid item xs={6} md={4} key={subcat._id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <CategoryCard
                    onClick={() => handleSubcategoryClick(subcat._id)}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ImageContainer
                      sx={{
                        backgroundImage: `url(${getImageUrl(subcat.imageUrl)})`,
                      }}
                    >
                      <CategoryInfo>
                        <Typography className="category-title">
                          {subcat.name}
                        </Typography>
                        <Typography className="view-collection">
                          View Collection
                        </Typography>
                      </CategoryInfo>
                    </ImageContainer>
                  </CategoryCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default CategoryPage; 