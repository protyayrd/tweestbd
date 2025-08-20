import React, { useState, memo, useMemo, useCallback } from 'react';
import "./ProductCard.css";
import { useLocation, useNavigate } from "react-router-dom";
import { getImageUrl } from '../../../../config/api';
import { Box, Skeleton } from '@mui/material';

const ProductCard = ({ product }) => {
  const { title, brand, price, discountedPrice, color, discountPersent } = product;
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleNavigate = useCallback(() => {
  if (product?.slug) {
    navigate(`/product/${product.slug}`);
  } else {
    navigate(`/product/${product._id}`);
  }
}, [product?.slug, product?._id, navigate]);

  // Memoize image URLs to prevent recalculation on every render
  const { primaryImage, secondaryImage } = useMemo(() => {
    const primary = product.colors?.[0]?.images?.[0];
    const secondary = product.colors?.[0]?.images?.[1] || primary;
    return { primaryImage: primary, secondaryImage: secondary };
  }, [product.colors]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  return (
    <div onClick={handleNavigate} className='productCard w-[15rem] border m-3 transition-all cursor-pointer'>
      <div className='h-[20rem] relative overflow-hidden'>
        {!imageLoaded && (
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
        <img 
          className='primary-image h-full w-full object-cover object-left-top absolute top-0 left-0 transition-opacity duration-300'
          src={primaryImage ? getImageUrl(primaryImage) : 'https://via.placeholder.com/400x600'}
          alt={title}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          width="400"
          height="600"
          onLoad={handleImageLoad}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x600';
          }}
          style={{ 
            opacity: imageLoaded ? 1 : 0, 
            zIndex: 2,
            objectFit: 'cover',
            objectPosition: 'center center' 
          }}
        />
        <img 
          className='secondary-image h-full w-full object-cover object-left-top absolute top-0 left-0 transition-opacity duration-300 opacity-0'
          src={secondaryImage ? getImageUrl(secondaryImage) : 'https://via.placeholder.com/400x600'}
          alt={`${title} - hover`}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          width="400"
          height="600"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x600';
          }}
          style={{ 
            zIndex: 2,
            objectFit: 'cover',
            objectPosition: 'center center'  
          }}
        />
      </div>
      <div className='textPart bg-white p-3'>
        {!imageLoaded ? (
          <div>
            <Skeleton 
              variant="text" 
              width="40%" 
              height={24} 
              sx={{ backgroundColor: '#69af5a', opacity: 0.2 }}
            />
            <Skeleton 
              variant="text" 
              width="70%" 
              height={24} 
              sx={{ backgroundColor: '#69af5a', opacity: 0.2 }}
            />
            <Skeleton 
              variant="text" 
              width="30%" 
              height={24} 
              sx={{ backgroundColor: '#69af5a', opacity: 0.2 }}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Skeleton 
                variant="text" 
                width="30%" 
                height={24} 
                sx={{ backgroundColor: '#69af5a', opacity: 0.2 }}
              />
              <Skeleton 
                variant="text" 
                width="20%" 
                height={24} 
                sx={{ backgroundColor: '#69af5a', opacity: 0.2 }}
              />
              <Skeleton 
                variant="text" 
                width="25%" 
                height={24} 
                sx={{ backgroundColor: '#69af5a', opacity: 0.2 }}
              />
            </Box>
          </div>
        ) : (
          <>
            <div>
              <p className='font-bold opacity-60'>{brand}</p>
              <p>{title}</p>
              <p className='font-semibold opacity-50'>{color}</p>
            </div>
            
            <div className='flex space-x-2 items-center'>
              <p className='font-semibold'>Tk. {discountedPrice}</p>
              <p className='opacity-50 line-through'>Tk. {price}</p>
              <p className='text-green-600 font-semibold'>- {discountPersent}%</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default memo(ProductCard);
