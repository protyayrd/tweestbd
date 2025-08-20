import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { adminNavigationItems } from './AdminNavigation';

const AdminSidebar = () => {
  
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  useEffect(() => {
  }, [location]);

  const handleClick = (item) => {
    if (item.children) {
      setOpenMenus((prev) => ({
        ...prev,
        [item.title]: !prev[item.title],
      }));
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const isSelected = (path) => location.pathname === path;

  const renderNavItem = (item) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openMenus[item.title];

    return (
      <React.Fragment key={item.title}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleClick(item)}
            selected={!hasChildren && isSelected(item.path)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.title} />
            {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child) => (
                <ListItemButton
                  key={child.title}
                  onClick={() => navigate(child.path)}
                  selected={isSelected(child.path)}
                  sx={{
                    pl: 4,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  }}
                >
                  <ListItemText primary={child.title} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box
      sx={{
        width: '20%',
        minWidth: 250,
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      <List component="nav">
        {adminNavigationItems.map((item) => {
          return renderNavItem(item);
        })}
      </List>
    </Box>
  );
};

export default AdminSidebar; 