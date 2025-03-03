import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  styled,
} from '@mui/material';
import { getImageUrl } from '../../../config/api';

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

const HomeProductCard = ({ product }) => {
  const handleClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const url = `/product/${product._id}`;
    window.location.assign(url);
  };

  // Get the first two images from the first color
  const primaryImage = product.colors?.[0]?.images?.[0];
  const secondaryImage = product.colors?.[0]?.images?.[1] || primaryImage; // Fallback to primary if no second image

  return (
    <ProductCard 
      onClick={handleClick}
      component="a"
      href={`/product/${product._id}`}
      sx={{ 
        textDecoration: 'none',
        cursor: 'pointer',
        zIndex: 10
      }}
    >
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
  );
};

export default HomeProductCard;
