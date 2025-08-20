import React, { useEffect, lazy, Suspense } from "react";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { customerTheme } from "../Admin/them/customeThem";

// Immediate imports for critical components
import Homepage from "../Pages/Homepage";
import Navigation from "../customer/Components/Navbar/Navigation";
import Footer from "../customer/Components/footer/Footer";

// Lazy load heavy components to reduce main bundle size
const ProductDetails = lazy(() => import("../customer/Components/Product/ProductDetails/ProductDetails"));
const Product = lazy(() => import("../customer/Components/Product/Product/Product"));
const Cart = lazy(() => import("../customer/Components/Cart/Cart"));
const Checkout = lazy(() => import("../customer/Components/Checkout/Checkout"));
const Order = lazy(() => import("../customer/Components/orders/Order"));
const OrderDetails = lazy(() => import("../customer/Components/orders/OrderDetails"));
const VirtualTryOn = lazy(() => import("../customer/Components/TryOn/VirtualTryOn"));
const RateProduct = lazy(() => import("../customer/Components/ReviewProduct/RateProduct"));
const CategoryPage = lazy(() => import("../Pages/CategoryPage"));
const CategoryProductPage = lazy(() => import("../Pages/CategoryProductPage"));
const ComingSoonCategory = lazy(() => import('../customer/Components/Category/ComingSoonCategory'));
const LegacyProductRedirect = lazy(() => import('../customer/Components/Product/ProductDetails/LegacyProductRedirect'));

// Lazy load auth components
const LoginPage = lazy(() => import("../Pages/Auth/LoginPage"));
const RegisterPage = lazy(() => import("../Pages/Auth/RegisterPage"));
const GoogleCallback = lazy(() => import("../customer/Components/Auth/GoogleCallback"));
const ProfilePage = lazy(() => import("../customer/Components/Profile/ProfilePage"));

// Lazy load payment components
const PaymentSuccess = lazy(() => import("../customer/Components/Payment/PaymentSuccess"));
const PaymentFailed = lazy(() => import("../customer/Components/Payment/PaymentFailed"));
const PaymentCancelled = lazy(() => import("../customer/Components/Payment/PaymentCancelled"));
const OrderConfirmation = lazy(() => import("../customer/Components/Payment/OrderConfirmation"));

// Lazy load footer page components
const Contact = lazy(() => import("../Pages/FooterPages/Contact"));
const TermsConditions = lazy(() => import("../Pages/FooterPages/TermsConditions"));
const PrivacyPolicy = lazy(() => import("../Pages/FooterPages/PrivacyPolicy"));
const AboutUs = lazy(() => import("../Pages/FooterPages/AboutUs"));
const FAQ = lazy(() => import("../Pages/FooterPages/FAQ"));
const ShippingPolicy = lazy(() => import("../Pages/FooterPages/ShippingPolicy"));
const ReturnExchangePolicy = lazy(() => import("../Pages/FooterPages/ReturnExchangePolicy"));
import { useSelector } from "react-redux";
import { ScrollToTop } from "../components";

// Loading component for Suspense fallback
const PageLoading = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
    width: '100%',
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #69af5a',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }}></div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowGuest = false }) => {
  const { auth } = useSelector((store) => store);
  const location = useLocation();
  
  // Add isLoading check to prevent UI flashing during auth check
  if (auth.isLoading) {
    // Return empty div instead of redirect UI while checking auth
    return <div></div>;
  }

  // Check for guest cart items or guest checkout flag - don't redirect if we have them
  const guestCartItems = localStorage.getItem('guestCartItems');
  const pendingCartItem = sessionStorage.getItem('pendingCartItem');
  const queryParams = new URLSearchParams(location.search);
  const isGuestCheckout = queryParams.get('guest') === 'true';
  
  // If we have guest cart items or the guest flag, allow access
  if (allowGuest && (guestCartItems || pendingCartItem || isGuestCheckout)) {
    return children;
  }

  if (!auth.user) {
    // For payment-related routes, check if there's an active guest checkout
    const isPaymentRoute = location.pathname.includes('/payment/') || location.pathname.includes('/order-confirmation');
    if (isPaymentRoute && (guestCartItems || isGuestCheckout)) {
      return children;
    }
    
    // Preserve returnTo parameter if it exists in the current URL
    const currentParams = new URLSearchParams(location.search);
    const returnTo = currentParams.get('returnTo');
    
    // If returnTo already exists in the URL, use it, otherwise use current path
    const redirectPath = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : 
                                  `/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`;
    
    return <Navigate to={redirectPath} />;
  }

  return children;
};

const CustomerRoutes = () => {
  const location = useLocation();
  const showNavigation = location.pathname !== "*" && 
                        location.pathname !== "/login" && 
                        location.pathname !== "/register";


  return (
    <div>
      <ThemeProvider theme={customerTheme}>
        <ScrollToTop />
        {showNavigation && <Navigation />}
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Suspense fallback={<PageLoading />}><LoginPage /></Suspense>} />
          <Route path="/register" element={<Suspense fallback={<PageLoading />}><RegisterPage /></Suspense>} />
          <Route path="/auth/google/callback" element={<Suspense fallback={<PageLoading />}><GoogleCallback /></Suspense>} />
          <Route path="/" element={<Homepage />} />
          <Route path="/home" element={<Homepage />} />
          <Route path="/about" element={<Suspense fallback={<PageLoading />}><AboutUs /></Suspense>} />
          <Route path="/privacy-policy" element={<Suspense fallback={<PageLoading />}><PrivacyPolicy /></Suspense>} />
          <Route path="/terms-conditions" element={<Suspense fallback={<PageLoading />}><TermsConditions /></Suspense>} />
          <Route path="/contact" element={<Suspense fallback={<PageLoading />}><Contact /></Suspense>} />
          <Route path="/faq" element={<Suspense fallback={<PageLoading />}><FAQ /></Suspense>} />
          <Route path="/shipping-policy" element={<Suspense fallback={<PageLoading />}><ShippingPolicy /></Suspense>} />
          <Route path="/return-exchange-policy" element={<Suspense fallback={<PageLoading />}><ReturnExchangePolicy /></Suspense>} />
          <Route path="/category/:param" element={<Suspense fallback={<PageLoading />}><CategoryPage /></Suspense>} />
          <Route path="/category/coming-soon/:param" element={<Suspense fallback={<PageLoading />}><ComingSoonCategory /></Suspense>} />
          <Route path="/products" element={<Suspense fallback={<PageLoading />}><Product /></Suspense>} />
          <Route path="/:categorySlug" element={<Suspense fallback={<PageLoading />}><CategoryProductPage /></Suspense>} />
          <Route path="/product/:param" element={<Suspense fallback={<PageLoading />}><ProductDetails /></Suspense>} />
          <Route path="/p/:slug" element={<LegacyProductRedirect />} />
          <Route path="/cart" element={<Suspense fallback={<PageLoading />}><Cart /></Suspense>} />
          <Route path="/checkout" element={<Suspense fallback={<PageLoading />}><Checkout /></Suspense>} />
          <Route path="/tryon" element={<Suspense fallback={<PageLoading />}><VirtualTryOn /></Suspense>} />
          
          {/* Payment result pages - make these public too */}
          <Route path="/payment/success" element={<Suspense fallback={<PageLoading />}><PaymentSuccess /></Suspense>} />
          <Route path="/payment/failed" element={<Suspense fallback={<PageLoading />}><PaymentFailed /></Suspense>} />
          <Route path="/payment/cancelled" element={<Suspense fallback={<PageLoading />}><PaymentCancelled /></Suspense>} />
          <Route path="/order-confirmation" element={<Suspense fallback={<PageLoading />}><OrderConfirmation /></Suspense>} />

          {/* Guest Order Tracking - Public routes */}
          <Route path="/order/guest/track/:orderId" element={<Suspense fallback={<PageLoading />}><OrderDetails /></Suspense>} />
          <Route path="/order/:orderId" element={<Suspense fallback={<PageLoading />}><OrderDetails /></Suspense>} />

          {/* Protected Routes */}
          <Route path="/account/profile" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoading />}><ProfilePage /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/account/order" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoading />}><Order /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/account/order/:orderId" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoading />}><OrderDetails /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/account/rate/:productId" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoading />}><RateProduct /></Suspense>
            </ProtectedRoute>
          } />
          
          {/* Catch-all route for unmatched paths */}
          <Route path="*" element={<Homepage />} />
        </Routes>
        {showNavigation && <Footer />}
      </ThemeProvider>
    </div>
  );
};

export default CustomerRoutes;
