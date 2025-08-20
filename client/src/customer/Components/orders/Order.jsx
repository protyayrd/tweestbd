import { 
  Box, 
  Grid, 
  Typography, 
  CircularProgress, 
  Container, 
  Chip, 
  Paper, 
  Tabs, 
  Tab, 
  useMediaQuery, 
  Drawer, 
  Button, 
  IconButton,
  Divider,
  Card,
  CardContent
} from "@mui/material";
import React, { useEffect, useState } from "react";
import OrderCard from "./OrderCard";
import { useDispatch, useSelector } from "react-redux";
import { getOrderHistory } from "../../../Redux/Customers/Order/Action";
import BackdropComponent from "../BackDrop/Backdrop";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import EmptyOrdersImage from "../../../assets/empty-orders.svg";
import { useNavigate } from "react-router-dom";
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';

// Order status values matching server-side values
const orderStatus = [
  { label: "Confirmed", value: "CONFIRMED", color: "#00503a" },
  { label: "Shipped", value: "SHIPPED", color: "#00503a" },
  { label: "Delivered", value: "DELIVERED", color: "#4CAF50" },
  { label: "Cancelled", value: "CANCELLED", color: "#F44336" },
];

const Order = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const { order } = useSelector(store => store);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  // Fetch orders on component mount
  useEffect(() => {
    if (jwt) {
      dispatch(getOrderHistory({ jwt }));
    }
  }, [jwt, dispatch]);

  // Filter orders based on selected statuses or active tab
  useEffect(() => {
    if (order.orders && order.orders.length > 0) {
      if (activeTab === 0 && selectedStatuses.length === 0) {
        // All orders tab
        setFilteredOrders(order.orders);
      } else if (activeTab > 0) {
        // Tab-based filtering (index matches orderStatus array)
        const statusValue = orderStatus[activeTab - 1]?.value;
        setFilteredOrders(order.orders.filter(order => order.orderStatus === statusValue));
      } else if (selectedStatuses.length > 0) {
        // Filter based on selected checkboxes
        setFilteredOrders(order.orders.filter(order => 
          selectedStatuses.includes(order.orderStatus)
        ));
      } else {
        setFilteredOrders(order.orders);
      }
    } else {
      setFilteredOrders([]);
    }
  }, [order.orders, selectedStatuses, activeTab]);

  // Handle filter checkbox changes
  const handleStatusChange = (status) => {
    // Reset active tab when using checkboxes
    setActiveTab(0);
    
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  // Handle tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Clear checkbox selection when using tabs
    setSelectedStatuses([]);
  };

  // Toggle filter drawer for mobile
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: '#f9fafb', minHeight: '100vh' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4
      }}>
        <Typography 
          variant="h5" 
          fontWeight="bold"
          sx={{ 
            fontSize: { xs: '1.5rem', md: '2rem' },
            position: 'relative',
            color: '#00503a',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -1,
              left: 0,
              width: '40px',
              height: '3px',
              backgroundColor: '#00503a',
              borderRadius: '2px'
            }
          }}
        >
          My Orders
        </Typography>
        
        {isMobile && (
          <IconButton 
            edge="end" 
            color="primary" 
            onClick={toggleDrawer}
            sx={{ 
              border: '1px solid',
              borderColor: '#00503a',
              color: '#00503a'
            }}
          >
            <FilterListIcon />
          </IconButton>
        )}
      </Box>
      
      {/* Order stats */}
      {order.stats && (
        <Card sx={{ mb: 4, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">TOTAL ORDERS</Typography>
                <Typography variant="h6" fontWeight="bold" color="#00503a">
                  {order.stats.totalOrders || 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">AMOUNT SPENT</Typography>
                <Typography variant="h6" fontWeight="bold" color="#00503a">
                  Tk. {order.stats.totalSpent || 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">AMOUNT SAVED</Typography>
                <Typography variant="h6" fontWeight="bold" color="#4CAF50">
                  Tk. {order.stats.totalSaved || 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">AVG. ORDER VALUE</Typography>
                <Typography variant="h6" fontWeight="bold" color="#00503a">
                  Tk. {order.stats.averageOrderValue || 0}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
      
      {/* Tabs for quick status filtering */}
      <Box 
        sx={{ 
          bgcolor: 'white',
          borderRadius: 2,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          mb: 4,
          width: '100%',
          overflow: 'auto'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="order status tabs"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'medium',
              minWidth: 80,
            },
            '& .Mui-selected': {
              color: '#00503a !important',
              fontWeight: 600,
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00503a',
              height: 3,
            }
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingBagOutlinedIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                All Orders
              </Box>
            } 
          />
          {orderStatus.map((status, index) => (
            <Tab 
              key={status.value} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: status.color,
                      mr: 1
                    }} 
                  />
                  {status.label}
                </Box>
              } 
            />
          ))}
        </Tabs>
      </Box>
      
      <Grid container spacing={3}>
        {/* Filter sidebar - desktop */}
        {!isMobile && (
          <Grid item xs={12} md={3} lg={2.5}>
            <Card 
              sx={{ 
                p: 3, 
                position: 'sticky', 
                top: 20,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                '&:hover': {
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Typography 
                variant="subtitle1" 
                fontWeight="bold" 
                sx={{ 
                  mb: 2, 
                  pb: 1, 
                  borderBottom: '1px solid #e0e0e0',
                  color: '#00503a' 
                }}
              >
                Filter Orders
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography 
                  variant="body2" 
                  fontWeight="medium" 
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  ORDER STATUS
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {orderStatus.map((status) => (
                    <Box 
                      key={status.value} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 1,
                        bgcolor: selectedStatuses.includes(status.value) ? `${status.color}10` : 'transparent',
                        '&:hover': {
                          bgcolor: `${status.color}15`
                        }
                      }}
                    >
                      <input
                        id={status.value}
                        value={status.value}
                        type="checkbox"
                        checked={selectedStatuses.includes(status.value)}
                        onChange={() => handleStatusChange(status.value)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        htmlFor={status.value}
                        style={{ 
                          marginLeft: '10px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: status.color,
                            mr: 1
                          }} 
                        />
                        <Typography 
                          color={selectedStatuses.includes(status.value) ? status.color : "text.secondary"} 
                          variant="body2"
                          fontWeight={selectedStatuses.includes(status.value) ? 600 : 400}
                        >
                          {status.label}
                        </Typography>
                      </label>
                    </Box>
                  ))}
                </Box>
              </Box>
              
              {selectedStatuses.length > 0 && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => setSelectedStatuses([])}
                  sx={{ 
                    mt: 2, 
                    textTransform: 'none',
                    borderColor: '#00503a',
                    color: '#00503a',
                    '&:hover': {
                      borderColor: '#00503a',
                      bgcolor: '#00503a10',
                    }
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Card>
          </Grid>
        )}
        
        {/* Mobile filter drawer */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={toggleDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: '80%',
              maxWidth: '300px',
              p: 2
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#00503a' }}>Filters</Typography>
              <IconButton edge="end" color="inherit" onClick={toggleDrawer}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Typography 
              variant="body2" 
              fontWeight="medium" 
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              ORDER STATUS
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {orderStatus.map((status) => (
                <Box 
                  key={status.value} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 1,
                    bgcolor: selectedStatuses.includes(status.value) ? `${status.color}10` : 'transparent',
                    '&:hover': {
                      bgcolor: `${status.color}15`
                    }
                  }}
                >
                  <input
                    id={`mobile-${status.value}`}
                    value={status.value}
                    type="checkbox"
                    checked={selectedStatuses.includes(status.value)}
                    onChange={() => handleStatusChange(status.value)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor={`mobile-${status.value}`}
                    style={{ 
                      marginLeft: '10px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: status.color,
                        mr: 1
                      }} 
                    />
                    <Typography 
                      color={selectedStatuses.includes(status.value) ? status.color : "text.secondary"} 
                      variant="body2"
                      fontWeight={selectedStatuses.includes(status.value) ? 600 : 400}
                    >
                      {status.label}
                    </Typography>
                  </label>
                </Box>
              ))}
            </Box>
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              {selectedStatuses.length > 0 && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => setSelectedStatuses([])}
                  sx={{ 
                    textTransform: 'none', 
                    flex: 1,
                    borderColor: '#00503a',
                    color: '#00503a',
                  }}
                >
                  Clear Filters
                </Button>
              )}
              <Button 
                variant="contained" 
                size="small" 
                onClick={toggleDrawer}
                sx={{ 
                  textTransform: 'none', 
                  flex: 1,
                  bgcolor: '#00503a',
                  '&:hover': {
                    bgcolor: '#003a29',
                  }
                }}
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Drawer>
        
        {/* Orders grid */}
        <Grid item xs={12} md={9} lg={9.5}>
          {order.loading ? (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              minHeight="300px"
              sx={{ width: '100%' }}
            >
              <CircularProgress sx={{ color: '#00503a' }} />
            </Box>
          ) : order.error ? (
            <Card 
              sx={{ 
                p: 3, 
                bgcolor: 'error.light', 
                borderRadius: 2,
                color: 'error.main',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              }}
            >
              <Typography>{order.error}</Typography>
            </Card>
          ) : filteredOrders && filteredOrders.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {filteredOrders.map((order) => (
                <Box key={order._id}>
                  {order.orderItems && order.orderItems.length > 0 ? (
                    <Card sx={{ 
                      overflow: 'hidden',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}>
                      <Box 
                        sx={{ 
                          p: { xs: 2, sm: 3 }, 
                          bgcolor: '#f8f9fa',
                          borderBottom: '1px solid #e0e0e0',
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            ORDER PLACED
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {formatDate(order.createdAt)}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            TOTAL
                          </Typography>
                          <Typography variant="body2" fontWeight={600} color="#00503a">
                            Tk. {order.totalDiscountedPrice}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                            ORDER #{order._id.substring(order._id.length - 8).toUpperCase()}
                          </Typography>
                          <Chip 
                            label={orderStatus.find(s => s.value === order.orderStatus)?.label || order.orderStatus} 
                            size="small"
                            sx={{ 
                              bgcolor: (orderStatus.find(s => s.value === order.orderStatus)?.color || '#757575') + '15',
                              color: orderStatus.find(s => s.value === order.orderStatus)?.color || '#757575',
                              fontWeight: 'medium',
                              fontSize: '0.7rem',
                              border: '1px solid',
                              borderColor: (orderStatus.find(s => s.value === order.orderStatus)?.color || '#757575') + '30'
                            }}
                          />
                        </Box>
                      </Box>
                      
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: { xs: 2, sm: 3 }
                          }}
                        >
                          {order.orderItems.map((item, index) => (
                            <React.Fragment key={`${order._id}-${item._id}`}>
                              <OrderCard item={item} order={order} />
                              {index < order.orderItems.length - 1 && (
                                <Divider />
                              )}
                            </React.Fragment>
                          ))}
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                          <Button 
                            variant="contained" 
                            onClick={() => navigate(`/account/order/${order._id}`)}
                            sx={{
                              bgcolor: '#00503a',
                              textTransform: 'none',
                              fontWeight: 500,
                              '&:hover': {
                                bgcolor: '#003a29',
                              }
                            }}
                          >
                            View Order Details
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card 
                      sx={{ 
                        p: 3, 
                        bgcolor: 'info.light', 
                        borderRadius: 2,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                      }}
                    >
                      <Typography>No items in this order</Typography>
                    </Card>
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Card 
              sx={{ 
                p: 5, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                borderRadius: 2,
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              }}
            >
              <img 
                src={EmptyOrdersImage} 
                alt="No orders" 
                style={{ 
                  maxWidth: '200px', 
                  marginBottom: '24px',
                  opacity: 0.8 
                }} 
              />
              <Typography variant="h6" fontWeight="medium" color="text.secondary">
                No orders found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: '400px' }}>
                You don&apos;t have any orders yet. Explore our products and place your first order!
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/')}
                sx={{
                  bgcolor: '#00503a',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: '#003a29',
                  }
                }}
              >
                Start Shopping
              </Button>
            </Card>
          )}
        </Grid>
      </Grid>

      <BackdropComponent open={order.loading} />
    </Container>
  );
};

export default Order;
