import { 
  Avatar, 
  Box, 
  Button,
  Card, 
  CardContent,
  CardHeader, 
  Chip, 
  CircularProgress,
  IconButton,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography 
} from '@mui/material'

import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { findProducts } from '../../Redux/Customers/Product/Action'
import DotsVertical from 'mdi-material-ui/DotsVertical'
import { Refresh, Eye } from 'mdi-material-ui'

// Update this to add more relevant categories if needed
const CATEGORIES = [
  { id: "mens_kurta", label: "Men's Kurta" },
  { id: "mens_shoes", label: "Men's Shoes" },
  { id: "lengha_choli", label: "Lengha Choli" },
  { id: "saree", label: "Saree" },
  { id: "dress", label: "Dress" },
  { id: "womens_gowns", label: "Women's Gowns" },
  { id: "womens_kurtas", label: "Women's Kurtas" }
];

// Format currency helper
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0).replace('BDT', 'Tk');
};

// Function to get category display name
const getCategoryName = (categoryId) => {
  const category = CATEGORIES.find(cat => cat.id === categoryId);
  return category ? category.label : categoryId;
};

// Function to get the first color's first image or fallback to product image
const getProductImage = (product) => {
  // If product has colors array with images, get first color's first image
  if (product.color && product.color.length > 0 && 
      product.color[0].images && product.color[0].images.length > 0) {
    return product.color[0].images[0];
  }
  
  // Otherwise, use the main product image
  return product.imageUrl;
};

const RecentlyAddedProducts = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { customersProduct } = useSelector((store) => store);

    useEffect(() => {
        dispatch(findProducts({
            category: "",
            colors: [],
            sizes: [],
            minPrice: 0,
            maxPrice: 100000,
            minDiscount: 0,
            sort: "createdAt_desc", // Sort by newest first
            pageNumber: 1,
            pageSize: 5
        }));
    }, [dispatch]);

    const handleRefresh = () => {
      dispatch(findProducts({
          category: "",
          colors: [],
          sizes: [],
          minPrice: 0,
          maxPrice: 100000,
          minDiscount: 0,
          sort: "createdAt_desc",
          pageNumber: 1,
          pageSize: 5
      }));
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
        title='Recently Added Products'
        titleTypographyProps={{
          sx: { lineHeight: '1.2rem !important', letterSpacing: '0.15px !important', fontWeight: 600 }
        }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {customersProduct.loading && <CircularProgress size={20} sx={{ mr: 1 }} />}
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
          backgroundColor: 'primary.light', 
          color: 'primary.contrastText' 
        }}
      />
      <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TableContainer sx={{ flex: 1 }}>
          {customersProduct.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : customersProduct.error ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="error" sx={{ mb: 2 }}>
                Error loading products: {customersProduct.error}
              </Typography>
              <Button variant="outlined" color="primary" onClick={handleRefresh}>
                Try Again
              </Button>
            </Box>
          ) : (
            <Table aria-label='table in dashboard'>
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 600, backgroundColor: 'background.default' } }}>
                  <TableCell>Image</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customersProduct?.products?.content?.slice(0,5).map(item => (
                  <TableRow 
                    hover 
                    key={item._id} 
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
                        alt={item.title} 
                        src={getProductImage(item)}
                        variant="rounded"
                        sx={{ 
                          width: 50, 
                          height: 50, 
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          borderRadius: '8px'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: theme => `${theme.spacing(0.5)} !important` }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem !important' }}>{item.title}</Typography>
                        <Typography variant='caption' sx={{ color: 'text.secondary' }}>{item.brand}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getCategoryName(item.category)}
                        size="small"
                        sx={{ 
                          backgroundColor: 'primary.lighter', 
                          color: 'primary.dark',
                          fontWeight: 500,
                          borderRadius: '6px'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {formatCurrency(item.discountedPrice)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.quantity} 
                        size="small" 
                        color={item.quantity > 10 ? 'success' : item.quantity > 0 ? 'warning' : 'error'}
                        sx={{ 
                          fontWeight: 500, 
                          minWidth: '60px',
                          '& .MuiChip-label': {
                            padding: '0 8px'
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/admin/product/${item._id}`)}
                        sx={{
                          backgroundColor: 'primary.lighter',
                          '&:hover': {
                            backgroundColor: 'primary.light'
                          }
                        }}
                      >
                        <Eye fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {(!customersProduct?.products?.content || customersProduct?.products?.content.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5 }}>
                      <Typography variant="body1" sx={{ mb: 2 }}>No products found</Typography>
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
          onClick={() => navigate('/admin/products')}
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
          View All Products
        </Button>
      </Box>
    </Card>
  )
}

export default RecentlyAddedProducts