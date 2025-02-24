import { 
  Avatar, 
  AvatarGroup,
  Box, 
  Card, 
  CardHeader, 
  Chip, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography 
} from '@mui/material';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrders } from '../../Redux/Admin/Orders/Action';

const RecentOrders = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { adminsOrder } = useSelector((store) => store);
  const jwt = localStorage.getItem("jwt");

  useEffect(() => {
    dispatch(getOrders({ jwt }));
  }, [dispatch, jwt]);

  return (
    <Card>
      <CardHeader
        title='Recent Orders'
        sx={{ pt: 2, alignItems: 'center', '& .MuiCardHeader-action': { mt: 0.6 } }}
        action={
          <Typography 
            onClick={() => navigate("/admin/orders")} 
            variant='caption' 
            sx={{color:"blue", cursor:"pointer", paddingRight:".8rem"}}
          >
            View All
          </Typography>
        }
        titleTypographyProps={{
          variant: 'h5',
          sx: { lineHeight: '1.6 !important', letterSpacing: '0.15px !important' }
        }}
      />
      <TableContainer>
        <Table sx={{ minWidth: 800 }} aria-label='table in dashboard'>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Order Id</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {adminsOrder?.orders?.slice(0, 5).map((item) => (
              <TableRow 
                hover 
                key={item._id} 
                sx={{ '&:last-of-type td, &:last-of-type th': { border: 0 } }}
              >
                <TableCell>
                  <AvatarGroup max={3} sx={{justifyContent: 'start'}}>
                    {item.orderItems.map((orderItem) => (
                      <Avatar 
                        key={orderItem._id} 
                        alt={orderItem.product?.title} 
                        src={orderItem.product?.imageUrl} 
                      />
                    ))}
                  </AvatarGroup>
                </TableCell>
                <TableCell sx={{ py: theme => `${theme.spacing(0.5)} !important` }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.875rem !important' }}>
                      {item.orderItems.map((order, i) => (
                        <span key={order._id}>
                          {order.product?.title}
                          {i < item.orderItems.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </Typography>
                    <Typography variant='caption'>
                      {item.orderItems.map((order, i) => (
                        <span key={order._id}>
                          {order.product?.brand}
                          {i < item.orderItems.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>Tk. {item.totalPrice}</TableCell>
                <TableCell>{item._id}</TableCell>
                <TableCell>
                  <Chip 
                    sx={{color:"white"}} 
                    label={item.orderStatus} 
                    size='small' 
                    color={
                      item.orderStatus === "PENDING" ? "info" :
                      item.orderStatus === "DELIVERED" ? "success" :
                      "secondary"
                    } 
                    className='text-white' 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default RecentOrders;