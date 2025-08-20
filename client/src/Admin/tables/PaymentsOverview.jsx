// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { CircularProgress, Chip, Divider, Grid, Button } from '@mui/material'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getDashboardStats } from '../../Redux/Admin/Dashboard/Action'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import { Link } from 'react-router-dom'
import { DotsVertical, Refresh } from 'mdi-material-ui'
import { format } from 'date-fns'
import LinearProgress from '@mui/material/LinearProgress'

// ** Icons Imports
import MenuUp from 'mdi-material-ui/MenuUp'
import MenuDown from 'mdi-material-ui/MenuDown'
import CheckCircleOutline from 'mdi-material-ui/CheckCircleOutline'
import CloseCircleOutline from 'mdi-material-ui/CloseCircleOutline'
import AlertCircleOutline from 'mdi-material-ui/AlertCircleOutline'
import ClockOutline from 'mdi-material-ui/ClockOutline'

const statusIcons = {
  completed: <CheckCircleOutline sx={{ color: 'success.main', fontSize: '1.25rem' }} />,
  failed: <CloseCircleOutline sx={{ color: 'error.main', fontSize: '1.25rem' }} />,
  pending: <ClockOutline sx={{ color: 'warning.main', fontSize: '1.25rem' }} />,
  default: <AlertCircleOutline sx={{ color: 'info.main', fontSize: '1.25rem' }} />
};

const statusColors = {
  completed: 'success',
  COMPLETED: 'success',
  failed: 'error',
  FAILED: 'error',
  pending: 'warning',
  PENDING: 'warning',
  canceled: 'error',
  CANCELLED: 'error',
  CANCELED: 'error',
  refunded: 'secondary',
  REFUNDED: 'secondary',
  default: 'info'
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

const PaymentsOverview = () => {
  const dispatch = useDispatch();
  const { dashboard } = useSelector((store) => store);
  const [localLoading, setLocalLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  
  // Manual refresh handler
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
  
  useEffect(() => {
    console.log('PaymentsOverview state:', {
      loading: dashboard.loading,
      error: dashboard.error,
      paymentsAvailable: !!dashboard.stats?.payments,
      recentPaymentsAvailable: !!dashboard.stats?.recentPayments,
      paymentCount: dashboard.stats?.payments?.length || 0,
      recentPaymentCount: dashboard.stats?.recentPayments?.length || 0
    });
  }, [dashboard]);

  // Extract payments summary data from the dashboard state
  const statusSummary = dashboard.stats?.paymentStatusSummary || {};
  const payments = dashboard.stats?.payments || [];
  const recentPayments = dashboard.stats?.recentPayments || [];
  
  // Create a summary of payment status counts
  const statusCounts = Object.entries(statusSummary).map(([status, data]) => ({
    status,
    count: data.count,
    amount: data.amount,
  }));
  
  
  const isLoading = dashboard.loading || localLoading;
  
  return (
    <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' }}>
      <CardHeader
        title='Payments Overview'
        titleTypographyProps={{ variant: 'h6', sx: { fontWeight: 600 } }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isLoading && <CircularProgress size={24} sx={{ mr: 2 }} />}
            <Button 
              startIcon={<Refresh />} 
              onClick={handleRefresh}
              disabled={isLoading}
              size="small" 
              variant="outlined"
              color="primary"
              sx={{ borderRadius: '8px' }}
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
          <Typography variant="body1">Error loading payment data: {dashboard.error}</Typography>
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
      
      <CardContent>
        {!dashboard.error && (
          <>
            {statusCounts.length > 0 ? (
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {statusCounts.map((item) => (
                  <Grid item xs={6} md={3} key={item.status}>
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
                <Typography color="textSecondary">No payment summaries available</Typography>
              </Box>
            )}

            <Divider sx={{ mb: 4 }} />

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Recent Payments
            </Typography>

            {recentPayments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">No recent payments found</Typography>
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
                      <TableCell>Transaction ID</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentPayments.map((payment) => (
                      <TableRow 
                        hover 
                        key={payment._id}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell>{formatTransactionId(payment.transactionId)}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          {payment.createdAt 
                            ? format(new Date(payment.createdAt), 'dd MMM yyyy') 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payment.status || 'Unknown'}
                            size="small"
                            color={getChipColor(payment.status)}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            {payments.length > 0 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Showing {recentPayments.length} of {payments.length} total payments
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default PaymentsOverview 