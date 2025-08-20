import React, { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  styled,
  Skeleton,
  Chip
} from '@mui/material';
import { getImageUrl } from '../../../config/api';

const ProductImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  position: 'absolute',
  top: 0,
  left: 0,
  transition: 'opacity 0.3s ease-in-out',
  display: 'block',
});

const ImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  paddingTop: '150%',
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

const NewChip = styled(Chip)({
  position: 'absolute',
  top: '10px',
  left: '10px',
  zIndex: 10,
  backgroundColor: '#69af5a',
  color: '#fff',
  fontWeight: 600,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  '& .MuiChip-label': {
    padding: '0 8px',
  }
});

const HomeProductCard = ({ product, isNewArrival }) => {
  const [loading, setLoading] = useState(true);
  const imageObserverRef = useRef(null);
  
  // Memoize image URLs to prevent unnecessary re-renders
  const primaryImageUrl = useMemo(() => 
    product.colors?.[0]?.images?.[0] 
      ? getImageUrl(product.colors[0].images[0]) 
      : 'https://via.placeholder.com/400x600'
  , [product.colors]);
  
  const secondaryImageUrl = useMemo(() => 
    product.colors?.[0]?.images?.[1] 
      ? getImageUrl(product.colors[0].images[1]) 
      : primaryImageUrl || 'https://via.placeholder.com/400x600'
  , [product.colors, primaryImageUrl]);

  // Use IntersectionObserver for lazy loading
  useEffect(() => {
    const options = {
      root: null, // Use the viewport
      rootMargin: '100px', // Load images 100px before they come into view
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target;
          // Set the actual src from data-src
          if (image.dataset.src) {
            image.src = image.dataset.src;
          }
          // Stop observing once loaded
          observer.unobserve(image);
        }
      });
    }, options);
    
    imageObserverRef.current = observer;
    
    return () => {
      if (imageObserverRef.current) {
        imageObserverRef.current.disconnect();
      }
    };
  }, []);

  const handleClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const url = product.slug ? `/product/${product.slug}` : `/product/${product._id}`;
    window.location.assign(url);
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/400x600';
    setLoading(false);
  };
  
  const handleImageRef = (imageRef) => {
    if (imageRef && imageObserverRef.current) {
      imageObserverRef.current.observe(imageRef);
    }
  };

  return (
    <ProductCard 
      onClick={handleClick}
      component="a"
              href={product.slug ? `/product/${product.slug}` : `/product/${product._id}`}
      sx={{ 
        textDecoration: 'none',
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      <ImageContainer>
        {loading && (
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height="100%" 
            animation="wave"
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              backgroundColor: '#69af5a',
              opacity: 0.2,
              zIndex: 1
            }}
          />
        )}
        {isNewArrival && (
          <NewChip 
            label="NEW" 
            size="small"
          />
        )}
        <ProductImage
          className="primary-image"
          ref={handleImageRef}
          src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
          data-src={primaryImageUrl}
          alt={product.title}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          style={{ 
            opacity: loading ? 0 : 1,
            zIndex: 2,
            objectFit: 'cover'
          }}
        />
        <ProductImage
          className="secondary-image"
          ref={handleImageRef}
          src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
          data-src={secondaryImageUrl}
          alt={`${product.title} - hover`}
          onError={handleImageError}
          loading="lazy"
          style={{ 
            opacity: 0,
            zIndex: 2,
            objectFit: 'cover'
          }}
        />
      </ImageContainer>
      
      <CardContent>
        {loading ? (
          <>
            <Skeleton 
              variant="text" 
              width="70%" 
              height={24} 
              sx={{ backgroundColor: '#69af5a', opacity: 0.2 }}
            />
            <Box sx={{ mt: 1 }}>
              <Skeleton 
                variant="text" 
                width="40%" 
                height={21} 
                sx={{ backgroundColor: '#69af5a', opacity: 0.2 }}
              />
            </Box>
          </>
        ) : (
          <>
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
          </>
        )}
      </CardContent>
    </ProductCard>
  );
};

export default memo(HomeProductCard);
