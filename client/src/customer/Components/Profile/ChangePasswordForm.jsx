import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { changePassword } from '../../../Redux/Auth/Action';
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  IconButton,
  InputAdornment
} from '@mui/material';
import Save from '@mui/icons-material/Save';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const ChangePasswordForm = () => {
  const dispatch = useDispatch();
  const { isLoading, error, passwordChanged } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  useEffect(() => {
    if (passwordChanged) {
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [passwordChanged]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear specific field error when typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const togglePasswordVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field]
    });
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSuccess(false);
    
    if (validateForm()) {
      try {
        await dispatch(changePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }));
      } catch (error) {
        console.error('Password change error:', error);
      }
    }
  };
  
  return (
    <Card elevation={2} sx={{ mt: 4, borderRadius: 3, overflow: 'hidden' }}>
      <Box 
        sx={{ 
          background: 'linear-gradient(45deg, #212121 30%, #424242 90%)',
          p: 3,
          color: 'white'
        }}
      >
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          Change Password
        </Typography>
      </Box>
      
      <CardContent sx={{ p: 4 }}>
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            onClose={() => setSuccess(false)}
          >
            Password changed successfully!
          </Alert>
        )}
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => dispatch({ type: 'CLEAR_ERROR' })}
          >
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Current Password"
            name="currentPassword"
            type={showPassword.current ? 'text' : 'password'}
            value={formData.currentPassword}
            onChange={handleChange}
            error={!!formErrors.currentPassword}
            helperText={formErrors.currentPassword}
            required
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('current')}
                    edge="end"
                  >
                    {showPassword.current ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <TextField
            fullWidth
            label="New Password"
            name="newPassword"
            type={showPassword.new ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={handleChange}
            error={!!formErrors.newPassword}
            helperText={formErrors.newPassword}
            required
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('new')}
                    edge="end"
                  >
                    {showPassword.new ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <TextField
            fullWidth
            label="Confirm New Password"
            name="confirmPassword"
            type={showPassword.confirm ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!formErrors.confirmPassword}
            helperText={formErrors.confirmPassword}
            required
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('confirm')}
                    edge="end"
                  >
                    {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              startIcon={<Save />}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Change Password'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordForm; 