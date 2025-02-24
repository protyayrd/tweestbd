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
} from "@mui/material";
import { getCategories } from "../../../Redux/Admin/Category/Action";
import { createProduct } from "../../../Redux/Customers/Product/Action";
import { findProducts } from "../../../Redux/Customers/Product/Action";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from "react-router-dom";

const initialSizes = ["S", "M", "L", "XL", "XXL", "XXXL"];

const initialSizeGuide = {
  S: { chest: "", bodyLength: "" },
  M: { chest: "", bodyLength: "" },
  L: { chest: "", bodyLength: "" },
  XL: { chest: "", bodyLength: "" },
  XXL: { chest: "", bodyLength: "" },
  XXXL: { chest: "", bodyLength: "" }
};

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
    isNewArrival: false
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedSection, setExpandedSection] = useState('colors');

  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

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

  const handleSizeGuideChange = (size, field, value) => {
    setProductData(prevState => ({
      ...prevState,
      sizeGuide: {
        ...prevState.sizeGuide,
        [size]: {
          ...prevState.sizeGuide[size],
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

    try {
      // Required fields validation
      const requiredFields = {
        title: "Title",
        description: "Description",
        price: "Price",
        category: "Category"
      };

      for (const [field, label] of Object.entries(requiredFields)) {
        if (!productData[field]) {
          throw new Error(`${label} is required`);
        }
      }

      if (productData.price <= 0) {
        throw new Error("Please enter a valid price greater than 0");
      }

      // Validate colors and images
      if (productData.colors.length === 0) {
        throw new Error("Please add at least one color with images");
      }

      // Validate sizes for each color
      for (const color of productData.colors) {
        if (!color.name) {
          throw new Error("Please provide a name for each color");
        }
        if (!color.images || color.images.length === 0) {
          throw new Error(`Please add at least one image for color: ${color.name}`);
        }
        // Check if at least one size has quantity
        const hasSizeWithQuantity = color.sizes.some(size => Number(size.quantity) > 0);
        if (!hasSizeWithQuantity) {
          throw new Error(`Please add quantity for at least one size in color: ${color.name}`);
        }
      }

      const formData = new FormData();

      // Add basic product data
      formData.append('title', productData.title);
      formData.append('description', productData.description);
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

      // Log the form data for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      dispatch(createProduct(formData));
      setSuccess("Product created successfully!");
      navigate("/admin/products");
    } catch (error) {
      console.error('Error creating product:', error);
      setError(error.message);
    }
  };

  // Get categories by level
  const level3Categories = category?.categories?.filter(cat => cat.level === 3) || [];

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 4, textAlign: "center", color: "primary.main", fontWeight: "bold" }}>
          Create New Product
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Basic Information */}
            <Accordion 
              expanded={expandedSection === 'basic'} 
              onChange={() => setExpandedSection(expandedSection === 'basic' ? '' : 'basic')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Basic Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Title"
                      name="title"
                      value={productData.title}
                      onChange={handleChange}
                      required
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
                      helperText="Original price of the product"
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
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        name="category"
                        value={productData.category}
                        onChange={handleChange}
                        required
                      >
                        {level3Categories.map((cat) => (
                          <MenuItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Colors and Images Section */}
            <Accordion 
              expanded={expandedSection === 'colors'} 
              onChange={() => setExpandedSection(expandedSection === 'colors' ? '' : 'colors')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Colors and Images</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {productData.colors.map((color, colorIndex) => (
                  <Paper key={colorIndex} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Color Name"
                          value={color.name}
                          onChange={(e) => handleColorChange(colorIndex, 'name', e.target.value)}
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
                      </Grid>
                      
                      {/* Color-wise Sizes */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>Sizes for {color.name || 'this color'}</Typography>
                        <Grid container spacing={2}>
                          {color.sizes?.map((size, sizeIndex) => (
                            <Grid item xs={12} sm={4} key={sizeIndex}>
                              <Paper elevation={1} sx={{ p: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Size: {size.name}
                                </Typography>
                                <TextField
                                  fullWidth
                                  label="Quantity"
                                  type="number"
                                  value={size.quantity}
                                  onChange={(e) => handleColorSizeChange(colorIndex, sizeIndex, 'quantity', e.target.value)}
                                  sx={{ mt: 1 }}
                                />
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
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
              </AccordionDetails>
            </Accordion>

            {/* Size Guide Section */}
            <Accordion 
              expanded={expandedSection === 'sizeGuide'} 
              onChange={() => setExpandedSection(expandedSection === 'sizeGuide' ? '' : 'sizeGuide')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Size Guide</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {Object.entries(productData.sizeGuide).map(([size, measurements]) => (
                    <Grid item xs={12} sm={4} key={size}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>Size {size}</Typography>
                        <TextField
                          fullWidth
                          label="Chest (inches)"
                          type="number"
                          value={measurements.chest}
                          onChange={(e) => handleSizeGuideChange(size, 'chest', e.target.value)}
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          label="Body Length (inches)"
                          type="number"
                          value={measurements.bodyLength}
                          onChange={(e) => handleSizeGuideChange(size, 'bodyLength', e.target.value)}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Description Section */}
            <Accordion 
              expanded={expandedSection === 'description'} 
              onChange={() => setExpandedSection(expandedSection === 'description' ? '' : 'description')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Description & Additional Info</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      multiline
                      rows={4}
                      value={productData.description}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>New Arrival</InputLabel>
                      <Select
                        name="isNewArrival"
                        value={productData.isNewArrival}
                        onChange={handleChange}
                      >
                        <MenuItem value={true}>Yes</MenuItem>
                        <MenuItem value={false}>No</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 3 }}
            >
              Create Product
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateProductForm;
