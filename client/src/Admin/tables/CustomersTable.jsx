// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import TableContainer from '@mui/material/TableContainer'
import { Avatar, Button, CardContent, CardHeader, CircularProgress, IconButton } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getAllCustomers } from '../../Redux/Admin/User/Action'
import DotsVertical from 'mdi-material-ui/DotsVertical'
import { Refresh, AccountDetails } from 'mdi-material-ui'

const CustomersTable = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { adminCustomers } = useSelector((store) => store);
  
  useEffect(() => {
    dispatch(getAllCustomers())
      .then(() => {
      })
      .catch(error => {
        console.error('Error in getAllCustomers dispatch:', error);
      });
  }, [dispatch]);

  useEffect(() => {
    // Debug logging to check the state
    console.log('CustomersTable state:', {
      loading: adminCustomers.loading,
      error: adminCustomers.error,
      customersCount: adminCustomers.customers?.length || 0,
      customersData: adminCustomers.customers?.slice(0, 1) || []
    });
  }, [adminCustomers]);

  const handleRefresh = () => {
    dispatch(getAllCustomers())
      .then(() => {
      })
      .catch(error => {
        console.error('Error in manual refresh:', error);
      });
  };

  return (
    <Card sx={{ 
      boxShadow: '0 6px 16px rgba(0,0,0,0.1)', 
      borderRadius: 3, 
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      height: '100%',
      display: 'flex',
      flexDirection: 'column', 
      '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 24px rgba(0,0,0,0.12)' } 
    }}>
      <CardHeader
        title='New Customers'
        titleTypographyProps={{
          sx: { lineHeight: '1.2rem !important', letterSpacing: '0.15px !important', fontWeight: 600 }
        }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {adminCustomers.loading && <CircularProgress size={20} sx={{ mr: 1 }} />}
            <IconButton size='small' onClick={handleRefresh} sx={{ color: 'text.secondary', mr: 1 }}>
              <Refresh />
            </IconButton>
            <IconButton size='small' aria-label='settings' className='card-more-options' sx={{ color: 'text.secondary' }}>
              <DotsVertical />
            </IconButton>
          </Box>
        }
        sx={{ 
          borderBottom: '1px solid', 
          borderColor: 'divider', 
          backgroundColor: 'warning.light', 
          color: 'warning.contrastText' 
        }}
      />
      <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TableContainer sx={{ flex: 1 }}>
          {adminCustomers.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : adminCustomers.error ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="error" sx={{ mb: 2 }}>Error loading customers: {adminCustomers.error}</Typography>
              <Typography color="textSecondary" sx={{ mb: 2 }}>
                Please check if the API server is running and the endpoint is correctly configured.
              </Typography>
              <Button variant="outlined" color="primary" onClick={handleRefresh}>
                Try Again
              </Button>
            </Box>
          ) : (
            <Table aria-label='customers table'>
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 600, backgroundColor: 'background.default' } }}>
                  <TableCell>Image</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {adminCustomers.customers?.slice(0, 5).map(customer => (
                  <TableRow 
                    hover 
                    key={customer._id} 
                    sx={{ 
                      '&:last-of-type td, &:last-of-type th': { border: 0 },
                      transition: 'background-color 0.2s',
                      '&:hover': { 
                        backgroundColor: 'background.default'
                      }
                    }}
                  >
                    <TableCell>
                      <Avatar 
                        alt={customer.firstName || 'User'} 
                        src={customer.profilePicture || ''}
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          border: '2px solid white'
                        }}
                      >
                        {customer.firstName ? customer.firstName.charAt(0) : 'U'}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Typography sx={{ 
                        fontWeight: 600, 
                        fontSize: '0.875rem !important', 
                        color: 'text.primary' 
                      }}>
                        {`${customer.firstName || ''} ${customer.lastName || ''}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                        {customer.email}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => navigate(`/admin/customers`)}
                        sx={{
                          backgroundColor: 'warning.lighter',
                          '&:hover': {
                            backgroundColor: 'warning.light'
                          }
                        }}
                      >
                        <AccountDetails fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {(!adminCustomers.customers || adminCustomers.customers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 5 }}>
                      <Typography variant="body1" sx={{ mb: 2 }}>No customers found</Typography>
                      <Button variant="outlined" onClick={handleRefresh}>Refresh Data</Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </CardContent>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'center', 
        borderTop: '1px solid', 
        borderColor: 'divider',
        backgroundColor: 'background.default'
      }}>
        <Button 
          fullWidth 
          variant="contained" 
          color="warning"
          onClick={() => navigate('/admin/customers')}
          sx={{ 
            borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            py: 1,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
            }
          }}
        >
          View All Customers
        </Button>
      </Box>
    </Card>
  )
}

export default CustomersTable
