import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCategories } from "../../../Redux/Admin/Category/Action";
import { selectFeaturedCategories } from "../../../Redux/Admin/Category/Selectors";
import { API_BASE_URL } from '../../../config/api';
import { styled } from '@mui/material/styles';
import { Box, Skeleton } from '@mui/material';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// import required modules
import { Navigation, Pagination, Autoplay, EffectFade, A11y } from 'swiper';

// Import Intersection Observer for visibility detection
import { useInView } from 'react-intersection-observer';

// We'll register the modules inside the component to avoid ESLint React Hook errors

const CarouselContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  '& .swiper': {
    height: '100%',
  },
  '& .swiper-wrapper': {
    height: '100%',
  },
  '& .swiper-slide': {
    height: '100%',
  },
  '& .swiper-pagination': {
    position: 'absolute',
    bottom: '20px',
    width: '100%',
    zIndex: 10,
    '@media (max-width: 768px)': {
      bottom: '10px',
    }
  },
  '& .swiper-pagination-bullet': {
    width: '10px',
    height: '10px',
    background: 'rgba(255, 255, 255, 0.8)',
    opacity: 0.5,
    '&.swiper-pagination-bullet-active': {
      opacity: 1,
      background: '#fff',
    }
  }
});

const SlideContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100vh',
  overflow: 'hidden',
  contain: 'content', // Improve paint performance by creating a new stacking context
  '@media (max-width: 768px)': {
    height: '450px', // Fixed reduced height for mobile view
  },
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    // Disable GPU acceleration as it may cause rendering issues on mobile
    backfaceVisibility: 'visible',
    perspective: 'none',
    willChange: 'auto',
    // Removed transition to prevent unnecessary paint operations
    // Set fixed aspect ratio to prevent layout shifts
    aspectRatio: '16/9',
    // Optimize rendering on mobile with appropriate settings
    '@media (max-width: 768px)': {
      height: '450px', // Ensure fixed height for image on mobile
      aspectRatio: '4/3',
      imageRendering: 'auto',
    }
  },
  '& picture': {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  '& source': {
    width: '100%',
    height: '100%',
  },
  '& .content-wrapper': {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // No background gradient overlay - removed black shadow
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 20px',
    color: '#fff',
    textAlign: 'center',
    transition: 'opacity 0.2s ease-out', // Reduced transition time
    '@media (max-width: 768px)': {
      justifyContent: 'flex-end',
      paddingBottom: '15%',
    }
  },
  '& .title': {
    fontSize: 'clamp(2rem, 5vw, 3.5rem)', // Slightly reduced max size
    fontWeight: 700,
    marginBottom: '1rem',
    textShadow: '2px 2px 4px rgba(0,0,0,0.7)', // Kept shadow on text only
    '@media (max-width: 768px)': {
      fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
      marginBottom: '0.6rem',
    }
  },
  '& .description': {
    fontSize: 'clamp(1rem, 2vw, 1.3rem)', // Reduced font size
    maxWidth: '800px',
    margin: '0 auto',
    textShadow: '1px 1px 3px rgba(0,0,0,0.5)', // Enhanced text shadow
    '@media (max-width: 768px)': {
      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
      maxWidth: '90%', // Slightly reduced width
      display: 'none', // Hide description on mobile for better performance
    }
  },
  '& .shop-button': {
    padding: '1.25rem 3.5rem', // Reduced padding
    fontSize: '1.2rem',
    fontWeight: 600,
    color: '#00503a',
    backgroundColor: '#fff',
    border: 'none',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    transition: 'all 0.2s ease', // Simplified transition
    borderRadius: '9999px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    '&:hover': {
      backgroundColor: '#f5f5f5',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px rgba(0,0,0,0.2)'
    },
    '@media (max-width: 768px)': {
      padding: '0.75rem 2rem', // Further reduced padding on mobile
      fontSize: '0.9rem',
      letterSpacing: '0.05em',
      marginBottom: '20px' // Add some bottom margin on mobile
    }
  }
});

const CarouselSkeleton = styled(Box)({
  width: '100%',
  height: '100vh',
  position: 'relative',
  background: '#f0f0f0', // Solid color background for skeleton
  '@media (max-width: 768px)': {
    height: '450px', // Fixed height for mobile
  }
});

const LoadingContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100vh',
  backgroundColor: '#f5f5f5',
  '@media (max-width: 768px)': {
    height: '500px', // Fixed height for mobile
  }
});

const HomeCarousel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const featuredCategories = useSelector(selectFeaturedCategories);
  const [loadedImages, setLoadedImages] = useState({});
  // Defer interactive carousel to reduce render delay
  const [enhanced, setEnhanced] = useState(false);

  // Remove prerendered hero as soon as the interactive UI mounts
  useEffect(() => {
    const prerender = document.getElementById('hero-prerender');
    if (prerender && prerender.parentNode) {
      prerender.parentNode.removeChild(prerender);
    }
  }, []);
  const swiperRef = useRef(null);
  
  // Use react-intersection-observer for more efficient visibility detection
  const { ref: containerRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });
  
  // Track visibility for performance optimization
  const [isInView, setIsInView] = useState(false);
  
  // Update isInView state when inView changes
  useEffect(() => {
    setIsInView(inView);
    
    // Pause autoplay when not in view to save resources
    if (swiperRef.current && swiperRef.current.autoplay) {
      if (inView) {
        swiperRef.current.autoplay.start();
      } else {
        swiperRef.current.autoplay.stop();
      }
    }
  }, [inView]);

  // Defer mounting Swiper to allow hero to paint first
  useEffect(() => {
    if (!enhanced) {
      const idle = window.requestIdleCallback ?
        window.requestIdleCallback(() => setEnhanced(true), { timeout: 2000 }) :
        setTimeout(() => setEnhanced(true), 1500);
      return () => {
        if (typeof idle === 'number') clearTimeout(idle);
        else if (idle && window.cancelIdleCallback) window.cancelIdleCallback(idle);
      };
    }
  }, [enhanced]);
  
  // Memoize categories to prevent unnecessary renders
  const categories = useMemo(() => {
    return featuredCategories || [];
  }, [featuredCategories]);

  // Fetch categories if not already fetched
  useEffect(() => {
    if (categories.length === 0) {
      dispatch(getCategories());
    }
  }, [categories.length, dispatch]);

  // Preload images and handle image loading
  const handleImageLoad = useCallback((categoryId) => {
    setLoadedImages(prev => ({
      ...prev,
      [categoryId]: true
    }));
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      // Preload the first hero image to reduce LCP load delay
      const first = categories[0];
      if (first && first.imageUrl) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = `${API_BASE_URL}${first.imageUrl}`;
        link.imagesrcset = `${API_BASE_URL}${first.imageUrl} 1200w, ${API_BASE_URL}${first.imageUrl} 1920w`;
        link.imagesizes = '(max-width: 768px) 100vw, 100vw';
        document.head.appendChild(link);
      }

      categories.forEach(category => {
        if (category.imageUrl) {
          const img = new Image();
          img.src = `${API_BASE_URL}${category.imageUrl}`;
          img.onload = () => {};
          img.onerror = () => {
            console.error(`Failed to load image: ${category.imageUrl}`);
          };
        }
      });
    }
    // This effect should only run once when featured categories are available
  }, [featuredCategories, categories]);
  
  // Navigate to category
  const navigateToCategory = useCallback((categoryId) => {
            navigate(`/${categories.find(cat => cat._id === categoryId)?.slug || categoryId}&page=1`);
  }, [navigate]);

  // Generate srcSet for responsive images and WebP support
  const generateSrcSet = useCallback((imageUrl) => {
    const baseUrl = `${API_BASE_URL}${imageUrl}`;
    const fileExtension = imageUrl.split('.').pop();
    const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('.'));
    
    // Generate WebP srcset with fallbacks
    return {
      webp: [
        `${basePath}.webp 640w`,
        `${basePath}.webp 1200w`,
        `${basePath}.webp 1920w`
      ].join(', '),
      original: [
        `${baseUrl} 640w`,
        `${basePath}.${fileExtension} 1200w`,
        `${basePath}.${fileExtension} 1920w`
      ].join(', ')
    };
  }, []);

  // Prepare slides with optimized image loading and rendering
  const slides = useMemo(() => {
    return featuredCategories.map((category, index) => {
      const srcSets = generateSrcSet(category.imageUrl);
      
      return (
        <SlideContainer key={category._id}>
          {/* Removed skeleton loader for faster initial rendering */}
          <picture>
            <source 
              srcSet={srcSets.webp} 
              type="image/webp" 
              sizes="(max-width: 768px) 100vw, 100vw" 
            />
            <source 
              srcSet={srcSets.original} 
              type={`image/${category.imageUrl.split('.').pop()}`} 
              sizes="(max-width: 768px) 100vw, 100vw" 
            />
            <img
              src={`${API_BASE_URL}${category.imageUrl}`}
              alt={category.name}
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'low'}
              onLoad={() => handleImageLoad(category._id)}
              decoding="async"
              width="1920"
              height="1080"
              style={{
                opacity: 1,
                zIndex: 2,
                transform: 'translateZ(0)'
              }}
            />
          </picture>
          <div className="content-wrapper" style={{ opacity: loadedImages[category._id] ? 1 : 0, zIndex: 3 }}>
            <h1 className="title">{category.name}</h1>
            <button 
              className="shop-button"
              onClick={() => navigateToCategory(category._id)}
            >
              Shop Now
            </button>
          </div>
        </SlideContainer>
      );
    });
  }, [featuredCategories, loadedImages, navigateToCategory, generateSrcSet, handleImageLoad]);
  
  // Swiper configuration options - optimized for performance and incorporating visibility-based autoplay
  const swiperOptions = {
    loop: true,
    spaceBetween: 0,
    slidesPerView: 1,
    effect: 'fade', // Use fade effect for smoother transitions
    speed: 800, // Transition speed
    autoplay: {
      delay: 5000, // Delay between slides
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
      enabled: isInView // Only enable autoplay when in view
    },
    pagination: {
      clickable: true,
      dynamicBullets: true
    },
    touchRatio: 1,
    touchAngle: 45,
    simulateTouch: true,
    threshold: 5, // More sensitive touch for better mobile experience
    a11y: {
      enabled: true,
      prevSlideMessage: 'Previous slide',
      nextSlideMessage: 'Next slide'
    },
    // Performance optimizations
    preloadImages: true, // Preload all images for immediate display
    lazy: false, // Disable lazy loading for carousel
    watchSlidesProgress: false,
    resistanceRatio: 0.85,
    updateOnWindowResize: true,
    renderProgressBar: false, // Disable progress bar rendering to improve performance
    // Store swiper instance in ref
    onSwiper: (swiper) => {
      swiperRef.current = swiper;
      // Only start autoplay if in view and autoplay is available
      if (swiper.autoplay) {
        if (isInView) {
          swiper.autoplay.start();
        } else {
          swiper.autoplay.stop();
        }
      }
    }
  };

  // Optimized carousel rendering
  const renderCarousel = () => {
    if (featuredCategories.length === 0) {
      return (
        <SlideContainer>
          <div className="content-wrapper">
            <h1 className="title">No Featured Categories</h1>
            <p className="description">Add featured categories in the admin panel</p>
          </div>
        </SlideContainer>
      );
    }

    // Static first hero for fast paint; upgrade to Swiper after idle
    if (!enhanced) {
      const first = featuredCategories[0];
      const srcSets = first ? generateSrcSet(first.imageUrl) : null;
      return (
        <SlideContainer>
          {first && (
            <picture>
              <source srcSet={srcSets.webp} type="image/webp" sizes="(max-width: 768px) 100vw, 100vw" />
              <source srcSet={srcSets.original} type={`image/${first.imageUrl.split('.').pop()}`} sizes="(max-width: 768px) 100vw, 100vw" />
              <img
                src={`${API_BASE_URL}${first.imageUrl}`}
                alt={first.name}
                loading={'eager'}
                fetchPriority={'high'}
                decoding="async"
                width="1920"
                height="1080"
                style={{ opacity: 1, zIndex: 2, transform: 'translateZ(0)' }}
              />
            </picture>
          )}
          <div className="content-wrapper" style={{ opacity: first ? 1 : 0 }}>
            <h1 className="title">{first?.name || ''}</h1>
            {first && (
              <button className="shop-button" onClick={() => navigateToCategory(first._id)}>Shop Now</button>
            )}
          </div>
        </SlideContainer>
      );
    }

    return (
      <Swiper ref={swiperRef} {...swiperOptions}>
        {slides.map((slide, index) => (
          <SwiperSlide key={`slide-${index}`}>
            {slide}
          </SwiperSlide>
        ))}
      </Swiper>
    );
  };

  return (
    <CarouselContainer ref={containerRef}>
      {renderCarousel()}
    </CarouselContainer>
  );
};

export default React.memo(HomeCarousel); // Prevent unnecessary re-renders
