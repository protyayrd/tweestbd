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
      touchAction: 'pan-y',
      contentVisibility: 'auto',
      containIntrinsicSize: '0 400px',
      willChange: 'auto',
      py: 2,
      '& .swiper': {
        width: '100%',
        height: 'auto',
        overflow: 'visible',
        backfaceVisibility: 'visible'
      },
      '& .swiper-slide': {
        height: 'auto',
        opacity: inView ? 0.75 : 1,
        transform: inView ? 'scale(0.9)' : 'scale(1)',
        transition: inView ? 'opacity 0.3s, transform 0.3s' : 'none',
        '&.swiper-slide-active': {
          opacity: 1,
          transform: 'scale(1)'
        }
      },
      '& .swiper-wrapper': {
        alignItems: 'center'
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
        spaceBetween={20}
        slidesPerView={'auto'}
        centeredSlides
        speed={500}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          enabled: inView
        }}
        freeMode={{ enabled: true, sticky: true, momentumRatio: 0.25 }}
        watchSlidesProgress
        grabCursor
        style={{ padding: '0 5%', overflow: 'visible' }}
        onSwiper={(swiper) => {
          setSwiperInstance(swiper);
          if (onSwiperReady) onSwiperReady(swiper);
        }}
        breakpoints={{
          320: { slidesPerView: 1.2, spaceBetween: 10, centeredSlides: true },
          640: { slidesPerView: 1.5, spaceBetween: 15 },
          768: { slidesPerView: 2.2, spaceBetween: 20 },
          1024: { slidesPerView: 3.2, spaceBetween: 20 }
        }}
      >
        {slides.map((product) => {
          const categoryName = getCategoryNameForProduct(product);
          return (
            <SwiperSlide key={product._id}>
              <Box 
                sx={{ 
                  p: { xs: 1, md: 2 },
                  height: '100%',
                  willChange: 'transform',
                  transform: 'translateZ(0)',
                  position: 'relative'
                }}
              >
                {categoryName && (
                  <Box sx={{
                    position: 'absolute',
                    top: { xs: '8px', md: '16px' },
                    left: { xs: '8px', md: '16px' },
                    right: { xs: '8px', md: '16px' },
                    zIndex: 5,
                    px: 1.5,
                    py: 0.8,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: '#fff',
                    borderRadius: '2px',
                    fontSize: { xs: '0.7rem', md: '0.8rem' },
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    textAlign: 'center',
                  }}>
                    {categoryName}
                  </Box>
                )}
                <Box sx={{ backgroundColor: '#fff' }}>
                  <ProductCard product={product} />
                </Box>
              </Box>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </Box>
  );
};

export default NewArrivalsCarousel;


