import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Card,
  IconButton,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  RadioGroup,
  Radio,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tooltip,
  Chip,
  CircularProgress,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab,
  ImageList,
  ImageListItem,
  Badge
} from "@mui/material";
import { getCategories } from "../../../Redux/Admin/Category/Action";
import { createProduct } from "../../../Redux/Customers/Product/Action";
import { findProducts } from "../../../Redux/Customers/Product/Action";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DoneIcon from '@mui/icons-material/Done';
import ImageIcon from '@mui/icons-material/Image';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import InventoryIcon from '@mui/icons-material/Inventory';
import DescriptionIcon from '@mui/icons-material/Description';
import StraightenIcon from '@mui/icons-material/Straighten';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from "react-router-dom";
import api from '../../../config/api';

const initialSizes = ["S", "M", "L", "XL", "XXL"];

const initialSizeGuide = {
  S: { chest: "", length: "", shoulder: "" },
  M: { chest: "", length: "", shoulder: "" },
  L: { chest: "", length: "", shoulder: "" },
  XL: { chest: "", length: "", shoulder: "" },
  XXL: { chest: "", length: "", shoulder: "" }
};

const predefinedColors = [];

const CreateProductForm = () => {
  const dispatch = useDispatch();
  const { category } = useSelector((store) => store);
  const [productData, setProductData] = useState({
    colors: [],  // Array of color objects with images and sizes
    title: "",
    discountedPrice: "",
    price: "",
    discountPersent: "",
    sizeGuide: initialSizeGuide,
    category: "",
    description: "",
    features: "",
    perfectFor: "",
    additionalInfo: "",
    sku: "",
    isNewArrival: false
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [expandedSection, setExpandedSection] = useState('basic');
  const [sizeGuides, setSizeGuides] = useState([]);
  const [selectedSizeGuide, setSelectedSizeGuide] = useState(null);
  const [sizeGuideMode, setSizeGuideMode] = useState('manual'); // 'manual' or 'template'
  const [predefinedDescriptions, setPredefinedDescriptions] = useState({
    main_description: [],
    product_features: [],
    perfect_for: [],
    additional_information: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTabs, setActiveTabs] = useState({
    color: 0
  });
  const [formValidation, setFormValidation] = useState({
    basic: false,
    colors: false,
    sizes: false,
    description: false
  });
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getCategories());
    fetchSizeGuides();
    fetchPredefinedDescriptions();
  }, [dispatch]);

  const fetchSizeGuides = async () => {
    try {
      const response = await api.get('/api/size-guides');
      setSizeGuides(response.data);
    } catch (error) {
      console.error('Failed to fetch size guides:', error);
    }
  };

  const fetchPredefinedDescriptions = async () => {
    try {
      const response = await api.get('/api/predefined-descriptions');
      const descriptions = response.data;
      
      // Group descriptions by type
      const grouped = {
        main_description: descriptions.filter(d => d.type === 'main_description'),
        product_features: descriptions.filter(d => d.type === 'product_features'),
        perfect_for: descriptions.filter(d => d.type === 'perfect_for'),
        additional_information: descriptions.filter(d => d.type === 'additional_information')
      };
      
      setPredefinedDescriptions(grouped);
    } catch (error) {
      console.error('Failed to fetch predefined descriptions:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties like description.main
      const [parent, child] = name.split('.');
      
      // Map the nested structure to the flat structure
      if (parent === 'description') {
        let fieldName;
        switch (child) {
          case 'main':
            fieldName = 'description';
            break;
          case 'features':
            fieldName = 'features';
            break;
          case 'perfectFor':
            fieldName = 'perfectFor';
            break;
          case 'additional':
            fieldName = 'additionalInfo';
            break;
          default:
            fieldName = name;
        }
        
        setProductData(prevState => ({
          ...prevState,
          [fieldName]: value
        }));
        return;
      }
      
      // Handle other nested properties normally
      setProductData(prevState => ({
        ...prevState,
        [parent]: {
          ...prevState[parent],
          [child]: value
        }
      }));
      return;
    }
    
    // Handle price-related calculations
    setProductData((prevState) => {
      const updates = { [name]: value };
      
      if (name === 'price') {
        const price = Number(value);
        if (prevState.discountPersent) {
          // If there's a discount percentage, calculate discounted price
          const discountedPrice = price - (price * Number(prevState.discountPersent) / 100);
          updates.discountedPrice = discountedPrice.toFixed(2);
        } else if (prevState.discountedPrice) {
          // If there's a discounted price, calculate discount percentage
          const discountPersent = ((price - Number(prevState.discountedPrice)) / price * 100);
          updates.discountPersent = discountPersent.toFixed(0);
        }
      } else if (name === 'discountPersent') {
        const discountPersent = Number(value);
        if (prevState.price) {
          // Calculate discounted price based on percentage
          const price = Number(prevState.price);
          const discountedPrice = price - (price * discountPersent / 100);
          updates.discountedPrice = discountedPrice.toFixed(2);
        }
      } else if (name === 'discountedPrice') {
        const discountedPrice = Number(value);
        if (prevState.price) {
          // Calculate discount percentage based on discounted price
          const price = Number(prevState.price);
          const discountPersent = ((price - discountedPrice) / price * 100);
          updates.discountPersent = discountPersent.toFixed(0);
        }
      }

      return {
        ...prevState,
        ...updates
      };
    });
  };

  const handleColorChange = (colorIndex, field, value) => {
    setProductData(prevState => {
      const updatedColors = [...prevState.colors];
      if (!updatedColors[colorIndex]) {
        updatedColors[colorIndex] = { 
          name: '', 
          images: [],
          sizes: initialSizes.map(size => ({ name: size, quantity: 0 })),
          customColor: ''
        };
      }
      if (field === 'name') {
        updatedColors[colorIndex].name = value;
      }
      return { ...prevState, colors: updatedColors };
    });
  };

  const handleSizeGuideChange = (size, field, value) => {
    // Validate and format the measurement value
    let formattedValue = value.trim();
    
    // Remove any existing quotes or "inches"
    formattedValue = formattedValue.replace(/["'\s]|inches/g, '');
    
    // Validate that the value is a positive number
    if (formattedValue && !isNaN(formattedValue) && parseFloat(formattedValue) > 0) {
      formattedValue = `${formattedValue}"`;
    }

    setProductData(prev => ({
      ...prev,
      sizeGuide: {
        ...prev.sizeGuide,
        measurements: {
          ...prev.sizeGuide.measurements,
          [size]: {
            ...prev.sizeGuide.measurements[size],
            [field]: formattedValue
          }
        }
      }
    }));
  };

  const handleColorSizeChange = (colorIndex, sizeIndex, field, value) => {
    setProductData(prevState => {
      const updatedColors = [...prevState.colors];
      if (!updatedColors[colorIndex].sizes) {
        updatedColors[colorIndex].sizes = initialSizes.map(size => ({ name: size, quantity: 0 }));
      }
      updatedColors[colorIndex].sizes[sizeIndex][field] = value;
      return { ...prevState, colors: updatedColors };
    });
  };

  const handleImageChange = (colorIndex, e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError("Each image size should be less than 5MB");
        return false;
      }
      
      if (!file.type.startsWith('image/')) {
        setError("Please upload image files only");
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setProductData(prevState => {
        const updatedColors = [...prevState.colors];
        if (!updatedColors[colorIndex]) {
          updatedColors[colorIndex] = { 
            name: '', 
            images: [],
            sizes: initialSizes.map(size => ({ name: size, quantity: 0 })),
            customColor: ''
          };
        }
        
        const newImages = validFiles.map(file => ({
          file,
          preview: URL.createObjectURL(file)
        }));

        updatedColors[colorIndex].images = [...(updatedColors[colorIndex].images || []), ...newImages].slice(0, 4);

        return { ...prevState, colors: updatedColors };
      });
      setError("");
    }
  };

  const handleRemoveImage = (colorIndex, imageIndex) => {
    setProductData(prevState => {
      const updatedColors = [...prevState.colors];
      if (updatedColors[colorIndex]?.images) {
        if (updatedColors[colorIndex].images[imageIndex]?.preview) {
          URL.revokeObjectURL(updatedColors[colorIndex].images[imageIndex].preview);
        }
        updatedColors[colorIndex].images.splice(imageIndex, 1);
      }
      return { ...prevState, colors: updatedColors };
    });
  };

  const validateBasicInfo = () => {
    return productData.title && 
           productData.price > 0 && 
           productData.category;
  };

  const validateColors = () => {
    if (productData.colors.length === 0) return false;
    
    return productData.colors.every(color => 
      color.name && color.images && color.images.length > 0
    );
  };

  const validateInventory = () => {
    if (productData.colors.length === 0) return false;
    
    return productData.colors.every(color => 
      color.sizes && 
      color.sizes.some(size => Number(size.quantity) > 0)
    );
  };

  const validateDescription = () => {
    return productData.description.trim() !== '';
  };

  useEffect(() => {
    // Update validation state whenever product data changes
    setFormValidation({
      basic: validateBasicInfo(),
      colors: validateColors(),
      sizes: validateInventory(),
      description: validateDescription()
    });
  }, [productData]);

  const getCurrentStepValidation = () => {
    switch (activeStep) {
      case 0: return formValidation.basic;
      case 1: return formValidation.colors;
      case 2: return formValidation.sizes;
      case 3: return formValidation.description;
      default: return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    setSubmitted(true);

    try {
      // Validate entire form one more time
      if (!validateBasicInfo()) {
        throw new Error("Please complete the basic information section");
      }
      
      if (!validateColors()) {
        throw new Error("Please complete the colors and images section");
      }
      
      if (!validateInventory()) {
        throw new Error("Please add inventory quantities for at least one size per color");
      }
      
      if (!validateDescription()) {
        throw new Error("Please provide a product description");
      }

      const formData = new FormData();

      // Add basic product data
      formData.append('title', productData.title);
      
      // Add SKU data
      formData.append('sku', productData.sku || '');
      
      // Send each description section separately
      formData.append('description', productData.description);
      formData.append('features', productData.features);
      formData.append('perfectFor', productData.perfectFor);
      formData.append('additionalInfo', productData.additionalInfo);
      
      formData.append('price', productData.price);
      formData.append('discountedPrice', productData.discountedPrice || productData.price);
      formData.append('discountPersent', productData.discountPersent || '0');
      formData.append('category', productData.category);
      formData.append('isNewArrival', productData.isNewArrival);

      // Process colors and their images
      const processedColors = productData.colors.map(color => ({
        name: color.name,
        sizes: color.sizes.filter(size => Number(size.quantity) > 0)
      }));

      formData.append('colors', JSON.stringify(processedColors));

      // Add color images - make sure we have images
      const hasImages = productData.colors.every(color => 
        color.images && color.images.length > 0 && 
        color.images.some(img => img.file)
      );
      
      if (!hasImages) {
        throw new Error("Please make sure all colors have at least one image");
      }

      // Add color images
      productData.colors.forEach((color, colorIndex) => {
        if (color.images) {
          color.images.forEach((image, imageIndex) => {
            if (image.file) {
              formData.append(`colorImages_${colorIndex}`, image.file);
            }
          });
        }
      });

      // Add size guide if it has values
      const hasSizeGuideValues = Object.values(productData.sizeGuide).some(
        size => Object.values(size).some(measurement => measurement !== "")
      );

      if (hasSizeGuideValues) {
        formData.append('sizeGuide', JSON.stringify(productData.sizeGuide));
      }

      // Show information to user
      setSnackbarSeverity("info");
      setSnackbarMessage("Creating product... This may take a moment.");
      setOpenSnackbar(true);

      // Submit the form data
      const result = await dispatch(createProduct(formData));
      
      // If successful, show success and redirect
      setSnackbarSeverity("success");
      setSnackbarMessage("Product created successfully!");
      setOpenSnackbar(true);
      
      // Delay navigation slightly to show the success message
      setTimeout(() => {
        navigate("/admin/products");
      }, 1500);
      
    } catch (error) {
      console.error('Error creating product:', error);
      setError(error.message || "Failed to create product");
      setSnackbarSeverity("error");
      setSnackbarMessage(error.message || "Failed to create product");
      setOpenSnackbar(true);
      setIsSubmitting(false);
    }
  };

  // Get categories by level
  const level3Categories = category?.categories?.filter(cat => cat.level === 3) || [];

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ color: "primary.main", fontWeight: "bold" }}>
            Create New Product
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/products')}
          >
            Back to Products
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 4 }}>
          <Step>
            <StepLabel 
              StepIconProps={{ 
                icon: <DescriptionIcon />,
              }}
            >
              Basic Info
            </StepLabel>
          </Step>
          <Step>
            <StepLabel 
              StepIconProps={{ 
                icon: <ColorLensIcon />,
              }}
            >
              Colors & Images
            </StepLabel>
          </Step>
          <Step>
            <StepLabel 
              StepIconProps={{ 
                icon: <InventoryIcon />,
              }}
            >
              Inventory
            </StepLabel>
          </Step>
          <Step>
            <StepLabel 
              StepIconProps={{ 
                icon: <StraightenIcon />,
              }}
            >
              Description & Size Guide
            </StepLabel>
          </Step>
        </Stepper>

        <form onSubmit={handleSubmit} noValidate>
          <Box sx={{ display: activeStep === 0 ? 'block' : 'none' }}>
            <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <DescriptionIcon sx={{ mr: 1 }} /> Basic Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Product Title"
                    name="title"
                    value={productData.title}
                    onChange={handleChange}
                    required
                    margin="normal"
                    error={submitted && !productData.title}
                    helperText={submitted && !productData.title ? "Title is required" : ""}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SKU"
                    name="sku"
                    value={productData.sku}
                    onChange={handleChange}
                    margin="normal"
                    helperText="Stock Keeping Unit (Optional)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Price"
                    name="price"
                    type="number"
                    value={productData.price}
                    onChange={handleChange}
                    required={activeStep === 0}
                    helperText="Original price of the product (BDT)"
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>৳</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Discounted Price"
                    name="discountedPrice"
                    type="number"
                    value={productData.discountedPrice}
                    onChange={handleChange}
                    disabled={!productData.price}
                    helperText={!productData.price ? "Set price first" : "Enter discounted price or set discount percentage"}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>৳</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Discount Percentage"
                    name="discountPersent"
                    type="number"
                    value={productData.discountPersent}
                    onChange={handleChange}
                    disabled={!productData.price}
                    helperText={!productData.price ? "Set price first" : "Enter percentage or set discounted price"}
                    InputProps={{
                      endAdornment: <Typography variant="body2" sx={{ ml: 1 }}>%</Typography>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required={activeStep === 0}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={productData.category}
                      onChange={handleChange}
                      label="Category"
                    >
                      {level3Categories.map((cat) => (
                        <MenuItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      Select the category that best fits this product
                    </Typography>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={productData.isNewArrival}
                        onChange={(e) => setProductData({...productData, isNewArrival: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Mark as New Arrival"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    New arrivals get featured on the homepage
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          </Box>

          <Box sx={{ display: activeStep === 1 ? 'block' : 'none' }}>
            <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <ColorLensIcon sx={{ mr: 1 }} /> Colors and Images
              </Typography>
              
              {productData.colors.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5, bgcolor: 'background.paper', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                  <ImageIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>No Colors Added Yet</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                    Add at least one color variation with product images. Each color can have multiple images and size inventory.
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => handleColorChange(0, 'name', '')}
                  >
                    Add First Color
                  </Button>
                </Box>
              ) : (
                <>
                  <Tabs
                    value={activeTabs.color}
                    onChange={(e, newValue) => setActiveTabs({...activeTabs, color: newValue})}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
                  >
                    {productData.colors.map((color, index) => (
                      <Tab 
                        key={index} 
                        label={color.name || `Color ${index + 1}`} 
                        icon={
                          <Badge 
                            badgeContent={color.images?.length || 0} 
                            color={color.images?.length ? "primary" : "error"}
                            sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}
                          >
                            <ColorLensIcon />
                          </Badge>
                        }
                        sx={{ 
                          textTransform: 'none',
                          minHeight: 'auto',
                          py: 1
                        }} 
                      />
                    ))}
                    <Tab 
                      icon={<AddIcon />} 
                      label="Add Color" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleColorChange(productData.colors.length, 'name', '');
                        setActiveTabs({...activeTabs, color: productData.colors.length});
                      }}
                      sx={{ 
                        textTransform: 'none',
                        minHeight: 'auto',
                        py: 1
                      }}
                    />
                  </Tabs>

                  {productData.colors.map((color, colorIndex) => (
                    <Box 
                      key={colorIndex} 
                      sx={{ 
                        display: activeTabs.color === colorIndex ? 'block' : 'none'
                      }}
                    >
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ mr: 2 }}>Color Name: </Typography>
                            <TextField 
                              label="Enter Color Name" 
                              size="medium"
                              fullWidth
                              value={color.name || ''}
                              onChange={(e) => handleColorChange(colorIndex, 'name', e.target.value)}
                              placeholder="e.g., Red, Navy Blue, Forest Green"
                              required
                            />
                          </Box>
                          {!color.name && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                              Please enter a color name
                            </Alert>
                          )}
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Typography variant="subtitle1" gutterBottom>
                            Upload Images for {color.name || 'this color'} (max 4)
                          </Typography>
                          <Box
                            sx={{
                              border: '2px dashed',
                              borderColor: 'primary.main',
                              borderRadius: 2,
                              p: 2,
                              textAlign: 'center',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.hover' },
                              mb: 2
                            }}
                            component="label"
                          >
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              hidden
                              onChange={(e) => handleImageChange(colorIndex, e)}
                            />
                            <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography>
                              Click or drop images here
                            </Typography>
                          </Box>
                          
                          {color.images?.length > 0 ? (
                            <ImageList cols={4} gap={16}>
                              {color.images.map((image, imageIndex) => (
                                <ImageListItem key={imageIndex} sx={{ position: 'relative' }}>
                                  <img
                                    src={image.preview}
                                    alt={`Color ${color.name} preview ${imageIndex}`}
                                    style={{
                                      width: '100%',
                                      height: '120px',
                                      objectFit: 'cover',
                                      borderRadius: '8px'
                                    }}
                                  />
                                  <IconButton
                                    size="small"
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      right: 4,
                                      bgcolor: 'rgba(255,255,255,0.8)',
                                      '&:hover': { bgcolor: 'error.light', color: 'white' }
                                    }}
                                    onClick={() => handleRemoveImage(colorIndex, imageIndex)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </ImageListItem>
                              ))}
                            </ImageList>
                          ) : (
                            <Alert severity="info">
                              Please upload at least one image for this color
                            </Alert>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </>
              )}
            </Card>
          </Box>

          <Box sx={{ display: activeStep === 2 ? 'block' : 'none' }}>
            <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <InventoryIcon sx={{ mr: 1 }} /> Stock Management
              </Typography>
              
              {productData.colors.length === 0 ? (
                <Alert severity="warning">
                  Please add colors first before managing Stock
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  {productData.colors.map((color, colorIndex) => (
                    <Grid item xs={12} key={colorIndex}>
                      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ 
                          fontWeight: 'bold', 
                          display: 'flex', 
                          alignItems: 'center'
                        }}>
                          <Box 
                            sx={{ 
                              mr: 1,
                              px: 1,
                              borderRadius: 1,
                              bgcolor: 'action.hover',
                              fontSize: '0.875rem',
                              fontWeight: 'medium',
                              display: 'inline-block'
                            }} 
                          >
                            {color.name}
                          </Box>
                        </Typography>
                        
                        <Grid container spacing={2}>
                          {color.sizes?.map((size, sizeIndex) => (
                            <Grid item xs={6} sm={4} md={2} key={sizeIndex}>
                              <Paper 
                                elevation={0} 
                                sx={{ 
                                  p: 2, 
                                  border: '1px solid', 
                                  borderColor: 'divider',
                                  borderRadius: 1
                                }}
                              >
                                <Typography variant="h6" align="center" gutterBottom>
                                  {size.name}
                                </Typography>
                                <TextField
                                  fullWidth
                                  label="Quantity"
                                  type="number"
                                  value={size.quantity}
                                  onChange={(e) => handleColorSizeChange(colorIndex, sizeIndex, 'quantity', e.target.value)}
                                  InputProps={{
                                    inputProps: { min: 0 }
                                  }}
                                />
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Card>
          </Box>

          <Box sx={{ display: activeStep === 3 ? 'block' : 'none' }}>
            <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <DescriptionIcon sx={{ mr: 1 }} /> Product Description
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Main Description
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Main Description"
                          name="description"
                          multiline
                          rows={3}
                          value={productData.description}
                          onChange={handleChange}
                          required={activeStep === 3}
                          placeholder="Provide a general description of the product"
                        />
                      </Grid>
                      {predefinedDescriptions.main_description.length > 0 && (
                        <Grid item xs={12}>
                          <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Use Predefined Description</InputLabel>
                            <Select
                              value=""
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                if (selectedId) {
                                  const selected = predefinedDescriptions.main_description.find(d => d._id === selectedId);
                                  if (selected) {
                                    setProductData(prev => ({
                                      ...prev,
                                      description: selected.content
                                    }));
                                  }
                                }
                              }}
                              displayEmpty
                            >
                              <MenuItem value="" disabled>
                                <em>Select a predefined description</em>
                              </MenuItem>
                              {predefinedDescriptions.main_description.map((desc) => (
                                <MenuItem key={desc._id} value={desc._id}>
                                  {desc.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Product Features
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Product Features"
                          name="features"
                          multiline
                          rows={3}
                          value={productData.features}
                          onChange={handleChange}
                          placeholder="List the key features of the product (material, style, etc.)"
                        />
                      </Grid>
                      {predefinedDescriptions.product_features.length > 0 && (
                        <Grid item xs={12}>
                          <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Use Predefined Features</InputLabel>
                            <Select
                              value=""
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                if (selectedId) {
                                  const selected = predefinedDescriptions.product_features.find(d => d._id === selectedId);
                                  if (selected) {
                                    setProductData(prev => ({
                                      ...prev,
                                      features: selected.content
                                    }));
                                  }
                                }
                              }}
                              displayEmpty
                            >
                              <MenuItem value="" disabled>
                                <em>Select predefined features</em>
                              </MenuItem>
                              {predefinedDescriptions.product_features.map((desc) => (
                                <MenuItem key={desc._id} value={desc._id}>
                                  {desc.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Perfect For
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Perfect For"
                          name="perfectFor"
                          multiline
                          rows={3}
                          value={productData.perfectFor}
                          onChange={handleChange}
                          placeholder="Describe ideal use cases or occasions for this product"
                        />
                      </Grid>
                      {predefinedDescriptions.perfect_for.length > 0 && (
                        <Grid item xs={12}>
                          <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Use Predefined &quot;Perfect For&quot;</InputLabel>
                            <Select
                              value=""
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                if (selectedId) {
                                  const selected = predefinedDescriptions.perfect_for.find(d => d._id === selectedId);
                                  if (selected) {
                                    setProductData(prev => ({
                                      ...prev,
                                      perfectFor: selected.content
                                    }));
                                  }
                                }
                              }}
                              displayEmpty
                            >
                              <MenuItem value="" disabled>
                                <em>Select predefined &quot;perfect for&quot; content</em>
                              </MenuItem>
                              {predefinedDescriptions.perfect_for.map((desc) => (
                                <MenuItem key={desc._id} value={desc._id}>
                                  {desc.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Additional Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Additional Information"
                          name="additionalInfo"
                          multiline
                          rows={3}
                          value={productData.additionalInfo}
                          onChange={handleChange}
                          placeholder="Provide any additional details, care instructions, etc."
                        />
                      </Grid>
                      {predefinedDescriptions.additional_information.length > 0 && (
                        <Grid item xs={12}>
                          <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Use Predefined Additional Info</InputLabel>
                            <Select
                              value=""
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                if (selectedId) {
                                  const selected = predefinedDescriptions.additional_information.find(d => d._id === selectedId);
                                  if (selected) {
                                    setProductData(prev => ({
                                      ...prev,
                                      additionalInfo: selected.content
                                    }));
                                  }
                                }
                              }}
                              displayEmpty
                            >
                              <MenuItem value="" disabled>
                                <em>Select predefined additional information</em>
                              </MenuItem>
                              {predefinedDescriptions.additional_information.map((desc) => (
                                <MenuItem key={desc._id} value={desc._id}>
                                  {desc.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ my: 3, display: 'flex', alignItems: 'center' }}>
                    <StraightenIcon sx={{ mr: 1 }} /> Size Guide
                  </Typography>
                  
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                    <RadioGroup
                      row
                      value={sizeGuideMode}
                      onChange={(e) => {
                        setSizeGuideMode(e.target.value);
                        if (e.target.value === 'manual') {
                          setSelectedSizeGuide(null);
                        }
                      }}
                      sx={{ mb: 2 }}
                    >
                      <FormControlLabel
                        value="manual"
                        control={<Radio />}
                        label="Manual Input"
                      />
                      <FormControlLabel
                        value="template"
                        control={<Radio />}
                        label="Use Template"
                      />
                    </RadioGroup>

                    {sizeGuideMode === 'template' ? (
                      <FormControl fullWidth>
                        <InputLabel>Select Size Guide Template</InputLabel>
                        <Select
                          value={selectedSizeGuide?._id || ''}
                          onChange={(e) => {
                            const guideId = e.target.value;
                            const guide = sizeGuides.find(g => g._id === guideId);
                            if (guide) {
                              setSelectedSizeGuide(guide);
                              setProductData(prev => ({
                                ...prev,
                                sizeGuide: guide.measurements
                              }));
                            }
                          }}
                        >
                          {sizeGuides.map((guide) => (
                            <MenuItem key={guide._id} value={guide._id}>
                              {guide.name} {guide.category?.name ? `(${guide.category.name})` : ''}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Grid container spacing={2}>
                        {Object.keys(productData.sizeGuide).map((size) => (
                          <Grid item xs={12} sm={6} md={4} key={size}>
                            <Paper elevation={1} sx={{ p: 2 }}>
                              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Size {size}
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    label="Chest"
                                    value={productData.sizeGuide[size].chest}
                                    onChange={(e) => handleSizeGuideChange(size, "chest", e.target.value)}
                                    helperText="Enter measurement in inches (e.g., 38)"
                                    error={productData.sizeGuide[size].chest && isNaN(productData.sizeGuide[size].chest.replace(/["'\s]|inches/g, ''))}
                                  />
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    label="Length"
                                    value={productData.sizeGuide[size].length}
                                    onChange={(e) => handleSizeGuideChange(size, "length", e.target.value)}
                                    helperText="Enter measurement in inches (e.g., 28)"
                                    error={productData.sizeGuide[size].length && isNaN(productData.sizeGuide[size].length.replace(/["'\s]|inches/g, ''))}
                                  />
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    label="Shoulder"
                                    value={productData.sizeGuide[size].shoulder}
                                    onChange={(e) => handleSizeGuideChange(size, "shoulder", e.target.value)}
                                    helperText="Enter measurement in inches (e.g., 17)"
                                    error={productData.sizeGuide[size].shoulder && isNaN(productData.sizeGuide[size].shoulder.replace(/["'\s]|inches/g, ''))}
                                  />
                                </Grid>
                              </Grid>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <DescriptionIcon sx={{ mr: 1 }} /> Product Description
                  </Typography>
                  
                  <Paper sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Use Description Template
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Select a template to automatically fill all description fields (Main Description, Features, Perfect For, Additional Info)
                    </Typography>
                    
                    <FormControl fullWidth>
                      <InputLabel>Description Templates</InputLabel>
                      <Select
                        value=""
                        onChange={(e) => {
                          // Get the selected template ID
                          const templateId = e.target.value;
                          if (!templateId) return;
                          
                          // Find templates for each type
                          const mainDesc = predefinedDescriptions.main_description.find(d => d._id === templateId);
                          const features = predefinedDescriptions.product_features.find(d => d.name.includes(mainDesc?.name.split(' ')[0] || ''));
                          const perfectFor = predefinedDescriptions.perfect_for.find(d => d.name.includes(mainDesc?.name.split(' ')[0] || ''));
                          const additionalInfo = predefinedDescriptions.additional_information.find(d => d.name.includes(mainDesc?.name.split(' ')[0] || ''));
                          
                          // Update product data with all matching templates
                          setProductData(prev => ({
                            ...prev,
                            description: mainDesc?.content || prev.description,
                            features: features?.content || prev.features,
                            perfectFor: perfectFor?.content || prev.perfectFor,
                            additionalInfo: additionalInfo?.content || prev.additionalInfo
                          }));
                        }}
                        displayEmpty
                      >
                        <MenuItem value="" disabled>
                          <em>Select a template set</em>
                        </MenuItem>
                        {predefinedDescriptions.main_description.map((desc) => (
                          <MenuItem key={desc._id} value={desc._id}>
                            {desc.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Paper>
                </Grid>
              </Grid>
            </Card>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
            
            {activeStep < 3 ? (
              <Button
                variant="contained"
                onClick={() => setActiveStep(Math.min(3, activeStep + 1))}
                endIcon={<ArrowForwardIcon />}
                disabled={!getCurrentStepValidation()}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={isSubmitting || !formValidation.description}
                startIcon={isSubmitting ? <CircularProgress size={24} /> : <SaveIcon />}
              >
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </Button>
            )}
          </Box>
        </form>
      </Paper>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: snackbarSeverity === 'error' ? 'error.main' : 
                            snackbarSeverity === 'success' ? 'success.main' : 
                            'primary.main',
          }
        }}
      />
    </Box>
  );
};

export default CreateProductForm;
