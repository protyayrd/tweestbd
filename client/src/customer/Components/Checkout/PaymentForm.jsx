import React, { useState, useEffect } from "react";
import { 
  Box, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Alert, 
  CircularProgress,
  Paper,
  Typography,
  Grid,
  Divider
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createPayment } from "../../../Redux/Customers/Payment/Action";

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

const PaymentForm = ({ handleNext }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get("order_id");
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const { order } = useSelector(state => state);
  const { payment } = useSelector(state => state);

  // Payment form states
  const [paymentMethod, setPaymentMethod] = useState("bKash");
  const [transactionId, setTransactionId] = useState("");
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if we have an order ID
    if (!order.order?._id) {
      navigate('/cart');
    }
  }, [order.order, navigate]);

  useEffect(() => {
    if (payment?.success || payment?.id) {
      setIsSubmitting(false);
      navigate('/account/order');
    } else if (payment?.error) {
      setIsSubmitting(false);
      setFormError(payment.error);
    }
  }, [payment, navigate]);

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    if (!order.order?._id) {
      setFormError("No order ID available");
      setIsSubmitting(false);
      return;
    }

    if (!transactionId || !paymentPhoneNumber) {
      setFormError("Please fill in all payment details");
      setIsSubmitting(false);
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?880\d{10}$/;
    if (!phoneRegex.test(paymentPhoneNumber.replace(/\s+/g, ''))) {
      setFormError("Please enter a valid Bangladesh phone number (+880XXXXXXXXXX)");
      setIsSubmitting(false);
      return;
    }
    
    const data = {
      orderId: order.order._id,
      jwt,
      paymentMethod,
      transactionId: transactionId.trim(),
      paymentPhoneNumber: paymentPhoneNumber.trim().replace(/\s+/g, ''),
      status: 'PENDING',
      amount: order.order.totalDiscountedPrice
    };
    
    try {
      const result = await dispatch(createPayment(data));
      console.log('Payment result:', result);

      if (result?.payload?.success) {
        // Show success message and navigate
        setTransactionId('');
        setPaymentPhoneNumber('');
        navigate('/account/order');
      } else if (result?.error) {
        setFormError(result.error);
        setIsSubmitting(false);
      } else {
        setFormError("Unable to process payment. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setFormError("Payment submission failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={8}>
        <Paper elevation={0} className="border p-5" sx={{
          borderColor: 'grey.300',
          bgcolor: 'background.paper',
          borderRadius: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Payment Details
          </Typography>

          <form onSubmit={handleCreatePayment}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth sx={commonTextFieldStyles}>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    label="Payment Method"
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <MenuItem value="bKash">bKash</MenuItem>
                    <MenuItem value="Nagad">Nagad</MenuItem>
                    <MenuItem value="Rocket">Rocket</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  required
                  disabled={isSubmitting}
                  sx={commonTextFieldStyles}
                  helperText="Enter the transaction ID from your mobile banking app"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Payment Phone Number"
                  value={paymentPhoneNumber}
                  onChange={(e) => setPaymentPhoneNumber(e.target.value)}
                  required
                  disabled={isSubmitting}
                  sx={commonTextFieldStyles}
                  placeholder="e.g., +880 1XXX-XXXXXX"
                  helperText="Enter the phone number used for payment"
                />
              </Grid>

              {formError && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    {formError}
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isSubmitting}
                  sx={{
                    py: 1.5,
                    bgcolor: 'black',
                    color: 'white',
                    '&:hover': { bgcolor: 'grey.900' },
                    textTransform: 'none',
                    fontSize: '1rem'
                  }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Confirm Payment"
                  )}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper elevation={0} className="border p-5" sx={{
          borderColor: 'grey.300',
          bgcolor: 'background.paper',
          borderRadius: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Order Summary
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography color="text.secondary">
                Total Items
              </Typography>
              <Typography>{order.order?.totalItem}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography color="text.secondary">Total Amount</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Tk. {order.order?.totalDiscountedPrice}
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            Please complete the payment using your selected mobile banking app and provide the transaction details.
          </Alert>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default PaymentForm; 
