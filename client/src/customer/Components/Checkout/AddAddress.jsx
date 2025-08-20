import * as React from "react";
import { 
  Grid, 
  TextField, 
  Button, 
  Box, 
  MenuItem, 
  CircularProgress, 
  Typography,
  Paper,
  Divider,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  CardActions,
  RadioGroup,
  Radio,
  Badge,
  Chip,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createOrder } from "../../../Redux/Customers/Order/Action";
import { useState, useEffect } from "react";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeIcon from '@mui/icons-material/Home';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import pathaoService from '../../../services/pathaoService';

// Updated colors: 00503a (dark green), 69af5a (medium green), e1ffe3 (light green), and B&W
const PRIMARY_COLOR = '#00503a';
const SECONDARY_COLOR = '#69af5a';
const LIGHT_COLOR = '#e1ffe3';

const commonTextFieldStyles = {
  '& .MuiOutlinedInput-root': { 
    '&.Mui-focused fieldset': { 
      borderColor: SECONDARY_COLOR // #69af5a (medium green)
    },
    '&:hover fieldset': {
      borderColor: SECONDARY_COLOR 
    },
    // Add text color for input
    '& input': {
      color: PRIMARY_COLOR // #00503a (dark green)
    },
    // For multiline inputs
    '& textarea': {
      color: PRIMARY_COLOR // #00503a (dark green)
    }
  },
  '& .MuiInputLabel-root': {
    color: PRIMARY_COLOR, // #00503a (dark green) for all labels
    '&.Mui-focused': {
      color: SECONDARY_COLOR // #69af5a (medium green) when focused
    }
  }
};

export default function AddDeliveryAddressForm({ handleNext, isGuestCheckout }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const { auth } = useSelector((store) => store);
  const { cart } = useSelector((store) => store);
  
  // States for saved addresses
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  
  // Use the prop value to determine if this is a guest checkout
  // Fall back to checking if auth.user exists
  const [isGuest, setIsGuest] = useState(isGuestCheckout || !auth?.user);

  // If using guest checkout, always show the form
  useEffect(() => {
    if (isGuest || isGuestCheckout) {
      setShowNewAddressForm(true);
    }
  }, [isGuest, isGuestCheckout]);

  // Location states
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [formValues, setFormValues] = useState({
    name: '',
    phoneNumber: '',
    address: '',
    zipCode: '1212' // Default Dhaka zip code
  });
  const [saveAddress, setSaveAddress] = useState(true);

  // Get selected address object
  const selectedAddress = savedAddresses.find(addr => addr.clientId === selectedAddressId || addr.id === selectedAddressId);

  // Load saved addresses from localStorage
  useEffect(() => {
    const loadSavedAddresses = () => {
      try {
        // Retrieve saved addresses from localStorage
        const savedAddressesString = localStorage.getItem('savedAddresses');
        
        if (savedAddressesString) {
          const addresses = JSON.parse(savedAddressesString);
          
          // Ensure each address has a unique ID (backward compatibility handling)
          const addressesWithIds = addresses.map((addr, index) => ({
            ...addr,
            clientId: addr.clientId || addr.id || `addr-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
          }));
          
          setSavedAddresses(addressesWithIds);
          
          // If addresses exist but no address is selected, select the first one
          if (addressesWithIds.length > 0 && !selectedAddressId) {
            setSelectedAddressId(addressesWithIds[0].clientId || addressesWithIds[0].id);
          } else {
            // If no addresses, show the new address form
            setShowNewAddressForm(addressesWithIds.length === 0);
          }
        } else {
          // If no saved addresses, show the form by default
          setShowNewAddressForm(true);
        }
      } catch (error) {
        console.error('Error loading saved addresses:', error);
        setShowNewAddressForm(true);
      }
    };

    loadSavedAddresses();
    
    // If user is logged in, pre-fill the form with their info
    if (auth?.user) {
      setFormValues(prev => ({
        ...prev,
        name: auth.user.firstName || '',
        phoneNumber: auth.user.phoneNumber || '',
      }));
    }
  }, [auth?.user]);

  // Initialize Pathao service and fetch cities - optimize to prevent excessive API calls
  useEffect(() => {
    const initializePathao = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Clear cache on guest checkout to ensure fresh data
        if (isGuestCheckout) {
          // Clear pathao service cache to ensure fresh data
          pathaoService.clearCache();
        }
        
        console.log('Fetching Pathao cities for checkout');
        const citiesData = await pathaoService.getCities().catch(error => {
          console.error('Error in pathaoService.getCities:', error);
          throw new Error('Could not load delivery locations. Please refresh the page.');
        });
        
        // Reset selections when cities change
        setSelectedCity("");
        
        // Set the cities data
        setCities(citiesData);
      } catch (error) {
        console.error('Error initializing Pathao:', error);
        setCities([]);
        setError('Failed to load delivery locations. Please refresh the page.');
        setSnackbar({
          open: true,
          message: 'Failed to load delivery locations. Please refresh the page.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    // Only initialize once on component mount or when isGuestCheckout changes
    initializePathao();
  }, [isGuestCheckout]);



  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    setLoading(true);
    setError("");

    // Check cart items for both regular and guest checkout
    let cartItems = [];
    
    if (isGuestCheckout || !jwt) {
      // For guest checkout, get cart items from localStorage
      try {
        const guestCartItems = localStorage.getItem('guestCartItems');
        const guestCart = localStorage.getItem('guestCart');
        
        if (guestCartItems) {
          cartItems = JSON.parse(guestCartItems);
        } else if (guestCart) {
          const cartData = JSON.parse(guestCart);
          cartItems = cartData.cartItems || [];
        }
      } catch (error) {
        console.error('Error parsing guest cart data:', error);
      }
    } else {
      // For logged in users, use Redux cart
      cartItems = cart.cartItems || [];
    }

    if (!cartItems || cartItems.length === 0) {
      setError("Your cart is empty. Please add items to cart first.");
      setLoading(false);
      return;
    }

    try {
      // If using a saved address, use that instead of form data
      if (selectedAddressId && !showNewAddressForm) {
        if (!selectedAddress) {
          throw new Error("Selected address not found");
        }
        
        // Verify the selected address has city data
        if (!selectedAddress.city) {
          throw new Error("Selected address is missing city information. Please select or create another address.");
        }
        
        // Add isGuestCheckout flag if user is not logged in
        const addressToSave = {
          ...selectedAddress,
          isGuestCheckout: isGuestCheckout || (!jwt && isGuest)
        };
        
        // Ensure no fallback fields exist
        delete addressToSave.division;
        delete addressToSave.district;
        delete addressToSave.upazilla;
        
        console.log('Using saved address with Pathao data:', addressToSave);
        localStorage.setItem('selectedAddress', JSON.stringify(addressToSave));
        
        // For guest checkout, also store in guestAddress for the OrderSummary component
        if (isGuestCheckout || (!jwt && isGuest)) {
          localStorage.setItem('guestAddress', JSON.stringify(addressToSave));
        }
        
        setLoading(false);
        handleNext();
        return;
      }
      
      // Handle new address form submission
      const formData = new FormData(event.target);
      
      // Allow null strings, just get the values
      const name = formData.get('name') || '';
      const phoneNumber = formData.get('phoneNumber') || '';
      const address = formData.get('address') || '';

      // Get location information from API selection - require only city
      if (!selectedCity) {
        throw new Error("Please select a city");
      }
      
      // Find the selected city name
      const city = cities.find(c => c.city_id === selectedCity)?.city_name;
      
      // Verify city data was found
      if (!city) {
        throw new Error("Invalid city selection. Please try again.");
      }
      
      // Store Pathao ID
      const pathao_city_id = selectedCity;

      // Create address object with consistent field structure - use only city
      const newAddress = {
        // Use a UUID format that won't be mistaken for MongoDB ObjectId
        clientId: `addr-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        name, // Keep name for UI display
        phoneNumber,
        streetAddress: address,
        mobile: phoneNumber,
        // Location fields - use city for all location fields
        city,
        zone: city, // Use city as zone since we no longer collect zone
        area: city, // Use city as area since we no longer collect area
        // Store API ID for pathao
        pathao_city_id,
        pathao_zone_id: null,
        pathao_area_id: null,
        zipCode: "1212", // Default Dhaka zip code
        // Add guest checkout flag
        isGuestCheckout: isGuestCheckout || (!jwt && isGuest),
        email: formData.get('email') || '' // Optional email for guest checkout
      };

      // Save to localStorage if requested and not guest checkout
      if (saveAddress && (!isGuest || auth?.user)) {
        const updatedAddresses = [...savedAddresses, newAddress];
        localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
        setSavedAddresses(updatedAddresses);
        setSnackbar({
          open: true,
          message: 'Address saved successfully!',
          severity: 'success'
        });
      }

      // Store selected address for next steps - create a clean copy without clientId
      const addressForServer = { ...newAddress };
      delete addressForServer.clientId; // Remove client-only field before sending to server
      
      // Ensure no fallback fields exist
      delete addressForServer.division;
      delete addressForServer.district;
      delete addressForServer.upazilla;
      
      console.log('Saving address with Pathao data:', addressForServer);
      localStorage.setItem('selectedAddress', JSON.stringify(addressForServer));
      
      // For guest checkout, also store in guestAddress for the OrderSummary component
      if (isGuestCheckout || (!jwt && isGuest)) {
        localStorage.setItem('guestAddress', JSON.stringify(addressForServer));
      }
      
      setLoading(false);
      handleNext();
    } catch (error) {
      console.error('Error handling address:', error);
      setError(error.message || "An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressSelection = (addressId) => {
    setSelectedAddressId(addressId);
    setShowNewAddressForm(false);
  };

  const handleAddNewAddress = () => {
    setSelectedAddressId(null);
    setShowNewAddressForm(true);
  };

  const renderSavedAddresses = () => {
    if (savedAddresses.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No saved addresses found
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ mb: 2 }}>
        <RadioGroup 
          value={selectedAddressId || ''}
          onChange={(e) => handleAddressSelection(e.target.value)}
        >
          <Grid container spacing={2}>
            {savedAddresses.map((address) => (
              <Grid item xs={12} sm={6} md={4} key={address.clientId || address.id}>
                <Card 
                  variant="outlined"
                  sx={{
                    position: 'relative',
                    borderColor: (selectedAddressId === (address.clientId || address.id)) ? PRIMARY_COLOR : 'rgba(0, 0, 0, 0.12)',
                    borderWidth: (selectedAddressId === (address.clientId || address.id)) ? 2 : 1,
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: (selectedAddressId === (address.clientId || address.id)) ? PRIMARY_COLOR : SECONDARY_COLOR,
                    }
                  }}
                  onClick={() => handleAddressSelection(address.clientId || address.id)}
                >
                  {(selectedAddressId === (address.clientId || address.id)) && (
                    <Badge
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        '& .MuiBadge-badge': {
                          bgcolor: PRIMARY_COLOR,
                          color: '#fff'
                        }
                      }}
                      badgeContent={<CheckCircleIcon fontSize="small" />}
                    />
                  )}
                  <CardContent>
                    <FormControlLabel
                      value={address.clientId || address.id}
                      control={
                        <Radio 
                          sx={{ 
                            '&.Mui-checked': { color: PRIMARY_COLOR },
                            position: 'absolute',
                            top: 10,
                            left: 10
                          }} 
                        />
                      }
                      label=""
                      sx={{ m: 0 }}
                    />
                    
                    <Box sx={{ pl: 4, pt: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {address.name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                        <LocationOnIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1, mt: 0.3 }} />
                        <Typography variant="body2" color="text.secondary">
                          {address.streetAddress}{address.area ? `, ${address.area}` : ''}{address.zone ? `, ${address.zone}` : ''}{address.city ? `, ${address.city}` : ''}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          {address.phoneNumber || address.mobile}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            
            {/* Add New Address Card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 2,
                  borderStyle: 'dashed',
                  borderColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: PRIMARY_COLOR,
                    backgroundColor: LIGHT_COLOR
                  }
                }}
                onClick={handleAddNewAddress}
              >
                <AddCircleOutlineIcon sx={{ fontSize: 40, color: PRIMARY_COLOR, mb: 1 }} />
                <Typography variant="body1" fontWeight={500} align="center">
                  Add New Address
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </RadioGroup>
        
        {!showNewAddressForm && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!selectedAddressId || loading}
              sx={{
                bgcolor: PRIMARY_COLOR,
                '&:hover': { bgcolor: SECONDARY_COLOR },
                borderRadius: 5,
                px: 4,
                py: 1.5,
                fontWeight: 600
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Deliver to This Address'
              )}
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Saved Addresses Section */}
      {savedAddresses.length > 0 && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: PRIMARY_COLOR }}>
            Saved Addresses
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {renderSavedAddresses()}
          
          {showNewAddressForm && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: PRIMARY_COLOR }}>
                Add New Address
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* New Address Form */}
      {showNewAddressForm && (
        <Box 
          component="form" 
          onSubmit={handleSubmit}
          sx={{
            mt: savedAddresses.length === 0 ? 0 : 3,
            p: { xs: 2, md: 3 },
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.1)',
            bgcolor: '#FFFFFF'
          }}
        >
          {/* Guest checkout option */}
          {!auth?.user && (
            <Box sx={{ mb: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                You are not logged in. You can continue as a guest or create an account.
              </Alert>
              <FormControlLabel
                control={
                  <Switch
                    checked={isGuest}
                    onChange={(e) => setIsGuest(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: PRIMARY_COLOR,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 80, 58, 0.08)',
                        },
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: PRIMARY_COLOR,
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Continue as Guest
                  </Typography>
                }
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {isGuest 
                  ? "You can check out without creating an account. Your order can be tracked using your phone number." 
                  : "Create an account to track your orders and save your addresses for future purchases."}
              </Typography>
              {!isGuest && (
                <Button
                  variant="outlined"
                  onClick={() => navigate('/register')}
                  sx={{
                    mt: 2,
                    color: PRIMARY_COLOR,
                    borderColor: PRIMARY_COLOR,
                    '&:hover': {
                      borderColor: SECONDARY_COLOR,
                      backgroundColor: 'rgba(0, 80, 58, 0.04)'
                    }
                  }}
                >
                  Create Account
                </Button>
              )}
            </Box>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={12}>
              <TextField
                id="name"
                name="name"
                label="Name"
                fullWidth
                value={formValues.name}
                onChange={handleInputChange}
                sx={commonTextFieldStyles}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                id="phoneNumber"
                name="phoneNumber"
                label="Phone Number"
                fullWidth
                value={formValues.phoneNumber}
                onChange={handleInputChange}
                sx={commonTextFieldStyles}
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            {/* City Selection */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: PRIMARY_COLOR }}>City</InputLabel>
                <Select
                  value={selectedCity}
                  name="city"
                  label="City"
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={loading}
                  sx={{
                    color: PRIMARY_COLOR,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                      '&:focus': {
                        borderColor: SECONDARY_COLOR,
                      }
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: SECONDARY_COLOR,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: SECONDARY_COLOR,
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>Select City</em>
                  </MenuItem>
                  {cities.map((city) => (
                    <MenuItem key={city.city_id} value={city.city_id}>
                      {city.city_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Email field for guest checkout */}
            {!auth?.user && isGuest && (
              <Grid item xs={12}>
                <TextField
                  id="email"
                  name="email"
                  label="Email (optional)"
                  fullWidth
                  type="email"
                  helperText="Provide an email to receive order confirmation"
                  sx={commonTextFieldStyles}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                id="address"
                name="address"
                label="Street Address"
                fullWidth
                multiline
                rows={2}
                value={formValues.address}
                onChange={handleInputChange}
                sx={commonTextFieldStyles}
                InputProps={{
                  startAdornment: <LocationOnIcon sx={{ mr: 1, mt: 1.5, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: PRIMARY_COLOR,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: PRIMARY_COLOR,
                      },
                    }}
                  />
                }
                label="Save this address for future use"
              />
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              {savedAddresses.length > 0 && (
                <Button
                  variant="outlined"
                  onClick={() => setShowNewAddressForm(false)}
                  sx={{
                    mr: 2,
                    color: PRIMARY_COLOR,
                    borderColor: PRIMARY_COLOR,
                    '&:hover': { borderColor: PRIMARY_COLOR, bgcolor: LIGHT_COLOR },
                    borderRadius: 5,
                    px: 3,
                    py: 1.5
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  bgcolor: PRIMARY_COLOR,
                  '&:hover': { bgcolor: SECONDARY_COLOR},
                  borderRadius: 5,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Save & Continue'
                )}
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}