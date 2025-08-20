import {applyMiddleware, combineReducers, legacy_createStore} from "redux"
import thunk from "redux-thunk";

// Always load critical customer-facing reducers
import authReducer from "./Auth/Reducer";
import customerProductReducer from "./Customers/Product/Reducer";
import cartReducer from "./Customers/Cart/Reducer";
import { orderReducer } from "./Customers/Order/Reducer";
import ReviewReducer from "./Customers/Review/Reducer";
import categoryReducer from "./Admin/Category/Reducer";

// Lazy load admin reducers to reduce initial bundle size
const lazyAdminReducers = {
  adminsProduct: () => import("./Admin/Product/Reducer").then(m => m.default),
  adminsOrder: () => import("./Admin/Orders/Reducer").then(m => m.default),
  adminCustomers: () => import("./Admin/User/Reducer").then(m => m.default),
  dashboard: () => import("./Admin/Dashboard/Reducer").then(m => m.default),
};

// Less commonly used customer reducers can also be lazy loaded
const lazyCustomerReducers = {
  bulkOrderCategory: () => import("./Customers/BulkOrder/Reducer").then(m => m.bulkOrderCategoryReducer),
  tshirtOrders: () => import("./Customers/TshirtOrder/Reducer").then(m => m.default),
};

// Create base reducers that are always needed
const baseReducers = {
    auth: authReducer,
    customersProduct: customerProductReducer,
    cart: cartReducer,
    order: orderReducer,
    review: ReviewReducer,
    category: categoryReducer,
};

// Function to add lazy reducers dynamically
const addLazyReducer = async (store, key, reducerPromise) => {
  const reducer = await reducerPromise();
  store.replaceReducer(combineReducers({
    ...store.getState(),
    [key]: reducer
  }));
};

// Create store with base reducers only initially
let rootReducers = combineReducers(baseReducers);

export const store = legacy_createStore(rootReducers, applyMiddleware(thunk));

// Function to load admin reducers when needed (called when accessing admin routes)
export const loadAdminReducers = async () => {
  const adminReducers = {};
  
  for (const [key, reducerPromise] of Object.entries(lazyAdminReducers)) {
    try {
      adminReducers[key] = await reducerPromise();
    } catch (error) {
      console.warn(`Failed to load admin reducer ${key}:`, error);
      // Provide a default empty reducer as fallback
      adminReducers[key] = (state = {}, action) => state;
    }
  }
  
  // Update store with all reducers
  const allReducers = combineReducers({
    ...baseReducers,
    ...adminReducers,
  });
  
  store.replaceReducer(allReducers);
  return adminReducers;
};

// Function to load specific customer reducers when needed
export const loadCustomerReducers = async () => {
  const customerReducers = {};
  
  for (const [key, reducerPromise] of Object.entries(lazyCustomerReducers)) {
    try {
      customerReducers[key] = await reducerPromise();
    } catch (error) {
      console.warn(`Failed to load customer reducer ${key}:`, error);
      customerReducers[key] = (state = {}, action) => state;
    }
  }
  
  // Update store with customer reducers added
  const allReducers = combineReducers({
    ...baseReducers,
    ...customerReducers,
  });
  
  store.replaceReducer(allReducers);
  return customerReducers;
};