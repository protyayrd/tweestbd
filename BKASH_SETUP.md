# bKash Payment Gateway Integration

This project supports both **Sandbox** and **Live/Production** bKash payment gateway integration using the Tokenized Checkout API.

## Environment Variables

### For Sandbox/Testing Environment
```env
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v1.2.0-beta
BKASH_CHECKOUT_URL_USER_NAME=01770618567
BKASH_CHECKOUT_URL_PASSWORD=D7DaC<*E*eG
BKASH_CHECKOUT_URL_APP_KEY=0vWQuCRGiUX7EPVjQDr0EUAYtc
BKASH_CHECKOUT_URL_APP_SECRET=jcUNPBgbcqEDedNKdvE4G1cAK7D3hCjmJccNPZZBq96QIxxwAMEx
```

### For Live/Production Environment
```env
BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta
BKASH_CHECKOUT_URL_USER_NAME=01611101430
BKASH_CHECKOUT_URL_PASSWORD=h_50!j6>c0N
BKASH_CHECKOUT_URL_APP_KEY=PLSdaiLEF7SRZu8RF04hkagntc
BKASH_CHECKOUT_URL_APP_SECRET=DRmsGwXIYLQgYLfn0ebV0tLjp8aNI5YvBPjS7MIv6UP0QMaW8W8J
```

## API Endpoints Used

The integration utilizes the following bKash APIs:

### Live/Production Endpoints:
- **Grant Token API**: `https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant`
- **Create Payment API**: `https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/create`
- **Execute Payment API**: `https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/execute`
- **Query Payment API**: `https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/payment/status`
- **Search Transaction API**: `https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/general/searchTransaction`

### Sandbox Endpoints:
- **Grant Token API**: `https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant`
- **Create Payment API**: `https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/create`
- **Execute Payment API**: `https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/execute`
- **Query Payment API**: `https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/payment/status`
- **Search Transaction API**: `https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/general/searchTransaction`

## Setup Instructions

1. **Add Environment Variables**
   - Copy the appropriate environment variables (sandbox or production) to your `.env` file
   - Ensure your `.env` file is in the root directory of your project

2. **Install Dependencies**
   ```bash
   npm install axios
   ```

3. **Restart Your Server**
   ```bash
   npm run dev
   # or
   npm start
   ```

## Test Credentials (Sandbox Only)

For testing in sandbox environment, use these wallet numbers:
- **Test Wallet Numbers**: 01929918378, 01770618575, 01619777283, 01877722345
- **PIN**: 12121
- **OTP**: 123456

## Usage

### Frontend Integration
The bKash payment option is available in the checkout process:
1. User selects bKash as payment method
2. Clicks "Pay with bKash" button
3. Gets redirected to bKash payment gateway
4. Completes payment and returns to success page

### Payment Flow
1. **Create Payment**: Creates a payment request with bKash
2. **User Authorization**: User authorizes payment on bKash gateway
3. **Execute Payment**: Server executes the payment after user authorization
4. **Payment Confirmation**: Order status is updated based on payment result

## Implementation Features

### Token Management (Best Practices)
- ✅ **Grant API called only when needed** - Maximum twice per hour
- ✅ **Token stored in database** - Reused across all payment gateway users  
- ✅ **Automatic token expiry handling** - Tokens cached for 1 hour
- ✅ **Status code validation** - Only use token if `statusCode = "0000"`

### Callback Status Handling
- ✅ **"failure"/"cancel" status** → Direct redirect to failure page
- ✅ **"success" status only** → Execute API is called to complete payment
- ✅ **No unnecessary API calls** - Execute only called for success callbacks

### Execute API Response Validation
- ✅ **Success criteria**: `statusCode = "0000"`, `statusMessage = "Successful"`, `transactionStatus = "Completed"`
- ✅ **Failure handling**: Display proper `statusMessage` from Execute API response
- ✅ **Status code driven logic** - All decisions based on `statusCode` property

### Query API Usage (Fallback Only)
- ✅ **Only used when Execute API times out** or returns unknown status
- ✅ **Not used in normal payment flow** - Execute API is primary method
- ✅ **Timeout detection** - Specific handling for network timeouts

## Switching Between Environments

To switch between sandbox and production:

1. **For Sandbox**: Use the sandbox credentials and URLs
2. **For Production**: Use the production credentials and URLs
3. **Update Environment**: Restart your server after changing environment variables

**⚠️ Important**: Always test thoroughly in sandbox before switching to production!

## Production Setup Notes

When deploying to production:

1. **Environment Variables**: Ensure all production environment variables are set
2. **SSL Certificate**: Make sure your server has a valid SSL certificate
3. **Callback URLs**: Update callback URLs to match your production domain
4. **Error Handling**: Monitor error logs for any payment-related issues
5. **Testing**: Perform thorough testing with small amounts before going live

## Security Features

- **Token Management**: Automatic token generation and caching
- **Error Handling**: Comprehensive error handling for all payment scenarios
- **Logging**: Detailed logging for debugging and monitoring
- **Validation**: Input validation for all payment parameters
- **Database Token Storage**: Secure token storage with automatic expiry

## Troubleshooting

### Common Issues:
1. **Token Generation Failed**: Check credentials and network connectivity
2. **Payment Creation Failed**: Verify amount format and callback URL
3. **Payment Execution Failed**: Ensure payment was properly authorized by user
4. **Callback Not Received**: Check server logs and callback URL configuration

### Error Codes:
- **0000**: Successful
- **2001**: Insufficient Balance
- **2002**: Transaction Limit Exceeded
- **9999**: Network Error

For more detailed error codes, refer to the bKash developer documentation.

## Files Structure

```
server/
├── src/
│   ├── controllers/
│   │   └── payment.controller.js    # Payment handling with bKash integration
│   │   └── bkashService.js          # Core bKash service implementation
│   ├── models/
│   │   ├── payment.model.js         # Payment model with bKash support
│   │   ├── order.model.js           # Order model with bKash payment method
│   │   └── tokenCache.model.js      # Token caching for bKash
│   ├── routes/
│   │   └── payment.routes.js        # bKash callback routes
│   └── services/
│       └── bkashService.js          # Core bKash service implementation

client/
├── src/
│   ├── customer/
│   │   └── Components/
│   │       └── Payment/
│   │           ├── PaymentForm.jsx  # Payment form with bKash option
│   │           └── PaymentSuccess.jsx # Payment success page
│   └── Redux/
│       └── Customers/
│           └── Order/
│               └── Action.jsx       # Redux actions for order handling
```

## Support

For technical issues:
- Check server logs for detailed error messages
- Verify environment variables are correctly set
- Test with sandbox credentials first
- Contact bKash technical support for gateway-specific issues

## Live Payment Configuration

**Current Status**: Ready for production with live credentials

**Live Credentials**: 
- Product Name: TokenizedCheckout
- Username: 01611101430
- App Key: PLSdaiLEF7SRZu8RF04hkagntc
- Base URL: https://tokenized.pay.bka.sh/v1.2.0-beta

**Important**: Make sure to update your `.env` file with the live credentials above and restart your server to enable live bKash payments. 