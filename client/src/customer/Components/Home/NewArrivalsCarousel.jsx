import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Snackbar, Alert } from '@mui/material';
import ProductCard from '../Product/ProductCard/ProductCard';

// Swiper and styles are isolated here so they load in an async chunk
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper';

const NewArrivalsCarousel = ({ products = [], getCategoryNameForProduct, inView = true, onSwiperReady }) => {
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (swiperInstance && swiperInstance.autoplay) {
      if (inView) {
        swiperInstance.autoplay.start();
      } else {
        swiperInstance.autoplay.stop();
      }
    }
  }, [inView, swiperInstance]);

  const slides = useMemo(() => products, [products]);

  const handleAddSuccess = () => {
    setSnackbar({ open: true, message: 'Added to cart! View Cart', severity: 'success' });
  };
  const handleAddError = (message) => {
    setSnackbar({ open: true, message: message || 'Failed to add to cart', severity: 'error' });
  };

  return (
    <Box sx={{ 
      position: 'relative',
      overflow: 'hidden',
      py: 1,
      '& .swiper': {
        width: '100%',
        height: 'auto'
      },
      '& .swiper-slide': {
        height: 'auto',
        display: 'flex',
        justifyContent: 'center'
      },
      '& .swiper-button-next, & .swiper-button-prev': {
        color: '#000',
        '&:after': {
          fontSize: { xs: '24px', md: '30px' }
        }
      }
    }}>
      <Swiper
        modules={[Navigation]}
        navigation
        loop
        spaceBetween={0}
        slidesPerView={1.2}
        speed={500}
        watchSlidesProgress={false}
        grabCursor={false}
        style={{ padding: '0 0%', overflow: 'visible' }}
        onSwiper={(swiper) => {
          setSwiperInstance(swiper);
          if (onSwiperReady) onSwiperReady(swiper);
        }}
        breakpoints={{
          640: { slidesPerView: 2.2 },
          1024: { slidesPerView: 5.5 }
        }}
      >
        {slides.map((product) => {
          const categoryName = getCategoryNameForProduct(product);
          return (
            <SwiperSlide key={product._id}>
              <ProductCard product={product} onAddSuccess={handleAddSuccess} onAddError={handleAddError} />
            </SwiperSlide>
          );
        })}
      </Swiper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewArrivalsCarousel;


