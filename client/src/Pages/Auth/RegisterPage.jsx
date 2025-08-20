import React from 'react';
import { Box, Container, Paper } from '@mui/material';
import RegisterUserForm from '../../customer/Components/Auth/Register';

const RegisterPage = () => {
  return (
    <Box 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f7fa',
        py: { xs: 4, sm: 6, md: 8 }
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4, md: 5 },
            borderRadius: 3,
            bgcolor: 'white',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}
        >
          <RegisterUserForm />
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage; 