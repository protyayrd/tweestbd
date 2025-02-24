import {
  Avatar,
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
  Switch
} from "@mui/material";

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deleteProduct, findProducts, updateProduct } from "../../../Redux/Customers/Product/Action";
import { getCategories } from "../../../Redux/Admin/Category/Action";
import { selectCustomerProducts, selectCategories } from "../../../Redux/Customers/Product/Action";
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import { getImageUrl } from '../../../config/api';

const ProductsTable = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Use specific selectors instead of whole state
  const customersProduct = useSelector(selectCustomerProducts);
  const category = useSelector(selectCategories);
  const loading = useSelector(state => state.customersProduct?.loading);
  const error = useSelector(state => state.customersProduct?.error);
  
  const [pageSize, setPageSize] = useState(5);
  const [gridPage, setGridPage] = useState(0);
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

    console.log("Fetching products with params:", { currentPage, pageSize: 10 });
    
    // Add category and other filters to the request
    const filters = {
      pageNumber: currentPage,
      pageSize: 10,
      category: searchParams.get("category") || "",
      stock: searchParams.get("stock") || "",
      sort: searchParams.get("sort") || ""
    };

    dispatch(findProducts(filters));
  }, [dispatch, location.search]);

  useEffect(() => {
    console.log("Current products state:", customersProduct);
    console.log("Products content:", customersProduct?.products?.content);
    console.log("Loading state:", loading);
    console.log("Error state:", error);
  }, [customersProduct, loading, error]);

  const handlePaginationChange = (event, value) => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("page", value);
    window.history.pushState({}, "", newUrl);
    
    dispatch(findProducts({
      pageNumber: value,
      pageSize: 10
    }));
  };

  const handleFilterChange = (e, sectionId) => {
    const value = e.target.value;
    setFilters((values) => ({ ...values, [sectionId]: value }));
    
    const newSearchParams = new URLSearchParams();
    if (value) {
      newSearchParams.set(sectionId, value);
    }
    
    navigate({ search: newSearchParams.toString() ? `?${newSearchParams.toString()}` : "" });
  };

  const handleDeleteProduct = (productId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (confirmDelete) {
      dispatch(deleteProduct(productId));
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
        pageSize: 10
      }));
    } catch (error) {
      console.error('Error updating new arrival status:', error);
    }
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

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
            {params.row?.colors?.map((color, colorIndex) => (
              <Box key={colorIndex}>
                <Box
                  component="img"
                  src={getImageUrl(color.images[0] || '')}
                  alt={`${params.row?.title} - ${color.name}`}
                  sx={{
                    width: 40,
                    height: 40,
                    objectFit: 'cover',
                    borderRadius: 1
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/40';
                  }}
                />
              </Box>
            ))}
          </Box>
        );
      },
    },
    { 
      field: 'colors',
      headerName: 'Colors',
      width: 200,
      valueGetter: (params) => {
        if (!params.row) return '';
        return params.row?.colors?.map(c => c.name).join(', ') || '';
      },
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Typography variant="body2" noWrap>
            {params.row?.colors?.map(c => c.name).join(', ') || 'No colors'}
          </Typography>
        );
      }
    },
    { 
      field: 'title', 
      headerName: 'Title', 
      width: 200,
      valueGetter: (params) => {
        if (!params.row) return '';
        return params.row?.title || '';
      },
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Typography variant="body2" noWrap title={params.row?.title}>
            {params.row?.title || ''}
          </Typography>
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
          <Typography variant="body2" noWrap title={getCategoryDisplayName(params.row?.category)}>
            {getCategoryDisplayName(params.row?.category)}
          </Typography>
        );
      }
    },
    { 
      field: 'price', 
      headerName: 'Price', 
      width: 120,
      valueGetter: (params) => {
        if (!params.row) return 0;
        return params.row?.price || 0;
      },
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Box>
            <Typography variant="body2" color="text.primary">
              Tk. {params.row?.price || 0}
            </Typography>
            {params.row?.discountedPrice && params.row.discountedPrice < params.row.price && (
              <Typography variant="caption" color="success.main">
                Tk. {params.row.discountedPrice} ({params.row.discountPersent}% off)
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
        return (
          <Typography 
            variant="body2" 
            color={params.row?.quantity > 0 ? 'success.main' : 'error.main'}
          >
            {params.row?.quantity || 0} units
          </Typography>
        );
      }
    },
    {
      field: 'isNewArrival',
      headerName: 'New Arrival',
      width: 120,
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Switch
            checked={params.row?.isNewArrival || false}
            onChange={(e) => handleNewArrivalToggle(e, params.row?._id)}
            disabled={!params.row?._id}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate(`/admin/product/${params.row?._id}`)}
              disabled={!params.row?._id}
            >
              View
            </Button>
            <Button
              variant="contained"
              color="info"
              size="small"
              onClick={() => navigate(`/admin/product/edit/${params.row?._id}`)}
              disabled={!params.row?._id}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => handleDeleteProduct(params.row?._id)}
              disabled={!params.row?._id}
            >
              Delete
            </Button>
          </Box>
        );
      },
    },
  ];

  // Get products array safely and ensure it's an array
  const products = Array.isArray(customersProduct?.products?.content) ? customersProduct.products.content : [];
  console.log("Products array:", products);

  return (
    <Box width="100%" sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Card sx={{ p: 3, mb: 3, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
            Products Management
          </Typography>
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

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
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
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={products}
            columns={columns}
            getRowId={(row) => row?._id || Math.random()}
            autoHeight
            pageSize={10}
            rowsPerPageOptions={[10]}
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
            }}
          />
        )}
      </Card>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={customersProduct?.products?.totalPages || 1}
          page={customersProduct?.products?.currentPage + 1 || 1}
          onChange={handlePaginationChange}
          color="primary"
          size="large"
        />
      </Box>
    </Box>
  );
};

export default ProductsTable;
