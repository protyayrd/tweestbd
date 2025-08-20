// ** MUI Imports
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
  TextField,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  Paper
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getDashboardStats } from '../../Redux/Admin/Dashboard/Action';
import ReactApexCharts from 'react-apexcharts';
import DotsVertical from 'mdi-material-ui/DotsVertical';
import MenuUp from 'mdi-material-ui/MenuUp';
import MenuDown from 'mdi-material-ui/MenuDown';
import RefreshIcon from '@mui/icons-material/Refresh';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import LinearProgress from '@mui/material/LinearProgress';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleOutline from 'mdi-material-ui/CheckCircleOutline';
import CloseCircleOutline from 'mdi-material-ui/CloseCircleOutline';
import AlertCircleOutline from 'mdi-material-ui/AlertCircleOutline';
import ClockOutline from 'mdi-material-ui/ClockOutline';
import { Refresh } from 'mdi-material-ui';

// Helper components and functions
const statusIcons = {
  completed: <CheckCircleOutline sx={{ color: 'success.main', fontSize: '1.25rem' }} />,
  failed: <CloseCircleOutline sx={{ color: 'error.main', fontSize: '1.25rem' }} />,
  pending: <ClockOutline sx={{ color: 'warning.main', fontSize: '1.25rem' }} />,
  default: <AlertCircleOutline sx={{ color: 'info.main', fontSize: '1.25rem' }} />
};

// Helper function to get chip color based on status
const getChipColor = (status) => {
  const statusLower = status?.toLowerCase() || '';
  if (statusLower.includes('complet')) return 'success';
  if (statusLower.includes('pending')) return 'warning';
  if (statusLower.includes('fail')) return 'error';
  if (statusLower.includes('refund')) return 'info';
  if (statusLower.includes('cancel')) return 'secondary';
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

// Payment method icons/labels
const paymentMethodLabels = {
  'credit_card': 'Credit Card',
  'debit_card': 'Debit Card',
  'bkash': 'bKash',
  'nagad': 'Nagad',
  'rocket': 'Rocket',
  'cod': 'Cash on Delivery',
  'default': 'Unknown'
};

// Format transaction ID to be more readable
const formatTransactionId = (transactionId) => {
  if (!transactionId) return 'N/A';
  
  // If it includes a timestamp at the end, truncate it
  if (transactionId.includes('-') && transactionId.split('-').length > 2) {
    return transactionId.split('-').slice(0, 2).join('-');
  }
  
  // Otherwise just return first 15 chars
  return transactionId.length > 15 ? `${transactionId.substring(0, 15)}...` : transactionId;
};

const PaymentsPage = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { dashboard } = useSelector((store) => store);
  const [localLoading, setLocalLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  
  // State for filtering and pagination
  const [tabValue, setTabValue] = useState(0);
  const [startDateStr, setStartDateStr] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDateStr, setEndDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  
  // Convert string dates to Date objects when needed
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  
  // Get all payments data
  const allPayments = dashboard.stats?.payments || [];
  const statusSummary = dashboard.stats?.paymentStatusSummary || {};
  
  useEffect(() => {
    // Fetch data when component mounts
    dispatch(getDashboardStats());
  }, [dispatch]);
  
  useEffect(() => {
    // Filter payments when filters change
    filterPayments();
    prepareChartData();
  }, [allPayments, tabValue, startDateStr, endDateStr, statusFilter, methodFilter]);
  
  const handleRefresh = async () => {
    try {
      setLocalLoading(true);
      await dispatch(getDashboardStats());
    } catch (error) {
      console.error('Error refreshing payments data:', error);
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLocalLoading(false);
    }
  };
  
  const filterPayments = () => {
    if (!allPayments.length) return;
    
    let filtered = [...allPayments];
    
    // Filter by date range
    if (startDateStr && endDateStr) {
      const start = startOfDay(new Date(startDateStr));
      const end = endOfDay(new Date(endDateStr));
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return isWithinInterval(paymentDate, { start, end });
      });
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => {
        return payment.status?.toLowerCase() === statusFilter.toLowerCase();
      });
    }
    
    // Filter by method
    if (methodFilter !== 'all') {
      filtered = filtered.filter(payment => {
        return payment.method?.toLowerCase() === methodFilter.toLowerCase();
      });
    }
    
    // Apply tab filters
    if (tabValue === 1) { // Successful payments
      filtered = filtered.filter(payment => payment.status?.toLowerCase() === 'completed');
    } else if (tabValue === 2) { // Failed payments
      filtered = filtered.filter(payment => ['failed', 'cancelled', 'canceled'].includes(payment.status?.toLowerCase()));
    } else if (tabValue === 3) { // Pending payments
      filtered = filtered.filter(payment => payment.status?.toLowerCase() === 'pending');
    }
    
    setFilteredPayments(filtered);
  };
  
  const prepareChartData = () => {
    if (!allPayments.length) return;
    
    // Group payments by date
    const groupedByDate = {};
    
    allPayments.forEach(payment => {
      // Only include payments in date range
      const paymentDate = new Date(payment.createdAt);
      if (startDateStr && endDateStr) {
        const start = startOfDay(new Date(startDateStr));
        const end = endOfDay(new Date(endDateStr));
        if (!isWithinInterval(paymentDate, { start, end })) return;
      }
      
      const dateKey = format(paymentDate, 'yyyy-MM-dd');
      
      // Initialize if doesn't exist
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          count: 0,
          amount: 0,
          completed: 0,
          failed: 0,
          pending: 0
        };
      }
      
      // Update counts
      groupedByDate[dateKey].count += 1;
      groupedByDate[dateKey].amount += parseFloat(payment.amount || 0);
      
      // Update status counts
      const status = payment.status?.toLowerCase();
      if (status === 'completed') {
        groupedByDate[dateKey].completed += 1;
      } else if (['failed', 'cancelled', 'canceled'].includes(status)) {
        groupedByDate[dateKey].failed += 1;
      } else if (status === 'pending') {
        groupedByDate[dateKey].pending += 1;
      }
    });
    
    // Convert to arrays for chart
    const dates = Object.keys(groupedByDate).sort();
    const chartData = {
      dates: dates.map(date => format(new Date(date), 'dd MMM')),
      count: dates.map(date => groupedByDate[date].count),
      amount: dates.map(date => groupedByDate[date].amount),
      completed: dates.map(date => groupedByDate[date].completed),
      failed: dates.map(date => groupedByDate[date].failed),
      pending: dates.map(date => groupedByDate[date].pending)
    };
    
    setDailyData(chartData);
  };
  
  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Chart options for payments
  const paymentsChartOptions = {
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
    colors: [theme.palette.primary.main, theme.palette.success.main, theme.palette.error.main],
    xaxis: {
      categories: dailyData.dates || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: theme.palette.text.secondary
        },
        rotate: -45,
        rotateAlways: dailyData.dates?.length > 7
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
  
  // Chart series for payments amount
  const paymentsAmountSeries = [
    {
      name: 'Total Amount',
      data: dailyData.amount || []
    }
  ];
  
  // Chart series for payments count
  const paymentsCountSeries = [
    {
      name: 'Completed',
      data: dailyData.completed || []
    },
    {
      name: 'Failed',
      data: dailyData.failed || []
    },
    {
      name: 'Pending',
      data: dailyData.pending || []
    }
  ];
  
  // Create a summary of payment status counts
  const statusCounts = Object.entries(statusSummary).map(([status, data]) => ({
    status,
    count: data.count,
    amount: data.amount,
  }));
  
  // Calculate total payments info
  const totalAmount = statusCounts.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalCount = statusCounts.reduce((sum, item) => sum + (item.count || 0), 0);
  const successfulAmount = statusCounts.find(item => item.status.toLowerCase() === 'completed')?.amount || 0;
  const successRate = totalAmount ? Math.round((successfulAmount / totalAmount) * 100) : 0;
  
  const isLoading = dashboard.loading || localLoading;
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
        Payments Management
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Overview Cards */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            boxShadow: '0 6px 16px rgba(0,0,0,0.1)', 
            borderRadius: 3, 
            overflow: 'hidden',
            height: '100%'
          }}>
            <CardHeader
              title="Total Payments"
              titleTypographyProps={{ sx: { fontWeight: 600 } }}
              sx={{ 
                backgroundColor: 'primary.light', 
                color: 'primary.contrastText',
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h3" fontWeight={700} color="primary.main" gutterBottom>
                {formatCurrency(totalAmount)}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Total {totalCount} transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            boxShadow: '0 6px 16px rgba(0,0,0,0.1)', 
            borderRadius: 3, 
            overflow: 'hidden',
            height: '100%'
          }}>
            <CardHeader
              title="Successful Payments"
              titleTypographyProps={{ sx: { fontWeight: 600 } }}
              sx={{ 
                backgroundColor: 'success.light', 
                color: 'success.contrastText',
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h3" fontWeight={700} color="success.main" gutterBottom>
                {formatCurrency(successfulAmount)}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Success rate: {successRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            boxShadow: '0 6px 16px rgba(0,0,0,0.1)', 
            borderRadius: 3, 
            overflow: 'hidden',
            height: '100%'
          }}>
            <CardHeader
              title="Payment Methods"
              titleTypographyProps={{ sx: { fontWeight: 600 } }}
              sx={{ 
                backgroundColor: 'info.light', 
                color: 'info.contrastText',
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {['bkash', 'nagad', 'rocket', 'credit_card', 'debit_card', 'cod'].map(method => (
                  <Chip 
                    key={method}
                    label={paymentMethodLabels[method]}
                    color="primary"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Filters and Date Range Selector */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
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
          
          <FormControl size="small" sx={{ minWidth: 120, ml: 2 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120, ml: 2 }}>
            <InputLabel id="method-filter-label">Method</InputLabel>
            <Select
              labelId="method-filter-label"
              id="method-filter"
              value={methodFilter}
              label="Method"
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <MenuItem value="all">All Methods</MenuItem>
              <MenuItem value="bkash">bKash</MenuItem>
              <MenuItem value="nagad">Nagad</MenuItem>
              <MenuItem value="rocket">Rocket</MenuItem>
              <MenuItem value="credit_card">Credit Card</MenuItem>
              <MenuItem value="debit_card">Debit Card</MenuItem>
              <MenuItem value="cod">Cash on Delivery</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={handleRefresh}
            disabled={isLoading}
            size="small" 
            variant="outlined"
            color="primary"
            sx={{ borderRadius: '8px' }}
          >
            Refresh
          </Button>
          
          <Button 
            startIcon={<DownloadIcon />} 
            size="small" 
            variant="outlined"
            color="primary"
            sx={{ borderRadius: '8px' }}
          >
            Export CSV
          </Button>
        </Box>
      </Paper>
      
      {/* Payment Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 6px 16px rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <CardHeader
              title="Payment Amounts"
              titleTypographyProps={{ sx: { fontWeight: 600 } }}
              sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'primary.lighter' }}
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ReactApexCharts
                  options={paymentsChartOptions}
                  series={paymentsAmountSeries}
                  type="area"
                  height={300}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 6px 16px rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <CardHeader
              title="Payment Counts by Status"
              titleTypographyProps={{ sx: { fontWeight: 600 } }}
              sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'primary.lighter' }}
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ReactApexCharts
                  options={{
                    ...paymentsChartOptions,
                    colors: [theme.palette.success.main, theme.palette.error.main, theme.palette.warning.main]
                  }}
                  series={paymentsCountSeries}
                  type="area"
                  height={300}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Payment List */}
      <Card sx={{ boxShadow: '0 6px 16px rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <CardHeader
          title="Payment Transactions"
          titleTypographyProps={{ sx: { fontWeight: 600 } }}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'primary.lighter' }}
        />
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            aria-label="payment tabs"
          >
            <Tab label="All Payments" />
            <Tab label="Successful" />
            <Tab label="Failed" />
            <Tab label="Pending" />
          </Tabs>
        </Box>
        
        {isLoading && <LinearProgress color="primary" />}
        
        <CardContent sx={{ p: 0 }}>
          {dashboard.error ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error">Error loading payment data: {dashboard.error}</Typography>
              <Button 
                variant="outlined" 
                color="primary"
                size="small"
                onClick={handleRefresh}
                sx={{ mt: 2 }}
              >
                Try Again
              </Button>
            </Box>
          ) : filteredPayments.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="textSecondary">No payments found matching your filters</Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Transaction ID</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPayments
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((payment) => (
                        <TableRow key={payment._id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatTransactionId(payment.transactionId)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {payment.createdAt 
                              ? format(new Date(payment.createdAt), 'dd MMM yyyy, h:mm a') 
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {payment.user?.firstName || 'Unknown'} {payment.user?.lastName || ''}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={paymentMethodLabels[payment.method?.toLowerCase()] || payment.method || 'Unknown'}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={payment.status || 'Unknown'}
                              size="small"
                              color={getChipColor(payment.status)}
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="info"
                              sx={{
                                backgroundColor: 'info.lighter',
                                '&:hover': {
                                  backgroundColor: 'info.light'
                                }
                              }}
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredPayments.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PaymentsPage; 