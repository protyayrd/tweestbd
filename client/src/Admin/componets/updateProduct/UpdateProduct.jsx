import { useState } from "react";
import { 
  Typography, 
  Box, 
  Alert, 
  Paper, 
  Stepper,
  Step,
  StepLabel,
  Card
} from "@mui/material";
import {
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Stack,
  Switch,
  FormControlLabel,
  Divider,
  RadioGroup,
  Radio,
} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DescriptionIcon from '@mui/icons-material/Description';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import InventoryIcon from '@mui/icons-material/Inventory';
import StraightenIcon from '@mui/icons-material/Straighten';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveIcon from '@mui/icons-material/Save';
import { useDispatch, useSelector } from "react-redux";
import {
  findProductById,
  updateProduct,
} from "../../../Redux/Customers/Product/Action";
import { getCategories } from "../../../Redux/Admin/Category/Action";
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getImageUrl } from '../../../config/api';
import api from '../../../config/api';

const initialSizes = ["S", "M", "L"];

const initialSizeGuide = {
  S: { chest: "", length: "", shoulder: "" },
  M: { chest: "", length: "", shoulder: "" },
  L: { chest: "", length: "", shoulder: "" },
  XL: { chest: "", length: "", shoulder: "" },
  XXL: { chest: "", length: "", shoulder: "" }
};

const UpdateProductForm = () => {
  const [productData, setProductData] = useState({
    colors: [],  // Array of color objects with images and sizes
    brand: "",
    title: "",
    discountedPrice: "",
    price: "",
    discountPersent: "",
    sizeGuide: initialSizeGuide,
    category: "",
    description: "",
    sku: "",
    isNewArrival: false
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [sizeGuides, setSizeGuides] = useState([]);
  const [selectedSizeGuide, setSelectedSizeGuide] = useState(null);
  const [sizeGuideMode, setSizeGuideMode] = useState('manual');
  const [predefinedDescriptions, setPredefinedDescriptions] = useState({
    main_description: [],
    product_features: [],
    perfect_for: [],
    additional_information: []
  });
  const [submitted, setSubmitted] = useState(false);
  const [formValidation, setFormValidation] = useState({
    basic: false,
    colors: false,
    sizes: false,
    description: false
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { productId } = useParams();
  const { customersProduct } = useSelector((store) => store);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setProductData((prevState) => {
      const updates = { [name]: value };
      
      // Handle price-related calculations
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
          sizes: initialSizes.map(size => ({ name: size, quantity: 0 }))
        };
      }
      if (field === 'name') {
        updatedColors[colorIndex].name = value;
      }
      return { ...prevState, colors: updatedColors };
    });
  };

  const handleSizeGuideChange = (event) => {
    const guideId = event.target.value;
    const guide = sizeGuides.find(g => g._id === guideId);
    if (guide) {
      setSelectedSizeGuide(guide);
      setProductData(prev => ({
        ...prev,
        sizeGuide: guide.measurements
      }));
    }
  };

  const handleManualSizeGuideChange = (size, field, value) => {
    setProductData(prev => ({
      ...prev,
      sizeGuide: {
        ...prev.sizeGuide,
        [size]: {
          ...prev.sizeGuide[size],
          [field]: value
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
            sizes: initialSizes.map(size => ({ name: size, quantity: 0 }))
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitted(true);

    try {
      // Validate entire form using our validation functions
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

      // Calculate total quantity from all colors and sizes
      const totalQuantity = productData.colors.reduce((total, color) => {
        return total + color.sizes.reduce((sum, size) => sum + (Number(size.quantity) || 0), 0);
      }, 0);

      const formData = new FormData();
      
      // Required fields validation
      if (!productData.title) throw new Error("Product title is required");
      if (!productData.price || productData.price <= 0) throw new Error("Please enter a valid price");
      if (!productData.category) throw new Error("Please select a category");
      if (!productData.description) throw new Error("Product description is required");

      // Append images and data for each color
      productData.colors.forEach((color, colorIndex) => {
        if (color.images) {
          color.images.forEach((image, imageIndex) => {
            if (image.file) {
              formData.append(`colorImages_${colorIndex}_${imageIndex}`, image.file);
            }
          });
        }
        formData.append(`colorNames[${colorIndex}]`, color.name);
        formData.append(`colorSizes[${colorIndex}]`, JSON.stringify(color.sizes));
      });

      // Append size guide
      formData.append('sizeGuide', JSON.stringify(productData.sizeGuide));

      // Append other product details
      formData.append('title', productData.title.trim());
      formData.append('description', productData.description.trim());
      formData.append('price', productData.price.toString());
      formData.append('category', productData.category);
      formData.append('brand', productData.brand || '');
      formData.append('discountedPrice', productData.discountedPrice || productData.price);
      formData.append('discountPersent', productData.discountPersent || '0');
      formData.append('quantity', totalQuantity.toString());
      formData.append('isNewArrival', productData.isNewArrival || false);
      formData.append('sku', productData.sku || '');

      const response = await dispatch(updateProduct({ 
        productId,
        data: formData
      }));

      setSuccess("Product updated successfully!");
      navigate('/admin/products');
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err.response?.data?.message || err.message || "Failed to update product");
    }
  };

  useEffect(() => {
    if (productId) {
      dispatch(findProductById({ productId }));
      fetchSizeGuides();
    }
  }, [productId, dispatch]);

  useEffect(() => {
    if (customersProduct.product) {
      setProductData(prev => ({
        ...prev,
        colors: customersProduct.product.colors?.map(color => ({
          name: color.name,
          images: color.images?.map(imageUrl => ({
            preview: getImageUrl(imageUrl)
          })) || [],
          sizes: color.sizes || initialSizes.map(size => ({ name: size, quantity: 0 }))
        })) || [],
        brand: customersProduct.product.brand || "",
        title: customersProduct.product.title || "",
        discountedPrice: customersProduct.product.discountedPrice || "",
        price: customersProduct.product.price || "",
        discountPersent: customersProduct.product.discountPersent || "",
        sizeGuide: customersProduct.product.sizeGuide || initialSizeGuide,
        category: customersProduct.product.category?._id || "",
        description: customersProduct.product.description || "",
        sku: customersProduct.product.sku || "",
        isNewArrival: customersProduct.product.isNewArrival || false
      }));
    }
  }, [customersProduct.product]);

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

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ color: "primary.main", fontWeight: "bold" }}>
            Update Product
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
              Stock
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
          {/* Basic Information */}
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
                    label="Brand"
                    name="brand"
                    value={productData.brand}
                    onChange={handleChange}
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
                    required
                    error={submitted && !productData.price}
                    helperText={submitted && !productData.price ? "Price is required" : ""}
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
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={productData.category}
                      onChange={handleChange}
                      error={submitted && !productData.category}
                    >
                      <MenuItem value="men">Men</MenuItem>
                      <MenuItem value="women">Women</MenuItem>
                      <MenuItem value="kids">Kids</MenuItem>
                    </Select>
                    {submitted && !productData.category && (
                      <Typography color="error" variant="caption">
                        Category is required
                      </Typography>
                    )}
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
                </Grid>
              </Grid>
            </Card>
          </Box>

          {/* Colors and Images Section */}
          <Box sx={{ display: activeStep === 1 ? 'block' : 'none' }}>
            <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <ColorLensIcon sx={{ mr: 1 }} /> Colors and Images
              </Typography>
              {productData.colors.map((color, colorIndex) => (
                <Paper key={colorIndex} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Color Name"
                        value={color.name}
                        onChange={(e) => handleColorChange(colorIndex, 'name', e.target.value)}
                        error={submitted && !color.name}
                        helperText={submitted && !color.name ? "Color name is required" : ""}
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Box
                        sx={{
                          border: '2px dashed',
                          borderColor: 'primary.main',
                          borderRadius: 2,
                          p: 2,
                          textAlign: 'center',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
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
                          Upload images for this color (max 4)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                        {color.images?.map((image, imageIndex) => (
                          <Box key={imageIndex} sx={{ position: 'relative' }}>
                            <img
                              src={image.preview}
                              alt={`Color ${colorIndex} preview ${imageIndex}`}
                              style={{
                                width: '100px',
                                height: '100px',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            />
                            <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                bgcolor: 'background.paper',
                                '&:hover': { bgcolor: 'error.light', color: 'white' }
                              }}
                              onClick={() => handleRemoveImage(colorIndex, imageIndex)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                      {submitted && (!color.images || color.images.length === 0) && (
                        <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
                          At least one image is required
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              <Button
                variant="outlined"
                onClick={() => handleColorChange(productData.colors.length, 'name', '')}
                sx={{ mt: 2 }}
              >
                Add Color
              </Button>
            </Card>
          </Box>

          {/* Inventory Management */}
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

          {/* Size Guide & Description */}
          <Box sx={{ display: activeStep === 3 ? 'block' : 'none' }}>
            <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                    <DescriptionIcon sx={{ mr: 1 }} /> Product Description
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
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
                          required
                          error={submitted && !productData.description}
                          helperText={submitted && !productData.description ? "Description is required" : ""}
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
                          value={productData.features || ""}
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
                          value={productData.perfectFor || ""}
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
                          value={productData.additionalInfo || ""}
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
                          onChange={handleSizeGuideChange}
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
                                    onChange={(e) => handleManualSizeGuideChange(size, 'chest', e.target.value)}
                                  />
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    label="Length"
                                    value={productData.sizeGuide[size].length}
                                    onChange={(e) => handleManualSizeGuideChange(size, 'length', e.target.value)}
                                  />
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    label="Shoulder"
                                    value={productData.sizeGuide[size].shoulder}
                                    onChange={(e) => handleManualSizeGuideChange(size, 'shoulder', e.target.value)}
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
                startIcon={<SaveIcon />}
              >
                Update Product
              </Button>
            )}
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default UpdateProductForm;
