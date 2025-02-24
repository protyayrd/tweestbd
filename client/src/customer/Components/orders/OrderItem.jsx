import React from 'react';
import { Grid, Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import StarIcon from '@mui/icons-material/Star';
import { deepPurple } from '@mui/material/colors';
import { getImageUrl } from '../../../config/api';

const OrderItem = ({ item }) => {
  const navigate = useNavigate();

  return (
    <Grid
      container
      className="shadow-xl rounded-md p-5 border"
      sx={{ alignItems: "center", justifyContent: "space-between" }}
    >
      <Grid item xs={6}>
        <Box className="flex items-center">
          <Box sx={{ width: 80, height: 80 }}>
            <img
              className="w-full h-full object-cover object-top rounded"
              src={getImageUrl(item?.product?.imageUrl)}
              alt={item?.product?.title}
            />
          </Box>
          <Box className="ml-5 space-y-2">
            <Typography variant="subtitle1">{item.product.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              Size: {item.size}
              {item.color && <span className="ml-3">Color: {item.color}</span>}
            </Typography>
            <Typography variant="body2">Seller: {item.product.brand}</Typography>
            <Typography variant="subtitle2">Tk. {item.price}</Typography>
          </Box>
        </Box>
      </Grid>
      <Grid item>
        <Button
          sx={{ color: deepPurple[500] }}
          onClick={() => navigate(`/account/rate/${item.product._id}`)}
          startIcon={<StarIcon />}
        >
          Rate & Review Product
        </Button>
      </Grid>
    </Grid>
  );
};

export default OrderItem; 