# GTM/Pixel Data Layer Fixes Summary

## Issues Fixed

### 1. First Name, Last Name, and Phone Number Not Getting Values in Data Layer

**Problem:** The `getCustomerInfo()` function in `gtmEvents.js` was not properly extracting customer information from shipping address data stored in localStorage.

**Solution:** Enhanced the `getCustomerInfo()` function to:
- Check both `selectedAddress` and `guestAddress` in localStorage
- Handle guest checkout scenarios properly
- Support multiple phone number field variations (`mobile`, `phoneNumber`, `phone`)
- Provide comprehensive fallback logic for different field names
- Clean phone numbers for tracking (remove non-numeric characters)
- Return proper default values to prevent undefined errors

**Files Modified:**
- `client/src/utils/gtmEvents.js` (lines 11-50)

### 2. Enabled `add_payment_info` Data Layer Event

**Problem:** The `add_payment_info` event was not being triggered for all payment methods.

**Solution:** Added `trackAddPaymentInfo()` calls for:
- ✅ COD payments (already existed)
- ✅ Online payments (newly added)
- ✅ bKash payments (newly added)  
- ✅ Outlet payments (already existed)

**Files Modified:**
- `client/src/customer/Components/Checkout/PaymentForm.jsx` (added tracking before payment processing)

## How It Works Now

### Data Layer Customer Information
The data layer now properly includes customer information in all events:

```javascript
user_data: {
  first_name: "John",           // From shipping address
  last_name: "Doe",             // From shipping address  
  email_address: "john@example.com",
  phone_number: "1234567890",   // Cleaned, from shipping address
  city: "Dhaka",
  country: "BD", 
  postal_code: "1212",
  user_id: "customer_123",
  new_customer: "false"
}
```

### Payment Tracking
All payment methods now trigger `add_payment_info` events:

```javascript
// COD Payment
trackAddPaymentInfo({
  paymentMethod: "Cash on Delivery",
  amount: 1500
});

// Online Payment
trackAddPaymentInfo({
  paymentMethod: "Online Payment", 
  amount: 1400
});

// bKash Payment
trackAddPaymentInfo({
  paymentMethod: "bKash",
  amount: 1400
});

// Outlet Payments
trackAddPaymentInfo({
  paymentMethod: "Outlet Online Payment", // or "Outlet Cash Payment"
  amount: 1500
});
```

## Data Sources Priority

The system now checks customer information in this order:

1. **User object** from localStorage (for logged-in users)
2. **Guest Address** from localStorage (for guest checkout)
3. **Selected Address** from localStorage (fallback)
4. **Default values** (to prevent errors)

## Testing

### Manual Testing
1. Go to checkout as guest or logged-in user
2. Enter shipping address information
3. Proceed to payment step
4. Open browser console and run: `window.debugGTM()`
5. Check console output for customer info verification

### GTM Preview Mode Testing
1. Enable GTM Preview mode
2. Complete checkout flow
3. Verify these events fire with customer data:
   - `Page_view`
   - `add_to_cart`
   - `begin_checkout`
   - `purchase` (on completion)

### Expected Console Output
```
=== Customer Info Test ===
Customer info retrieved: {customerFirstName: "John", customerLastName: "Doe", ...}
Has first name: true
Has last name: true  
Has phone: true
Has email: true
```

## Field Mappings

### Address Field Variations Supported
- **Phone:** `mobile`, `phoneNumber`, `phone`
- **Names:** `firstName`, `lastName` 
- **Email:** `email`
- **Location:** `city`, `zone`, `area`

### Meta Pixel Standard Events
All events follow Meta Pixel standard event naming:
- ✅ `PageView`
- ✅ `ViewContent` 
- ✅ `AddToCart`
- ✅ `InitiateCheckout`
- ✅ `AddPaymentInfo`
- ✅ `Purchase`

## Files Modified

1. **`client/src/utils/gtmEvents.js`**
   - Enhanced `getCustomerInfo()` function
   - Added comprehensive debugging function
   - Improved error handling

2. **`client/src/customer/Components/Checkout/PaymentForm.jsx`**
   - Added `trackAddPaymentInfo()` for online and bKash payments
   - Enhanced payment tracking coverage

## Browser Console Commands

### Debug GTM Integration
```javascript
window.debugGTM()
```

### Check Customer Info
```javascript
// Check what's in localStorage
console.log('Selected Address:', JSON.parse(localStorage.getItem('selectedAddress')));
console.log('Guest Address:', JSON.parse(localStorage.getItem('guestAddress')));
console.log('User:', JSON.parse(localStorage.getItem('user')));
```

### Manual Event Testing
```javascript
// Test add_payment_info event
trackAddPaymentInfo({paymentMethod: 'Test', amount: 100});
```

## Compatibility

- ✅ Works with guest checkout
- ✅ Works with logged-in users
- ✅ Works with all payment methods (COD, Online, bKash, Outlet)
- ✅ Handles missing data gracefully
- ✅ Compatible with existing GTM setup
- ✅ Follows Meta Pixel standards

The data layer now properly captures and sends first name, last name, and phone number from shipping addresses for all checkout scenarios, and the `add_payment_info` event is enabled for all payment methods. 