import React, { useState, useEffect } from 'react';
import { Dialog, IconButton, Box, Typography, Button, Fade, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import popupImageService from '../services/popupImage.service';
import { animated, useTransition } from 'react-spring';

const PopupDialog = () => {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // Animation for image transitions
  const transitions = useTransition(currentIndex, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { duration: 300 },
  });

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;
  
  useEffect(() => {
    // Check if the popup has been shown in the current session
    const hasShownPopup = sessionStorage.getItem('hasShownPopup');
    
    if (!hasShownPopup) {
      // Load popup images
      setLoading(true);
      popupImageService.getActiveImages()
        .then(response => {
          if (response.data && response.data.length > 0) {
            setImages(response.data);
            setOpen(true);
            // Mark popup as shown in this session
            sessionStorage.setItem('hasShownPopup', 'true');
          }
          setLoading(false);
        })
        .catch(error => {
          console.error('Error loading popup images:', error);
          setLoading(false);
        });
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const handlePrevious = (e) => {
    if (e) e.stopPropagation(); // Prevent triggering the link click
    setCurrentIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : images.length - 1));
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation(); // Prevent triggering the link click
    setCurrentIndex(prevIndex => (prevIndex < images.length - 1 ? prevIndex + 1 : 0));
  };

  const handleImageClick = () => {
    const currentImage = images[currentIndex];
    if (currentImage.link) {
      window.open(currentImage.link, '_blank');
    }
  };

  const toggleCaption = (e) => {
    e.stopPropagation();
    setShowCaption(!showCaption);
  };

  // Touch event handlers for swipe
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  if (images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xl"
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          width: 'auto',
          maxWidth: { xs: '95vw', sm: '90vw', md: '85vw' },
          maxHeight: '90vh',
          bgcolor: 'transparent',
          boxShadow: 'none',
        }
      }}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 500 }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        }
      }}
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 400, bgcolor: 'background.paper', borderRadius: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 10,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>

          <Box 
            sx={{ 
              position: 'relative',
              cursor: currentImage.link ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'visible',
              width: 'auto',
              height: 'auto',
              maxHeight: '85vh',
            }} 
            onClick={handleImageClick}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {transitions((style, index) => (
              index === currentIndex && (
                <animated.div style={{ 
                  ...style, 
                  position: 'relative', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '8px',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                  <img
                    src={`${process.env.REACT_APP_API_URL}${currentImage.imagePath}`}
                    alt={currentImage.title}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '80vh', 
                      objectFit: 'contain',
                      borderRadius: '4px',
                    }}
                  />
                </animated.div>
              )
            ))}

            {/* Image title and description */}
            {(currentImage.title || currentImage.description) && (
              <Fade in={showCaption}>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    color: 'white',
                    padding: 2,
                    textAlign: 'center',
                    transition: 'transform 0.3s ease',
                    zIndex: 5,
                  }}
                >
                  {currentImage.title && (
                    <Typography variant="h6" component="h2" fontWeight="bold">
                      {currentImage.title}
                    </Typography>
                  )}
                  {currentImage.description && (
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {currentImage.description}
                    </Typography>
                  )}
                  {currentImage.link && (
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(currentImage.link, '_blank');
                      }}
                      sx={{ mt: 1, color: 'white', borderColor: 'white', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}
                    >
                      Visit Link
                    </Button>
                  )}
                </Box>
              </Fade>
            )}

            {/* Toggle caption button */}
            {(currentImage.title || currentImage.description) && (
              <IconButton
                onClick={toggleCaption}
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  transform: showCaption ? 'none' : 'rotate(180deg)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  },
                  zIndex: 10,
                }}
              >
                <KeyboardArrowDownIcon />
              </IconButton>
            )}

            {/* Navigation arrows (only show if there are multiple images) */}
            {images.length > 1 && (
              <>
                <IconButton
                  aria-label="previous"
                  onClick={handlePrevious}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    width: 40,
                    height: 40,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    },
                    zIndex: 4,
                  }}
                >
                  <ArrowBackIosNewIcon />
                </IconButton>
                <IconButton
                  aria-label="next"
                  onClick={handleNext}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    width: 40,
                    height: 40,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    },
                    zIndex: 4,
                  }}
                >
                  <ArrowForwardIosIcon />
                </IconButton>

                {/* Pagination indicators */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: showCaption && (currentImage.title || currentImage.description) ? 80 : 16,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 1,
                    padding: 1,
                    zIndex: 10,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: 1,
                    maxWidth: 'fit-content',
                    margin: '0 auto',
                  }}
                >
                  {images.map((_, index) => (
                    <Box
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(index);
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <FiberManualRecordIcon 
                        sx={{ 
                          fontSize: index === currentIndex ? 16 : 12,
                          color: index === currentIndex ? 'primary.main' : 'rgba(255, 255, 255, 0.6)',
                          transition: 'all 0.2s ease',
                        }} 
                      />
                    </Box>
                  ))}
                  <Typography variant="caption" sx={{ color: 'white', ml: 1 }}>
                    {currentIndex + 1}/{images.length}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </>
      )}
    </Dialog>
  );
};

export default PopupDialog; 