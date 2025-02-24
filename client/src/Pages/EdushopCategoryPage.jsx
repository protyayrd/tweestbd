import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getEdushopCategories } from '../Redux/Admin/Edushop/Action';
import { Box, Typography, Container } from '@mui/material';
import { motion } from 'framer-motion';
import './Homepage.css';

const EdushopCategoryPage = () => {
  const { categoryId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories } = useSelector((state) => state.edushop);

  useEffect(() => {
    dispatch(getEdushopCategories());
  }, [dispatch]);

  // Find the parent category
  const parentCategory = categories.find(cat => cat._id === categoryId);
  
  // Find child categories where parentCategory._id matches the categoryId
  const childCategories = categories.filter(cat => cat.parentCategory?._id === categoryId);

  if (!parentCategory) {
    return null;
  }

  return (
    <div className="edushop-category-page">
      {/* Hero Section */}
      <div 
        className="hero-section"
        style={{ 
          backgroundImage: parentCategory.imageUrl ? 
            `url(${process.env.REACT_APP_API_URL}${parentCategory.imageUrl})` 
            : 'none'
        }}
      >
        <div className="hero-overlay" />
        <div className="hero-content">
          <Typography 
            variant="h1" 
            component="h1"
            className="hero-title"
          >
            {parentCategory.name}
          </Typography>
          <Typography 
            variant="h6"
            className="hero-subtitle"
          >
            Discover Our Collection
          </Typography>
        </div>
      </div>

      {/* Level 2 Categories */}
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <div className="category-grid">
          {childCategories.map((category) => (
            <motion.div
              key={category._id}
              className="category-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => navigate(`/category/${category._id}`)}
            >
              <div 
                className="category-image"
                style={{ 
                  backgroundImage: category.imageUrl ? 
                    `url(${process.env.REACT_APP_API_URL}${category.imageUrl})` 
                    : 'none'
                }}
              >
                <div className="category-overlay">
                  <div className="category-content">
                    <Typography 
                      variant="h3" 
                      className="category-title"
                    >
                      {category.name}
                    </Typography>
                    <div className="category-divider"></div>
                    <Typography 
                      variant="subtitle1"
                      className="category-action"
                    >
                      VIEW COLLECTION
                    </Typography>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default EdushopCategoryPage; 