import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPayment } from "../../../Redux/Customers/Payment/Action";
import { clearCart } from "../../../Redux/Customers/Cart/Action";
import {
  pushToDataLayer,
  trackAbandonedCheckout,
  trackAddPaymentInfo,
} from "../../../utils/gtmEvents";
import {
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Divider,
  Alert,
  Dialog,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SecurityIcon from "@mui/icons-material/Security";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PriceDetailsPanel from "./PriceDetailsPanel";
import priceService from "../../../services/priceCalculationService";
import { useNavigate } from "react-router-dom";

const PaymentForm = ({ handleBack, isGuestCheckout, guestCart }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const dispatch = useDispatch();
  const order = useSelector((state) => state.order);
  const jwt = localStorage.getItem("jwt");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOption, setPaymentOption] = useState("cod"); // Ensure COD is default
  const [showOutletPaymentModal, setShowOutletPaymentModal] = useState(false);
  const [outletPaymentType, setOutletPaymentType] = useState("cash");
  const [isGuest, setIsGuest] = useState(!jwt);
  const [guestCartData, setGuestCartData] = useState(null);
  const [guestOrderData, setGuestOrderData] = useState(null);

  // Load guest address data
  const [guestAddress, setGuestAddress] = useState(null);
  
  // Debug: Log payment option changes
  useEffect(() => {
    console.log("Payment option changed to:", paymentOption);
  }, [paymentOption]);

  useEffect(() => {
    if (isGuestCheckout && !jwt) {
      try {
        // Load guest address
        const addressData = localStorage.getItem('guestAddress');
        if (addressData) {
          setGuestAddress(JSON.parse(addressData));
        }
        
        // Load guest cart
        const cartData = localStorage.getItem('guestCart');
        if (cartData) {
          setGuestCartData(JSON.parse(cartData));
        } else if (guestCart) {
          // Use the guestCart prop if available
          setGuestCartData(guestCart);
        }
        
        // Load guest order data if available
        const orderData = localStorage.getItem('guestOrderData');
        if (orderData) {
          const parsedOrderData = JSON.parse(orderData);
          setGuestOrderData(parsedOrderData);
          
          // If we don't have an order ID in Redux but have one in localStorage, use the localStorage data
          if ((!order.order || !order.order._id) && parsedOrderData._id) {
            // Manually update the order object
            order.order = {
              ...parsedOrderData,
              productDiscount: parsedOrderData.productDiscount || 0,
              promoCodeDiscount: parsedOrderData.promoCodeDiscount || 0,
              deliveryCharge: parsedOrderData.deliveryCharge || 0,
              orderItems: parsedOrderData.orderItems || []
            };
          }
        }
      } catch (error) {
        console.error('Error loading guest data:', error);
      }
    }
  }, [isGuestCheckout, jwt, guestCart, order]);

  // Track checkout step for payment
  useEffect(() => {
    // Track when user reaches payment step
    pushToDataLayer({
      event: "checkout",
      eventCategory: "Ecommerce",
      eventAction: "Checkout Step 3",
      eventLabel: "Payment",
      ecommerce: {
        checkout: {
          actionField: { step: 3 },
          products:
            order.order?.orderItems?.map((item) => ({
              id: item.product?._id || item.productId,
              name: item.product?.title || item.title,
              price: item.discountedPrice || item.price,
              brand: item.product?.brand || "Tweest",
              category: item.product?.category?.name || "Unknown",
              variant: item.color || item.size,
              quantity: item.quantity,
            })) || [],
        },
      },
    });

    // Setup tracking for abandoned checkout
    const trackAbandonedPayment = () => {
      if (
        order.order &&
        order.order.orderItems &&
        order.order.orderItems.length > 0 &&
        !isSubmitting
      ) {
        trackAbandonedCheckout(
          order.order.orderItems,
          order.order,
          "payment",
        );
      }
    };

    // Add event listeners for detecting when users leave the page
    window.addEventListener("beforeunload", trackAbandonedPayment);

    // Get guest cart data if in guest checkout mode
    if (isGuestCheckout && !jwt) {
      try {
        const guestCartData = localStorage.getItem('guestCart');
        if (guestCartData) {
          const parsedCart = JSON.parse(guestCartData);
          // Store guest cart data in component state or use directly
          console.log('Using guest cart data from localStorage:', parsedCart);
        }
      } catch (error) {
        console.error('Error loading guest cart data:', error);
      }
    }

    // Clean up event listeners when component unmounts
    return () => {
      window.removeEventListener("beforeunload", trackAbandonedPayment);
    };
  }, [order.order, isSubmitting, isGuestCheckout, jwt]);

  // Modify the useEffect to ensure productDiscount is set correctly for both guest and regular users
  useEffect(() => {
    // Set fallback values for order data when dealing with guest checkout
    if (isGuestCheckout && !jwt && (!order.order || !order.order.productDiscount)) {
      // Create default values to prevent null references
      const guestOrderDefaults = {
        totalPrice: 0,
        totalDiscountedPrice: 0,
        discount: 0,
        productDiscount: 0,
        promoCodeDiscount: 0,
        deliveryCharge: 0,
        orderItems: []
      };
      
      // If we have order data, update it with defaults for any missing fields
      if (order.order) {
        order.order = {
          ...guestOrderDefaults,
          ...order.order
        };
      } else {
        // If order.order is completely null, provide a default object
        order.order = { ...guestOrderDefaults };
      }
    }
  }, [isGuestCheckout, jwt, order.order]);

  // Updated theme colors
  const colors = {
    primary: "#00503a", // Deep green - primary color
    secondary: "#69af5a", // Medium green - secondary color
    light: "#ffffff", // Changed from '#e1ffe3' to white
    text: "#00503a", // Text color matching primary
    lightText: "#555555", // Lighter text for secondary information
    border: "#c0e6c0", // Light border color to match theme
    white: "#ffffff", // White for contrast
  };

  const handlePaymentOptionChange = (event) => {
    setPaymentOption(event.target.value);
  };

  // Calculate delivery charge based on payment method
  const calculateDeliveryCharge = () => {
    // Get product price minus discounts
    const productPrice = order.order?.totalPrice || 0;
    const productDiscount = order.order?.productDiscount || 0;
    const promoDiscount = order.order?.promoCodeDiscount || 0;
    const originalDeliveryCharge = order.order?.deliveryCharge || 0;

    const discountedProductPrice =
      productPrice - productDiscount - promoDiscount;

    // For COD, always include delivery charge (paid upon delivery)
    if (paymentOption === "cod") {
      return originalDeliveryCharge;
    }

    // Free delivery for online payments over 2200 Tk
    if (paymentOption === "online" && discountedProductPrice >= 2200) {
      return 0;
    }

    // No delivery charge for outlet pickup
    if (paymentOption === "outlet") {
      return 0;
    }

    return originalDeliveryCharge;
  };

  // Get the effective delivery charge based on payment method
  const effectiveDeliveryCharge = calculateDeliveryCharge();

  // Extract the pure product price without delivery charge
  const getPureProductPrice = () => {
    if (!order.order) return 0;

    // Always subtract the original delivery charge from total price to get pure product price
    const originalDeliveryCharge = order.order.deliveryCharge || 0;
    const totalPrice = order.order.totalPrice || 0;

    return Math.max(0, totalPrice - originalDeliveryCharge);
  };

  // Get pure product price (without delivery charge)
  const pureProductPrice = getPureProductPrice();

  // Format the order data for PriceDetailsPanel
  const getFormattedOrderData = () => {
    // For guest checkout, use guestCartData if order.order is not available
    if (isGuestCheckout && !jwt && (!order.order || Object.keys(order.order).length === 0) && guestCartData) {
      console.log("Using guest cart data for price formatting:", guestCartData);
      
      // Calculate values from guest cart data
      const productPrice = Number(guestCartData.totalPrice || 0);
      const productDiscount = Number(guestCartData.discount || 0) - Number(guestCartData.promoCodeDiscount || 0);
      const promoDiscount = Number(guestCartData.promoCodeDiscount || 0);
      const originalDelivery = guestCartData.deliveryCharge || 60; // Default to 60 if not set
      
      // Apply delivery charge logic
      let deliveryChargeToShow = originalDelivery;
      
      // For online payment with qualifying amount, set to 0
      const discountedPrice = productPrice - productDiscount - promoDiscount;
      const qualifiesForFreeDelivery = discountedPrice >= 2200;
      
      if (paymentOption === "online" && qualifiesForFreeDelivery) {
        deliveryChargeToShow = 0;
      }
      
      // For outlet pickup, no delivery charge
      if (paymentOption === "outlet") {
        deliveryChargeToShow = 0;
      }
      
      return {
        totalPrice: productPrice,
        productDiscount: productDiscount,
        promoCodeDiscount: promoDiscount,
        deliveryCharge: deliveryChargeToShow,
        paymentOption: paymentOption,
        isFreeDelivery: qualifiesForFreeDelivery && paymentOption === "online",
        isCOD: paymentOption === "cod",
        totalItem: guestCartData.cartItems?.length || 0
      };
    }
    
    // Ensure a default object if order.order is null
    if (!order.order) {
      return {
        totalPrice: 0,
        productDiscount: 0,
        promoCodeDiscount: 0,
        deliveryCharge: 0,
        paymentOption: paymentOption,
        isFreeDelivery: false,
        isCOD: paymentOption === "cod",
        totalItem: 0,
        orderItems: []
      };
    }
    
    // For regular orders, use the existing logic
    // Calculate discounted product price
    const productDiscount = order.order.productDiscount || 0;
    const promoDiscount = order.order.promoCodeDiscount || 0;
    const discountedPrice = pureProductPrice - productDiscount - promoDiscount;

    // Check if order would qualify for free delivery with online payment
    const qualifiesForFreeDelivery = discountedPrice >= 2200;

    // Calculate delivery charge based on payment method and qualifying conditions
    let deliveryChargeToShow = order.order.deliveryCharge || 0;

    // For online payment, free delivery if qualified
    if (paymentOption === "online" && qualifiesForFreeDelivery) {
      deliveryChargeToShow = 0;
    }

    // For outlet pickup, no delivery charge
    if (paymentOption === "outlet") {
      deliveryChargeToShow = 0;
    }

    // Debug log the formatted data
    console.log("Formatted order data:", {
      pureProductPrice,
      discountedPrice,
      deliveryChargeToShow,
      paymentOption,
      qualifiesForFreeDelivery,
    });

    return {
      ...order.order,
      totalPrice: pureProductPrice,
      deliveryCharge: deliveryChargeToShow,
      paymentOption,
    };
  };

  // Update handleCodPayment to safely handle missing productDiscount
  // eslint-disable-next-line no-unused-vars
  const handleCodPayment = async () => {
    try {
      setIsSubmitting(true);
      setFormError("");

      // Track payment option selected
      pushToDataLayer({
        event: "checkoutOption",
        eventCategory: "Ecommerce",
        eventAction: "Checkout Option",
        eventLabel: "Cash on Delivery",
        ecommerce: {
          checkout_option: {
            actionField: {
              step: 3,
              option: "Cash on Delivery",
            },
          },
        },
      });

      // Track Add Payment Info event for Meta Pixel
      trackAddPaymentInfo({
        paymentMethod: "Cash on Delivery",
        amount: order.order?.totalDiscountedPrice || 0,
      });

      // If outlet pickup is selected, show the payment options modal instead of proceeding directly
      if (paymentOption === "outlet") {
        setShowOutletPaymentModal(true);
        setIsSubmitting(false);
        return;
      }

      // Get address from selected address in localStorage
      const paymentAddress = JSON.parse(localStorage.getItem("selectedAddress"));
      const customerInfo = paymentAddress || {};
      
      // Get customer phone number
      const paymentPhoneNumber = customerInfo.mobile || customerInfo.phoneNumber || "";

      // Default values for payment data
      let paymentMethod = "COD";
      let amount = 0; // Default for COD is 0 upfront payment
      
      // Set dueAmount safely, ensuring we have a valid order to avoid TypeError
      let dueAmount = 0;
      let orderData = {};
      let shippingAddress = {}; // Define shippingAddress to fix ESLint error
      
      if (isGuestCheckout && !jwt) {
        // First try to use guestOrderData from localStorage if available
        if (guestOrderData && guestOrderData._id) {
          orderData = {
            ...guestOrderData,
            productDiscount: guestOrderData.productDiscount || 0,
            promoCodeDiscount: guestOrderData.promoCodeDiscount || 0,
            deliveryCharge: guestOrderData.deliveryCharge || 0
          };
          dueAmount = orderData.totalDiscountedPrice || 0;
        }
        // Fall back to guestCartData if needed
        else if (guestCartData) {
          // Calculate values from guest cart data for guest checkout
          const productPrice = Number(guestCartData.totalPrice || 0);
          const productDiscount = Number(guestCartData.discount || 0) - Number(guestCartData.promoCodeDiscount || 0);
          const promoDiscount = Number(guestCartData.promoCodeDiscount || 0);
          const delivery = Number(guestCartData.deliveryCharge || 60);
          
          dueAmount = Math.max(0, productPrice - productDiscount - promoDiscount + delivery);
          
          orderData = {
            totalPrice: productPrice,
            totalDiscountedPrice: dueAmount,
            discount: productDiscount + promoDiscount,
            productDiscount: productDiscount || 0,
            promoCodeDiscount: promoDiscount || 0,
            deliveryCharge: delivery || 0,
            _id: order.order?._id
          };
        }
        // Fall back to order.order as last resort
        else if (order.order && order.order._id) {
          dueAmount = order.order.totalDiscountedPrice || 0;
          orderData = {
            ...order.order,
            productDiscount: order.order.productDiscount || 0,
            promoCodeDiscount: order.order.promoCodeDiscount || 0,
            deliveryCharge: order.order.deliveryCharge || 0
          };
        }
        else {
          throw new Error("No order data available for guest checkout");
        }
        
        // Get shipping address from localStorage
        // eslint-disable-next-line no-unused-vars
        shippingAddress = JSON.parse(localStorage.getItem("selectedAddress")) || {};
      } else if (order.order) {
        // For logged-in users with existing order
        dueAmount = order.order.totalDiscountedPrice || 0;
        orderData = {
          ...order.order,
          productDiscount: order.order.productDiscount || 0,
          promoCodeDiscount: order.order.promoCodeDiscount || 0,
          deliveryCharge: order.order.deliveryCharge || 0
        };
        
        // Get shipping address from order
        // eslint-disable-next-line no-unused-vars
        shippingAddress = order.order?.shippingAddress || {};
      } else {
        throw new Error("No order data available");
      }

      const paymentData = {
        orderId: orderData._id,
        paymentMethod,
        amount,
        dueAmount,
        paymentPhoneNumber,
        customerName: customerInfo.name || `${customerInfo.firstName || ""} ${customerInfo.lastName || ""}`.trim(),
        customerEmail: customerInfo.email || "",
        shippingAddress: paymentAddress,
        paymentOption,
        isGuestCheckout: isGuestCheckout && !jwt // Add this flag to indicate guest checkout
      };

      // Only include JWT for logged-in users, not for guest checkout
      if (jwt && !isGuestCheckout) {
        paymentData.jwt = jwt;
      }

      console.log("Sending COD payment data:", paymentData);
      console.log("COD Payment Method:", paymentData.paymentMethod);
      console.log("COD Payment Option:", paymentData.paymentOption);

      // Send the payment data to the server
      const response = await dispatch(createPayment(paymentData));

      // Handle special case for COD success message
      if (response.error && response.error.includes("Order confirmed with Cash on Delivery")) {
        // This is actually a success case for COD
        try {
          await dispatch(clearCart());
        } catch (cartError) {
          console.error("Error clearing cart:", cartError);
          // Continue with success message even if cart clearing fails
        }

        // Clear all guest checkout data from localStorage
        if (isGuestCheckout) {
          localStorage.removeItem('guestCart');
          localStorage.removeItem('guestAddress');
          localStorage.removeItem('guestOrderData');
          localStorage.removeItem('guestCartItems');
        }

        // Redirect to order confirmation page
        window.location.href = `/order-confirmation?order_id=${orderData._id}&payment_type=cod`;
        return;
      }

      if (response.error) {
        throw new Error(response.error);
      }

      setIsSubmitting(false);
    } catch (error) {
      console.error("Error processing COD payment:", error);
      setFormError(error.message || "Failed to process Cash on Delivery payment");
      setIsSubmitting(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setFormError("");

    // If outlet pickup is selected, show the payment options modal instead of proceeding directly
    if (paymentOption === "outlet") {
      setShowOutletPaymentModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      let orderData = {};
      let shippingAddress = {};
      
      // Handle different scenarios for order data
      if (isGuestCheckout && !jwt) {
        // First try to use guestOrderData from localStorage if available
        if (guestOrderData && guestOrderData._id) {
          orderData = {
            ...guestOrderData,
            productDiscount: guestOrderData.productDiscount || 0,
            promoCodeDiscount: guestOrderData.promoCodeDiscount || 0,
            deliveryCharge: guestOrderData.deliveryCharge || 0
          };
        }
        // Fall back to guestCartData if needed
        else if (guestCartData) {
          // For guest checkout, get order data from guestCartData and address from localStorage
          if (!guestCartData) {
            throw new Error("Guest cart data not available");
          }
          
          // Get the order ID from the order state if available
          const orderId = order.order?._id;
          if (!orderId) {
            throw new Error("No order ID available for guest checkout");
          }
          
          // Calculate values from guest cart data
          const productPrice = Number(guestCartData.totalPrice || 0);
          const productDiscount = Number(guestCartData.discount || 0) - Number(guestCartData.promoCodeDiscount || 0);
          const promoDiscount = Number(guestCartData.promoCodeDiscount || 0);
          const delivery = Number(guestCartData.deliveryCharge || 60);
          
          // Create order data for payment with default values to prevent null issues
          orderData = {
            _id: orderId,
            totalPrice: productPrice,
            totalDiscountedPrice: Math.max(0, productPrice - productDiscount - promoDiscount + delivery),
            discount: productDiscount + promoDiscount,
            productDiscount: productDiscount || 0, // Ensure this is not null
            promoCodeDiscount: promoDiscount || 0, // Ensure this is not null
            deliveryCharge: delivery || 0 // Ensure this is not null
          };
        }
        // Fall back to order.order as last resort
        else if (order.order && order.order._id) {
          orderData = {
            ...order.order,
            productDiscount: order.order.productDiscount || 0,
            promoCodeDiscount: order.order.promoCodeDiscount || 0,
            deliveryCharge: order.order.deliveryCharge || 0
          };
        }
        else {
          throw new Error("No order data available for guest checkout");
        }
        
        // Get shipping address from localStorage
        // eslint-disable-next-line no-unused-vars
        shippingAddress = JSON.parse(localStorage.getItem("selectedAddress")) || {};
      } else {
        // For logged-in users with existing order
        if (!order.order?._id) {
          throw new Error("No order ID available");
        }
        
        orderData = order.order;
        shippingAddress = order.order?.shippingAddress || {};
      }

      // Validate shipping address using city/zone/area format
      const requiredFields = [
        "firstName",
        "lastName",
        "streetAddress",
        "mobile",
      ];

      // Check if one of the location formats is available
      const hasLocationFormat1 =
        shippingAddress.city && shippingAddress.zone && shippingAddress.area;
      const hasLocationFormat2 =
        shippingAddress.division &&
        shippingAddress.district &&
        shippingAddress.upazilla;

      if (!hasLocationFormat1 && !hasLocationFormat2) {
        requiredFields.push("city", "zone", "area");
      }

      const missingFields = requiredFields.filter((field) => {
        const value = shippingAddress[field];
        const isEmpty =
          !value ||
          value === "undefined" ||
          (typeof value === "string" && value.trim() === "");
        return isEmpty;
      });

      if (missingFields.length > 0) {
        throw new Error(
          `Shipping address is incomplete. Missing fields: ${missingFields.join(", ")}. Please update your shipping address.`,
        );
      }

      // Ensure all required fields are present and properly mapped
      const paymentAddress = {
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        streetAddress: shippingAddress.streetAddress,
        mobile: shippingAddress.mobile,
        // Map location fields with appropriate fallbacks
        division: shippingAddress.city || shippingAddress.division || "",
        district: shippingAddress.zone || shippingAddress.district || "",
        upazilla: shippingAddress.area || shippingAddress.upazilla || "",
        zipCode: shippingAddress.zipCode || "1212", // Default Dhaka zip code
        // Preserve Pathao IDs if available
        pathao_city_id: shippingAddress.pathao_city_id || "",
        pathao_zone_id: shippingAddress.pathao_zone_id || "",
        pathao_area_id: shippingAddress.pathao_area_id || "",
      };

      // Additional validation for mapped fields
      const mappedRequiredFields = [
        "division",
        "district",
        "upazilla",
        "zipCode",
      ];
      const missingMappedFields = mappedRequiredFields.filter(
        (field) => !paymentAddress[field],
      );

      if (missingMappedFields.length > 0) {
        throw new Error(
          `Address mapping failed. Missing fields: ${missingMappedFields.join(", ")}`,
        );
      }

      // Get phone number from shipping address
      const paymentPhoneNumber = paymentAddress.mobile;
      if (!paymentPhoneNumber) {
        throw new Error("Phone number is required for payment");
      }

      // Get customer information
      const customerInfo = {
        firstName: paymentAddress.firstName || "",
        lastName: paymentAddress.lastName || "",
        name: paymentAddress.name || `${paymentAddress.firstName || ''} ${paymentAddress.lastName || ''}`.trim(),
        email: paymentAddress.email || shippingAddress.email || ""
      };

      // Handle different payment options
      let amount = 0;
      let paymentMethod = "COD"; // Default, will be overridden based on paymentOption
      let dueAmount = 0;

      // Extract the pure product price
      const pureProductPrice = orderData.totalPrice - (orderData.deliveryCharge || 0);

      if (paymentOption === "online") {
        // Calculate the discounted product price
        const discountedProductPrice =
          pureProductPrice -
          (orderData.productDiscount || 0) -
          (orderData.promoCodeDiscount || 0);

        // Check if order qualifies for free delivery
        const qualifiesForFreeDelivery = discountedProductPrice >= 2200;

        // Set amount based on free delivery qualification
        amount = qualifiesForFreeDelivery
          ? discountedProductPrice
          : discountedProductPrice + (orderData.deliveryCharge || 0);

        console.log("Online payment details:", {
          pureProductPrice,
          discountedProductPrice,
          deliveryCharge: orderData.deliveryCharge || 0,
          qualifiesForFreeDelivery,
          finalAmount: amount,
        });
      } else if (paymentOption === "bkash") {
        // For bKash payment, handle similarly to online
        paymentMethod = "bKash";
        
        // Calculate the discounted product price
        const discountedProductPrice =
          pureProductPrice -
          (orderData.productDiscount || 0) -
          (orderData.promoCodeDiscount || 0);

        // Check if order qualifies for free delivery
        const qualifiesForFreeDelivery = discountedProductPrice >= 2200;

        // Set amount based on free delivery qualification
        amount = qualifiesForFreeDelivery
          ? discountedProductPrice
          : discountedProductPrice + (orderData.deliveryCharge || 0);

        console.log("bKash payment details:", {
          pureProductPrice,
          discountedProductPrice,
          deliveryCharge: orderData.deliveryCharge || 0,
          qualifiesForFreeDelivery,
          finalAmount: amount,
        });
      } else if (paymentOption === "cod") {
        // For Cash on Delivery, delivery charge is collected upon delivery
        amount = 0; // No upfront payment
        dueAmount = orderData.totalDiscountedPrice;
        paymentMethod = "COD";
        console.log("COD payment details:", {
          totalPrice: orderData.totalDiscountedPrice,
          deliveryCharge: orderData.deliveryCharge || 0,
          amount,
          dueAmount,
          paymentMethod,
          paymentOption
        });
      } else if (paymentOption === "outlet") {
        // For Outlet pickup, no payment needed
        amount = 0;
        dueAmount = orderData.totalDiscountedPrice;
        paymentMethod = "Outlet";
        console.log("Outlet pickup payment details:", {
          totalPrice: orderData.totalDiscountedPrice,
          amount: 0,
          dueAmount,
        });
      }

      const paymentData = {
        orderId: orderData._id,
        paymentMethod,
        amount,
        dueAmount,
        totalPrice: pureProductPrice,
        productPrice:
          pureProductPrice -
          (orderData.productDiscount || 0) -
          (orderData.promoCodeDiscount || 0),
        paymentPhoneNumber,
        customerName: customerInfo.name ||
          `${customerInfo.firstName || ""} ${customerInfo.lastName || ""}`.trim(),
        customerEmail: customerInfo.email || "",
        shippingAddress: paymentAddress,
        paymentOption, // Include the selected payment option
        isGuestCheckout: isGuestCheckout && !jwt // Add this flag to indicate guest checkout
      };

      // Only include JWT for logged-in users, not for guest checkout
      if (jwt && !isGuestCheckout) {
        paymentData.jwt = jwt;
      }

      console.log("Final payment data being sent:", {
        orderId: paymentData.orderId,
        paymentMethod: paymentData.paymentMethod,
        paymentOption: paymentData.paymentOption,
        amount: paymentData.amount,
        dueAmount: paymentData.dueAmount,
        isGuestCheckout: paymentData.isGuestCheckout
      });

      // Track Add Payment Info event for Meta Pixel before processing payment
      if (paymentOption === "online" || paymentOption === "bkash") {
        trackAddPaymentInfo({
          paymentMethod: paymentOption === "bkash" ? "bKash" : "Online Payment",
          amount: amount
        });
      }

      console.log("Sending payment data:", paymentData);

      // Send the payment data to the server for ALL payment options
      const response = await dispatch(createPayment(paymentData));

      if (response.error) {
        // Special handling for COD success message that comes as an "error"
        if (response.error.includes("Order confirmed with Cash on Delivery")) {
          // This is actually a success case for COD
          try {
            await dispatch(clearCart());
          } catch (cartError) {
            console.error("Error clearing cart:", cartError);
            // Continue with success message even if cart clearing fails
          }

          // Clear guest cart data if guest checkout
          if (isGuestCheckout) {
            localStorage.removeItem('guestCart');
            localStorage.removeItem('guestAddress');
            localStorage.removeItem('guestOrderData');
            localStorage.removeItem('guestCartItems');
          }

          // Redirect to order confirmation page
          window.location.href = `/order-confirmation?order_id=${orderData._id}&payment_type=cod`;
          return; // Exit early after successful handling
        }

        // For actual errors, show a more descriptive message
        let errorMessage = response.error;
        
        // Map common errors to more user-friendly messages
        if (errorMessage.includes("phone number")) {
          errorMessage = "Please provide a valid phone number.";
        } else if (errorMessage.includes("Payment gateway")) {
          errorMessage = "We're having trouble connecting to our payment processor. Please try again later.";
        } else if (errorMessage.includes("Server configuration")) {
          errorMessage = "There's a technical issue on our end. Please try again later or contact support.";
        } else if (errorMessage.includes("Failed to create payment")) {
          errorMessage = "We couldn't process your payment. Please try again or use a different payment method.";
        }
        
        // Throw with the mapped error message
        throw new Error(errorMessage);
      }

      // Check for paymentUrl in the response data structure
      const paymentUrl =
        response?.paymentUrl ||
        response?.payload?.paymentUrl ||
        response?.data?.paymentUrl;

      if (paymentUrl && paymentOption === "online") {
        window.location.href = paymentUrl;
      } else if (paymentUrl && paymentOption === "bkash") {
        window.location.href = paymentUrl;
      } else if (paymentOption === "cod") {
        // For COD option, after processing payment for delivery charge
        try {
          await dispatch(clearCart());
        } catch (cartError) {
          console.error("Error clearing cart:", cartError);
          // Continue with success message even if cart clearing fails
        }

        // Clear guest cart data if guest checkout
        if (isGuestCheckout) {
          localStorage.removeItem('guestCart');
          localStorage.removeItem('guestAddress');
          localStorage.removeItem('guestOrderData');
          localStorage.removeItem('guestCartItems');
        }

        // Redirect to order confirmation page instead of showing alert
        window.location.href = `/order-confirmation?order_id=${orderData._id}&payment_type=cod`;
      } else if (paymentOption === "outlet") {
        // For outlet pickup - clear cart after successful order
        try {
          await dispatch(clearCart());
        } catch (cartError) {
          console.error("Error clearing cart:", cartError);
          // Continue with success message even if cart clearing fails
        }

        // Clear guest cart data if guest checkout
        if (isGuestCheckout) {
          localStorage.removeItem('guestCart');
          localStorage.removeItem('guestAddress');
          localStorage.removeItem('guestOrderData');
          localStorage.removeItem('guestCartItems');
        }

        // Redirect to order confirmation page instead of showing alert
        window.location.href = `/order-confirmation?order_id=${orderData._id}&payment_type=outlet&redirect=/account/order`;
      } else {
        console.error("Payment response structure:", response);
        throw new Error(
          "Payment URL not received. Please try again or contact support.",
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      setFormError(error.message || "Failed to process payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentUrl("");
  };

  const handleCloseOutletPaymentModal = () => {
    setShowOutletPaymentModal(false);
  };

  const handleOutletPaymentSelection = async (type) => {
    setOutletPaymentType(type);
    setShowOutletPaymentModal(false);
    
    try {
      setIsSubmitting(true);
      setFormError('');
      
      // Track Add Payment Info event for Meta Pixel
      trackAddPaymentInfo({
        paymentMethod: type === 'online' ? 'Outlet Online Payment' : 'Outlet Cash Payment',
        amount: order.order?.totalDiscountedPrice || 0
      });
      
      // Get customer and shipping information
      const customerInfo = order.order?.user || {};
      const shippingAddress = order.order?.shippingAddress || {};
      
      // Format the payment data
      const paymentData = {
        orderId: order.order._id,
        paymentMethod: type === "online" ? "SSLCommerz" : "Outlet",
        amount: type === "online" ? order.order.totalDiscountedPrice : 0,
        dueAmount: type === "online" ? 0 : order.order.totalDiscountedPrice,
        totalPrice: order.order.totalDiscountedPrice,
        productPrice:
          order.order.totalDiscountedPrice - (order.order.deliveryCharge || 0),
        paymentPhoneNumber: shippingAddress.mobile,
        customerName: customerInfo.name ||
          `${customerInfo.firstName || ""} ${customerInfo.lastName || ""}`.trim(),
        customerEmail: customerInfo.email || "",
        shippingAddress: {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          streetAddress: shippingAddress.streetAddress,
          mobile: shippingAddress.mobile,
          division: shippingAddress.city || shippingAddress.division || "",
          district: shippingAddress.zone || shippingAddress.district || "",
          upazilla: shippingAddress.area || shippingAddress.upazilla || "",
          zipCode: shippingAddress.zipCode || "1212",
        },
        paymentOption: type === "online" ? "online" : "outlet",
        isGuestCheckout: isGuestCheckout && !jwt // Add this flag to indicate guest checkout
      };

      // Only include JWT for logged-in users, not for guest checkout
      if (jwt && !isGuestCheckout) {
        paymentData.jwt = jwt;
      }

      // Special handling for outlet pickup with cash payment
      if (type === "cash") {
        // Send the payment data to the server
        const response = await dispatch(createPayment(paymentData));

        // Special handling for outlet pickup confirmation message
        if (response.error) {
          // If this is the success message for outlet pickup, treat it as success
          if (response.error.includes("Order confirmed for outlet pickup")) {
            console.log("Outlet pickup order confirmed successfully");

            // Successfully processed - clear cart and redirect
            try {
              await dispatch(clearCart());
            } catch (cartError) {
              console.error("Error clearing cart:", cartError);
              // Continue with success flow even if cart clearing fails
            }

            // Redirect to order confirmation page
            window.location.href = `/order-confirmation?order_id=${order.order._id}&payment_type=outlet&redirect=/account/order`;
            return; // Exit the function early after redirect
          }

          // If it's a real error, throw it
          throw new Error(response.error);
        }

        return; // Exit the function early after handling cash payment
      }

      // For online payment, proceed normally
      const response = await dispatch(createPayment(paymentData));

      if (response.error) {
        throw new Error(response.error);
      }

      if (type === "online") {
        // Extract payment URL
        const paymentUrl =
          response?.paymentUrl ||
          response?.payload?.paymentUrl ||
          response?.data?.paymentUrl;

        if (paymentUrl) {
          window.location.href = paymentUrl;
        } else {
          throw new Error(
            "Payment URL not received. Please try again or contact support.",
          );
        }
      } else {
        // For cash at outlet option
        try {
          await dispatch(clearCart());
        } catch (cartError) {
          console.error("Error clearing cart:", cartError);
        }

        // Redirect to order confirmation page first (like COD option)
        window.location.href = `/order-confirmation?order_id=${order.order._id}&payment_type=outlet&redirect=/account/order`;
      }
    } catch (error) {
      console.error("Payment error:", error);
      setFormError(error.message || "Failed to process payment");
      setIsSubmitting(false);
    }
  };

  // Calculate total savings
  const totalSavings = order.order?.discount || 0;
  const savingsPercentage =
    order.order?.totalPrice > 0
      ? ((totalSavings / order.order?.totalPrice) * 100).toFixed(1)
      : 0;

  // Check if this is a guest checkout
  const selectedAddress = JSON.parse(localStorage.getItem("selectedAddress")) || {};
  const addressIsForGuest = selectedAddress.isGuestCheckout || false;

  // Components for Order Summary and Payment Options
  const OrderSummaryComponent = () => (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: colors.border,
        position: isMobile ? "relative" : "sticky",
        top: 20,
        mb: isMobile ? 3 : 0,
      }}
    >
      <Box
        sx={{
          bgcolor: colors.primary,
          color: colors.white,
          py: 2,
          px: 3,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Order Summary
        </Typography>
      </Box>

      <CardContent sx={{ p: 3, bgcolor: colors.light }}>
        {order.order && <PriceDetailsPanel {...getFormattedOrderData()} />}

        {paymentOption === "cod" && (
          <Card
            variant="outlined"
            sx={{
              mt: 3,
              mb: 2,
              borderRadius: 2,
              bgcolor: colors.white,
              borderColor: colors.border,
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: colors.primary, mb: 1 }}
              >
                Cash on Delivery Breakdown
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 0.5,
                }}
              >
                <Typography variant="body2" sx={{ color: colors.lightText }}>
                  Pay Upon Delivery:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: colors.primary }}
                >
                  Tk.{" "}
                  {pureProductPrice -
                    (order.order?.productDiscount || 0) -
                    (order.order?.promoCodeDiscount || 0) +
                    (order.order?.deliveryCharge || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {paymentOption === "outlet" && (
          <Card
            variant="outlined"
            sx={{
              mt: 2,
              mb: 2,
              borderRadius: 2,
              bgcolor: colors.white,
              borderColor: colors.border,
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: colors.primary, mb: 1 }}
              >
                Outlet Pickup Information
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" sx={{ color: colors.lightText }}>
                  Location:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: colors.primary }}
                >
                  147/C, Green Road, Dhaka-1205, Bangladesh
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 0.5,
                }}
              >
                <Typography variant="body2" sx={{ color: colors.lightText }}>
                  Pay at Pickup:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: colors.primary }}
                >
                  Tk. {order.order?.totalDiscountedPrice}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        <Card
          variant="outlined"
          sx={{
            borderRadius: 2,
            bgcolor: "rgba(105, 175, 90, 0.1)",
            borderColor: colors.secondary,
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Box sx={{ display: "flex", alignItems: "flex-start" }}>
              <CheckCircleIcon
                sx={{ color: colors.secondary, mr: 1.5, fontSize: 20, mt: 0.3 }}
              />
              <Typography variant="body2" sx={{ color: colors.primary }}>
                {paymentOption === "online"
                  ? "Your payment is secure with SSL encryption. Complete your purchase using your preferred payment method."
                  : paymentOption === "bkash"
                    ? "Your payment is secure with bKash's encrypted payment system. Complete your purchase using your bKash mobile wallet."
                    : paymentOption === "cod"
                      ? "Place your order today and easily pay when it arrives for a smooth shopping experience."
                      : "No payment is required now. Simply visit our outlet to pick up and pay for your order."}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );

  const PaymentOptionsComponent = () => (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: colors.border,
        overflow: "visible",
      }}
    >
      <Box
        sx={{
          bgcolor: colors.primary,
          color: colors.white,
          py: 2,
          px: 3,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Payment Options
        </Typography>
        <SecurityIcon />
      </Box>

      <CardContent sx={{ p: 0, bgcolor: colors.light }}>
        <form onSubmit={handlePayment}>
          <Box sx={{ p: 3 }}>
            <RadioGroup
              name="payment-option"
              value={paymentOption}
              onChange={handlePaymentOptionChange}
            >
              {/* Cash on Delivery - First option */}
              <Card
                elevation={0}
                sx={{
                  mb: 2,
                  border: "1px solid",
                  borderColor:
                    paymentOption === "cod" ? colors.primary : colors.border,
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "visible",
                  bgcolor:
                    paymentOption === "cod"
                      ? "rgba(105, 175, 90, 0.1)"
                      : colors.white,
                  "&:hover": {
                    borderColor: colors.secondary,
                    boxShadow: "0 4px 12px rgba(0,80,58,0.15)",
                  },
                }}
              >
                {paymentOption === "cod" && (
                  <Box
                    sx={{
                      position: "absolute",
                      right: 16,
                      top: -12,
                      bgcolor: colors.secondary,
                      color: colors.white,
                      borderRadius: 16,
                      px: 2,
                      py: 0.5,
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      boxShadow: "0 2px 8px rgba(0,80,58,0.1)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    Recommended
                  </Box>
                )}
                <FormControlLabel
                  value="cod"
                  control={
                    <Radio
                      sx={{
                        color: colors.primary,
                        "&.Mui-checked": { color: colors.primary },
                      }}
                    />
                  }
                  sx={{ width: "100%", m: 0, p: 2 }}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                      <LocalShippingIcon
                        sx={{ color: colors.primary, mr: 2 }}
                      />
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, color: colors.primary }}
                        >
                          Cash On Delivery
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: colors.lightText }}
                        >
                          Place your order today and pay when it arrives.
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </Card>

              {/* bKash Payment - Second option */}
              <Card
                elevation={0}
                sx={{
                  mb: 2,
                  border: "1px solid",
                  borderColor:
                    paymentOption === "bkash" ? colors.primary : colors.border,
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  bgcolor:
                    paymentOption === "bkash"
                      ? "rgba(105, 175, 90, 0.1)"
                      : colors.white,
                  "&:hover": {
                    borderColor: colors.secondary,
                    boxShadow: "0 4px 12px rgba(0,80,58,0.15)",
                  },
                }}
              >
                <FormControlLabel
                  value="bkash"
                  control={
                    <Radio
                      sx={{
                        color: colors.primary,
                        "&.Mui-checked": { color: colors.primary },
                      }}
                    />
                  }
                  sx={{ width: "100%", m: 0, p: 2 }}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          bgcolor: "#E2136E",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mr: 2,
                          color: "white",
                          fontWeight: "bold",
                          fontSize: "14px"
                        }}
                      >
                        bK
                      </Box>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, color: colors.primary }}
                        >
                          Pay with bKash
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: colors.lightText }}
                        >
                          Pay securely using bKash mobile wallet
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </Card>

              {/* SSLCommerz Payment - Third option */}
              <Card
                elevation={0}
                sx={{
                  mb: 2,
                  border: "1px solid",
                  borderColor:
                    paymentOption === "online" ? colors.primary : colors.border,
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  bgcolor:
                    paymentOption === "online"
                      ? "rgba(105, 175, 90, 0.1)"
                      : colors.white,
                  "&:hover": {
                    borderColor: colors.secondary,
                    boxShadow: "0 4px 12px rgba(0,80,58,0.15)",
                  },
                }}
              >
                <FormControlLabel
                  value="online"
                  control={
                    <Radio
                      sx={{
                        color: colors.primary,
                        "&.Mui-checked": { color: colors.primary },
                      }}
                    />
                  }
                  sx={{ width: "100%", m: 0, p: 2 }}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                      <CreditCardIcon sx={{ color: colors.primary, mr: 2 }} />
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, color: colors.primary }}
                        >
                          Pay Online
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: colors.lightText }}
                        >
                          Pay full amount securely using SSLCommerz payment
                          gateway
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </Card>

              {/* <Card
                elevation={0}
                sx={{
                  mb: 2,
                  border: '1px solid',
                  borderColor: paymentOption === 'outlet' ? colors.primary : colors.border,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  bgcolor: paymentOption === 'outlet' ? 'rgba(105, 175, 90, 0.1)' : colors.white,
                  '&:hover': {
                    borderColor: colors.secondary,
                    boxShadow: '0 4px 12px rgba(0,80,58,0.15)'
                  }
                }}
              >
                <FormControlLabel
                  value="outlet"
                  control={<Radio sx={{ color: colors.primary, '&.Mui-checked': { color: colors.primary } }} />}
                  sx={{ width: '100%', m: 0, p: 2 }}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                      <StorefrontIcon sx={{ color: colors.primary, mr: 2 }} />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.primary }}>
                          Outlet Pickup
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.lightText }}>
                          Collect your order from our outlet (No payment required now)
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </Card> */}
            </RadioGroup>

            {formError && (
              <Alert
                severity="error"
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  "& .MuiAlert-icon": {
                    alignItems: "center",
                  },
                }}
              >
                {formError}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting}
              sx={{
                mt: 3,
                py: 1.5,
                bgcolor: colors.primary,
                color: colors.white,
                borderRadius: 2,
                "&:hover": { bgcolor: colors.secondary },
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 600,
                "&.Mui-disabled": {
                  bgcolor: "#e0e0e0",
                  color: "#a0a0a0",
                },
              }}
              startIcon={
                isSubmitting ? null : paymentOption === "online" ? (
                  <CreditCardIcon />
                ) : paymentOption === "bkash" ? (
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      bgcolor: "#E2136E",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "10px"
                    }}
                  >
                    bK
                  </Box>
                ) : paymentOption === "cod" ? (
                  <LocalShippingIcon />
                ) : (
                  <StorefrontIcon />
                )
              }
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : paymentOption === "online" ? (
                "Proceed to Payment"
              ) : paymentOption === "bkash" ? (
                "Pay with bKash"
              ) : paymentOption === "cod" ? (
                "Confirm Cash on Delivery Order"
              ) : (
                "Confirm Outlet Pickup"
              )}
            </Button>

            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography
                variant="body2"
                sx={{ color: colors.lightText, fontSize: "0.875rem" }}
              >
                By proceeding, you agree to our terms and conditions
              </Typography>
            </Box>
          </Box>
        </form>
      </CardContent>
    </Card>
  );

  // Add this after the OrderSummaryComponent
  const GuestCheckoutInfoComponent = () => {
    if (!addressIsForGuest) return null;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Alert 
          severity="info" 
          icon={<SecurityIcon />}
          sx={{ 
            mb: 2,
            backgroundColor: 'rgba(0, 80, 58, 0.1)',
            '& .MuiAlert-icon': {
              color: colors.primary
            }
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.primary }}>
            Guest Checkout
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            You&apos;re checking out as a guest. Your order can be tracked using your phone number: 
            <strong> {selectedAddress.phoneNumber || selectedAddress.mobile}</strong>
          </Typography>
          {selectedAddress.email && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Order confirmation will be sent to: <strong>{selectedAddress.email}</strong>
            </Typography>
          )}
        </Alert>
      </Box>
    );
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      {formError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {formError}
        </Alert>
      )}
      
      {/* Guest Checkout Info - Full Width */}
      <GuestCheckoutInfoComponent />
      
      <Grid container spacing={4}>
        {/* Payment Options - Left side on desktop */}
        <Grid item xs={12} md={7} lg={8} order={{ xs: 2, md: 1 }}>
          <PaymentOptionsComponent />
        </Grid>
        
        {/* Order Summary - Right side on desktop */}
        <Grid item xs={12} md={5} lg={4} order={{ xs: 1, md: 2 }}>
          <OrderSummaryComponent />
        </Grid>
      </Grid>

      {/* SSL Commerz Payment Modal */}
      <Dialog
        fullScreen
        open={showPaymentModal}
        onClose={handleClosePaymentModal}
        sx={{
          "& .MuiDialog-paper": {
            bgcolor: colors.white,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 1.5,
            borderBottom: "1px solid",
            borderColor: colors.border,
            bgcolor: colors.primary,
            color: colors.white,
          }}
        >
          <Typography variant="subtitle1" sx={{ pl: 2, fontWeight: 600 }}>
            Payment Gateway
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClosePaymentModal}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
        {paymentUrl ? (
          <iframe
            src={paymentUrl}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            title="SSLCommerz Payment"
            allow="payment"
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              flexDirection: "column",
              gap: 2,
              bgcolor: colors.light,
            }}
          >
            <CircularProgress sx={{ color: colors.primary }} />
            <Typography variant="body1" sx={{ color: colors.primary }}>
              Loading payment window...
            </Typography>
          </Box>
        )}
      </Dialog>

      {/* Outlet Payment Options Modal */}
      <Dialog
        open={showOutletPaymentModal}
        onClose={handleCloseOutletPaymentModal}
        aria-labelledby="outlet-payment-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            maxWidth: "450px",
            width: "100%",
          },
        }}
      >
        <Box
          sx={{
            bgcolor: colors.primary,
            color: colors.white,
            p: 3,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <Typography
            id="outlet-payment-dialog-title"
            variant="h6"
            component="h2"
            sx={{ fontWeight: 600 }}
          >
            Choose Payment Method
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            Select how you would like to pay for your outlet pickup order
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          <Card
            onClick={() => handleOutletPaymentSelection("cash")}
            elevation={0}
            sx={{
              mb: 2,
              border: "1px solid",
              borderColor: colors.border,
              borderRadius: 2,
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: colors.primary,
                bgcolor: "rgba(0, 80, 58, 0.04)",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,80,58,0.1)",
              },
              p: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <StorefrontIcon
                sx={{ color: colors.primary, mr: 2, fontSize: 28 }}
              />
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: colors.primary }}
                >
                  Pay Cash at Outlet
                </Typography>
                <Typography variant="body2" sx={{ color: colors.lightText }}>
                  Pay the full amount when you pick up your order
                </Typography>
              </Box>
            </Box>
          </Card>

          <Card
            onClick={() => handleOutletPaymentSelection("online")}
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: colors.border,
              borderRadius: 2,
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: colors.primary,
                bgcolor: "rgba(0, 80, 58, 0.04)",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,80,58,0.1)",
              },
              p: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CreditCardIcon
                sx={{ color: colors.primary, mr: 2, fontSize: 28 }}
              />
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: colors.primary }}
                >
                  Pay Online
                </Typography>
                <Typography variant="body2" sx={{ color: colors.lightText }}>
                  Complete your payment now with SSL Commerz
                </Typography>
              </Box>
            </Box>
          </Card>

          <Button
            onClick={handleCloseOutletPaymentModal}
            variant="outlined"
            fullWidth
            sx={{
              mt: 2,
              color: colors.primary,
              borderColor: colors.primary,
              "&:hover": {
                borderColor: colors.secondary,
                bgcolor: "rgba(0, 80, 58, 0.04)",
              },
              textTransform: "none",
              borderRadius: 2,
              py: 1,
            }}
          >
            Cancel
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default PaymentForm;
