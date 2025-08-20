import {
  GET_DASHBOARD_STATS_REQUEST,
  GET_DASHBOARD_STATS_SUCCESS,
  GET_DASHBOARD_STATS_FAILURE
} from './Action';

// Add the new action type
export const CLEAR_DASHBOARD_ERROR = 'CLEAR_DASHBOARD_ERROR';

const initialState = {
  stats: {
    // Order stats
    totalOrdersRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    monthlySales: 0,
    weeklySalesData: [0, 0, 0, 0, 0, 0, 0],
    weeklyRevenueData: [0, 0, 0, 0, 0, 0, 0],
    salesByCategory: [],
    orderRevenueGrowth: 0,
    orderStatusSummary: {},
    
    // Payment stats
    totalPaymentsRevenue: 0,
    totalPayments: 0,
    monthlyPaymentsTotal: 0,
    weeklyPaymentsData: [0, 0, 0, 0, 0, 0, 0],
    paymentRevenueGrowth: 0,
    paymentStatusSummary: {},
    recentPayments: [],
    
    // For backward compatibility
    totalRevenue: 0,
    revenueGrowth: 0
  },
  loading: false,
  error: null
};

const dashboardReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_DASHBOARD_STATS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case GET_DASHBOARD_STATS_SUCCESS:
      return {
        ...state,
        loading: false,
        stats: action.payload,
        error: null
      };
    case GET_DASHBOARD_STATS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case CLEAR_DASHBOARD_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export default dashboardReducer; 