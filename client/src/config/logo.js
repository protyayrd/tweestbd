// Logo configuration
export const LOGO_CONFIG = {
  // Main logo path
  MAIN_LOGO: '/images/logo.png',
  // Responsive logo sources
  LOGO_SRCSET: '/images/logo-300w.png 300w, /images/logo-600w.png 600w, /images/logo.png 1200w',
  LOGO_SIZES: '(max-width: 768px) 150px, (max-width: 1200px) 200px, 250px',
  // Favicon path (assuming it's in the public folder)
  FAVICON: '/favicon.ico',
  // Alt text for logo
  ALT_TEXT: 'Tweest BD',
  // Default sizes for different viewports
  SIZES: {
    MOBILE: {
      height: '24px',
      width: 'auto'
    },
    TABLET: {
      height: '32px',
      width: 'auto'
    },
    DESKTOP: {
      height: '40px',
      width: 'auto'
    }
  }
};

// Utility function to get logo styles based on viewport
export const getLogoStyles = (variant = 'default') => {
  const styles = {
    default: {
      height: { xs: LOGO_CONFIG.SIZES.MOBILE.height, sm: LOGO_CONFIG.SIZES.TABLET.height, md: LOGO_CONFIG.SIZES.DESKTOP.height },
      width: { xs: '142px', sm: '190px', md: '238px' }, // Fixed aspect ratio based on original 6310x1076 dimensions
      transition: 'all 0.3s ease',
      objectFit: 'contain'
    },
    small: {
      height: { xs: '20px', sm: '24px', md: '28px' },
      width: { xs: '118px', sm: '142px', md: '165px' },
      transition: 'all 0.3s ease',
      objectFit: 'contain'
    },
    large: {
      height: { xs: '32px', sm: '40px', md: '48px' },
      width: { xs: '189px', sm: '236px', md: '283px' },
      transition: 'all 0.3s ease',
      objectFit: 'contain'
    }
  };

  return styles[variant] || styles.default;
}; 