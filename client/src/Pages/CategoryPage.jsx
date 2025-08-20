import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { getCategories } from "../Redux/Admin/Category/Action";
import { selectCategories, selectCategoryLoading, selectCategoryError } from "../Redux/Admin/Category/Selectors";
import { Box, Grid, Container, Typography, CircularProgress, Alert, styled, Breadcrumbs, Link } from "@mui/material";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { motion } from "framer-motion";
import { getImageUrl } from "../config/api";

const CategoryCard = styled(motion.div)({
  width: '100%',
  backgroundColor: '#fff',
  position: 'relative',
  height: '600px',
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
  },
  '@media (max-width: 768px)': {
    height: '300px',
  }
});

const ImageContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'inherit',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    transition: 'transform 0.3s ease',
  },
  '&:hover::before': {
    transform: 'scale(1.1)',
  },
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center center',
    display: 'block',
    margin: '0 auto',
  }
});

const CategoryInfo = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  color: 'white',
  textAlign: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  opacity: 1,
  transition: 'opacity 0.3s ease',
  '@media (max-width: 768px)': {
    opacity: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    paddingBottom: '2rem',
  }
});

const CategoryTitle = styled(Typography)({
  fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
  fontWeight: 700,
  marginBottom: '0.5rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
  color: 'white',
  '@media (max-width: 768px)': {
    fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
    marginBottom: '0.25rem',
  }
});

const ViewCollection = styled(Typography)({
  fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)',
  fontWeight: 500,
  textShadow: '1px 1px 6px rgba(0,0,0,0.6)',
  color: 'white',
  '@media (max-width: 768px)': {
    fontSize: 'clamp(0.8rem, 1.2vw, 1rem)',
  }
});

const CategoryDescription = styled(Typography)({
  fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)',
  fontWeight: 400,
  maxWidth: '80%',
  textShadow: '1px 1px 4px rgba(0,0,0,0.5)',
  '@media (max-width: 768px)': {
    fontSize: 'clamp(0.8rem, 1.2vw, 1rem)',
    maxWidth: '90%',
  }
});

const BannerOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: '1.5rem',
  padding: '0 1rem',
  backgroundColor: 'transparent',
  '@media (max-width: 768px)': {
    gap: '1rem',
    padding: '0 0.5rem',
    backgroundColor: 'transparent',
  }
});

const CategoryPage = () => {
  const { param: categoryParam } = useParams(); // Unified parameter for slug or ID
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const categories = useSelector(selectCategories) || [];
  const categoryLoading = useSelector(selectCategoryLoading) || false;
  const categoryError = useSelector(selectCategoryError) || null;

  const currentCategory = useMemo(() => {
    const key = categoryParam;
    if (!key) return null;
    // Match by slug first, then by id
    return categories?.find(cat => cat.slug === key) || categories?.find(cat => cat._id === key) || null;
  }, [categories, categoryParam]);

  const subcategories = useMemo(() => {
    if (!categories || !currentCategory) return [];
    
    // Log for debugging
    console.log('Category data:', {
      currentCategory,
      allCategories: categories
    });
    
    if (currentCategory.level === 1) {
      const level2Cats = categories.filter(cat => 
        cat.parentCategory && cat.parentCategory._id === currentCategory._id
      );
      return level2Cats;
    }
    
    if (currentCategory.level === 2) {
      const level3Cats = categories.filter(cat => 
        cat.parentCategory && cat.parentCategory._id === currentCategory._id
      );
      return level3Cats;
    }
    
    return [];
  }, [categories, currentCategory]);

  const parentCategory = useMemo(() => {
    if (!currentCategory?.parentCategory?._id) return null;
    return categories?.find(cat => cat._id === currentCategory.parentCategory._id);
  }, [categories, currentCategory]);

  // Canonicalize URL to slug if user visited with an ID
  useEffect(() => {
    if (currentCategory && categoryParam && currentCategory.slug && categoryParam === currentCategory._id) {
      navigate(`/category/${currentCategory.slug}`, { replace: true });
    }
  }, [currentCategory, categoryParam, navigate]);

  useEffect(() => {
    if (!categories) {
      dispatch(getCategories());
    }
  }, [dispatch, categories]);

  const handleSubcategoryClick = (subcategory) => {
    const clickedCategory = typeof subcategory === 'string' ? categories.find(cat => cat._id === subcategory) : subcategory;
    const subcategoryId = clickedCategory?._id || subcategory; // Ensure we have an ID for the API call
    
    if (clickedCategory.level === 3 || !categories.some(cat => cat.parentCategory?._id === subcategoryId)) { // Check for actual children
              navigate(`/${clickedCategory.slug || subcategoryId}&page=1`);
    } else {
      navigate(`/category/${clickedCategory.slug || subcategoryId}`);
    }
  };

  const handleImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/400x600';
    
    // Log for debugging
    const processedUrl = getImageUrl(imageUrl);
    
    return processedUrl;
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
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Home
            </Link>
            {parentCategory && (
              <Link
                color="inherit"
                onClick={() => navigate(`/category/${parentCategory.slug || parentCategory._id}`)}
                sx={{ 
                  textDecoration: 'none',
                  color: 'text.primary',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                {parentCategory.name}
              </Link>
            )}
            <Typography color="text.primary">{currentCategory.name}</Typography>
          </Breadcrumbs>
        </Box>
      </Box>

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
          src={handleImageUrl(currentCategory.imageUrl)}
          alt={currentCategory.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
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
                fontSize: {
                  xs: 'clamp(1.5rem, 6vw, 2.5rem)',
                  sm: 'clamp(2rem, 8vw, 3rem)',
                  md: 'clamp(2.5rem, 10vw, 4rem)',
                  lg: '5rem'
                },
                letterSpacing: { xs: '2px', sm: '3px', md: '4px', lg: '6px' },
                marginBottom: { xs: 0.5, sm: 1, md: 1.5 },
                px: { xs: 1, sm: 2 },
                lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
                textShadow: '2px 2px 10px rgba(0,0,0,0.8)'
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
                letterSpacing: { xs: '2px', sm: '3px', md: '4px' },
                fontSize: {
                  xs: 'clamp(0.7rem, 2vw, 0.9rem)',
                  sm: 'clamp(0.8rem, 2.5vw, 1.1rem)',
                  md: 'clamp(0.9rem, 3vw, 1.4rem)'
                },
                fontWeight: 300,
                px: { xs: 1, sm: 2 },
                textShadow: '2px 2px 8px rgba(0,0,0,0.7)',
              }}
            >
              Discover Our Collection
            </Typography>
          </motion.div>
        </BannerOverlay>
      </Box>

      {subcategories.length > 0 && (
        <Box sx={{ width: '100%', py: 2 }}>
          <Grid container spacing={2}>
            {subcategories.map((subcat, index) => (
              <Grid item xs={12} sm={6} key={subcat._id} sx={{ height: '100%' }}>
                <CategoryCard
                  onClick={() => handleSubcategoryClick(subcat._id)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <ImageContainer
                    sx={{
                      backgroundImage: `url(${handleImageUrl(subcat.imageUrl)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      height: '100%',
                      width: '100%'
                    }}
                  >
                    <CategoryInfo>
                      <CategoryTitle>
                        {subcat.name}
                      </CategoryTitle>
                      <ViewCollection sx={{ mt: 0.5 }}>
                        {subcat.level === 3 ? 'Shop Now' : 'View Collection'}
                      </ViewCollection>
                    </CategoryInfo>
                  </ImageContainer>
                </CategoryCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default CategoryPage; 