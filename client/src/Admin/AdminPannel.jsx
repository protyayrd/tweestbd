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
import Customers from "./componets/customers/customers";
import UpdateProductForm from "./componets/updateProduct/UpdateProduct";
import CategoryManagement from "./componets/Categories/CategoryManagement";
import { useDispatch, useSelector } from "react-redux";
import { getUser, logout } from "../Redux/Auth/Action";
import { useEffect } from "react";
import { deepPurple } from "@mui/material/colors";
import FeaturedCategories from './componets/Categories/FeaturedCategories';
import ProductDetails from "./componets/Products/ProductDetails";
import PromoCodeList from "./componets/PromoCode/PromoCodeList";

const drawerWidth = 240;

const menu = [
  {name:"Dashboard",path:"/admin"},
  {name:"Products",path:"/admin/products"},
  {name:"Categories",path:"/admin/categories"},
  {name:"Customers",path:"/admin/customers"},
  {name:"Orders",path:"/admin/orders"},
  {name:"Promo Codes",path:"/admin/promo-codes"},
  {name:"Total Earnings",path:"/admin"},
  {name:"Weekly Overview",path:"/admin"},
  {name:"Monthly Overview",path:"/admin"},
  {name:"Add Product",path:"/admin/product/create"},
  {name:"Featured Categories",path:"/admin/featured-categories"},
];

export default function AdminPannel() {
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"));
  const [sideBarVisible, setSideBarVisible] = React.useState(false);
  const navigate=useNavigate();
  const dispatch=useDispatch()
  const {auth}=useSelector(store=>store);

  const handleLogout = () => {
   
    dispatch(logout());
    navigate("/")

  };

  const jwt = localStorage.getItem("jwt");

  useEffect(() => {
    if (jwt) {
      dispatch(getUser(jwt));
    } else {
      navigate('/login');
    }
  }, [jwt]);

  useEffect(() => {
    if (!auth.user || auth.user.role !== 'ADMIN') {
      navigate('/login');
    }
  }, [auth.user]);

  const drawer = (
    <Box
      sx={{
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {isLargeScreen && <Toolbar />}
      <List>
        {menu.map((item, index) => (
          <ListItem key={item.name} disablePadding onClick={()=>navigate(item.path)}>
            <ListItemButton>
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <List sx={{ position: "absolute", bottom: 0, width: "100%" }}>
        <Divider />
       
        <ListItem onClick={handleLogout}  disablePadding >
            <ListItemButton>
            <Avatar
                        className="text-white"
                        onClick={handleLogout}
                       
                        sx={{
                          bgcolor: deepPurple[500],
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        {auth.user?.firstName[0].toUpperCase()}
                      </Avatar>
              <ListItemText className="ml-5" primary={"Logout"} />
            </ListItemButton>
          </ListItem>
        
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
          <Routes>
            <Route path="/" element={<Dashboard />}></Route>
            <Route path="/product/create" element={<CreateProductForm/>}></Route>
            <Route path="/product/update/:productId" element={<UpdateProductForm/>}></Route>
            <Route path="/product/:productId" element={<ProductDetails/>}></Route>
            <Route path="/product/edit/:productId" element={<UpdateProductForm/>}></Route>
            <Route path="/products" element={<ProductsTable/>}></Route>
            <Route path="/categories" element={<CategoryManagement/>}></Route>
            <Route path="/orders" element={<OrdersTable/>}></Route>
            <Route path="/customers" element={<Customers/>}></Route>
            <Route path="/demo" element={<DemoAdmin />}></Route>
            <Route path="/featured-categories" element={<FeaturedCategories />} />
            <Route path="/promo-codes" element={<PromoCodeList />} />
          </Routes>
         
        </Box>
      </Box>
    </ThemeProvider>
  );
}
