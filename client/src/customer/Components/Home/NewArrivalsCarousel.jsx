import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import ProductCard from '../Product/ProductCard/ProductCard';

// Swiper and styles are isolated here so they load in an async chunk
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation, Autoplay, FreeMode } from 'swiper';

const NewArrivalsCarousel = ({ products = [], getCategoryNameForProduct, inView = true, onSwiperReady }) => {
  const [swiperInstance, setSwiperInstance] = useState(null);

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

  return (
    <Box sx={{ 
      position: 'relative',
      overflow: 'hidden',
      py: 2,
      '& .swiper': {
        width: '100%',
        height: 'auto'
      },
      '& .swiper-slide': {
        height: 'auto'
      },
      '& .swiper-button-next, & .swiper-button-prev': {
        color: '#000',
        '&:after': {
          fontSize: { xs: '24px', md: '30px' }
        }
      }
    }}>
      <Swiper
        modules={[Navigation, Autoplay, FreeMode]}
        navigation
        loop
        spaceBetween={0}
        slidesPerView={'auto'}
        speed={500}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          enabled: inView
        }}
        freeMode={{ enabled: true, sticky: true, momentumRatio: 0.25 }}
        watchSlidesProgress
        grabCursor
        style={{ padding: '0 0%', overflow: 'visible' }}
        onSwiper={(swiper) => {
          setSwiperInstance(swiper);
          if (onSwiperReady) onSwiperReady(swiper);
        }}
        breakpoints={{
          320: { slidesPerView: 2, spaceBetween: 0 },
          640: { slidesPerView: 3, spaceBetween: 0 },
          768: { slidesPerView: 4, spaceBetween: 0 },
          1280: { slidesPerView: 5, spaceBetween: 0 }
        }}
      >
        {slides.map((product) => {
          const categoryName = getCategoryNameForProduct(product);
          return (
            <SwiperSlide key={product._id}>
              <ProductCard product={product} />
            </SwiperSlide>
          );
        })}
      </Swiper>
    </Box>
  );
};

export default NewArrivalsCarousel;


