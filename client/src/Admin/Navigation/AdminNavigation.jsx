import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CategoryIcon from '@mui/icons-material/Category';

export const adminNavigationItems = [
  {
    title: "Dashboard",
    path: "/admin",
    icon: <DashboardIcon />,
  },
  {
    title: "Products",
    icon: <InventoryIcon />,
    children: [
      {
        title: "Product List",
        path: "/admin/products"
      },
      {
        title: "Create Product",
        path: "/admin/product/create"
      }
    ]
  },
  {
    title: "Orders",
    icon: <ShoppingBagIcon />,
    path: "/admin/orders"
  },
  {
    title: "Bulk Orders",
    icon: <LocalShippingIcon />,
    children: [
      {
        title: "Categories",
        path: "/admin/bulk-orders/categories"
      },
      {
        title: "Products",
        path: "/admin/bulk-orders/products"
      },
      {
        title: "Create Product",
        path: "/admin/bulk-orders/products/create"
      },
      {
        title: "Custom Requests",
        path: "/admin/bulk-orders/requests"
      }
    ]
  },
]; 
