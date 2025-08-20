/**
 * PriceCalculationService
 * 
 * Provides consistent price calculation functions for the checkout process.
 * This helps ensure consistent price displays between steps 3 and 4.
 */

/**
 * Calculates the actual product price without delivery charge
 * @param {number} totalPrice - The total price including delivery
 * @param {number} deliveryCharge - The delivery charge
 * @returns {number} The product price without delivery
 */
export const getProductPrice = (totalPrice, deliveryCharge) => {
  const total = Number(totalPrice) || 0;
  const delivery = Number(deliveryCharge) || 0;
  
  // Always subtract delivery charge from total to get pure product price
  return Math.max(0, total - delivery);
};

/**
 * Calculates the final price to pay
 * @param {Object} data - Price data
 * @param {number} data.productPrice - Original product price
 * @param {number} data.productDiscount - Product discount amount
 * @param {number} data.promoDiscount - Promo code discount amount
 * @param {number} data.deliveryCharge - Delivery charge amount
 * @param {string} data.paymentOption - Payment method ('online', 'cod', or 'outlet')
 * @returns {number} Final price to pay
 */
export const calculateFinalPrice = ({
  productPrice = 0,
  productDiscount = 0,
  promoDiscount = 0,
  deliveryCharge = 0,
  paymentOption = 'online'
}) => {
  // Ensure all values are numbers
  const price = Number(productPrice) || 0;
  const prodDisc = Number(productDiscount) || 0;
  const promoDisc = Number(promoDiscount) || 0;
  let delivery = Number(deliveryCharge) || 0;
  
  // Calculate product amount after discounts but before delivery
  const discountedProductPrice = Math.max(0, price - prodDisc - promoDisc);
  
  // For online payments: Free delivery when amount is over 2200 Tk
  if (paymentOption === 'online' && discountedProductPrice >= 2200) {
    delivery = 0;
  }
  
  // For COD: Always include delivery charge but it's added to due amount
  if (paymentOption === 'cod') {
    // Return only the delivery charge as immediate payment
    return delivery;
  }
  
  // For outlet pickup: No delivery charge
  if (paymentOption === 'outlet') {
    delivery = 0;
  }
  
  // Calculate final price
  return Math.max(0, discountedProductPrice + (paymentOption === 'cod' ? 0 : delivery));
};

/**
 * Formats standard order data for price details display
 * @param {Object} order - Order object
 * @param {string} paymentOption - Payment method (online, cod, or outlet)
 * @returns {Object} Formatted data for PriceDetailsPanel
 */
export const formatOrderPriceData = (order, paymentOption = 'online') => {
  if (!order) return null;
  
  // Extract base values from order - totalPrice should already be pure product price from PaymentForm
  const productPrice = Number(order.totalPrice) || 0;
  let deliveryCharge = Number(order.deliveryCharge) || 0;
  const productDiscount = Number(order.productDiscount) || 0;
  const promoCodeDiscount = Number(order.promoCodeDiscount) || 0;
  
  // Calculate discounted product price before delivery
  const discountedProductPrice = Math.max(0, productPrice - productDiscount - promoCodeDiscount);
  
  // Check if free delivery applies
  const isFreeDelivery = paymentOption === 'online' && discountedProductPrice >= 2200;
  
  // For outlet pickup or free delivery: No delivery charge
  if (paymentOption === 'outlet' || isFreeDelivery) {
    deliveryCharge = 0;
  }
  
  // Calculate final price with appropriate delivery charge
  const finalPrice = discountedProductPrice + (isFreeDelivery ? 0 : deliveryCharge);
  
  // Debug log information
  console.log("Order price calculation:", {
    originalProductPrice: productPrice,
    deliveryCharge,
    productDiscount,
    promoCodeDiscount,
    discountedProductPrice,
    isFreeDelivery,
    paymentOption,
    finalPrice
  });
  
  return {
    totalItem: order.totalItem || 0,
    totalPrice: productPrice, // Pure product price without delivery
    productDiscount: productDiscount,
    promoCodeDiscount: promoCodeDiscount,
    promoDetails: order.promoDetails || null,
    deliveryCharge: deliveryCharge,
    paymentOption,
    totalDiscountedPrice: finalPrice
  };
};

/**
 * Formats cart data for price details display
 * @param {Object} cart - Cart object
 * @param {number} deliveryCharge - Delivery charge
 * @param {string} paymentOption - Payment method (online, cod, or outlet)
 * @returns {Object} Formatted data for PriceDetailsPanel
 */
export const formatCartPriceData = (cart, deliveryCharge = 0, paymentOption = 'online') => {
  if (!cart) return null;
  
  // Extract base values from cart
  const originalDeliveryCharge = Number(deliveryCharge) || 0;
  
  // Get pure product price (excluding delivery)
  const productPrice = Number(cart.totalPrice) || 0;
  const productDiscount = (Number(cart.discount) || 0) - (Number(cart.promoCodeDiscount) || 0);
  const promoDiscount = Number(cart.promoCodeDiscount) || 0;
  
  // Calculate discounted product price before delivery
  const discountedProductPrice = Math.max(0, productPrice - productDiscount - promoDiscount);
  
  // Check if free delivery applies
  const isFreeDelivery = paymentOption === 'online' && discountedProductPrice >= 2200;
  
  // For outlet pickup or free delivery: No delivery charge
  let finalDeliveryCharge = originalDeliveryCharge;
  if (paymentOption === 'outlet' || isFreeDelivery) {
    finalDeliveryCharge = 0;
  }
  
  // Calculate final price
  const finalPrice = discountedProductPrice + (isFreeDelivery ? 0 : finalDeliveryCharge);
  
  // Debug log information
  console.log("Cart price calculation:", {
    productPrice,
    originalDeliveryCharge,
    finalDeliveryCharge,
    productDiscount,
    promoDiscount,
    discountedProductPrice,
    isFreeDelivery,
    paymentOption,
    finalPrice
  });
  
  return {
    totalItem: cart.totalItem || 0,
    totalPrice: productPrice, // Pure product price without delivery
    productDiscount: productDiscount,
    promoCodeDiscount: promoDiscount,
    promoDetails: cart.promoDetails || null,
    deliveryCharge: finalDeliveryCharge,
    paymentOption,
    totalDiscountedPrice: finalPrice
  };
};

export default {
  getProductPrice,
  calculateFinalPrice,
  formatOrderPriceData,
  formatCartPriceData
};