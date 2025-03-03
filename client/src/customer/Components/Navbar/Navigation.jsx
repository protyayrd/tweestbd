import { Fragment, useEffect, useState, useMemo } from "react";
import { Dialog, Popover, Transition, Combobox } from "@headlessui/react";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Button, Menu, MenuItem, Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { getUser, logout } from "../../../Redux/Auth/Action";
import { getCart } from "../../../Redux/Customers/Cart/Action";
import { getCategories } from "../../../Redux/Admin/Category/Action";
import { findProducts } from "../../../Redux/Customers/Product/Action";
import { API_BASE_URL } from "../../../config/api";
import { LOGO_CONFIG, getLogoStyles } from "../../../config/logo";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { auth, cart } = useSelector((store) => store);
  const categories = useSelector((state) => state.category);
  const productState = useSelector((state) => state.customersProduct);
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const openUserMenu = Boolean(anchorEl);
  const jwt = localStorage.getItem("jwt");
  const location = useLocation();
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [imageLoading, setImageLoading] = useState({});

  // Debug products loading
  useEffect(() => {
    console.log("Current Redux State:", {
      productState,
      products: productState?.products?.content,
      loading: productState?.loading,
      error: productState?.error
    });
  }, [productState]);

  // Fetch products on mount
  useEffect(() => {
    dispatch(findProducts({}));
  }, [dispatch]);

  // Image loading handler
  const handleImageLoad = (productId) => {
    setImageLoading(prev => ({ ...prev, [productId]: false }));
  };

  const handleImageError = (productId) => {
    setImageLoading(prev => ({ ...prev, [productId]: false }));
  };

  // Search function
  const handleSearch = (query) => {
    setSearchQuery(query);
    setIsSearching(true); // Set searching state for mobile
    console.log("Search query:", query);
    
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    const productsList = productState?.products?.content || [];
    console.log("Searching in products:", productsList);
    
    if (productsList.length === 0) {
      console.log("No products available to search");
      return;
    }

    const filtered = productsList.filter((product) => {
      const productTitle = product?.title || '';
      const queryLower = query.toLowerCase();
      const titleLower = productTitle.toLowerCase();
      const matches = titleLower.includes(queryLower);
      if (matches) {
        // Set initial loading state for image
        setImageLoading(prev => ({ ...prev, [product._id]: true }));
      }
      return matches;
    });
    
    console.log("Search results:", filtered);
    setSearchResults(filtered.slice(0, 8));
  };

  // Handle search selection
  const handleSearchSelect = (product) => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setOpen(false); // Close mobile menu when selecting a product
    navigate(`/product/${product._id}`);
  };

  // Search result item component
  const SearchResultItem = ({ product, active }) => (
    <div className="flex items-center space-x-4">
      <div className="relative w-16 h-16 sm:w-14 sm:h-14">
        {imageLoading[product._id] && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <img 
          src={`${API_BASE_URL}${product.colors?.[0]?.images?.[0]}`}
          alt={product.title} 
          className={classNames(
            "w-full h-full object-cover rounded-xl transition-opacity duration-200",
            imageLoading[product._id] ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => handleImageLoad(product._id)}
          onError={() => handleImageError(product._id)}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium line-clamp-1">{product.title}</div>
        <div className="text-xs text-gray-500 mt-0.5">Tk. {product.price}</div>
      </div>
    </div>
  );

  // Auth and cart effect
  useEffect(() => {
    if (jwt) {
      dispatch(getUser(jwt));
      dispatch(getCart(jwt));
    }
    dispatch(getCategories());
  }, [jwt, dispatch]);

  const handleUserClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseUserMenu = (event) => {
    setAnchorEl(null);
  };

  const handleOpen = () => setOpenAuthModal(true);
  const handleClose = () => setOpenAuthModal(false);

  const handleCategoryClick = (categoryId, event, isLevel2) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!isLevel2) {
      navigate(`/products?category=${categoryId}&page=1`);
      setOpen(false);
    }
  };

  useEffect(() => {
    if (auth.user) {
      handleClose();
    }
    if (auth.user?.role !== "ADMIN" && (location.pathname === "/login" || location.pathname === "/register")) {
      navigate(-1);
    }
  }, [auth.user]);

  const handleLogout = () => {
    handleCloseUserMenu();
    dispatch(logout());
  };

  const handleMyOrderClick = () => {
    handleCloseUserMenu();
    navigate("/account/order");
  };

  const navigationStructure = useMemo(() => {
    const level2Categories = categories?.categories?.filter(cat => cat.level === 2) || [];
    const level3Categories = categories?.categories?.filter(cat => cat.level === 3) || [];
    
    return level2Categories.map(l2 => ({
      id: l2._id,
      name: l2.name,
      items: level3Categories
        .filter(l3 => l3.parentCategory?._id === l2._id)
        .map(l3 => ({
          id: l3._id,
          name: l3.name
        }))
    })).filter(category => category.items.length > 0);
  }, [categories]);

  return (
    <div className="bg-white">
      {/* Announcement Bar */}
      <div className="bg-black text-white py-2 px-4">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium tracking-wide">
              Announcement Bar Texts
            </p>
            <div className="hidden sm:flex items-center space-x-6 text-sm">
              <a href="#" className="hover:text-gray-300 transition-colors">Track Order</a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="relative bg-white border-b border-gray-100">
        <nav className="max-w-[1920px] mx-auto">
          <div className="flex items-center h-20 px-4 lg:px-8">
            {/* Left Section - Categories */}
            <div className="w-1/3 flex items-center justify-start">
              <button
                type="button"
                className="lg:hidden p-2 text-gray-400 hover:text-black"
                onClick={() => setOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>

              {/* Desktop Categories */}
              <div className="hidden lg:flex items-center space-x-1">
                {navigationStructure.map((category) => (
                  <Popover key={category.id} className="relative">
                    {({ open: popoverOpen, close }) => (
                      <>
                        <Popover.Button
                          className={classNames(
                            popoverOpen ? 'bg-gray-100' : '',
                            'group px-3 py-2 rounded-full inline-flex items-center text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 transition-all duration-200'
                          )}
                        >
                          {category.name}
                          <ChevronDownIcon
                            className={classNames(
                              popoverOpen ? 'rotate-180' : '',
                              'ml-1 h-4 w-4 text-gray-400 group-hover:text-black transition-all duration-200'
                            )}
                          />
                        </Popover.Button>

                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-200"
                          enterFrom="opacity-0 -translate-y-1"
                          enterTo="opacity-100 translate-y-0"
                          leave="transition ease-in duration-150"
                          leaveFrom="opacity-100 translate-y-0"
                          leaveTo="opacity-0 -translate-y-1"
                        >
                          <Popover.Panel className="absolute left-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                            <div className="relative grid gap-1 p-2 bg-white">
                              {category.items.map((item) => (
                                <button
                                  key={item.id}
                                  className="flex items-center rounded-xl px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 w-full text-left"
                                  onClick={(e) => {
                                    handleCategoryClick(item.id, e, false);
                                    close();
                                  }}
                                >
                                  {item.name}
                                </button>
                              ))}
                            </div>
                          </Popover.Panel>
                        </Transition>
                      </>
                    )}
                  </Popover>
                ))}
              </div>
            </div>

            {/* Center Section - Logo */}
            <div className="w-1/3 flex justify-center">
              <Link to="/" className="flex items-center justify-center">
                <Box
                  component="img"
                  src={LOGO_CONFIG.MAIN_LOGO}
                  alt={LOGO_CONFIG.ALT_TEXT}
                  sx={getLogoStyles('default')}
                />
              </Link>
            </div>

            {/* Right Section - Search, User & Cart */}
            <div className="w-1/3 flex items-center justify-end space-x-4">
              {/* Search */}
              <div className="relative">
                <Combobox onChange={handleSearchSelect}>
                  <div className="relative">
                    <button 
                      className="lg:hidden p-2 text-gray-400 hover:text-black"
                      onClick={() => setOpen(true)}
                    >
                      <MagnifyingGlassIcon className="h-6 w-6" />
                    </button>
                    <div className="hidden lg:block relative">
                      <Combobox.Input
                        className="w-[250px] bg-gray-50 border-0 rounded-full py-2.5 pl-11 pr-4 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white transition-all duration-200"
                        placeholder="Search by product name..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => setIsSearching(true)}
                        onBlur={() => setTimeout(() => setIsSearching(false), 200)}
                      />
                      <MagnifyingGlassIcon 
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                      />
                    </div>
                    {isSearching && searchQuery.trim() !== "" && (
                      <div className="absolute right-0 mt-2">
                        <Combobox.Options static className="w-[300px] max-h-[60vh] overflow-auto rounded-2xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {searchResults.length === 0 ? (
                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                              No products found
                            </div>
                          ) : (
                            searchResults.map((product) => (
                              <Combobox.Option
                                key={product._id}
                                value={product}
                                className={({ active }) =>
                                  classNames(
                                    'relative cursor-pointer select-none py-2 px-4',
                                    active ? 'bg-gray-50 text-black' : 'text-gray-900'
                                  )
                                }
                              >
                                {({ selected, active }) => (
                                  <SearchResultItem product={product} active={active} />
                                )}
                              </Combobox.Option>
                            ))
                          )}
                        </Combobox.Options>
                      </div>
                    )}
                  </div>
                </Combobox>
              </div>

              {/* User Menu */}
              <div className="hidden sm:block">
                {auth.user ? (
                  <div>
                    <Avatar
                      onClick={handleUserClick}
                      sx={{
                        bgcolor: 'black',
                        color: 'white',
                        cursor: 'pointer',
                        width: 38,
                        height: 38,
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: '0 0 0 2px rgba(0,0,0,0.1)'
                        },
                      }}
                    >
                      {auth.user?.firstName[0].toUpperCase()}
                    </Avatar>
                    <Menu
                      anchorEl={anchorEl}
                      open={openUserMenu}
                      onClose={handleCloseUserMenu}
                      PaperProps={{
                        elevation: 0,
                        sx: {
                          mt: 2,
                          borderRadius: '16px',
                          minWidth: 200,
                          overflow: 'visible',
                          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.08))',
                          '&:before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                          },
                        },
                      }}
                      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-black">
                          {auth.user?.firstName} {auth.user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {auth.user?.email}
                        </p>
                      </div>
                      <MenuItem onClick={handleCloseUserMenu} className="text-sm px-4 py-2.5 hover:bg-gray-50">
                        Profile
                      </MenuItem>
                      <MenuItem onClick={handleMyOrderClick} className="text-sm px-4 py-2.5 hover:bg-gray-50">
                        My Orders
                      </MenuItem>
                      <div className="px-2 py-2 border-t border-gray-100">
                        <MenuItem onClick={handleLogout} className="text-sm rounded-xl px-4 py-2.5 text-red-600 hover:bg-red-50">
                          Logout
                        </MenuItem>
                      </div>
                    </Menu>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate("/login")}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-black hover:bg-gray-900 rounded-full transition-all duration-200"
                  >
                    Sign in
                  </button>
                )}
              </div>

              {/* Cart */}
              <button
                onClick={() => navigate("/cart")}
                className="relative group p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <ShoppingBagIcon className="h-6 w-6 text-gray-700 group-hover:text-black transition-colors duration-200" />
                {cart.cart?.totalItem > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-black text-white text-xs font-medium flex items-center justify-center">
                    {cart.cart?.totalItem}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-md" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-col overflow-y-auto bg-white pb-12 shadow-xl">
                <div className="sticky top-0 z-10 bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
                  <Link to="/" className="flex items-center space-x-3">
                    <Box
                      component="img"
                      src={LOGO_CONFIG.MAIN_LOGO}
                      alt={LOGO_CONFIG.ALT_TEXT}
                      sx={getLogoStyles('small')}
                    />
                  </Link>
                  <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-black"
                    onClick={() => setOpen(false)}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Mobile Search */}
                <div className="px-4 py-4 border-b border-gray-100">
                  <Combobox onChange={handleSearchSelect}>
                    <div className="relative">
                      <Combobox.Input
                        className="w-full bg-gray-50 border-0 rounded-full py-2.5 pl-11 pr-4 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white transition-all duration-200"
                        placeholder="Search by product name..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => setIsSearching(true)}
                      />
                      <MagnifyingGlassIcon 
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                      />
                    </div>
                    {/* Mobile search results */}
                    {isSearching && searchQuery.trim() !== "" && (
                      <div className="fixed inset-x-4 top-[120px] z-50">
                        <Combobox.Options static className="w-full max-h-[60vh] overflow-auto rounded-2xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {searchResults.length === 0 ? (
                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                              No products found
                            </div>
                          ) : (
                            searchResults.map((product) => (
                              <Combobox.Option
                                key={product._id}
                                value={product}
                                className={({ active }) =>
                                  classNames(
                                    'relative cursor-pointer select-none py-2 px-4',
                                    active ? 'bg-gray-50 text-black' : 'text-gray-900'
                                  )
                                }
                              >
                                {({ selected, active }) => (
                                  <SearchResultItem product={product} active={active} />
                                )}
                              </Combobox.Option>
                            ))
                          )}
                        </Combobox.Options>
                      </div>
                    )}
                  </Combobox>
                </div>

                <div className="flex-1 py-4">
                  {navigationStructure.map((category) => (
                    <div key={category.id} className="px-4">
                      <button
                        className="w-full flex items-center justify-between py-2 text-base font-medium text-gray-900"
                        onClick={(e) => handleCategoryClick(category.id, e, true)}
                      >
                        {category.name}
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      </button>
                      <div className="ml-4 space-y-1">
                        {category.items.map((item) => (
                          <button
                            key={item.id}
                            className="w-full text-left py-2 text-sm text-gray-600 hover:text-black"
                            onClick={(e) => handleCategoryClick(item.id, e, false)}
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {auth.user ? (
                  <div className="border-t border-gray-100 px-4 py-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <Avatar
                        sx={{ 
                          bgcolor: 'black',
                          width: 40,
                          height: 40,
                          fontSize: '1rem'
                        }}
                      >
                        {auth.user?.firstName[0].toUpperCase()}
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {auth.user?.firstName} {auth.user?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{auth.user?.email}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <button onClick={handleMyOrderClick} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                        My Orders
                      </button>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-100 px-4 py-6">
                    <button
                      onClick={() => navigate("/login")}
                      className="w-full px-4 py-2.5 text-sm font-medium text-white bg-black hover:bg-gray-900 rounded-full"
                    >
                      Sign in
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}
