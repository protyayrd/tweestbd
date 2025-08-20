/**
 * Utility functions for sending events to Google Tag Manager
 * These events are specifically configured for Meta Pixel standard events
 * https://developers.facebook.com/docs/meta-pixel/reference#standard-events
 * 
 * Enhanced to include customer information and additional event tracking
 * All event names follow the official Meta Pixel standard event naming conventions
 */

// Helper to get customer information from localStorage
const getCustomerInfo = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const selectedAddress = JSON.parse(localStorage.getItem('selectedAddress')) || {};
    const guestAddress = JSON.parse(localStorage.getItem('guestAddress')) || {};
    
    // For guest checkout, prioritize guestAddress, otherwise use selectedAddress
    const shippingAddress = Object.keys(guestAddress).length > 0 ? guestAddress : selectedAddress;
    
    // Determine user ID from multiple possible sources
    const userId = user.id || user._id || shippingAddress.userId || shippingAddress.customerId || '';
    
    // Get customer information with comprehensive fallback logic
    const customerFirstName = user.firstName || shippingAddress.firstName || '';
    const customerLastName = user.lastName || shippingAddress.lastName || '';
    
    // Check multiple phone number field variations
    const customerPhone = user.mobile || user.phone || 
                         shippingAddress.mobile || shippingAddress.phoneNumber || 
                         shippingAddress.phone || '';
    
    // Get email from various sources
    const customerEmail = user.email || shippingAddress.email || '';
    
    // If we have first name, last name, or phone from shipping address but no userId,
    // we can create a pseudo-id from these values to track return customers
    const hasSavedAddressInfo = customerFirstName || customerLastName || customerPhone;
    const pseudoId = hasSavedAddressInfo ? 
      `${customerFirstName || ''}-${customerLastName || ''}-${customerPhone || ''}`.replace(/\s+/g, '-') : 
      '';
    
    // Determine if the user appears to be logged in
    // This checks both for user ID and for presence of saved address information
    const isUserLoggedIn = Boolean(userId || (hasSavedAddressInfo && !shippingAddress.isGuestCheckout));
    
    return {
      customerId: userId || (pseudoId ? `address-${pseudoId}` : ''),
      customerFirstName,
      customerLastName,
      customerEmail,
      customerPhone: customerPhone ? customerPhone.replace(/\D/g, '') : '', // Clean phone number for tracking
      customerCity: shippingAddress.city || '',
      customerPostalCode: shippingAddress.zipCode || '',
      customerCountry: 'Bangladesh', // Default as per your site
      isLoggedIn: isUserLoggedIn
    };
  } catch (e) {
    console.error('Error getting customer info for tracking:', e);
    return {
      customerId: '',
      customerFirstName: '',
      customerLastName: '',
      customerEmail: '',
      customerPhone: '',
      customerCity: '',
      customerPostalCode: '',
      customerCountry: 'Bangladesh',
      isLoggedIn: false
    };
  }
};

// Store a map of recent events to prevent duplicates
const recentEvents = new Map();

/**
 * Track when a user abandons the checkout process
 * (Custom event combining InitiateCheckout and tracking abandoned cart)
 * @param {Array} items - The items in the cart
 * @param {Object} cart - Cart information including totals
 * @param {String} stage - The checkout stage where user abandoned (payment, address, etc)
 */
export const trackAbandonedCheckout = (items, cart, stage = 'payment') => {
  // Disabled per GTM cleanup: only specific events are retained
  return;
};

/**
 * Track a page view
 * @param {Object} params - Optional parameters (e.g., { path: location.pathname, title: document.title })
 */
export const trackPageView = (params = {}) => {
  const metaEventName = 'PageView';
  // Use path for deduplication if available, otherwise a general key for PageView
  const eventKey = params.path ? `${metaEventName}_${params.path}` : `${metaEventName}_general`;
  const currentTime = Date.now();

  if (recentEvents.has(eventKey)) {
    const lastSentTime = recentEvents.get(eventKey);
    if (currentTime - lastSentTime < 2000) { // 2 seconds debounce
      console.log(`[Deduplication] Preventing duplicate Meta event: ${metaEventName} for path: ${params.path || 'general'}`);
      return;
    }
  }
  recentEvents.set(eventKey, currentTime);
  setTimeout(() => { recentEvents.delete(eventKey); }, 5000);

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'Page_view',
    metaEventName: metaEventName,
    ...params
  });
};

/**
 * Track when a user views content details
 * @param {Object} product - The product being viewed
 */
export const trackViewContent = (product) => {
  if (!product) return;

  const metaEventName = 'ViewContent';
  const contentIds = [product._id];
  const eventKey = `${metaEventName}_${JSON.stringify(contentIds)}`;
  const currentTime = Date.now();

  if (recentEvents.has(eventKey)) {
    const lastSentTime = recentEvents.get(eventKey);
    if (currentTime - lastSentTime < 2000) { // 2 seconds debounce
      console.log(`[Deduplication] Preventing duplicate Meta event: ${metaEventName} for IDs: ${contentIds.join(',')}`);
      return; // Skip this duplicate event
    }
  }
  recentEvents.set(eventKey, currentTime);
  setTimeout(() => { recentEvents.delete(eventKey); }, 5000); // Cleanup
  
  const productPrice = product.discountedPrice || product.price;
  const customerInfo = getCustomerInfo();
  
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ecommerce: null});
  
  window.dataLayer.push({
    event: 'view_item',
    metaEventName: metaEventName,
    content_ids: contentIds,
    content_type: 'product',
    content_name: product.title,
    value: productPrice,
    currency: 'BDT',
    ecommerce: {
      value: Number(productPrice).toFixed(2),
      currency: 'BDT',
      items: [
        {
          item_name: product.title,
          item_id: product._id,
          price: Number(productPrice).toFixed(2),
          quantity: 1,
          item_category: product.category?.name || 
                         product.categoryName || 
                         (product.categories && product.categories.length > 0 ? product.categories[0].name : '') || 
                         (product.category && typeof product.category === 'string' ? product.category : '') || 
                         'Other',
          item_brand: product.brand || 'Tweest',
          item_variant: product.colors && product.colors.length > 0 ? product.colors[0] : undefined
        }
      ]
    },
    user_data: {
      first_name: customerInfo.customerFirstName || '',
      last_name: customerInfo.customerLastName || '',
      email_address: customerInfo.customerEmail || '',
      phone_number: customerInfo.customerPhone ? customerInfo.customerPhone.replace(/\D/g, '') : '',
      city: customerInfo.customerCity || '',
      country: customerInfo.customerCountry || 'BD',
      postal_code: customerInfo.customerPostalCode || '',
      user_id: customerInfo.customerId || '',
      new_customer: (!customerInfo.customerId || !customerInfo.isLoggedIn) ? 'true' : 'false'
    }
  });
};

/**
 * Track when a user adds an item to cart
 * @param {Object} item - The item being added to cart
 * @param {Number} quantity - Quantity of items
 */
export const trackAddToCart = (item, quantity = 1) => {
  if (!item) return;

  const metaEventName = 'AddToCart';
  const productId = item._id || item.productId;
  const contentIds = [productId];
  const eventKey = `${metaEventName}_${JSON.stringify(contentIds)}`;
  const currentTime = Date.now();

  if (recentEvents.has(eventKey)) {
    const lastSentTime = recentEvents.get(eventKey);
    if (currentTime - lastSentTime < 2000) {
      console.log(`[Deduplication] Preventing duplicate Meta event: ${metaEventName} for ID: ${productId}`);
      return;
    }
  }
  recentEvents.set(eventKey, currentTime);
  setTimeout(() => { recentEvents.delete(eventKey); }, 5000);

  const productPrice = item.discountedPrice || item.price;
  const productName = item.title || item.name;
  const totalValue = productPrice * quantity;
  const customerInfo = getCustomerInfo();
  
  window.dataLayer = window.dataLayer || [];
  
  // Clear previous ecommerce data
  window.dataLayer.push({ecommerce: null});
  
  // Push standard GA4 add_to_cart event
  window.dataLayer.push({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'BDT',
      value: Number(totalValue).toFixed(2),
      items: [
        {
          item_id: productId,
          item_name: productName,
          price: Number(productPrice).toFixed(2),
          quantity: quantity,
          item_category: item.category?.name || 
                        item.categoryName || 
                        (item.categories && item.categories.length > 0 ? item.categories[0].name : '') || 
                        (item.category && typeof item.category === 'string' ? item.category : '') || 
                        (item.product?.category?.name || 
                         item.product?.categoryName || 
                         (item.product?.categories && item.product.categories.length > 0 ? item.product.categories[0].name : '') || 
                         (item.product?.category && typeof item.product.category === 'string' ? item.product.category : '')) || 
                        'Other',
          item_brand: item.brand || 'Tweest',
          item_variant: item.color || (item.colors && item.colors.length > 0 ? item.colors[0] : undefined)
        }
      ]
    },
    user_data: {
      first_name: customerInfo.customerFirstName || '',
      last_name: customerInfo.customerLastName || '',
      email_address: customerInfo.customerEmail || '',
      phone_number: customerInfo.customerPhone ? customerInfo.customerPhone.replace(/\D/g, '') : '',
      city: customerInfo.customerCity || '',
      country: customerInfo.customerCountry || 'BD',
      postal_code: customerInfo.customerPostalCode || '',
      user_id: customerInfo.customerId || '',
      new_customer: (!customerInfo.customerId || !customerInfo.isLoggedIn) ? 'true' : 'false'
    }
  });
  
  // Also push custom Meta Pixel event for compatibility
  // Removed per GTM cleanup
  
  console.log('GTM AddToCart event sent:', { productId, productName, totalValue });
};

/**
 * Track when a user initiates checkout
 * @param {Array} items - The items in the cart
 * @param {Object} cart - Cart information including totals
 */
export const trackInitiateCheckout = (items, cart) => {
  if (!items || !items.length) return;

  const metaEventName = 'InitiateCheckout';
  const contentIds = items.map(item => item.product?._id || item.productId);
  const eventKey = `${metaEventName}_${JSON.stringify(contentIds)}`;
  const currentTime = Date.now();

  if (recentEvents.has(eventKey)) {
    const lastSentTime = recentEvents.get(eventKey);
    if (currentTime - lastSentTime < 2000) {
      console.log(`[Deduplication] Preventing duplicate Meta event: ${metaEventName}`);
      return;
    }
  }
  recentEvents.set(eventKey, currentTime);
  setTimeout(() => { recentEvents.delete(eventKey); }, 5000);
  
  const products = items.map(item => ({
    id: item.product?._id || item.productId,
    name: item.product?.title || item.title,
    price: item.product?.discountedPrice || item.product?.price || item.price,
    brand: item.product?.brand || 'Tweest',
    category: item.product?.category?.name || 
              item.product?.categoryName || 
              item.categoryName || 
              (item.product?.categories && item.product.categories.length > 0 ? item.product.categories[0].name : '') || 
              (item.product?.category && typeof item.product.category === 'string' ? item.product.category : '') || 
              (item.category && typeof item.category === 'string' ? item.category : ''),
    variant: item.color || item.size,
    quantity: item.quantity
  }));
  
  const value = cart?.totalDiscountedPrice || cart?.totalPrice || 0;
  const customerInfo = getCustomerInfo();
  
  window.dataLayer = window.dataLayer || [];
  
  // Clear previous ecommerce data
  window.dataLayer.push({ecommerce: null});
  
  // Push standard GA4 begin_checkout event
  window.dataLayer.push({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'BDT',
      value: Number(value).toFixed(2),
      items: products.map(p => ({
        item_id: p.id,
        item_name: p.name,
        price: Number(p.price).toFixed(2),
        quantity: p.quantity,
        item_category: p.category || 'Other',
        item_brand: p.brand,
        item_variant: p.variant
      }))
    },
    user_data: {
      first_name: customerInfo.customerFirstName || '',
      last_name: customerInfo.customerLastName || '',
      email_address: customerInfo.customerEmail || '',
      phone_number: customerInfo.customerPhone ? customerInfo.customerPhone.replace(/\D/g, '') : '',
      city: customerInfo.customerCity || '',
      country: customerInfo.customerCountry || 'BD',
      postal_code: customerInfo.customerPostalCode || '',
      user_id: customerInfo.customerId || '',
      new_customer: (!customerInfo.customerId || !customerInfo.isLoggedIn) ? 'true' : 'false'
    }
  });
  
  // Also push custom Meta Pixel event for compatibility
  // Removed per GTM cleanup
  
  console.log('GTM InitiateCheckout event sent:', { itemCount: items.length, totalValue: value });
};

/**
 * Track when a purchase is completed
 * @param {Object} order - The completed order
 * @param {String} source - Source of purchase event (normal, payment-success, etc.)
 */
export const trackPurchase = (order, source = 'normal') => {
  if (!order) return;

  const metaEventName = 'Purchase';
  const orderId = order.id || order._id;
  const eventKey = `${metaEventName}_${orderId}`;
  const currentTime = Date.now();

  if (recentEvents.has(eventKey)) {
    const lastSentTime = recentEvents.get(eventKey);
    if (currentTime - lastSentTime < 2000) {
      console.log(`[Deduplication] Preventing duplicate Meta event: ${metaEventName} for order ID: ${orderId}`);
      return;
    }
  }
  recentEvents.set(eventKey, currentTime);
  setTimeout(() => { recentEvents.delete(eventKey); }, 5000);

  const products = order.orderItems?.map(item => ({
    id: item.product?._id || item.productId,
    name: item.product?.title || item.title,
    price: item.discountedPrice || item.price,
    brand: item.product?.brand || 'Tweest',
    category: item.product?.category?.name || 
              item.product?.categoryName || 
              item.categoryName || 
              (item.product?.categories && item.product.categories.length > 0 ? item.product.categories[0].name : '') || 
              (item.product?.category && typeof item.product.category === 'string' ? item.product.category : '') || 
              (item.category && typeof item.category === 'string' ? item.category : ''),
    variant: item.color || item.size,
    quantity: item.quantity
  })) || [];
  
  const customerInfo = getCustomerInfo();
  const value = order.totalDiscountedPrice || order.totalPrice || 0;
  
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ecommerce: null});
  
  // Push standard GA4 purchase event
  window.dataLayer.push({
    event: 'purchase',
    ecommerce: {
      transaction_id: orderId,
      value: Number(value).toFixed(2),
      tax: Number(order.tax || 0).toFixed(2),
      shipping: Number(order.deliveryCharge || 0).toFixed(2),
      currency: 'BDT',
      coupon: order.promoCode || '',
      items: products.map(p => ({
        item_id: p.id,
        item_name: p.name,
        price: Number(p.price).toFixed(2),
        quantity: p.quantity,
        item_category: p.category || 'Other',
        item_brand: p.brand,
        item_variant: p.variant
      }))
    },
    user_data: {
      first_name: customerInfo.customerFirstName || '',
      last_name: customerInfo.customerLastName || '',
      email_address: customerInfo.customerEmail || '',
      phone_number: customerInfo.customerPhone ? customerInfo.customerPhone.replace(/\D/g, '') : '',
      city: customerInfo.customerCity || '',
      country: customerInfo.customerCountry || 'BD',
      postal_code: customerInfo.customerPostalCode || '',
      user_id: customerInfo.customerId || '',
      new_customer: (!customerInfo.customerId || !customerInfo.isLoggedIn) ? 'true' : 'false'
    }
  });
  
  // Also push custom Meta Pixel event for compatibility
  // Removed per GTM cleanup
  
  console.log('GTM Purchase event sent:', { orderId, totalValue: value, itemCount: products.length });
};

/**
 * Track when a payment fails (custom event - not a standard Meta Pixel event)
 * @param {String} errorMessage - The error message
 */
export const trackPaymentFailed = (errorMessage) => {
  // Disabled per GTM cleanup
  return;
};

/**
 * Track when a payment is canceled (custom event - not a standard Meta Pixel event)
 */
export const trackPaymentCancelled = () => {
  // Disabled per GTM cleanup
  return;
};

/**
 * Track when payment information is added
 * @param {Object} paymentData - Payment information data
 */
export const trackAddPaymentInfo = (paymentData = {}) => {
  // Disabled per GTM cleanup
  return;
};

// General GTM event pusher for non-Meta-Pixel specific events, or if other parts of the app still use it.
export const pushToDataLayer = (data) => {
  // Ensure dataLayer exists
  window.dataLayer = window.dataLayer || [];
  
  // Add customer info to all events if not already present
  const enhancedData = {
    user: getCustomerInfo(), // Add customer info by default
    ...data, // Spread incoming data, allowing it to override user if already provided
  };
  
  // Note: This general pushToDataLayer does NOT include the Meta Pixel specific
  // deduplication logic (eventKey, recentEvents check) because that is now
  // handled by the individual track... functions (trackViewContent, trackAddToCart, etc.)
  // for Meta Pixel events. This function is for other GTM events.

  if (enhancedData.event && enhancedData.metaEventName) {
    // This case is likely already handled by specific track... functions
    // which now push directly. However, if pushToDataLayer is called
    // with both 'event' and 'metaEventName', it implies it might be a
    // Meta Pixel event that somehow bypassed the specific trackers.
    // For safety, log it, but proceed with push.
    console.warn('[pushToDataLayer] Called with metaEventName, this event should ideally be handled by a specific track... function:', enhancedData);
    window.dataLayer.push({
      event: 'meta_event', // Standard GTM wrapper for Meta Pixel
      ...enhancedData     // Includes metaEventName and other params
    });
  } else if (enhancedData.event) {
    // For regular GTM events (not specifically Meta Pixel via metaEventName)
    window.dataLayer.push(enhancedData);
  } else {
    // If no 'event' property, just push the data (less common for GTM)
    console.warn("[pushToDataLayer] Called without an 'event' property:", enhancedData);
    window.dataLayer.push(enhancedData);
  }
};

// Debug function to test GTM functionality
export const debugGTM = () => {
  console.log('=== GTM Debug Information ===');
  console.log('dataLayer exists:', typeof window.dataLayer !== 'undefined');
  console.log('dataLayer length:', window.dataLayer ? window.dataLayer.length : 0);
  console.log('Google Tag Manager container ID: GTM-KZR2X9P2');
  
  // Test customer info retrieval
  const customerInfo = getCustomerInfo();
  console.log('=== Customer Info Test ===');
  console.log('Customer info retrieved:', customerInfo);
  console.log('Has first name:', !!customerInfo.customerFirstName);
  console.log('Has last name:', !!customerInfo.customerLastName);
  console.log('Has phone:', !!customerInfo.customerPhone);
  console.log('Has email:', !!customerInfo.customerEmail);
  
  // Test localStorage data
  console.log('=== LocalStorage Data ===');
  try {
    const selectedAddress = JSON.parse(localStorage.getItem('selectedAddress') || '{}');
    const guestAddress = JSON.parse(localStorage.getItem('guestAddress') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('selectedAddress:', selectedAddress);
    console.log('guestAddress:', guestAddress);
    console.log('user:', user);
  } catch (e) {
    console.error('Error reading localStorage:', e);
  }
  
  // Test basic event
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'debug_test',
    test_value: 'GTM is working',
    timestamp: new Date().toISOString(),
    user_data: {
      first_name: customerInfo.customerFirstName || '',
      last_name: customerInfo.customerLastName || '',
      email_address: customerInfo.customerEmail || '',
      phone_number: customerInfo.customerPhone || '',
      user_id: customerInfo.customerId || ''
    }
  });
  
  console.log('Test event pushed to dataLayer with customer info');
  console.log('Latest dataLayer entries:', window.dataLayer.slice(-3));
  
  // Test add_to_cart event with customer data
  window.dataLayer.push({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'BDT',
      value: 100,
      items: [{
        item_id: 'test_product_123',
        item_name: 'Test Product',
        price: 100,
        quantity: 1,
        item_category: 'Test',
        item_brand: 'Tweest'
      }]
    },
    user_data: {
      first_name: customerInfo.customerFirstName || '',
      last_name: customerInfo.customerLastName || '',
      email_address: customerInfo.customerEmail || '',
      phone_number: customerInfo.customerPhone || '',
      user_id: customerInfo.customerId || ''
    }
  });
  
  console.log('Test add_to_cart event pushed with customer data');
  
  // Test add_payment_info event
  trackAddPaymentInfo({
    paymentMethod: 'Test Payment',
    amount: 100
  });
  
  console.log('Test add_payment_info event pushed');
  console.log('=== GTM Debug Completed ===');
  return 'GTM debug completed - check console and GTM preview mode';
};

// Make debug function available globally for testing
if (typeof window !== 'undefined') {
  window.debugGTM = debugGTM;
}
