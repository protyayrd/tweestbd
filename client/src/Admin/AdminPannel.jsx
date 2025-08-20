import * as React from "react";
import {Box,Avatar} from "@mui/material";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import { ThemeProvider } from "@emotion/react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";
import ListItemIcon from "@mui/material/ListItemIcon";
import { customTheme } from "./them/customeThem";
import AdminNavbar from "./Navigation/AdminNavbar";
import Dashboard from "./Views/Admin";
import { Route, Routes, useNavigate } from "react-router-dom";
import DemoAdmin from "./Views/DemoAdmin";
import CreateProductForm from "./componets/createProduct/CreateProductFrom";
import CreateProuductDemo from "./componets/createProduct/CreateProuductDemo";
import CreateProduct from "../customer/Components/Create/CreateProduct";
import "./AdminPannel.css";
import ProductsTable from "./componets/Products/ProductsTable";
import OrdersTable from "./componets/Orders/OrdersTable";
import CustomerManagement from "./componets/customers/CustomerManagement";
import UpdateProductForm from "./componets/updateProduct/UpdateProduct";
import CategoryManagement from "./componets/Categories/CategoryManagement";
import { useDispatch, useSelector } from "react-redux";
import { getUser, verifyAdminAccess } from "../Redux/Auth/Action";
import { loadAdminReducers } from "../Redux/Store";
import AdminErrorBoundary from "./components/ErrorBoundary";
import { useEffect, useState } from "react";
import FeaturedCategories from './componets/Categories/FeaturedCategories';
import ProductDetails from "./componets/Products/ProductDetails";
import PromoCodeList from "./componets/PromoCode/PromoCodeList";
import TshirtOrders from './Views/TshirtOrders';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import SettingsIcon from '@mui/icons-material/Settings';
import JerseyFormSettings from './components/JerseyFormSettings/JerseyFormSettings';
import StraightenIcon from '@mui/icons-material/Straighten';
import SizeGuideManager from './componets/SizeGuides/SizeGuideManager';
import PaymentIcon from '@mui/icons-material/Payment';
import PaymentsPage from './Views/PaymentsPage';
import ReviewsManagement from './componets/Reviews/ReviewsManagement';
import ReviewsIcon from '@mui/icons-material/Reviews';
import ImageIcon from '@mui/icons-material/Image';
import PopupImageManager from './componets/PopupImages/PopupImageManager';
import DescriptionIcon from '@mui/icons-material/Description';
import PredefinedDescriptionManager from './componets/PredefinedDescriptions/PredefinedDescriptionManager';
import { ScrollToTop } from '../components';
import ComboOffersTable from './componets/ComboOffers/ComboOffersTable';
import ComboOfferForm from './componets/ComboOffers/ComboOfferForm';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { CircularProgress, Typography } from '@mui/material';

const drawerWidth = 240;

const menu = [
  {name:"Dashboard",path:"/admin"},
  {name:"Products",path:"/admin/products"},
  {name:"Categories",path:"/admin/categories"},
  {name:"Customers",path:"/admin/customers"},
  {name:"Orders",path:"/admin/orders"},
  {name:"Payments",path:"/admin/payments", icon: <PaymentIcon />},
  {name:"Promo Codes",path:"/admin/promo-codes"},
  {name:"Featured Categories",path:"/admin/featured-categories"},
  {name:"Reviews",path:"/admin/reviews", icon: <ReviewsIcon />},
  {name: "T-shirt Orders", path: "/admin/tshirt-orders", icon: <LocalMallIcon />},
  {name: "Jersey Form Settings", path: "/admin/jersey-form-settings", icon: <SettingsIcon />},
  {name: "Size Guides", path: "/admin/size-guides", icon: <StraightenIcon />},
  {name: "Popup Images", path: "/admin/popup-images", icon: <ImageIcon />},
  {name: "Predefined Descriptions", path: "/admin/predefined-descriptions", icon: <DescriptionIcon />},
  {name: "Combo Offers", path: "/admin/combo-offers", icon: <LocalOfferIcon />},
];

export default function AdminPannel() {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const [sideBarVisible, setSideBarVisible] = React.useState(false);
  const [adminVerified, setAdminVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [verificationError, setVerificationError] = useState(null);
  const navigate=useNavigate();
  const dispatch=useDispatch()
  const {auth}=useSelector(store=>store);

  const jwt = localStorage.getItem("jwt");

  useEffect(() => {
    const verifyAccess = async () => {
      if (!jwt) {
        navigate('/login');
        return;
      }

      try {
        setVerificationLoading(true);
        setVerificationError(null);
        
        // Load admin reducers first to ensure admin state is available
        console.log('Loading admin reducers...');
        await loadAdminReducers();
        console.log('Admin reducers loaded successfully');
        
        // Add a small delay to ensure the app is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify admin access on backend
        const adminVerification = await dispatch(verifyAdminAccess());
        
        if (adminVerification && adminVerification.isAdmin) {
          setAdminVerified(true);
        } else {
          setVerificationError("Admin access denied");
          navigate('/login');
        }
      } catch (error) {
        console.error("Admin verification failed:", error);
        setVerificationError(error.message || "Authentication failed");
        
        // If it's a network error or 401, redirect to login
        if (!error.response || error.response?.status === 401 || error.response?.status === 403) {
          navigate('/login');
        }
      } finally {
        setVerificationLoading(false);
      }
    };

    verifyAccess();
  }, [jwt, dispatch, navigate]);

  // Show loading screen while verifying admin access
  if (verificationLoading) {
    return (
      <ThemeProvider theme={customTheme}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" color="textSecondary">
            Loading admin panel...
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Verifying access and loading components
          </Typography>
          {verificationError && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              Error: {verificationError}
            </Typography>
          )}
        </Box>
      </ThemeProvider>
    );
  }

  // Don't render admin panel if admin access is not verified
  if (!adminVerified) {
    return (
      <ThemeProvider theme={customTheme}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Typography variant="h6" color="error">
            Access Denied
          </Typography>
          <Typography variant="body2" color="textSecondary">
            You don&apos;t have admin privileges or authentication failed.
          </Typography>
          {verificationError && (
            <Typography variant="body2" color="error">
              Error: {verificationError}
            </Typography>
          )}
        </Box>
      </ThemeProvider>
    );
  }

  const drawer = (
    <Box
      sx={{
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        height: "100%"
      }}
    >
      {isLargeScreen && <Toolbar />}
      <List sx={{ flexGrow: 1 }}>
        {menu.map((item, index) => (
          <ListItem key={item.name} disablePadding onClick={()=>navigate(item.path)}>
            <ListItemButton>
              <ListItemIcon>
                {item.icon || (index % 2 === 0 ? <InboxIcon /> : <MailIcon />)}
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const handleSideBarViewInMobile = () => {
    setSideBarVisible(true);
  };

  const handleCloseSideBar = () => {
    setSideBarVisible(false);
  };

  const drawerVariant = isLargeScreen ? "permanent" : "temporary";

  return (
    <ThemeProvider theme={customTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AdminNavbar handleSideBarViewInMobile={handleSideBarViewInMobile} />
        <ScrollToTop />

        <Drawer
          variant={drawerVariant}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: 0,
              ...(drawerVariant === "temporary" && {
                top: 0,
                '& .MuiPaper-root.MuiDrawer-paperAnchorTop.MuiDrawer-paperTemporary': {
                  position: "fixed",
                  left: 0,
                  right: 0,
                  height: "100%",
                  zIndex: (theme) => theme.zIndex.drawer + 2,
                },
              }),
            },
          }}
          open={isLargeScreen || sideBarVisible}
          onClose={handleCloseSideBar}
        >
          {drawer}
        </Drawer>
        <Box 
          component="main" 
          className="adminContainer"
          sx={{ 
            flexGrow: 1,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            mt: { sm: 8 }, // Add margin top for the navbar
            borderLeft: 0
          }}
        >
          <AdminErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />}></Route>
              <Route path="/product/create" element={<CreateProductForm/>}></Route>
              <Route path="/product/update/:productId" element={<UpdateProductForm/>}></Route>
              <Route path="/product/:productId" element={<ProductDetails/>}></Route>
              <Route path="/product/edit/:productId" element={<UpdateProductForm/>}></Route>
              <Route path="/products" element={<ProductsTable/>}></Route>
              <Route path="/categories" element={<CategoryManagement/>}></Route>
              <Route path="/combo-offers" element={<ComboOffersTable/>}></Route>
              <Route path="/combo-offers/create" element={<ComboOfferForm/>}></Route>
              <Route path="/combo-offers/:id/edit" element={<ComboOfferForm/>}></Route>
              <Route path="/orders" element={<OrdersTable/>}></Route>
              <Route path="/customers" element={<CustomerManagement/>}></Route>
              <Route path="/payments" element={<PaymentsPage />}></Route>
              <Route path="/demo" element={<DemoAdmin />}></Route>
              <Route path="/featured-categories" element={<FeaturedCategories />} />
              <Route path="/promo-codes" element={<PromoCodeList />} />
              <Route path="/reviews" element={<ReviewsManagement />} />
              <Route path="/tshirt-orders" element={<TshirtOrders />} />
              <Route path="/jersey-form-settings" element={<JerseyFormSettings />} />
              <Route path="/size-guides" element={<SizeGuideManager />} />
              <Route path="/popup-images" element={<PopupImageManager />} />
              <Route path="/predefined-descriptions" element={<PredefinedDescriptionManager />} />
            </Routes>
          </AdminErrorBoundary>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
