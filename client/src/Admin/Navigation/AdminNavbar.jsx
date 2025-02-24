import React from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const { auth } = useSelector((state) => state);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/admin')}
          >
            Admin Dashboard
          </Typography>
          <IconButton sx={{ p: 0 }}>
            <Avatar alt={auth?.user?.firstName} src={auth?.user?.imageUrl} />
          </IconButton>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default AdminNavbar;