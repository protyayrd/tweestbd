import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  Divider,
  Typography,
  useTheme,
  Avatar
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import SettingsIcon from '@mui/icons-material/Settings';
import ShirtIcon from '@mui/icons-material/Checkroom';

const drawerWidth = 280;

const menuItems = [
  {
    title: 'Dashboard',
    path: '/admin/dashboard',
    icon: <DashboardIcon />
  },
  {
    title: 'Products',
    path: '/admin/products',
    icon: <InventoryIcon />
  },
  {
    title: 'Customers',
    path: '/admin/customers',
    icon: <PeopleIcon />
  },
  {
    title: 'Orders',
    path: '/admin/orders',
    icon: <ShoppingCartIcon />
  },
  {
    title: 'Jersey Orders',
    path: '/admin/tshirt-orders',
    icon: <ShirtIcon />
  },
  {
    title: 'Jersey Form Settings',
    path: '/admin/jersey-form-settings',
    icon: <SettingsIcon />
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const theme = useTheme();
  const location = useLocation();

  const drawer = (
    <Box sx={{ width: drawerWidth, height: '100%', bgcolor: '#f5f5f5' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: theme.spacing(3),
          bgcolor: theme.palette.primary.main,
          color: 'white'
        }}
      >
        <Avatar sx={{ bgcolor: 'white', color: theme.palette.primary.main, mr: 2 }}>
          <LocalMallIcon />
        </Avatar>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
          TweesBd Admin
        </Typography>
      </Box>
      
      <Divider />
      
      <List sx={{ mt: 2 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.title}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              mb: 1,
              mx: 1,
              borderRadius: 1,
              '&.Mui-selected': {
                bgcolor: theme.palette.primary.main,
                color: 'white',
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                },
              },
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname === item.path ? 'white' : theme.palette.text.secondary,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.title} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      open={isOpen}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar; 