import { Fragment, useEffect, useState, useMemo, useRef, useCallback } from "react";
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
  const categoryState = useSelector((state) => {
    return state.category;
  });
  const { categories = [], loading: categoryLoading } = categoryState || {};
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
  const searchResultsRef = useRef(null);

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



  // Debounced search for better performance
  const debouncedSearch = useCallback(
    useMemo(() => {
      const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
      };
      
      return debounce(async (query) => {
        setIsSearching(true);
        
        try {
          if (productState?.products?.content && Array.isArray(productState.products.content)) {
            const filteredProducts = productState.products.content.filter(product =>
              product.title.toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults(filteredProducts);
          } else {
            console.error('No products data available for search');
            // Force a product fetch
            dispatch(findProducts({}));
          }
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    }, [productState, dispatch]),
    [productState, dispatch]
  );

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      debouncedSearch(query);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [debouncedSearch]);

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    if (searchQuery) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  }, [searchQuery, navigate]);

  const handleSearchSelect = useCallback((product) => {
    setSearchQuery('');
    const productUrl = product.slug ? `/product/${product.slug}` : `/product/${product._id}`;
    navigate(productUrl);
  }, [navigate]);

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
  
  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const handleOpen = () => setOpenAuthModal(true);
  const handleClose = () => setOpenAuthModal(false);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    dispatch({ type: "LOGOUT" });
    handleCloseUserMenu();
  };

  const handleLogin = () => {
    handleOpen();
  };

  const handleCategoryClick = (categoryId, event, isLevel2) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!isLevel2) {
      const category = categories?.find(cat => cat._id === categoryId);
              navigate(`/${category?.slug || categoryId}&page=1`);
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

  const handleMyOrderClick = () => {
    handleCloseUserMenu();
    navigate("/account/order");
  };

  const navigationStructure = useMemo(() => {
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return [];
    }

    // Safely access level 2 and level 3 categories
    const level2Categories = Array.isArray(categories) ? categories.filter(cat => cat && cat.level === 2) : [];
    const level3Categories = Array.isArray(categories) ? categories.filter(cat => cat && cat.level === 3) : [];
    

    const structure = level2Categories.map(l2 => ({
      id: l2._id,
      name: l2.name,
      items: level3Categories
        .filter(l3 => l3.parentCategory && l3.parentCategory._id === l2._id)
        .map(l3 => ({
          id: l3._id,
          name: l3.name
        }))
    })).filter(category => category.items && category.items.length > 0);

    return structure;
  }, [categories]);

  return (
    <div className="bg-white">
      {/* Announcement Bar
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
      </div> */}

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
                {categoryLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse bg-gray-200 h-8 w-20 rounded-full"></div>
                    <div className="animate-pulse bg-gray-200 h-8 w-24 rounded-full"></div>
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded-full"></div>
                  </div>
                ) : (
                  navigationStructure && navigationStructure.length > 0 ? (
                    <>
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
                      
                      {/* Virtual Try-On Link */}
                      <Link
                        to="/tryon"
                        className="group px-4 py-2 rounded-full inline-flex items-center text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        <svg 
                          className="w-4 h-4 mr-1.5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0h4a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4m0 0V2" 
                          />
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 8v8m-4-4h8" 
                          />
                        </svg>
                        Try-On
                      </Link>
                    </>
                  ) : null
                )}
              </div>
            </div>

            {/* Center Section - Logo */}
            <div className="w-1/3 flex justify-center">
              <Link to="/" className="flex items-center justify-center">
                <Box
                  component="img"
                  src={LOGO_CONFIG.MAIN_LOGO}
                  srcSet={LOGO_CONFIG.LOGO_SRCSET}
                  sizes={LOGO_CONFIG.LOGO_SIZES}
                  alt={LOGO_CONFIG.ALT_TEXT}
                  sx={getLogoStyles('default')}
                  loading="lazy"
                  decoding="async"
                />
              </Link>
            </div>

            {/* Right Section - Search, User & Cart */}
            <div className="w-1/3 flex items-center justify-end space-x-4">
              {/* Search */}
              <div className="relative z-50">
                <div className="relative">
                  <button 
                    className="lg:hidden p-2 text-gray-400 hover:text-black"
                    onClick={() => setOpen(true)}
                  >
                    <MagnifyingGlassIcon className="h-6 w-6" />
                  </button>
                  <div className="hidden lg:block relative">
                    <input
                      className="w-[250px] bg-gray-50 border-0 rounded-full py-2.5 pl-11 pr-4 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white focus:z-50 transition-all duration-200"
                      placeholder="Search by product name..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => setIsSearching(true)}
                      onBlur={() => setTimeout(() => {
                        if (!searchResultsRef.current || !searchResultsRef.current.contains(document.activeElement)) {
                          setIsSearching(false);
                        }
                      }, 200)}
                    />
                    <MagnifyingGlassIcon 
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                    />
                  </div>
                  
                  {/* Desktop search results */}
                  {isSearching && searchQuery.trim() !== "" && (
                    <div ref={searchResultsRef} className="absolute right-0 mt-2 z-50">
                      <div className="w-[300px] max-h-[60vh] overflow-auto rounded-2xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {searchResults.length === 0 ? (
                          <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            No products found
                          </div>
                        ) : (
                          searchResults.map((product) => (
                            <Link 
                              key={product._id}
                              to={product.slug ? `/p/${product.slug}` : `/product/${product._id}`} 
                              className="block py-2 px-4 hover:bg-gray-50"
                              onClick={() => {
                                setSearchQuery("");
                                setSearchResults([]);
                                setIsSearching(false); 
                              }}
                            >
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
                                    width="64"
                                    height="64"
                                    loading="lazy"
                                    decoding="async"
                                    onLoad={() => handleImageLoad(product._id)}
                                    onError={() => handleImageError(product._id)}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium line-clamp-1">{product.title}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">Tk. {product.price}</div>
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
                      {auth.user?.firstName && auth.user.firstName.length > 0 ? auth.user.firstName[0].toUpperCase() : '?'}
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
                      <MenuItem 
                        onClick={() => {
                          handleCloseUserMenu();
                          navigate("/account/profile");
                        }} 
                        className="text-sm px-4 py-2.5 hover:bg-gray-50"
                      >
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
                    className="px-5 py-2.5 text-sm font-medium text-white bg-black hover:bg-green-900 rounded-full transition-all duration-200"
                  >
                    Sign in
                  </button>
                )}
              </div>

              {/* Cart */}
              <button
                onClick={() => navigate("/cart")}
                className="relative group p-2 hover:bg-green-100 rounded-full transition-all duration-200"
              >
                <ShoppingBagIcon className="h-6 w-6 text-gray-700 group-hover:text-green-900 transition-colors duration-200" />
                {cart.cart?.totalItem > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-900 text-white text-xs font-medium flex items-center justify-center">
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
                      srcSet={LOGO_CONFIG.LOGO_SRCSET}
                      sizes={LOGO_CONFIG.LOGO_SIZES}
                      alt={LOGO_CONFIG.ALT_TEXT}
                      sx={getLogoStyles('small')}
                      loading="lazy"
                      decoding="async"
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
                  <div className="relative">
                    <input
                      className="w-full bg-gray-50 border-0 rounded-full py-2.5 pl-11 pr-4 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white focus:z-50 transition-all duration-200"
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
                      <div className="max-h-[60vh] overflow-auto rounded-2xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                        {searchResults.length === 0 ? (
                          <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                            No products found
                          </div>
                        ) : (
                          searchResults.map((product) => (
                            <Link 
                              key={product._id}
                              to={product.slug ? `/p/${product.slug}` : `/product/${product._id}`}
                              className="block py-2 px-4 hover:bg-gray-50"
                              onClick={() => {
                                setSearchQuery("");
                                setSearchResults([]);
                                setIsSearching(false);
                                setOpen(false);
                              }}
                            >
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
                                    width="64"
                                    height="64"
                                    loading="lazy"
                                    decoding="async"
                                    onLoad={() => handleImageLoad(product._id)}
                                    onError={() => handleImageError(product._id)}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium line-clamp-1">{product.title}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">Tk. {product.price}</div>
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Categories */}
                <div className="flex-1 py-4">
                  {/* Virtual Try-On Link for Mobile */}
                  <div className="px-4 mb-4">
                    <Link
                      to="/tryon"
                      onClick={() => setOpen(false)}
                      className="w-full flex items-center justify-center py-3 px-4 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full transition-all duration-200 shadow-md"
                    >
                      <svg 
                        className="w-5 h-5 mr-2" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0h4a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4m0 0V2" 
                        />
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 8v8m-4-4h8" 
                        />
                      </svg>
                      Virtual Try-On
                    </Link>
                  </div>

                  {categoryLoading ? (
                    <div className="px-4 space-y-4">
                      <div className="animate-pulse bg-gray-200 h-10 w-3/4 rounded"></div>
                      <div className="animate-pulse bg-gray-200 h-10 w-2/3 rounded"></div>
                      <div className="animate-pulse bg-gray-200 h-10 w-3/4 rounded"></div>
                    </div>
                  ) : (
                    navigationStructure && navigationStructure.length > 0 ? (
                      navigationStructure.map((category) => (
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
                      ))
                    ) : null
                  )}
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
                        {auth.user?.firstName && auth.user.firstName.length > 0 ? auth.user.firstName[0].toUpperCase() : '?'}
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {auth.user?.firstName} {auth.user?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{auth.user?.email}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <button 
                        onClick={() => {
                          navigate("/account/profile");
                          setOpen(false);
                        }} 
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        My Profile
                      </button>
                      <button 
                        onClick={() => {
                          navigate("/account/order");
                          setOpen(false);
                        }} 
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        My Orders
                      </button>
                      <button 
                        onClick={() => {
                          handleLogout();
                          setOpen(false);
                        }} 
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
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
