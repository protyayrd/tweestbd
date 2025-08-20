import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CategoryIcon from '@mui/icons-material/Category';
import SettingsIcon from '@mui/icons-material/Settings';
import ShirtIcon from '@mui/icons-material/Checkroom';
import StraightenIcon from '@mui/icons-material/Straighten';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PaymentIcon from '@mui/icons-material/Payment';
import ReviewsIcon from '@mui/icons-material/Reviews';
import StarIcon from '@mui/icons-material/Star';
import ImageIcon from '@mui/icons-material/Image';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

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
    title: "Payments",
    icon: <PaymentIcon />,
    path: "/admin/payments"
  },
  {
    title: "Customers",
    icon: <PeopleAltIcon />,
    path: "/admin/customers"
  },
  {
    title: "Reviews & Ratings",
    icon: <StarIcon />,
    path: "/admin/reviews"
  },
  {
    title: "Combo Offers",
    icon: <LocalOfferIcon />,
    path: "/admin/combo-offers"
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
  {
    title: "Jersey Orders",
    icon: <ShirtIcon />,
    path: "/admin/tshirt-orders"
  },
  {
    title: "Jersey Form Settings",
    icon: <SettingsIcon />,
    path: "/admin/jersey-form-settings"
  },
  {
    title: "Size Guides",
    icon: <StraightenIcon />,
    path: "/admin/size-guides",
  },
  {
    title: "Popup Images",
    icon: <ImageIcon />,
    path: "/admin/popup-images",
  },
]; 
