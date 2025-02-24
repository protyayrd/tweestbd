import React from "react";
import { Button, CircularProgress, Grid, Paper, Typography, Box, Divider } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import CartItem from "../Cart/CartItem";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getOrderById } from "../../../Redux/Customers/Order/Action";
import AddressCard from "../adreess/AdreessCard";

const OrderSummary = ({ handleNext }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get("order_id");
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const { order } = useSelector(state => state);

  useEffect(() => {
    if(orderId) {
      dispatch(getOrderById(orderId));
    }
  }, [orderId, dispatch]);

  if (!order.order) {
    return <div className="flex justify-center items-center min-h-screen">
      <CircularProgress />
    </div>;
  }

  const handleProceedToPayment = () => {
    handleNext();
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} lg={8}>
        {/* Shipping Address */}
        <Paper elevation={0} className="border p-5 mb-4" sx={{
          borderColor: 'grey.300',
          bgcolor: 'background.paper',
          borderRadius: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Shipping Address
          </Typography>
          <AddressCard address={order.order?.shippingAddress} />
        </Paper>

        {/* Order Items */}
        <Paper elevation={0} className="border p-5" sx={{
          borderColor: 'grey.300',
          bgcolor: 'background.paper',
          borderRadius: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Order Items
          </Typography>
          <div className="space-y-3">
            {order.order?.orderItems.map((item) => (
              <CartItem key={item._id} item={item} showButton={false} />
            ))}
          </div>
        </Paper>
      </Grid>

      {/* Price Details */}
      <Grid item xs={12} lg={4}>
        <Paper elevation={0} className="border p-5" sx={{
          borderColor: 'grey.300',
          bgcolor: 'background.paper',
          borderRadius: 2,
          position: 'sticky',
          top: 20
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Price Details
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography color="text.secondary">
                Price ({order.order?.totalItem} items)
              </Typography>
              <Typography>Tk. {order.order?.totalPrice}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography color="text.secondary">Discount</Typography>
              <Typography color="success.main">
                -Tk. {order.order?.discounte}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography color="text.secondary">Delivery Charges</Typography>
              <Typography color="success.main">Free</Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Total Amount</Typography>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Tk. {order.order?.totalDiscountedPrice}
              </Typography>
              {order.order?.discounte > 0 && (
                <Typography variant="caption" color="success.main">
                  You save Tk. {order.order?.discounte}
                </Typography>
              )}
            </Box>
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={handleProceedToPayment}
            sx={{
              py: 1.5,
              bgcolor: 'black',
              color: 'white',
              '&:hover': { bgcolor: 'grey.900' },
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >
            Proceed to Payment
          </Button>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default OrderSummary;
