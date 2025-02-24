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
  Switch
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createOrder } from "../../../Redux/Customers/Order/Action";
import AddressCard from "../adreess/AdreessCard";
import { useState, useEffect } from "react";
import axios from "axios";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeIcon from '@mui/icons-material/Home';
import PhoneIcon from '@mui/icons-material/Phone';

const baseURL = "https://bdapis.com/api/v1.2";

const commonTextFieldStyles = {
  '& .MuiOutlinedInput-root': { 
    '&.Mui-focused fieldset': { 
      borderColor: 'black' 
    },
    '&:hover fieldset': {
      borderColor: 'grey.400'
    }
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'black'
  }
};

export default function AddDeliveryAddressForm({ handleNext }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const { auth } = useSelector((store) => store);
  const { cart } = useSelector((store) => store);
  const [selectedAddress, setSelectedAdress] = useState(null);
  
  // Location states
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazillas, setUpazillas] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedUpazilla, setSelectedUpazilla] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [manualInput, setManualInput] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Fetch divisions on component mount
  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseURL}/divisions`);
        console.log("Divisions API response:", response.data);
        if (response.data && response.data.data) {
          const formattedDivisions = response.data.data.map(div => ({
            division: div.division || "",
            divisionbn: div.divisionbn || div.division || ""
          })).filter(div => div.division && div.division !== "undefined");
          
          console.log("Formatted divisions:", formattedDivisions);
          setDivisions(formattedDivisions);
          setApiError(false);
        }
      } catch (error) {
        console.error("Error fetching divisions:", error);
        setApiError(true);
        setError("Failed to fetch locations. You can use manual input.");
      } finally {
        setLoading(false);
      }
    };
    fetchDivisions();
  }, []);

  // Fetch districts when division changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedDivision) return;
      try {
        setLoading(true);
        const response = await axios.get(`${baseURL}/division/${selectedDivision}`);
        if (response.data && response.data.data) {
          // Ensure districts data is properly formatted
          const formattedDistricts = response.data.data.map(dist => ({
            district: dist.district,
            upazilla: dist.upazilla || []
          }));
          setDistricts(formattedDistricts);
          setSelectedDistrict("");
          setUpazillas([]);
          setPostalCode("");
          setApiError(false);
        }
      } catch (error) {
        console.error("Error fetching districts:", error);
        setApiError(true);
        setError("Failed to fetch districts. You can use manual input.");
      } finally {
        setLoading(false);
      }
    };
    if (!manualInput) {
      fetchDistricts();
    }
  }, [selectedDivision, manualInput]);

  // Update upazillas when district changes
  useEffect(() => {
    if (!selectedDistrict || !districts.length || manualInput) return;
    const district = districts.find(d => d.district === selectedDistrict);
    if (district && Array.isArray(district.upazilla)) {
      setUpazillas(district.upazilla);
      fetchPostalCode(selectedDistrict);
    }
  }, [selectedDistrict, districts, manualInput]);

  const fetchPostalCode = async (district) => {
    try {
      const mockPostalCodes = {
        'Dhaka': '1200',
        'Chittagong': '4000',
        'Sylhet': '3100',
        'Rajshahi': '6000',
        'Khulna': '9000',
        'Barisal': '8200',
        'Rangpur': '5400',
        'Mymensingh': '2200'
      };
      setPostalCode(mockPostalCodes[district] || '');
    } catch (error) {
      console.error('Error fetching postal code:', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const data = new FormData(event.currentTarget);

    if (!cart.cartItems || cart.cartItems.length === 0) {
      setError("Your cart is empty. Please add items to cart first.");
      setLoading(false);
      return;
    }

    // Prepare address data with proper validation
    const addressData = {
      firstName: data.get("firstName")?.trim() || "",
      lastName: data.get("lastName")?.trim() || "",
      streetAddress: data.get("address")?.trim() || "",
      division: manualInput ? data.get("manualDivision")?.trim() : selectedDivision,
      district: manualInput ? data.get("manualDistrict")?.trim() : selectedDistrict,
      upazilla: manualInput ? data.get("manualUpazilla")?.trim() : selectedUpazilla,
      zipCode: postalCode || data.get("zip")?.trim() || "",
      mobile: data.get("phoneNumber")?.trim() || "",
    };

    // Validate that no field is undefined or empty
    const requiredFields = Object.entries(addressData);
    const emptyFields = requiredFields.filter(([key, value]) => !value || value === "undefined");
    
    if (emptyFields.length > 0) {
      setError(`Please fill in all required fields: ${emptyFields.map(([key]) => key).join(', ')}`);
      setLoading(false);
      return;
    }

    const orderData = {
      address: addressData,
      orderItems: cart.cartItems.map(item => ({
        product: item.product?._id || item.productId,
        quantity: item.quantity,
        price: item.product?.price || item.price,
        discountedPrice: item.product?.discountedPrice || item.discountedPrice,
        size: item.size,
        color: item.color || "default"
      })),
      totalPrice: cart.totalPrice,
      totalDiscountedPrice: cart.totalDiscountedPrice,
      discounte: cart.discounte,
      totalItem: cart.totalItem,
    };

    try {
      console.log("Submitting order data:", orderData);
      const response = await dispatch(createOrder({ ...orderData, jwt, navigate }));
      if (response?.payload?._id) {
        handleNext();
      } else {
        setError("Failed to create order. Please try again.");
      }
    } catch (error) {
      console.error("Order creation error:", error);
      const errorMessage = typeof error.response?.data === 'string' 
        ? error.response.data 
        : error.response?.data?.message 
        || "Failed to create order. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (item) => {
    setLoading(true);

    if (!cart.cartItems || cart.cartItems.length === 0) {
      setError("Your cart is empty. Please add items to cart first.");
      setLoading(false);
      return;
    }

    // Validate saved address data
    const addressData = {
      firstName: item.firstName || "",
      lastName: item.lastName || "",
      streetAddress: item.streetAddress || "",
      division: item.division || item.state || "",
      district: item.district || item.city || "",
      upazilla: item.upazilla || item.area || "",
      zipCode: item.zipCode || item.zip || "",
      mobile: item.mobile || item.phoneNumber || "",
    };

    // Validate that no field is undefined or empty
    const requiredFields = Object.entries(addressData);
    const emptyFields = requiredFields.filter(([key, value]) => !value || value === "undefined");
    
    if (emptyFields.length > 0) {
      setError(`Invalid saved address. Missing fields: ${emptyFields.map(([key]) => key).join(', ')}`);
      setLoading(false);
      return;
    }

    try {
      const orderData = {
        address: addressData,
        orderItems: cart.cartItems.map(item => ({
          product: item.product?._id || item.productId,
          quantity: item.quantity,
          price: item.product?.price || item.price,
          discountedPrice: item.product?.discountedPrice || item.discountedPrice,
          size: item.size,
          color: item.color || "default"
        })),
        totalPrice: cart.totalPrice,
        totalDiscountedPrice: cart.totalDiscountedPrice,
        discounte: cart.discounte,
        totalItem: cart.totalItem,
      };
      
      console.log("Submitting saved address order data:", orderData);
      const response = await dispatch(createOrder({ ...orderData, jwt, navigate }));
      if (response?.payload?._id) {
        handleNext();
      } else {
        setError("Failed to create order. Please try again.");
      }
    } catch (error) {
      console.error("Order creation error:", error);
      const errorMessage = typeof error.response?.data === 'string' 
        ? error.response.data 
        : error.response?.data?.message 
        || "Failed to create order. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleManualInput = () => {
    setManualInput(!manualInput);
    // Reset values when switching modes
    setSelectedDivision("");
    setSelectedDistrict("");
    setSelectedUpazilla("");
    setPostalCode("");
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} lg={5}>
        <Paper elevation={0} className="border h-[30.5rem] overflow-y-scroll" sx={{
          borderColor: 'grey.300',
          bgcolor: 'background.paper',
          borderRadius: 2
        }}>
          <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'grey.200', fontWeight: 600 }}>
            Saved Addresses
          </Typography>
          {auth.user?.addresses.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedAdress(item)}
              className="p-5 py-7 border-b cursor-pointer transition-all duration-200 hover:bg-gray-50"
            >
              <AddressCard address={item} />
              {selectedAddress?.id === item.id && (
                <Button
                  sx={{ 
                    mt: 2,
                    bgcolor: 'black',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'grey.900',
                    },
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                  size="large"
                  variant="contained"
                  onClick={() => handleCreateOrder(item)}
                >
                  Deliver to this address
                </Button>
              )}
            </div>
          ))}
        </Paper>
      </Grid>
      <Grid item xs={12} lg={7}>
        <Paper elevation={0} className="border p-5" sx={{
          borderColor: 'grey.300',
          bgcolor: 'background.paper',
          borderRadius: 2
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Add New Delivery Address
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={manualInput}
                  onChange={toggleManualInput}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'black',
                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'black',
                    },
                  }}
                />
              }
              label={<Typography variant="body2">Manual Input</Typography>}
            />
          </Box>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="firstName"
                  name="firstName"
                  label="First Name"
                  fullWidth
                  autoComplete="given-name"
                  sx={commonTextFieldStyles}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="lastName"
                  name="lastName"
                  label="Last Name"
                  fullWidth
                  autoComplete="given-name"
                  sx={commonTextFieldStyles}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Address Details
                  </Typography>
                </Divider>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  id="address"
                  name="address"
                  label="Street Address"
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="House/Building number, Street name, Area"
                  sx={commonTextFieldStyles}
                  InputProps={{
                    startAdornment: <HomeIcon sx={{ mr: 1, color: 'grey.500' }} />,
                  }}
                />
              </Grid>

              {!manualInput ? (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      required
                      id="division"
                      name="division"
                      label="Division"
                      fullWidth
                      value={selectedDivision}
                      onChange={(e) => setSelectedDivision(e.target.value)}
                      sx={commonTextFieldStyles}
                      InputProps={{
                        startAdornment: <LocationOnIcon sx={{ mr: 1, color: 'grey.500' }} />,
                      }}
                      disabled={loading}
                    >
                      {divisions.map((division) => (
                        <MenuItem key={division.division} value={division.division}>
                          {division.division} ({division.divisionbn})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      required
                      id="district"
                      name="district"
                      label="District"
                      fullWidth
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={!selectedDivision || loading}
                      sx={commonTextFieldStyles}
                    >
                      {districts.map((district) => (
                        <MenuItem key={district.district} value={district.district}>
                          {district.district}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      required
                      id="upazilla"
                      name="upazilla"
                      label="Upazilla"
                      fullWidth
                      value={selectedUpazilla}
                      onChange={(e) => setSelectedUpazilla(e.target.value)}
                      disabled={!selectedDistrict || loading}
                      sx={commonTextFieldStyles}
                    >
                      {upazillas.map((upazilla) => (
                        <MenuItem key={upazilla} value={upazilla}>
                          {upazilla}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </>
              ) : (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      id="manualDivision"
                      name="manualDivision"
                      label="Division"
                      fullWidth
                      sx={commonTextFieldStyles}
                      InputProps={{
                        startAdornment: <LocationOnIcon sx={{ mr: 1, color: 'grey.500' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      id="manualDistrict"
                      name="manualDistrict"
                      label="District"
                      fullWidth
                      sx={commonTextFieldStyles}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      id="manualUpazilla"
                      name="manualUpazilla"
                      label="Upazilla"
                      fullWidth
                      sx={commonTextFieldStyles}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="zip"
                  name="zip"
                  label="Postal Code"
                  fullWidth
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  sx={commonTextFieldStyles}
                  helperText={!manualInput && postalCode ? "Auto-filled based on your district" : ""}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  id="phoneNumber"
                  name="phoneNumber"
                  label="Phone Number"
                  fullWidth
                  autoComplete="tel"
                  sx={commonTextFieldStyles}
                  placeholder="e.g., +880 1XXX-XXXXXX"
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'grey.500' }} />,
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                {loading ? (
                  <CircularProgress sx={{ color: 'black' }} />
                ) : (
                  <Button
                    sx={{
                      padding: ".9rem 1.5rem",
                      bgcolor: 'black',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'grey.900',
                      },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem'
                    }}
                    size="large"
                    type="submit"
                    variant="contained"
                    fullWidth
                  >
                    Save & Deliver to this address
                  </Button>
                )}
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Grid>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError("")}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError("")} 
          severity={apiError ? "warning" : "error"} 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
