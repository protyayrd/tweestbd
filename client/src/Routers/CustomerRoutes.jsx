import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import ProductDetails from "../customer/Components/Product/ProductDetails/ProductDetails";
import Product from "../customer/Components/Product/Product/Product";
import Contact from "../Pages/Contact";
import TearmsCondition from "../Pages/TearmsCondition";
import PrivacyPolicy from "../Pages/PrivacyPolicy";
import About from "../Pages/About";
import Homepage from "../Pages/Homepage";
import Navigation from "../customer/Components/Navbar/Navigation";
import Cart from "../customer/Components/Cart/Cart";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { customerTheme } from "../Admin/them/customeThem";
import Order from "../customer/Components/orders/Order";
import OrderDetails from "../customer/Components/orders/OrderDetails";
import Checkout from "../customer/Components/Checkout/Checkout";
import Footer from "../customer/Components/footer/Footer";
import PaymentSuccess from "../customer/Components/paymentSuccess/PaymentSuccess";
import RateProduct from "../customer/Components/ReviewProduct/RateProduct";
import CategoryPage from "../Pages/CategoryPage";
import LoginPage from "../Pages/Auth/LoginPage";
import RegisterPage from "../Pages/Auth/RegisterPage";
import EdushopCategoryPage from '../Pages/EdushopCategoryPage';

const CustomerRoutes = () => {
  const location = useLocation();
  const showNavigation = location.pathname !== "*" && 
                        location.pathname !== "/login" && 
                        location.pathname !== "/register";

  return (
    <div>
      <ThemeProvider theme={customerTheme}>
        {showNavigation && <Navigation />}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={<Homepage />} />
          <Route path="/home" element={<Homepage />} />
          <Route path="/about" element={<About />} />
          <Route path="/privaciy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-condition" element={<TearmsCondition />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/products" element={<Product />} />
          <Route path="/product/:productId" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/account/order" element={<Order />} />
          <Route path="/account/order/:orderId" element={<OrderDetails />} />
          <Route path="/account/rate/:productId" element={<RateProduct />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/:orderId" element={<PaymentSuccess />} />
          <Route path="/edushop/:categoryId" element={<EdushopCategoryPage />} />
        </Routes>
        {showNavigation && <Footer />}
      </ThemeProvider>
    </div>
  );
};

export default CustomerRoutes;
