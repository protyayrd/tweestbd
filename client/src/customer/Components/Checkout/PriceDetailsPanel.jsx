import React, { useEffect } from 'react';
import { Box, Typography, Grid, Divider } from '@mui/material';

const PriceDetailsPanel = ({ 
  orderData, 
  totalItem = 0,
  totalPrice = 0,
  productDiscount = 0,
  promoCodeDiscount = 0,
  promoDetails = null,
  deliveryCharge = 0,
  totalDiscountedPrice,
  showTitle = true,
  includeItems = true,
  order = null,
  paymentOption = 'online'
}) => {
  // If the order object is provided, extract values from it
  const useOrderObject = Boolean(order);
  
  // Ensure all values are numbers with fallbacks to 0
  const safeTotal = Number(useOrderObject ? order?.totalPrice : totalPrice) || 0;
  const safeDiscount = Number(useOrderObject ? order?.productDiscount : productDiscount) || 0;
  const safePromoDiscount = Number(useOrderObject ? order?.promoCodeDiscount : promoCodeDiscount) || 0;
  const safeDeliveryCharge = Number(useOrderObject ? order?.deliveryCharge : deliveryCharge) || 0;
  const items = Number(useOrderObject ? (order?.orderItems?.length || 0) : totalItem) || 0;
  
  // Get promo details
  const promoDetailsObj = useOrderObject ? order?.promoDetails : promoDetails;
  
  // Calculate product amount after discounts but before delivery
  const productAmountAfterDiscount = safeTotal - safeDiscount - safePromoDiscount;
  
  // Determine if delivery is free based on payment method and amount
  const qualifiesForFreeDelivery = productAmountAfterDiscount >= 2200;
  const isFreeDelivery = paymentOption === 'online' && qualifiesForFreeDelivery;
  const isCOD = paymentOption === 'cod';
  
  // For online payments: Free delivery if qualifies (amount >= 2200)
  // For COD: Always include delivery charge (but paid upon delivery)
  // For other methods: Include delivery charge unless outlet pickup
  const effectiveDeliveryCharge = isCOD ? 
                                safeDeliveryCharge : 
                                (isFreeDelivery ? 0 : safeDeliveryCharge);
  
  // Calculate final amount including delivery charge when applicable
  // For COD: Don't add delivery charge to immediate payment amount
  const finalAmount = productAmountAfterDiscount + 
                    (isCOD ? 0 : (isFreeDelivery ? 0 : safeDeliveryCharge));
  
  // Calculate total savings and percentage
  const totalSavings = safeDiscount + safePromoDiscount;
  const savingsPercentage = safeTotal > 0 
    ? Math.round((totalSavings / safeTotal) * 100) 
    : 0;
  
  // For debugging purposes
  useEffect(() => {
    console.log('PriceDetailsPanel:', {
      totalItem: items,
      originalPrice: safeTotal, // This should be pure product price without delivery
      productDiscount: safeDiscount,
      promoCodeDiscount: safePromoDiscount,
      deliveryCharge: safeDeliveryCharge,
      productAmountAfterDiscount,
      finalAmount,
      paymentOption,
      isFreeDelivery,
      isCOD
    });
  }, [items, safeTotal, safeDiscount, safePromoDiscount, safeDeliveryCharge, productAmountAfterDiscount, finalAmount, paymentOption]);

  return (
    <Box>
      {showTitle && (
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#000000' }}>
          Price Details
        </Typography>
      )}
      
      <Grid container spacing={2}>
        {/* Original Price */}
        <Grid item xs={6}>
          <Typography 
            variant="body1" 
            sx={{
              color: '#000000',
              fontWeight: 500
            }}
          >
            Original Price {includeItems && `(${items} ${items === 1 ? 'item' : 'items'})`}
          </Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <Typography color="#000000">Tk. {safeTotal.toFixed(2)}</Typography>
        </Grid>
        
        {/* Product Discount */}
        {(safeDiscount > 0) && (
          <>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography color="#000000">
                  Product Discount
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    ml: 1, 
                    bgcolor: 'rgba(0, 0, 0, 0.05)', 
                    color: '#000000', 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: 1,
                    fontWeight: 'bold'
                  }}
                >
                  ({safeTotal > 0 ? Math.round((safeDiscount / safeTotal) * 100) : 0}% off)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography color="#000000">-Tk. {safeDiscount.toFixed(2)}</Typography>
            </Grid>
          </>
        )}
        
        {/* Coupon Discount */}
        {(safePromoDiscount > 0) && (
          <>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography color="#000000">
                  Coupon Discount
                </Typography>
                {promoDetailsObj?.code && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      ml: 1, 
                      bgcolor: 'rgba(0, 0, 0, 0.05)', 
                      color: '#000000', 
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 1,
                      fontWeight: 'bold'
                    }}
                  >
                    ({promoDetailsObj.code})
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography color="#000000">-Tk. {safePromoDiscount.toFixed(2)}</Typography>
            </Grid>
          </>
        )}

        {/* Subtotal before delivery */}
        <Grid item xs={6}>
          <Typography color="#000000" fontWeight={500}>
            Subtotal
          </Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <Typography color="#000000">Tk. {productAmountAfterDiscount.toFixed(2)}</Typography>
        </Grid>
        
        {/* Delivery Charge */}
        <Grid item xs={6}>
          <Typography 
            color="#000000" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center' 
            }}
          >
            Delivery Charge
            {isCOD && (
              <Typography 
                variant="caption" 
                sx={{ 
                  ml: 1, 
                  bgcolor: 'rgba(0, 0, 0, 0.05)', 
                  color: '#000000', 
                  px: 1, 
                  py: 0.5, 
                  borderRadius: 1 
                }}
              >
                (Pay on delivery)
              </Typography>
            )}
          </Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <Typography color="#000000">
            {isFreeDelivery ? 'Free' : (
              isCOD ? 
              `Tk. ${safeDeliveryCharge.toFixed(2)} (Due)` : 
              `Tk. ${safeDeliveryCharge.toFixed(2)}`
            )}
          </Typography>
        </Grid>
        
        <Grid item xs={12}><Divider sx={{ my: 1, bgcolor: 'rgba(0, 0, 0, 0.1)' }} /></Grid>
        
        {/* Total Savings Box */}
        {totalSavings > 0 && (
          <Grid item xs={12}>
            <Box sx={{ 
              p: 1.5, 
              bgcolor: 'rgba(0, 0, 0, 0.03)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.1)',
              mb: 2
            }}>
              <Grid container>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                      Total Savings
                    </Typography>
                    <Typography variant="caption" color="#000000" sx={{ fontWeight: 'bold' }}>
                      {savingsPercentage}% off
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#000000' }}>
                    Tk. {totalSavings.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        )}
        
        {/* Final Amount */}
        <Grid item xs={6}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: '#000000'
            }}
          >
            Amount to Pay
          </Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600, 
              color: '#000000'
            }}
          >
            Tk. {finalAmount.toFixed(2)}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PriceDetailsPanel;