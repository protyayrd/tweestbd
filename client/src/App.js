import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import './Styles/imageUtils.css';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, lazy, Suspense, useState } from 'react';
import { PopupDialog, ScrollToTop } from './components';
import { getUser } from './Redux/Auth/Action';
import { trackPageView } from './utils/gtmEvents';



// Implement code splitting with lazy loading
const Navigation = lazy(() => import('./customer/Components/Navbar/Navigation'));
const CustomerRoutes = lazy(() => import('./Routers/CustomerRoutes'));
const AdminRoutes = lazy(() => import('./Routers/AdminRoutes'));
const NotFound = lazy(() => import('./Pages/Notfound'));
const AdminPannel = lazy(() => import('./Admin/AdminPannel'));
const TshirtOrderForm = lazy(() => import('./customer/Components/TshirtOrder/TshirtOrderForm'));
const PaymentResult = lazy(() => import('./customer/Components/TshirtOrder/PaymentResult'));
const SizeGuideManager = lazy(() => import('./Admin/componets/SizeGuides/SizeGuideManager'));

// Loading component for Suspense fallback
const Loading = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100%',
  }}>
    <div style={{
      width: '50px',
      height: '50px',
      border: '5px solid #f3f3f3',
      borderTop: '5px solid #555',
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
// import Routers from './Routers/Routers';



// Auth Provider component to handle initial auth check
const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [authChecked, setAuthChecked] = useState(false);
  const { auth } = useSelector((store) => store);
  
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem("jwt");
        if (token) {
          await dispatch(getUser(token));
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        // Mark auth check as complete regardless of outcome
        setAuthChecked(true);
      }
    };
    
    checkAuthStatus();
  }, [dispatch]);
  
  // Show nothing during initial auth check
  if (!authChecked && auth.isLoading) {
    return null;
  }
  
  return children;
};

const ProtectedAdminRoute = ({ children }) => {
  // Since AdminPannel now handles its own backend authentication verification,
  // we only need to check if there's a JWT token
  const jwt = localStorage.getItem("jwt");
  const location = useLocation();
  
  if (!jwt) {
    // Store the intended destination so we can redirect back after login
    const currentPath = location.pathname + location.search;
    localStorage.setItem('redirectAfterLogin', currentPath);
    return <Navigate to="/login" />;
  }
  
  // Let AdminPannel handle the admin verification on backend
  return children;
};

function App() {
  const location = useLocation();

  // Track page view whenever the route changes
  useEffect(() => {
    trackPageView({
      path: location.pathname,
      title: document.title
    });
  }, [location.pathname]);

  return (
    <div className="">
      <PopupDialog />
      <ScrollToTop />
      
      <AuthProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/*" element={<CustomerRoutes />} />
            <Route
              path="/admin/*"
              element={
                <ProtectedAdminRoute>
                  <Suspense fallback={<Loading />}>
                    <AdminPannel />
                  </Suspense>
                </ProtectedAdminRoute>
              }
            />
            <Route path="/TGBHSIAN" element={<Suspense fallback={<Loading />}><TshirtOrderForm /></Suspense>} />
            <Route path="/payment-success" element={<Suspense fallback={<Loading />}><PaymentResult /></Suspense>} />
            <Route path="/payment-failed" element={<Suspense fallback={<Loading />}><PaymentResult /></Suspense>} />
            <Route path="/payment-cancelled" element={<Suspense fallback={<Loading />}><PaymentResult /></Suspense>} />
            <Route path="/admin/size-guides" element={
              <ProtectedAdminRoute>
                <Suspense fallback={<Loading />}>
                  <SizeGuideManager />
                </Suspense>
              </ProtectedAdminRoute>
            } />
          </Routes>
        </Suspense>
      </AuthProvider>
    </div>
  );
}

export default App;
