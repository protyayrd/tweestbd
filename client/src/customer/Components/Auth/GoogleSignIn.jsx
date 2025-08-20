import React from 'react';
import { Button } from '@mui/material';

const GoogleSVG = () => (
  <svg width="20" height="20" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M533.5 278.4c0-18.5-1.5-37-4.6-55.1H272v104.3h146.9c-6.3 34-25 62.7-53.3 82.1v68.2h85.9c50.3-46.3 81-114.6 81-199.5z" />
    <path fill="#34A853" d="M272 544.3c72.4 0 133.3-23.9 177.7-64.9l-85.9-68.2c-23.9 16-54.3 25.4-91.8 25.4-70.6 0-130.4-47.7-151.8-111.7H32.2v69.9C76.8 476.1 168.2 544.3 272 544.3z" />
    <path fill="#FBBC05" d="M120.2 324.9c-10.6-31.8-10.6-66.4 0-98.2V156.8H32.2c-35.4 70.6-35.4 154.2 0 224.8l88-56.7z" />
    <path fill="#EA4335" d="M272 107.7c39.4 0 74.8 13.6 102.6 40.4l76.8-76.8C405.3 24.2 344.4 0 272 0 168.2 0 76.8 68.2 32.2 156.8l88 69.9c21.3-64 81.2-111.7 151.8-111.7z" />
  </svg>
);

const GoogleSignIn = () => {
  const handleGoogleSignIn = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5454';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <Button
      onClick={handleGoogleSignIn}
      variant="outlined"
      fullWidth
      size="large"
      startIcon={<GoogleSVG />}
      sx={{
        mt: 2,
        mb: 2,
        color: '#757575',
        borderColor: '#757575',
        '&:hover': {
          borderColor: '#69af5a',
          color: '#69af5a',
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
        textTransform: 'none',
        fontSize: '1rem',
        fontWeight: 500,
        borderRadius: '8px',
      }}
    >
      Continue with Google
    </Button>
  );
};

export default GoogleSignIn;
