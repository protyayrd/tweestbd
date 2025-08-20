import api from "../../../config/api";

// Action Types
export const GET_DASHBOARD_STATS_REQUEST = "GET_DASHBOARD_STATS_REQUEST";
export const GET_DASHBOARD_STATS_SUCCESS = "GET_DASHBOARD_STATS_SUCCESS";
export const GET_DASHBOARD_STATS_FAILURE = "GET_DASHBOARD_STATS_FAILURE";
export const CLEAR_DASHBOARD_ERROR = "CLEAR_DASHBOARD_ERROR";

// Action Creators
export const getDashboardStatsRequest = () => ({
  type: GET_DASHBOARD_STATS_REQUEST
});

export const getDashboardStatsSuccess = (stats) => ({
  type: GET_DASHBOARD_STATS_SUCCESS,
  payload: stats
});

export const getDashboardStatsFailure = (error) => ({
  type: GET_DASHBOARD_STATS_FAILURE,
  payload: error
});

export const clearDashboardError = () => ({
  type: CLEAR_DASHBOARD_ERROR
});

// Thunk Action to Get Dashboard Statistics
export const getDashboardStats = () => async (dispatch) => {
  dispatch(getDashboardStatsRequest());
  try {
    const jwt = localStorage.getItem("jwt");
    
    // Define empty default data
    let orders = [];
    let payments = [];
    let products = [];
    let customers = [];
    
    try {
      // Fetch orders for revenue calculation
      const ordersResponse = await api.get('/api/admin/orders', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      
      // Handle Array or Object response for orders
      orders = Array.isArray(ordersResponse.data) 
        ? ordersResponse.data 
        : (ordersResponse.data?.orders || []);
    } catch (orderError) {
      console.error('Error fetching orders:', orderError.message);
      // Don't throw, continue with other requests
    }
    
    try {
      // Fetch payments data - Use the correct endpoint
      const paymentsResponse = await api.get('/api/payments', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      if (paymentsResponse.data) {
        console.log(
          Object.keys(paymentsResponse.data), 
          paymentsResponse.data.success ? 'success=true' : 'success not true',
          paymentsResponse.data.payments ? `contains ${paymentsResponse.data.payments.length} payments` : 'no payments array'
        );
      }
      
      // Handle payments data structure - specifically handle the success wrapper format
      if (paymentsResponse.data) {
        // Check if it's in the success wrapper format
        if (paymentsResponse.data.success === true && Array.isArray(paymentsResponse.data.payments)) {
          payments = paymentsResponse.data.payments;
        } 
        // Check if it's directly an array
        else if (Array.isArray(paymentsResponse.data)) {
          payments = paymentsResponse.data;
        } 
        // Check for nested payments property
        else if (paymentsResponse.data.payments && Array.isArray(paymentsResponse.data.payments)) {
          payments = paymentsResponse.data.payments;
        } 
        else {
          console.error('Unable to extract payments array from response. Data structure:', 
            JSON.stringify(paymentsResponse.data).substring(0, 300) + '...');
        }
      }
    } catch (paymentError) {
      console.error('Error fetching payments:', paymentError.message);
      // Don't throw, continue with other requests
    }
    
    try {
      // Fetch products
      const productsResponse = await api.get('/api/admin/products', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      
      products = Array.isArray(productsResponse.data) 
        ? productsResponse.data 
        : (productsResponse.data?.products || []);
    } catch (productError) {
      console.error('Error fetching products:', productError.message);
      // Don't throw, continue with other requests
    }
    
    try {
      // Fetch customers
      const customersResponse = await api.get('/api/users/admin/customers', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      
      customers = Array.isArray(customersResponse.data)
        ? customersResponse.data
        : (customersResponse.data?.customers || []);
    } catch (customerError) {
      console.error('Error fetching customers:', customerError.message);
      // Don't throw, continue with other requests
    }
    
    // Payments data is processed later in the code
    // No need for an empty conditional block
    // if (payments.length > 0) {
    // }
    
    // Calculate total revenue from completed payments
    const totalPaymentsRevenue = payments
      .filter(payment => {
        const status = ((payment.status || 
          (payment.paymentDetails && payment.paymentDetails.status) ||
          '').toString().toLowerCase());
        const isCompleted = status === 'completed' || status === 'COMPLETED' || status.includes('complet');
        return isCompleted;
      })
      .reduce((total, payment) => total + (payment.amount || 0), 0);
    
    // Calculate total revenue from orders
    const totalOrdersRevenue = orders.reduce((total, order) => total + (order.totalPrice || 0), 0);
    
    // Calculate monthly sales
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Monthly orders data
    const monthlySales = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    }).length;
    
    // Monthly payments data
    const monthlyPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.createdAt);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });
    
    const monthlyPaymentsTotal = monthlyPayments
      .filter(payment => {
        const status = ((payment.status || 
          (payment.paymentDetails && payment.paymentDetails.status) ||
          '').toString().toLowerCase());
        return status === 'completed' || status === 'COMPLETED' || status.includes('complet');
      })
      .reduce((total, payment) => total + (payment.amount || 0), 0);
    
    // Calculate weekly data for orders
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklySalesData = new Array(7).fill(0);
    const weeklyRevenueData = new Array(7).fill(0);
    
    // Calculate the start of the current week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Group orders by day of the week
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      // Check if order is from current week
      if (orderDate >= startOfWeek) {
        const dayOfWeek = orderDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        weeklySalesData[dayOfWeek] += 1;
        weeklyRevenueData[dayOfWeek] += (order.totalPrice || 0);
      }
    });
    
    // Weekly payments data
    const weeklyPaymentsData = new Array(7).fill(0);
    
    payments.forEach(payment => {
      const paymentDate = new Date(payment.createdAt);
      const status = ((payment.status || 
        (payment.paymentDetails && payment.paymentDetails.status) ||
        '').toString().toLowerCase());
      const isCompleted = status === 'completed' || status === 'COMPLETED' || status.includes('complet');
        
      if (paymentDate >= startOfWeek && isCompleted) {
        const dayOfWeek = paymentDate.getDay();
        weeklyPaymentsData[dayOfWeek] += (payment.amount || 0);
      }
    });
    
    // Calculate sales by category
    const salesByCategory = {};
    orders.forEach(order => {
      (order.orderItems || []).forEach(item => {
        const category = item.product?.category;
        if (category) {
          if (salesByCategory[category]) {
            salesByCategory[category].count += 1;
            salesByCategory[category].revenue += (item.product?.discountedPrice || 0) * (item.quantity || 1);
          } else {
            salesByCategory[category] = {
              count: 1,
              revenue: (item.product?.discountedPrice || 0) * (item.quantity || 1)
            };
          }
        }
      });
    });
    
    // Format category data
    const formattedCategoryData = Object.keys(salesByCategory).map(category => ({
      title: category,
      count: salesByCategory[category].count,
      revenue: salesByCategory[category].revenue.toFixed(2)
    }));
    
    // Sort categories by revenue
    formattedCategoryData.sort((a, b) => b.revenue - a.revenue);
    
    // Calculate growth compared to previous month for orders
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousMonthYear = previousMonth === 11 ? currentYear - 1 : currentYear;
    
    const previousMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === previousMonth && orderDate.getFullYear() === previousMonthYear;
    });
    
    const previousMonthOrdersRevenue = previousMonthOrders.reduce((total, order) => total + (order.totalPrice || 0), 0);
    
    // Calculate growth compared to previous month for payments
    const previousMonthPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.createdAt);
      const status = ((payment.status || 
        (payment.paymentDetails && payment.paymentDetails.status) ||
        '').toString().toLowerCase());
      const isCompleted = status === 'completed' || status === 'COMPLETED' || status.includes('complet');
      
      return paymentDate.getMonth() === previousMonth && 
             paymentDate.getFullYear() === previousMonthYear &&
             isCompleted;
    });
    
    const previousMonthPaymentsRevenue = previousMonthPayments.reduce((total, payment) => total + (payment.amount || 0), 0);
    
    // Calculate growth percentage
    let orderRevenueGrowth = 0;
    if (previousMonthOrdersRevenue > 0) {
      orderRevenueGrowth = ((totalOrdersRevenue - previousMonthOrdersRevenue) / previousMonthOrdersRevenue) * 100;
    }
    
    let paymentRevenueGrowth = 0;
    if (previousMonthPaymentsRevenue > 0) {
      paymentRevenueGrowth = ((totalPaymentsRevenue - previousMonthPaymentsRevenue) / previousMonthPaymentsRevenue) * 100;
    }
    
    // Payment status summary
    const paymentStatusSummary = payments.reduce((acc, payment) => {
      // Normalize the status to handle case differences
      const status = ((payment.status || 
        (payment.paymentDetails && payment.paymentDetails.status) ||
        'unknown').toString().toLowerCase());
      
      const normalizedStatus = status === 'COMPLETED' || status.includes('complet') ? 'completed' : status;
        
      if (!acc[normalizedStatus]) {
        acc[normalizedStatus] = { count: 0, amount: 0 };
      }
      acc[normalizedStatus].count += 1;
      acc[normalizedStatus].amount += (payment.amount || 0);
      return acc;
    }, {});
    
    // Order status summary
    const orderStatusSummary = orders.reduce((acc, order) => {
      const status = (order.orderStatus || 'unknown').toLowerCase();
      if (!acc[status]) {
        acc[status] = { count: 0, amount: 0 };
      }
      acc[status].count += 1;
      acc[status].amount += (order.totalPrice || 0);
      return acc;
    }, {});
    
    // Recent payments
    const recentPayments = [...payments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    
    // Recent orders
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    
    // Prepare stats object
    const stats = {
      // Order stats
      totalOrdersRevenue,
      totalSales: orders.length,
      totalProducts: products.length,
      totalCustomers: customers.length,
      monthlySales,
      weeklySalesData,
      weeklyRevenueData,
      salesByCategory: formattedCategoryData.slice(0, 3), // Top 3 categories
      orderRevenueGrowth: orderRevenueGrowth.toFixed(1),
      orderStatusSummary,
      recentOrders, // Add recent orders for the orders page
      
      // Payment stats
      totalPaymentsRevenue,
      totalPayments: payments.length,
      monthlyPaymentsTotal,
      weeklyPaymentsData,
      paymentRevenueGrowth: paymentRevenueGrowth.toFixed(1),
      paymentStatusSummary,
      recentPayments,
      payments, // Include all payments for the payments page
      
      // For backward compatibility
      totalRevenue: totalOrdersRevenue,
      revenueGrowth: orderRevenueGrowth.toFixed(1)
    };
    
    dispatch(getDashboardStatsSuccess(stats));
    return stats;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    
    // Create empty default stats
    const emptyStats = {
      totalOrdersRevenue: 0,
      totalSales: 0,
      totalProducts: 0,
      totalCustomers: 0,
      monthlySales: 0,
      weeklySalesData: [0, 0, 0, 0, 0, 0, 0],
      weeklyRevenueData: [0, 0, 0, 0, 0, 0, 0],
      salesByCategory: [],
      orderRevenueGrowth: '0',
      orderStatusSummary: {},
      recentOrders: [],
      totalPaymentsRevenue: 0,
      totalPayments: 0,
      monthlyPaymentsTotal: 0, 
      weeklyPaymentsData: [0, 0, 0, 0, 0, 0, 0],
      paymentRevenueGrowth: '0',
      paymentStatusSummary: {},
      recentPayments: [],
      payments: [],
      totalRevenue: 0,
      revenueGrowth: '0'
    };
    
    dispatch(getDashboardStatsFailure(error.message));
    return emptyStats;
  }
}; 