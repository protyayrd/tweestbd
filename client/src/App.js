import { Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import Navigation from './customer/Components/Navbar/Navigation';
import CustomerRoutes from './Routers/CustomerRoutes';
import AdminRoutes from './Routers/AdminRoutes';
import NotFound from './Pages/Notfound';
import AdminPannel from './Admin/AdminPannel';
import { useSelector } from 'react-redux';
// import Routers from './Routers/Routers';

const ProtectedAdminRoute = ({ children }) => {
  const { auth } = useSelector((store) => store);
  
  if (!auth.user) {
    return <Navigate to="/login" />;
  }
  
  if (auth.user.role !== "ADMIN") {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <div className="">
      
      <Routes>
        <Route path="/*" element={<CustomerRoutes />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedAdminRoute>
              <AdminPannel />
            </ProtectedAdminRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
