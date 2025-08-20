import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminNavbar from './Navigation/AdminNavbar';
import AdminSidebar from './Navigation/AdminSidebar';
import Dashboard from './pages/Dashboard';
import CreateProduct from './componets/createProduct/CreateProductFrom';
import ProductsTable from './componets/Products/ProductsTable';
import OrdersTable from './componets/Orders/OrdersTable';
import BulkOrderForm from './componets/BulkOrder/BulkOrderForm';
import BulkOrderList from './componets/BulkOrder/BulkOrderList';
import JerseyFormSettings from './components/JerseyFormSettings/JerseyFormSettings';
import TshirtOrders from './Views/TshirtOrders';
import SizeGuideManager from './componets/SizeGuides/SizeGuideManager';
import CustomerManagement from './componets/customers/CustomerManagement';
import PaymentsPage from './componets/Payments/PaymentsPage';
import ReviewsManagement from './componets/Reviews/ReviewsManagement';
import PopupImageManager from './components/PopupImages/PopupImageManager';
import ComboOffersTable from './componets/ComboOffers/ComboOffersTable';
import ComboOfferForm from './componets/ComboOffers/ComboOfferForm';

const AdminRouters = () => {
  
  useEffect(() => {
  }, []);
  
  return (
    <div className="relative">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <div className="w-[80%] p-5">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/product/create" element={<CreateProduct />} />
            <Route path="/products" element={<ProductsTable />} />
            <Route path="/orders" element={<OrdersTable />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/bulk-orders/create" element={<BulkOrderForm />} />
            <Route path="/bulk-orders" element={<BulkOrderList />} />
            <Route path="/jersey-form-settings" element={<JerseyFormSettings />} />
            <Route path="/tshirt-orders" element={<TshirtOrders />} />
            <Route path="/size-guides" element={<SizeGuideManager />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/reviews" element={<ReviewsManagement />} />
            <Route path="/popup-images" element={<PopupImageManager />} />
            <Route path="/combo-offers" element={<ComboOffersTable />} />
            <Route path="/combo-offers/create" element={<ComboOfferForm />} />
            <Route path="/combo-offers/:id/edit" element={<ComboOfferForm isEdit={true} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminRouters; 
