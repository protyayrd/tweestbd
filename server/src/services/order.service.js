const Address = require("../models/address.model.js");
const Order = require("../models/order.model.js");
const OrderItem = require("../models/orderItems.js");
const cartService = require("../services/cart.service.js");
const Product = require("../models/product.model.js");
const mongoose = require("mongoose");
const User = require("../models/user.model.js");
const { generateOrderId } = require("../utils/orderIdGenerator.js");

// Helper function to get payment method label
function getPaymentMethodLabel(paymentOption) {
  switch(paymentOption) {
    case 'cod': return 'Cash on Delivery';
    case 'bkash': return 'bKash';
    case 'sslcommerz': return 'SSLCommerz';
    case 'outlet': return 'Outlet Pickup';
    case 'online': return 'Online'; // fallback for old data
    default: return 'SSLCommerz';
  }
}

async function createOrder(user, orderData, isGuest = false) {
  try {
    console.log("========== ORDER CREATION START ==========");
    console.log("Creating order with data:", JSON.stringify(orderData, null, 2));
    if (user) {
    console.log("User ID:", user._id);
    } else {
      console.log("Creating guest order");
    }
    
    let address;
    const addressData = orderData.address;

    if (!addressData) {
      console.error("Missing address data");
      throw new Error("Address data is required");
    }

    // Log the address data we're about to process
    console.log("Processing address data:", JSON.stringify(addressData, null, 2));

    // Map city/zone/area to division/district/upazilla if needed
    const mappedAddressData = {
      ...addressData,
      division: addressData.division || addressData.city,
      district: addressData.district || addressData.zone,
      upazilla: addressData.upazilla || addressData.area,
      zipCode: addressData.zipCode || "1212", // Default Dhaka zip code
      // Preserve original fields
      city: addressData.city || addressData.division,
      zone: addressData.zone || addressData.district,
      area: addressData.area || addressData.upazilla,
      // Ensure other required fields are included
      firstName: addressData.firstName,
      lastName: addressData.lastName,
      streetAddress: addressData.streetAddress,
      mobile: addressData.mobile,
      // Store Pathao IDs if available (convert undefined to null)
      pathao_city_id: addressData.cityId || addressData.pathao_city_id || null,
      pathao_zone_id: addressData.zoneId || addressData.pathao_zone_id || null,
      pathao_area_id: addressData.areaId || addressData.pathao_area_id || null
    };

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'streetAddress', 'division', 'district', 'upazilla', 'zipCode', 'mobile'];
    const missingFields = requiredFields.filter(field => {
      const value = mappedAddressData[field];
      return !value || value === "undefined" || (typeof value === 'string' && value.trim() === '');
    });
    
    if (missingFields.length > 0) {
      console.error("Missing address fields:", missingFields);
      throw new Error(`Missing required address fields: ${missingFields.join(', ')}`);
    }

    // For guest orders, always create a new address
    if (isGuest) {
      console.log("Creating new address for guest order");
      
      const sanitizedAddressData = { ...mappedAddressData };
      if (sanitizedAddressData.id) delete sanitizedAddressData.id;
      if (sanitizedAddressData._id && !mongoose.Types.ObjectId.isValid(sanitizedAddressData._id)) {
        delete sanitizedAddressData._id;
      }
      
      if (!sanitizedAddressData.zipCode || sanitizedAddressData.zipCode === "undefined" || sanitizedAddressData.zipCode.trim() === '') {
        sanitizedAddressData.zipCode = "1212"; // Default Dhaka zip code
      }
      
      address = new Address({
        ...sanitizedAddressData,
        isGuestAddress: true // Set guest address flag
      });
      
      // For guest orders, don't associate with a user
      if (user) {
        address.user = user._id;
      }
      
      try {
        await address.save();
        console.log("Guest address saved:", address._id);
      } catch (error) {
        console.error("Error saving guest address:", error);
        throw error;
      }
      
      // Only update user if this is not a guest order
      if (user) {
        await User.findByIdAndUpdate(user._id, { $push: { addresses: address._id } });
        console.log("User updated with new address");
      }
    } else if (addressData._id) {
      // Existing user with saved address
      console.log("Finding existing address with ID:", addressData._id);
      let existedAddress = await Address.findById(addressData._id);
      if (!existedAddress) {
        throw new Error("Address not found with ID: " + addressData._id);
      }
      address = existedAddress;
    } else {
      // Existing user with new address
      console.log("Creating new address with mapped data:", mappedAddressData);
      
      const sanitizedAddressData = { ...mappedAddressData };
      if (sanitizedAddressData.id) delete sanitizedAddressData.id;
      if (sanitizedAddressData._id && !mongoose.Types.ObjectId.isValid(sanitizedAddressData._id)) {
        delete sanitizedAddressData._id;
      }
      
      if (!sanitizedAddressData.zipCode || sanitizedAddressData.zipCode === "undefined" || sanitizedAddressData.zipCode.trim() === '') {
        sanitizedAddressData.zipCode = "1212"; // Default Dhaka zip code
      }
      
      address = new Address(sanitizedAddressData);
      address.user = user._id;
      try {
        await address.save();
        console.log("Address saved:", address._id);
      } catch (error) {
        console.error("Error saving address:", error);
        throw error;
      }

      await User.findByIdAndUpdate(user._id, { $push: { addresses: address._id } });
      console.log("User updated with new address");
    }

    console.log("Creating order items from request data");
    const orderItems = [];

    for (const item of orderData.orderItems) {
      console.log("Processing order item:", JSON.stringify(item, null, 2));
      
      // Get the product to ensure we have the correct prices
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product not found with ID: ${item.product}`);
      }

      console.log("Product found:", {
        id: product._id,
        price: product.price,
        discountedPrice: product.discountedPrice
      });

      if (!product.price || !product.discountedPrice) {
        throw new Error(`Product ${product._id} is missing required price fields`);
      }

      const orderItem = new OrderItem({
        price: Number(product.price),
        discountedPrice: Number(product.discountedPrice),
        product: item.product,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        userId: user ? user._id : null,
      });

      console.log("Creating order item with data:", {
        price: orderItem.price,
        discountedPrice: orderItem.discountedPrice,
        product: orderItem.product,
        quantity: orderItem.quantity,
        size: orderItem.size,
        color: orderItem.color,
        userId: orderItem.userId
      });

      const createdOrderItem = await orderItem.save();
      console.log("Created order item:", {
        id: createdOrderItem._id,
        price: createdOrderItem.price,
        discountedPrice: createdOrderItem.discountedPrice
      });
      orderItems.push(createdOrderItem._id);  // Store just the order item ID
    }

    console.log("Creating order with items:", orderItems);
    
    // Generate a formatted order ID
    const formattedOrderId = await generateOrderId();
    console.log("Generated formatted order ID:", formattedOrderId);
    
    const createdOrder = new Order({
      user: user ? user._id : null,
      isGuestOrder: isGuest,
      guestPhone: isGuest ? addressData.mobile : null,
      guestEmail: isGuest ? addressData.email : null,
      formattedOrderId: formattedOrderId,
      orderItems,
      totalPrice: orderData.totalPrice,
      totalDiscountedPrice: orderData.totalDiscountedPrice,
      discount: orderData.discount,
      productDiscount: orderData.productDiscount || (orderData.discount - (orderData.promoCodeDiscount || 0)),
      promoCodeDiscount: orderData.promoCodeDiscount || 0,
      deliveryCharge: orderData.deliveryCharge || 0,
      promoDetails: orderData.promoDetails || {
        code: null,
        discountType: null,
        discountAmount: 0,
        maxDiscountAmount: null
      },
      totalItem: orderData.totalItem,
      shippingAddress: address._id,
      orderDate: new Date(),
      orderStatus: "PLACED",
      "paymentDetails.status": "PENDING",
      createdAt: new Date(),
    });

    const savedOrder = await createdOrder.save();
    console.log("Order created successfully:", {
      id: savedOrder._id,
      status: savedOrder.orderStatus,
      items: savedOrder.orderItems.length
    });

    // Return the populated order
    const populateOptions = [
      {
        path: 'orderItems',
        populate: {
          path: 'product',
          select: 'title price discountedPrice imageUrl'
        }
      },
      {
        path: 'shippingAddress'
      }
    ];
    
    // Only add user populate for non-guest orders
    if (user) {
      populateOptions.unshift({
        path: 'user',
        select: 'firstName lastName email'
      });
    }
    
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate(populateOptions);
      
    console.log("Order creation completed successfully - ID:", populatedOrder._id);
    console.log("========== ORDER CREATION END ==========");
    return populatedOrder;
  } catch (error) {
    console.error("Error in createOrder:", error);
    throw error;
  }
}

async function placedOrder(orderId) {
  // Get full Mongoose document (not lean) so we can call save()
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new Error("Order not found with id: " + orderId);
  }
  
  order.orderStatus = "PLACED";
  order.paymentDetails.status = "COMPLETED";
  return await order.save();
}

async function confirmedOrder(orderId) {
  // Get full Mongoose document (not lean) so we can call save()
  const order = await Order.findById(orderId).populate({
    path: "orderItems",
    populate: {
      path: "product"
    }
  });
  
  if (!order) {
    throw new Error("Order not found with id: " + orderId);
  }
  
  // Update each product's size stock
  for (const orderItem of order.orderItems) {
    const product = orderItem.product;
    const size = orderItem.size;
    const color = orderItem.color;
    
    // Find the color in the product
    const colorObj = product.colors.find(c => c.name === color);
    if (colorObj) {
      // Find the size in the color
      const sizeObj = colorObj.sizes.find(s => s.name === size);
      if (sizeObj && sizeObj.quantity >= orderItem.quantity) {
        // Reduce the size quantity by the ordered quantity
        sizeObj.quantity -= orderItem.quantity;
        // Also reduce the color's total quantity by the ordered quantity
        colorObj.quantity -= orderItem.quantity;
        // Reduce the product's total quantity by the ordered quantity
        product.quantity -= orderItem.quantity;
        
        // Save the product changes
        await product.save();
      }
    }
  }
  
  // Update the order status
  order.orderStatus = "CONFIRMED";
  
  // Mark due amount as paid and update payment status
  if (order.dueAmount > 0) {
    // Set due amount to 0
    order.dueAmount = 0;
    order.dueStatus = 'PAID';
    order.paymentStatus = 'COMPLETED';
    
    // Update payment details if they exist
    if (order.paymentDetails) {
      order.paymentDetails = {
        ...order.paymentDetails,
        status: 'COMPLETED',
        dueStatus: 'PAID',
        dueAmountPaidAt: new Date()
      };
    }
    
    // Also update the associated payment record if it exists
    const Payment = require('../models/payment.model');
    const payment = await Payment.findOne({ order: order._id });
    if (payment) {
      payment.dueAmount = 0;
      payment.dueStatus = 'PAID';
      payment.status = 'COMPLETED';
      payment.paymentDetails = {
        ...payment.paymentDetails,
        dueStatus: 'PAID',
        dueAmountPaidAt: new Date(),
        status: 'COMPLETED'
      };
      await payment.save();
    }
  }
  
  return await order.save();
}

async function shipOrder(orderId) {
  // Get full Mongoose document (not lean) so we can call save()
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new Error("Order not found with id: " + orderId);
  }
  
  order.orderStatus = "SHIPPED";
  return await order.save();
}

async function deliveredOrder(orderId) {
  // Get full Mongoose document (not lean) so we can call save()
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new Error("Order not found with id: " + orderId);
  }
  
  order.orderStatus = "DELIVERED";
  return await order.save();
}

async function cancelledOrder(orderId) {
  // Get full Mongoose document (not lean) so we can call save()
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new Error("Order not found with id: " + orderId);
  }
  
  order.orderStatus = "CANCELLED";
  return await order.save();
}

async function findOrderById(orderId) {
  const order = await Order.findById(orderId)
    .populate({
      path: "user",
      select: "firstName lastName email mobile"
    })
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        select: "title price discountedPrice imageUrl brand category colors sizes description ratings numRatings"
      }
    })
    .populate({
      path: "shippingAddress",
      select: "firstName lastName streetAddress division district upazilla zipCode mobile"
    })
    .populate({
      path: "orderItems.product.category",
      select: "name level parentCategory"
    })
    .lean();

  if (!order) {
    throw new Error("Order not found with id: " + orderId);
  }

  // Enhance the order with additional information
  const enhancedOrder = {
    ...order,
    orderItems: order.orderItems.map(item => ({
      ...item,
      product: {
        ...item.product,
        mainImage: item.product.colors?.[0]?.images?.[0] || item.product.imageUrl,
        availableSizes: item.product.colors?.reduce((sizes, color) => {
          color.sizes?.forEach(size => {
            if (!sizes.find(s => s.name === size.name)) {
              sizes.push(size);
            }
          });
          return sizes;
        }, []) || [],
        colorOptions: item.product.colors?.map(color => ({
          name: color.name,
          mainImage: color.images?.[0],
          availableSizes: color.sizes
        })) || []
      }
    })),
    stats: {
      totalSavings: order.totalPrice - order.totalDiscountedPrice,
      savingsPercentage: ((order.totalPrice - order.totalDiscountedPrice) / order.totalPrice * 100).toFixed(2),
      itemCount: order.orderItems.length,
      averageItemPrice: (order.totalDiscountedPrice / order.orderItems.length).toFixed(2),
      processingTime: order.deliveryDate ? 
        Math.ceil((new Date(order.deliveryDate) - new Date(order.orderDate)) / (1000 * 60 * 60 * 24)) : 
        null
    },
    timeline: {
      ordered: order.orderDate,
      confirmed: order.orderStatus === "CONFIRMED" || order.orderStatus === "SHIPPED" || order.orderStatus === "DELIVERED",
      shipped: order.orderStatus === "SHIPPED" || order.orderStatus === "DELIVERED",
      delivered: order.orderStatus === "DELIVERED",
      cancelled: order.orderStatus === "CANCELLED",
      estimatedDelivery: order.orderStatus === "SHIPPED" ? 
        new Date(new Date(order.orderDate).getTime() + (5 * 24 * 60 * 60 * 1000)) : null
    },
    paymentStatus: {
      status: order.paymentDetails?.status || "PENDING",
      method: order.paymentDetails?.paymentMethod || getPaymentMethodLabel(order.paymentOption),
      paid: order.paymentDetails?.status === "COMPLETED",
      transactionId: order.paymentDetails?.transactionId,
      paidAt: order.paymentDetails?.status === "COMPLETED" ? order.paymentDetails?.updatedAt : null
    }
  };
  
  return enhancedOrder;
}

async function findOrderByFormattedId(formattedOrderId) {
  // Validate the input
  if (!formattedOrderId) {
    throw new Error("Invalid formatted order ID: null or empty");
  }

  console.log(`Finding order with formattedOrderId: ${formattedOrderId}`);
  
  const order = await Order.findOne({ formattedOrderId })
    .populate({
      path: "user",
      select: "firstName lastName email mobile"
    })
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        select: "title price discountedPrice imageUrl brand category colors sizes description ratings numRatings"
      }
    })
    .populate({
      path: "shippingAddress",
      select: "firstName lastName streetAddress division district upazilla zipCode mobile"
    })
    .populate({
      path: "orderItems.product.category",
      select: "name level parentCategory"
    })
    .lean();

  if (!order) {
    console.log(`No order found with formattedOrderId: ${formattedOrderId}`);
    throw new Error("Order not found with formatted ID: " + formattedOrderId);
  }

  console.log(`Found order with formattedOrderId ${formattedOrderId}, MongoDB ID: ${order._id}`);

  // Enhance the order with additional information (same as in findOrderById)
  const enhancedOrder = {
    ...order,
    orderItems: order.orderItems.map(item => ({
      ...item,
      product: {
        ...item.product,
        mainImage: item.product.colors?.[0]?.images?.[0] || item.product.imageUrl,
        availableSizes: item.product.colors?.reduce((sizes, color) => {
          color.sizes?.forEach(size => {
            if (!sizes.find(s => s.name === size.name)) {
              sizes.push(size);
            }
          });
          return sizes;
        }, []) || [],
        colorOptions: item.product.colors?.map(color => ({
          name: color.name,
          mainImage: color.images?.[0],
          availableSizes: color.sizes
        })) || []
      }
    })),
    stats: {
      totalSavings: order.totalPrice - order.totalDiscountedPrice,
      savingsPercentage: ((order.totalPrice - order.totalDiscountedPrice) / order.totalPrice * 100).toFixed(2),
      itemCount: order.orderItems.length,
      averageItemPrice: (order.totalDiscountedPrice / order.orderItems.length).toFixed(2),
      processingTime: order.deliveryDate ? 
        Math.ceil((new Date(order.deliveryDate) - new Date(order.orderDate)) / (1000 * 60 * 60 * 24)) : 
        null
    },
    timeline: {
      ordered: order.orderDate,
      confirmed: order.orderStatus === "CONFIRMED" || order.orderStatus === "SHIPPED" || order.orderStatus === "DELIVERED",
      shipped: order.orderStatus === "SHIPPED" || order.orderStatus === "DELIVERED",
      delivered: order.orderStatus === "DELIVERED",
      cancelled: order.orderStatus === "CANCELLED",
      estimatedDelivery: order.orderStatus === "SHIPPED" ? 
        new Date(new Date(order.orderDate).getTime() + (5 * 24 * 60 * 60 * 1000)) : null
    },
    paymentStatus: {
      status: order.paymentDetails?.status || "PENDING",
      method: order.paymentDetails?.paymentMethod || getPaymentMethodLabel(order.paymentOption),
      paid: order.paymentDetails?.status === "COMPLETED",
      transactionId: order.paymentDetails?.transactionId,
      paidAt: order.paymentDetails?.status === "COMPLETED" ? order.paymentDetails?.updatedAt : null
    }
  };
  
  return enhancedOrder;
}

async function usersOrderHistory(userId, filters = {}) {
  try {
    console.log("Fetching orders for user:", userId);
    console.log("Applied filters:", JSON.stringify(filters, null, 2));
    
    // Convert userId to string for consistent comparison
    const userIdStr = userId.toString();
    console.log("User ID as string:", userIdStr);
    
    // Try different query approaches to find orders for this user
    // This handles different ways the user ID might be stored in the database

    // Create multiple queries to try different ways the user ID might be stored
    const userQueries = [
      { user: userIdStr }, // User ID stored as string
      { userId: userIdStr }, // User ID stored in userId field
      { 'user._id': userIdStr }, // User ID stored in user._id
      { user: new mongoose.Types.ObjectId(userIdStr) } // User ID stored as ObjectId
    ];
    
    // Add status filter if provided
    if (filters.status) {
      userQueries.forEach(q => q.orderStatus = filters.status);
    }

    // Add date range filter if provided
    if (filters.startDate || filters.endDate) {
      const dateFilter = {};
      if (filters.startDate) {
        dateFilter.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        dateFilter.$lte = new Date(filters.endDate);
      }
      userQueries.forEach(q => q.orderDate = dateFilter);
    }

    // Add price range filter if provided
    if (filters.minPrice || filters.maxPrice) {
      const priceFilter = {};
      if (filters.minPrice) {
        priceFilter.$gte = Number(filters.minPrice);
      }
      if (filters.maxPrice) {
        priceFilter.$lte = Number(filters.maxPrice);
      }
      userQueries.forEach(q => q.totalDiscountedPrice = priceFilter);
    }

    // Determine sort order
    const sortOptions = {};
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'date_asc':
          sortOptions.orderDate = 1;
          break;
        case 'date_desc':
          sortOptions.orderDate = -1;
          break;
        case 'price_asc':
          sortOptions.totalDiscountedPrice = 1;
          break;
        case 'price_desc':
          sortOptions.totalDiscountedPrice = -1;
          break;
        default:
          sortOptions.createdAt = -1;
      }
    } else {
      sortOptions.createdAt = -1; // Default sort by newest first
    }

    try {
    console.log("Trying multiple query approaches:", JSON.stringify(userQueries, null, 2));
    
    // Try each query approach and collect all results
    let allOrdersResults = [];
    
    // Method 1: Try each query individually
    for (const query of userQueries) {
      console.log(`Trying query: ${JSON.stringify(query)}`);
      const results = await Order.find(query)
        .populate({
          path: "user",
          select: "firstName lastName email mobile _id"
        })
        .populate({
          path: "orderItems",
          populate: {
            path: "product",
            select: "title price discountedPrice imageUrl brand category colors sizes description ratings numRatings"
          }
        })
        .populate({
          path: "shippingAddress",
          select: "firstName lastName streetAddress division district upazilla zipCode mobile"
        })
        .populate({
          path: "orderItems.product.category",
          select: "name level parentCategory"
        })
        .sort(sortOptions)
        .lean();
      
      console.log(`Query ${JSON.stringify(query)} returned ${results.length} orders`);
      allOrdersResults = [...allOrdersResults, ...results];
    }
    
    // Method 2: Also try getting all orders and filtering manually
    console.log("Also trying manual filtering approach");
    const allOrders = await Order.find()
      .populate({
        path: "user",
        select: "firstName lastName email mobile _id"
      })
      .populate({
        path: "orderItems",
        populate: {
          path: "product",
          select: "title price discountedPrice imageUrl brand category colors sizes description ratings numRatings"
        }
      })
      .populate({
        path: "shippingAddress",
        select: "firstName lastName streetAddress division district upazilla zipCode mobile"
      })
      .populate({
        path: "orderItems.product.category",
        select: "name level parentCategory"
      })
      .sort(sortOptions)
      .lean();
    
    // Filter manually
    const manuallyFilteredOrders = allOrders.filter(order => {
      // Check various ways the user ID might be stored
      const orderUserId = typeof order.user === 'string' ? order.user : 
                         (order.user && order.user._id ? 
                          (typeof order.user._id === 'string' ? order.user._id : order.user._id.toString()) : null);
      
      const orderUserIdDirect = order.userId ? 
                               (typeof order.userId === 'string' ? order.userId : order.userId.toString()) : null;
      
      const matches = orderUserId === userIdStr || orderUserIdDirect === userIdStr;
      if (matches) {
        console.log(`Found matching order: ${order._id} for user ${userIdStr}`);
      }
      return matches;
    });
    
    console.log(`Manual filtering found ${manuallyFilteredOrders.length} orders out of ${allOrders.length} total`);
    
    // Combine results from both approaches and remove duplicates
    const allResults = [...allOrdersResults, ...manuallyFilteredOrders];
    
    // Remove duplicates by order ID
    const uniqueOrderIds = new Set();
    const orders = allResults.filter(order => {
      const isDuplicate = uniqueOrderIds.has(order._id.toString());
      uniqueOrderIds.add(order._id.toString());
      return !isDuplicate;
    });
    
    console.log(`Combined unique orders: ${orders.length}`);
    

      // If no orders found, return empty result with default stats
      if (!orders || orders.length === 0) {
        console.log("No orders found for user:", userId);
        return {
          orders: [],
          stats: {
            totalOrders: 0,
            totalSpent: 0,
            totalSaved: 0,
            averageOrderValue: 0,
            ordersByStatus: {}
          }
        };
      }

    // Calculate additional order statistics and enhance product information
    const ordersWithStats = orders.map(order => ({
      ...order,
      orderItems: order.orderItems.map(item => ({
        ...item,
        product: {
          ...item.product,
          mainImage: item.product.colors?.[0]?.images?.[0] || item.product.imageUrl,
          availableSizes: item.product.colors?.reduce((sizes, color) => {
            color.sizes?.forEach(size => {
              if (!sizes.find(s => s.name === size.name)) {
                sizes.push(size);
              }
            });
            return sizes;
          }, []) || [],
          colorOptions: item.product.colors?.map(color => ({
            name: color.name,
            mainImage: color.images?.[0],
            availableSizes: color.sizes
          })) || []
        }
      })),
      stats: {
        totalSavings: order.totalPrice - order.totalDiscountedPrice,
        savingsPercentage: ((order.totalPrice - order.totalDiscountedPrice) / order.totalPrice * 100).toFixed(2),
        itemCount: order.orderItems.length,
        averageItemPrice: (order.totalDiscountedPrice / order.orderItems.length).toFixed(2),
        processingTime: order.deliveryDate ? 
          Math.ceil((new Date(order.deliveryDate) - new Date(order.orderDate)) / (1000 * 60 * 60 * 24)) : 
          null
      },
      timeline: {
        ordered: order.orderDate,
        confirmed: order.orderStatus === "CONFIRMED" || order.orderStatus === "SHIPPED" || order.orderStatus === "DELIVERED",
        shipped: order.orderStatus === "SHIPPED" || order.orderStatus === "DELIVERED",
        delivered: order.orderStatus === "DELIVERED",
        cancelled: order.orderStatus === "CANCELLED",
        estimatedDelivery: order.orderStatus === "SHIPPED" ? 
          new Date(new Date(order.orderDate).getTime() + (5 * 24 * 60 * 60 * 1000)) : null
      },
      paymentStatus: {
        status: order.paymentDetails?.status || order.paymentStatus || "PENDING",
        method: order.paymentDetails?.paymentMethod || getPaymentMethodLabel(order.paymentOption),
        paid: order.paymentDetails?.status === "COMPLETED" || order.paymentStatus === "COMPLETED",
        transactionId: order.paymentDetails?.transactionId,
        paymentOption: order.paymentOption || 'sslcommerz',
        paidAt: (order.paymentDetails?.status === "COMPLETED" || order.paymentStatus === "COMPLETED") ? order.paymentDetails?.updatedAt : null
      }
    }));

    // Calculate overall statistics
    const overallStats = {
      totalOrders: ordersWithStats.length,
      totalSpent: ordersWithStats.reduce((sum, order) => sum + order.totalDiscountedPrice, 0),
      totalSaved: ordersWithStats.reduce((sum, order) => sum + order.stats.totalSavings, 0),
      averageOrderValue: ordersWithStats.length ? 
        (ordersWithStats.reduce((sum, order) => sum + order.totalDiscountedPrice, 0) / ordersWithStats.length).toFixed(2) : 0,
      ordersByStatus: ordersWithStats.reduce((acc, order) => {
        acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
        return acc;
      }, {}),
    };

    console.log("Found orders:", ordersWithStats.length);
    console.log("Overall stats:", JSON.stringify(overallStats, null, 2));

    return {
      orders: ordersWithStats,
      stats: overallStats
    };
    } catch (dbError) {
      console.error("Database error in usersOrderHistory:", dbError);
      // Return empty result on database error
      return {
        orders: [],
        stats: {
          totalOrders: 0,
          totalSpent: 0,
          totalSaved: 0,
          averageOrderValue: 0,
          ordersByStatus: {}
        }
      };
    }
  } catch (error) {
    console.error("Error in usersOrderHistory:", error);
    throw new Error(error.message);
  }
}

async function getAllOrders(filters = {}) {
  // Build query based on filters
  const query = {};
  
  console.log("getAllOrders received filters:", JSON.stringify(filters));
  
  // Filter by order status if provided
  if (filters.orderStatus) {
    query.orderStatus = filters.orderStatus;
    console.log(`Filtering by orderStatus: ${filters.orderStatus}`);
  }
  
  // Determine sort options
  let sortOptions = { createdAt: -1 }; // Default sort by newest first
  
  if (filters.sortBy) {
    console.log(`Sorting by: ${filters.sortBy}`);
    switch (filters.sortBy) {
      case 'date_asc':
        sortOptions = { createdAt: 1 };
        break;
      case 'date_desc':
        sortOptions = { createdAt: -1 };
        break;
      case 'price_asc':
        sortOptions = { totalDiscountedPrice: 1 };
        break;
      case 'price_desc':
        sortOptions = { totalDiscountedPrice: -1 };
        break;
    }
  }
  
  console.log("Final query:", JSON.stringify(query));
  console.log("Sort options:", JSON.stringify(sortOptions));
  
  return await Order.find(query)
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
      },
    })
    .populate("user", "firstName lastName email mobile")
    .populate("shippingAddress")
    .sort(sortOptions)
    .lean();
}

async function deleteOrder(orderId) {
  const order = await findOrderById(orderId);
  if(!order)throw new Error("order not found with id ",orderId)

  await Order.findByIdAndDelete(orderId);
}

// New function to find orders by phone number for guest tracking
async function findOrdersByPhone(phone) {
  try {
    console.log(`Finding orders for phone number: ${phone}`);
    
    const populateOptions = [
      {
        path: 'orderItems',
        populate: {
          path: 'product',
          select: 'title price discountedPrice imageUrl'
        }
      },
      {
        path: 'shippingAddress'
      }
    ];
    
    // First try direct match on guestPhone field
    const ordersByGuestPhone = await Order.find({ 
      isGuestOrder: true,
      guestPhone: phone 
    })
    .populate(populateOptions)
    .sort({ createdAt: -1 });
    
    if (ordersByGuestPhone.length > 0) {
      console.log(`Found ${ordersByGuestPhone.length} orders with direct guest phone match`);
      return ordersByGuestPhone;
    }
    
    // If no direct match, try to find by address phone
    console.log('Looking up orders by address phone number');
    const addresses = await Address.find({ mobile: phone });
    
    if (addresses.length === 0) {
      console.log('No addresses found with this phone number');
      return [];
    }
    
    const addressIds = addresses.map(addr => addr._id);
    
    // Find orders with matching shipping address
    const ordersByAddress = await Order.find({
      shippingAddress: { $in: addressIds }
    })
    .populate(populateOptions)
    .sort({ createdAt: -1 });
    
    console.log(`Found ${ordersByAddress.length} orders with matching shipping address`);
    
    return ordersByAddress;
  } catch (error) {
    console.error("Error finding orders by phone:", error);
    throw new Error(`Failed to find orders: ${error.message}`);
  }
}

module.exports = {
  createOrder,
  placedOrder,
  confirmedOrder,
  shipOrder,
  deliveredOrder,
  cancelledOrder,
  findOrderById,
  findOrderByFormattedId,
  usersOrderHistory,
  getAllOrders,
  deleteOrder,
  findOrdersByPhone
};
