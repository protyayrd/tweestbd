const axios = require('axios');

async function testPaymentDebug() {
  try {
    // Test data for COD payment
    const testData = {
      orderId: "507f1f77bcf86cd799439011", // Replace with actual order ID
      paymentMethod: "COD",
      amount: 0,
      dueAmount: 1000,
      paymentPhoneNumber: "01712345678",
      customerName: "Test User",
      customerEmail: "test@example.com",
      paymentOption: "cod",
      isGuestCheckout: false,
      shippingAddress: {
        firstName: "Test",
        lastName: "User",
        streetAddress: "123 Test Street",
        division: "Dhaka",
        district: "Dhaka",
        upazilla: "Gulshan",
        zipCode: "1212",
        mobile: "01712345678"
      }
    };

    console.log("Testing payment with data:", {
      paymentMethod: testData.paymentMethod,
      paymentOption: testData.paymentOption,
      amount: testData.amount,
      dueAmount: testData.dueAmount
    });

    const response = await axios.post('http://localhost:5000/api/payments/create', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN' // Replace with actual JWT
      }
    });

    console.log("Payment Response:", response.data);
    
    if (response.data.status) {
      console.log("✅ Payment processed successfully!");
      console.log("Payment ID:", response.data.paymentId);
      console.log("Order ID:", response.data.orderId);
      console.log("Due Amount:", response.data.dueAmount);
    } else {
      console.log("❌ Payment failed:", response.data.message);
    }

  } catch (error) {
    console.error("❌ Error testing payment:", error.response?.data || error.message);
  }
}

// Run the test
testPaymentDebug(); 