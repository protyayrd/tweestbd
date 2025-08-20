import {
  Box,
  Button,
  Card,
  CardHeader,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  Switch,
  TextField,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  InputAdornment
} from "@mui/material";

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deleteProduct, findProducts, updateProduct } from "../../../Redux/Customers/Product/Action";
import { getCategories } from "../../../Redux/Admin/Category/Action";
import { selectCustomerProducts, selectCategories } from "../../../Redux/Customers/Product/Action";
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import { getImageUrl, API_BASE_URL } from '../../../config/api';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SortIcon from '@mui/icons-material/Sort';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';

const ProductsTable = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Use specific selectors instead of whole state
  const customersProduct = useSelector(selectCustomerProducts);
  const category = useSelector(selectCategories);
  const loading = useSelector(state => state.customersProduct?.loading);
  const error = useSelector(state => state.customersProduct?.error);
  
  const [pageSize, setPageSize] = useState(10);
  const [gridPage, setGridPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    colors: [],
    sizes: [],
    minPrice: "",
    maxPrice: "",
    minDiscount: "",
    stock: "",
    sort: "",
  });

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const page = searchParams.get("page");
    const currentPage = Math.max(1, parseInt(page) || 1);
    
    // Add category and other filters to the request
    const filters = {
      pageNumber: currentPage,
      pageSize: pageSize,
      category: searchParams.get("category") || "",
      stock: searchParams.get("stock") || "",
      sort: searchParams.get("sort") || "",
      search: searchTerm || ""
    };

    dispatch(findProducts(filters));
  }, [dispatch, location.search, pageSize, searchTerm]);

  const handlePaginationChange = (event, value) => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("page", value);
    window.history.pushState({}, "", newUrl);
    
    dispatch(findProducts({
      pageNumber: value,
      pageSize: pageSize,
      search: searchTerm
    }));
  };

  const handlePageSizeChange = (event) => {
    setPageSize(event.target.value);
  };

  const handleFilterChange = (e, sectionId) => {
    const value = e.target.value;
    setFilters((values) => ({ ...values, [sectionId]: value }));
    
    const newSearchParams = new URLSearchParams(location.search);
    if (value) {
      newSearchParams.set(sectionId, value);
    } else {
      newSearchParams.delete(sectionId);
    }
    
    navigate({ search: newSearchParams.toString() ? `?${newSearchParams.toString()}` : "" });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(findProducts({
      pageNumber: 1,
      pageSize: pageSize,
      search: searchTerm
    }));
  };

  const handleDeleteProduct = (productId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (confirmDelete) {
      dispatch(deleteProduct(productId))
        .then(() => {
          dispatch(findProducts({
            pageNumber: 1,
            pageSize: pageSize,
            search: searchTerm
          }));
        });
    }
  };

  const handleNewArrivalToggle = async (event, productId) => {
    try {
      const updatedProduct = {
        isNewArrival: event.target.checked
      };
      await dispatch(updateProduct({ productId, ...updatedProduct }));
      dispatch(findProducts({
        pageNumber: 1,
        pageSize: pageSize,
        search: searchTerm
      }));
    } catch (error) {
      console.error('Error updating new arrival status:', error);
    }
  };

  const handleRefresh = () => {
    dispatch(findProducts({
      pageNumber: 1,
      pageSize: pageSize,
      search: searchTerm
    }));
  };

  const level1Categories = category?.categories?.filter(cat => cat.level === 1) || [];
  const level2Categories = category?.categories?.filter(cat => cat.level === 2) || [];
  const level3Categories = category?.categories?.filter(cat => cat.level === 3) || [];

  const getCategoryDisplayName = (categoryId) => {
    if (!categoryId) return 'Uncategorized';
    
    const level3Cat = level3Categories.find(cat => cat._id === categoryId);
    if (!level3Cat) return 'Unknown Category';

    const level2Cat = level2Categories.find(cat => cat._id === level3Cat.parentCategory);
    const level1Cat = level1Categories.find(cat => cat._id === level2Cat?.parentCategory);

    return `${level3Cat.name}${level2Cat ? ` (${level2Cat.name}` : ''}${level1Cat ? ` - ${level1Cat.name})` : level2Cat ? ')' : ''}`;
  };

  const handleDownloadMetaCatalog = async () => {
    try {
      setIsExporting(true);
      
      // Fetch all products with a large page size to get the complete catalog
      const allProductsResponse = await dispatch(findProducts({
        pageNumber: 1,
        pageSize: 10000, // Large number to get all products
        search: ""
      }));
      
      const allProducts = Array.isArray(allProductsResponse?.content) ? allProductsResponse.content : [];
      
      if (allProducts.length === 0) {
        alert('No products available to export');
        return;
      }

      // Convert products to simplified Meta ads format
      const metaAdsData = allProducts.map(product => {
        // Get first color and image
        const firstColor = product.colors && product.colors.length > 0 ? product.colors[0] : null;
        const firstImage = firstColor && firstColor.images && firstColor.images.length > 0 ? firstColor.images[0] : '';
        
        // Determine availability based on quantity
        const availability = (product.quantity && product.quantity > 0) ? 'in stock' : 'out of stock';
        
        // Construct product page URL - using slug if available, otherwise ID
        const productSlug = product.slug || product._id;
        const productLink = `https://tweestbd.com/product/${productSlug}`;
        
        // Use discounted price in Taka if available
        const salePrice = product.discountedPrice && product.discountedPrice < product.price ? 
                         `${product.discountedPrice} BDT` : '';
        
        return {
          id: product._id || '',
          title: product.title || '',
          description: product.description || product.title || '',
          availability: availability,
          price: `${product.price} BDT`,
          link: productLink,
          image_link: getImageUrl(firstImage),
          brand: product.brand || 'Tweest',
          sale_price: salePrice
        };
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(metaAdsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Meta Ads Catalog');

      // Add some formatting to the header row
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "CCCCCC" } }
        };
      }

      // Download the file
      const fileName = `meta-ads-catalog-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      alert(`Meta ads catalog exported successfully! ${allProducts.length} products exported.`);
      console.log(`Meta ads catalog exported successfully: ${fileName}`);
    } catch (error) {
      console.error('Error exporting Meta ads catalog:', error);
      alert('Error exporting catalog. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  const columns = [
    {
      field: 'imageUrl',
      headerName: 'Images',
      width: 200,
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {params.row?.colors?.slice(0, 3).map((color, colorIndex) => (
              <Box key={colorIndex}>
                <Box
                  component="img"
                  src={getImageUrl(color.images[0] || '')}
                  alt={`${params.row?.title} - ${color.name}`}
                  sx={{
                    width: 50,
                    height: 50,
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/50';
                  }}
                />
              </Box>
            ))}
            {params.row?.colors?.length > 3 && (
              <Chip 
                label={`+${params.row.colors.length - 3}`} 
                size="small" 
                color="primary" 
                sx={{ height: 24, mt: 1.5 }}
              />
            )}
          </Box>
        );
      },
    },
    { 
      field: 'colors',
      headerName: 'Colors',
      width: 150,
      valueGetter: (params) => {
        if (!params.row) return '';
        return params.row?.colors?.map(c => c.name).join(', ') || '';
      },
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {params.row?.colors?.slice(0, 4).map((color, index) => (
              <Chip 
                key={index} 
                label={color.name} 
                size="small" 
                sx={{ 
                  height: 24,
                  textTransform: 'capitalize'
                }}
              />
            ))}
            {params.row?.colors?.length > 4 && (
              <Chip 
                label={`+${params.row.colors.length - 4}`} 
                size="small" 
                color="default" 
                sx={{ height: 24 }}
              />
            )}
          </Box>
        );
      }
    },
    { 
      field: 'title', 
      headerName: 'Title', 
      width: 230,
      valueGetter: (params) => {
        if (!params.row) return '';
        return params.row?.title || '';
      },
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Tooltip title={params.row?.title || ''} placement="top">
            <Typography variant="body2" noWrap title={params.row?.title}>
              {params.row?.title || ''}
            </Typography>
          </Tooltip>
        );
      }
    },
    { 
      field: 'category', 
      headerName: 'Category', 
      width: 200,
      valueGetter: (params) => {
        if (!params.row) return '';
        if (!params.row?.category) return 'Uncategorized';
        return getCategoryDisplayName(params.row.category);
      },
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Tooltip title={getCategoryDisplayName(params.row?.category)} placement="top">
            <Typography variant="body2" noWrap title={getCategoryDisplayName(params.row?.category)}>
              {getCategoryDisplayName(params.row?.category)}
            </Typography>
          </Tooltip>
        );
      }
    },
    { 
      field: 'price', 
      headerName: 'Price', 
      width: 150,
      valueGetter: (params) => {
        if (!params.row) return 0;
        return params.row?.price || 0;
      },
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Box>
            <Typography variant="body2" fontWeight="600" color="text.primary">
              Tk. {params.row?.price || 0}
            </Typography>
            {params.row?.discountedPrice && params.row.discountedPrice < params.row.price && (
              <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                <span style={{ textDecoration: 'line-through', color: '#757575', marginRight: 4 }}>
                  Tk. {params.row.price}
                </span>
                <span>
                  Tk. {params.row.discountedPrice} <Chip size="small" label={`${params.row.discountPersent}% off`} color="success" sx={{ height: 16, fontSize: '0.625rem' }} />
                </span>
              </Typography>
            )}
          </Box>
        );
      }
    },
    { 
      field: 'quantity', 
      headerName: 'Stock', 
      width: 100,
      valueGetter: (params) => {
        if (!params.row) return 0;
        return params.row?.quantity || 0;
      },
      renderCell: (params) => {
        if (!params.row) return null;
        const quantity = params.row?.quantity || 0;
        let color = 'success.main';
        if (quantity <= 0) {
          color = 'error.main';
        } else if (quantity < 10) {
          color = 'warning.main';
        }
        
        return (
          <Chip 
            label={`${quantity} units`}
            size="small"
            color={quantity <= 0 ? "error" : quantity < 10 ? "warning" : "success"}
            sx={{ 
              fontWeight: 'medium',
              minWidth: 75
            }}
          />
        );
      }
    },
    {
      field: 'isNewArrival',
      headerName: 'New Arrival',
      width: 110,
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Switch
            checked={params.row?.isNewArrival || false}
            onChange={(e) => handleNewArrivalToggle(e, params.row?._id)}
            disabled={!params.row?._id}
            size="small"
            color="primary"
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Box display="flex" gap={1}>
            <Tooltip title="View details">
              <IconButton
                size="small"
                color="primary"
                onClick={() => navigate(`/admin/product/${params.row?._id}`)}
                disabled={!params.row?._id}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit product">
              <IconButton
                size="small"
                color="info"
                onClick={() => navigate(`/admin/product/edit/${params.row?._id}`)}
                disabled={!params.row?._id}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete product">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDeleteProduct(params.row?._id)}
                disabled={!params.row?._id}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  // Get products array safely and ensure it's an array
  const products = Array.isArray(customersProduct?.products?.content) ? customersProduct.products.content : [];

  return (
    <Box width="100%" sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Card sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Products Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh products">
              <IconButton color="primary" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle filters">
              <IconButton 
                color={showFilters ? "primary" : "default"} 
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download Meta ads catalog">
              <IconButton 
                color="primary" 
                onClick={handleDownloadMetaCatalog}
                disabled={isExporting}
              >
                {isExporting ? <CircularProgress size={24} /> : <DownloadIcon />}
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/admin/product/create')}
              startIcon={<AddIcon />}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                px: 3
              }}
            >
              Add New Product
            </Button>
          </Box>
        </Box>

        <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search products by name, color, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button 
                    type="submit" 
                    variant="contained" 
                    size="small"
                    sx={{ borderRadius: 1 }}
                  >
                    Search
                  </Button>
                </InputAdornment>
              )
            }}
          />
        </Box>

        {showFilters && (
          <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
              <FilterListIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
              Advanced Filters
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    label="Category"
                    onChange={(e) => handleFilterChange(e, "category")}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {level3Categories.map(category => (
                      <MenuItem key={category._id} value={category._id}>
                        {getCategoryDisplayName(category._id)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Stock Status</InputLabel>
                  <Select
                    value={filters.stock}
                    label="Stock Status"
                    onChange={(e) => handleFilterChange(e, "stock")}
                  >
                    <MenuItem value="">All Stock Status</MenuItem>
                    <MenuItem value="in_stock">In Stock</MenuItem>
                    <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                    <MenuItem value="low_stock">Low Stock (⟨10)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={filters.sort}
                    label="Sort By"
                    onChange={(e) => handleFilterChange(e, "sort")}
                    startAdornment={<SortIcon sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    <MenuItem value="">Default</MenuItem>
                    <MenuItem value="price_high">Price (High to Low)</MenuItem>
                    <MenuItem value="price_low">Price (Low to High)</MenuItem>
                    <MenuItem value="newest">Newest First</MenuItem>
                    <MenuItem value="oldest">Oldest First</MenuItem>
                    <MenuItem value="name_asc">Name (A-Z)</MenuItem>
                    <MenuItem value="name_desc">Name (Z-A)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ height: 'calc(100vh - 300px)', minHeight: 400 }}>
            <DataGrid
              rows={products}
              columns={columns}
              getRowId={(row) => row?._id || Math.random()}
              autoHeight
              pageSize={pageSize}
              rowsPerPageOptions={[5, 10, 25, 50]}
              onPageSizeChange={handlePageSizeChange}
              disableSelectionOnClick
              loading={loading}
              error={error}
              components={{
                NoRowsOverlay: () => (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
                    <Typography>No products found</Typography>
                  </Box>
                ),
                ErrorOverlay: () => (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
                    <Typography color="error">Error loading products</Typography>
                  </Box>
                )
              }}
              sx={{
                '& .MuiDataGrid-cell:hover': {
                  color: 'primary.main',
                },
                '& .MuiDataGrid-row:nth-of-type(even)': {
                  backgroundColor: 'action.hover',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '1px solid',
                  borderColor: 'divider',
                },
              }}
            />
          </Box>
        )}
      </Card>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={customersProduct?.products?.totalPages || 1}
          page={customersProduct?.products?.currentPage + 1 || 1}
          onChange={handlePaginationChange}
          color="primary"
          size="large"
          showFirstButton
          showLastButton
        />
      </Box>
    </Box>
  );
};

export default ProductsTable;
