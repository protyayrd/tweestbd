import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createTshirtOrder } from '../../../Redux/Customers/TshirtOrder/Action';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  useTheme,
  useMediaQuery,
  Slide,
  Fade,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Step,
  StepLabel,
  Stepper,
  styled,
  Tooltip,
  Avatar,
  createTheme,
  ThemeProvider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import ShirtIcon from '@mui/icons-material/Checkroom';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import StraightenIcon from '@mui/icons-material/Straighten';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../../config/api';

// Custom theme with the specified green color scheme
const customTheme = createTheme({
  palette: {
    primary: {
      main: '#0f4b41',
      light: 'rgba(15, 75, 65, 0.2)',
      lighter: 'rgba(15, 75, 65, 0.1)',
      dark: '#053c32',
    },
    secondary: {
      main: '#5a9669',
      light: 'rgba(90, 150, 105, 0.2)',
      lighter: 'rgba(90, 150, 105, 0.1)',
      dark: '#4a8559',
    },
    info: {
      main: '#5a9669',
      lighter: 'rgba(90, 150, 105, 0.1)',
    },
    success: {
      main: '#5a9669',
    },
    error: {
      main: '#e74c3c',
    },
    background: {
      default: '#dcf5dc',
      paper: '#ffffff',
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0f4b41',
            borderWidth: '2px',
            boxShadow: '0 0 8px rgba(15, 75, 65, 0.25)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(15, 75, 65, 0.5)',
          },
          transition: 'box-shadow 0.3s ease',
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: '#0f4b41',
          },
        }
      }
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: '#e0e0e0',
          '&.Mui-checked': {
            color: '#0f4b41',
          },
        }
      }
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#e0e0e0',
          '&.Mui-checked': {
            color: '#0f4b41',
          },
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderImage: 'linear-gradient(to right, rgba(15, 75, 65, 0.3), rgba(90, 150, 105, 0.3)) 1',
          borderImageSlice: 1,
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: '0 4px 10px rgba(15, 75, 65, 0.25)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 15px rgba(15, 75, 65, 0.35)',
          }
        }
      }
    }
  }
});

// Custom styled components for the form
const FormPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s ease-in-out',
  border: '1px solid transparent',
  borderImage: 'linear-gradient(135deg, rgba(15, 75, 65, 0.2), rgba(90, 150, 105, 0.2)) 1',
  borderImageSlice: 1,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    padding: '2px',
    background: 'linear-gradient(135deg, rgba(15, 75, 65, 0.2), rgba(90, 150, 105, 0.2))',
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'exclude',
    pointerEvents: 'none',
  },
  [theme.breakpoints.down('sm')]: {
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
    '&::before': {
      borderRadius: 8,
    }
  }
}));

const FormHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  background: 'linear-gradient(135deg, #0f4b41 0%, #5a9669 100%)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    flexDirection: 'column',
    textAlign: 'center',
  }
}));

const StyledStepper = styled(Stepper)(({ theme }) => ({
  padding: theme.spacing(3, 2, 2),
  background: 'white',
  borderBottom: '1px solid',
  borderColor: theme.palette.grey[200],
  '& .MuiStepLabel-label': {
    fontWeight: 500,
  },
  '& .MuiStepIcon-root.Mui-active': {
    color: '#0f4b41',
  },
  '& .MuiStepIcon-root.Mui-completed': {
    color: '#5a9669',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2, 1, 1),
    '& .MuiStepLabel-label': {
      fontSize: '0.75rem',
    },
  }
}));

const FormContentBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  minHeight: '450px',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    minHeight: 'auto',
  }
}));

const ActionButton = styled(Button)(({ theme, color = 'primary' }) => ({
  borderRadius: 8,
  padding: theme.spacing(1.5, 4),
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: color === 'primary' ? '0 4px 14px rgba(25, 118, 210, 0.3)' : 'none',
  transition: 'all 0.3s ease',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1, 2),
    fontSize: '0.9rem',
    width: color === 'primary' ? '100%' : 'auto',
  }
}));

const StepIcon = ({ icon, active }) => {
  const icons = {
    1: <PersonIcon />,
    2: <ShirtIcon />,
    3: <LocalShippingIcon />,
  };

  return (
    <Avatar
      sx={{
        width: 30,
        height: 30,
        bgcolor: active ? '#0f4b41' : 'grey.400',
        color: 'white',
      }}
    >
      {icons[String(icon)]}
    </Avatar>
  );
};

const TshirtOrderForm = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    jerseyCategory: '',
    jerseyName: '',
    jerseyNumber: '',
    tshirtSize: '',
    sscBatch: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [formSettings, setFormSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState({
    apiBaseUrl: api.defaults.baseURL,
    responseReceived: false,
    responseStatus: null,
    dataAvailable: false
  });

  // Form steps configuration
  const steps = [
    {
      label: 'Personal Info',
      icon: <PersonIcon />,
      optional: false
    },
    {
      label: 'Jersey Details',
      icon: <ShirtIcon />,
      optional: false
    },
    {
      label: 'Delivery & Payment',
      icon: <LocalShippingIcon />,
      optional: false
    }
  ];

  useEffect(() => {
    fetchFormSettings();
  }, []);

  const fetchFormSettings = async () => {
    try {
      setDebugInfo(prev => ({ ...prev, apiRequestSent: true }));

      const response = await api.get('/api/jersey-form-settings');

      setDebugInfo(prev => ({
        ...prev,
        responseReceived: true,
        responseStatus: response.status,
        dataAvailable: !!response.data?.data
      }));


      if (response.data && response.data.data) {
        setFormSettings(response.data.data);
      } else {
        console.warn('API response missing expected data structure');
        setErrors(prev => ({ ...prev, apiFormat: 'API response format is invalid' }));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching form settings:', error);
      setDebugInfo(prev => ({
        ...prev,
        responseReceived: true,
        responseStatus: error.response?.status || 'Network Error',
        error: error.message
      }));

      // Create default settings if API fails
      setFormSettings({
        jerseyCategories: [
          {
            name: 'Half Sleeve',
            price: 10,
            image: 'https://via.placeholder.com/300x400/0f4b41/ffffff?text=Half+Sleeve',
            isActive: true
          },
          {
            name: 'Full Sleeve',
            price: 15,
            image: 'https://via.placeholder.com/300x400/5a9669/ffffff?text=Full+Sleeve',
            isActive: true
          }
        ],
        jerseySizes: [
          { size: 'S', chest: '36-38"', length: '26"', shoulder: '17"', isActive: true },
          { size: 'M', chest: '38-40"', length: '27"', shoulder: '18"', isActive: true },
          { size: 'L', chest: '40-42"', length: '28"', shoulder: '19"', isActive: true },
          { size: 'XL', chest: '42-44"', length: '29"', shoulder: '20"', isActive: true },
          { size: 'XXL', chest: '44-46"', length: '30"', shoulder: '21"', isActive: true },
          { size: '3XL', chest: '46-48"', length: '31"', shoulder: '22"', isActive: true }
        ],
        sscBatchYears: [
          { year: '2015', isActive: true },
          { year: '2016', isActive: true },
          { year: '2017', isActive: true },
          { year: '2018', isActive: true },
          { year: '2019', isActive: true },
          { year: '2020', isActive: true },
          { year: '2021', isActive: true },
          { year: '2022', isActive: true },
          { year: '2023', isActive: true }
        ],
        defaultLocation: {
          zipCode: '5100',
          division: 'Rangpur',
          district: 'Thakurgaon'
        },
        isFormActive: true
      });
      setLoading(false);
    }
  };

  const jerseyCategories = formSettings?.jerseyCategories.filter(cat => cat.isActive) || [];
  const tshirtSizes = formSettings?.jerseySizes.filter(size => size.isActive) || [];
  const batchYears = formSettings?.sscBatchYears.filter(year => year.isActive) || [];

  const validateForm = (step) => {
    const newErrors = {};
    const englishNameRegex = /^[A-Za-z\s]*$/;
    const phoneRegex = /^(\+?880|0)1[3-9]\d{8}$/;

    switch (step) {
      case 0:
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.phone) {
          newErrors.phone = 'Phone is required';
        } else if (!phoneRegex.test(formData.phone)) {
          newErrors.phone = 'Please enter a valid Bangladesh phone number';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        break;
      case 1:
        if (!formData.jerseyCategory) newErrors.jerseyCategory = 'Please select a jersey type';
        if (!formData.tshirtSize) newErrors.tshirtSize = 'Please select a size';
        if (!formData.jerseyName) {
          newErrors.jerseyName = 'Jersey name is required';
        } else if (!englishNameRegex.test(formData.jerseyName)) {
          newErrors.jerseyName = 'Please use only English letters';
        }
        if (!formData.jerseyNumber) {
          newErrors.jerseyNumber = 'Jersey number is required';
        } else if (isNaN(formData.jerseyNumber) || formData.jerseyNumber < 0 || formData.jerseyNumber > 99) {
          newErrors.jerseyNumber = 'Please enter a number between 0 and 99';
        }
        if (!formData.sscBatch) {
          newErrors.sscBatch = 'SSC batch year is required';
        }
        break;
      case 2:
        if (!formData.address) newErrors.address = 'Delivery address is required';
        if (formData.address && formData.address.length < 10) {
          newErrors.address = 'Please provide a complete address with at least 10 characters';
        }
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'jerseyName' && !/^[A-Za-z\s]*$/.test(value)) {
      return; // Only allow English letters
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const calculatePrice = () => {
    const selectedCategory = jerseyCategories.find(cat => cat.name === formData.jerseyCategory);
    return selectedCategory ? selectedCategory.price : 0;
  };

  const handleNext = () => {
    if (validateForm(currentStep)) {
      setCurrentStep(prev => prev + 1);
      // Scroll to top of form when moving between steps
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    // Scroll to top of form when moving between steps
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (validateForm(currentStep)) {
      setIsSubmitting(true);
      try {
        const orderData = {
          ...formData,
          price: calculatePrice(),
          status: 'Pending',
          paymentStatus: 'Pending',
          zipCode: formSettings?.defaultLocation.zipCode || '5100',
          division: formSettings?.defaultLocation.division || 'Rangpur',
          district: formSettings?.defaultLocation.district || 'Thakurgaon'
        };

        const result = await dispatch(createTshirtOrder(orderData));

        if (result.success && result.data?.data?.sslUrl) {
          window.location.href = result.data.data.sslUrl;
        } else {
          setErrors(prev => ({
            ...prev,
            submit: result.error || 'Failed to initialize payment. Please try again.'
          }));
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error('Order submission error:', error);
        setErrors(prev => ({
          ...prev,
          submit: error.message || 'An unexpected error occurred'
        }));
        setIsSubmitting(false);
      }
    }
  };

  const renderPersonalInfo = () => (
    <Fade in={currentStep === 0}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" color="#0f4b41" gutterBottom sx={{
            fontWeight: 600,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}>
            Enter Your Personal Information
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            We&apos;ll use these details to contact you about your order
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            placeholder="Enter your full name as it should appear on delivery"
            InputProps={{
              sx: {
                borderRadius: 2,
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'background.paper',
                }
              }
            }}
            size={isMobile ? "small" : "medium"}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            error={!!errors.phone}
            helperText={errors.phone || "e.g. 017XXXXXXXX"}
            placeholder="Enter your Bangladesh mobile number"
            InputProps={{
              sx: {
                borderRadius: 2,
                bgcolor: 'background.paper'
              }
            }}
            size={isMobile ? "small" : "medium"}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            label="Email Address (Optional)"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            placeholder="For order confirmation & updates"
            InputProps={{
              sx: {
                borderRadius: 2,
                bgcolor: 'background.paper'
              }
            }}
            size={isMobile ? "small" : "medium"}
          />
        </Grid>

        <Grid item xs={12} sx={{ mt: { xs: 1, sm: 2 } }}>
          <Box sx={{
            p: { xs: 1.5, sm: 2 },
            bgcolor: 'rgba(15, 75, 65, 0.1)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'rgba(15, 75, 65, 0.2)'
          }}>
            <Typography variant="body2" sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}>
              <InfoOutlinedIcon sx={{ color: '#0f4b41' }} fontSize="small" />
              All fields marked with * are required. You&apos;ll provide delivery details and choose your jersey options in the next steps.
            </Typography>
          </Box>
        </Grid>

        {errors.name && (
          <Typography color="#e74c3c" variant="caption" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ErrorOutlineIcon fontSize="small" />
            {errors.name}
          </Typography>
        )}
      </Grid>
    </Fade>
  );

  const renderJerseyDetails = () => (
    <Fade in={currentStep === 1}>
      <Grid container spacing={3.5}>
        <Grid item xs={12}>
          <Typography variant="h6" color="#0f4b41" gutterBottom sx={{
            fontWeight: 600,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}>
            Design Your Jersey
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select your preferred jersey style and customize how it will look
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Select Jersey Type
            </Typography>
            <FormControl component="fieldset" fullWidth error={!!errors.jerseyCategory}>
              <RadioGroup
                name="jerseyCategory"
                value={formData.jerseyCategory}
                onChange={handleChange}
              >
                <Grid container spacing={3}>
                  {jerseyCategories.map((category) => (
                    <Grid item xs={12} sm={6} md={4} key={category.name}>
                      <Zoom in timeout={300}>
                        <Card
                          onClick={() => handleChange({
                            target: { name: 'jerseyCategory', value: category.name }
                          })}
                          elevation={formData.jerseyCategory === category.name ? 6 : 1}
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.4s ease',
                            transform: formData.jerseyCategory === category.name ? 'scale(1.02)' : 'scale(1)',
                            border: formData.jerseyCategory === category.name ? '2px solid #0f4b41' : '2px solid transparent',
                            borderRadius: 3,
                            overflow: 'hidden',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            maxWidth: '100%',
                            '&:hover': {
                              transform: 'scale(1.03)',
                              boxShadow: '0 8px 20px rgba(15, 75, 65, 0.2)'
                            }
                          }}
                        >
                          <FormControlLabel
                            value={category.name}
                            control={<Radio sx={{ display: 'none' }} />}
                            label=""
                            sx={{ m: 0, width: '100%', height: '100%' }}
                          />
                          <CardContent sx={{
                            p: 0,
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            '&:last-child': {
                              pb: 0
                            }
                          }}>
                            <Box sx={{
                              p: 0,
                              flexGrow: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              overflow: 'hidden',
                              height: { xs: 400, sm: 480, md: 560 },
                              width: '100%',
                              background: 'linear-gradient(to bottom, #f8f8f8, #dcf5dc)',
                              borderBottom: '1px solid rgba(15, 75, 65, 0.1)'
                            }}>
                              <Box
                                component="img"
                                src={category.image}
                                alt={category.name}
                                sx={{
                                  width: '90%',
                                  height: '90%',
                                  objectFit: 'contain',
                                  objectPosition: 'center',
                                  transition: 'transform 0.5s ease',
                                  transformOrigin: 'center',
                                  padding: 1,
                                  '&:hover': {
                                    transform: 'scale(1.1)'
                                  }
                                }}
                                loading="lazy"
                              />
                              
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: formData.jerseyCategory === category.name 
                                    ? 'linear-gradient(135deg, rgba(15, 75, 65, 0.15) 0%, rgba(90, 150, 105, 0.15) 100%)'
                                    : 'transparent',
                                  transition: 'background 0.3s ease',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, rgba(15, 75, 65, 0.08) 0%, rgba(90, 150, 105, 0.08) 100%)'
                                  }
                                }}
                              />
                            </Box>

                            <Box sx={{ 
                              p: { xs: 2, sm: 2.5 }, 
                              textAlign: 'center', 
                              backgroundColor: 'white' 
                            }}>
                              <Typography variant="h6" gutterBottom sx={{
                                fontSize: { xs: '1rem', sm: '1.25rem' },
                                fontWeight: 600,
                                color: formData.jerseyCategory === category.name ? '#0f4b41' : 'text.primary'
                              }}>
                                {category.name}
                              </Typography>
                              <Typography
                                variant="h6"
                                color="#0f4b41"
                                fontWeight="bold"
                                sx={{
                                  display: 'inline-block',
                                  bgcolor: 'rgba(15, 75, 65, 0.1)',
                                  px: 2,
                                  py: 0.5,
                                  borderRadius: 2,
                                  fontSize: { xs: '0.9rem', sm: '1.25rem' }
                                }}
                              >
                                {category.price} Taka
                              </Typography>
                            </Box>
                          </CardContent>
                          {formData.jerseyCategory === category.name && (
                            <Box sx={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              bgcolor: '#0f4b41',
                              borderRadius: '50%',
                              width: 32,
                              height: 32,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                              zIndex: 2
                            }}>
                              <CheckCircleOutlineIcon sx={{ color: 'white', fontSize: 20 }} />
                            </Box>
                          )}
                        </Card>
                      </Zoom>
                    </Grid>
                  ))}
                </Grid>
              </RadioGroup>
            </FormControl>
            {errors.jerseyCategory && (
              <Typography color="error" variant="caption" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ErrorOutlineIcon fontSize="small" />
                {errors.jerseyCategory}
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              mb: 2,
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 0 }
            }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Select Jersey Size
              </Typography>
              <Button
                startIcon={<StraightenIcon />}
                onClick={() => setShowSizeGuide(true)}
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                sx={{ borderRadius: 2 }}
              >
                Size Guide
              </Button>
            </Box>
            <Grid container spacing={1.5}>
              {tshirtSizes.map((sizeOption) => (
                <Grid item xs={4} sm={2} key={sizeOption.size}>
                  <Card
                    onClick={() => handleChange({
                      target: { name: 'tshirtSize', value: sizeOption.size }
                    })}
                    elevation={formData.tshirtSize === sizeOption.size ? 4 : 0}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: formData.tshirtSize === sizeOption.size ?
                        '2px solid #0f4b41' : '1px solid #e0e0e0',
                      bgcolor: formData.tshirtSize === sizeOption.size ? 'rgba(15, 75, 65, 0.1)' : 'white',
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: '#0f4b41',
                        transform: 'translateY(-2px)',
                      }
                    }}
                  >
                    <CardContent sx={{
                      textAlign: 'center',
                      p: { xs: 1, sm: 1.5 },
                    }}>
                      <Typography variant="h6" fontWeight="bold" sx={{
                        fontSize: { xs: '0.9rem', sm: '1.25rem' }
                      }}>
                        {sizeOption.size}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {errors.tshirtSize && (
              <Typography color="error" variant="caption" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ErrorOutlineIcon fontSize="small" />
                {errors.tshirtSize}
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Jersey Name"
            name="jerseyName"
            value={formData.jerseyName}
            onChange={handleChange}
            error={!!errors.jerseyName}
            helperText={errors.jerseyName}
            placeholder="Name to print on jersey"
            InputProps={{
              sx: { borderRadius: 2 }
            }}
            size={isMobile ? "small" : "medium"}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Jersey Number"
            name="jerseyNumber"
            type="number"
            value={formData.jerseyNumber}
            onChange={handleChange}
            error={!!errors.jerseyNumber}
            helperText={errors.jerseyNumber}
            placeholder="Number to print on jersey (0-99)"
            InputProps={{
              sx: { borderRadius: 2 }
            }}
            size={isMobile ? "small" : "medium"}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            select
            label="SSC Batch Year"
            name="sscBatch"
            value={formData.sscBatch}
            onChange={handleChange}
            error={!!errors.sscBatch}
            helperText={errors.sscBatch}
            InputProps={{
              sx: { borderRadius: 2 }
            }}
            size={isMobile ? "small" : "medium"}
            required
          >
            {batchYears.map((yearItem) => (
              <MenuItem key={yearItem.year} value={yearItem.year}>
                {yearItem.year}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </Fade>
  );

  const renderDeliveryDetails = () => (
    <Fade in={currentStep === 2}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" color="#0f4b41" gutterBottom sx={{
            fontWeight: 600,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}>
            Delivery Details
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please provide your complete delivery address
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            multiline
            rows={isMobile ? 3 : 4}
            label="Delivery Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            error={!!errors.address}
            helperText={errors.address || "Include building/house no, road, area, landmark"}
            placeholder="Enter your full delivery address"
            InputProps={{
              sx: { borderRadius: 2 }
            }}
            size={isMobile ? "small" : "medium"}
            required
          />

          <Box sx={{
            mt: 2,
            p: { xs: 1.5, sm: 2 },
            bgcolor: 'rgba(90, 150, 105, 0.1)',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1
          }}>
            <InfoOutlinedIcon sx={{ color: '#5a9669', mt: 0.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}>
              Delivery will be made to the address provided. Your jersey will be dispatched within 7-10 business days.
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            elevation={3}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 6px 20px rgba(15, 75, 65, 0.15)',
              border: '1px solid rgba(15, 75, 65, 0.1)',
            }}
          >
            <Box sx={{
              p: { xs: 1.5, sm: 2 },
              background: 'linear-gradient(135deg, #0f4b41 0%, #5a9669 100%)',
              color: 'white',
            }}>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}>
                Order Summary
              </Typography>
            </Box>

            <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 } }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Jersey Type:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{formData.jerseyCategory || '-'}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Size:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{formData.tshirtSize || '-'}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Name on Jersey:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{formData.jerseyName || '-'}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Number:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{formData.jerseyNumber || '-'}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>SSC Batch:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{formData.sscBatch || '-'}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ 
                    my: { xs: 1, sm: 2 },
                    height: '2px',
                    background: 'linear-gradient(to right, rgba(15, 75, 65, 0.2), rgba(90, 150, 105, 0.2))'
                  }} />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Total Amount:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" color="#0f4b41" fontWeight={600} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    {calculatePrice()} Taka
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    * Cash on delivery is not available. You&apos;ll be redirected to secure payment gateway after submission.
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {errors.submit && (
          <Grid item xs={12}>
            <Alert 
              severity="error" 
              sx={{
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                '& .MuiAlert-icon': {
                  color: '#e74c3c'
                }
              }}
            >
              {errors.submit}
            </Alert>
          </Grid>
        )}
      </Grid>
    </Fade>
  );

  // Size Guide Dialog
  const renderSizeGuide = () => (
    <Dialog
      open={showSizeGuide}
      onClose={() => setShowSizeGuide(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          overflow: 'hidden',
          maxWidth: { xs: '95%', sm: '600px' }
        }
      }}
    >
      <DialogTitle sx={{
        bgcolor: '#0f4b41',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: { xs: 1.5, sm: 2 },
        px: { xs: 2, sm: 3 },
        fontSize: { xs: '1.1rem', sm: '1.25rem' }
      }}>
        <StraightenIcon />
        Jersey Size Guide
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Typography variant="body2" color="text.secondary" paragraph sx={{
          mt: 1,
          fontSize: { xs: '0.8rem', sm: '0.875rem' }
        }}>
          Please choose your size carefully using the measurements below as a guide:
        </Typography>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflowX: 'auto'
          }}
        >
          <Table size={isMobile ? "small" : "medium"}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(15, 75, 65, 0.1)' }}>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Size</TableCell>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Chest</TableCell>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Length</TableCell>
                <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Shoulder</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tshirtSizes.map((size) => (
                <TableRow
                  key={size.size}
                  hover
                  sx={{
                    '&:nth-of-type(odd)': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{size.size}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{size.chest}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{size.length}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{size.shoulder}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mt: 3, bgcolor: 'rgba(90, 150, 105, 0.1)', p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.primary" gutterBottom sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
            How to Measure:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            <strong>Chest:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.<br />
            <strong>Length:</strong> Measure from the highest point of the shoulder to the bottom hem.<br />
            <strong>Shoulder:</strong> Measure from the end of one shoulder to the other.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Button
          onClick={() => setShowSizeGuide(false)}
          variant="contained"
          sx={{ 
            borderRadius: 2,
            bgcolor: '#0f4b41',
            '&:hover': {
              bgcolor: '#053c32'
            }
          }}
          size={isMobile ? "small" : "medium"}
          fullWidth={isMobile}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <ThemeProvider theme={customTheme}>
        <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="60vh" gap={3}>
            <Box position="relative" width={60} height={60}>
              <CircularProgress 
                size={60} 
                thickness={4} 
                sx={{ 
                  color: '#0f4b41',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }} 
              />
              <CircularProgress 
                size={40} 
                thickness={4} 
                sx={{ 
                  color: '#5a9669',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-20px',
                  marginLeft: '-20px'
                }} 
              />
            </Box>
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
            >
              Loading jersey ordering options...
            </Typography>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  // Check if form is active
  if (!formSettings.isFormActive) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
        <Paper elevation={3} sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: { xs: 2, sm: 3 },
          textAlign: 'center'
        }}>
          <SportsSoccerIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: '#5a9669', mb: 2 }} />
          <Typography
            variant="h5"
            gutterBottom
            fontWeight={600}
            sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
          >
            Jersey Ordering Temporarily Unavailable
          </Typography>
          <Alert severity="info" sx={{
            my: 3,
            borderRadius: 2,
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}>
            The jersey order form is currently unavailable. Please check back later or contact us for more information.
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{
              mt: 2,
              borderRadius: 2,
              px: { xs: 3, sm: 4 },
              background: 'linear-gradient(135deg, #0f4b41 0%, #5a9669 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #053c32 0%, #4a8559 100%)'
              }
            }}
            size={isMobile ? "medium" : "large"}
          >
            Return to Homepage
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <ThemeProvider theme={customTheme}>
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(15, 75, 65, 0.03) 0%, rgba(220, 245, 220, 0.2) 100%)',
        minHeight: '100vh',
        py: { xs: 2, md: 4 }
      }}>
        <Container maxWidth="lg">
          <FormPaper>
            <FormHeader>
              <SportsSoccerIcon sx={{
                fontSize: { xs: 30, md: 40 },
                animation: 'float 3s ease-in-out infinite'
              }} />
              <Box>
                <Typography variant="h4" component="h1" sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                }}>
                  Jersey Order Form
                </Typography>
                <Typography variant="subtitle1" sx={{
                  opacity: 0.8,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}>
                  Customize your Thakurgaon Govt. Boys High School jersey
                </Typography>
              </Box>
            </FormHeader>

            <StyledStepper activeStep={currentStep} alternativeLabel>
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    optional={step.optional && <Typography variant="caption">Optional</Typography>}
                    StepIconComponent={(props) => <StepIcon {...props} active={index === currentStep} />}
                  >
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </StyledStepper>

            <FormContentBox>
              {currentStep === 0 && renderPersonalInfo()}
              {currentStep === 1 && renderJerseyDetails()}
              {currentStep === 2 && renderDeliveryDetails()}

              <Box sx={{
                mt: 4,
                display: 'flex',
                justifyContent: { xs: currentStep === 0 ? 'flex-end' : 'space-between', sm: 'space-between' },
                flexDirection: { xs: currentStep === 0 ? 'row' : 'column', sm: 'row' },
                gap: { xs: 2, sm: 0 }
              }}>
                <ActionButton
                  variant="outlined"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  startIcon={<KeyboardBackspaceIcon />}
                  color="secondary"
                  sx={{
                    visibility: currentStep === 0 ? 'hidden' : 'visible',
                    display: { xs: currentStep === 0 ? 'none' : 'flex', sm: 'flex' },
                    order: { xs: 2, sm: 1 },
                    borderColor: '#0f4b41',
                    color: '#0f4b41',
                    '&:hover': {
                      borderColor: '#053c32',
                      backgroundColor: 'rgba(15, 75, 65, 0.04)'
                    }
                  }}
                >
                  Back
                </ActionButton>

                {currentStep === 2 ? (
                  <ActionButton
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #0f4b41 0%, #5a9669 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #053c32 0%, #4a8559 100%)'
                      },
                      order: { xs: 1, sm: 2 },
                      boxShadow: '0 4px 14px rgba(15, 75, 65, 0.4)'
                    }}
                  >
                    {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                  </ActionButton>
                ) : (
                  <ActionButton
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #0f4b41 0%, #5a9669 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #053c32 0%, #4a8559 100%)'
                      },
                      order: { xs: 1, sm: 2 },
                      boxShadow: '0 4px 14px rgba(15, 75, 65, 0.4)'
                    }}
                  >
                    Continue
                  </ActionButton>
                )}
              </Box>
            </FormContentBox>
          </FormPaper>

          {renderSizeGuide()}

          <style>
            {`
              @keyframes float {
                0% {
                  transform: translateY(0px);
                }
                50% {
                  transform: translateY(-10px);
                }
                100% {
                  transform: translateY(0px);
                }
              }
              
              @keyframes pulse {
                0% {
                  transform: scale(1);
                  opacity: 1;
                }
                50% {
                  transform: scale(1.1);
                  opacity: 0.8;
                }
                100% {
                  transform: scale(1);
                  opacity: 1;
                }
              }
            `}
          </style>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default TshirtOrderForm; 