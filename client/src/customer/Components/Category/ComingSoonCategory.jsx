import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Container, CircularProgress } from '@mui/material';
import { getCategories } from '../../../Redux/Admin/Category/Action';
import { motion } from 'framer-motion';

const ComingSoonCategory = () => {
  const { categoryId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const categoryState = useSelector((state) => state.category);
  const { categories, loading } = categoryState;

  useEffect(() => {
    if (!categories?.length) {
      dispatch(getCategories());
    }
  }, [dispatch, categories]);

  useEffect(() => {
    if (categories?.length && !loading) {
      const category = categories.find(cat => cat._id === categoryId);
      if (!category) {
        console.log('Category not found, redirecting to home');
        navigate('/');
        return;
      }

      // Check if this is a level 2 category
      const isLevel2 = category.level === 2;
      
      if (isLevel2) {
        // Check for level 3 subcategories
        const hasLevel3Categories = categories.some(cat => 
          cat.level === 3 && cat.parentCategory?._id === categoryId
        );

        // Log for debugging
        console.log('ComingSoonCategory Check (Level 2):', {
          categoryId,
          categoryName: category.name,
          level: category.level,
          hasLevel3Categories,
          parentCategory: category.parentCategory
        });

        if (hasLevel3Categories) {
          console.log('Level 2 category has level 3 subcategories, redirecting to category page');
          navigate(`/category/${categoryId}`);
          return;
        }
      } else {
        // For level 1 categories, check for level 2 subcategories
        const hasLevel2Categories = categories
          .filter(cat => cat.level === 2)
          .some(cat => cat.parentCategory?._id === categoryId);

        // Log for debugging
        console.log('ComingSoonCategory Check (Level 1):', {
          categoryId,
          categoryName: category.name,
          level: category.level,
          hasLevel2Categories
        });

        if (hasLevel2Categories) {
          console.log('Level 1 category has subcategories, redirecting to category page');
          navigate(`/category/${categoryId}`);
          return;
        }
      }

      setIsLoading(false);
    }
  }, [categories, categoryId, navigate, loading]);

  const category = categories?.find(cat => cat._id === categoryId);

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)'
        }}
      >
        <CircularProgress sx={{ color: '#FFD700' }} />
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0
      }}
    >
      {/* Animated Background Elements */}
      <Box
        component={motion.div}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '150%',
          height: '150%',
          background: 'radial-gradient(circle at center, #FFD700 0%, transparent 60%)',
          opacity: 0.3,
          filter: 'blur(60px)',
          zIndex: 1
        }}
      />

      {/* Content */}
      <Container 
        maxWidth="lg"
        component={motion.div}
        sx={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          px: { xs: 2, sm: 4, md: 6 }
        }}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Typography
            variant="h1"
            sx={{
              color: 'white',
              fontSize: { xs: '3rem', sm: '4rem', md: '6rem', lg: '7rem' },
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              marginBottom: { xs: 3, md: 4 },
              textShadow: '2px 2px 4px rgba(0,0,0,0.3), 0 0 40px rgba(255,215,0,0.3)',
              lineHeight: 1.1
            }}
          >
            {category?.name || 'Category'}
          </Typography>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Typography
            variant="h2"
            sx={{
              color: '#FFD700',
              fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: { xs: 4, md: 5 },
              textShadow: '2px 2px 4px rgba(0,0,0,0.3), 0 0 20px rgba(255,215,0,0.5)'
            }}
          >
            Coming Soon
          </Typography>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
              fontWeight: 400,
              maxWidth: '800px',
              margin: '0 auto',
              marginBottom: { xs: 6, md: 8 },
              lineHeight: 1.8,
              letterSpacing: '0.05em',
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            We&apos;re crafting something extraordinary just for you. Our team is working tirelessly to bring you an exceptional collection that will redefine your style. Stay connected for an unveiling that will be worth the wait.
          </Typography>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Button
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            sx={{
              backgroundColor: '#FFD700',
              color: '#000',
              padding: { xs: '1.2rem 2.5rem', md: '1.5rem 4rem' },
              fontSize: { xs: '1rem', md: '1.2rem' },
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              borderRadius: '0',
              boxShadow: '0 4px 20px rgba(255,215,0,0.3)',
              '&:hover': {
                backgroundColor: '#fff',
                boxShadow: '0 6px 25px rgba(255,255,255,0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Return to Homepage
          </Button>
        </motion.div>
      </Container>

      {/* Decorative Elements */}
      <Box
        component={motion.div}
        animate={{
          rotate: [0, 360]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        sx={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '200px',
          height: '200px',
          border: '2px solid rgba(255,215,0,0.1)',
          borderRadius: '50%',
          zIndex: 1
        }}
      />
      <Box
        component={motion.div}
        animate={{
          rotate: [360, 0]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: '10%',
          width: '150px',
          height: '150px',
          border: '2px solid rgba(255,215,0,0.1)',
          borderRadius: '50%',
          zIndex: 1
        }}
      />
    </Box>
  );
};

export default ComingSoonCategory; 