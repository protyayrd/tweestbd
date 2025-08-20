import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Typography,
  Chip,
  useTheme,
  Button,
  TextField
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getDashboardStats } from '../../Redux/Admin/Dashboard/Action';
import ReactApexCharts from 'react-apexcharts';
import DotsVertical from 'mdi-material-ui/DotsVertical';
import MenuUp from 'mdi-material-ui/MenuUp';
import MenuDown from 'mdi-material-ui/MenuDown';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Link } from 'react-router-dom';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import LinearProgress from '@mui/material/LinearProgress';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const statusColors = {
  PENDING: 'warning',
  pending: 'warning',
  CONFIRMED: 'info',
  confirmed: 'info',
  SHIPPED: 'primary',
  shipped: 'primary',
  DELIVERED: 'success',
  delivered: 'success',
  CANCELLED: 'error',
  cancelled: 'error',
  CANCELED: 'error',
  canceled: 'error',
  default: 'default'
};

// Helper function to get chip color based on status
const getChipColor = (status) => {
  const statusLower = status?.toLowerCase() || '';
  if (statusLower.includes('delivered')) return 'success';
  if (statusLower.includes('confirmed')) return 'info';
  if (statusLower.includes('placed')) return 'primary';
  if (statusLower.includes('pending')) return 'warning';
  if (statusLower.includes('cancel')) return 'error';
  if (statusLower.includes('return')) return 'secondary';
  return 'default';
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

const OrdersOverview = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { dashboard } = useSelector((store) => store);
  const [localLoading, setLocalLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  
  // Date range state - using strings instead of Date objects for simplicity
  const [startDateStr, setStartDateStr] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDateStr, setEndDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filteredWeeklySalesData, setFilteredWeeklySalesData] = useState([]);
  const [filteredWeeklyRevenueData, setFilteredWeeklyRevenueData] = useState([]);
  const [dateCategories, setDateCategories] = useState(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  
  // Convert string dates to Date objects when needed
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  
  useEffect(() => {
    setDebugInfo({
      loading: dashboard.loading,
      error: dashboard.error,
      hasOrderStatusData: !!dashboard.stats?.orderStatusSummary,
      summaryKeys: dashboard.stats?.orderStatusSummary ? Object.keys(dashboard.stats.orderStatusSummary) : []
    });
  }, [dashboard]);
  
  useEffect(() => {
    if (startDateStr && endDateStr) {
      // Filter data based on date range
      filterDataByDateRange(new Date(startDateStr), new Date(endDateStr));
    }
  }, [startDateStr, endDateStr, dashboard.stats]);
  
  const filterDataByDateRange = (start, end) => {
    // If data isn't available yet, don't do anything
    if (!dashboard.stats?.dailyOrdersData) return;
    
    const dateRange = eachDayOfInterval({ start, end });
    
    // Convert dates to formatted strings for comparison
    const dateStrings = dateRange.map(date => format(date, 'yyyy-MM-dd'));
    
    // Create filtered data arrays with 0 as default for dates not in the data
    const filteredSales = dateRange.map(date => 
      dashboard.stats.dailyOrdersData[date]?.count || 0
    );
    
    const filteredRevenue = dateRange.map(date => 
      dashboard.stats.dailyOrdersData[date]?.amount || 0
    );
    
    // Create date labels for x-axis
    const formattedDates = dateRange.map(date => format(date, 'dd MMM'));
    
    setFilteredWeeklySalesData(filteredSales);
    setFilteredWeeklyRevenueData(filteredRevenue);
    setDateCategories(formattedDates);
  };
  
  const handleRefresh = async () => {
    try {
      setLocalLoading(true);
      await dispatch(getDashboardStats());
    } catch (error) {
      console.error('Error refreshing orders data:', error);
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLocalLoading(false);
    }
  };
  
  // Get total revenue with fallback
  const totalOrdersRevenue = dashboard.stats?.totalPaymentsRevenue || 0;
  
  const revenueGrowth = parseFloat(dashboard.stats?.paymentRevenueGrowth || 0);
  const isPositiveGrowth = revenueGrowth >= 0;
  
  const orderStatusSummary = dashboard.stats?.orderStatusSummary || {};
  
  // Weekly orders and revenue data series with fallbacks
  const weeklySalesData = dashboard.stats?.weeklySalesData || [0, 0, 0, 0, 0, 0, 0];
  const weeklyRevenueData = dashboard.stats?.weeklyRevenueData || [0, 0, 0, 0, 0, 0, 0];
  
  // Get total sales and monthly sales with fallbacks
  const totalSales = dashboard.stats?.totalSales || 0;
  const monthlySales = dashboard.stats?.monthlySales || 0;
  
  // Chart options for weekly orders
  const weeklyOrdersOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      sparkline: { enabled: false },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.1,
        stops: [0, 95, 100]
      }
    },
    dataLabels: { enabled: false },
    colors: [theme.palette.primary.main, theme.palette.success.main],
    xaxis: {
      categories: dateCategories.length > 0 ? dateCategories : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: theme.palette.text.secondary
        },
        rotate: -45,
        rotateAlways: dateCategories.length > 7
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: theme.palette.text.secondary
        },
        formatter: (value) => formatCurrency(value)
      }
    },
    grid: {
      show: true,
      borderColor: theme.palette.divider,
      strokeDashArray: 5,
      xaxis: { lines: { show: true } },
      padding: { top: 5, right: 20 }
    },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      y: {
        formatter: (value) => formatCurrency(value)
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: theme.palette.text.secondary
      }
    }
  };
  
  // Weekly orders and revenue data series
  const weeklyOrdersSeries = [
    {
      name: 'Orders',
      data: filteredWeeklySalesData.length > 0 ? filteredWeeklySalesData : weeklySalesData
    },
    {
      name: 'Payment Amount',
      data: filteredWeeklyRevenueData.length > 0 ? filteredWeeklyRevenueData : weeklyRevenueData
    }
  ];
  
  // Extract order status data from the dashboard state
  const statusSummary = dashboard.stats?.orderStatusSummary || {};
  
  // Create a summary of order status counts
  const statusCounts = Object.entries(statusSummary).map(([status, data]) => ({
    status,
    count: data.count,
    amount: data.amount,
  }));
  
  
  const isLoading = dashboard.loading || localLoading;
  
  // Get recent orders data
  const recentOrders = dashboard.stats?.recentOrders || [];
  
  return (
    <Card sx={{ boxShadow: '0 6px 16px rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' }}>
      <CardHeader
        title="Orders Overview"
        titleTypographyProps={{ sx: { lineHeight: '1.6 !important', letterSpacing: '0.15px !important', fontWeight: 600 } }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isLoading && <CircularProgress size={24} sx={{ mr: 2 }} />}
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={handleRefresh}
              disabled={isLoading}
              size="small" 
              variant="outlined"
              color="primary"
              sx={{ borderRadius: '8px', mr: 1 }}
            >
              Refresh
            </Button>
            <IconButton size='small' aria-label='settings' sx={{ color: 'text.secondary' }}>
              <DotsVertical />
            </IconButton>
          </Box>
        }
        sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'primary.light', color: 'primary.contrastText' }}
      />
      
      {isLoading && <LinearProgress color="primary" />}
      
      {dashboard.error && (
        <Box sx={{ p: 2, textAlign: 'center', color: 'error.main' }}>
          <Typography variant="body1">Error loading order data: {dashboard.error}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="small"
            onClick={handleRefresh}
            sx={{ mt: 1, borderRadius: '8px' }}
          >
            Try Again
          </Button>
        </Box>
      )}
      
      {debugInfo && (
        <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1, mx: 2, mb: 2 }}>
          <Typography variant="subtitle2">Debug Info:</Typography>
          <Typography variant="body2">Error: {debugInfo.error}</Typography>
          <Typography variant="body2">Time: {debugInfo.timestamp}</Typography>
        </Box>
      )}
      
      <CardContent sx={{ pt: theme => `${theme.spacing(1.5)} !important` }}>
        {!dashboard.error && (
          <>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant='h4' sx={{ fontWeight: 700, fontSize: '2.5rem !important', color: 'primary.main' }}>
                  {formatCurrency(totalOrdersRevenue)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', color: isPositiveGrowth ? 'success.main' : 'error.main' }}>
                  {isPositiveGrowth ? (
                    <MenuUp sx={{ fontSize: '1.5rem', verticalAlign: 'middle' }} />
                  ) : (
                    <MenuDown sx={{ fontSize: '1.5rem', verticalAlign: 'middle' }} />
                  )}
                  <Typography variant='body2' sx={{ fontWeight: 600, color: isPositiveGrowth ? 'success.main' : 'error.main' }}>
                    {Math.abs(revenueGrowth)}% from previous month
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant='body2' color="text.secondary">
                  Total Orders: <strong>{totalSales}</strong>
                </Typography>
                <Typography variant='body2' color="text.secondary">
                  Monthly Orders: <strong>{monthlySales}</strong>
                </Typography>
              </Box>
            </Box>
            
            <Typography component='p' variant='caption' sx={{ mb: 3 }}>
              Compared to previous month
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                Orders & Payments Overview
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <TextField
                    label="Start Date"
                    type="date"
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    size="small"
                    sx={{ width: 150 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <TextField
                    label="End Date"
                    type="date"
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    size="small"
                    sx={{ width: 150 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <Button 
                  component={Link} 
                  to="/admin/orders" 
                  size="small" 
                  variant="outlined"
                  color="primary"
                  sx={{ borderRadius: '8px' }}
                >
                  View All
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ height: 300, mb: 4 }}>
              <ReactApexCharts 
                options={weeklyOrdersOptions} 
                series={weeklyOrdersSeries} 
                type='area'
                height={300}
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
              Order Status Summary
            </Typography>
            
            {statusCounts.length > 0 ? (
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {statusCounts.map((item) => (
                  <Grid item xs={6} md={4} key={item.status}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexDirection: 'column',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 2,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                        {formatCurrency(item.amount)}
                      </Typography>
                      <Chip
                        label={`${item.status.toUpperCase()} (${item.count})`}
                        color={getChipColor(item.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize', fontWeight: 500 }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">No order status data available</Typography>
              </Box>
            )}
            
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant='body2' color="text.secondary">
                Total Orders: <strong>{totalSales}</strong> | 
                Monthly Orders: <strong>{monthlySales}</strong>
              </Typography>
            </Box>
            
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Recent Orders
            </Typography>
            
            {recentOrders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">No recent orders found</Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small"
                  onClick={handleRefresh}
                  sx={{ mt: 1, borderRadius: '8px' }}
                >
                  Refresh Data
                </Button>
              </Box>
            ) : (
              <TableContainer sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <Table>
                  <TableHead sx={{ backgroundColor: 'background.default' }}>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow 
                        hover 
                        key={order._id}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {order._id ? (order.formattedOrderId || order._id.substring(0, 8) + '...') : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {order.user?.firstName || 'Unknown'} {order.user?.lastName || ''}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(order.totalPrice)}</TableCell>
                        <TableCell>
                          {order.createdAt 
                            ? format(new Date(order.createdAt), 'dd MMM yyyy') 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.orderStatus || 'Unknown'}
                            size="small"
                            color={getChipColor(order.orderStatus)}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            {totalSales > 0 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Showing {recentOrders.length} of {totalSales} total orders
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersOverview; 