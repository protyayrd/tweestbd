// Logo configuration
export const LOGO_CONFIG = {
  // Main logo path
  MAIN_LOGO: '/images/logo.png',
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
      width: 'auto',
      transition: 'all 0.3s ease',
      objectFit: 'contain'
    },
    small: {
      height: { xs: '20px', sm: '24px', md: '28px' },
      width: 'auto',
      transition: 'all 0.3s ease',
      objectFit: 'contain'
    },
    large: {
      height: { xs: '32px', sm: '40px', md: '48px' },
      width: 'auto',
      transition: 'all 0.3s ease',
      objectFit: 'contain'
    }
  };

  return styles[variant] || styles.default;
}; 