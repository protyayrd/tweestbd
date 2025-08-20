const axios = require('axios');

async function testGuestOrder() {
  try {
    const testData = {
      address: {
        firstName: "Test",
        lastName: "User",
        streetAddress: "123 Test Street",
        division: "Dhaka",
        district: "Dhaka",
        upazilla: "Gulshan",
        zipCode: "1212",
        mobile: "01712345678",
        city: "Dhaka",
        zone: "Dhaka",
        area: "Gulshan"
      },
      orderItems: [
        {
          product: "507f1f77bcf86cd799439011", // Replace with actual product ID
          quantity: 1,
          size: "M",
          color: "Red"
        }
      ],
      totalPrice: 1000,
      totalDiscountedPrice: 900,
      discount: 100,
      productDiscount: 50,
      promoCodeDiscount: 50,
      deliveryCharge: 60,
      totalItem: 1
    };

    console.log('Testing guest order with data:', JSON.stringify(testData, null, 2));

    const response = await axios.post('http://localhost:5000/api/orders/guest', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testGuestOrder(); 