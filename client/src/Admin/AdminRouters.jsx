import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminNavbar from './Navigation/AdminNavbar';
import AdminSidebar from './Navigation/AdminSidebar';
import Dashboard from './pages/Dashboard';
import CreateProduct from './componets/createProduct/CreateProductFrom';
import ProductsTable from './componets/Products/ProductsTable';
import OrdersTable from './componets/Orders/OrdersTable';
import BulkOrderForm from './componets/BulkOrder/BulkOrderForm';
import BulkOrderList from './componets/BulkOrder/BulkOrderList';

const AdminRouters = () => {
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
            <Route path="/bulk-orders/create" element={<BulkOrderForm />} />
            <Route path="/bulk-orders" element={<BulkOrderList />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminRouters; 
