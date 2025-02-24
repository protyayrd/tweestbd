import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { findProductById } from '../../../Redux/Customers/Product/Action';
import { getImageUrl } from '../../../config/api';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  MobileStepper,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const ProductDetails = () => {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const { product, loading, error } = useSelector((state) => state.customersProduct);
  const theme = useTheme();

  // State for image carousel
  const [selectedColor, setSelectedColor] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [expandedSection, setExpandedSection] = useState('images');

  useEffect(() => {
    if (productId) {
      dispatch(findProductById({ productId }));
    }
  }, [dispatch, productId]);

  useEffect(() => {
    // Reset image carousel when product changes
    setSelectedColor(0);
    setActiveStep(0);
  }, [product]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleColorChange = (colorIndex) => {
    setSelectedColor(colorIndex);
    setActiveStep(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Product not found</Typography>
      </Box>
    );
  }

  const currentColor = product.colors?.[selectedColor];
  const maxSteps = currentColor?.images?.length || 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: "center", color: "primary.main", fontWeight: "bold" }}>
        Product Details
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
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
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Title</Typography>
                    <Typography variant="body1">{product.title}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Brand</Typography>
                    <Typography variant="body1">{product.brand || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Original Price</Typography>
                    <Typography variant="body1">Tk. {product.price}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Discounted Price</Typography>
                    <Typography variant="body1">
                      {product.discountedPrice ? `Tk. ${product.discountedPrice}` : 'No discount'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Discount</Typography>
                    <Typography variant="body1">
                      {product.discountPersent ? `${product.discountPersent}%` : 'No discount'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                    <Typography variant="body1">{product.category?.name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">New Arrival</Typography>
                    <Chip 
                      label={product.isNewArrival ? 'Yes' : 'No'}
                      color={product.isNewArrival ? 'success' : 'default'}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Images and Colors */}
            <Accordion 
              expanded={expandedSection === 'images'} 
              onChange={() => setExpandedSection(expandedSection === 'images' ? '' : 'images')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Images and Colors</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    {/* Main Image Display */}
                    <Box sx={{ position: 'relative' }}>
                      <Box
                        component="img"
                        src={currentColor?.images?.[activeStep] ? getImageUrl(currentColor.images[activeStep]) : 'https://via.placeholder.com/400'}
                        alt={`${product.title} - ${currentColor?.name || ''}`}
                        sx={{
                          width: '100%',
                          height: 400,
                          objectFit: 'contain',
                          bgcolor: 'background.default'
                        }}
                      />
                      
                      {/* Image Navigation */}
                      {maxSteps > 1 && (
                        <MobileStepper
                          steps={maxSteps}
                          position="static"
                          activeStep={activeStep}
                          sx={{
                            bgcolor: 'transparent',
                            '& .MuiMobileStepper-dot': {
                              bgcolor: 'rgba(0, 0, 0, 0.3)',
                            },
                            '& .MuiMobileStepper-dotActive': {
                              bgcolor: 'primary.main',
                            }
                          }}
                          nextButton={
                            <IconButton
                              size="small"
                              onClick={handleNext}
                              disabled={activeStep === maxSteps - 1}
                              sx={{
                                bgcolor: 'background.paper',
                                '&:hover': { bgcolor: 'background.default' }
                              }}
                            >
                              <KeyboardArrowRight />
                            </IconButton>
                          }
                          backButton={
                            <IconButton
                              size="small"
                              onClick={handleBack}
                              disabled={activeStep === 0}
                              sx={{
                                bgcolor: 'background.paper',
                                '&:hover': { bgcolor: 'background.default' }
                              }}
                            >
                              <KeyboardArrowLeft />
                            </IconButton>
                          }
                        />
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Available Colors</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {product.colors?.map((color, index) => (
                        <Box
                          key={index}
                          onClick={() => handleColorChange(index)}
                          sx={{
                            width: 80,
                            height: 80,
                            cursor: 'pointer',
                            border: index === selectedColor ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                            borderRadius: 1,
                            overflow: 'hidden',
                            position: 'relative'
                          }}
                        >
                          <Box
                            component="img"
                            src={color.images?.[0] ? getImageUrl(color.images[0]) : 'https://via.placeholder.com/80'}
                            alt={color.name}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              bgcolor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              textAlign: 'center',
                              py: 0.5
                            }}
                          >
                            {color.name}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Stock Information */}
            <Accordion 
              expanded={expandedSection === 'stock'} 
              onChange={() => setExpandedSection(expandedSection === 'stock' ? '' : 'stock')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Stock Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Color</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {product.colors?.map((color) => (
                        color.sizes?.map((size) => (
                          <TableRow key={`${color.name}-${size.name}`}>
                            <TableCell>{color.name}</TableCell>
                            <TableCell>{size.name}</TableCell>
                            <TableCell align="right">{size.quantity}</TableCell>
                          </TableRow>
                        ))
                      ))}
                      <TableRow>
                        <TableCell colSpan={2}><strong>Total Quantity</strong></TableCell>
                        <TableCell align="right"><strong>{product.quantity}</strong></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>

            {/* Size Guide */}
            <Accordion 
              expanded={expandedSection === 'sizeGuide'} 
              onChange={() => setExpandedSection(expandedSection === 'sizeGuide' ? '' : 'sizeGuide')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Size Guide</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Size</TableCell>
                        <TableCell align="right">Chest (inches)</TableCell>
                        <TableCell align="right">Body Length (inches)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(product.sizeGuide || {}).map(([size, measurements]) => (
                        <TableRow key={size}>
                          <TableCell>{size}</TableCell>
                          <TableCell align="right">{measurements.chest || 'N/A'}</TableCell>
                          <TableCell align="right">{measurements.bodyLength || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>

            {/* Description */}
            <Accordion 
              expanded={expandedSection === 'description'} 
              onChange={() => setExpandedSection(expandedSection === 'description' ? '' : 'description')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Description</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1">
                  {product.description || 'No description available'}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductDetails; 