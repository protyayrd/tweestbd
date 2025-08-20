import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableContainer,
  Avatar,
  CardHeader,
  Pagination,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Snackbar,
  Alert,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Edit, Delete, PersonAdd, Refresh, LockReset } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { adminUpdateCustomer, adminDeleteCustomer, adminResetPassword } from '../../../Redux/Auth/Action';

const CustomerManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Dialog states
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Add new state for password reset dialog
  const [openResetPassword, setOpenResetPassword] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [resetPasswordErrors, setResetPasswordErrors] = useState({});

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwt');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/admin/customers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCustomers(response.data);
      
      // Calculate total pages
      setTotalPages(Math.ceil(response.data.length / itemsPerPage));
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError(error.message || "Failed to fetch customers");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handlePaginationChange = (event, value) => {
    setCurrentPage(value);
  };
  
  const handleEditClick = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone || ''
    });
    setOpenEdit(true);
  };
  
  const handleDeleteClick = (customer) => {
    setSelectedCustomer(customer);
    setOpenDelete(true);
  };
  
  const handleAddClick = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: ''
    });
    setOpenAdd(true);
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleEditSubmit = async () => {
    try {
      await dispatch(adminUpdateCustomer(selectedCustomer._id, formData));
      
      // Update local state
      const updatedCustomers = customers.map(customer => 
        customer._id === selectedCustomer._id ? 
        { ...customer, ...formData } : 
        customer
      );
      setCustomers(updatedCustomers);
      
      setOpenEdit(false);
      setSnackbar({
        open: true,
        message: 'Customer updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update customer',
        severity: 'error'
      });
    }
  };
  
  const handleDeleteSubmit = async () => {
    try {
      await dispatch(adminDeleteCustomer(selectedCustomer._id));
      
      // Update local state
      const updatedCustomers = customers.filter(
        customer => customer._id !== selectedCustomer._id
      );
      setCustomers(updatedCustomers);
      
      setOpenDelete(false);
      setSnackbar({
        open: true,
        message: 'Customer deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete customer',
        severity: 'error'
      });
    }
  };
  
  const handleAddSubmit = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/users/admin/customers`,
        { ...formData, role: 'CUSTOMER' },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      setCustomers([...customers, response.data]);
      
      setOpenAdd(false);
      setSnackbar({
        open: true,
        message: 'Customer added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error("Error adding customer:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || 'Failed to add customer',
        severity: 'error'
      });
    }
  };
  
  // Handle reset password
  const handleResetPasswordClick = (customer) => {
    setSelectedCustomer(customer);
    setResetPasswordForm({
      newPassword: '',
      confirmPassword: ''
    });
    setResetPasswordErrors({});
    setOpenResetPassword(true);
  };

  const handleResetPasswordChange = (e) => {
    const { name, value } = e.target;
    setResetPasswordForm({
      ...resetPasswordForm,
      [name]: value
    });
    
    // Clear error on typing
    if (resetPasswordErrors[name]) {
      setResetPasswordErrors({
        ...resetPasswordErrors,
        [name]: ''
      });
    }
  };

  const validateResetPasswordForm = () => {
    const errors = {};
    
    if (!resetPasswordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (resetPasswordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!resetPasswordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm the password';
    } else if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setResetPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResetPasswordSubmit = async () => {
    if (validateResetPasswordForm()) {
      try {
        await dispatch(adminResetPassword(selectedCustomer._id, resetPasswordForm.newPassword));
        
        setOpenResetPassword(false);
        setSnackbar({
          open: true,
          message: 'Password reset successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error("Error resetting password:", error);
        setSnackbar({
          open: true,
          message: error.message || 'Failed to reset password',
          severity: 'error'
        });
      }
    }
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Get current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = customers.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh', color: 'red' }}>
        Error: {error}
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardHeader
          title='Customer Management'
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                startIcon={<Refresh />} 
                onClick={fetchCustomers}
                variant="outlined"
              >
                Refresh
              </Button>
              <Button 
                startIcon={<PersonAdd />} 
                onClick={handleAddClick}
                variant="contained"
                color="primary"
              >
                Add Customer
              </Button>
            </Box>
          }
          sx={{ pt: 2, '& .MuiCardHeader-action': { alignSelf: 'center' } }}
        />
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label='customer management table'>
            <TableHead>
              <TableRow>
                <TableCell>Avatar</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentCustomers.length > 0 ? (
                currentCustomers.map((customer) => (
                  <TableRow hover key={customer._id} sx={{ '&:last-of-type td, &:last-of-type th': { border: 0 } }}>
                    <TableCell>
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 40,
                          height: 40
                        }}
                      >
                        {customer.firstName ? customer.firstName.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                    </TableCell>
                    <TableCell>{`${customer.firstName} ${customer.lastName}`}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      {customer.phone ? customer.phone : <Chip size="small" label="Not Added" variant="outlined" />}
                    </TableCell>
                    <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="Edit Customer">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditClick(customer)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset Password">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleResetPasswordClick(customer)}
                          >
                            <LockReset fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Customer">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(customer)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">No customers found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      
      {customers.length > 0 && (
        <Card className="mt-2 flex justify-center items-center">
          <Pagination
            className="py-5 w-auto"
            size="large"
            count={totalPages}
            page={currentPage}
            color="primary"
            onChange={handlePaginationChange}
          />
        </Card>
      )}
      
      {/* Edit Customer Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                placeholder="017XXXXXXXX"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" color="primary">Save Changes</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Customer Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedCustomer?.firstName} {selectedCustomer?.lastName}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button onClick={handleDeleteSubmit} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Customer Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                placeholder="017XXXXXXXX"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleFormChange}
                required
                helperText="Initial password for the new customer account"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button onClick={handleAddSubmit} variant="contained" color="primary">Add Customer</Button>
        </DialogActions>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={openResetPassword} onClose={() => setOpenResetPassword(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={resetPasswordForm.newPassword}
                onChange={handleResetPasswordChange}
                required
                helperText={resetPasswordErrors.newPassword}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={resetPasswordForm.confirmPassword}
                onChange={handleResetPasswordChange}
                required
                helperText={resetPasswordErrors.confirmPassword}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetPassword(false)}>Cancel</Button>
          <Button onClick={handleResetPasswordSubmit} variant="contained" color="primary">Reset Password</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          action={
            <Button color="inherit" size="small" onClick={handleSnackbarClose}>
              DISMISS
            </Button>
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerManagement; 