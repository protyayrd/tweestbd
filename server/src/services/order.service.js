const Address = require("../models/address.model.js");
const Order = require("../models/order.model.js");
const OrderItem = require("../models/orderItems.js");
const cartService = require("../services/cart.service.js");
const Product = require("../models/product.model.js");
const mongoose = require("mongoose");
const User = require("../models/user.model.js");

async function createOrder(user, orderData) {
  try {
    console.log("Creating order with data:", JSON.stringify(orderData, null, 2));
    console.log("User ID:", user._id);
    
    let address;
    const addressData = orderData.address;

    if (!addressData) {
      throw new Error("Address data is required");
    }

    // Log the address data we're about to process
    console.log("Processing address data:", JSON.stringify(addressData, null, 2));

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'streetAddress', 'division', 'district', 'upazilla', 'zipCode', 'mobile'];
    const missingFields = requiredFields.filter(field => !addressData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required address fields: ${missingFields.join(', ')}`);
    }

    if (addressData._id) {
      console.log("Finding existing address with ID:", addressData._id);
      let existedAddress = await Address.findById(addressData._id);
      if (!existedAddress) {
        throw new Error("Address not found with ID: " + addressData._id);
      }
      address = existedAddress;
    } else {
      console.log("Creating new address");
      address = new Address(addressData);
      address.user = user._id;  // Store just the user ID
      try {
        await address.save();
        console.log("Address saved:", address._id);
      } catch (error) {
        console.error("Error saving address:", error);
        throw error;
      }

      // Update user's addresses array with just the address ID
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
        userId: user._id,
      });

      console.log("Creating order item with data:", {
        price: orderItem.price,
        discountedPrice: orderItem.discountedPrice,
        product: orderItem.product,
        quantity: orderItem.quantity,
        size: orderItem.size,
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
    const createdOrder = new Order({
      user: user._id,
      orderItems,
      totalPrice: orderData.totalPrice,
      totalDiscountedPrice: orderData.totalDiscountedPrice,
      discount: orderData.discount,
      productDiscount: orderData.productDiscount || (orderData.discount - (orderData.promoCodeDiscount || 0)),
      promoCodeDiscount: orderData.promoCodeDiscount || 0,
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
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('user', 'firstName lastName email')
      .populate({
        path: 'orderItems',
        populate: {
          path: 'product',
          select: 'title price discountedPrice imageUrl'
        }
      })
      .populate('shippingAddress');

    return populatedOrder;
  } catch (error) {
    console.error("Error in createOrder service:", error);
    throw error;
  }
}

async function placedOrder(orderId) {
  const order = await findOrderById(orderId);
  order.orderStatus = "PLACED";
  order.paymentDetails.status = "COMPLETED";
  return await order.save();
}

async function confirmedOrder(orderId) {
  const order = await findOrderById(orderId);
  order.orderStatus = "CONFIRMED";
  return await order.save();
}

async function shipOrder(orderId) {
  const order = await findOrderById(orderId);
  order.orderStatus = "SHIPPED";
  return await order.save();
}

async function deliveredOrder(orderId) {
  const order = await findOrderById(orderId);
  order.orderStatus = "DELIVERED";
  return await order.save();
}

async function cancelledOrder(orderId) {
  const order = await findOrderById(orderId);
  order.orderStatus = "CANCELLED"; // Assuming OrderStatus is a string enum or a valid string value
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
      method: order.paymentDetails?.paymentMethod || "Not specified",
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

    // Build the query
    const query = { user: userId };

    // Add status filter if provided
    if (filters.status) {
      query.orderStatus = filters.status;
    }

    // Add date range filter if provided
    if (filters.startDate || filters.endDate) {
      query.orderDate = {};
      if (filters.startDate) {
        query.orderDate.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.orderDate.$lte = new Date(filters.endDate);
      }
    }

    // Add price range filter if provided
    if (filters.minPrice || filters.maxPrice) {
      query.totalDiscountedPrice = {};
      if (filters.minPrice) {
        query.totalDiscountedPrice.$gte = Number(filters.minPrice);
      }
      if (filters.maxPrice) {
        query.totalDiscountedPrice.$lte = Number(filters.maxPrice);
      }
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

    const orders = await Order.find(query)
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
      .sort(sortOptions)
      .lean()
      .exec();

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
        status: order.paymentDetails?.status || "PENDING",
        method: order.paymentDetails?.paymentMethod || "Not specified",
        paid: order.paymentDetails?.status === "COMPLETED",
        transactionId: order.paymentDetails?.transactionId,
        paidAt: order.paymentDetails?.status === "COMPLETED" ? order.paymentDetails?.updatedAt : null
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
  } catch (error) {
    console.error("Error in usersOrderHistory:", error);
    throw new Error(error.message);
  }
}

async function getAllOrders() {
  return await Order.find().populate({
    path: "orderItems",
    populate: {
      path: "product",
    },
  })
  .lean();;
}

async function deleteOrder(orderId) {
  const order = await findOrderById(orderId);
  if(!order)throw new Error("order not found with id ",orderId)

  await Order.findByIdAndDelete(orderId);
}

module.exports = {
  createOrder,
  placedOrder,
  confirmedOrder,
  shipOrder,
  deliveredOrder,
  cancelledOrder,
  findOrderById,
  usersOrderHistory,
  getAllOrders,
  deleteOrder,
};
