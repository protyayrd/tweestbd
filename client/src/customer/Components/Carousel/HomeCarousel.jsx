import React, { useEffect, useState } from "react";
import AliceCarousel from "react-alice-carousel";
import "react-alice-carousel/lib/alice-carousel.css";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCategories } from "../../../Redux/Admin/Category/Action";
import { selectFeaturedCategories } from "../../../Redux/Admin/Category/Selectors";
import { API_BASE_URL } from "../../../config/api";
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const CarouselContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  '& .alice-carousel': {
    height: '100%',
  },
  '& .alice-carousel__stage': {
    height: '100%',
  },
  '& .alice-carousel__stage-item': {
    height: '100%',
  },
  '& .alice-carousel__dots': {
    position: 'absolute',
    bottom: '20px',
    width: '100%',
  },
  '& .nav-button': {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '64px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    zIndex: 2,
    opacity: 0,
    border: 'none',
    '&.prev': {
      left: '0px',
    },
    '&.next': {
      right: '0px',
    },
  },
  '&:hover .nav-button': {
    opacity: 1,
  },
});

const SlideContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100vh',
  overflow: 'hidden',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
  },
  '& .overlay': {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 20px',
    color: '#fff',
    textAlign: 'center',
  },
  '& .title': {
    fontSize: '6rem',
    fontWeight: 400,
    marginBottom: '2rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
    maxWidth: '80%',
    lineHeight: 1.2,
  },
  '& .description': {
    fontSize: '1.25rem',
    maxWidth: '800px',
    marginBottom: '2rem',
    lineHeight: 1.6,
    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
  },
  '& .shop-button': {
    padding: '1.5rem 4rem',
    fontSize: '1.3rem',
    fontWeight: 600,
    color: '#000',
    backgroundColor: '#fff',
    border: 'none',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    transition: 'all 0.3s ease',
    borderRadius: '9999px',
    '&:hover': {
      backgroundColor: '#000',
      color: '#fff',
    }
  }
});

const handleDragStart = (e) => e.preventDefault();

const HomeCarousel = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const featuredCategories = useSelector(selectFeaturedCategories);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  const handlePrevClick = () => {
    if (items.length > 0) {
      setActiveIndex((prevIndex) => (prevIndex === 0 ? items.length - 1 : prevIndex - 1));
    }
  };

  const handleNextClick = () => {
    if (items.length > 0) {
      setActiveIndex((prevIndex) => (prevIndex === items.length - 1 ? 0 : prevIndex + 1));
    }
  };

  const items = featuredCategories.map((category) => (
    <SlideContainer key={category._id}>
      <img
        src={`${API_BASE_URL}${category.imageUrl}`}
        alt={category.name}
        onDragStart={handleDragStart}
      />
      <div className="overlay flex flex-col items-center justify-center">
        <h1 className="title">{category.name}</h1>
        <button 
          className="shop-button"
          onClick={() => navigate(`/products?category/${category._id}`)}
        >
          Shop Now
        </button>
      </div>
    </SlideContainer>
  ));

  return (
    <CarouselContainer>
      {items.length > 0 ? (
        <>
          <AliceCarousel
            mouseTracking
            items={items}
            autoPlay
            infinite
            autoPlayInterval={5000}
            animationDuration={1000}
            disableButtonsControls
            activeIndex={activeIndex}
            onSlideChanged={(e) => setActiveIndex(e.item)}
            responsive={{
              0: { items: 1 }
            }}
          />
          <button className="nav-button prev" onClick={handlePrevClick}>
            <ChevronLeftIcon className="h-12 w-12 text-gray-800" />
          </button>
          <button className="nav-button next" onClick={handleNextClick}>
            <ChevronRightIcon className="h-12 w-12 text-gray-800" />
          </button>
        </>
      ) : (
        <SlideContainer>
          <div className="overlay">
            <h1 className="title">No Featured Categories</h1>
            <p className="description">Add featured categories in the admin panel</p>
          </div>
        </SlideContainer>
      )}
    </CarouselContainer>
  );
};

export default HomeCarousel;
