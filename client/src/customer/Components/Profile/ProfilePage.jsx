import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../../Redux/Auth/Action';
import {
  Container,
  Grid,
  TextField,
  Button,
  Typography,
  Box,
  Avatar,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Tabs,
  Tab
} from '@mui/material';
import Edit from '@mui/icons-material/Edit';
import Save from '@mui/icons-material/Save';
import Person from '@mui/icons-material/Person';
import ChangePasswordForm from './ChangePasswordForm';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  const [editing, setEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleEdit = () => {
    setEditing(true);
  };
  
  const handleCancel = () => {
    // Reset form to original user data
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
    setEditing(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(updateUserProfile(formData));
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
      setEditing(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update profile',
        severity: 'error'
      });
    }
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5">Please log in to view your profile</Typography>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ 
          mb: 3,
          '& .MuiTab-root': {
            fontWeight: 600,
            fontSize: '0.9rem'
          }
        }}
      >
        <Tab label="Profile Information" />
        <Tab label="Security & Password" />
      </Tabs>
      
      <TabPanel value={tabValue} index={0}>
        <Card elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box 
            sx={{ 
              background: 'linear-gradient(45deg, #212121 30%, #424242 90%)',
              p: 3,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              My Profile
            </Typography>
            {!editing && (
              <Button 
                startIcon={<Edit />} 
                onClick={handleEdit}
                variant="contained"
                color="primary"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } 
                }}
              >
                Edit Profile
              </Button>
            )}
          </Box>
          
          <CardContent sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 3, md: 0 } }}>
                  <Avatar 
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      bgcolor: 'primary.main',
                      mb: 2,
                      fontSize: '3rem'
                    }}
                  >
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : <Person fontSize="large" />}
                  </Avatar>
                  <Typography variant="h6" sx={{ textAlign: 'center', fontWeight: 600 }}>
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={!editing}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={!editing}
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
                        onChange={handleChange}
                        disabled={!editing}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!editing}
                        placeholder="017XXXXXXXX"
                        helperText={editing ? "Bangladesh phone format (e.g., 017XXXXXXXX)" : ""}
                      />
                    </Grid>
                    
                    {editing && (
                      <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          onClick={handleCancel}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          variant="contained" 
                          color="primary"
                          startIcon={<Save />}
                          disabled={isLoading}
                        >
                          Save Changes
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <ChangePasswordForm />
      </TabPanel>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfilePage; 