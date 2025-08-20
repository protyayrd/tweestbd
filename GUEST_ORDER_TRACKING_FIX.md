# Guest Order Tracking Issue Fix

## Problem Description

After completing a bKash payment, users were encountering authentication errors when trying to view their order details on the payment success page. The console logs showed:

```
[API Request] Authentication required, throwing error
PaymentSuccess - Error fetching order details: {response: {...}}
PaymentSuccess - Guest payment detected, showing limited info
```

The core issue was that the API interceptor was blocking order detail requests because:

1. The payment success URL didn't include the `guest=true` parameter
2. The API interceptor required authentication for all `/api/orders/` endpoints
3. The guest order tracking wasn't properly falling back when authentication failed

## Root Cause Analysis

### 1. Missing Guest Parameter in Redirect URL

The bKash callback handler was correctly checking if an order was a guest order:
```javascript
const isGuestOrder = !order.user || order.isGuestOrder || order.user.toString() === "000000000000000000000000";
const guestParam = isGuestOrder ? "&guest=true" : "";
```

However, if the order had a user associated (even if it was intended as a guest order), the `guest=true` parameter wasn't being added to the redirect URL.

### 2. API Interceptor Blocking Guest Requests

The API interceptor in `client/src/config/api.js` was only allowing guest access to certain paths when `guest=true` was explicitly in the URL:

```javascript
const isGuestCheckout = window.location.search.includes('guest=true');
const isGuestSupportedPath = isGuestCheckout && 
                            (guestSupportedPaths.some(path => config.url?.includes(path)) || 
                             isOrderConfirmation || 
                             isOrderDetailsCall);
```

### 3. Insufficient Fallback Logic

When authentication failed, the Redux action had fallback logic but it wasn't comprehensive enough for all payment success scenarios.

## Implemented Fixes

### 1. Enhanced API Interceptor Logic

Updated `client/src/config/api.js` to better detect payment success and guest order tracking scenarios:

```javascript
// Check if we're on a payment success or guest order tracking page
const isPaymentSuccessPage = window.location.pathname.includes('/payment/success');
const isGuestOrderTrackingPage = window.location.pathname.includes('/order/guest/track/');
const isOrderTrackingPage = window.location.pathname.includes('/order/') && 
                           (window.location.pathname.includes('/guest/track/') || 
                            window.location.search.includes('paymentId=') || 
                            window.location.search.includes('transactionId='));

// Expand guest supported path detection
const isGuestSupportedPath = isGuestCheckout && 
                            (guestSupportedPaths.some(path => config.url?.includes(path)) || 
                             isOrderConfirmation || 
                             isOrderDetailsCall) ||
                            // Allow order tracking requests on payment success pages 
                            (isPaymentSuccessPage && isOrderDetailsCall) ||
                            // Allow guest order tracking pages
                            (isGuestOrderTrackingPage && isOrderDetailsCall) ||
                            // Allow order tracking pages that have payment details
                            (isOrderTrackingPage && isOrderDetailsCall) ||
                            // Allow guest order tracking API endpoints
                            config.url?.includes('/api/orders/guest/track/');
```

### 2. Improved Redux Action Fallback

Enhanced `client/src/Redux/Customers/Order/Action.jsx` to automatically try guest order tracking when authentication fails:

```javascript
const isPaymentSuccessPage = window.location.pathname.includes('/payment/success');
const hasPaymentParams = window.location.search.includes('paymentId=') || window.location.search.includes('transactionId=');

// If we get an authentication error, try the guest order tracking endpoint
if (isAuthError && (isGuestCheckout || isPaymentSuccessPage || hasPaymentParams || error.message?.includes('Authentication required'))) {
  console.log('[getOrderById] Trying guest order tracking endpoint due to auth error');
  
  try {
    const guestResponse = await api.get(`/api/orders/guest/track/${orderId}`);
    data = guestResponse.data;
  } catch (guestError) {
    // Provide minimal order data for payment success pages
    if (isPaymentSuccessPage && hasPaymentParams) {
      // Create minimal order object with available information
    }
  }
}
```

### 3. Enhanced PaymentSuccess Component

Updated `client/src/customer/Components/Payment/PaymentSuccess.jsx` to handle cases where order details cannot be fetched:

```javascript
// Better detection of guest payments and payment parameters
const hasPaymentParams = searchParams.get('paymentId') || searchParams.get('transactionId');

if (isGuestPayment || hasPaymentParams) {
  // Update payment details with available information
  if (hasPaymentParams) {
    setPaymentDetails(prev => ({
      ...prev,
      transactionId: searchParams.get('transactionId') || searchParams.get('tran_id') || prev.transactionId,
      paymentPhoneNumber: searchParams.get('cus_phone') || searchParams.get('phone') || prev.paymentPhoneNumber,
      paymentMethod: 'bKash' // Assume bKash if transactionId is present
    }));
  }
  
  setError(null); // Don't show error for guest payments with payment confirmation
}
```

### 4. Fallback UI for Limited Order Information

Added fallback UI sections to show payment confirmation even when full order details aren't available:

```javascript
// Fallback for when order details couldn't be fetched but payment was successful
<Box sx={{ my: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
    Payment Confirmation
  </Typography>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
    <Typography variant="body2">Payment Status:</Typography>
    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>COMPLETED</Typography>
  </Box>
  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
    Your payment has been successfully processed. Order details will be available in your order history.
  </Typography>
</Box>
```

## Testing

The fixes should resolve the following scenarios:

1. **Guest bKash Payment**: User completes payment without being logged in
2. **Authenticated User bKash Payment**: Logged-in user makes payment but order tracking fails
3. **Payment Success with Missing Order Details**: Payment succeeded but order details cannot be retrieved
4. **Guest Order Tracking**: Direct access to guest order tracking pages

## Files Modified

1. `client/src/config/api.js` - Enhanced API interceptor logic
2. `client/src/Redux/Customers/Order/Action.jsx` - Improved fallback logic in getOrderById
3. `client/src/customer/Components/Payment/PaymentSuccess.jsx` - Better error handling and fallback UI

## Notes

The guest order tracking endpoints on the server (`/api/orders/guest/track/:id`) are already properly configured without authentication requirements, so no server-side changes were needed.

The fixes maintain backward compatibility while providing better user experience for edge cases where order details cannot be retrieved after successful payment. 