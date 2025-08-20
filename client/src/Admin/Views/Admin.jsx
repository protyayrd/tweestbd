// ** MUI Imports
import Grid from "@mui/material/Grid";
import AdminPannel from "../../Styles/AdminPannelWrapper";
import CardStatsVertical from "../../Styles/CardStatsVertical";
import CustomersTable from "../tables/CustomersTable";
import { ThemeProvider } from "@mui/material";
import { customTheme } from "../them/customeThem";
import "./Admin.css";
import RecentlyAddeddProducts from "../tables/RecentlyAddeddProducts";
import OrdersOverview from "../tables/OrdersOverview";
import PaymentsOverview from "../tables/PaymentsOverview";
import { useEffect, useState } from "react";
import { getDashboardStats, clearDashboardError } from "../../Redux/Admin/Dashboard/Action";
import { Box, Button, CircularProgress, Typography, Card, CardContent, Divider, Paper } from "@mui/material";
import api from "../../config/api";
import { MenuUp, MenuDown, CurrencyUsd, ShoppingOutline, AccountOutline, CashMultiple, AlertCircleOutline } from "mdi-material-ui";
import { useDispatch, useSelector } from "react-redux";

// bg-[#28243d]
const Dashboard = () => {
  const { dashboard } = useSelector((store) => store);
  const dispatch = useDispatch();
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugResponse, setDebugResponse] = useState(null);
  
  useEffect(() => {
    dispatch(getDashboardStats())
      .then(result => {
      })
      .catch(error => {
        console.error('Error fetching dashboard stats from component:', error);
      });
  }, [dispatch]);
  
  // Manual debug fetch function
  const handleDebugFetch = async () => {
    try {
      setDebugLoading(true);
      setDebugResponse(null);
      
      const jwt = localStorage.getItem("jwt");
      
      if (!jwt) {
        setDebugResponse({
          error: "No JWT token found in localStorage. Please log in again.",
          recommendation: "Try logging out and logging back in to refresh your token."
        });
        return;
      }
      
      // Direct API call to test payments endpoint
      try {
        const paymentsResponse = await api.get('/api/payments', {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });
        
        if (paymentsResponse.data) {
          setDebugResponse({
            status: paymentsResponse.status,
            endpoint: '/api/payments',
            dataAvailable: true,
            totalPayments: paymentsResponse.data.payments?.length || 0,
            paymentData: paymentsResponse.data.payments ? 
              JSON.stringify(paymentsResponse.data.payments[0], null, 2).substring(0, 200) + '...' : 
              'No payment data'
          });
        } else {
          setDebugResponse({
            status: paymentsResponse.status,
            endpoint: '/api/payments',
            dataAvailable: false,
            error: "Response received but no data was returned"
          });
        }
      } catch (error) {
        console.error('Error testing payments endpoint:', error);
        setDebugResponse({
          endpoint: '/api/payments',
          error: error.message,
          status: error.response?.status,
          recommendation: error.response?.status === 404 ? 
            "The payments endpoint appears to be incorrect or not available. Check server routes configuration." : 
            "Check your network connection and server status."
        });
        return;
      }
      
      // Now try to fetch through redux
      try {
        await dispatch(getDashboardStats());
      } catch (reduxError) {
        console.error('Error in Redux fetch:', reduxError);
      }
      
    } catch (error) {
      console.error('Error in debug fetch:', error);
      setDebugResponse({
        error: error.message,
        stack: error.stack
      });
    } finally {
      setDebugLoading(false);
    }
  };
  
  // Function to clear Redux error and try fetching again
  const handleClearErrorAndRefresh = () => {
    // Reset Redux error state
    dispatch(clearDashboardError());
    // Fetch data again
    dispatch(getDashboardStats());
  };
  
  // Format numbers for display in stat cards
  const formatNumber = (num) => {
    if (!num) return 0;
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0).replace('BDT', 'Tk');
  };
  
  return (
    <div className="adminContainer">
      <ThemeProvider theme={customTheme}>
        <AdminPannel>
          {/* Page Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
              Dashboard Overview
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Box>
        
          {/* Status banner for connection state */}
          {(debugResponse || dashboard.error) && (
            <Paper sx={{ 
              mb: 4, 
              p: 2, 
              bgcolor: dashboard.error ? 'error.lighter' : 'info.lighter', 
              color: dashboard.error ? 'error.dark' : 'info.dark',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AlertCircleOutline sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {dashboard.error ? 'Connection Error' : 'System Status'}
                  </Typography>
                  <Typography variant="body2">
                    {dashboard.error 
                      ? `Error: ${dashboard.error}` 
                      : debugResponse ? 'API connection is active' : 'Dashboard is loading data...'}
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="contained" 
                color={dashboard.error ? "error" : "info"}
                size="small"
                onClick={handleClearErrorAndRefresh}
                sx={{ 
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
                  }
                }}
              >
                Refresh Connection
              </Button>
            </Paper>
          )}
          
          <Grid container spacing={4}>
            {/* Top Stats Row */}
            <Grid item xs={12} md={3}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                boxShadow: '0 6px 16px rgba(0,0,0,0.1)', 
                borderRadius: 3, 
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, #f3fdf3 0%, #e0f7e0 100%)',
                '&:hover': { 
                  transform: 'translateY(-8px)', 
                  boxShadow: '0 12px 24px rgba(0,0,0,0.12)'
                } 
              }}>
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  pb: 1
                }}>
                  <Typography variant="h6" fontWeight={600} color="success.dark">Total Revenue</Typography>
                  <Box sx={{ 
                    backgroundColor: 'success.main', 
                    borderRadius: '50%',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <CurrencyUsd />
                  </Box>
                </Box>
                <CardContent sx={{ flex: 1, p: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="success.dark">
                    {formatCurrency(dashboard.stats.totalOrdersRevenue || 0)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {(dashboard.stats.orderRevenueGrowth > 0) ? (
                      <MenuUp sx={{ color: 'success.main' }} />
                    ) : (
                      <MenuDown sx={{ color: 'error.main' }} />
                    )}
                    <Typography variant="body2" color={dashboard.stats.orderRevenueGrowth > 0 ? 'success.main' : 'error.main'}>
                      {dashboard.stats.orderRevenueGrowth > 0 ? '+' : ''}{dashboard.stats.orderRevenueGrowth}% vs last month
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                boxShadow: '0 6px 16px rgba(0,0,0,0.1)', 
                borderRadius: 3, 
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, #f2f8fd 0%, #e0f0fa 100%)',
                '&:hover': { 
                  transform: 'translateY(-8px)', 
                  boxShadow: '0 12px 24px rgba(0,0,0,0.12)'
                } 
              }}>
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  pb: 1
                }}>
                  <Typography variant="h6" fontWeight={600} color="info.dark">Total Orders</Typography>
                  <Box sx={{ 
                    backgroundColor: 'info.main', 
                    borderRadius: '50%',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <ShoppingOutline />
                  </Box>
                </Box>
                <CardContent sx={{ flex: 1, p: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="info.dark">
                    {formatNumber(dashboard.stats.totalSales || 0)}
                  </Typography>
                  <Typography variant="body2" color="info.dark" mt={1} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box component="span" sx={{ 
                      backgroundColor: 'info.lighter',
                      color: 'info.dark',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      mr: 1
                    }}>
                      {dashboard.stats.monthlySales || 0}
                    </Box>
                    new orders this month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                boxShadow: '0 6px 16px rgba(0,0,0,0.1)', 
                borderRadius: 3, 
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, #fffaf2 0%, #fff2e0 100%)',
                '&:hover': { 
                  transform: 'translateY(-8px)', 
                  boxShadow: '0 12px 24px rgba(0,0,0,0.12)'
                } 
              }}>
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  pb: 1
                }}>
                  <Typography variant="h6" fontWeight={600} color="warning.dark">Customers</Typography>
                  <Box sx={{ 
                    backgroundColor: 'warning.main', 
                    borderRadius: '50%',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <AccountOutline />
                  </Box>
                </Box>
                <CardContent sx={{ flex: 1, p: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="warning.dark">
                    {formatNumber(dashboard.stats.totalCustomers || 0)}
                  </Typography>
                  <Typography variant="body2" color="warning.dark" mt={1}>
                    Active customer base
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                boxShadow: '0 6px 16px rgba(0,0,0,0.1)', 
                borderRadius: 3, 
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, #f5f2fd 0%, #eee0fa 100%)',
                '&:hover': { 
                  transform: 'translateY(-8px)', 
                  boxShadow: '0 12px 24px rgba(0,0,0,0.12)'
                } 
              }}>
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  pb: 1
                }}>
                  <Typography variant="h6" fontWeight={600} color="primary.dark">Payments</Typography>
                  <Box sx={{ 
                    backgroundColor: 'primary.main', 
                    borderRadius: '50%',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <CashMultiple />
                  </Box>
                </Box>
                <CardContent sx={{ flex: 1, p: 2 }}>
                  <Typography variant="h4" fontWeight={700} color="primary.dark">
                    {formatCurrency(dashboard.stats.totalPaymentsRevenue || 0)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {(dashboard.stats.paymentRevenueGrowth > 0) ? (
                      <MenuUp sx={{ color: 'success.main' }} />
                    ) : (
                      <MenuDown sx={{ color: 'error.main' }} />
                    )}
                    <Typography variant="body2" color={dashboard.stats.paymentRevenueGrowth > 0 ? 'success.main' : 'error.main'}>
                      {dashboard.stats.paymentRevenueGrowth > 0 ? '+' : ''}{dashboard.stats.paymentRevenueGrowth}% vs last month
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Main Panels */}
            <Grid item xs={12} md={6}>
              <OrdersOverview />
            </Grid>
            <Grid item xs={12} md={6}>
              <PaymentsOverview />
            </Grid>
            <Grid item xs={12} md={6} lg={5}>
              <CustomersTable />
            </Grid>
            <Grid item xs={12} md={6} lg={7}>
              <RecentlyAddeddProducts />
            </Grid>
          </Grid>
        </AdminPannel>
      </ThemeProvider>
    </div>
  );
};

export default Dashboard;
